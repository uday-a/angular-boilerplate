import { Router } from 'express'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDb, schema } from '../db/index'
import { apiError, apiHandler } from '../utils/response'
import { recordAudit } from '../utils/audit'
import { logger } from '../utils/logger'
import { demoSampleKeys, isSampleKeyId, mintApiKey } from '../utils/api-keys'
import { requireRateLimit } from '../utils/rate-limit'
import { getSession, isDemoSession } from './_session'

// Mirrors nuxt-boilerplate/server/api/keys/index.ts +
// server/api/keys/[id].ts. Mounted at /api/keys (see server/api/index.ts):
//   GET    /api/keys     → { keys }
//   POST   /api/keys     → { key, rawKey }
//   DELETE /api/keys/:id → { revoked: id } (sets revokedAt; row stays for history)

const CreateKey = z.object({
  name: z.string().trim().min(1, 'Name is required').max(64, 'Name must be 64 characters or fewer'),
  scopes: z.array(z.enum(['read', 'write'])).min(1).max(4).default(['read']),
  expiresInDays: z.number().int().positive().max(365).optional(),
})

export const keysRouter: Router = Router()

keysRouter.get('/', apiHandler(async (req) => {
  const session = await getSession(req)

  // Demo has no DB rows — surface clearly-flagged sample rows so the
  // page shows existing data. Real users always read their own rows.
  if (isDemoSession(session)) return { keys: demoSampleKeys() }

  const db = useDb()
  // Explicit column list — keyHash is selected nowhere, so it can
  // never leak into the list response.
  const keys = await db
    .select({
      id: schema.apiKeys.id,
      name: schema.apiKeys.name,
      prefix: schema.apiKeys.prefix,
      scopes: schema.apiKeys.scopes,
      lastUsedAt: schema.apiKeys.lastUsedAt,
      expiresAt: schema.apiKeys.expiresAt,
      revokedAt: schema.apiKeys.revokedAt,
      createdAt: schema.apiKeys.createdAt,
    })
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.userId, session.user.id))
    .orderBy(desc(schema.apiKeys.createdAt))
  return { keys }
}))

keysRouter.post('/', apiHandler(async (req) => {
  requireRateLimit(req, { key: 'api:keys' })
  const session = await getSession(req)

  const parsed = CreateKey.safeParse(req.body)
  if (!parsed.success) {
    throw apiError('VALIDATION_FAILED', 'Invalid API key payload', {
      issues: parsed.error.issues,
    })
  }

  const minted = mintApiKey()
  const scopes = [...new Set(parsed.data.scopes)].join(' ')
  const expiresAt = parsed.data.expiresInDays ? new Date(Date.now() + parsed.data.expiresInDays * 86400000) : null

  if (isDemoSession(session)) {
    // Demo: echo back without persisting.
    return {
      key: {
        id: 0,
        name: parsed.data.name,
        prefix: minted.prefix,
        scopes,
        lastUsedAt: null,
        expiresAt,
        revokedAt: null,
        createdAt: new Date(),
      },
      rawKey: minted.raw,
    }
  }

  const db = useDb()
  const [row] = await db
    .insert(schema.apiKeys)
    .values({
      userId: session.user.id,
      name: parsed.data.name,
      keyHash: minted.hash,
      prefix: minted.prefix,
      scopes,
      expiresAt,
    })
    .returning()
  if (!row) throw apiError('INTERNAL', 'Could not create API key')

  // Never log the raw key — prefix is enough for support lookups.
  logger.info('api_keys.created', { userId: session.user.id, prefix: minted.prefix })
  await recordAudit({
    userId: session.user.id,
    action: 'api_keys.create',
    entity: 'api_key',
    entityId: row.id,
    metadata: { name: row.name, prefix: minted.prefix },
  })

  // Rebuild the row without keyHash rather than destructuring it away
  // (avoids an unused-var lint trip on the omitted field).
  const { id, name, prefix, createdAt, lastUsedAt, revokedAt } = row
  return {
    key: { id, name, prefix, scopes: row.scopes, lastUsedAt, expiresAt: row.expiresAt, revokedAt, createdAt },
    rawKey: minted.raw,
  }
}))

// Revoke a key (sets revokedAt; the row stays for audit history).
// Ownership is checked before existence is revealed: a key owned by
// someone else 404s exactly like a missing key, so ids can't be probed.
keysRouter.delete('/:id', apiHandler(async (req) => {
  const session = await getSession(req)

  const rawId = firstParam(req.params['id'])
  const id = Number(rawId)
  if (!rawId || !Number.isInteger(id) || id === 0) {
    throw apiError('VALIDATION_FAILED', 'Invalid API key id', { field: 'id' })
  }

  // Demo sample rows are fake successes (nothing persisted to revoke).
  if (isDemoSession(session) && isSampleKeyId(id)) return { revoked: id }

  // Demo sessions own no real keys, so every other id is a 404.
  if (isDemoSession(session)) {
    throw apiError('NOT_FOUND', `API key ${id} not found`)
  }

  const db = useDb()
  const rows = await db.select().from(schema.apiKeys).where(eq(schema.apiKeys.id, id)).limit(1)
  const row = rows[0]
  if (!row || row.userId !== session.user.id) {
    throw apiError('NOT_FOUND', `API key ${id} not found`)
  }

  await db.update(schema.apiKeys).set({ revokedAt: new Date() }).where(eq(schema.apiKeys.id, id))

  await recordAudit({
    userId: session.user.id,
    action: 'api_keys.revoke',
    entity: 'api_key',
    entityId: id,
    metadata: { name: row.name, prefix: row.prefix },
  })
  logger.info('api_keys.revoked', { id, prefix: row.prefix })

  return { revoked: id }
}))

// Express 5 types params as string | string[]; single-segment :id is
// always a string at runtime — narrow once for the query builders.
function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}
