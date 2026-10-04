// Route guards for signed-in / signed-out pages. Mirror
// nuxt-boilerplate/app/middleware/auth.ts and the login/sign-up pages'
// `if (loggedIn) navigateTo('/dashboard')`. The session is resolved at app
// start (AuthService.init — from the SSR context on the server), so these
// work on both platforms; server/utils/auth-redirect.ts applies the same
// redirects as real 302s before Angular renders.
import { inject } from '@angular/core'
import { Router, type CanActivateFn } from '@angular/router'
import { map } from 'rxjs'
import { AuthService } from './auth.service'

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService)
  const router = inject(Router)
  if (auth.loggedIn) return true
  return auth.fetch().pipe(
    map(user => (user ? true : router.createUrlTree(['/login'], { queryParams: { next: state.url } }))),
  )
}

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService)
  return auth.loggedIn ? inject(Router).createUrlTree(['/dashboard']) : true
}
