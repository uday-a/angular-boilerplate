// App i18n facade over @ngx-translate/core. Ported from
// nuxt-boilerplate's @nuxtjs/i18n setup (strategy: 'no_prefix', default
// locale 'en', locales en + es): switching locale only swaps the active
// language — the URL never changes (single-URL, no route prefixes).
//
// Two value adaptations vs the Nuxt JSON (keys are identical, enforced by
// locale-parity.spec.ts):
//   - `you{'@'}company.com` → `you@company.com` (vue-i18n `{'@'}` escapes a
//     literal @; @ has no special meaning in ngx-translate)
//   - `{code}` → `{{code}}` (ngx-translate interpolates {{ }} placeholders)
//
// Usage (dashboard/forms workers):
//   import { I18nService } from '@/app/core/i18n'
//   private readonly i18n = inject(I18nService)
//   this.i18n.t('auth.signIn.title')                       // → 'Welcome back'
//   this.i18n.t('auth.mfa.invalidCode', { code: '123456' }) // interpolates
//   this.i18n.setLocale('es')                               // switch language
//   this.i18n.locale$                                       // Observable<string>
import { Injectable, inject } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { BehaviorSubject, type Observable } from 'rxjs'

export const DEFAULT_LOCALE = 'en'
export const SUPPORTED_LOCALES = ['en', 'es'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly translate = inject(TranslateService)

  private readonly localeSubject = new BehaviorSubject<string>(DEFAULT_LOCALE)
  readonly locale$: Observable<string> = this.localeSubject.asObservable()

  get locale(): string {
    return this.localeSubject.value
  }

  // Synchronous lookup — returns the key itself when missing (same as
  // Nuxt's $t fallback). Default-locale translations are preloaded by the
  // APP_INITIALIZER in i18n.providers.ts, so t() is warm on first render.
  t(key: string, params?: Record<string, string | number>): string {
    return this.translate.instant(key, params)
  }

  // vue-i18n-style pluralisation for "zero | one | many" (or "one | many")
  // strings ported from the Nuxt JSON — ngx-translate has no plural syntax.
  // `n` is passed as a param, so `{{n}}` interpolates.
  tc(key: string, n: number, params?: Record<string, string | number>): string {
    const forms = this.t(key, { n, ...params }).split(' | ')
    if (forms.length < 2) return forms[0] ?? key
    const i = forms.length === 2 ? (n === 1 ? 0 : 1) : n === 0 ? 0 : n === 1 ? 1 : 2
    return forms[i] ?? forms[forms.length - 1]!
  }

  // Single-URL switch (no route change, like Nuxt's no_prefix strategy).
  // Unknown locales fall back to DEFAULT_LOCALE instead of breaking.
  setLocale(locale: string): void {
    const next = (SUPPORTED_LOCALES as readonly string[]).includes(locale) ? locale : DEFAULT_LOCALE
    this.localeSubject.next(next)
    this.translate.use(next).subscribe()
  }
}
