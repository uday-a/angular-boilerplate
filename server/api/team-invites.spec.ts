// Regression spec: POST /api/team/invites/:param (accept) must answer
// bogus tokens with a clean 404 envelope — never a 500, never a stack
// leak — and must send exactly one JSON response (the accept endpoint
// owns its response end-to-end because it rewrites the session cookie).
//
// No DATABASE_URL here, so every token lookup takes the NOT_FOUND branch
// before touching the DB — deterministic across machines.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import express from 'express'
import type { Server } from 'node:http'
import { teamInvitesRouter } from './team-invites'

// Belt-and-braces: the lookup must take the no-DB NOT_FOUND branch in
// this file even if the surrounding shell exports a DATABASE_URL.
delete process.env['DATABASE_URL']

const TOKEN_SHAPED_BOGUS = 'a'.repeat(43)

let baseUrl = ''
let server: Server | undefined

beforeAll(async () => {
  const app = express()
  app.use(express.json())
  app.use('/api/team/invites', teamInvitesRouter)
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => resolve())
  })
  const address = server?.address()
  const port = typeof address === 'object' && address ? address.port : 0
  baseUrl = `http://127.0.0.1:${port}`
})

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    if (!server) return resolve()
    server.close((err) => (err ? reject(err) : resolve()))
  })
})

async function postInvite(param: string): Promise<{ status: number, body: unknown, contentType: string | null }> {
  const res = await fetch(`${baseUrl}/api/team/invites/${param}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  })
  return {
    status: res.status,
    body: await res.json(),
    contentType: res.headers.get('content-type'),
  }
}

describe('POST /api/team/invites/:param with bogus tokens', () => {
  it('404s a short bogus token with the shared envelope', async () => {
    const { status, body, contentType } = await postInvite('bogus-token-xyz')
    expect(status).toBe(404)
    expect(contentType).toContain('application/json')
    expect(body).toEqual({
      ok: false,
      error: { code: 'NOT_FOUND', message: 'Invite not found' },
    })
    expect(JSON.stringify(body)).not.toMatch(/stack|TypeError/i)
  })

  it('404s a token-shaped bogus token without leaking internals', async () => {
    const { status, body, contentType } = await postInvite(TOKEN_SHAPED_BOGUS)
    expect(status).toBe(404)
    expect(contentType).toContain('application/json')
    expect(body).toEqual({
      ok: false,
      error: { code: 'NOT_FOUND', message: 'Invite not found' },
    })
    expect(JSON.stringify(body)).not.toMatch(/stack|TypeError/i)
  })

  it('404s a numeric id with the method message (revoke is DELETE-only)', async () => {
    const { status, body } = await postInvite('99999')
    expect(status).toBe(404)
    expect(body).toEqual({
      ok: false,
      error: { code: 'NOT_FOUND', message: 'Method POST not supported on /api/team/invites/:id' },
    })
  })
})

describe('GET /api/team/invites/:param with bogus tokens', () => {
  it('404s verify for short and token-shaped params', async () => {
    for (const param of ['bogus-token-xyz', TOKEN_SHAPED_BOGUS]) {
      const res = await fetch(`${baseUrl}/api/team/invites/${param}`)
      expect(res.status).toBe(404)
      expect(await res.json()).toEqual({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Invite not found' },
      })
    }
  })
})

describe('DELETE /api/team/invites/:param with a token-shaped param', () => {
  it('404s with the method message (tokens are not revocable by id)', async () => {
    const res = await fetch(`${baseUrl}/api/team/invites/${TOKEN_SHAPED_BOGUS}`, { method: 'DELETE' })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({
      ok: false,
      error: { code: 'NOT_FOUND', message: 'Method DELETE not supported on /api/team/invites/:token' },
    })
  })
})
