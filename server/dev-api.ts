// Dev-only standalone API server. `npm run dev` runs this (port 4202) alongside
// `ng serve` (port 4201); proxy.conf.json forwards /api + /auth to this process
// so the browser sees ONE origin. Production does NOT use this file —
// src/server.ts mounts the same routers inside the SSR server (one deploy).
import 'dotenv/config'
import './dev-env'
import express from 'express'
import { apiRouter } from './api/index'
import { authRouter } from './auth/index'
import { assertValidEnv } from './utils/env'
import { initServerSentry } from './utils/sentry'

// Fail fast on invalid env (same boot gate as src/server.ts). This file only
// ever runs as a tsx process (never imported by `ng build`), so top-level is
// safe here — unlike src/server.ts, whose top-level must stay side-effect-free.
try {
  assertValidEnv()
} catch {
  // assertValidEnv already printed the diagnosis; exit non-zero so the dev
  // process (and any supervisor) treats a misconfigured boot as a crash.
  process.exit(1)
}

// Same optional Sentry init as src/server.ts (no-op without SENTRY_DSN).
initServerSentry()

const app = express()

// Polar webhook needs the RAW body for signature verification — same mount
// order as src/server.ts (raw BEFORE json, json skips the webhook path).
const jsonParser = express.json({ limit: '1mb' })
app.use('/api/webhooks/polar', express.raw({ type: '*/*', limit: '1mb' }))
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/webhooks/polar')) return next()
  return jsonParser(req, res, next)
})
app.use('/api', apiRouter)
app.use('/auth', authRouter)

const port = Number(process.env['API_PORT'] ?? 4202)
app.listen(port, () => {
  console.log(`API dev server listening on http://localhost:${port}`)
})
