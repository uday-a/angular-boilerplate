import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { generateToken, hashToken } from './tokens'

describe('generateToken', () => {
  it('returns a 32-byte base64url token by default (43 chars, no padding)', () => {
    const token = generateToken()
    expect(token).toHaveLength(43)
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('honours a custom byte length', () => {
    // 16 bytes → ceil(16/3)*4 = 24 chars, unpadded base64url → 22.
    expect(generateToken(16)).toHaveLength(22)
  })

  it('generates unique values', () => {
    expect(generateToken()).not.toBe(generateToken())
  })
})

describe('hashToken', () => {
  it('returns the SHA-256 hex digest (64 chars)', () => {
    const hash = hashToken('hello')
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(hash).toBe(createHash('sha256').update('hello').digest('hex'))
  })

  it('is deterministic and input-sensitive', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'))
    expect(hashToken('abc')).not.toBe(hashToken('abd'))
  })
})
