import { describe, expect, it, vi } from 'vitest'
import type { NextFunction, Request, Response } from 'express'
import { authRedirect, isProtectedPage } from './auth-redirect'
import { SESSION_COOKIE_NAME, sealSessionForTest } from '../auth/session'

async function authedReq(path: string, originalUrl?: string, role: 'admin' | 'user' = 'user'): Promise<Request> {
  const seal = await sealSessionForTest({
    user: { id: 7, login: 'ada', name: 'Ada', email: 'ada@example.com', avatar: null, role },
    loggedInAt: Date.now(),
  })
  return {
    path,
    originalUrl: originalUrl ?? path,
    headers: { cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(seal)}` },
  } as unknown as Request
}

function anonReq(path: string, originalUrl?: string): Request {
  return { path, originalUrl: originalUrl ?? path, headers: {} } as unknown as Request
}

function mockRes() {
  const res = {
    statusCode: 0,
    location: undefined as unknown,
    redirect(code: number, url: string) {
      this.statusCode = code
      this.location = url
      return this
    },
  }
  return res as unknown as Response & { statusCode: number, location: unknown }
}

describe('isProtectedPage', () => {
  it('matches every authenticated section', () => {
    for (const p of ['/dashboard', '/dashboard/kanban', '/settings/billing', '/projects', '/projects/x', '/admin/users', '/admin/roles', '/feedback', '/support', '/onboarding']) {
      expect(isProtectedPage(p)).toBe(true)
    }
  })

  it('ignores public pages, APIs, and lookalike prefixes', () => {
    for (const p of ['/', '/login', '/sign-up', '/pricing', '/api/ping', '/auth/github', '/dashboardian', '/projects-old']) {
      expect(isProtectedPage(p)).toBe(false)
    }
  })
})

describe('authRedirect', () => {
  it('302s anonymous visitors to /login?next=', async () => {
    const res = mockRes()
    const next = vi.fn() as unknown as NextFunction
    await authRedirect(anonReq('/dashboard'), res, next)
    expect(res.statusCode).toBe(302)
    expect(res.location).toBe('/login?next=%2Fdashboard')
    expect(next).not.toHaveBeenCalled()
  })

  it('preserves the full original URL (path + query) in next=', async () => {
    const res = mockRes()
    const next = vi.fn() as unknown as NextFunction
    await authRedirect(anonReq('/settings/billing', '/settings/billing?status=success'), res, next)
    expect(res.statusCode).toBe(302)
    expect(res.location).toBe('/login?next=%2Fsettings%2Fbilling%3Fstatus%3Dsuccess')
    expect(next).not.toHaveBeenCalled()
  })

  it('lets authenticated sessions through', async () => {
    const res = mockRes()
    const next = vi.fn() as unknown as NextFunction
    await authRedirect(await authedReq('/dashboard'), res, next)
    expect(next).toHaveBeenCalledOnce()
    expect(res.statusCode).toBe(0)
  })

  // Admin pages must not SSR for non-admins (the client roleGuard defers on the server).
  it('302s non-admin sessions on /admin/* to /dashboard?error=forbidden', async () => {
    const res = mockRes()
    const next = vi.fn() as unknown as NextFunction
    await authRedirect(await authedReq('/admin/users'), res, next)
    expect(res.statusCode).toBe(302)
    expect(res.location).toBe('/dashboard?error=forbidden')
    expect(next).not.toHaveBeenCalled()
  })

  it('lets admin sessions through to /admin/*', async () => {
    const res = mockRes()
    const next = vi.fn() as unknown as NextFunction
    await authRedirect(await authedReq('/admin/roles', undefined, 'admin'), res, next)
    expect(next).toHaveBeenCalledOnce()
    expect(res.statusCode).toBe(0)
  })

  it('lets anonymous visitors through on public pages', async () => {
    const res = mockRes()
    const next = vi.fn() as unknown as NextFunction
    await authRedirect(anonReq('/login'), res, next)
    await authRedirect(anonReq('/'), res, next)
    expect(next).toHaveBeenCalledTimes(2)
    expect(res.statusCode).toBe(0)
  })
})
