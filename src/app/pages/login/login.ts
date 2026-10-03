// Sign-in — mirrors nuxt-boilerplate `app/pages/login.vue` 1:1: AuthSignIn
// block (magic-link hijacks the email field; password is vestigial when
// GitHub OAuth + magic-link are the only paths), ?error= toast overlays for
// bounced magic-link tokens, and a floating demo affordance in demo mode.
//
// Toasts go through the registry Sonner `toast()` API (rendered by the
// global <ui-toaster> in app.html) instead of Nuxt's hand-rolled fixed divs.
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'
import { Title } from '@angular/platform-browser'
import { Sparkles, LucideAngularModule } from 'lucide-angular'
import { AuthService } from '@/app/core/auth/auth.service'
import { PUBLIC_CONFIG } from '@/app/core/config/public-config'
import { safeRedirectPath } from '@/app/core/utils/cn'
import { UiAuthSignInComponent, type AuthSignInPayload, type AuthSignInOauthProvider } from '@/app/components/blocks/auth-sign-in'
import { UiButtonComponent } from '@/app/components/ui/button'
import { toast } from '@/app/components/ui/sonner'
import { loginErrorMessage } from './login-errors'

@Component({
  selector: 'app-login',
  imports: [LucideAngularModule, UiAuthSignInComponent, UiButtonComponent],
  template: `
    <div class="bg-background relative flex min-h-svh items-center justify-center p-6 md:p-10">
      <div class="w-full max-w-sm">
        <ui-auth-sign-in
          forgotPasswordHref="/forgot-password"
          signUpHref="/sign-up"
          [oauthProviders]="['github']"
          (submit)="onSubmit($event)"
          (oauth)="onOauth($event)"
        />
      </div>

      <!-- Floating demo affordance — only shown when OAuth isn't configured.
           Positioned outside the auth card so it doesn't fight with the
           form's layout, and explicit about being a demo (not a real path). -->
      @if (demoMode()) {
        <div class="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div
            class="bg-background/95 ring-border/60 flex items-center gap-3 rounded-full border px-4 py-2 shadow-lg backdrop-blur ring-1"
          >
            <lucide-icon [img]="Sparkles" class="text-primary size-4" />
            <span class="text-muted-foreground text-sm"> Just looking around? Try the demo workspace. </span>
            <button
              ui-button
              size="sm"
              [disabled]="demoLoading()"
              (click)="signInAsDemo()"
            >
              {{ demoLoading() ? 'Signing in…' : 'Continue as demo user' }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class Login implements OnInit {
  protected readonly Sparkles = Sparkles

  private readonly auth = inject(AuthService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly title = inject(Title)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly publicConfig = inject(PUBLIC_CONFIG)

  // Runtime demo flag from GET /api/config (mirrors Nuxt's
  // runtimeConfig.public.demoMode). Read in ngOnInit (browser only) so SSR
  // and the first client render agree (no hydration mismatch), then flips
  // on when the server says demo mode is live.
  protected readonly demoMode = signal(false)
  protected readonly demoLoading = signal(false)
  protected readonly sending = signal(false)

  private next(): string {
    return safeRedirectPath(this.route.snapshot.queryParamMap.get('next') ?? '/dashboard')
  }

  ngOnInit(): void {
    this.title.setTitle('Sign in')
    if (!this.browser) return
    this.demoMode.set(this.publicConfig.demoMode)
    // Already signed in? Skip the form.
    this.auth.fetch().subscribe((user) => {
      if (user) void this.router.navigateByUrl(this.next())
    })
    // Bounced magic-link / OAuth errors surface as a toast overlay.
    const banner = loginErrorMessage(this.route.snapshot.queryParamMap.get('error'))
    if (banner) toast.error(banner)
  }

  // Magic-link request triggered by the AuthSignIn form's submit event.
  // We hijack the email field and ignore the password — magic-link IS the
  // auth, no password needed.
  onSubmit(payload: AuthSignInPayload): void {
    if (!this.browser || this.sending()) return
    this.sending.set(true)
    this.auth.requestMagicLink(payload.email).subscribe((res) => {
      this.sending.set(false)
      if (res.ok) {
        toast.success(`Sign-in link sent to ${payload.email}. Check your inbox.`)
      } else {
        toast.error(res.message)
      }
    })
  }

  onOauth(provider: AuthSignInOauthProvider): void {
    if (provider !== 'github') {
      alert('Only GitHub OAuth is wired right now.')
      return
    }
    // Hard navigation so the browser follows the OAuth redirect to GitHub.
    this.auth.loginWithGithub(this.next())
  }

  signInAsDemo(): void {
    if (!this.browser || this.demoLoading()) return
    this.demoLoading.set(true)
    this.auth.demo().subscribe((ok) => {
      this.demoLoading.set(false)
      if (ok) void this.router.navigateByUrl(this.next())
      else toast.error('Demo sign-in failed. Is demo mode enabled on the server?')
    })
  }
}
