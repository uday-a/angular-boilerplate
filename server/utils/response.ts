// Standard API response envelope — ported from
// nuxt-boilerplate/server/utils/response.ts (adapted from H3 to Express).
//
// Success:  { ok: true,  data:  <T> }
// Failure:  { ok: false, error: { code, message, details? } }
//
// Wrap every /api/* handler with apiHandler() and throw failures with
// apiError(code, message, details?). HTTP status derives from the code.
import type { NextFunction, Request, RequestHandler, Response } from 'express'

export const ErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  SESSION_INVALID: 'SESSION_INVALID',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL',
} as const
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

const CODE_TO_STATUS: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  SESSION_INVALID: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_FAILED: 422,
  RATE_LIMITED: 429,
  INTERNAL: 500,
}

export interface ApiSuccess<T> {
  ok: true
  data: T
}
export interface ApiFailure {
  ok: false
  error: { code: ErrorCode, message: string, details?: unknown }
}
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

export function ok<T>(data: T): ApiSuccess<T> {
  return { ok: true, data }
}

export class ApiError extends Error {
  readonly code: ErrorCode
  readonly status: number
  readonly details?: unknown

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = CODE_TO_STATUS[code]
    this.details = details
  }
}

/**
 * Throw a typed API error. statusCode is derived from the code.
 *
 *   throw apiError('FORBIDDEN', `role '${role}' is not permitted`)
 *   throw apiError('VALIDATION_FAILED', 'email is required', { field: 'email' })
 */
export function apiError(code: ErrorCode, message: string, details?: unknown): ApiError {
  return new ApiError(code, message, details)
}

type ApiFn = (req: Request, res: Response, next: NextFunction) => unknown | Promise<unknown>

/**
 * Wrap an Express handler so its return value is enveloped as
 * { ok: true, data } and any thrown error is enveloped as
 * { ok: false, error }. The HTTP status code is preserved.
 *
 *   apiRouter.get('/projects', apiHandler(async (req) => {
 *     const user = await requireAuth(req)
 *     return { hello: user.email }
 *   }))
 */
export function apiHandler(fn: ApiFn): RequestHandler {
  return async (req, res, next) => {
    try {
      const data = await fn(req, res, next)
      // Handlers that already sent a response (redirects, streams, file
      // downloads) skip the envelope.
      if (!res.headersSent) res.json(ok(data))
    }
    catch (err: unknown) {
      if (err instanceof ApiError) {
        res.status(err.status).json({
          ok: false,
          error: {
            code: err.code,
            message: err.message,
            ...(err.details !== undefined ? { details: err.details } : {}),
          },
        } satisfies ApiFailure)
        return
      }
      // Don't leak stack traces to clients — log server-side instead.
      console.error('[api:unhandled]', err)
      res.status(500).json({
        ok: false,
        error: { code: ErrorCode.INTERNAL, message: 'Internal error' },
      } satisfies ApiFailure)
    }
  }
}
