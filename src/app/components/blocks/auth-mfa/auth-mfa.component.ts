// Two-step verification surface. 6-digit OTP pin input auto-submits on entry, shows
// verifying state and an inline error on mismatch, has a 30-second resend cooldown, and
// swaps to a Verified card with a Continue button on success. Port of the Vue/React block
// 1:1 — emits `verify` (code), `resend`, and `continue`; `demoCode` controls the value
// the built-in mock validator accepts.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core'
import { LucideAngularModule, RotateCw, ShieldCheck } from 'lucide-angular'
import { cn } from '@/app/core/utils/cn'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardFooterComponent,
  UiCardHeaderComponent,
} from '@/app/components/ui/card/card.component'
import {
  UiPinInputComponent,
  UiPinInputGroupComponent,
  UiPinInputSlotComponent,
} from '@/app/components/ui/pin-input/pin-input.component'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-auth-mfa, [ui-auth-mfa]',
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
    UiPinInputComponent,
    UiPinInputGroupComponent,
    UiPinInputSlotComponent,
  ],
  template: `
    <div data-slot="auth-mfa" [class]="rootClass">
      <div ui-card class="w-full max-w-sm">
        @if (!verified()) {
          <div ui-card-header class="text-center">
            <div class="bg-primary/10 text-primary mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
              <lucide-icon [img]="ShieldCheck" class="size-6" />
            </div>
            <h1 class="text-2xl leading-tight font-semibold tracking-tight">{{ title }}</h1>
            <p ui-card-description>{{ description }}</p>
          </div>
          <div ui-card-content class="space-y-4">
            <div class="flex justify-center">
              <ui-pin-input [value]="code()" (valueChange)="onCodeChange($event)" [disabled]="verifying()">
                <ui-pin-input-group>
                  @for (i of slots; track i) {
                    <ui-pin-input-slot [index]="i" />
                  }
                </ui-pin-input-group>
              </ui-pin-input>
            </div>
            @if (verifying()) {
              <p class="text-muted-foreground text-center text-sm">Verifying…</p>
            }
            @if (error()) {
              <p class="text-destructive text-center text-sm">{{ error() }}</p>
            }
            <div class="text-center">
              @if (resendIn() === 0) {
                <button
                  type="button"
                  class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline"
                  (click)="startResendCooldown()"
                >
                  <lucide-icon [img]="RotateCw" class="size-3" />Resend code
                </button>
              } @else {
                <p class="text-muted-foreground text-xs">Resend available in {{ resendIn() }}s</p>
              }
            </div>
          </div>
          <div ui-card-footer class="justify-center">
            <p class="text-muted-foreground text-xs">
              Lost your device?
              <a [href]="recoveryHref" class="text-foreground underline-offset-4 hover:underline"
                >Use a recovery code</a
              >
            </p>
          </div>
        } @else {
          <div ui-card-content class="space-y-4 pt-6 text-center">
            <div class="bg-success/10 text-success mx-auto flex size-12 items-center justify-center rounded-full">
              <lucide-icon [img]="ShieldCheck" class="size-6" />
            </div>
            <div class="space-y-1">
              <h3 class="text-lg font-semibold">Verified</h3>
              <p class="text-muted-foreground text-sm">You&apos;re all set. Continuing to your dashboard…</p>
            </div>
            <a [href]="continueHref" (click)="continue.emit()"><button ui-button class="w-full">Continue</button></a>
          </div>
        }
      </div>
    </div>
  `,
})
export class UiAuthMfaComponent {
  protected readonly RotateCw = RotateCw
  protected readonly ShieldCheck = ShieldCheck

  protected readonly slots = [0, 1, 2, 3, 4, 5]

  @Input() title = 'Two-step verification'
  @Input() description = 'Enter the 6-digit code from your authenticator app.'
  @Input() continueHref = '/'
  @Input() recoveryHref = '#'
  @Input() demoCode = '123456'
  @Input('class') className?: string

  @Output() readonly verify = new EventEmitter<string>()
  @Output() readonly resend = new EventEmitter<void>()
  @Output() readonly continue = new EventEmitter<void>()

  readonly code = signal('')
  readonly verifying = signal(false)
  readonly verified = signal(false)
  readonly error = signal('')
  readonly resendIn = signal(0)

  private verifyTimer: ReturnType<typeof setTimeout> | undefined
  private resendTimer: ReturnType<typeof setInterval> | undefined

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.verifyTimer)
      clearInterval(this.resendTimer)
    })
  }

  get rootClass(): string {
    return cn('bg-background flex min-h-svh items-center justify-center p-4', this.className)
  }

  onCodeChange(value: string): void {
    this.code.set(value)
    if (value.length === 6 && !this.verifying()) {
      this.error.set('')
      this.verifying.set(true)
      this.verify.emit(value)
      clearTimeout(this.verifyTimer)
      this.verifyTimer = setTimeout(() => {
        this.verifying.set(false)
        if (value === this.demoCode) {
          this.verified.set(true)
        } else {
          this.error.set(`Invalid code. Try ${this.demoCode} for the demo.`)
          this.code.set('')
        }
      }, 700)
    }
  }

  startResendCooldown(): void {
    this.resendIn.set(30)
    this.resend.emit()
    clearInterval(this.resendTimer)
    this.resendTimer = setInterval(() => {
      this.resendIn.update((prev) => {
        if (prev <= 1) {
          clearInterval(this.resendTimer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }
}
