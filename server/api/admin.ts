import { Router } from 'express'
import { useDb, schema } from '../db/index'
import { apiError, apiHandler } from '../utils/response'
import { requireRole } from '../utils/guards'
import { env } from '../utils/env'
import { getSession, isDemoSession } from './_session'

// Example: ADMIN-ONLY API route.
// Mirrors nuxt-boilerplate/server/api/admin/users.get.ts.
// Mounted at /api/admin (see server/api/index.ts):
//   GET /api/admin/users → [{ id, login, name, role, createdAt }, ...]
//
// `requireRole(req, 'admin')` throws 401 UNAUTHORIZED if no session,
// 401 SESSION_INVALID if the user row was deleted, 403 FORBIDDEN if the
// live DB role isn't 'admin'. apiHandler envelopes all three.
//
// Try it (anonymous): curl -i http://localhost:4201/api/admin/users
//   → 401 { "ok": false, "error": { "code": "UNAUTHORIZED", ... } }
// Try it (as user):
//   → 403 { "ok": false, "error": { "code": "FORBIDDEN", "message": "role 'user' is not permitted" } }
//
// NOTE: whitelist the columns you return. db.select() with no shape
// leaks email + every future column you add.
export const adminRouter: Router = Router()

// Demo sessions and DB-less boots get a fixed sample list (same people
// as the /api/team/members demo roster). Demo users have no `users` row,
// so the role check uses the session cookie role instead of requireRole.
const DEMO_USERS = [
  { id: 1, login: 'olivia.bennett', name: 'Olivia Bennett', role: 'admin', createdAt: '2025-11-04T09:12:00Z' },
  { id: 2, login: 'james.carter', name: 'James Carter', role: 'admin', createdAt: '2025-11-18T14:30:00Z' },
  { id: 3, login: 'sophie.turner', name: 'Sophie Turner', role: 'editor', createdAt: '2026-01-09T10:05:00Z' },
  { id: 4, login: 'daniel.hughes', name: 'Daniel Hughes', role: 'editor', createdAt: '2026-02-23T16:40:00Z' },
  { id: 5, login: 'emma.collins', name: 'Emma Collins', role: 'user', createdAt: '2026-04-02T08:55:00Z' },
  { id: 6, login: 'lucas.meyer', name: 'Lucas Meyer', role: 'user', createdAt: '2026-05-14T11:20:00Z' },
  { id: 7, login: 'grace.walker', name: 'Grace Walker', role: 'user', createdAt: '2026-07-21T13:15:00Z' },
  { id: 8, login: 'henry.foster', name: 'Henry Foster', role: 'user', createdAt: '2026-09-08T09:45:00Z' },
]

adminRouter.get('/users', apiHandler(async (req) => {
  const authed = await getSession(req)
  if (isDemoSession(authed) || !env.DATABASE_URL) {
    if (authed.user.role !== 'admin') {
      throw apiError('FORBIDDEN', `role '${authed.user.role}' is not permitted`)
    }
    return DEMO_USERS
  }

  await requireRole(req, 'admin')
  const db = useDb()
  return db
    .select({
      id: schema.users.id,
      login: schema.users.login,
      name: schema.users.name,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
}))
