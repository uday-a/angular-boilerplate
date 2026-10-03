import { describe, expect, it } from 'vitest'
import { apiErrorMessage, isApiErr } from '@/app/core/api/api'

describe('isApiErr', () => {
  it('recognizes envelope failures', () => {
    expect(isApiErr({ ok: false, error: { code: 'NOT_FOUND', message: 'Nope' } })).toBe(true)
  })

  it('rejects success envelopes and junk', () => {
    expect(isApiErr({ ok: true, data: {} })).toBe(false)
    expect(isApiErr(null)).toBe(false)
    expect(isApiErr({})).toBe(false)
    expect(isApiErr({ ok: false })).toBe(false)
  })
})

describe('apiErrorMessage', () => {
  it('unwraps the envelope message from HttpClient-style errors', () => {
    const err = { error: { ok: false, error: { code: 'VALIDATION_FAILED', message: 'Slug taken' } } }
    expect(apiErrorMessage(err, 'Failed')).toBe('Slug taken')
  })

  it('falls back when the body is not an envelope', () => {
    expect(apiErrorMessage({ error: new Event('progress') }, 'Failed')).toBe('Failed')
    expect(apiErrorMessage(new Error('boom'), 'Failed')).toBe('Failed')
    expect(apiErrorMessage(null, 'Failed')).toBe('Failed')
  })
})
