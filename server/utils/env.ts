// Centralized, zod-validated server-side env access. Ported from
// nuxt-boilerplate/server/utils/env.ts with Angular-friendly (NUXT-free) names:
//
//   NUXT_SESSION_PASSWORD → SESSION_PASSWORD, NUXT_DEMO_MODE → DEMO_MODE,
//   NUXT_OAUTH_GITHUB_* → GITHUB_*, NUXT_PUBLIC_SITE_URL → SITE_URL,
//   NUXT_PUBLIC_SENTRY_DSN → SENTRY_DSN, NUXT_PUBLIC_POSTHOG_* → POSTHOG_*,
//   NUXT_INITIAL_ADMIN_LOGINS → INITIAL_ADMIN_LOGINS.
//
// LAZY BY DESIGN: importing this module never throws. Validation runs on the
// first `env.*` property access (or an explicit `assertValidEnv()` call) and
// the result is cached. This matters because `ng build`'s route-extraction
// step imports the server bundle — eager validation would fail clean-checkout
// builds that have no SESSION_PASSWORD exported. Both server entries call
// `assertValidEnv()` at boot, so production still fails fast on bad env —
// before listening, not on the first request.
//
// Import `env` / `has*` / `isDemoMode` from here instead of reading
// process.env directly.
import { createHash, randomBytes } from 'node:crypto'
import { z } from 'zod'

const Env = z.object({
  // Required: iron-session cookie crypto (seal/unseal password).
  SESSION_PASSWORD: z
    .string()
    .min(32, 'SESSION_PASSWORD must be at least 32 characters (e.g. `openssl rand -base64 32`)'),

  // GitHub OAuth (arctic) — both keys must be set together, or neither.
  GITHUB_CLIENT_ID: z.string().min(1).optional(),
  GITHUB_CLIENT_SECRET: z.string().min(1).optional(),

  // Postgres — optional. Without it the GitHub handler skips the user
  // upsert and the DB singleton stays uninitialized.
  DATABASE_URL: z.string().url().optional(),

  // Public site URL — used for OAuth redirects + emails.
  SITE_URL: z.string().url().default('http://localhost:4201'),

  // Comma-separated GitHub logins bootstrapped as admins on first sign-in.
  INITIAL_ADMIN_LOGINS: z.string().optional(),

  // Axiom — optional structured log shipping.
  AXIOM_TOKEN: z.string().optional(),
  AXIOM_DATASET: z.string().optional(),
  AXIOM_ORG_ID: z.string().optional(),

  // Sentry — optional error monitoring.
  SENTRY_DSN: z.string().url().optional(),

  // PostHog — optional product analytics.
  POSTHOG_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().url().default('https://us.i.posthog.com'),

  // Resend — transactional email. Without a key the mailer console-prints
  // emails instead of sending them.
  RESEND_API_KEY: z.string().startsWith('re_').optional(),
  EMAIL_FROM: z.string().email().default('onboarding@resend.dev'),
  // Where outbound app emails (feedback, ops alerts) should land.
  // Defaults to EMAIL_FROM so unconfigured prod doesn't ping randoms.
  EMAIL_OPS: z.string().email().optional(),

  // Polar — billing / checkout / subscriptions. Token + webhook secret
  // must be set together; boot fails if only one is set.
  POLAR_ACCESS_TOKEN: z.string().optional(),
  POLAR_WEBHOOK_SECRET: z.string().optional(),
  POLAR_SERVER: z.enum(['sandbox', 'production']).default('production'),
  POLAR_PRO_PRODUCT_ID: z.string().optional(),
  POLAR_TEAM_PRODUCT_ID: z.string().optional(),
  POLAR_ENTERPRISE_PRODUCT_ID: z.string().optional(),

  // Demo mode: lets the /login page mint a session for a fake user so a
  // fresh fork is fully clickable without a GitHub OAuth app or DB.
  //   - 'true'  → always on (even in prod — useful for public previews)
  //   - 'false' → always off (recommended for real production)
  //   - unset   → auto: on in development, off in production.
  DEMO_MODE: z.enum(['true', 'false']).optional(),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export type AppEnv = z.infer<typeof Env>

let cachedEnv: AppEnv | null = null
let cachedError: Error | null = null

function fail(message: string): never {
  cachedError = new Error(message)
  throw cachedError
}

// SESSION_PASSWORD fallback. A *pure demo* (demo mode on, and no integration
// that guards real data or side effects: database, GitHub OAuth, Resend email,
// Polar billing) gets a deterministic secret so sessions survive across
// serverless instances — a forged cookie there grants nothing beyond the
// public "Continue as demo user" button (sample data only). Anything else gets
// a random per-instance secret plus a warning (sessions reset on restart).
// Real deployments should set SESSION_PASSWORD (openssl rand -base64 32).
const REAL_INTEGRATION_VARS = ['DATABASE_URL', 'GITHUB_CLIENT_ID', 'RESEND_API_KEY', 'POLAR_ACCESS_TOKEN']
export function fallbackSessionPassword(raw: Record<string, string | undefined>): { value: string, stable: boolean } {
  const pureDemo = resolveDemoMode(raw['DEMO_MODE'], process.env['NODE_ENV'])
    && REAL_INTEGRATION_VARS.every(k => !raw[k])
  if (pureDemo) {
    const seed = `uipkge-pure-demo:${raw['VERCEL_PROJECT_ID'] ?? 'local'}`
    return { value: createHash('sha256').update(seed).digest('base64'), stable: true }
  }
  return { value: randomBytes(32).toString('base64'), stable: false }
}

function loadEnv(): AppEnv {
  if (cachedEnv) return cachedEnv
  if (cachedError) throw cachedError

  // `KEY=` lines (as in .env.example) arrive as '' — treat them as unset so a
  // copied example file boots instead of failing .url()/.email()/enum checks.
  const raw: Record<string, string | undefined> = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== ''))
  // Zero-config: see fallbackSessionPassword() above.
  if (!raw['SESSION_PASSWORD']) {
    const fallback = fallbackSessionPassword(raw)
    raw['SESSION_PASSWORD'] = fallback.value
    if (!fallback.stable) console.warn(
      '⚠️  SESSION_PASSWORD is not set — using a random per-instance secret. Sessions reset on every '
      + 'restart / new instance. Set SESSION_PASSWORD (openssl rand -base64 32) for real deployments.',
    )
  }
  const parsed = Env.safeParse(raw)
  if (!parsed.success) {
    console.error('\n❌ Invalid environment variables:\n')
    for (const issue of parsed.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`)
    }
    console.error()
    fail('Invalid environment. Fix the values above (see .env.example) and restart.')
  }

  const data = parsed.data

  // Paired vars must be set together — half-configured pairs are a
  // misconfiguration we'd rather fail loudly on than silently degrade.
  if (data.AXIOM_TOKEN && !data.AXIOM_DATASET) {
    fail('AXIOM_TOKEN is set but AXIOM_DATASET is not. Set both, or unset both.')
  }
  if (data.AXIOM_DATASET && !data.AXIOM_TOKEN) {
    fail('AXIOM_DATASET is set but AXIOM_TOKEN is not. Set both, or unset both.')
  }
  if (data.POLAR_ACCESS_TOKEN && !data.POLAR_WEBHOOK_SECRET) {
    fail('POLAR_ACCESS_TOKEN is set but POLAR_WEBHOOK_SECRET is not. Set both, or unset both.')
  }
  if (data.POLAR_WEBHOOK_SECRET && !data.POLAR_ACCESS_TOKEN) {
    fail('POLAR_WEBHOOK_SECRET is set but POLAR_ACCESS_TOKEN is not. Set both, or unset both.')
  }

  cachedEnv = data
  return cachedEnv
}

// Validate now and throw on bad env. Both server entries call this at boot
// (before listening) so misconfiguration fails fast instead of surfacing as
// 500s on the first request. Safe to call repeatedly (cached).
export function assertValidEnv(): AppEnv {
  return loadEnv()
}

// Validated env, resolved lazily on first property access. Mutable (writes
// land on the cached object) so specs can stub values before first use —
// same pattern the mailer/polar specs already rely on.
export const env: AppEnv = new Proxy({} as AppEnv, {
  get(_target, prop: string | symbol): unknown {
    return (loadEnv() as unknown as Record<string | symbol, unknown>)[prop]
  },
  set(_target, prop: string | symbol, value: unknown): boolean {
    (loadEnv() as unknown as Record<string | symbol, unknown>)[prop] = value
    return true
  },
  has(_target, prop: string | symbol): boolean {
    return prop in loadEnv()
  },
  ownKeys(): (string | symbol)[] {
    return Reflect.ownKeys(loadEnv())
  },
  getOwnPropertyDescriptor(_target, prop: string | symbol): PropertyDescriptor | undefined {
    return Reflect.getOwnPropertyDescriptor(loadEnv(), prop)
  },
})

// Convenience flags, computed from the raw process.env at import. These
// intentionally skip validation (importing must never throw — see above).
// They agree with the validated `env` whenever validation would pass: none
// of these keys carry a zod default/transform (NODE_ENV's default is
// deliberately NOT used for isDevelopment/isDemoMode — see below). Any
// request path that acts on a flag also touches `env.*` (session, mailer,
// SDK getters), which throws first on genuinely invalid env — so fail-fast
// is preserved where it matters.

// True only when NODE_ENV is EXPLICITLY 'development'. Deliberately NOT the
// schema default: `ng build` doesn't set NODE_ENV, so a plain `npm start`
// leaves it unset and that must be treated as production. The dev API
// process sets it via server/dev-env.ts.
export const isDevelopment = process.env['NODE_ENV'] === 'development'

// Convenience flag: paired OAuth credentials present?
export const hasGithubOAuth = Boolean(process.env['GITHUB_CLIENT_ID'] && process.env['GITHUB_CLIENT_SECRET'])

// Convenience flag: Axiom shipping requires both a token AND a dataset.
export const hasAxiom = Boolean(process.env['AXIOM_TOKEN'] && process.env['AXIOM_DATASET'])

// Convenience flag: Sentry is on when a DSN is set.
export const hasSentry = Boolean(process.env['SENTRY_DSN'])

// Convenience flag: PostHog is on when a project key is set.
export const hasPostHog = Boolean(process.env['POSTHOG_KEY'])

// Convenience flag: Resend is on when an API key is set. The mailer
// otherwise console-prints emails instead of sending them.
export const hasResend = Boolean(process.env['RESEND_API_KEY'])

// Convenience flag: Polar billing requires BOTH the API token AND the
// webhook secret (the webhook is the source of truth for subscription
// state — without it, we can't reliably know a payment succeeded).
export const hasPolar = Boolean(process.env['POLAR_ACCESS_TOKEN'] && process.env['POLAR_WEBHOOK_SECRET'])

// Pure resolver so the rule is unit-testable without re-importing env.
//   flag 'true' → on, 'false' → off, unset → on only in development.
export function resolveDemoMode(flag: string | undefined, nodeEnv: string | undefined): boolean {
  return flag === 'true' || (flag !== 'false' && nodeEnv === 'development')
}

// Demo mode is ON only in explicit development and OFF otherwise (including
// unset NODE_ENV); set DEMO_MODE explicitly to override either way. A fresh
// `git clone` + `npm run dev` is fully clickable with no GitHub OAuth app or
// DB, while a production deploy stays locked down by default.
//
// SECURITY: while on, anyone who POSTs /auth/demo gets a logged-in session —
// a deliberate auth bypass. It is off outside development unless you set
// DEMO_MODE=true; only do that for throwaway public previews.
export const isDemoMode = resolveDemoMode(process.env['DEMO_MODE'], process.env['NODE_ENV'])
