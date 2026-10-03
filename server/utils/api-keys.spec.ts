import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { API_KEY_PREFIX, hashApiKey, mintApiKey, verifyApiKey } from './api-keys'

describe('mintApiKey', () => {
  it('mints a prefixed base64url key with matching hash + prefix', () => {
    const minted = mintApiKey()
    expect(minted.raw.startsWith(API_KEY_PREFIX)).toBe(true)
    expect(minted.raw).toMatch(/^uipkge_[A-Za-z0-9_-]+$/)
    expect(minted.prefix).toBe(minted.raw.slice(0, 12))
    expect(minted.hash).toBe(hashApiKey(minted.raw))
  })

  it('mints unique keys', () => {
    expect(mintApiKey().raw).not.toBe(mintApiKey().raw)
  })
})

describe('hashApiKey', () => {
  it('returns the SHA-256 hex digest (64 chars)', () => {
    const hash = hashApiKey('uipkge_test')
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(hash).toBe(createHash('sha256').update('uipkge_test').digest('hex'))
  })
})

describe('verifyApiKey', () => {
  it('returns null for missing input without touching the DB', async () => {
    await expect(verifyApiKey(null)).resolves.toBeNull()
    await expect(verifyApiKey(undefined)).resolves.toBeNull()
    await expect(verifyApiKey('')).resolves.toBeNull()
  })

  it('fails closed when the DB is unreachable', async () => {
    // No DATABASE_URL in the test env (see test-utils/setup.ts — only
    // SESSION_PASSWORD is stubbed), so useDb() throws and verification
    // must return null rather than throwing.
    await expect(verifyApiKey(mintApiKey().raw)).resolves.toBeNull()
    await expect(verifyApiKey(mintApiKey().raw, 'read')).resolves.toBeNull()
  })
})
