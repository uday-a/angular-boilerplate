// Per-request SSR context from server/utils/ssr-context.ts (passed as
// `angularApp.handle(req, context)`). Null in the browser and in tests.
import { REQUEST_CONTEXT, inject } from '@angular/core'
import type { AuthUser } from '../auth/auth.service'
import type { PublicConfig } from './public-config'

export interface SsrContext {
  user: AuthUser | null
  publicConfig: PublicConfig
  locale: string | null
}

export function injectSsrContext(): SsrContext | null {
  return (inject(REQUEST_CONTEXT, { optional: true }) as SsrContext | null) ?? null
}
