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
import { DOCUMENT, Injectable, PLATFORM_ID, inject, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { TranslateService } from '@ngx-translate/core'
import { BehaviorSubject, firstValueFrom, type Observable } from 'rxjs'

export const DEFAULT_LOCALE = 'en'
export const SUPPORTED_LOCALES = ['en', 'es'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

// Persisted choice. Read on SSR (i18n.providers.ts) so the first paint is
// already in the chosen language, and `<html lang>` matches.
export const LOCALE_COOKIE = 'uipkge-locale'

export function normalizeLocale(locale: string | null | undefined): SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale ?? '') ? (locale as SupportedLocale) : DEFAULT_LOCALE
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly translate = inject(TranslateService)
  private readonly document = inject(DOCUMENT)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))

  private readonly localeSubject = new BehaviorSubject<string>(DEFAULT_LOCALE)
  readonly locale$: Observable<string> = this.localeSubject.asObservable()

  // Active language, set once its catalog has loaded — read it inside a
  // computed() to re-translate on switch (t() is not reactive by itself).
  readonly lang = signal<string>(DEFAULT_LOCALE)

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
  // Persists to the locale cookie and updates `<html lang>`.
  setLocale(locale: string): void {
    void this.use(locale)
    if (this.browser) this.document.cookie = `${LOCALE_COOKIE}=${this.locale}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`
  }

  // Boot-time restore (i18n.providers.ts): the saved locale — from the
  // cookie in the browser, from the SSR context on the server — resolves
  // before first render, so SSR HTML is already translated.
  async restore(saved: string | null | undefined): Promise<void> {
    await this.use(saved).catch(() => undefined)
  }

  private use(locale: string | null | undefined): Promise<unknown> {
    const next = normalizeLocale(locale)
    this.localeSubject.next(next)
    this.document.documentElement.lang = next
    return firstValueFrom(this.translate.use(next)).then(() => this.lang.set(next))
  }
}
