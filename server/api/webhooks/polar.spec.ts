import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Request, Response } from 'express'

// Mock the webhook verifier BEFORE the handler module loads it via
// dynamic import — vitest applies vi.mock to dynamic imports too.
vi.mock('@polar-sh/sdk/webhooks', () => {
  class WebhookVerificationError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'WebhookVerificationError'
    }
  }
  return {
    WebhookVerificationError,
    validateEvent: vi.fn(() => {
      throw new WebhookVerificationError('Invalid signature')
    }),
  }
})

import { env } from '../../utils/env'
import { logger } from '../../utils/logger'
import { polarWebhookHandler } from './polar'

const saved = {
  token: env.POLAR_ACCESS_TOKEN,
  secret: env.POLAR_WEBHOOK_SECRET,
}

afterEach(() => {
  env.POLAR_ACCESS_TOKEN = saved.token
  env.POLAR_WEBHOOK_SECRET = saved.secret
  vi.restoreAllMocks()
})

function mockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code
      return this
    },
    send(body: unknown) {
      this.body = body
      return this
    },
  }
  return res as unknown as Response & { statusCode: number, body: unknown }
}

describe('polarWebhookHandler', () => {
  it('returns 503 when Polar is unconfigured', async () => {
    env.POLAR_ACCESS_TOKEN = undefined
    env.POLAR_WEBHOOK_SECRET = undefined
    const res = mockRes()
    await polarWebhookHandler({ body: Buffer.from('{}'), headers: {} } as unknown as Request, res, vi.fn())
    expect(res.statusCode).toBe(503)
  })

  it('returns 400 when the body is missing', async () => {
    env.POLAR_ACCESS_TOKEN = 'polar_test_token'
    env.POLAR_WEBHOOK_SECRET = 'whsec_test'
    const res = mockRes()
    await polarWebhookHandler({ body: undefined, headers: {} } as unknown as Request, res, vi.fn())
    expect(res.statusCode).toBe(400)
  })

  it('returns 403 when signature verification fails (mocked)', async () => {
    env.POLAR_ACCESS_TOKEN = 'polar_test_token'
    env.POLAR_WEBHOOK_SECRET = 'whsec_test'
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const res = mockRes()
    await polarWebhookHandler(
      { body: Buffer.from('{"type":"subscription.created"}'), headers: { 'webhook-signature': 'bad' } } as unknown as Request,
      res,
      vi.fn(),
    )
    expect(res.statusCode).toBe(403)
    expect(res.body).toBe('Invalid signature')
    expect(warn).toHaveBeenCalledWith('billing.webhook.invalid_signature')
  })
})
