// Angular SSR entry + API server (one repo, one deploy — mirrors Nuxt's server/ concept).
//
// Request flow (order matters):
//   1. /api/*  → apiRouter   (server/api/index.ts)
//   2. /auth/* → authRouter  (server/auth/index.ts)
//   3. static files from the browser bundle
//   4. everything else → Angular SSR
//
// FEATURE WORKERS: to register an API route, create the handler under
// server/api/ (or server/auth/) and mount it in server/api/index.ts (or
// server/auth/index.ts). NEVER add route logic in this file — it stays a
// thin mount table so dev (tsx) and prod (this bundle) can't drift.
import 'dotenv/config'
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  writeResponseToNodeResponse,
} from '@angular/ssr/node'
import express from 'express'
import { dirname, join } from 'node:path'
import { apiRouter } from '../server/api/index'
import { authRouter } from '../server/auth/index'
import { assertValidEnv } from '../server/utils/env'
import { authRedirect } from '../server/utils/auth-redirect'
import { initServerSentry } from '../server/utils/sentry'

// NOTE: no top-level side effects below the imports (no env validation, no
// Sentry init). `ng build`'s route-extraction step imports this module, so
// anything that throws on missing env would fail clean-checkout builds.
// Boot-only work (assertValidEnv + initServerSentry) lives in the
// isMainModule block further down; request-time code validates lazily via
// the env Proxy.

// Resolved from argv[1], not import.meta (see NOTE at the boot block).
// In prod argv[1] is dist/.../server/server.mjs; in dev/ng-build the dir
// doesn't exist and express.static simply falls through to SSR.
const serverDistFolder = dirname((process.argv[1] ?? '').replace(/\\/g, '/'))
const browserDistFolder = join(serverDistFolder, '../browser')

const app = express()
const angularApp = new AngularNodeAppEngine()

// Baseline security headers for every response (API + SSR pages). CSP is
// deliberately absent — the inline theme boot script + ECharts canvas need
// per-route tuning first; a wrong CSP breaks the app silently.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  // HSTS only off-localhost: browsers ignore it over http, and setting it
  // there would needlessly pin local dev domains.
  const host = req.hostname ?? ''
  if (host !== 'localhost' && host !== '127.0.0.1') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  next()
})

// NOTE: express.json() parses JSON bodies for /api + /auth. The Polar webhook
// (server/api/webhooks/polar) needs the RAW body for signature
// verification, so express.raw() mounts BEFORE the JSON parser and the
// JSON parser skips the webhook path (relying on body-parser's _body flag
// alone is brittle across Express majors — the explicit skip can't drift).
const jsonParser = express.json({ limit: '1mb' })
app.use('/api/webhooks/polar', express.raw({ type: '*/*', limit: '1mb' }))
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/webhooks/polar')) return next()
  return jsonParser(req, res, next)
})

app.use('/api', apiRouter)
app.use('/auth', authRouter)

// Anonymous visitors to authenticated pages (dashboard, settings, projects,
// feedback, support, onboarding) 302 to /login?next=<url> — the server-side
// half of the authGuard, which defers during SSR (see server/utils/auth-redirect.ts).
app.use(authRedirect)

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
)

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next)
})

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
// NOTE: no import.meta anywhere in this file. Vite's dev SSR transform
// double-edits it ("Cannot split a chunk that has already been edited")
// and 500s every route. argv[1] covers both launch shapes: `node
// dist/.../server.mjs` in prod and tsx/ts-node on this file in dev.
const entryFile = (process.argv[1] ?? '').replace(/\\/g, '/')
if (entryFile.endsWith('/server.mjs') || entryFile.endsWith('/server.ts') || process.env['pm_id']) {
  // Fail fast on invalid env before listening (production safety), then init
  // optional error monitoring — no-ops when SENTRY_DSN is unset. Both run
  // here (not at module top-level) so `ng build` route extraction, which
  // imports this module, never throws on a clean checkout without env.
  try {
    assertValidEnv()
  } catch {
    // assertValidEnv already printed the diagnosis. Exit non-zero explicitly:
    // zone.js swallows the default uncaughtException exit code (the process
    // would otherwise exit 0 and orchestrators would treat a misconfigured
    // boot as a clean shutdown instead of a crash).
    process.exit(1)
  }
  initServerSentry()

  const port = process.env['PORT'] || 4000
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`)
  })
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app)
