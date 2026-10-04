// Settings → Notifications — mirrors nuxt-boilerplate
// `app/pages/settings/notifications.vue` 1:1. Fully mock UI (preference
// toggles) until the notification-preference endpoint exists.
import { Component, signal } from '@angular/core'
import { UiButtonComponent } from '@/app/components/ui/button'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card'
import { UiLabelComponent } from '@/app/components/ui/label'
import { UiSeparatorComponent } from '@/app/components/ui/separator'
import { UiSwitchComponent } from '@/app/components/ui/switch'
import {
  UiPageBodyComponent,
  UiPageComponent,
  UiPageHeaderComponent,
  UiPageHeaderHeadingComponent,
} from '@/app/components/ui/page'
import { injectPageTitle } from '@/app/core/i18n'

type PrefKey = 'mentions' | 'comments' | 'invites' | 'weeklyDigest' | 'productUpdates' | 'billing'

interface Channel {
  email: boolean
  inApp: boolean
}

const ROWS: { key: PrefKey, label: string, description: string }[] = [
  { key: 'mentions', label: 'Mentions', description: 'When someone @-mentions you in a comment or document.' },
  { key: 'comments', label: 'Comments on your items', description: 'New replies on threads you created or are subscribed to.' },
  { key: 'invites', label: 'Workspace invites', description: 'When you’re invited to a workspace or project.' },
  { key: 'weeklyDigest', label: 'Weekly digest', description: 'Mondays · top activity, usage, and outstanding tasks.' },
  { key: 'productUpdates', label: 'Product updates', description: 'New features, changelog highlights.' },
  { key: 'billing', label: 'Billing & invoices', description: 'Receipts, failed payments, plan changes.' },
]

const DEFAULTS: Record<PrefKey, Channel> = {
  mentions: { email: true, inApp: true },
  comments: { email: false, inApp: true },
  invites: { email: true, inApp: true },
  weeklyDigest: { email: true, inApp: false },
  productUpdates: { email: false, inApp: true },
  billing: { email: true, inApp: true },
}

@Component({
  selector: 'app-settings-notifications',
  standalone: true,
  imports: [
    UiPageComponent,
    UiPageBodyComponent,
    UiPageHeaderComponent,
    UiPageHeaderHeadingComponent,
    UiButtonComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
    UiLabelComponent,
    UiSeparatorComponent,
    UiSwitchComponent,
  ],
  template: `
    <ui-page>
      <ui-page-header>
        <ui-page-header-heading [title]="pageTitle()" description="Pick which channels receive which events." />
      </ui-page-header>

      <ui-page-body class="max-w-3xl space-y-4">
        <ui-card>
          <ui-card-header>
            <h3 ui-card-title class="text-base">Delivery preferences</h3>
            <ui-card-description>Critical security alerts always send to email and can’t be disabled.</ui-card-description>
          </ui-card-header>
          <ui-card-content>
            <div class="grid grid-cols-[1fr_4rem_4rem] items-end gap-x-4 gap-y-1 pb-2 text-xs font-medium text-muted-foreground">
              <span>Event</span>
              <span class="px-1 text-center">Email</span>
              <span class="px-1 text-center">In-app</span>
            </div>
            <ui-separator />
            @for (r of rows; track r.key; let i = $index) {
              <div>
                <div class="grid grid-cols-[1fr_4rem_4rem] items-center gap-x-4 py-3">
                  <div class="space-y-0.5">
                    <ui-label [htmlFor]="'pref-' + r.key + '-email'" class="text-sm font-medium">{{ r.label }}</ui-label>
                    <p class="text-muted-foreground text-xs">{{ r.description }}</p>
                  </div>
                  <button ui-switch [id]="'pref-' + r.key + '-email'" class="justify-self-center" [checked]="prefs()[r.key].email" (checkedChange)="setPref(r.key, 'email', $event)"></button>
                  <button ui-switch [id]="'pref-' + r.key + '-inapp'" class="justify-self-center" [checked]="prefs()[r.key].inApp" (checkedChange)="setPref(r.key, 'inApp', $event)"></button>
                </div>
                @if (i < rows.length - 1) {
                  <ui-separator />
                }
              </div>
            }
          </ui-card-content>
        </ui-card>

        <div class="flex items-center justify-end gap-2">
          <button ui-button variant="outline" (click)="reset()">Reset</button>
          <button ui-button>Save preferences</button>
        </div>
      </ui-page-body>
    </ui-page>
  `,
})
export class SettingsNotifications {
  protected readonly pageTitle = injectPageTitle()
  protected readonly rows = ROWS
  protected readonly prefs = signal<Record<PrefKey, Channel>>({ ...DEFAULTS })


  setPref(key: PrefKey, channel: keyof Channel, value: boolean): void {
    this.prefs.update((prev) => ({ ...prev, [key]: { ...prev[key], [channel]: value } }))
  }

  reset(): void {
    this.prefs.set({ ...DEFAULTS })
  }
}
