# Angular 20 SaaS Boilerplate — SSR, TypeScript, Tailwind CSS 4

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
![Angular 20](https://img.shields.io/badge/Angular-20-dd0031?logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white)
![Express 5](https://img.shields.io/badge/Express-5-000000?logo=express)
![Node 20.19+](https://img.shields.io/badge/node-%3E%3D20.19-339933?logo=node.js&logoColor=white)

A production-grade **Angular SaaS boilerplate / starter kit** built on **Angular 20** with **server-side rendering (SSR)**, **TypeScript** and **Tailwind CSS 4**, using the shadcn-style [**`@uipkge`** Angular UI registry](https://uipkge.dev/angular/components). One Node process serves the SSR pages and an Express API with GitHub OAuth + magic-link authentication, admin role-based access control (RBAC), team invites, API keys, an audit log, Polar billing, Resend email, a Drizzle ORM + Postgres schema, English/Spanish i18n and a full dashboard (charts, kanban, data table, calendar, map). **Every external integration is gated on env**, so a fresh clone runs in demo mode with no database, OAuth app or API keys.

**[Live demo](https://angular-boilerplate-taupe-psi.vercel.app/login)** · **[Vue/Nuxt sibling: nuxt-boilerplate](https://github.com/uday-a/nuxt-boilerplate)** · **[React/Next.js sibling: next-boilerplate](https://github.com/uday-a/next-boilerplate)** · **[UI registry: uipkge.dev](https://uipkge.dev)**

- **Auth:** GitHub OAuth (arctic), passwordless magic links, demo sign-in, encrypted `iron-session` cookies, team invites by token
- **SSR:** Angular 20 SSR + hydration with event replay, server-side auth redirects, Express 5 API in the same process
- **Billing:** Polar checkout, customer portal and signature-verified subscription webhooks
- **Database:** Drizzle ORM + Postgres — users, projects, subscriptions, magic-link tokens, API keys, audit log, invites
- **Admin & RBAC:** `admin` / `editor` / `user` roles enforced server-side, admin user list, permission-matrix UI
- **Dashboard:** KPIs, ECharts charts, Leaflet map, kanban, data table, calendar, messages, activity heatmap, guided tour
- **i18n:** `@ngx-translate` (English + Spanish), single-URL locale switching
- **DX:** zod-validated env, typed API envelope, structured logging, Sentry, PostHog, Vitest + Playwright

> ### Powered by [UIPKGE](https://uipkge.dev)
>
> Every UI primitive, block and chart in this repo comes from the **`@uipkge`** Angular registry — the Angular distribution of the same design system behind the Nuxt and Next.js siblings:
>
> - **Auth UI** — sign-in, sign-up, password reset, MFA code entry
> - **Marketing UI** — header, hero, logos, features, bento grid, testimonials, pricing, FAQ, CTA, contact, footer
> - **Dashboard UI** — collapsible sidebar, breadcrumbs, command palette, notifications popover, theme customizer, locale switcher, kanban task board, stat tiles, usage bar
> - **Charts** — area, bar, line, funnel, gauge, treemap, calendar heatmap, sparkline (ECharts, themed for light + dark)
> - **Elements** — button, dialog, sheet, command, popover, tooltip, context menu, calendar / range calendar, pin input, file upload, slider, tabs, table, tour, …
>
> Source is copied into your project — fully owned, fully editable, no runtime dependency:
>
> ```bash
> npx uipkge-ng@latest add button
> ```
>
> [Browse the Angular catalog →](https://uipkge.dev/angular/components) · [Jump to the UIPKGE section ↓](#uipkge-ui-registry)

---

## Quick start

```bash
git clone https://github.com/uday-a/angular-boilerplate my-app
cd my-app
npm install
cp .env.example .env
# set SESSION_PASSWORD in .env to the output of: openssl rand -base64 32
npm run dev
# → http://localhost:4201
# → http://localhost:4201/login  (Continue as demo user)
```

No variable is required — it boots zero-config. Set `SESSION_PASSWORD` (32+ characters) for any real deployment; without it a random per-instance secret is used (a warning is logged) and sessions reset on every restart/new instance. Demo mode is **on by default in development** (`npm run dev` sets `NODE_ENV=development`) and off otherwise, so `/login` shows **Continue as demo user** with no further config. Any deployed environment (production, staging or preview) keeps it off unless you set `DEMO_MODE=true` explicitly — see [Deployment](#deployment).

### Routes

| Area | Path | Notes |
|------|------|-------|
| Landing | `/` | Marketing blocks (hero, logos, features, bento, testimonials, pricing, FAQ, CTA, contact) |
| Pricing | `/pricing` | Plan cards → Polar checkout (anonymous users bounce to `/login?next=/pricing`) |
| Terms / Privacy | `/terms`, `/privacy` | Legal page shells |
| Sign in | `/login` | GitHub OAuth, magic-link form, demo sign-in |
| Sign up | `/sign-up` | GitHub OAuth is the real path; the email/password form is a **mock** |
| Forgot password | `/forgot-password` | Sends a magic link (there is no password auth) |
| MFA | `/mfa` | 6-digit code UI — **mock only**, not enforced |
| Invite | `/invite/:token` | Verify + accept a team invite |
| Onboarding | `/onboarding` | 3-step stepper (profile → workspace → invite) — local state only |
| Dashboard | `/dashboard` | KPI strip, range tabs, charts, Leaflet map, guided tour |
| Kanban | `/dashboard/kanban`, `/dashboard/kanban/:id` | Drag-and-drop board; `:id` deep-links into the task sheet |
| Calendar | `/dashboard/calendar` | Month grid with seed events |
| Activity | `/dashboard/activity` | Daily session heatmap |
| Locations | `/dashboard/locations` | Office directory + customer footprint |
| Messages | `/dashboard/messages` | Team inbox UI |
| Customers | `/dashboard/data-table` | Search, faceted filters, sorting, pagination, selection, density, column visibility, CSV export, detail sheet |
| UI kit | `/dashboard/ui-kit` | Every installed primitive on one page |
| Forms | `/dashboard/forms`, `/dashboard/form-example` | Template-driven form demo + reactive form with zod validation |
| Projects | `/projects`, `/projects/:slug` | CRUD backed by `/api/projects` |
| Settings | `/settings/*` | hub, general, account, security, notifications, integrations, team, activity, api-keys, billing, limits |
| Admin | `/admin/users`, `/admin/roles` | Admin-only user list + RBAC permission matrix |
| Feedback / Support | `/feedback`, `/support` | Feedback form (emails ops) + static help center |

Everything under `/dashboard`, `/projects`, `/settings`, `/admin`, `/feedback`, `/support` and `/onboarding` requires a session: the server redirects anonymous requests to `/login?next=…` before SSR runs, and the client `authGuard` does the same after hydration.

The dashboard pages (KPIs, charts, kanban, calendar, messages, customers, locations, activity) render hand-built sample data — swap in your own endpoints. Settings → security, notifications, integrations and limits are **mock UI** until matching endpoints exist.

---

## Features

### Developer experience

- **Angular 20** standalone components, signals, lazy-loaded routes (`loadComponent` on every page)
- **TypeScript** strict mode, with separate app and server tsconfigs (`npm run typecheck` checks both)
- **zod-validated env** at boot (`server/utils/env.ts`) — invalid or half-configured integrations (Polar token without webhook secret, Axiom token without dataset) fail loud before the server listens
- **One repo, one deploy** — the Express API lives in `server/` and ships in the same process as SSR
- **`components.json`** pre-wired for the `@uipkge` Angular registry
- **ESLint 9** (typescript-eslint), **Vitest** unit tests, **Playwright** end-to-end tests

### Frontend

- **Tailwind CSS 4** with UIPKGE OKLCH design tokens (`src/styles.css`)
- **Dark mode** — light / dark / system, stored in the `uipkge-theme` cookie and applied by an inline script in `index.html` before first paint
- **Theme customizer** — 13 accent color themes + corner radius, cookie-backed (`src/app/core/theme/`)
- **Command palette** — ⌘K / Ctrl K
- **Guided tour** of the dashboard (dismissal remembered in `localStorage`, replayable from the page header)
- **Notifications popover**, breadcrumbs, collapsible sidebar, locale switcher, demo-data banners
- **ECharts** charts (lazy, SSR-safe), **Leaflet** map, **lucide-angular** icons, toasts
- **Angular Forms** (template-driven + reactive) with **zod** validation
- Per-page `<title>` and meta tags via Angular's `Title` / `Meta` services

### Backend (Express 5)

- **Typed API envelope** — routes return `{ ok: true, data }` or `{ ok: false, error: { code, message, details? } }` (`server/utils/response.ts`)
- **Structured error codes** — `UNAUTHORIZED`, `SESSION_INVALID`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`, `RATE_LIMITED`, `INTERNAL`
- **`requireAuth()` / `requireRole()`** guards (`server/utils/guards.ts`) — `requireRole` re-reads the role from the database on every call, so demotions take effect immediately
- **Rate limiting** — in-memory sliding window (30 req/min per IP) on demo sign-in, magic link, team invites and API-key creation (`server/utils/rate-limit.ts`)
- **Audit log** — append-only `audit_logs` table written by `recordAudit()` for API-key and team-invite events; surfaced at `/settings/activity` (`GET /api/activity`, filterable by action)
- **API keys** — create / list / revoke at `/settings/api-keys`; prefixed `uipkge_`, SHA-256 hashed, shown once, `read` / `write` scopes, optional expiry. A `verifyApiKey()` helper is included but **not yet wired** into any route
- **Structured logger** — dot-namespaced events to stdout, optional Axiom shipping (`server/utils/logger.ts`)
- **Open-redirect-safe** `?next=` handling after sign-in
- **Public runtime config** — `GET /api/config` hands the browser the PostHog key/host, Sentry DSN, site URL and demo flag at runtime (no rebuild per environment)

#### API routes

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/ping` | Health check |
| `GET` | `/api/config` | Public runtime config |
| `GET` | `/api/me` · `GET`/`PUT` `/api/me/profile` · `GET` `/api/me/subscription` | Session user, profile, plan |
| `GET`/`POST` | `/api/projects` · `GET`/`PUT`/`DELETE` `/api/projects/:slug` | Owner-scoped CRUD |
| `GET`/`POST` | `/api/keys` · `DELETE` `/api/keys/:id` | API keys |
| `GET`/`POST` | `/api/team/invites` · `GET`/`POST`/`DELETE` `/api/team/invites/:param` | Invites (create/list/revoke: admin or editor; verify/accept: invitee) |
| `GET` | `/api/team/members` | Team roster |
| `GET` | `/api/activity` | Caller's audit trail |
| `GET` | `/api/admin/users` | Admin only |
| `GET` | `/api/protected/stats` | Admin or editor (example of a role-gated route) |
| `POST` | `/api/feedback` | Emails ops |
| `POST` | `/api/billing/checkout`, `/api/billing/portal` | Polar |
| `POST` | `/api/webhooks/polar` | Raw body, signature-verified, no envelope |

## Authentication

- **GitHub OAuth** — `GET /auth/github` → `/auth/github/callback` via [arctic](https://arcticjs.dev) (GitHub is the only wired provider). New users get a welcome email
- **Magic link** — `POST /auth/magic-link` emails a single-use, hashed token with a 15-minute TTL; `GET /auth/magic-link?token=` verifies it. Needs `DATABASE_URL` (Resend optional — the link is printed to the server log without it)
- **Demo sign-in** — `POST /auth/demo` mints a demo **admin** session when demo mode is on (404 otherwise)
- **Logout** — `POST` or `GET /auth/logout`
- **Sessions** — `iron-session` sealed cookie (`ng-session`, 14-day TTL) encrypted with `SESSION_PASSWORD`; no Redis needed
- **Route protection** — server middleware (`server/utils/auth-redirect.ts`) redirects before SSR; client `authGuard` / `roleGuard` handle in-app navigation
- **Team invites** — admins/editors invite by email + role; hashed token, 7-day TTL, single-use, accepted at `/invite/:token` (the signed-in email must match)
- **Admin bootstrap** — `INITIAL_ADMIN_LOGINS` lists GitHub usernames created as `role='admin'` on their **first** sign-in; after that the database is the source of truth

> The Nuxt sibling wires many OAuth providers; this repo wires GitHub only. MFA, password sign-up and the onboarding stepper are UI screens, not enforced flows.

## Admin & RBAC

- `user_role` Postgres enum: `user`, `admin`, `editor`
- Server-side enforcement with `requireRole(req, 'admin', …)` — `/api/admin/users` (admin only), team invite management and `/api/protected/stats` (admin or editor)
- `/admin/*` is gated three times: the SSR middleware redirects non-admins to `/dashboard?error=forbidden`, the client `roleGuard` does the same on navigation, and the API re-checks the role
- `/admin/users` — admin user list with search and role filter from `GET /api/admin/users` (sample users in demo mode or without a database)
- `/admin/roles` — permission-matrix UI (owner / admin / editor / viewer / billing) backed by **mock data**; changes are not persisted

## Database

- **Drizzle ORM** + **`postgres`** (postgres.js) driver, lazy singleton (`server/db/index.ts`)
- Works with Neon, Supabase (pooler), Railway, RDS or local Postgres
- Schema (`server/db/schema.ts`): `users`, `projects`, `subscriptions`, `magic_link_tokens`, `api_keys`, `audit_logs`, `invites`
- Migrations in `server/db/migrations` — `npm run db:generate` / `npm run db:migrate` / `npm run db:studio`
- Without `DATABASE_URL`, demo sessions and GitHub sign-in still work; demo sessions get sample projects, API keys and team members instead of database rows

## Billing

Polar.sh (`@polar-sh/sdk`, loaded lazily):

- **Checkout** — `POST /api/billing/checkout` (Pro / Team / Enterprise product IDs), started from `/pricing`
- **Customer portal** — `POST /api/billing/portal`, linked from `/settings/billing`
- **Subscription status** — `GET /api/me/subscription`, shown at `/settings/billing`
- **Webhook** — `POST /api/webhooks/polar`, signature-verified, upserts `subscription.*` events into `subscriptions`
- `POLAR_SERVER=sandbox` for test checkouts; demo sessions can't start checkout or open the portal

## Email

Resend (`server/utils/mailer.ts`): welcome, magic-link, team-invite and feedback emails. Without `RESEND_API_KEY`, emails are printed to the server log. Feedback goes to `EMAIL_OPS` (falls back to `EMAIL_FROM`).

## i18n

- **`@ngx-translate/core`** + HTTP loader with English and Spanish (`src/assets/i18n/en.json`, `es.json`)
- Single-URL strategy — no locale-prefixed routes; the locale switcher swaps the active language in place
- Keys match the Nuxt sibling's locale files; `locale-parity.spec.ts` fails the test run if `en` and `es` drift apart

## SSR

- `@angular/ssr` with `RenderMode.Server` for every route (`src/app/app.routes.server.ts`) — flip marketing routes to `RenderMode.Prerender` if you want static HTML
- `provideClientHydration(withEventReplay())` — clicks made before hydration are replayed
- `src/server.ts` mounts, in order: the raw-body Polar webhook parser, JSON parsing, `/api`, `/auth`, the auth redirect middleware, static assets (1-year cache) and the Angular SSR handler
- Theme cookies are read before first paint, so SSR'd pages render in the right color scheme without a flash

## Observability & analytics

- **Sentry** — `@sentry/node` on the server and `@sentry/angular` in the browser (10% traces, session replay on 10% of sessions + 100% of sessions with errors) when `SENTRY_DSN` is set
- **PostHog** — client analytics with page-view capture when `POSTHOG_KEY` is set; `posthog-js` is dynamically imported, so it stays out of the bundle when unset
- **Axiom** — structured log shipping when `AXIOM_TOKEN` + `AXIOM_DATASET` are set

---

## UIPKGE UI registry

This boilerplate is wired to the [**`@uipkge`** Angular registry](https://uipkge.dev/angular/setup). Items install with the `uipkge-ng` CLI and land under `src/app/components/` — fully owned, fully editable.

```bash
npx uipkge-ng@latest add button
npx uipkge-ng@latest add kanban-task-board
```

Already configured in [`components.json`](./components.json):

```json
{
  "registries": {
    "@uipkge": "https://uipkge.dev/r/angular/{name}.json"
  }
}
```

Browse the catalog at **[uipkge.dev/angular/components](https://uipkge.dev/angular/components)**.

---

## Tech stack

| Layer | Library |
|---|---|
| Framework | [Angular 20](https://angular.dev) (standalone, signals, SSR via `@angular/ssr`), TypeScript |
| Server | [Express 5](https://expressjs.com) (SSR + API in one process) |
| Auth | [iron-session](https://github.com/vvo/iron-session) + [arctic](https://arcticjs.dev) GitHub OAuth + magic links |
| ORM / DB | [Drizzle ORM](https://orm.drizzle.team) + [postgres](https://github.com/porsager/postgres) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com), `class-variance-authority`, `tailwind-merge`, `tw-animate-css` |
| Components | [`@uipkge`](https://uipkge.dev) Angular registry |
| Forms / validation | Angular Forms + [Zod](https://zod.dev) |
| Charts | [ECharts](https://echarts.apache.org) |
| Maps | [Leaflet](https://leafletjs.com) |
| i18n | [ngx-translate](https://github.com/ngx-translate/core) |
| Icons | [lucide-angular](https://lucide.dev) |
| Billing | [Polar.sh](https://polar.sh) |
| Email | [Resend](https://resend.com) |
| Errors / logs / analytics | [Sentry](https://sentry.io), [Axiom](https://axiom.co), [PostHog](https://posthog.com) |
| Testing | [Vitest](https://vitest.dev) (jsdom), [Playwright](https://playwright.dev) |

---

## Requirements

- **Node 20.19+, 22.12+ or 24+** (Angular 20's supported range)
- **npm** (lockfile is `package-lock.json`)
- *Optional:* a Postgres URL — needed for persistence, magic links and team invites

---

## Getting started

### 1. Clone + install

```bash
git clone https://github.com/uday-a/angular-boilerplate my-app
cd my-app
npm install
```

### 2. Environment

```bash
cp .env.example .env
openssl rand -base64 32   # paste into SESSION_PASSWORD
```

No variable is required; `SESSION_PASSWORD` is recommended for real deployments. Empty values in `.env` count as unset — see the matrix below.

### 3. Database (optional)

```bash
# set DATABASE_URL in .env first, then:
npm run db:migrate
```

### 4. Run

```bash
npm run dev     # web on :4201 + API on :4202 (proxied, looks like one origin)
npm run build   # browser + SSR server + API in one artifact
npm run start   # node dist/angular-boilerplate/server/server.mjs (PORT, default 4000)
```

Open **[http://localhost:4201/login](http://localhost:4201/login)** → **Continue as demo user**.

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` | `dev:api` + `dev:web` concurrently |
| `npm run dev:web` | `ng serve` on :4201, proxies `/api` + `/auth` → :4202 (`proxy.conf.json`) |
| `npm run dev:api` | `tsx watch server/dev-api.ts` on `API_PORT` (default 4202) |
| `npm run build` | `ng build` — browser + SSR server, including the API |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` on the app and server projects |
| `npm test` / `npm run test:watch` | Vitest |
| `npm run test:e2e` | Playwright |
| `npm run lint` | ESLint |
| `npm run db:generate` / `db:migrate` / `db:studio` | drizzle-kit |

---

## Project structure

```
.
├── src/                          # frontend (Angular 20 standalone + SSR)
│   ├── index.html                # theme anti-flash inline script (cookies)
│   ├── styles.css                # Tailwind CSS 4 + UIPKGE tokens
│   ├── main.ts / main.server.ts  # browser bootstrap (runtime config, Sentry) / SSR bootstrap
│   ├── server.ts                 # prod Express app: webhook, /api, /auth, auth redirect, static, SSR
│   ├── assets/i18n/              # en.json, es.json
│   └── app/
│       ├── app.routes.ts         # lazy routes + authGuard / roleGuard
│       ├── app.routes.server.ts  # SSR render modes
│       ├── components/
│       │   ├── blocks/           # @uipkge blocks (header, hero, pricing, command palette, sidebar, kanban, …)
│       │   └── ui/               # primitives + charts + leaflet-map + tour
│       ├── core/                 # auth, api, config, i18n, theme, analytics, sentry, rbac mock, dashboard data
│       ├── layouts/              # dashboard shell (sidebar + topbar)
│       └── pages/                # one folder per route
├── server/                       # backend (Express)
│   ├── api/                      # /api/* routes — register in api/index.ts
│   ├── auth/                     # /auth/* routes — GitHub, magic link, demo, logout, session
│   ├── db/                       # Drizzle schema + migrations
│   ├── utils/                    # env, response, guards, rate-limit, audit, api-keys, logger, mailer, polar, sentry
│   └── dev-api.ts                # dev-only standalone API server
├── e2e/                          # Playwright specs
├── test-utils/setup.ts           # Vitest Angular TestBed setup
├── proxy.conf.json               # dev: /api + /auth → :4202
├── drizzle.config.ts
├── components.json               # @uipkge Angular registry
└── .env.example
```

### Adding an API route

```ts
// server/api/hello.ts
import { Router } from 'express'
import { apiHandler } from '../utils/response'
import { requireAuth } from '../utils/guards'

export const helloRouter: Router = Router()
helloRouter.get('/', apiHandler(async (req) => {
  const { user } = await requireAuth(req)
  return { hello: user.email }   // → { ok: true, data: { hello } }
}))
```

```ts
// server/api/index.ts — one line; dev and prod both pick it up
apiRouter.use('/hello', helloRouter)
```

---

## Graceful degradation matrix

| Env var(s) | Unset | Set |
|---|---|---|
| `SESSION_PASSWORD` | Pure demo (`DEMO_MODE=true`, no DB/OAuth/Resend/Polar): stable derived secret, works on serverless. Otherwise a random per-instance secret (warning logged); sessions reset on restart | Stable sessions (32+ chars) |
| `DEMO_MODE` | Auto: on only when `NODE_ENV=development` | `true` forces demo sign-in on, `false` forces it off |
| `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` | GitHub sign-in unavailable | GitHub OAuth |
| `INITIAL_ADMIN_LOGINS` | Nobody auto-promoted | Listed GitHub logins created as admins on first sign-in |
| `DATABASE_URL` | Demo sessions use sample data; magic links, invites and persistence unavailable | Drizzle persistence |
| `RESEND_API_KEY` + `EMAIL_FROM` / `EMAIL_OPS` | Emails printed to the server log | Real delivery |
| `POLAR_ACCESS_TOKEN` + `POLAR_WEBHOOK_SECRET` (+ `POLAR_*_PRODUCT_ID`, `POLAR_SERVER`) | Billing routes return an instructive error | Checkout, portal, webhooks |
| `SENTRY_DSN` | Sentry never initializes | Server + browser error monitoring |
| `POSTHOG_KEY` (+ `POSTHOG_HOST`) | No analytics, SDK not loaded | PostHog page views + events |
| `AXIOM_TOKEN` + `AXIOM_DATASET` | Logs to stdout only | Logs shipped to Axiom |
| `SITE_URL` | `http://localhost:4201` | OAuth redirects + email links |
| `PORT` / `API_PORT` | `4000` / `4202` | Production port / dev API port |
| `NG_ALLOWED_HOSTS` | Only `localhost` / `127.0.0.1` accepted for SSR | Your domains accepted for SSR |

---

## API conventions

```ts
// success
{ ok: true, data: T }
// failure
{ ok: false, error: { code, message, details? } }
```

Pages type their `HttpClient` calls as `ApiResponse<T>` and unwrap failures with `apiErrorMessage()` (`src/app/core/api/api.ts`).

---

## Testing

```bash
npm test             # Vitest unit + component tests (server utils, guards, schema, pages, charts, i18n parity)
npm run test:watch   # watch mode
npm run test:e2e     # Playwright (starts dev:api + dev:web unless BASE_URL is set)
npm run typecheck    # app + server tsconfigs
npm run lint         # ESLint
```

Install the Playwright browser once with `npx playwright install --with-deps chromium`.

---

## Deployment

A single Node server — deploy anywhere Node runs (Fly.io, Render, Railway, a VPS, a container, PM2):

```bash
npm run build
PORT=4000 node dist/angular-boilerplate/server/server.mjs
```

The build bundles the browser app, the SSR server and the Express API into `dist/angular-boilerplate/`. Env is validated at startup, so a bad config fails before the server listens.

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fuday-a%2Fangular-boilerplate)

`vercel.json` holds the whole setup: Vercel's CDN serves the static browser bundle, and every other path (SSR pages, `/api/*`, `/auth/*`) goes to one Node function (`api/index.mjs`) that runs the same Express app as `npm start`.

1. In the Vercel dashboard: **Add New → Project → Import** this repo. Leave the framework preset, build command and output directory as they are (`vercel.json` overrides them).
2. Add environment variables (Settings → Environment Variables):

   | Variable | Value |
   |---|---|
   | `SESSION_PASSWORD` | **Recommended.** Output of `openssl rand -base64 32`. Without it sessions reset on every cold start / new instance. |
   | `DEMO_MODE` | `true` for a public demo: anyone can sign in as **admin** (see the warning below). Leave unset for a real app. |
   | `SITE_URL` | `https://<your-domain>`. Used for OAuth redirects and email links. |
   | `NG_ALLOWED_HOSTS` | Only for custom domains, e.g. `example.com,www.example.com`. `*.vercel.app` is allowed automatically on Vercel. |
   | Optional | `GITHUB_*`, `DATABASE_URL`, `RESEND_API_KEY`, `POLAR_*`, `SENTRY_DSN`, `POSTHOG_*`, `AXIOM_*`. Same meaning as in `.env.example`. |

3. Deploy. Redeploy after changing env vars.

Vercel sets `NODE_ENV=production`, so session cookies are `Secure`. On serverless, use a pooled Postgres URL (Neon pooler, Supabase transaction pooler). The rate limiter is in memory, so each function instance counts separately. Treat it as a throttle, not a hard limit.

Self-hosting is unchanged: `npm start` ignores `vercel.json` and `api/`.

> [!WARNING]
> **`DEMO_MODE`: demo sign-in creates an ADMIN session.** While demo mode is on, anyone can `POST /auth/demo` and get a logged-in **admin** session — a deliberate auth bypass. It is auto-on **only in local development** (`NODE_ENV=development`, which `npm run dev` sets). Every deployment — production, staging or preview — must set `DEMO_MODE=true` **explicitly** to offer a public demo, and should leave it unset or `false` otherwise.

### Production checklist

- [ ] Generate a fresh `SESSION_PASSWORD` (never reuse dev).
- [ ] Set `NODE_ENV=production` and `SITE_URL` to your real domain.
- [ ] Leave `DEMO_MODE` unset or `false` — set `DEMO_MODE=true` only for a deliberate public demo (it grants admin sessions to anyone).
- [ ] Set `NG_ALLOWED_HOSTS` to every hostname clients use (apex, `www`, health-check host); other hosts get a 400 from SSR.
- [ ] Register the OAuth callback: `https://<host>/auth/github/callback`.
- [ ] Register the Polar webhook: `https://<host>/api/webhooks/polar`.
- [ ] Run `npm run db:migrate` against the production `DATABASE_URL`.
- [ ] Verify your Resend sending domain and set `EMAIL_FROM`.
- [ ] Note: rate limits are in-memory per instance — swap in a shared store if you run several instances.

---

## Parity with [nuxt-boilerplate](https://github.com/uday-a/nuxt-boilerplate)

This is the Angular sibling of the Nuxt 4 SaaS starter (and of [next-boilerplate](https://github.com/uday-a/next-boilerplate)): same registry-driven UI, same demo sign-in on `/login`, same API envelope and error codes, same dashboard routes and translation keys.

| | Nuxt | Angular (this repo) |
|---|---|---|
| Registry CLI | `npx shadcn-vue add @uipkge/<name>` | `npx uipkge-ng@latest add <name>` |
| Server | Nitro `server/` | Express `server/`, same process as SSR |
| Session | `nuxt-auth-utils` | `iron-session` |
| OAuth | many providers | GitHub (arctic) |
| i18n | `@nuxtjs/i18n` | `@ngx-translate/core` |
| Route protection | `auth` / `role` middleware | SSR redirect middleware + `authGuard` / `roleGuard` |
| Demo sign-in | `POST /auth/demo` | `POST /auth/demo` |

Not ported yet: the multi-provider OAuth catalog, over-the-air translations and the Nuxt SEO module setup.

---

## Contributing

PRs welcome. For non-trivial changes, open an issue first.

## License

MIT — see [LICENSE](./LICENSE).

## Acknowledgments

- [Angular](https://angular.dev) team
- [shadcn/ui](https://ui.shadcn.com) + [UIPKGE](https://uipkge.dev) for the component system
- [nuxt-boilerplate](https://github.com/uday-a/nuxt-boilerplate) — the Vue sibling this repo mirrors
- [Drizzle](https://orm.drizzle.team) for the ORM
