// Sealed-cookie sessions via iron-session (no Redis needed).
// Mirrors nuxt-boilerplate's nuxt-auth-utils session shape:
//
//   { user: { id, login, name, email, avatar, role }, loggedInAt, demo? }
//
// Write paths (set/clear) use getIronSession(req, res) and persist the
// cookie. Read paths (guards) use getSessionFromRequest(req), which unseals
// the cookie header directly so guards stay `requireAuth(req)` (no res).
import { getIronSession, sealData, unsealData, type IronSession, type SessionOptions } from 'iron-session'
import type { Request, Response } from 'express'
import { env, isDevelopment } from '../utils/env'
import type { Role } from '../db/schema'

export const SESSION_COOKIE_NAME = 'ng-session'
// 14 days — matches iron-session's default TTL. The cookie max-age is
// derived from this (ttl - 60s skew) by iron-session itself.
export const SESSION_TTL_SECONDS = 1209600

export interface SessionUser {
  id: number
  login: string
  name: string
  // GitHub allows private-email accounts; OAuth then yields null.
  // Don't pretend this is always a string — callers must handle null.
  email: string | null
  avatar: string | null
  role: Role
}

export interface SessionData {
  user?: SessionUser
  loggedInAt?: number
  demo?: boolean
}

// Narrowed session returned by requireAuth/requireRole — user is present.
export interface AuthSession {
  user: SessionUser
  loggedInAt: number
  demo?: boolean
}

export type AppSession = IronSession<SessionData>

export function sessionOptions(): SessionOptions {
  return {
    cookieName: SESSION_COOKIE_NAME,
    password: env.SESSION_PASSWORD,
    ttl: SESSION_TTL_SECONDS,
    cookieOptions: {
      // Secure unless explicitly in development (unset NODE_ENV = prod).
      secure: !isDevelopment,
      sameSite: 'lax',
      httpOnly: true,
      path: '/',
    },
  }
}

export async function getSession(req: Request, res: Response): Promise<AppSession> {
  return getIronSession<SessionData>(req, res, sessionOptions())
}

export async function setUserSession(
  req: Request,
  res: Response,
  data: { user: SessionUser, loggedInAt: number, demo?: boolean },
): Promise<void> {
  const session = await getSession(req, res)
  session.user = data.user
  session.loggedInAt = data.loggedInAt
  // Assign explicitly (never leave a stale demo flag from a previous login).
  if (data.demo) session.demo = true
  else delete session.demo
  await session.save()
}

export async function clearUserSession(req: Request, res: Response): Promise<void> {
  const session = await getSession(req, res)
  session.destroy()
}

// Read-only session read from the request's Cookie header. Returns {} when
// the cookie is missing, expired, or tampered — never throws.
export async function getSessionFromRequest(req: Request): Promise<SessionData> {
  const seal = readCookie(req, SESSION_COOKIE_NAME)
  if (!seal) return {}
  try {
    return await unsealData<SessionData>(seal, {
      password: env.SESSION_PASSWORD,
      ttl: SESSION_TTL_SECONDS,
    })
  }
  catch {
    return {}
  }
}

// Seal helper for tests — produces a cookie value getSessionFromRequest accepts.
export async function sealSessionForTest(data: SessionData): Promise<string> {
  return sealData(data, { password: env.SESSION_PASSWORD, ttl: SESSION_TTL_SECONDS })
}

// Read a single cookie value from the request header. Shared by the
// OAuth flow (state/next cookies) — exported so handlers don't each
// hand-roll cookie parsing.
export function readRequestCookie(req: Request, name: string): string | undefined {
  return readCookie(req, name)
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie
  if (!header) return undefined
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    if (part.slice(0, idx).trim() !== name) continue
    const value = part.slice(idx + 1).trim()
    try {
      return decodeURIComponent(value)
    }
    catch {
      return value
    }
  }
  return undefined
}
