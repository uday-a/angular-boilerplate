// Colour theme + corner radius for the whole app (header theme
// customiser). Port of nuxt-boilerplate's `useColorTheme()` adapted to
// Angular signals.
//
// Cookie-backed (`uipkge-color-theme` + `uipkge-radius`, NOT localStorage)
// and applied on `<html>` (`data-color-theme` + `--radius`), so the first
// paint is already themed — the inline boot script in `src/index.html`
// reads the same cookies. If you rename a key, change it in both places.
//
// SSR safety: every DOM touch is gated on `typeof document` — the service
// is injectable during SSR but no-ops there.
import { Injectable, computed, signal } from '@angular/core'
import { COLOR_THEME_DEFAULT, COLOR_THEME_IDS, RADIUS_DEFAULT, RADIUS_OPTIONS } from './color-themes'

export const COLOR_THEME_COOKIE = 'uipkge-color-theme'
export const RADIUS_COOKIE = 'uipkge-radius'

function readCookie(key: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]+)`))
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

function writeCookie(key: string, value: string): void {
  if (typeof document === 'undefined') return
  const year = 60 * 60 * 24 * 365
  document.cookie = `${key}=${encodeURIComponent(value)}; Path=/; Max-Age=${year}; SameSite=Lax`
}

function normalizeTheme(raw: string | null): string {
  return raw && COLOR_THEME_IDS.has(raw) ? raw : COLOR_THEME_DEFAULT
}

function normalizeRadius(raw: string | null): string {
  const v = String(raw ?? '')
  return (RADIUS_OPTIONS as readonly string[]).includes(v) ? v : RADIUS_DEFAULT
}

export function applyColorTheme(theme: string, radius: string): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === COLOR_THEME_DEFAULT) root.removeAttribute('data-color-theme')
  else root.setAttribute('data-color-theme', theme)
  root.style.setProperty('--radius', `${radius}rem`)
}

@Injectable({ providedIn: 'root' })
export class ColorThemeService {
  private readonly themeSignal = signal<string>(COLOR_THEME_DEFAULT)
  private readonly radiusSignal = signal<string>(RADIUS_DEFAULT)

  readonly colorTheme = computed(() => this.themeSignal())
  readonly radius = computed(() => this.radiusSignal())

  constructor() {
    if (typeof document === 'undefined') return
    this.themeSignal.set(normalizeTheme(readCookie(COLOR_THEME_COOKIE)))
    this.radiusSignal.set(normalizeRadius(readCookie(RADIUS_COOKIE)))
    this.apply()
  }

  setColorTheme(theme: string): void {
    this.themeSignal.set(normalizeTheme(theme))
    try {
      writeCookie(COLOR_THEME_COOKIE, this.themeSignal())
    } catch {
      /* cookies blocked */
    }
    this.apply()
  }

  setRadius(radius: string): void {
    this.radiusSignal.set(normalizeRadius(radius))
    try {
      writeCookie(RADIUS_COOKIE, this.radiusSignal())
    } catch {
      /* cookies blocked */
    }
    this.apply()
  }

  reset(): void {
    this.setColorTheme(COLOR_THEME_DEFAULT)
    this.setRadius(RADIUS_DEFAULT)
  }

  private apply(): void {
    applyColorTheme(this.themeSignal(), this.radiusSignal())
  }
}
