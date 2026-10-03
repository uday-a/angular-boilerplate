import { describe, expect, it } from 'vitest'
import type { Request } from 'express'
import {
  SESSION_COOKIE_NAME,
  getSessionFromRequest,
  readRequestCookie,
  sealSessionForTest,
  type SessionData,
} from './session'

function reqWithCookie(header: string | undefined): Request {
  return { headers: header === undefined ? {} : { cookie: header } } as unknown as Request
}

const sessionData: SessionData = {
  user: { id: 7, login: 'ada', name: 'Ada', email: 'ada@example.com', avatar: null, role: 'admin' },
  loggedInAt: 1700000000000,
}

describe('session roundtrip', () => {
  it('seals and unseals the full session shape', async () => {
    const seal = await sealSessionForTest(sessionData)
    const req = reqWithCookie(`${SESSION_COOKIE_NAME}=${encodeURIComponent(seal)}`)
    await expect(getSessionFromRequest(req)).resolves.toEqual(sessionData)
  })

  it('roundtrips the demo flag', async () => {
    const demo: SessionData = {
      user: { id: 0, login: 'demo', name: 'Demo User', email: 'demo@example.com', avatar: null, role: 'admin' },
      loggedInAt: 1700000000000,
      demo: true,
    }
    const seal = await sealSessionForTest(demo)
    const req = reqWithCookie(`${SESSION_COOKIE_NAME}=${encodeURIComponent(seal)}`)
    await expect(getSessionFromRequest(req)).resolves.toEqual(demo)
  })

  it('returns {} when the cookie is missing', async () => {
    await expect(getSessionFromRequest(reqWithCookie(undefined))).resolves.toEqual({})
    await expect(getSessionFromRequest(reqWithCookie('other=1'))).resolves.toEqual({})
  })

  it('returns {} for a tampered seal instead of throwing', async () => {
    const seal = await sealSessionForTest(sessionData)
    const tampered = seal.slice(0, -2) + (seal.endsWith('aa') ? 'bb' : 'aa')
    const req = reqWithCookie(`${SESSION_COOKIE_NAME}=${encodeURIComponent(tampered)}`)
    await expect(getSessionFromRequest(req)).resolves.toEqual({})
  })

  it('returns {} for garbage values', async () => {
    const req = reqWithCookie(`${SESSION_COOKIE_NAME}=not-a-seal`)
    await expect(getSessionFromRequest(req)).resolves.toEqual({})
  })
})

describe('readRequestCookie', () => {
  it('finds the session cookie among others', () => {
    const req = reqWithCookie('a=1; ng-session=abc123; b=2')
    expect(readRequestCookie(req, 'ng-session')).toBe('abc123')
  })

  it('decodes URI-encoded values', () => {
    const req = reqWithCookie('ng-session=hello%20world')
    expect(readRequestCookie(req, 'ng-session')).toBe('hello world')
  })

  it('returns undefined when absent', () => {
    expect(readRequestCookie(reqWithCookie(undefined), 'ng-session')).toBeUndefined()
    expect(readRequestCookie(reqWithCookie('a=1'), 'ng-session')).toBeUndefined()
  })
})
