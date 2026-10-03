// Sign-up — mirrors nuxt-boilerplate `app/pages/sign-up.vue` 1:1: email
// signup is unwired (mock alert), GitHub OAuth is the real path.
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { Router } from '@angular/router'
import { Title } from '@angular/platform-browser'
import { AuthService } from '@/app/core/auth/auth.service'
import {
  UiAuthSignUpComponent,
  type AuthSignUpOauthProvider,
  type AuthSignUpPayload,
} from '@/app/components/blocks/auth-sign-up'

@Component({
  selector: 'app-sign-up',
  imports: [UiAuthSignUpComponent],
  template: `
    <ui-auth-sign-up
      signInHref="/login"
      [oauthProviders]="['github']"
      (submit)="onSubmit($event)"
      (oauth)="onOauth($event)"
    />
  `,
})
export class SignUp implements OnInit {
  private readonly auth = inject(AuthService)
  private readonly router = inject(Router)
  private readonly title = inject(Title)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))

  ngOnInit(): void {
    this.title.setTitle('Create an account')
    if (!this.browser) return
    this.auth.fetch().subscribe((user) => {
      if (user) void this.router.navigateByUrl('/dashboard')
    })
  }

  onSubmit(_payload: AuthSignUpPayload): void {
    alert('Email signup is not wired. Use the GitHub button to continue.')
  }

  onOauth(provider: AuthSignUpOauthProvider): void {
    if (provider !== 'github') {
      alert('Only GitHub OAuth is wired right now.')
      return
    }
    this.auth.loginWithGithub('/dashboard')
  }
}
