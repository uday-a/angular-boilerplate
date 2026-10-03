import type { Request } from 'express'
import { requireAuth, type AuthSession, type SessionUser } from '../utils/guards'

// Thin wrapper around the canonical session (server/auth/session.ts,
// re-exported via server/utils/guards.ts). Mirrors nuxt-boilerplate's
// UserSession:
//
//   { user: { id, login, name, email, avatar, role }, loggedInAt, demo? }
//
// `id` is the DB users.id (serial) — used for ownerId/userId scoping in
// every query below. The auth routes upsert the users row on sign-in and
// seal this shape into the iron-session cookie.
//
// Canonical types live in server/auth/session.ts — these aliases keep
// /api handlers importing from one local module.
export type ApiSessionUser = SessionUser
export type ApiSession = AuthSession

export async function getSession(req: Request): Promise<ApiSession> {
  return requireAuth(req)
}

export function isDemoSession(session: ApiSession): boolean {
  return session.demo === true
}
