import type { Request, RequestHandler, Response } from 'express'
import { useDb, schema } from '../../db/index'
import { env } from '../../utils/env'
import { logger } from '../../utils/logger'

// Polar webhook receiver. Hosts the source of truth for subscription
// state — we never write to subscriptions table from anywhere else.
// Mirrors nuxt-boilerplate/server/api/webhooks/polar.post.ts.
//
// Key decisions:
//
// 1. Raw body. Signature verification hashes the exact bytes Polar
//    sent. Both servers (src/server.ts, server/dev-api.ts) mount
//    express.raw() for this path BEFORE the global express.json()
//    parser, so req.body arrives as a Buffer here.
//
// 2. No envelope. Webhooks aren't called by our client — they're
//    called by Polar. Polar wants HTTP 2xx on success, 4xx on signature
//    failure, 5xx on anything else (it'll retry). Returning the
//    `{ ok, data }` envelope would be wasted bytes; bare status codes
//    are the contract.
//
// 3. Idempotent. Polar retries on 5xx. Every event we handle uses
//    upsert / onConflictDoUpdate so re-delivery is safe.
//
// 4. We resolve user-from-event via `externalCustomerId` set at
//    checkout time. New event types added later need to match that
//    same convention (or fall back to looking up by customer.email).
export const polarWebhookHandler: RequestHandler = async (req: Request, res: Response) => {
  // Read env fields directly (same semantics as `hasPolar`, but mutable
  // for tests that stub env before first use).
  if (!env.POLAR_ACCESS_TOKEN || !env.POLAR_WEBHOOK_SECRET) {
    // No secret configured = no way to verify; refuse rather than
    // accept unsigned traffic.
    res.status(503).send('Polar webhook secret not configured')
    return
  }

  const rawBody: unknown = req.body
  if (!rawBody || (Buffer.isBuffer(rawBody) && rawBody.length === 0)) {
    res.status(400).send('Missing body')
    return
  }

  // The webhook SDK helpers live behind a dynamic import so the SDK
  // stays unbundled when Polar is unconfigured at build time. See
  // server/utils/polar.ts for the matching pattern on the API client.
  const { validateEvent, WebhookVerificationError } = await import('@polar-sh/sdk/webhooks')

  // Express headers are string | string[] | undefined; validateEvent
  // wants a flat Record<string, string>.
  const headers: Record<string, string> = {}
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers[key] = value
    else if (Array.isArray(value)) headers[key] = value.join(', ')
  }

  let polarEvent: { type: string, data: Record<string, unknown> }
  try {
    polarEvent = validateEvent(
      rawBody as Buffer,
      headers,
      env.POLAR_WEBHOOK_SECRET!,
    ) as unknown as { type: string, data: Record<string, unknown> }
  }
  catch (e) {
    if (e instanceof WebhookVerificationError) {
      logger.warn('billing.webhook.invalid_signature')
      res.status(403).send('Invalid signature')
      return
    }
    throw e
  }

  // Resolve our user from the event. Polar attaches our externalCustomerId
  // (set at checkout) to the customer record; it's the same on every event
  // for the customer's lifetime.
  const data = polarEvent.data as {
    customer?: { externalId?: unknown }
    customerExternalId?: unknown
    customerId?: string
    id?: string
    productId?: string
    status?: string
    currentPeriodEnd?: string | null
    cancelAtPeriodEnd?: boolean
    canceledAt?: string | null
  }
  const externalCustomerId = data?.customer?.externalId ?? data?.customerExternalId ?? null
  const userId = externalCustomerId ? Number.parseInt(String(externalCustomerId), 10) : null

  // Subscription events: upsert our row.
  if (polarEvent.type.startsWith('subscription.')) {
    if (!userId || Number.isNaN(userId)) {
      // No mapping → log + 202 (we accept the event but can't act).
      // Returning a 5xx would make Polar retry forever.
      logger.warn('billing.webhook.no_external_customer_id', { type: polarEvent.type })
      res.status(202).send('')
      return
    }

    try {
      const db = useDb()
      await db
        .insert(schema.subscriptions)
        .values({
          userId,
          polarCustomerId: data.customerId!,
          polarSubscriptionId: data.id!,
          productId: data.productId!,
          status: data.status!,
          currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null,
          cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
          canceledAt: data.canceledAt ? new Date(data.canceledAt) : null,
        })
        .onConflictDoUpdate({
          target: schema.subscriptions.userId,
          set: {
            polarCustomerId: data.customerId!,
            polarSubscriptionId: data.id!,
            productId: data.productId!,
            status: data.status!,
            currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null,
            cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
            canceledAt: data.canceledAt ? new Date(data.canceledAt) : null,
            updatedAt: new Date(),
          },
        })

      logger.info('billing.webhook.subscription_upserted', {
        type: polarEvent.type,
        userId,
        status: data.status,
        productId: data.productId,
      })
    }
    catch (e) {
      // 5xx → Polar retries with exponential backoff. Most retry storms
      // come from a missing migrations table; the operator sees the
      // error and runs `npm run db:migrate`.
      logger.error('billing.webhook.db_upsert_failed', {
        type: polarEvent.type,
        userId,
        error: (e as Error).message,
      })
      res.status(500).send('DB error')
      return
    }
  }
  else {
    // Other event types (order.*, customer.*, etc.) — log but don't act.
    // Add a case here when you need to react to one of them.
    logger.info('billing.webhook.ignored', { type: polarEvent.type })
  }

  res.status(202).send('')
}
