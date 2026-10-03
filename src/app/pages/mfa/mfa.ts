// Two-step verification — mirrors nuxt-boilerplate `app/pages/mfa.vue` 1:1.
// Mock-only: verify logs, continue navigates to the dashboard.
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { Router } from '@angular/router'
import { Title } from '@angular/platform-browser'
import { AuthService } from '@/app/core/auth/auth.service'
import { UiAuthMfaComponent } from '@/app/components/blocks/auth-mfa'

@Component({
  selector: 'app-mfa',
  imports: [UiAuthMfaComponent],
  template: `
    <ui-auth-mfa
      continueHref="/dashboard"
      recoveryHref="#"
      (verify)="onVerify($event)"
      (continue)="onContinue()"
    />
  `,
})
export class Mfa implements OnInit {
  private readonly auth = inject(AuthService)
  private readonly router = inject(Router)
  private readonly title = inject(Title)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))

  ngOnInit(): void {
    this.title.setTitle('Two-step verification')
    if (!this.browser) return
    // MFA is part of the sign-in flow. Once a session exists, the user has
    // already cleared the bar — bounce them to the dashboard.
    this.auth.fetch().subscribe((user) => {
      if (user) void this.router.navigateByUrl('/dashboard')
    })
  }

  onVerify(code: string): void {
    console.warn('MFA verify (mock-only):', code)
  }

  onContinue(): void {
    void this.router.navigateByUrl('/dashboard')
  }
}
