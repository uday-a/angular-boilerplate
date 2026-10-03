// Route guard for role-gated pages. Mirrors
// nuxt-boilerplate/app/middleware/role.ts.
//
// Attach via:
//
//   { path: 'admin', canActivate: [roleGuard], data: { requiredRole: 'admin' } }
//   { path: 'x', canActivate: [roleGuard], data: { requiredRole: ['admin', 'editor'] } }
//
// UX-only: this stops a flash of forbidden content and gives users a clean
// redirect. The real enforcement lives in server-side guards (requireRole)
// — never trust client-side checks for authorisation, only for navigation
// polish.
//
// Like the server guards this reads role off the session, so a fresh
// demotion won't take effect until the next sign-in. Anonymous users go to
// /login?next=<url>; wrong-role users go to /dashboard?error=forbidden.
// On the server (SSR) the guard allows navigation: AuthService can't read
// the session there (relative-URL fetches have no base href). The SSR half
// is server/utils/auth-redirect.ts, which reads the sealed session cookie
// and applies the same two redirects before Angular renders /admin/*.
import { PLATFORM_ID, inject } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { Router, type CanActivateFn } from '@angular/router'
import { map } from 'rxjs'
import { AuthService, type AuthUser } from './auth.service'

export const roleGuard: CanActivateFn = (route, state) => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true
  const auth = inject(AuthService)
  const router = inject(Router)

  const check = (user: AuthUser | null) => {
    if (!user) {
      return router.createUrlTree(['/login'], { queryParams: { next: state.url } })
    }
    const required = route.data['requiredRole'] as string | string[] | undefined
    if (!required) return true
    const allowed = Array.isArray(required) ? required : [required]
    if (!allowed.includes(user.role)) {
      return router.createUrlTree(['/dashboard'], { queryParams: { error: 'forbidden' } })
    }
    return true
  }

  if (auth.loggedIn) return check(auth.user)
  return auth.fetch().pipe(map(check))
}
