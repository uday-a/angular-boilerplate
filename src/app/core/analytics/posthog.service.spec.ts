// @vitest-environment jsdom
import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { NavigationEnd, type Router } from '@angular/router'
import { Subject } from 'rxjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_PUBLIC_CONFIG, type PublicConfig } from '../config/public-config'
import { PosthogService } from './posthog.service'

// posthog-js is dynamically imported by PosthogService.init(); the mock
// intercepts that import so no SDK code or network is involved.
vi.mock('posthog-js', () => ({
  default: { init: vi.fn(), capture: vi.fn(), identify: vi.fn(), reset: vi.fn() },
}))

// Imported AFTER vi.mock so this binding is the mock, not the real SDK.
import posthog from 'posthog-js'

const mockInit = posthog.init as unknown as ReturnType<typeof vi.fn>
const mockCapture = posthog.capture as unknown as ReturnType<typeof vi.fn>
const mockIdentify = posthog.identify as unknown as ReturnType<typeof vi.fn>

const withKey: PublicConfig = { ...DEFAULT_PUBLIC_CONFIG, posthogKey: 'phc_test_key', posthogHost: 'https://eu.i.posthog.com' }

function fakeRouter() {
  return { events: new Subject<unknown>() } as unknown as Router
}

describe('PosthogService', () => {
  let service: PosthogService

  beforeEach(() => {
    vi.clearAllMocks()
    // Zoneless so TestBed boots without zone.js (registry pattern).
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    service = TestBed.inject(PosthogService)
  })

  it('stays disabled when no key is configured (SDK never initialized)', async () => {
    await service.init(DEFAULT_PUBLIC_CONFIG)
    expect(service.enabled).toBe(false)
    expect(service.instance).toBeUndefined()
    expect(mockInit).not.toHaveBeenCalled()
  })

  it('capture/identify/reset no-op (never throw) when disabled', async () => {
    await service.init(DEFAULT_PUBLIC_CONFIG)
    expect(() => service.capture('user.upgraded', { plan: 'pro' })).not.toThrow()
    expect(() => service.identify('user-1')).not.toThrow()
    expect(() => service.reset()).not.toThrow()
    expect(mockCapture).not.toHaveBeenCalled()
  })

  it('inits the SDK with the Nuxt-ported options when a key is set', async () => {
    await service.init(withKey)
    expect(service.enabled).toBe(true)
    expect(mockInit).toHaveBeenCalledTimes(1)
    expect(mockInit).toHaveBeenCalledWith('phc_test_key', {
      api_host: 'https://eu.i.posthog.com',
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: {
        dom_event_allowlist: ['click', 'submit', 'change'],
        element_attribute_ignorelist: ['data-private'],
      },
    })
  })

  it('delegates capture/identify to the SDK once enabled', async () => {
    await service.init(withKey)
    service.capture('user.upgraded', { plan: 'pro' })
    service.identify('user-1', { email: 'a@b.co' })
    expect(mockCapture).toHaveBeenCalledWith('user.upgraded', { plan: 'pro' })
    expect(mockIdentify).toHaveBeenCalledWith('user-1', { email: 'a@b.co' })
  })

  it('captures $pageview on NavigationEnd (router-driven, like Nuxt afterEach)', async () => {
    await service.init(withKey)
    const router = fakeRouter()
    service.trackPageViews(router)
    router.events.next(new NavigationEnd(1, '/pricing', '/pricing'))
    expect(mockCapture).toHaveBeenCalledWith('$pageview', { $current_url: '/pricing' })
  })

  it('trackPageViews is a no-op when disabled and ignores non-navigation events', async () => {
    await service.init(DEFAULT_PUBLIC_CONFIG)
    const router = fakeRouter()
    service.trackPageViews(router)
    router.events.next(new NavigationEnd(1, '/pricing', '/pricing'))
    router.events.next({ type: 'other' })
    expect(mockCapture).not.toHaveBeenCalled()
  })
})
