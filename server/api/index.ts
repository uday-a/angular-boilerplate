import { Router } from 'express'
import { pingHandler } from './ping'
import { configHandler } from './config'
import { meRouter } from './me'
import { projectsRouter } from './projects'
import { feedbackRouter } from './feedback'
import { activityRouter } from './activity'
import { keysRouter } from './keys'
import { teamInvitesRouter } from './team-invites'
import { teamMembersRouter } from './team-members'
import { adminRouter } from './admin'
import { protectedRouter } from './protected'
import { billingRouter } from './billing'
import { polarWebhookHandler } from './webhooks/polar'

// Mounted at /api by BOTH servers (src/server.ts in prod, server/dev-api.ts
// in dev) — register every /api/* route here so the two can never drift.
//
// Every handler uses apiHandler() + apiError() ({ ok, data } /
// { ok, error } envelope) EXCEPT the Polar webhook, which answers the
// external service with bare statuses (no envelope) and needs
// express.raw() mounted BEFORE the global express.json() parser in both
// servers (see the NOTE there) — req.body arrives as a Buffer.
export const apiRouter: Router = Router()

// GET /api/ping → { ok: true, data: { status, service, timestamp } }
apiRouter.get('/ping', pingHandler)

// GET /api/config → { ok: true, data: { posthogKey, posthogHost, sentryDsn, siteUrl, demoMode } }
// Public runtime config for the client (mirrors Nuxt's runtimeConfig.public).
apiRouter.get('/config', configHandler)

// GET /api/me, GET+PUT /api/me/profile, GET /api/me/subscription
apiRouter.use('/me', meRouter)

// GET+POST /api/projects, GET+PUT+DELETE /api/projects/:slug
apiRouter.use('/projects', projectsRouter)

// POST /api/feedback
apiRouter.use('/feedback', feedbackRouter)

// GET /api/activity → { items, total } (caller's own audit trail)
apiRouter.use('/activity', activityRouter)

// GET+POST /api/keys, DELETE /api/keys/:id
apiRouter.use('/keys', keysRouter)

// GET+POST /api/team/invites, GET+POST+DELETE /api/team/invites/:param
apiRouter.use('/team/invites', teamInvitesRouter)

// GET /api/team/members
apiRouter.use('/team/members', teamMembersRouter)

// GET /api/admin/users
apiRouter.use('/admin', adminRouter)

// GET /api/protected/stats
apiRouter.use('/protected', protectedRouter)

// POST /api/billing/checkout, POST /api/billing/portal
apiRouter.use('/billing', billingRouter)

// POST /api/webhooks/polar (RAW body, NO envelope)
apiRouter.post('/webhooks/polar', polarWebhookHandler)
