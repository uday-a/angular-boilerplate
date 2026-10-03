import { describe, expect, it, vi } from 'vitest'
import type { Request, Response } from 'express'
import { ApiError, ErrorCode, apiError, apiHandler, ok } from './response'

function mockRes() {
  const res = {
    headersSent: false,
    statusCode: 200,
    jsonBody: undefined as unknown,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(body: unknown) {
      this.jsonBody = body
      return this
    },
  }
  return res as unknown as Response & { statusCode: number, jsonBody: unknown }
}

describe('ok', () => {
  it('wraps data in the success envelope', () => {
    expect(ok({ a: 1 })).toEqual({ ok: true, data: { a: 1 } })
  })
})

describe('apiError', () => {
  it('maps codes to HTTP statuses', () => {
    expect(apiError('UNAUTHORIZED', 'x').status).toBe(401)
    expect(apiError('SESSION_INVALID', 'x').status).toBe(401)
    expect(apiError('FORBIDDEN', 'x').status).toBe(403)
    expect(apiError('NOT_FOUND', 'x').status).toBe(404)
    expect(apiError('VALIDATION_FAILED', 'x').status).toBe(422)
    expect(apiError('RATE_LIMITED', 'x').status).toBe(429)
    expect(apiError('INTERNAL', 'x').status).toBe(500)
  })

  it('carries code, message, and details', () => {
    const err = apiError('VALIDATION_FAILED', 'bad', { field: 'slug' })
    expect(err).toBeInstanceOf(ApiError)
    expect(err.code).toBe(ErrorCode.VALIDATION_FAILED)
    expect(err.message).toBe('bad')
    expect(err.details).toEqual({ field: 'slug' })
  })
})

describe('apiHandler', () => {
  it('envelopes the return value as { ok: true, data }', async () => {
    const res = mockRes()
    const handler = apiHandler(async () => ({ hello: 'world' }))
    await handler({} as Request, res, vi.fn())
    expect(res.statusCode).toBe(200)
    expect(res.jsonBody).toEqual({ ok: true, data: { hello: 'world' } })
  })

  it('envelopes ApiError with its status code', async () => {
    const res = mockRes()
    const handler = apiHandler(async () => {
      throw apiError('FORBIDDEN', 'nope', { role: 'user' })
    })
    await handler({} as Request, res, vi.fn())
    expect(res.statusCode).toBe(403)
    expect(res.jsonBody).toEqual({
      ok: false,
      error: { code: 'FORBIDDEN', message: 'nope', details: { role: 'user' } },
    })
  })

  it('omits details when undefined', async () => {
    const res = mockRes()
    const handler = apiHandler(async () => {
      throw apiError('NOT_FOUND', 'gone')
    })
    await handler({} as Request, res, vi.fn())
    expect(res.jsonBody).toEqual({
      ok: false,
      error: { code: 'NOT_FOUND', message: 'gone' },
    })
  })

  it('maps unknown throws to 500 INTERNAL without leaking', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const res = mockRes()
      const handler = apiHandler(async () => {
        throw new Error('secret stack')
      })
      await handler({} as Request, res, vi.fn())
      expect(res.statusCode).toBe(500)
      expect(res.jsonBody).toEqual({
        ok: false,
        error: { code: 'INTERNAL', message: 'Internal error' },
      })
    }
    finally {
      errSpy.mockRestore()
    }
  })

  it('skips the envelope when the handler already responded', async () => {
    const res = mockRes()
    ;(res as { headersSent: boolean }).headersSent = true
    const handler = apiHandler(async (_req, r) => {
      r.json({ raw: true })
      return { ignored: true }
    })
    await handler({} as Request, res, vi.fn())
    // Only the handler's direct json() call landed.
    expect(res.jsonBody).toEqual({ raw: true })
  })
})
