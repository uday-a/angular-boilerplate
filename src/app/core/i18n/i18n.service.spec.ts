// @vitest-environment jsdom
import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { TranslateService, provideTranslateService } from '@ngx-translate/core'
import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_LOCALE, I18nService } from './i18n.service'

describe('I18nService', () => {
  let i18n: I18nService
  let translate: TranslateService

  beforeEach(() => {
    TestBed.configureTestingModule({
      // No loader configured → NoOp loader (no HTTP); translations are
      // seeded directly into the store below. Zoneless so TestBed boots
      // without zone.js (registry pattern).
      providers: [provideZonelessChangeDetection(), provideTranslateService({ fallbackLang: 'en' })],
    })
    translate = TestBed.inject(TranslateService)
    i18n = TestBed.inject(I18nService)

    translate.setTranslation('en', {
      auth: { signIn: { title: 'Welcome back' }, mfa: { invalidCode: 'Invalid code. Try {{code}} for the demo.' } },
      admin: { members: 'no members | 1 member | {{n}} members', two: '1 change | {{n}} changes' },
    })
    translate.setTranslation('es', {
      auth: { signIn: { title: 'Bienvenido de nuevo' } },
    })
    i18n.setLocale('en')
  })

  it('defaults to the en locale', () => {
    expect(i18n.locale).toBe(DEFAULT_LOCALE)
    expect(i18n.locale).toBe('en')
  })

  it('t() resolves nested keys', () => {
    expect(i18n.t('auth.signIn.title')).toBe('Welcome back')
  })

  it('t() interpolates {{ }} params', () => {
    expect(i18n.t('auth.mfa.invalidCode', { code: '123456' })).toBe('Invalid code. Try 123456 for the demo.')
  })

  // Nuxt strings use vue-i18n "zero | one | many" plurals; "1 members" was the bug.
  it('tc() picks the vue-i18n plural form', () => {
    expect(i18n.tc('admin.members', 0)).toBe('no members')
    expect(i18n.tc('admin.members', 1)).toBe('1 member')
    expect(i18n.tc('admin.members', 5)).toBe('5 members')
    expect(i18n.tc('admin.two', 1)).toBe('1 change')
    expect(i18n.tc('admin.two', 0)).toBe('0 changes')
  })

  it('t() returns the key itself when missing', () => {
    expect(i18n.t('nope.missing')).toBe('nope.missing')
  })

  it('setLocale() switches the active language (single URL, no routing)', () => {
    i18n.setLocale('es')
    expect(i18n.locale).toBe('es')
    expect(i18n.t('auth.signIn.title')).toBe('Bienvenido de nuevo')
  })

  it('setLocale() falls back to en for unknown locales', () => {
    i18n.setLocale('es')
    i18n.setLocale('fr')
    expect(i18n.locale).toBe('en')
    expect(i18n.t('auth.signIn.title')).toBe('Welcome back')
  })

  it('locale$ emits the initial locale and every switch', () => {
    const seen: string[] = []
    const sub = i18n.locale$.subscribe((locale) => seen.push(locale))
    i18n.setLocale('es')
    i18n.setLocale('fr')
    sub.unsubscribe()
    expect(seen).toEqual(['en', 'es', 'en'])
  })
})
