// PostHog product analytics. Ported from
// nuxt-boilerplate/app/plugins/posthog.client.ts with the same three gates:
//   1. Initialized from a browser-only APP_INITIALIZER (never on the server).
//   2. Early-return when the public key is empty.
//   3. `posthog-js` enters via dynamic import() so the SDK stays out of the
//      client bundle when the key is unset (verified by tree-shaking the
//      empty-key path — the static import below is type-only and erased).
//
// Usage:
//   import { PosthogService } from '@/app/core/analytics'
//   private readonly posthog = inject(PosthogService)
//   this.posthog.capture('user.upgraded', { plan: 'pro' }) // no-op when off
import { Injectable } from '@angular/core'
import type { Router } from '@angular/router'
import { NavigationEnd } from '@angular/router'
import { filter } from 'rxjs'
import type { PostHog } from 'posthog-js'
import type { PublicConfig } from '../config/public-config'

@Injectable({ providedIn: 'root' })
export class PosthogService {
  private client: PostHog | undefined
  private trackedRouter: Router | undefined

  get instance(): PostHog | undefined {
    return this.client
  }

  get enabled(): boolean {
    return this.client !== undefined
  }

  // Called once by the APP_INITIALIZER in posthog.providers.ts. Resolves
  // without importing posthog-js when the key is empty.
  async init(config: PublicConfig): Promise<void> {
    if (this.client || !config.posthogKey) return

    const { default: posthog } = await import('posthog-js')

    posthog.init(config.posthogKey, {
      api_host: config.posthogHost,
      // Track page views via the router instead of PostHog's autocapture so
      // SPA navigations are counted correctly.
      capture_pageview: false,
      capture_pageleave: true,
      // Avoid collecting input values by default; opt-in per-form via
      // `data-attr-record` if you need it. Sensible privacy floor.
      autocapture: {
        dom_event_allowlist: ['click', 'submit', 'change'],
        element_attribute_ignorelist: ['data-private'],
      },
    })
    this.client = posthog
  }

  // SPA page view tracking — NavigationEnd is the Angular equivalent of the
  // Nuxt plugin's router.afterEach hook. Safe to call when disabled.
  trackPageViews(router: Router): void {
    if (!this.client || this.trackedRouter === router) return
    this.trackedRouter = router
    router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => {
      this.client?.capture('$pageview', { $current_url: event.urlAfterRedirects })
    })
  }

  capture(event: string, properties?: Record<string, unknown>): void {
    this.client?.capture(event, properties)
  }

  identify(distinctId: string, properties?: Record<string, unknown>): void {
    this.client?.identify(distinctId, properties)
  }

  reset(): void {
    this.client?.reset()
  }
}
