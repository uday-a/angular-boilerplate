// @vitest-environment jsdom
import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { beforeEach, describe, expect, it } from 'vitest'
import { THEME_COOKIE, ThemeService } from './theme.service'

describe('ThemeService', () => {
  let service: ThemeService

  beforeEach(() => {
    document.cookie = `${THEME_COOKIE}=; Path=/; Max-Age=0`
    document.documentElement.classList.remove('dark')
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    service = TestBed.inject(ThemeService)
  })

  it('defaults to system theme', () => {
    expect(service.theme()).toBe('system')
    expect(['light', 'dark']).toContain(service.resolvedTheme())
  })

  it('setTheme persists to the uipkge-theme cookie (not localStorage)', () => {
    service.setTheme('dark')
    expect(service.theme()).toBe('dark')
    expect(service.resolvedTheme()).toBe('dark')
    expect(document.cookie).toContain(`${THEME_COOKIE}=dark`)
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    service.setTheme('light')
    expect(service.theme()).toBe('light')
    expect(document.cookie).toContain(`${THEME_COOKIE}=light`)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('reads the initial theme from the cookie', () => {
    document.cookie = `${THEME_COOKIE}=dark; Path=/`
    TestBed.resetTestingModule()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    const fresh = TestBed.inject(ThemeService)
    expect(fresh.theme()).toBe('dark')
  })
})
