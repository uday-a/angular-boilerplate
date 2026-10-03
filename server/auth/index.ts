import { Router } from 'express'
import { postDemo } from './demo'
import { getGithubCallback, getGithubStart } from './github'
import { logout } from './logout'
import { getMagicLink, postMagicLink } from './magic-link'

// Mounted at /auth by BOTH servers (src/server.ts in prod, server/dev-api.ts
// in dev). Mirrors nuxt-boilerplate/server/routes/auth/*.
//
// Sessions are sealed cookies via iron-session — no Redis/Postgres needed just
// to keep a user logged in. See server/auth/session.ts + server/utils/guards.ts.
export const authRouter: Router = Router()

// GET /auth/github → set state cookie, redirect to GitHub (arctic).
authRouter.get('/github', getGithubStart)
// GET /auth/github/callback → verify code, upsert user, seal session, 302 /dashboard.
authRouter.get('/github/callback', getGithubCallback)

// POST /auth/magic-link → create hashed token row + email the link (enveloped JSON).
authRouter.post('/magic-link', postMagicLink)
// GET /auth/magic-link?token= → verify (single-use, 15-min TTL), set session, 302 /dashboard.
authRouter.get('/magic-link', getMagicLink)

// POST /auth/demo → mint fake admin session when isDemoMode (404 otherwise).
authRouter.post('/demo', postDemo)

// POST + GET /auth/logout → clear session cookie, 302 /login.
authRouter.post('/logout', logout)
authRouter.get('/logout', logout)
