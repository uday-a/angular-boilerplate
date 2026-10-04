// Per-request context handed to Angular SSR (`angularApp.handle(req, ctx)`,
// read via REQUEST_CONTEXT in the app). Lets the server render the signed-in
// header, the demo bar and the chosen locale on first paint instead of
// popping them in after the client boots. Shape mirrors
// src/app/core/config/ssr-context.ts.
import type { Request } from 'express'
import { getSessionFromRequest, readRequestCookie } from '../auth/session'
import { publicConfig } from '../api/config'

export async function ssrContext(req: Request) {
  const session = await getSessionFromRequest(req)
  return {
    user: session.user ?? null,
    publicConfig: publicConfig(),
    locale: readRequestCookie(req, 'uipkge-locale') ?? null,
  }
}
