import { Router } from 'express'
import { and, desc, eq, ilike } from 'drizzle-orm'
import { useDb, schema } from '../db/index'
import { apiHandler } from '../utils/response'
import { env } from '../utils/env'
import { logger } from '../utils/logger'
import { getSession, isDemoSession } from './_session'

// Mirrors nuxt-boilerplate/server/api/activity/index.ts.
// Mounted at /api/activity (see server/api/index.ts):
//   GET /api/activity → { items, total }
//
// The caller's own audit trail, newest first. An admin-wide view (all
// rows, or rows per workspace member) is a deliberate future step — it
// needs a membership model to scope correctly, so we don't guess at one
// here.
//
// Without a DB (or for demo sessions, which have no rows to attribute)
// this returns an empty list — the client renders its mock fallback and a
// note that live events appear once a database is connected.
export const activityRouter: Router = Router()

activityRouter.get('/', apiHandler(async (req) => {
  const session = await getSession(req)

  if (isDemoSession(session)) return { items: [], total: 0 }
  if (!env.DATABASE_URL) return { items: [], total: 0 }

  const rawAction = req.query['action']
  const actionFilter = typeof rawAction === 'string' && rawAction.trim()
    ? rawAction.trim().replace(/[%_\\]/g, '').slice(0, 64)
    : null

  try {
    const db = useDb()

    const scope = actionFilter
      ? and(eq(schema.auditLogs.userId, session.user.id), ilike(schema.auditLogs.action, `%${actionFilter}%`))
      : eq(schema.auditLogs.userId, session.user.id)

    const items = await db
      .select({
        id: schema.auditLogs.id,
        userId: schema.auditLogs.userId,
        action: schema.auditLogs.action,
        entity: schema.auditLogs.entity,
        entityId: schema.auditLogs.entityId,
        metadata: schema.auditLogs.metadata,
        createdAt: schema.auditLogs.createdAt,
        actorEmail: schema.users.email,
      })
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.auditLogs.userId, schema.users.id))
      .where(scope)
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(50)

    return { items, total: items.length }
  }
  catch (e) {
    // Table missing or DB unreachable — surface empty rather than 500 so
    // the activity surfaces degrade to their mock fallback.
    logger.warn('activity.list_failed', { error: (e as Error).message })
    return { items: [], total: 0 }
  }
}))
