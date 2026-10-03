// Demo sign-in: mints a session for a deterministic fake user so a fresh
// fork is fully clickable without configuring GitHub OAuth or a DB. The
// route 404s when demo mode is off (see server/utils/env.ts → isDemoMode).
//
// Production note: leaving this enabled in prod is intentional only when
// you want a public preview. Set DEMO_MODE=false to hard-disable.
//
// Ported from nuxt-boilerplate/server/routes/auth/demo.post.ts. Bare JSON
// (not the { ok, data } envelope) — matches the Nuxt original.
import type { Request, Response } from 'express'
import { isDemoMode } from '../utils/env'
import { logger } from '../utils/logger'
import { requireRateLimit } from '../utils/rate-limit'
import { setUserSession } from './session'

export async function postDemo(req: Request, res: Response): Promise<void> {
  try {
    requireRateLimit(req, { key: 'auth:demo' })
  } catch {
    res.status(429).json({
      ok: false,
      error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again shortly.' },
    })
    return
  }
  if (!isDemoMode) {
    res.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: 'Demo mode is disabled' },
    })
    return
  }

  await setUserSession(req, res, {
    user: {
      id: 0,
      login: 'john.doe',
      name: 'John Doe',
      email: 'john.doe@example.com',
      avatar: 'https://uday.cc/avatar-twitter.png',
      role: 'admin',
    },
    loggedInAt: Date.now(),
    demo: true,
  })

  logger.info('auth.demo.signin', { ip: req.ip })
  res.json({ ok: true })
}
