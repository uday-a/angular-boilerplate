// Server-side auth redirect for page routes. Mirrors what the client's
// `authGuard` does after hydration: anonymous visitors to authenticated pages
// land on /login?next=<original-url>. The Angular guard intentionally defers
// on the server (relative-URL session fetches can't run during SSR), so
// without this middleware `curl /dashboard` would 200 with SSR'd HTML for an
// anonymous user instead of redirecting — breaking the Nuxt `auth.ts`
// middleware parity (Nuxt redirects server-side).
//
// Mounted in src/server.ts between the /api+/auth routers and the static/SSR
// handlers. Reads the sealed session cookie directly (no fetch needed).
import type { NextFunction, Request, Response } from 'express'
import { getSessionFromRequest } from '../auth/session'

// Must mirror the authenticated route set in src/app/app.routes.ts: every
// child of the DashboardLayout shell plus /onboarding (guarded standalone).
const PROTECTED_PREFIXES = ['dashboard', 'settings', 'projects', 'admin', 'feedback', 'support', 'onboarding'] as const

const PROTECTED_RE = new RegExp(`^/(${PROTECTED_PREFIXES.join('|')})(/|$)`)

const ADMIN_RE = /^\/admin(\/|$)/

// Sign-in pages a signed-in user skips (Nuxt: login/sign-up/forgot-password/mfa
// each `navigateTo('/dashboard')` when loggedIn) — server-side so SSR never
// paints the form first. Mirrored client-side by guestGuard.
const GUEST_RE = /^\/(login|sign-up|forgot-password|mfa)\/?$/

export function isProtectedPage(path: string): boolean {
  return PROTECTED_RE.test(path)
}

export async function authRedirect(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (GUEST_RE.test(req.path)) {
    const session = await getSessionFromRequest(req)
    if (session.user) res.redirect(302, '/dashboard')
    else next()
    return
  }
  if (!isProtectedPage(req.path)) {
    next()
    return
  }
  const session = await getSessionFromRequest(req)
  if (!session.user) {
    res.redirect(302, `/login?next=${encodeURIComponent(req.originalUrl)}`)
    return
  }
  // SSR half of the client roleGuard on /admin/* (Nuxt role.ts): wrong role
  // → /dashboard?error=forbidden. Reads role off the session, like the guard.
  if (ADMIN_RE.test(req.path) && session.user.role !== 'admin') {
    res.redirect(302, '/dashboard?error=forbidden')
    return
  }
  next()
}
