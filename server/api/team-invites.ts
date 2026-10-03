import { Router } from 'express'
import type { Request, Response } from 'express'
import { desc, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { useDb, schema } from '../db/index'
import { ROLES, type Role } from '../db/schema'
import { ApiError, ErrorCode, apiError, apiHandler, ok, type ApiFailure } from '../utils/response'
import { requireRole } from '../utils/guards'
import { env } from '../utils/env'
import { logger } from '../utils/logger'
import { recordAudit } from '../utils/audit'
import { sendEmail, inviteEmail } from '../utils/mailer'
import { generateToken, hashToken } from '../utils/tokens'
import { requireRateLimit } from '../utils/rate-limit'
import { setUserSession } from '../auth/session'
import { getSession, isDemoSession } from './_session'

// Mirrors nuxt-boilerplate/server/api/team/invites/index.ts +
// server/api/team/invites/[param].ts. Mounted at /api/team/invites
// (see server/api/index.ts):
//   GET    /api/team/invites         → { invites } (pending, admin/editor)
//   POST   /api/team/invites         → { invite } + emails the link (admin/editor)
//   GET    /api/team/invites/:param  → token verify { email, role, valid } (public)
//   POST   /api/team/invites/:param  → token accept { accepted, email, role } (session email must match)
//   DELETE /api/team/invites/:param  → numeric id revoke { revoked } (admin/editor)
//
// One router slot, two resources: Nitro can't tell `[id]` from `[token]`
// (same dynamic segment), so both live here and we branch on the param's
// shape — numeric → admin invite by id, base64url token → public invite
// token, anything else → 404.
//
// Token discipline mirrors the magic-link flow: SHA-256 hash persisted,
// raw token only in the emailed /invite/<raw> link, 7-day TTL,
// single-use via acceptedAt.

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

// Sample pending invites for demo sessions and DB-less boots. Emails
// match the roster domain served by /api/team/members in the same mode.
const DEMO_INVITES = [
  { id: 101, email: 'chloe.morgan@acme.com', role: 'editor', invitedBy: 1, expiresAt: '2026-10-05T10:00:00Z', createdAt: '2026-09-28T10:00:00Z' },
  { id: 102, email: 'ryan.brooks@acme.com', role: 'user', invitedBy: 2, expiresAt: '2026-10-03T15:30:00Z', createdAt: '2026-09-26T15:30:00Z' },
]

const InviteBody = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  role: z.enum(ROLES as unknown as [string, ...string[]]),
})

// Invite tokens come from generateToken() (32 random bytes, base64url →
// 43 chars). Accept 32–128 URL-safe chars so a future byteLength change
// keeps working; an all-digit param is always treated as an id.
const ID_RE = /^\d+$/
const TOKEN_RE = /^[\w-]{32,128}$/

export const teamInvitesRouter: Router = Router()

teamInvitesRouter.get('/', apiHandler(async (req) => {
  // Demo sessions have no `users` row, so requireRole's live lookup would
  // reject them once a DB is reachable. Gate on the cookie role instead,
  // serve sample data for GET, and keep writes disabled.
  const authed = await getSession(req)
  if (isDemoSession(authed)) {
    if (!['admin', 'editor'].includes(authed.user.role)) {
      throw apiError('FORBIDDEN', `role '${authed.user.role}' is not permitted`)
    }
    return { invites: DEMO_INVITES }
  }

  await requireRole(req, 'admin', 'editor')

  if (!env.DATABASE_URL) return { invites: DEMO_INVITES }
  try {
    const db = useDb()
    const rows = await db
      .select({
        id: schema.invites.id,
        email: schema.invites.email,
        role: schema.invites.role,
        invitedBy: schema.invites.invitedBy,
        expiresAt: schema.invites.expiresAt,
        createdAt: schema.invites.createdAt,
      })
      .from(schema.invites)
      .where(isNull(schema.invites.acceptedAt))
      .orderBy(desc(schema.invites.createdAt))
    return { invites: rows }
  }
  catch (e) {
    logger.error('team.invites.list_failed', { error: (e as Error).message })
    throw apiError('INTERNAL', 'Could not list invites. The invites table may be missing — run `npm run db:migrate` against DATABASE_URL.')
  }
}))

teamInvitesRouter.post('/', apiHandler(async (req) => {
  requireRateLimit(req, { key: 'team:invites' })
  const authed = await getSession(req)
  if (isDemoSession(authed)) {
    throw apiError('FORBIDDEN', 'Invites are disabled in demo mode.')
  }

  const session = await requireRole(req, 'admin', 'editor')

  const parsed = InviteBody.safeParse(req.body)
  if (!parsed.success) {
    throw apiError('VALIDATION_FAILED', 'Invalid invite payload', {
      issues: parsed.error.issues,
    })
  }

  if (!env.DATABASE_URL) {
    throw apiError('INTERNAL', 'Team invites require a database. Configure DATABASE_URL to send invites.')
  }

  const token = generateToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS)

  try {
    const db = useDb()

    // Demo id 0 has no row; the column is nullable so null is safe.
    const invitedBy = session.user.id === 0 ? null : session.user.id

    const [invite] = await db
      .insert(schema.invites)
      .values({
        email: parsed.data.email,
        role: parsed.data.role as Role,
        tokenHash,
        invitedBy,
        expiresAt,
      })
      .returning({
        id: schema.invites.id,
        email: schema.invites.email,
        role: schema.invites.role,
        expiresAt: schema.invites.expiresAt,
        createdAt: schema.invites.createdAt,
      })

    const link = `${env.SITE_URL}/invite/${token}`
    const inviterLabel = session.user.name ?? session.user.login ?? undefined
    try {
      await sendEmail(inviteEmail({ email: parsed.data.email, link, role: parsed.data.role, inviter: inviterLabel }))
    }
    catch (e) {
      // Invite row already exists — a mailer outage shouldn't roll it
      // back. Surface the invite so the UI can offer a resend.
      logger.error('team.invite.send_failed', { email: parsed.data.email, error: (e as Error).message })
    }

    await recordAudit({
      userId: invitedBy,
      action: 'team.invite',
      entity: 'invite',
      entityId: invite?.id,
      metadata: { email: parsed.data.email, role: parsed.data.role },
    })
    logger.info('team.invite.created', { email: parsed.data.email, role: parsed.data.role })

    return { invite }
  }
  catch (e) {
    if ((e as { code?: string }).code === '23505') {
      throw apiError('VALIDATION_FAILED', 'An invite is already pending for this email', { field: 'email' })
    }
    // ApiError instances pass through untouched.
    if (e && typeof e === 'object' && 'code' in e && 'status' in e) throw e
    logger.error('team.invite.create_failed', { email: parsed.data.email, error: (e as Error).message })
    throw apiError('INTERNAL', 'Could not create invite. The invites table may be missing — run `npm run db:migrate` against DATABASE_URL.')
  }
}))

// GET /api/team/invites/:param — public verify for token params; numeric
// ids never mutate on GET so a DELETE-only id param 404s with a method
// message (mirrors the Nuxt method guard).
teamInvitesRouter.get('/:param', apiHandler(async (req) => {
  const rawParam = firstParam(req.params['param']) ?? ''

  if (ID_RE.test(rawParam)) {
    throw apiError('NOT_FOUND', `Method GET not supported on /api/team/invites/:id (invite ${rawParam})`)
  }
  if (TOKEN_RE.test(rawParam)) {
    const invite = await lookupInviteToken(rawParam)
    return { email: invite.email, role: invite.role, valid: true }
  }

  throw apiError('NOT_FOUND', 'Invite not found')
}))

// POST /api/team/invites/:param — accept a token invite. Requires a
// session whose email matches the invite; applies the invited role to
// the user row. Numeric ids 404 (revoke is DELETE-only).
//
// NOTE: raw Express handler instead of apiHandler() — this endpoint
// rewrites the sealed session cookie (role patch below), so it owns the
// response end-to-end and sends the shared { ok, data } / { ok, error }
// envelope exactly once (headersSent-guarded, same mapping as apiHandler()
// in server/utils/response.ts). Never call res.json/send/end anywhere
// except the two guarded sends below.
teamInvitesRouter.post('/:param', async (req, res) => {
  try {
    const data = await acceptInviteToken(req, res)
    if (!res.headersSent) res.json(ok(data))
  }
  catch (err: unknown) {
    if (err instanceof ApiError) {
      if (!res.headersSent) {
        res.status(err.status).json({
          ok: false,
          error: {
            code: err.code,
            message: err.message,
            ...(err.details !== undefined ? { details: err.details } : {}),
          },
        } satisfies ApiFailure)
      }
      return
    }
    // Don't leak stack traces to clients — log server-side instead.
    console.error('[api:unhandled]', err)
    if (!res.headersSent) {
      res.status(500).json({
        ok: false,
        error: { code: ErrorCode.INTERNAL, message: 'Internal error' },
      } satisfies ApiFailure)
    }
  }
})

async function acceptInviteToken(req: Request, res: Response): Promise<{ accepted: boolean, email: string, role: string }> {
  const rawParam = firstParam(req.params['param']) ?? ''

  if (!TOKEN_RE.test(rawParam)) {
    if (ID_RE.test(rawParam)) {
      throw apiError('NOT_FOUND', `Method POST not supported on /api/team/invites/:id`)
    }
    throw apiError('NOT_FOUND', 'Invite not found')
  }

  const invite = await lookupInviteToken(rawParam)

  let session
  try {
    session = await getSession(req)
  }
  catch {
    throw apiError('VALIDATION_FAILED', 'signin required — sign in to accept this invite')
  }

  const sessionEmail = (session.user.email ?? '').toLowerCase()
  if (!sessionEmail || sessionEmail !== invite.email.toLowerCase()) {
    throw apiError('VALIDATION_FAILED', `signin required — sign in as ${invite.email} to accept this invite`)
  }

  try {
    const db = useDb()

    // Apply the invited role to the matching user row.
    const updated = await db
      .update(schema.users)
      .set({ role: invite.role, updatedAt: new Date() })
      .where(eq(schema.users.email, invite.email))
      .returning({ id: schema.users.id })

    // Mark single-use BEFORE returning, so a crash mid-flow can't
    // leave the token reusable.
    await db
      .update(schema.invites)
      .set({ acceptedAt: new Date() })
      .where(eq(schema.invites.id, invite.id))

    await recordAudit({
      userId: updated[0]?.id ?? null,
      action: 'team.accept',
      entity: 'invite',
      entityId: invite.id,
      metadata: { email: invite.email, role: invite.role },
    })

    // Patch the sealed session cookie so the UI reflects the new role
    // without forcing a re-login. Cookie rewrite is intentional here
    // (unlike requireRole) — the role genuinely changed. Header-only
    // (no body send), so the envelope send above stays the single response.
    try {
      await setUserSession(req, res, {
        user: { ...session.user, role: invite.role },
        loggedInAt: session.loggedInAt,
        ...(session.demo ? { demo: true as const } : {}),
      })
    }
    catch (e) {
      logger.warn('team.accept.session_patch_failed', { error: (e as Error).message })
    }

    logger.info('team.invite.accepted', { email: invite.email, role: invite.role })
    return { accepted: true, email: invite.email, role: invite.role }
  }
  catch (e) {
    // ApiError instances pass through untouched.
    if (e instanceof ApiError) throw e
    logger.error('team.invite.accept_failed', { email: invite.email, error: (e as Error).message })
    throw apiError('INTERNAL', 'Could not accept invite. Please try again.')
  }
}

// DELETE /api/team/invites/:param — revoke a pending invite by numeric
// id (admin/editor). Only pending rows (acceptedAt IS NULL) can be
// revoked; accepted rows are history and must stay for the audit trail.
teamInvitesRouter.delete('/:param', apiHandler(async (req) => {
  const rawParam = firstParam(req.params['param']) ?? ''

  if (!ID_RE.test(rawParam)) {
    if (TOKEN_RE.test(rawParam)) {
      throw apiError('NOT_FOUND', `Method DELETE not supported on /api/team/invites/:token`)
    }
    throw apiError('NOT_FOUND', 'Invite not found')
  }

  // Check demo before requireRole: demo sessions have no `users` row, so
  // the live role lookup would answer SESSION_INVALID instead.
  const authed = await getSession(req)
  if (isDemoSession(authed)) {
    throw apiError('FORBIDDEN', 'Invites are disabled in demo mode.')
  }

  await requireRole(req, 'admin', 'editor')

  if (!env.DATABASE_URL) {
    throw apiError('INTERNAL', 'Team invites require a database. Configure DATABASE_URL to manage invites.')
  }

  const id = Number(rawParam)
  if (!Number.isInteger(id) || id <= 0) {
    throw apiError('VALIDATION_FAILED', 'Invalid invite id', { field: 'id' })
  }

  try {
    const db = useDb()
    const rows = await db
      .select()
      .from(schema.invites)
      .where(eq(schema.invites.id, id))
      .limit(1)
    const invite = rows[0]
    if (!invite) {
      throw apiError('NOT_FOUND', `Invite ${id} not found`)
    }
    if (invite.acceptedAt) {
      throw apiError('VALIDATION_FAILED', 'Invite was already accepted and cannot be revoked')
    }

    await db.delete(schema.invites).where(eq(schema.invites.id, id))

    await recordAudit({
      action: 'team.revoke',
      entity: 'invite',
      entityId: id,
      metadata: { email: invite.email },
    })
    logger.info('team.invite.revoked', { id, email: invite.email })

    return { revoked: id }
  }
  catch (e) {
    // ApiError instances pass through untouched.
    if (e && typeof e === 'object' && 'code' in e && 'status' in e) throw e
    logger.error('team.invite.revoke_failed', { id, error: (e as Error).message })
    throw apiError('INTERNAL', 'Could not revoke invite. The invites table may be missing — run `npm run db:migrate` against DATABASE_URL.')
  }
}))

async function lookupInviteToken(rawToken: string) {
  if (!env.DATABASE_URL) {
    throw apiError('NOT_FOUND', 'Invite not found')
  }

  const tokenHash = hashToken(rawToken)

  let invite: typeof schema.invites.$inferSelect | undefined
  try {
    const db = useDb()
    const rows = await db
      .select()
      .from(schema.invites)
      .where(eq(schema.invites.tokenHash, tokenHash))
      .limit(1)
    invite = rows[0]
  }
  catch (e) {
    logger.error('team.invite.lookup_failed', { error: (e as Error).message })
    throw apiError('INTERNAL', 'Could not verify invite. The invites table may be missing — run `npm run db:migrate` against DATABASE_URL.')
  }

  if (!invite) {
    throw apiError('NOT_FOUND', 'Invite not found')
  }
  if (invite.acceptedAt) {
    throw apiError('VALIDATION_FAILED', 'This invite has already been accepted')
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    throw apiError('VALIDATION_FAILED', 'This invite has expired — ask your admin for a new one')
  }
  return invite
}

// Express 5 types params as string | string[]; single-segment :param is
// always a string at runtime — narrow once for the matchers.
function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}
