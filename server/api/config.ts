// PUBLIC API route: runtime client config. Mirrors Nuxt's
// `runtimeConfig.public` (nuxt.config.ts) — the client has no build-time env,
// so main.ts fetches this once at boot to learn the PostHog key/host,
// Sentry DSN, site URL, and demo flag.
//
// PUBLIC VALUES ONLY — every field here is deliberately exposed to the
// browser (PostHog keys and Sentry DSNs are public by design). Never add
// secrets (SESSION_PASSWORD, API keys, webhook secrets) to this payload.
//
// Try it:
//   curl http://localhost:4201/api/config
//   → 200 { "ok": true, "data": { "posthogKey": "", "posthogHost": "...", ... } }
import { env, isDemoMode } from '../utils/env'
import { apiHandler } from '../utils/response'

// Also handed to SSR (server/utils/ssr-context.ts) so server-rendered HTML
// matches what the client boots with (demo bar, etc.).
export function publicConfig() {
  return {
    posthogKey: env.POSTHOG_KEY ?? '',
    posthogHost: env.POSTHOG_HOST,
    sentryDsn: env.SENTRY_DSN ?? '',
    siteUrl: env.SITE_URL,
    demoMode: isDemoMode,
  }
}

export const configHandler = apiHandler(async () => publicConfig())
