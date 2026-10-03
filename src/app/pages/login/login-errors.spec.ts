import { describe, expect, it } from 'vitest'
import { loginErrorMessage } from './login-errors'

describe('loginErrorMessage', () => {
  it('maps every magic-link code to actionable copy', () => {
    expect(loginErrorMessage('magic-link-expired')).toContain('expired')
    expect(loginErrorMessage('magic-link-used')).toContain('already used')
    expect(loginErrorMessage('magic-link-invalid')).toContain('invalid')
    expect(loginErrorMessage('magic-link-missing-token')).toContain('missing a token')
    expect(loginErrorMessage('magic-link-db-required')).toContain('DATABASE_URL')
    expect(loginErrorMessage('magic-link-failed')).toContain('Sign-in failed')
  })

  it('maps oauth failures', () => {
    expect(loginErrorMessage('oauth')).toContain('GitHub sign-in failed')
  })

  it('returns null for unknown or missing codes', () => {
    expect(loginErrorMessage(null)).toBeNull()
    expect(loginErrorMessage('forbidden')).toBeNull()
    expect(loginErrorMessage('')).toBeNull()
  })
})
