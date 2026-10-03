// Client-side auth state. Mirrors nuxt-boilerplate's useUserSession()
// (loggedIn/user/fetch) on Angular signals-free RxJS:
//
//   - user$ / loggedIn$ — session state (null = anonymous)
//   - fetch() — GET /api/me, refresh user$ (browser only)
//   - requestMagicLink(email) — POST /auth/magic-link
//   - loginWithGithub(next?) — hard navigation to /auth/github
//   - demo() — POST /auth/demo + fetch (demo mode only)
//   - logout() — POST /auth/logout, clear user$, navigate /login
//
// SSR safety: every method no-ops (or returns a cold observable) on the
// server — relative-URL HttpClient calls have no base href during SSR.
// Guards defer to the client for the same reason (see auth.guard.ts).
import { Injectable, PLATFORM_ID, inject } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { Router } from '@angular/router'
import { BehaviorSubject, catchError, map, of, switchMap, tap, type Observable } from 'rxjs'
import { safeRedirectPath } from '../utils/cn'

// Session user shape — mirrors server/auth/session.ts SessionUser.
// Role stays `string` (not the DB union) so the client never imports
// server types; guards compare against route data strings.
export interface AuthUser {
  id: number
  login: string
  name: string
  email: string | null
  avatar: string | null
  role: string
}

interface MeEnvelope {
  ok: boolean
  data?: { user: AuthUser, loggedInAt: number }
}

interface MagicLinkEnvelope {
  ok: boolean
  data?: { ok: boolean, expiresInMin: number }
  error?: { message: string }
}

export type MagicLinkResult
  = | { ok: true, expiresInMin: number }
    | { ok: false, message: string }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient)
  private readonly router = inject(Router)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))

  private readonly userSubject = new BehaviorSubject<AuthUser | null>(null)
  readonly user$: Observable<AuthUser | null> = this.userSubject.asObservable()
  readonly loggedIn$: Observable<boolean> = this.user$.pipe(map(u => u !== null))

  get user(): AuthUser | null {
    return this.userSubject.value
  }

  get loggedIn(): boolean {
    return this.user !== null
  }

  // Refresh session state from GET /api/me. Resolves null when anonymous
  // (or on the server, where relative URLs can't resolve).
  fetch(): Observable<AuthUser | null> {
    if (!this.browser) return of(this.userSubject.value)
    return this.http.get<MeEnvelope>('/api/me').pipe(
      map(res => (res.ok && res.data ? res.data.user : null)),
      tap(user => this.userSubject.next(user)),
      catchError(() => {
        this.userSubject.next(null)
        return of(null)
      }),
    )
  }

  // Request a magic-link email. Resolves { ok, expiresInMin } on success.
  requestMagicLink(email: string): Observable<MagicLinkResult> {
    if (!this.browser) return of({ ok: false, message: 'Unavailable during server rendering' })
    return this.http.post<MagicLinkEnvelope>('/auth/magic-link', { email }).pipe(
      map((res): MagicLinkResult => {
        if (res.ok && res.data) return { ok: true, expiresInMin: res.data.expiresInMin }
        return { ok: false, message: res.error?.message ?? 'Failed to send link' }
      }),
      catchError((err): Observable<MagicLinkResult> => {
        const message = (err as { error?: { error?: { message?: string } } }).error?.error?.message
          ?? 'Failed to send link'
        return of({ ok: false, message })
      }),
    )
  }

  // Hard navigation so the browser follows the OAuth redirect to GitHub.
  loginWithGithub(next = '/dashboard'): void {
    if (!this.browser) return
    window.location.href = `/auth/github?next=${encodeURIComponent(safeRedirectPath(next))}`
  }

  // Demo sign-in (demo mode only). POSTs /auth/demo, refreshes user$,
  // resolves true when a session was minted.
  demo(): Observable<boolean> {
    if (!this.browser) return of(false)
    return this.http.post<{ ok: boolean }>('/auth/demo', {}).pipe(
      map(res => res?.ok === true),
      catchError(() => of(false)),
      switchMap(ok => (ok ? this.fetch().pipe(map(u => u !== null)) : of(false))),
    )
  }

  // POSTs /auth/logout (responseType text — the endpoint 302s to /login's
  // HTML, which would fail JSON parsing), clears user$, navigates /login.
  // The session cookie is cleared server-side even if the request errors.
  logout(): Observable<void> {
    if (!this.browser) return of(undefined)
    return this.http.post('/auth/logout', {}, { responseType: 'text' }).pipe(
      map(() => undefined),
      catchError(() => of(undefined)),
      tap(() => {
        this.userSubject.next(null)
        void this.router.navigate(['/login'])
      }),
    )
  }
}
