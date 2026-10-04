// Forms — template-driven form demo. Ports nuxt-boilerplate's
// app/pages/dashboard/forms.vue. State lives in signals; primitives bind via
// the ngModel split form ([ngModel] + ngModelChange) so OnPush updates.
//
// i18n: the locale switch uses the real I18nService from
// '@/app/core/i18n' (landed by the i18n worker; single-URL switch, no Save
// needed — same UX as the nuxt locale cookie flush).
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { Check, LoaderCircle } from 'lucide-angular'
import { LucideAngularModule } from 'lucide-angular'
import { I18nService, SUPPORTED_LOCALES, injectPageTitle } from '@/app/core/i18n'
import { formatMoney } from '@/app/core/utils/cn'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card/card.component'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import { UiInputComponent } from '@/app/components/ui/input/input.component'
import { UiLabelComponent } from '@/app/components/ui/label/label.component'
import { UiTextareaComponent } from '@/app/components/ui/textarea/textarea.component'
import {
  UiSelectComponent,
  UiSelectContentComponent,
  UiSelectItemComponent,
  UiSelectTriggerComponent,
  UiSelectValueComponent,
} from '@/app/components/ui/select/select.component'
import { UiSwitchComponent } from '@/app/components/ui/switch/switch.component'
import { UiCheckboxComponent } from '@/app/components/ui/checkbox/checkbox.component'
import {
  UiRadioGroupComponent,
  UiRadioGroupItemComponent,
} from '@/app/components/ui/radio-group/radio-group.component'
import { UiSliderComponent } from '@/app/components/ui/slider/slider.component'
import { UiSeparatorComponent } from '@/app/components/ui/separator/separator.component'
import {
  UiPageBodyComponent,
  UiPageComponent,
  UiPageHeaderComponent,
  UiPageHeaderHeadingComponent,
} from '@/app/components/ui/page'

const NOTIFICATION_OPTIONS = [
  { value: 'product', label: 'Product updates' },
  { value: 'security', label: 'Security alerts' },
  { value: 'billing', label: 'Billing & receipts' },
  { value: 'marketing', label: 'Marketing & promotions' },
]

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-forms',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    UiButtonComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
    UiCheckboxComponent,
    UiInputComponent,
    UiLabelComponent,
    UiPageBodyComponent,
    UiPageComponent,
    UiPageHeaderComponent,
    UiPageHeaderHeadingComponent,
    UiRadioGroupComponent,
    UiRadioGroupItemComponent,
    UiSelectComponent,
    UiSelectContentComponent,
    UiSelectItemComponent,
    UiSelectTriggerComponent,
    UiSelectValueComponent,
    UiSeparatorComponent,
    UiSliderComponent,
    UiSwitchComponent,
    UiTextareaComponent,
  ],
  template: `
    <form (submit)="onSubmit($event)">
      <ui-page>
        <ui-page-header>
          <ui-page-header-heading
            [title]="pageTitle()"
            description="Profile, account, notification and billing form patterns."
          />
        </ui-page-header>

        <ui-page-body class="max-w-3xl space-y-4">
          <div ui-card>
            <div ui-card-header>
              <h3 ui-card-title class="text-base">Profile</h3>
              <p ui-card-description>Public information shown alongside your activity.</p>
            </div>
            <div ui-card-content class="grid gap-4 sm:grid-cols-2">
              <div class="grid gap-2">
                <ui-label for="name">Full name</ui-label>
                <ui-input
                  id="name"
                  [ngModel]="profile().name"
                  (ngModelChange)="patchProfile('name', $event)"
                  name="name"
                  placeholder="Jane Doe"
                />
              </div>
              <div class="grid gap-2">
                <ui-label for="email">Work email</ui-label>
                <ui-input
                  id="email"
                  [ngModel]="profile().email"
                  (ngModelChange)="patchProfile('email', $event)"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                />
              </div>
              <div class="grid gap-2 sm:col-span-2">
                <ui-label for="bio">Short bio</ui-label>
                <ui-textarea
                  id="bio"
                  [ngModel]="profile().bio"
                  (ngModelChange)="patchProfile('bio', $event)"
                  name="bio"
                  [rows]="3"
                  [maxlength]="280"
                  placeholder="Tell people what you work on…"
                />
                <p class="text-muted-foreground text-xs tabular-nums">{{ profile().bio.length }} / 280</p>
              </div>
            </div>
          </div>

          <div ui-card>
            <div ui-card-header>
              <h3 ui-card-title class="text-base">Account</h3>
              <p ui-card-description>Security and visibility settings.</p>
            </div>
            <div ui-card-content class="grid gap-4 sm:grid-cols-2">
              <div class="grid gap-2">
                <ui-label for="password">New password</ui-label>
                <ui-input
                  id="password"
                  [ngModel]="account().password"
                  (ngModelChange)="patchAccount('password', $event)"
                  name="password"
                  type="password"
                  placeholder="Leave blank to keep current"
                  showPasswordToggle
                />
              </div>
              <div class="grid gap-2">
                <ui-label for="tz">Timezone</ui-label>
                <ui-select [value]="account().timezone" (valueChange)="patchAccount('timezone', $event)">
                  <ui-select-trigger id="tz">
                    <ui-select-value placeholder="Pick a timezone" />
                  </ui-select-trigger>
                  <ui-select-content>
                    <ui-select-item value="utc">UTC · Coordinated Universal Time</ui-select-item>
                    <ui-select-item value="pst">PST · Pacific (UTC−8)</ui-select-item>
                    <ui-select-item value="est">EST · Eastern (UTC−5)</ui-select-item>
                    <ui-select-item value="cet">CET · Central European (UTC+1)</ui-select-item>
                    <ui-select-item value="jst">JST · Japan (UTC+9)</ui-select-item>
                  </ui-select-content>
                </ui-select>
              </div>
              <div class="grid gap-2 sm:col-span-2">
                <ui-label for="language">Language</ui-label>
                <ui-select [value]="locale()" (valueChange)="onLocaleChange($event)">
                  <ui-select-trigger id="language" class="w-full">
                    <ui-select-value />
                  </ui-select-trigger>
                  <ui-select-content>
                    @for (opt of languageOptions(); track opt.code) {
                      <ui-select-item [value]="opt.code">{{ opt.label }}</ui-select-item>
                    }
                  </ui-select-content>
                </ui-select>
                <p class="text-muted-foreground text-xs">Applies right away — no need to save.</p>
              </div>
              <div class="space-y-2 sm:col-span-2">
                <ui-label>Profile visibility</ui-label>
                <ui-radio-group [value]="account().visibility" (valueChange)="patchAccount('visibility', $any($event))" class="sm:grid-cols-3">
                  <label
                    class="hover:bg-muted/50 has-[[data-state=checked]]:border-primary flex w-full cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors"
                  >
                    <ui-radio-group-item value="private" class="mt-0.5" />
                    <div class="flex-1 space-y-0.5">
                      <div class="text-sm font-medium leading-none">Private</div>
                      <div class="text-muted-foreground text-xs">Only you can see this profile.</div>
                    </div>
                  </label>
                  <label
                    class="hover:bg-muted/50 has-[[data-state=checked]]:border-primary flex w-full cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors"
                  >
                    <ui-radio-group-item value="team" class="mt-0.5" />
                    <div class="flex-1 space-y-0.5">
                      <div class="text-sm font-medium leading-none">Team</div>
                      <div class="text-muted-foreground text-xs">Anyone in your workspace.</div>
                    </div>
                  </label>
                  <label
                    class="hover:bg-muted/50 has-[[data-state=checked]]:border-primary flex w-full cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors"
                  >
                    <ui-radio-group-item value="public" class="mt-0.5" />
                    <div class="flex-1 space-y-0.5">
                      <div class="text-sm font-medium leading-none">Public</div>
                      <div class="text-muted-foreground text-xs">Anyone with the link.</div>
                    </div>
                  </label>
                </ui-radio-group>
              </div>
            </div>
          </div>

          <div ui-card>
            <div ui-card-header>
              <h3 ui-card-title class="text-base">Notifications</h3>
              <p ui-card-description>Pick the channels and topics you want to hear about.</p>
            </div>
            <div ui-card-content class="space-y-4">
              <div class="flex items-center justify-between gap-4">
                <div class="space-y-0.5">
                  <ui-label for="notify-email">Email notifications</ui-label>
                  <p class="text-muted-foreground text-xs">Daily digest of activity in your workspace.</p>
                </div>
                <ui-switch
                  id="notify-email"
                  [ngModel]="notifications().email"
                  (ngModelChange)="patchNotifications('email', $event)"
                  name="notify-email"
                />
              </div>
              <ui-separator />
              <div class="flex items-center justify-between gap-4">
                <div class="space-y-0.5">
                  <ui-label for="notify-push">Push notifications</ui-label>
                  <p class="text-muted-foreground text-xs">Real-time on mobile when something needs your attention.</p>
                </div>
                <ui-switch
                  id="notify-push"
                  [ngModel]="notifications().push"
                  (ngModelChange)="patchNotifications('push', $event)"
                  name="notify-push"
                />
              </div>
              <ui-separator />
              <div class="space-y-2">
                <ui-label>Weekly digest topics</ui-label>
                <div class="grid gap-2 sm:grid-cols-2">
                  @for (opt of notificationOptions; track opt.value) {
                    <label
                      class="hover:bg-muted/50 flex w-full cursor-pointer items-center gap-2 rounded-md border p-3 text-sm transition-colors"
                    >
                      <ui-checkbox
                        [checked]="notifications().weekly.includes(opt.value)"
                        (checkedChange)="toggleNotification(opt.value, $event === true)"
                      />
                      {{ opt.label }}
                    </label>
                  }
                </div>
              </div>
            </div>
          </div>

          <div ui-card>
            <div ui-card-header>
              <h3 ui-card-title class="text-base">Billing</h3>
              <p ui-card-description>Seats and plan size. Charged monthly at &#36;12/seat.</p>
            </div>
            <div ui-card-content class="space-y-4">
              <div class="space-y-2">
                <div class="flex items-baseline justify-between">
                  <ui-label for="billing-seats">Team seats</ui-label>
                  <!-- WHY (Rule15/28): billing math formats through the shared
                       helper and the /mo unit sits muted so the figure scans. -->
                  <span class="text-sm tabular-nums">
                    {{ billing().seats }} seats · {{ formatMoney(billing().seats * 12) }}<span class="text-muted-foreground">/mo</span>
                  </span>
                </div>
                <ui-slider
                  id="billing-seats"
                  [value]="billing().seats"
                  (valueChange)="onSeats($event)"
                  [min]="1"
                  [max]="50"
                  [step]="1"
                  aria-label="Team seats"
                />
                <div class="text-muted-foreground flex justify-between text-xs tabular-nums">
                  <span>1</span>
                  <span>50</span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2">
            @if (savedAt()) {
              <span class="text-muted-foreground inline-flex items-center gap-1.5 text-xs" role="status">
                <lucide-icon [img]="Check" class="text-success size-3.5" aria-hidden="true" />Saved at {{ savedAt() }}
              </span>
            }
            <button ui-button type="submit" [disabled]="submitting()">
              @if (submitting()) {
                <lucide-icon [img]="LoaderCircle" class="size-4 animate-spin" aria-hidden="true" />
              }
              {{ submitting() ? 'Saving…' : 'Save changes' }}
            </button>
          </div>
        </ui-page-body>
      </ui-page>
    </form>
  `,
})
export class DashboardFormsComponent {
  protected readonly Check = Check
  protected readonly LoaderCircle = LoaderCircle

  readonly pageTitle = injectPageTitle()
  readonly notificationOptions = NOTIFICATION_OPTIONS

  readonly profile = signal({ name: 'Alex Morgan', email: 'alex@acme.example', bio: 'Eng lead. Owns the platform team. Coffee → code → repeat.' })
  readonly account = signal({ password: '', timezone: 'utc', visibility: 'team' as 'private' | 'team' | 'public' })
  readonly notifications = signal({ email: true, push: false, weekly: ['product', 'security'] as string[] })
  readonly billing = signal({ seats: 12 })
  readonly submitting = signal(false)
  readonly savedAt = signal<string | null>(null)

  private readonly i18n = inject(I18nService)
  readonly locale = toSignal(this.i18n.locale$, { initialValue: 'en' })
  readonly languageOptions = computed(() =>
    (SUPPORTED_LOCALES as readonly string[]).map((code) => ({
      code,
      label: code === 'es' ? 'Español' : 'English',
    })),
  )

  patchProfile(key: 'name' | 'email' | 'bio', value: string): void {
    this.profile.update((p) => ({ ...p, [key]: value }))
  }

  patchAccount(key: 'password' | 'timezone' | 'visibility', value: string): void {
    this.account.update((a) => ({ ...a, [key]: value }))
  }

  patchNotifications(key: 'email' | 'push', value: boolean): void {
    this.notifications.update((n) => ({ ...n, [key]: value }))
  }

  toggleNotification(value: string, checked: boolean): void {
    const next = new Set(this.notifications().weekly)
    if (checked) next.add(value)
    else next.delete(value)
    this.notifications.update((n) => ({ ...n, weekly: Array.from(next) }))
  }

  onSeats(value: number | number[]): void {
    const seats = Array.isArray(value) ? (value[0] ?? 12) : value
    this.billing.update((b) => ({ ...b, seats }))
  }

  formatMoney(n: number): string {
    return formatMoney(n)
  }

  onLocaleChange(next: string): void {
    this.i18n.setLocale(next)
  }

  async onSubmit(e: Event): Promise<void> {
    e.preventDefault()
    this.submitting.set(true)
    await new Promise((r) => setTimeout(r, 700))
    this.submitting.set(false)
    this.savedAt.set(new Date().toLocaleTimeString())
  }
}
