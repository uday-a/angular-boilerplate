import { Router } from 'express'
import { z } from 'zod'
import { apiError, apiHandler } from '../utils/response'
import { env } from '../utils/env'
import { getPolar, productIdForPlan, type Plan } from '../utils/polar'
import { logger } from '../utils/logger'
import { getSession, isDemoSession } from './_session'

// Mirrors nuxt-boilerplate/server/api/billing/checkout.post.ts +
// server/api/billing/portal.post.ts. Mounted at /api/billing
// (see server/api/index.ts):
//   POST /api/billing/checkout → { url }
//   POST /api/billing/portal   → { url }

const Body = z.object({
  plan: z.enum(['pro', 'team', 'enterprise']),
})

export const billingRouter: Router = Router()

// Create a Polar checkout session for the signed-in user.
// Returns the hosted-checkout URL — the client should redirect to it.
//
// Demo session is rejected; demo users shouldn't be reaching the
// real billing system.
billingRouter.post('/checkout', apiHandler(async (req) => {
  const session = await getSession(req)

  if (isDemoSession(session)) {
    throw apiError('FORBIDDEN', 'Demo sessions can\'t initiate checkout. Sign in with a real account.')
  }

  const parsed = Body.safeParse(req.body)
  if (!parsed.success) {
    throw apiError('VALIDATION_FAILED', 'Invalid checkout payload', {
      issues: parsed.error.issues,
    })
  }

  const plan: Plan = parsed.data.plan
  const productId = productIdForPlan(plan)
  if (!productId) {
    throw apiError('VALIDATION_FAILED', `Plan '${plan}' has no POLAR_${plan.toUpperCase()}_PRODUCT_ID configured`)
  }

  const polar = await getPolar()
  if (!polar) {
    throw apiError('INTERNAL', 'Billing is not configured. Set POLAR_ACCESS_TOKEN + POLAR_WEBHOOK_SECRET.')
  }

  try {
    const checkout = await polar.checkouts.create({
      products: [productId],
      // After payment, Polar bounces the user here. We don't need any
      // post-checkout DB write — the webhook handles persistence. The
      // landing page reads /api/me/subscription to show the new plan.
      successUrl: `${env.SITE_URL}/settings/billing?status=success`,
      // Link the Polar customer to our user via externalCustomerId.
      // Webhook events for this subscription will include this value
      // so we can resolve back to our row without a separate lookup.
      externalCustomerId: String(session.user.id),
      customerEmail: session.user.email ?? undefined,
      metadata: {
        userId: session.user.id,
        plan,
      },
    })

    logger.info('billing.checkout.created', { userId: session.user.id, plan, checkoutId: checkout.id })
    return { url: checkout.url }
  }
  catch (e) {
    // Re-thrown ApiErrors (none here today) pass through untouched;
    // anything else is a Polar failure.
    if (e && typeof e === 'object' && 'code' in e && 'status' in e) throw e
    logger.error('billing.checkout.failed', {
      userId: session.user.id,
      plan,
      error: (e as Error).message,
    })
    throw apiError('INTERNAL', 'Could not create checkout session. Try again, or contact support.')
  }
}))

// Create a Polar customer-portal session for the signed-in user.
// Returns the portal URL — the client should redirect to it.
//
// The portal lets the customer change/cancel their plan and manage
// payment methods. Polar identifies the customer by our user.id via
// `externalCustomerId` (set at checkout time).
billingRouter.post('/portal', apiHandler(async (req) => {
  const session = await getSession(req)

  if (isDemoSession(session)) {
    throw apiError('FORBIDDEN', 'Demo sessions don\'t have a billing portal.')
  }

  const polar = await getPolar()
  if (!polar) {
    throw apiError('INTERNAL', 'Billing is not configured. Set POLAR_ACCESS_TOKEN + POLAR_WEBHOOK_SECRET.')
  }

  try {
    const portal = await polar.customerSessions.create({
      externalCustomerId: String(session.user.id),
    })
    logger.info('billing.portal.created', { userId: session.user.id })
    return { url: portal.customerPortalUrl }
  }
  catch (e) {
    // 404 from Polar means the user has never checked out — no
    // customer record exists. Surface that as a 404 in our envelope
    // so the client can offer a checkout CTA instead.
    const message = (e as { message?: string }).message ?? ''
    if (message.toLowerCase().includes('not found') || message.includes('404')) {
      throw apiError('NOT_FOUND', 'No active subscription. Start one from the pricing page first.')
    }
    // Preserve ApiErrors thrown above (none past this point, but safe).
    if (e && typeof e === 'object' && 'code' in e && 'status' in e) throw e
    logger.error('billing.portal.failed', {
      userId: session.user.id,
      error: (e as Error).message,
    })
    throw apiError('INTERNAL', 'Could not open the billing portal. Try again later.')
  }
}))
