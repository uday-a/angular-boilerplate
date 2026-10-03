import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import type { Request } from 'express'

vi.mock('../db', () => ({
  useDb: vi.fn(),
  schema: { users: { id: 'users.id', role: 'users.role' } },
}))

vi.mock('./logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), flush: vi.fn() },
}))

import { useDb } from '../db'
import { requireAuth, requirePublic, requireRole } from './guards'
import { logger } from './logger'
import { ApiError } from './response'
import { SESSION_COOKIE_NAME, sealSessionForTest } from '../auth/session'

const useDbMock = useDb as unknown as Mock

function fakeDbWithRoles(rows: { role: string }[]) {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(rows),
        }),
      }),
    }),
  }
}

async function authedReq(
  role: 'user' | 'admin' | 'editor' = 'user',
  extra: { id?: number, demo?: boolean } = {},
): Promise<Request> {
  const seal = await sealSessionForTest({
    user: {
      id: extra.id ?? 7,
      login: 'ada',
      name: 'Ada',
      email: 'ada@example.com',
      avatar: null,
      role,
    },
    loggedInAt: Date.now(),
    ...(extra.demo ? { demo: true } : {}),
  })
  return { headers: { cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(seal)}` } } as unknown as Request
}

const anonReq = { headers: {} } as unknown as Request

beforeEach(() => {
  vi.clearAllMocks()
})

describe('requireAuth', () => {
  it('returns the session for a valid cookie', async () => {
    const session = await requireAuth(await authedReq('admin'))
    expect(session.user.login).toBe('ada')
    expect(session.user.role).toBe('admin')
    expect(session.loggedInAt).toBeGreaterThan(0)
  })

  it('throws 401 UNAUTHORIZED when anonymous', async () => {
    const err = await requireAuth(anonReq).catch(e => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.code).toBe('UNAUTHORIZED')
    expect(err.status).toBe(401)
  })

  it('throws 401 for a tampered cookie', async () => {
    const req = { headers: { cookie: `${SESSION_COOKIE_NAME}=tampered` } } as unknown as Request
    await expect(requireAuth(req)).rejects.toMatchObject({ code: 'UNAUTHORIZED', status: 401 })
  })
})

describe('requireRole', () => {
  it('throws 401 when anonymous', async () => {
    await expect(requireRole(anonReq, 'admin')).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('passes when the live DB role is allowed', async () => {
    useDbMock.mockReturnValue(fakeDbWithRoles([{ role: 'admin' }]))
    const session = await requireRole(await authedReq('user'), 'admin')
    expect(session.user.role).toBe('admin')
  })

  it('patches a stale cookie role with the live DB role', async () => {
    useDbMock.mockReturnValue(fakeDbWithRoles([{ role: 'editor' }]))
    const session = await requireRole(await authedReq('admin'), 'editor')
    expect(session.user.role).toBe('editor')
  })

  it('accepts a rest list and an array of roles', async () => {
    useDbMock.mockReturnValue(fakeDbWithRoles([{ role: 'editor' }]))
    await expect(requireRole(await authedReq(), 'admin', 'editor')).resolves.toBeDefined()
    await expect(requireRole(await authedReq(), ['admin', 'editor'])).resolves.toBeDefined()
  })

  it('throws 403 FORBIDDEN when the live role is not allowed', async () => {
    useDbMock.mockReturnValue(fakeDbWithRoles([{ role: 'user' }]))
    const err = await requireRole(await authedReq('user'), 'admin').catch(e => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.code).toBe('FORBIDDEN')
    expect(err.status).toBe(403)
  })

  it('throws 401 SESSION_INVALID when the user row is gone', async () => {
    useDbMock.mockReturnValue(fakeDbWithRoles([]))
    await expect(requireRole(await authedReq('admin'), 'admin')).rejects.toMatchObject({
      code: 'SESSION_INVALID',
      status: 401,
    })
  })

  it('treats an unknown DB role string as missing', async () => {
    useDbMock.mockReturnValue(fakeDbWithRoles([{ role: 'superadmin' }]))
    await expect(requireRole(await authedReq('admin'), 'admin')).rejects.toMatchObject({
      code: 'SESSION_INVALID',
    })
  })

  it('falls back to the cookie role when the DB is unreachable', async () => {
    useDbMock.mockImplementation(() => {
      throw new Error('DATABASE_URL is not set')
    })
    await expect(requireRole(await authedReq('admin'), 'admin')).resolves.toBeDefined()
    expect(logger.warn).toHaveBeenCalledWith(
      'guards.live_role_lookup_failed',
      expect.objectContaining({ error: expect.any(String) }),
    )
  })

  it('still enforces the allow-list on DB fallback', async () => {
    useDbMock.mockImplementation(() => {
      throw new Error('connect timeout')
    })
    await expect(requireRole(await authedReq('user'), 'admin')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })
})

describe('requirePublic', () => {
  it('is a no-op that never throws', () => {
    expect(requirePublic(anonReq)).toBeUndefined()
  })
})
