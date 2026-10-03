// Client entry — browser only (the server bundle boots via main.server.ts,
// so fetching same-origin /api/config and reading `window` here is safe).
//
// Boot order:
//   1. Fetch public runtime config (PostHog key/host, Sentry DSN, demo flag).
//   2. Init browser Sentry when a DSN was served (graceful no-op otherwise).
//   3. Bootstrap with PUBLIC_CONFIG provided, so PosthogService's
//      APP_INITIALIZER can init without a second round-trip.
import { bootstrapApplication } from '@angular/platform-browser'
import { appConfig } from './app/app.config'
import { App } from './app/app'
import { PUBLIC_CONFIG, loadPublicConfig } from './app/core/config/public-config'
import { initBrowserSentry } from './app/core/sentry/sentry.client'

async function bootstrap(): Promise<void> {
  const publicConfig = await loadPublicConfig()

  if (publicConfig.sentryDsn) {
    initBrowserSentry(publicConfig.sentryDsn)
  }

  await bootstrapApplication(App, {
    ...appConfig,
    providers: [...(appConfig.providers ?? []), { provide: PUBLIC_CONFIG, useValue: publicConfig }],
  })
}

bootstrap().catch((err) => console.error(err))
