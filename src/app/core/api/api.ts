// Shared API envelope helpers — mirrors nuxt-boilerplate's ApiResponse
// (server/utils/response.ts): every endpoint returns `{ ok, data }` on
// success or `{ ok: false, error: { code, message } }` on failure.
//
// Pages type their HttpClient calls as `ApiResponse<T>` and use
// `apiErrorMessage` to unwrap transport-level (HttpErrorResponse) failures,
// where the envelope sits at `err.error` — the same shape nuxt's `$fetch`
// exposes at `err.data`.
export interface ApiOk<T> {
  ok: true
  data: T
}

export interface ApiErr {
  ok: false
  error: { code: string, message: string }
}

export type ApiResponse<T> = ApiOk<T> | ApiErr

export function isApiErr(res: unknown): res is ApiErr {
  return (
    typeof res === 'object'
    && res !== null
    && (res as ApiErr).ok === false
    && typeof (res as ApiErr).error?.message === 'string'
  )
}

// Extracts the server's envelope message from anything an HttpClient call
// can throw, falling back when the body isn't an envelope (network
// failure, HTML error page, ProgressEvent).
export function apiErrorMessage(err: unknown, fallback: string): string {
  const body = (err as { error?: unknown } | null | undefined)?.error
  if (isApiErr(body)) return body.error.message
  return fallback
}
