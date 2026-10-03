import { Router } from 'express'
import { apiHandler } from '../utils/response'
import { requireRole } from '../utils/guards'

// Example: MULTI-ROLE API route.
// Mirrors nuxt-boilerplate/server/api/protected/stats.get.ts.
// Mounted at /api/protected (see server/api/index.ts):
//   GET /api/protected/stats → { totalUsers, totalProjects, lastUpdated }
//
// Accepts users with role 'admin' OR 'editor'.
// Throws 401 if anonymous, 403 if role is not in the allow-list.
//
// Try it (as user):
//   → 403 { "ok": false, "error": { "code": "FORBIDDEN", ... } }
// Try it (as editor or admin):
//   → 200 { "ok": true, "data": { "totalUsers": 42, ... } }
export const protectedRouter: Router = Router()

protectedRouter.get('/stats', apiHandler(async (req) => {
  await requireRole(req, 'admin', 'editor')
  return {
    totalUsers: 42,
    totalProjects: 7,
    lastUpdated: new Date().toISOString(),
  }
}))
