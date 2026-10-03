// Auth guards — mirrors nuxt-boilerplate/server/utils/guards.ts semantics
// on Express + iron-session:
//
// - requireAuth(req): return the session or throw 401 UNAUTHORIZED.
// - requireRole(req, ...allowed): re-read the role from the DB on EVERY call
//   (the session cookie has a multi-day TTL — never trust its role for
//   authorization). Row missing → 401 SESSION_INVALID. DB unreachable → fall
//   back to the cookie role with a logger.warn. Role not in the allow-list →
//   403 FORBIDDEN.
// - requirePublic(req): explicit no-op marking an endpoint intentionally public.
import type { Request } from 'express'
import { eq } from 'drizzle-orm'
import { useDb, schema } from '../db'
import { ROLES, type Role } from '../db/schema'
import { getSessionFromRequest, type AuthSession } from '../auth/session'
import { logger } from './logger'
import { apiError } from './response'

// Canonical session-user shape lives in server/auth/session.ts — re-exported
// here so API handlers import guards + types from one place.
export type { AuthSession, SessionUser } from '../auth/session'

/**
 * Require an authenticated session. Returns the session (user + loggedInAt).
 * Throws 401 UNAUTHORIZED when the session cookie is missing/invalid.
 */
export async function requireAuth(req: Request): Promise<AuthSession> {
  const session = await getSessionFromRequest(req)
  if (!session.user) {
    throw apiError('UNAUTHORIZED', 'Sign in required')
  }
  return {
    user: session.user,
    loggedInAt: session.loggedInAt ?? 0,
    ...(session.demo !== undefined ? { demo: session.demo } : {}),
  }
}

/**
 * Require an authenticated session whose user has one of the allowed roles.
 *
 * Re-reads the role from the database on every call instead of trusting
 * the session cookie. Why: the session cookie has a multi-day TTL, so a
 * cached role would mean demoting an admin doesn't actually take effect
 * until they log out. One indexed lookup on users.id is cheap; trade the
 * round-trip for correctness.
 *
 * Three possible outcomes from the DB:
 *   - row found, role in allow-list  -> pass, session.user.role updated
 *   - row found, role not allowed    -> 403 FORBIDDEN
 *   - row missing entirely           -> 401 SESSION_INVALID (the cookie
 *                                       refers to a user that no longer
 *                                       exists; hard deny, never fall back
 *                                       to the cookie role)
 *   - DB unreachable                 -> fall back to cookie role with a
 *                                       logger.warn so adopters notice
 *                                       the staleness risk
 *
 * Accepts a single role, a rest list, or an array:
 *   requireRole(req, 'admin')
 *   requireRole(req, 'admin', 'editor')
 *   requireRole(req, ['admin', 'editor'])
 */
export async function requireRole(
  req: Request,
  ...allowedInput: (Role | Role[])[]
): Promise<AuthSession> {
  const allowed = allowedInput.flat()
  const session = await requireAuth(req)

  const lookup = await readLiveRole(session.user.id)
  let role: Role
  if (lookup.state === 'found') {
    role = lookup.role
  }
  else if (lookup.state === 'not-found') {
    // User row was deleted while a session cookie was still valid.
    // Never trust the cookie role in this case — they shouldn't exist.
    throw apiError('SESSION_INVALID', 'Account no longer exists')
  }
  else {
    // DB unreachable — controlled fallback.
    role = session.user.role
  }

  if (!allowed.includes(role)) {
    throw apiError('FORBIDDEN', `role '${role}' is not permitted`)
  }
  // Patch the in-memory session so downstream handlers see the fresh role.
  // We don't rewrite the cookie — that would extend its TTL on every
  // request.
  if (lookup.state === 'found' && lookup.role !== session.user.role) {
    session.user.role = lookup.role
  }
  return session
}

/**
 * Explicit no-op guard for public routes.
 * Use it at the top of a handler to signal "this endpoint is intentionally public".
 */
export function requirePublic(_req: Request): void {
  // no-op
}

type RoleLookup
  = | { state: 'found', role: Role }
    | { state: 'not-found' }
    | { state: 'db-unavailable' }

async function readLiveRole(userId: number): Promise<RoleLookup> {
  try {
    const db = useDb()
    const row = await db
      .select({ role: schema.users.role })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1)
    const r = row[0]?.role
    if (!r) return { state: 'not-found' }
    if ((ROLES as readonly string[]).includes(r)) {
      return { state: 'found', role: r as Role }
    }
    // DB has a role string that isn't in the TS Role union — treat as
    // missing rather than trusting an unknown value.
    return { state: 'not-found' }
  }
  catch (e) {
    logger.warn('guards.live_role_lookup_failed', {
      error: (e as Error).message,
    })
    return { state: 'db-unavailable' }
  }
}
