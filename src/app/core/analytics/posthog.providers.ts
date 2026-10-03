// PostHog providers: browser-only APP_INITIALIZER. Registered once in
// app.config.ts via providePosthog(). PUBLIC_CONFIG is already populated by
// main.ts (which fetched /api/config before bootstrap); on the server the
// token holds defaults and this initializer returns before touching the SDK.
import { APP_INITIALIZER, PLATFORM_ID, type Provider } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { Router } from '@angular/router'
import { PUBLIC_CONFIG, type PublicConfig } from '../config/public-config'
import { PosthogService } from './posthog.service'

export function providePosthog(): Provider[] {
  return [
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: (posthog: PosthogService, config: PublicConfig, platformId: object, router: Router) => async () => {
        if (!isPlatformBrowser(platformId)) return
        await posthog.init(config)
        posthog.trackPageViews(router)
      },
      deps: [PosthogService, PUBLIC_CONFIG, PLATFORM_ID, Router],
    },
  ]
}
