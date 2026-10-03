// Four-stage password reset surface in a single card: request (email form) -> sent
// (check-your-inbox confirmation with an "Open reset form" demo button) -> reset (new
// password + confirm with match validation) -> done (success confirmation linking back to
// sign-in). Port of the Vue/React block 1:1 — emits `request` (email) when the link is
// asked for and `reset` (password) when the new password is set; the consumer wires the
// actual mail/db calls.
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core'
import { ArrowLeft, LucideAngularModule, MailCheck } from 'lucide-angular'
import { cn } from '@/app/core/utils/cn'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardFooterComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card/card.component'
import { UiInputComponent } from '@/app/components/ui/input/input.component'
import { UiLabelComponent } from '@/app/components/ui/label/label.component'

export type AuthPasswordResetStage = 'request' | 'sent' | 'reset' | 'done'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-auth-password-reset, [ui-auth-password-reset]',
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
    UiCardTitleComponent,
    UiInputComponent,
    UiLabelComponent,
  ],
  template: `
    <div data-slot="auth-password-reset" [class]="rootClass">
      <div ui-card class="w-full max-w-sm">
        @if (stage() === 'request') {
          <div ui-card-header class="text-center">
            <h2 ui-card-title class="text-2xl">Forgot password?</h2>
            <p ui-card-description>Enter your email and we&apos;ll send you a reset link.</p>
          </div>
          <div ui-card-content>
            <form class="space-y-4" (submit)="submitRequest($event)">
              <div class="grid gap-2">
                <label ui-label for="reset-email">Email</label>
                <ui-input
                  id="reset-email"
                  [value]="email()"
                  (valueChange)="email.set($event)"
                  type="email"
                  placeholder="you@company.com"
                  required
                />
              </div>
              <button ui-button type="submit" class="w-full">Send reset link</button>
            </form>
          </div>
          <div ui-card-footer class="justify-center">
            <a
              [href]="signInHref"
              class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
            >
              <lucide-icon [img]="ArrowLeft" class="size-3" />Back to sign in
            </a>
          </div>
        } @else if (stage() === 'sent') {
          <div ui-card-content class="space-y-4 pt-6 text-center">
            <div class="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-full">
              <lucide-icon [img]="MailCheck" class="size-6" />
            </div>
            <div class="space-y-1">
              <h3 class="text-lg font-semibold">Check your inbox</h3>
              <p class="text-muted-foreground text-sm">
                We&apos;ve sent a reset link to <span class="text-foreground font-medium">{{ email() }}</span
                >.
              </p>
            </div>
            <button ui-button variant="outline" class="w-full" (click)="stage.set('reset')">
              Open reset form (demo)
            </button>
            <button
              class="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
              (click)="stage.set('request')"
            >
              Wrong email?
            </button>
          </div>
        } @else if (stage() === 'reset') {
          <div ui-card-header class="text-center">
            <h2 ui-card-title class="text-2xl">Set new password</h2>
            <p ui-card-description>Pick a strong password you haven&apos;t used before.</p>
          </div>
          <div ui-card-content>
            <form class="space-y-4" (submit)="submitReset($event)">
              <div class="grid gap-2">
                <label ui-label for="reset-pw">New password</label>
                <ui-input
                  id="reset-pw"
                  [value]="password()"
                  (valueChange)="password.set($event)"
                  type="password"
                  autocomplete="new-password"
                  required
                />
              </div>
              <div class="grid gap-2">
                <label ui-label for="reset-confirm">Confirm password</label>
                <ui-input
                  id="reset-confirm"
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
              <button ui-button type="submit" class="w-full">Reset password</button>
            </form>
          </div>
        } @else {
          <div ui-card-content class="space-y-4 pt-6 text-center">
            <div class="bg-success/10 text-success mx-auto flex size-12 items-center justify-center rounded-full">
              <lucide-icon [img]="MailCheck" class="size-6" />
            </div>
            <div class="space-y-1">
              <h3 class="text-lg font-semibold">All set</h3>
              <p class="text-muted-foreground text-sm">
                Your password has been updated. You can now sign in with the new password.
              </p>
            </div>
            <a [href]="signInHref"><button ui-button class="w-full">Continue to sign in</button></a>
          </div>
        }
      </div>
    </div>
  `,
})
export class UiAuthPasswordResetComponent {
  protected readonly ArrowLeft = ArrowLeft
  protected readonly MailCheck = MailCheck

  @Input() signInHref = '/login'
  @Input('class') className?: string

  @Output() readonly request = new EventEmitter<string>()
  @Output() readonly reset = new EventEmitter<string>()

  readonly stage = signal<AuthPasswordResetStage>('request')
  readonly email = signal('')
  readonly password = signal('')
  readonly confirm = signal('')

  readonly passwordsMatch = computed(() => !this.confirm() || this.password() === this.confirm())

  get rootClass(): string {
    return cn('bg-background flex min-h-svh items-center justify-center p-6', this.className)
  }

  submitRequest(event: Event): void {
    event.preventDefault()
    if (!this.email()) return
    this.request.emit(this.email())
    this.stage.set('sent')
  }

  submitReset(event: Event): void {
    event.preventDefault()
    if (!this.password() || !this.passwordsMatch()) return
    this.reset.emit(this.password())
    this.stage.set('done')
  }
}
