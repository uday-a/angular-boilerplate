// Route guard for pages that need a logged-in user. Mirrors
// nuxt-boilerplate/app/middleware/auth.ts: when no session is cached,
// fetch it once; when still anonymous, redirect to /login?next=<url>.
//
// Attach via `canActivate: [authGuard]` on any protected route.
// On the server (SSR) the guard allows navigation and defers the check
// to the client — relative-URL session fetches can't run during SSR.
import { PLATFORM_ID, inject } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { Router, type CanActivateFn } from '@angular/router'
import { map } from 'rxjs'
import { AuthService } from './auth.service'

export const authGuard: CanActivateFn = (_route, state) => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true
  const auth = inject(AuthService)
  const router = inject(Router)
  if (auth.loggedIn) return true
  return auth.fetch().pipe(
    map(user => (user ? true : router.createUrlTree(['/login'], { queryParams: { next: state.url } }))),
  )
}
