// Theme state — mirrors nuxt-boilerplate's useTheme() + the registry
// ThemeService API (theme/systemTheme/resolvedTheme/setTheme) so the
// copied Sonner toaster works unchanged.
//
// Persisted to the `uipkge-theme` COOKIE (not localStorage) so SSR and the
// inline boot script in src/index.html agree. If you rename the key, change
// it in both places.
import { Injectable, computed, inject, signal } from '@angular/core'

export type Theme = 'light' | 'dark' | 'system'

export const THEME_COOKIE = 'uipkge-theme'

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

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly systemDark = signal(false)
  readonly theme = signal<Theme>('system')
  readonly systemTheme = computed<'light' | 'dark'>(() => (this.systemDark() ? 'dark' : 'light'))
  readonly resolvedTheme = computed<'light' | 'dark'>(() =>
    this.theme() === 'system' ? this.systemTheme() : (this.theme() as 'light' | 'dark'),
  )

  constructor() {
    if (typeof window === 'undefined') return
    try {
      const saved = readCookie(THEME_COOKIE) ?? window.localStorage.getItem(THEME_COOKIE)
      if (saved === 'light' || saved === 'dark' || saved === 'system') this.theme.set(saved)
    }
    catch {
      /* storage blocked (private mode): keep 'system' */
    }
    const mql = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (mql) {
      this.systemDark.set(mql.matches)
      mql.addEventListener('change', (e) => {
        this.systemDark.set(e.matches)
        this.apply()
      })
    }
    this.apply()
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme)
    try {
      writeCookie(THEME_COOKIE, theme)
    }
    catch {
      /* cookies blocked */
    }
    this.apply()
  }

  private apply(): void {
    if (typeof document === 'undefined') return
    const dark = this.resolvedTheme() === 'dark'
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  }
}

/** React's `useTheme()`: `const { theme, setTheme } = injectTheme()`. */
export function injectTheme(): ThemeService {
  return inject(ThemeService)
}
