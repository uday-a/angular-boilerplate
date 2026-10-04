// Full-page sign-up surface: name/email/password/confirm form with password-match
// validation, T&C acceptance gate, GitHub + Google OAuth row, and a link back to
// sign-in. Port of the Vue/React block 1:1 — emits `submit` with the validated
// payload and `oauth` with the chosen provider; the consumer wires the actual auth call.
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core'
import { Github, LucideAngularModule } from 'lucide-angular'
import { cn } from '@/app/core/utils/cn'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardFooterComponent,
  UiCardHeaderComponent,
} from '@/app/components/ui/card/card.component'
import { UiCheckboxComponent } from '@/app/components/ui/checkbox/checkbox.component'
import { UiInputComponent } from '@/app/components/ui/input/input.component'
import { UiLabelComponent } from '@/app/components/ui/label/label.component'
import { UiSeparatorComponent } from '@/app/components/ui/separator/separator.component'

export type AuthSignUpOauthProvider = 'github' | 'google'

export interface AuthSignUpPayload {
  name: string
  email: string
  password: string
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-auth-sign-up, [ui-auth-sign-up]',
  standalone: true,
  // The block renders its own full-page root <div>: keep the host out of layout.
  host: { '[attr.class]': '"contents"' },
  imports: [
    LucideAngularModule,
    UiButtonComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardFooterComponent,
    UiCardHeaderComponent,
    UiCheckboxComponent,
    UiInputComponent,
    UiLabelComponent,
    UiSeparatorComponent,
  ],
  template: `
    <div data-slot="auth-sign-up" [class]="rootClass">
      <div ui-card class="w-full max-w-md">
        <div ui-card-header class="text-center">
          <h1 class="text-2xl leading-tight font-semibold tracking-tight">{{ title }}</h1>
          <p ui-card-description>{{ description }}</p>
        </div>
        <div ui-card-content>
          <form method="post" class="space-y-4" (submit)="onSubmit($event)">
            <div class="grid gap-2">
              <label ui-label for="signup-name">Full name</label>
              <ui-input
                id="signup-name"
                [value]="name()"
                (valueChange)="name.set($event)"
                autocomplete="name"
                required
              />
            </div>
            <div class="grid gap-2">
              <label ui-label for="signup-email">Email</label>
              <ui-input
                id="signup-email"
                [value]="email()"
                (valueChange)="email.set($event)"
                type="email"
                placeholder="you@company.com"
                autocomplete="email"
                required
              />
            </div>
            <div class="grid gap-2">
              <label ui-label for="signup-password">Password</label>
              <ui-input
                id="signup-password"
                [value]="password()"
                (valueChange)="password.set($event)"
                type="password"
                autocomplete="new-password"
                required
              />
              <p class="text-muted-foreground text-xs">8+ characters, mix of letters, numbers and symbols.</p>
            </div>
            <div class="grid gap-2">
              <label ui-label for="signup-confirm">Confirm password</label>
              <ui-input
                id="signup-confirm"
                [value]="confirm()"
                (valueChange)="confirm.set($event)"
                type="password"
                autocomplete="new-password"
                [aria-invalid]="!passwordsMatch()"
                required
              />
              @if (!passwordsMatch()) {
                <p class="text-destructive text-xs">Passwords don&apos;t match.</p>
              }
            </div>
            <div class="flex items-start gap-2">
              <ui-checkbox id="signup-accept" [checked]="accept()" (checkedChange)="accept.set(!!$event)" />
              <label ui-label for="signup-accept" class="text-sm leading-snug font-normal">
                <!-- One span: the label is flex, so bare text + links would lay out as columns at 375px. -->
                <span>
                  I agree to the
                  <a [href]="termsHref" class="text-foreground underline-offset-4 hover:underline">Terms of Service</a>
                  and
                  <a [href]="privacyHref" class="text-foreground underline-offset-4 hover:underline">Privacy Policy</a>.
                </span>
              </label>
            </div>
            <button ui-button type="submit" class="w-full" [disabled]="!canSubmit()">Create account</button>
          </form>

          @if (oauthProviders.length > 0) {
            <div class="my-6 flex items-center gap-3">
              <ui-separator class="flex-1" />
              <span class="text-muted-foreground text-xs uppercase">or continue with</span>
              <ui-separator class="flex-1" />
            </div>
            <div class="grid gap-2" [class.sm:grid-cols-2]="oauthProviders.length > 1">
              @if (showsProvider('github')) {
                <button ui-button variant="outline" type="button" (click)="oauth.emit('github')">
                  <lucide-icon [img]="Github" class="mr-2 size-4" />
                  GitHub
                </button>
              }
              @if (showsProvider('google')) {
                <button ui-button variant="outline" type="button" (click)="oauth.emit('google')">
                  <svg class="mr-2 size-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z"
                    />
                    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 010-4.2V7.06H2.18a11 11 0 000 9.88l3.66-2.84z" />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 002.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
                    />
                  </svg>
                  Google
                </button>
              }
            </div>
          }
        </div>
        <div ui-card-footer class="justify-center">
          <p class="text-muted-foreground text-sm">
            Already have an account?
            <a [href]="signInHref" class="text-foreground font-medium underline-offset-4 hover:underline">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class UiAuthSignUpComponent {
  protected readonly Github = Github

  @Input() title = 'Create your account'
  @Input() description = 'Start your 14-day free trial. No credit card required.'
  @Input() signInHref = '/login'
  @Input() termsHref = '/terms'
  @Input() privacyHref = '/privacy'
  @Input() oauthProviders: AuthSignUpOauthProvider[] = ['github', 'google']
  @Input('class') className?: string

  @Output() readonly submit = new EventEmitter<AuthSignUpPayload>()
  @Output() readonly oauth = new EventEmitter<AuthSignUpOauthProvider>()

  readonly name = signal('')
  readonly email = signal('')
  readonly password = signal('')
  readonly confirm = signal('')
  readonly accept = signal(false)

  readonly passwordsMatch = computed(() => !this.confirm() || this.password() === this.confirm())
  readonly canSubmit = computed(() =>
    Boolean(this.name() && this.email() && this.password() && this.passwordsMatch() && this.accept()),
  )

  get rootClass(): string {
    return cn('bg-background flex min-h-svh items-center justify-center p-4', this.className)
  }

  showsProvider(provider: AuthSignUpOauthProvider): boolean {
    return this.oauthProviders.includes(provider)
  }

  onSubmit(event: Event): void {
    event.preventDefault()
    if (!this.canSubmit()) return
    this.submit.emit({ name: this.name(), email: this.email(), password: this.password() })
  }
}
