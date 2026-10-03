// Browser-side Sentry init (@sentry/angular). Ported from
// nuxt-boilerplate/sentry.client.config.ts: same PII default, same 10%
// trace sampling, same Session Replay rates (10% of sessions + 100% of
// sessions with an error), same Logs product mirroring.
//
// Called from main.ts only when a DSN was served by /api/config; the global
// ErrorHandler in app.config.ts (Sentry.createErrorHandler) is registered
// unconditionally and stays inert until init() runs.
import * as Sentry from '@sentry/angular'

export function initBrowserSentry(dsn: string): void {
  Sentry.init({
    dsn,

    // NOTE: the Nuxt original sets `sendDefaultPii: true` (collect request
    // headers + IP) and `enableLogs: true` (Logs product mirroring). Both
    // options were removed in @sentry/* v11: dataCollection defaults are now
    // permissive (headers/IP collected unless restricted — acceptable for
    // B2B SaaS, tighten via `dataCollection` for GDPR-tight launches), and
    // logs ship automatically when a logging integration is used.

    // 10% performance sampling; matches the server config.
    tracesSampleRate: 0.1,

    // Session Replay: capture 10% of all sessions, plus 100% of sessions
    // that hit an error. Cheap insurance for reproducing bugs from real
    // user reports.
    integrations: [Sentry.replayIntegration()],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}
