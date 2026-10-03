// Magic-link sign-in: one file, two handlers.
//
//   POST /auth/magic-link           → generate token, email link
//   GET  /auth/magic-link?token=X   → verify, set session, redirect /dashboard
//
// POST returns the standard `{ ok, data }` envelope (it's an API action).
// GET is a redirect endpoint — it issues a 302 to /dashboard on success
// or /login?error=... on failure. Browsers landing here from an email
// don't want JSON.
//
// Ported from nuxt-boilerplate/server/routes/auth/magic-link.ts.
import type { Request, Response } from 'express'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDb, schema } from '../db'
import { apiError, apiHandler } from '../utils/response'
import { env } from '../utils/env'
import { logger } from '../utils/logger'
import { sendEmail, magicLinkEmail } from '../utils/mailer'
import { generateToken, hashToken } from '../utils/tokens'
import { requireRateLimit } from '../utils/rate-limit'
import { setUserSession } from './session'

const TOKEN_TTL_MIN = 15
const TOKEN_TTL_MS = TOKEN_TTL_MIN * 60 * 1000

const RequestSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
})

export const postMagicLink = apiHandler(async (req: Request) => {
  requireRateLimit(req, { key: 'auth:magic-link' })
  const parsed = RequestSchema.safeParse(req.body)
  if (!parsed.success) {
    throw apiError('VALIDATION_FAILED', 'Invalid email', { issues: parsed.error.issues })
  }
  const { email } = parsed.data

  // Without a DB we can't persist the token; refuse rather than send a
  // link that won't verify. (Demo mode falls under this — the demo
  // session is in-memory, magic-link is real-auth-only.)
  if (!env.DATABASE_URL) {
    throw apiError('INTERNAL', 'Magic link sign-in requires a database. Configure DATABASE_URL or use GitHub OAuth.')
  }

  const token = generateToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS)

  try {
    const db = useDb()
    await db.insert(schema.magicLinkTokens).values({ email, tokenHash, expiresAt })
  }
  catch (e) {
    // Log the technical detail, surface a sanitised message — the raw
    // error.message may contain the SQL + bound values, which we don't
    // want in the client envelope.
    logger.error('auth.magic_link.db_insert_failed', {
      email,
      error: (e as Error).message,
    })
    throw apiError('INTERNAL', 'Could not create sign-in link. The magic_link_tokens table may be missing — run `npm run db:migrate` against DATABASE_URL.')
  }

  const link = `${env.SITE_URL}/auth/magic-link?token=${token}`

  try {
    await sendEmail(magicLinkEmail({ email, link, expiresInMin: TOKEN_TTL_MIN }))
  }
  catch (e) {
    logger.error('auth.magic_link.send_failed', { email, error: (e as Error).message })
    throw apiError('INTERNAL', 'Sign-in link could not be sent. Check the email server (Resend) configuration.')
  }

  logger.info('auth.magic_link.requested', { email })

  return { ok: true, expiresInMin: TOKEN_TTL_MIN }
})

export async function getMagicLink(req: Request, res: Response): Promise<void> {
  const token = req.query['token']
  if (!token || typeof token !== 'string') {
    res.redirect('/login?error=magic-link-missing-token')
    return
  }

  if (!env.DATABASE_URL) {
    res.redirect('/login?error=magic-link-db-required')
    return
  }

  const tokenHash = hashToken(token)

  const db = useDb()
  let row: typeof schema.magicLinkTokens.$inferSelect | undefined
  try {
    const rows = await db
      .select()
      .from(schema.magicLinkTokens)
      .where(eq(schema.magicLinkTokens.tokenHash, tokenHash))
      .limit(1)
    row = rows[0]
  }
  catch (e) {
    // DB unreachable or table missing — redirect rather than show a
    // raw 500 to the user clicking from their email client.
    logger.error('auth.magic_link.lookup_failed', { error: (e as Error).message })
    res.redirect('/login?error=magic-link-failed')
    return
  }

  if (!row) {
    logger.warn('auth.magic_link.invalid_token')
    res.redirect('/login?error=magic-link-invalid')
    return
  }
  if (row.usedAt) {
    logger.warn('auth.magic_link.replay', { email: row.email })
    res.redirect('/login?error=magic-link-used')
    return
  }
  if (row.expiresAt.getTime() < Date.now()) {
    logger.warn('auth.magic_link.expired', { email: row.email })
    res.redirect('/login?error=magic-link-expired')
    return
  }

  // Mark used BEFORE upserting the user, so a crash mid-flow doesn't
  // leave a token reusable.
  await db
    .update(schema.magicLinkTokens)
    .set({ usedAt: new Date() })
    .where(eq(schema.magicLinkTokens.id, row.id))

  // Upsert user by email. Existing GitHub user with same email → we
  // update the row in place (login etc. stay). New magic-link user →
  // we insert with a derived login (email local part).
  const [user] = await db
    .insert(schema.users)
    .values({
      email: row.email,
      login: row.email.split('@')[0] ?? row.email,
      name: row.email.split('@')[0] ?? null,
    })
    .onConflictDoUpdate({
      target: schema.users.email,
      set: { updatedAt: new Date() },
    })
    .returning()

  if (!user) {
    logger.error('auth.magic_link.user_upsert_failed', { email: row.email })
    res.redirect('/login?error=magic-link-failed')
    return
  }

  await setUserSession(req, res, {
    user: {
      id: user.id,
      login: user.login,
      name: user.name ?? user.login,
      email: user.email,
      avatar: user.avatarUrl,
      role: user.role,
    },
    loggedInAt: Date.now(),
  })

  logger.info('auth.magic_link.signin', { userId: user.id, email: user.email })
  res.redirect('/dashboard')
}
