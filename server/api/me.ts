import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDb, schema } from '../db/index'
import { apiError, apiHandler } from '../utils/response'
import { planForProductId } from '../utils/polar'
import { logger } from '../utils/logger'
import { getSession, isDemoSession } from './_session'

// Mirrors nuxt-boilerplate/server/api/me.get.ts,
// server/api/me/profile.ts, server/api/me/subscription.get.ts.
// Mounted at /api/me (see server/api/index.ts):
//   GET /api/me              → { user, loggedInAt }
//   GET /api/me/profile      → { profile }
//   PUT /api/me/profile      → { profile } | { profile, demo: true }
//   GET /api/me/subscription → { subscription: null | {...} }

const UpdateProfile = z.object({
  name: z.string().trim().min(1).max(128).optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  // IANA tz name. We don't enforce the full list — Postgres `varchar(64)`
  // is the storage bound; clients should pick from a curated dropdown.
  timezone: z.string().trim().min(1).max(64).optional(),
  // BCP-47-ish. Same reasoning: enforce shape, let UI pick valid values.
  locale: z.string().trim().min(2).max(8).optional(),
  notifyEmail: z.boolean().optional(),
  notifyInApp: z.boolean().optional(),
})

export const meRouter: Router = Router()

// Example: AUTH-ONLY API route. `requireAuth` throws 401 if the session
// cookie is missing or invalid; apiHandler envelopes it as
// { ok: false, error: { code: 'UNAUTHORIZED', ... } }.
meRouter.get('/', apiHandler(async (req) => {
  const session = await getSession(req)
  return { user: session.user, loggedInAt: session.loggedInAt }
}))

meRouter.get('/profile', apiHandler(async (req) => {
  const session = await getSession(req)

  if (isDemoSession(session)) {
    return {
      profile: {
        name: session.user.name,
        bio: 'Demo account — changes here aren’t persisted.',
        timezone: 'UTC',
        locale: 'en',
        notifyEmail: true,
        notifyInApp: true,
      },
    }
  }

  const db = useDb()
  const [row] = await db
    .select({
      name: schema.users.name,
      bio: schema.users.bio,
      timezone: schema.users.timezone,
      locale: schema.users.locale,
      notifyEmail: schema.users.notifyEmail,
      notifyInApp: schema.users.notifyInApp,
    })
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .limit(1)
  if (!row) throw apiError('SESSION_INVALID', 'Account no longer exists')
  return { profile: row }
}))

meRouter.put('/profile', apiHandler(async (req) => {
  const session = await getSession(req)

  const parsed = UpdateProfile.safeParse(req.body)
  if (!parsed.success) {
    throw apiError('VALIDATION_FAILED', 'Invalid profile payload', {
      issues: parsed.error.issues,
    })
  }

  if (isDemoSession(session)) {
    // Demo: return success but don't persist; let the UI surface it.
    return { profile: parsed.data, demo: true }
  }

  const db = useDb()
  const [updated] = await db
    .update(schema.users)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(schema.users.id, session.user.id))
    .returning({
      name: schema.users.name,
      bio: schema.users.bio,
      timezone: schema.users.timezone,
      locale: schema.users.locale,
      notifyEmail: schema.users.notifyEmail,
      notifyInApp: schema.users.notifyInApp,
    })
  if (!updated) throw apiError('SESSION_INVALID', 'Account no longer exists')
  logger.info('me.profile.updated', { userId: session.user.id, fields: Object.keys(parsed.data) })
  return { profile: updated }
}))

// Current user's subscription summary, used by /settings/billing and
// the pricing page to show which plan they're on.
//
// Returns `{ subscription: null }` for users who haven't subscribed
// — the caller renders the upgrade CTA in that case. Demo users always
// see `null` since they can't reach the real billing system.
meRouter.get('/subscription', apiHandler(async (req) => {
  const session = await getSession(req)

  if (isDemoSession(session)) {
    return { subscription: null }
  }

  const db = useDb()
  const [row] = await db
    .select({
      status: schema.subscriptions.status,
      productId: schema.subscriptions.productId,
      currentPeriodEnd: schema.subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: schema.subscriptions.cancelAtPeriodEnd,
      canceledAt: schema.subscriptions.canceledAt,
    })
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, session.user.id))
    .limit(1)

  if (!row) return { subscription: null }

  return {
    subscription: {
      ...row,
      // Resolve productId → plan key so the UI doesn't have to know
      // about Polar product IDs.
      plan: planForProductId(row.productId),
    },
  }
}))
