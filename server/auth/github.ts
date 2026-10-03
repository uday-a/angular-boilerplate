// GitHub OAuth via arctic. Two routes (both GET, browser navigations):
//
//   GET /auth/github          → set state cookie, redirect to GitHub
//   GET /auth/github/callback → verify code, upsert user, set session,
//                               302 /dashboard (or /login?error=oauth)
//
// Ported from nuxt-boilerplate/server/routes/auth/github.get.ts
// (defineOAuthGitHubEventHandler with emailRequired: true).
import type { Request, Response } from 'express'
import { GitHub, generateState } from 'arctic'
import { eq } from 'drizzle-orm'
import { useDb, schema } from '../db'
import { ROLES, type Role } from '../db/schema'
import { env, isDevelopment } from '../utils/env'
import { logger } from '../utils/logger'
import { sendEmail, welcomeEmail } from '../utils/mailer'
import { readRequestCookie, setUserSession } from './session'

const STATE_COOKIE = 'ng-oauth-state'
const NEXT_COOKIE = 'ng-oauth-next'

interface GitHubUser {
  id: number
  login: string
  name: string | null
  email: string | null
  avatar_url: string
}

interface GitHubEmail {
  email: string
  primary: boolean
  verified: boolean
}

function githubClient(): GitHub | null {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) return null
  return new GitHub(
    env.GITHUB_CLIENT_ID,
    env.GITHUB_CLIENT_SECRET,
    `${env.SITE_URL}/auth/github/callback`,
  )
}

function cookieFlags(req: Request) {
  return {
    httpOnly: true,
    secure: !isDevelopment || req.protocol === 'https',
    sameSite: 'lax' as const,
    path: '/',
  }
}

// Server-side open-redirect guard for the post-login `next` target.
// Same rules as the client's safeRedirectPath: internal path only.
function safeNext(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const candidate = value.trim()
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) return null
  return candidate
}

export function getGithubStart(req: Request, res: Response): void {
  const github = githubClient()
  if (!github) {
    logger.warn('auth.github.not_configured')
    res.redirect('/login?error=oauth')
    return
  }

  const state = generateState()
  res.cookie(STATE_COOKIE, state, { ...cookieFlags(req), maxAge: 10 * 60 * 1000 })

  // Preserve the caller's `next` across the GitHub round-trip so the
  // callback can land there instead of the default /dashboard.
  const next = safeNext(req.query['next'])
  if (next) res.cookie(NEXT_COOKIE, next, { ...cookieFlags(req), maxAge: 10 * 60 * 1000 })
  else res.clearCookie(NEXT_COOKIE, cookieFlags(req))

  const url = github.createAuthorizationURL(state, ['read:user', 'user:email'])
  res.redirect(url.toString())
}

export async function getGithubCallback(req: Request, res: Response): Promise<void> {
  const fail = (reason: string, context: Record<string, unknown> = {}) => {
    logger.error('auth.github.oauth_error', { reason, ...context })
    res.clearCookie(STATE_COOKIE, cookieFlags(req))
    res.clearCookie(NEXT_COOKIE, cookieFlags(req))
    res.redirect('/login?error=oauth')
  }

  const github = githubClient()
  if (!github) {
    fail('not_configured')
    return
  }

  const code = req.query['code']
  const state = req.query['state']
  const storedState = readRequestCookie(req, STATE_COOKIE)
  if (typeof code !== 'string' || !code || typeof state !== 'string' || !storedState || state !== storedState) {
    fail('invalid_state')
    return
  }

  let tokens
  try {
    tokens = await github.validateAuthorizationCode(code)
  }
  catch (e) {
    fail('code_exchange_failed', { error: (e as Error).message })
    return
  }

  const headers = {
    Authorization: `Bearer ${tokens.accessToken()}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'angular-boilerplate',
  }

  let ghUser: GitHubUser
  try {
    const userRes = await fetch('https://api.github.com/user', { headers })
    if (!userRes.ok) {
      fail('user_fetch_failed', { status: userRes.status })
      return
    }
    ghUser = (await userRes.json()) as GitHubUser
  }
  catch (e) {
    fail('user_fetch_failed', { error: (e as Error).message })
    return
  }

  // emailRequired: the /user email is often null (private email scope).
  // Fall back to the primary verified address from /user/emails.
  let email: string | null = ghUser.email
  if (!email) {
    try {
      const emailsRes = await fetch('https://api.github.com/user/emails', { headers })
      if (emailsRes.ok) {
        const emails = (await emailsRes.json()) as GitHubEmail[]
        email = emails.find(e => e.primary && e.verified)?.email
          ?? emails.find(e => e.verified)?.email
          ?? null
      }
    }
    catch {
      // Non-fatal — the noreply fallback below still lets sign-in proceed.
    }
  }

  // Upsert the GitHub user into our local users table. Skips silently if
  // DATABASE_URL isn't configured yet so the OAuth flow still works in
  // a db-less dev setup.
  let role: Role = 'user'
  // Session id is the DB row id (NOT the GitHub id) so requireRole's
  // live lookup by users.id hits the same row. Db-less fallback: GitHub id.
  let sessionId: number = ghUser.id

  // Bootstrap admins: comma-separated list of GitHub logins that should
  // be created as 'admin' on FIRST sign-in. We deliberately do not touch
  // role on conflict — once the row exists the DB is the source of truth
  // (lets you demote without editing env, and prevents env drift across
  // environments from clobbering production roles).
  const bootstrapAdmins = (env.INITIAL_ADMIN_LOGINS ?? '')
    .split(',').map(s => s.trim()).filter(Boolean)
  const initialRole: Role = bootstrapAdmins.includes(ghUser.login) ? 'admin' : 'user'

  let isFirstSignin = false

  // Email is NOT NULL on the users table (it's the unique identity).
  // GitHub usually returns it because we request the user:email scope,
  // but a user without a verifiable email still slips through;
  // synthesize a stable fallback rather than failing the signin.
  // `<login>@users.noreply.github.com` is GitHub's own documented
  // no-reply address pattern.
  const userEmail = email ?? `${ghUser.login}@users.noreply.github.com`

  try {
    const db = useDb()
    const returned = await db
      .insert(schema.users)
      .values({
        githubId: ghUser.id,
        login: ghUser.login,
        name: ghUser.name ?? ghUser.login,
        email: userEmail,
        avatarUrl: ghUser.avatar_url,
        role: initialRole,
      })
      .onConflictDoUpdate({
        target: schema.users.githubId,
        set: {
          login: ghUser.login,
          name: ghUser.name ?? ghUser.login,
          email: userEmail,
          avatarUrl: ghUser.avatar_url,
          updatedAt: new Date(),
          // role intentionally omitted — see bootstrap comment above.
        },
      })
      .returning({ createdAt: schema.users.createdAt, updatedAt: schema.users.updatedAt })

    // Heuristic: createdAt within 5s of now AND equal to updatedAt
    // means we just INSERTed (not UPDATEd via onConflict). Approximate
    // but cheap and avoids a separate query or raw `xmax` access.
    const row = returned[0]
    if (row) {
      const now = Date.now()
      const created = row.createdAt.getTime()
      const updated = row.updatedAt.getTime()
      isFirstSignin = (now - created) < 5000 && Math.abs(created - updated) < 1000
    }

    // Fetch the row id + role so the session reflects any DB-side changes.
    const dbUser = await db
      .select({ id: schema.users.id, role: schema.users.role })
      .from(schema.users)
      .where(eq(schema.users.githubId, ghUser.id))
      .limit(1)
    if (dbUser[0]) {
      sessionId = dbUser[0].id
      // Defensive: the DB enum and the TS Role union can drift if the
      // app code is redeployed before the migration that adds a new role.
      // Fall back to 'user' rather than trusting an unknown string.
      const dbRole = dbUser[0].role
      if (dbRole && (ROLES as readonly string[]).includes(dbRole)) {
        role = dbRole as Role
      }
    }
  }
  catch (e) {
    logger.warn('auth.github.db_upsert_skipped', {
      login: ghUser.login,
      error: (e as Error).message,
    })
  }

  // Welcome email — fire-and-forget so a mailer failure doesn't fail
  // the OAuth flow. The DB doesn't have to be available; if `isFirstSignin`
  // never flipped true (db-less mode), we skip the email entirely so users
  // don't get welcomed on every signin in that mode.
  if (isFirstSignin && email) {
    sendEmail(welcomeEmail({
      name: ghUser.name ?? ghUser.login,
      email,
      siteUrl: env.SITE_URL,
    })).catch((err) => {
      logger.warn('auth.github.welcome_send_failed', {
        login: ghUser.login,
        error: (err as Error).message,
      })
    })
  }

  await setUserSession(req, res, {
    user: {
      id: sessionId,
      login: ghUser.login,
      name: ghUser.name ?? ghUser.login,
      email,
      avatar: ghUser.avatar_url,
      role,
    },
    loggedInAt: Date.now(),
  })
  logger.info('auth.github.signin', { login: ghUser.login, role })

  const next = safeNext(readRequestCookie(req, NEXT_COOKIE)) ?? '/dashboard'
  res.clearCookie(STATE_COOKIE, cookieFlags(req))
  res.clearCookie(NEXT_COOKIE, cookieFlags(req))
  res.redirect(next)
}
