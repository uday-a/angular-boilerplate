// Runtime public config — the client's view of Nuxt's `runtimeConfig.public`.
// The browser bundle has no build-time env, so main.ts fetches GET
// /api/config once at boot (server/api/config.ts) and provides the result
// as PUBLIC_CONFIG. PUBLIC values only — PostHog keys and Sentry DSNs are
// public by design; secrets never leave the server.
//
// SSR safety: the server bundle never runs main.ts, so SSR renders with
// DEFAULT_PUBLIC_CONFIG (empty keys → PostHog/Sentry no-op on the server).
// PostHog/Sentry don't affect rendered output, so there is no hydration
// mismatch; demoMode consumers must tolerate the default until the client
// boots with real values.
import { InjectionToken } from '@angular/core'

export interface PublicConfig {
  posthogKey: string
  posthogHost: string
  sentryDsn: string
  siteUrl: string
  demoMode: boolean
}

export const DEFAULT_PUBLIC_CONFIG: PublicConfig = {
  posthogKey: '',
  posthogHost: 'https://us.i.posthog.com',
  sentryDsn: '',
  siteUrl: 'http://localhost:4201',
  demoMode: false,
}

export const PUBLIC_CONFIG = new InjectionToken<PublicConfig>('PUBLIC_CONFIG', {
  providedIn: 'root',
  factory: () => ({ ...DEFAULT_PUBLIC_CONFIG }),
})

// Fetched once by main.ts before bootstrap. Any failure (API down, bad
// payload) resolves to defaults — the app boots unconfigured rather than
// refusing to boot. Browser-only caller: main.ts never runs on the server.
export async function loadPublicConfig(): Promise<PublicConfig> {
  try {
    const res = await fetch('/api/config', { headers: { accept: 'application/json' } })
    if (!res.ok) return { ...DEFAULT_PUBLIC_CONFIG }
    const body = (await res.json()) as { ok?: boolean, data?: Partial<PublicConfig> }
    if (!body?.ok || !body.data) return { ...DEFAULT_PUBLIC_CONFIG }
    return { ...DEFAULT_PUBLIC_CONFIG, ...body.data }
  }
  catch {
    return { ...DEFAULT_PUBLIC_CONFIG }
  }
}
