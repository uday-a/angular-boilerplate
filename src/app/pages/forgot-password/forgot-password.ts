// Sign-in link (password reset) — mirrors nuxt-boilerplate
// `app/pages/forgot-password.vue` 1:1: the AuthPasswordReset block's request
// stage sends a magic-link; the /reset stage is inert (magic-link IS the
// recovery). Errors surface via Sonner toast so the card's stage machine
// stays intact for clean registry updates.
// Signed-in visitors are redirected by guestGuard (+ server/utils/auth-redirect.ts on SSR).
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { Title } from '@angular/platform-browser'
import { AuthService } from '@/app/core/auth/auth.service'
import { UiAuthPasswordResetComponent } from '@/app/components/blocks/auth-password-reset'
import { toast } from '@/app/components/ui/sonner'

@Component({
  selector: 'app-forgot-password',
  imports: [UiAuthPasswordResetComponent],
  template: `
    <ui-auth-password-reset
      signInHref="/login"
      (request)="onRequest($event)"
      (reset)="onReset($event)"
    />
  `,
})
export class ForgotPassword implements OnInit {
  private readonly auth = inject(AuthService)
  private readonly title = inject(Title)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))

  ngOnInit(): void {
    this.title.setTitle('Sign-in link')
  }

  onRequest(email: string): void {
    if (!this.browser) return
    this.auth.requestMagicLink(email).subscribe((res) => {
      if (!res.ok) toast.error(res.message)
      // Success needs no toast — the block already flips to its "Check your
      // inbox" sent stage.
    })
  }

  // The /reset path is unused — magic-link IS the recovery. Keep the
  // component's submit slot inert.
  onReset(_password: string): void {
    // intentional: with magic-link, there is no password to reset.
  }
}
