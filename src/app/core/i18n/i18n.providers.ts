// i18n providers: @ngx-translate/core + HTTP loader + saved-locale restore.
// Registered once in app.config.ts via provideI18n().
import { PLATFORM_ID, inject, provideAppInitializer, type EnvironmentProviders, type Provider } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { provideTranslateService } from '@ngx-translate/core'
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader'
import { injectSsrContext } from '../config/ssr-context'
import { DEFAULT_LOCALE, I18nService, LOCALE_COOKIE } from './i18n.service'

// Loader prefix, per platform. Relative URLs have no base href during SSR
// (same constraint as home.ts's /api/ping gating), so the server build
// uses an absolute URL from SITE_URL — the dev default matches `ng serve`,
// and the production checklist already requires the real SITE_URL. Each
// bundle evaluates this once at import time (main.ts in the browser,
// main.server.ts in Node), so the `window` sniff always sees its own world.
export function i18nAssetsPrefix(): string {
  if (typeof window !== 'undefined') return './assets/i18n/'
  const siteUrl = typeof process !== 'undefined' ? process.env['SITE_URL'] : undefined
  return `${siteUrl ?? 'http://localhost:4201'}/assets/i18n/`
}

export function provideI18n(): (Provider | EnvironmentProviders)[] {
  return [
    provideTranslateService({ lang: DEFAULT_LOCALE, fallbackLang: DEFAULT_LOCALE }),
    // Registers TranslateLoader → TranslateHttpLoader (last provider wins
    // over the NoOp default above) plus the prefix/suffix config. Served
    // from angular.json's src/assets → /assets mapping.
    ...provideTranslateHttpLoader({ prefix: i18nAssetsPrefix(), suffix: '.json' }),
    // Restore the saved locale (cookie) before first render so t() is warm
    // on both platforms and SSR HTML is already translated, with a matching
    // `<html lang>`. A failed catalog fetch degrades to keys, never blocks boot.
    provideAppInitializer(() => {
      const browser = isPlatformBrowser(inject(PLATFORM_ID))
      const saved = browser
        ? document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`))?.[1]
        : injectSsrContext()?.locale
      return inject(I18nService).restore(saved)
    }),
  ]
}
