// Runtime public config — the client's view of Nuxt's `runtimeConfig.public`.
// The browser bundle has no build-time env, so main.ts fetches GET
// /api/config once at boot (server/api/config.ts) and provides the result
// as PUBLIC_CONFIG. PUBLIC values only — PostHog keys and Sentry DSNs are
// public by design; secrets never leave the server.
//
// SSR: the server bundle never runs main.ts; it reads the same values from
// the per-request SSR context (server/utils/ssr-context.ts), so server HTML
// (e.g. the demo bar) matches what the client boots with.
import { InjectionToken } from '@angular/core'
import { injectSsrContext } from './ssr-context'

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
  factory: () => ({ ...DEFAULT_PUBLIC_CONFIG, ...injectSsrContext()?.publicConfig }),
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
