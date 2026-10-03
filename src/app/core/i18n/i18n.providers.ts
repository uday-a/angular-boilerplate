// i18n providers: @ngx-translate/core + HTTP loader + default-locale preload.
// Registered once in app.config.ts via provideI18n().
import { APP_INITIALIZER, type Provider } from '@angular/core'
import { TranslateService, provideTranslateService } from '@ngx-translate/core'
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader'
import { firstValueFrom } from 'rxjs'
import { DEFAULT_LOCALE } from './i18n.service'

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

export function provideI18n(): Provider[] {
  return [
    provideTranslateService({ lang: DEFAULT_LOCALE, fallbackLang: DEFAULT_LOCALE }),
    // Registers TranslateLoader → TranslateHttpLoader (last provider wins
    // over the NoOp default above) plus the prefix/suffix config. Served
    // from angular.json's src/assets → /assets mapping.
    ...provideTranslateHttpLoader({ prefix: i18nAssetsPrefix(), suffix: '.json' }),
    // Preload the default locale before first render so t() is warm on both
    // platforms (SSR included — translated SSR HTML, no hydration mismatch).
    // The loader already degrades a failed fetch to {} with a console.warn;
    // the rejection handler is belt + suspenders so SSR never fails to boot.
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: (translate: TranslateService) => () =>
        firstValueFrom(translate.use(DEFAULT_LOCALE)).then(
          () => undefined,
          () => undefined,
        ),
      deps: [TranslateService],
    },
  ]
}
