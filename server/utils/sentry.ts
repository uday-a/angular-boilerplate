// Server-side Sentry init (@sentry/node). Ported from
// nuxt-boilerplate/sentry.server.config.ts: same DSN gating, same 10%
// trace sampling, same Logs product mirroring, same NODE_ENV tagging.
//
// Called once from BOTH server entries (src/server.ts in prod,
// server/dev-api.ts in dev) so errors are captured whichever serves the
// API. No-ops when SENTRY_DSN is unset — graceful degradation, same as Nuxt.
import * as Sentry from '@sentry/node'
import { env, hasSentry } from './env'

let initialized = false

export function initServerSentry(): void {
  if (initialized || !hasSentry || !env.SENTRY_DSN) return
  initialized = true

  Sentry.init({
    dsn: env.SENTRY_DSN,

    // 10% performance sampling — matches the client config and the Nuxt
    // original. High enough to catch trends, low enough to not surprise.
    tracesSampleRate: 0.1,

    // NOTE: the Nuxt original also sets `enableLogs: true` (Logs product
    // mirroring). That option was removed in @sentry/* v11 — logs now ship
    // automatically when a logging integration is used, so nothing to set.

    environment: env.NODE_ENV,
  })
}
