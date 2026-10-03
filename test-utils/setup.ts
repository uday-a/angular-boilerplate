// Loaded before every spec (vitest setupFiles). The JIT compiler lets partially
// compiled Angular packages (@angular/common, @angular/forms) load, and jsdom specs
// get a TestBed environment so they can render real templates.
// (Copied from uipkge-ui/packages/registry-angular/test-utils/setup.ts.)
import '@angular/compiler'
import { afterEach } from 'vitest'
import { getTestBed } from '@angular/core/testing'
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing'

// Server specs import server/utils/env.ts, which is fail-fast like the Nuxt
// original (SESSION_PASSWORD required, 32+ chars). Vitest loads this setup
// file before any spec, so default the password here — real env still wins
// when set (CI, local .env shells).
if (!process.env['SESSION_PASSWORD']) {
  process.env['SESSION_PASSWORD'] = 'test-only-session-password-32-chars-min'
}

if (typeof document !== 'undefined') {
  getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting(), {
    teardown: { destroyAfterEach: true },
  })
  // Angular only auto-resets TestBed under jasmine/jest globals; vitest needs it explicitly.
  afterEach(() => getTestBed().resetTestingModule())
}
