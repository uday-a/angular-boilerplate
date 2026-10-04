// Settings → General — mirrors nuxt-boilerplate
// `app/pages/settings/general.vue` 1:1.
//
// Timezone + locale are user-scoped (live on the `users` table) and
// persist via /api/me/profile. The workspace-level fields below (name,
// slug, brand color, SSO requirements) need a `workspaces` table; until
// one exists they're visual-only — Save only ships the user-scoped
// fields.
import { Component, PLATFORM_ID, inject, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { CircleAlert, CircleCheck, LoaderCircle, LucideAngularModule } from 'lucide-angular'
import { UiButtonComponent } from '@/app/components/ui/button'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card'
import { UiInputComponent } from '@/app/components/ui/input'
import { UiLabelComponent } from '@/app/components/ui/label'
import {
  UiSelectComponent,
  UiSelectContentComponent,
  UiSelectItemComponent,
  UiSelectTriggerComponent,
  UiSelectValueComponent,
} from '@/app/components/ui/select'
import { UiSeparatorComponent } from '@/app/components/ui/separator'
import { UiSwitchComponent } from '@/app/components/ui/switch'
import {
  UiPageBodyComponent,
  UiPageComponent,
  UiPageHeaderComponent,
  UiPageHeaderHeadingComponent,
} from '@/app/components/ui/page'
import { type ApiResponse, apiErrorMessage } from '@/app/core/api/api'
import { injectPageTitle } from '@/app/core/i18n'

export interface Profile {
  name: string | null
  bio: string | null
  timezone: string
  locale: string
  notifyEmail: boolean
  notifyInApp: boolean
}

type SaveStatus
  = | { kind: 'idle' }
    | { kind: 'saving' }
    | { kind: 'saved', demo?: boolean }
    | { kind: 'error', message: string }

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles · UTC-8' },
  { value: 'America/New_York', label: 'America/New_York · UTC-5' },
  { value: 'Europe/London', label: 'Europe/London · UTC+0' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin · UTC+1' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore · UTC+8' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo · UTC+9' },
]

const LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
]

@Component({
  selector: 'app-settings-general',
  standalone: true,
  imports: [
    LucideAngularModule,
    UiButtonComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
    UiInputComponent,
    UiLabelComponent,
    UiSelectComponent,
    UiSelectContentComponent,
    UiSelectItemComponent,
    UiSelectTriggerComponent,
    UiSelectValueComponent,
    UiSeparatorComponent,
    UiSwitchComponent,
    UiPageComponent,
    UiPageBodyComponent,
    UiPageHeaderComponent,
    UiPageHeaderHeadingComponent,
  ],
  template: `
    <ui-page>
      <ui-page-header>
        <ui-page-header-heading [title]="pageTitle()" description="Workspace identity, locale, and default behavior." />
      </ui-page-header>

      <ui-page-body class="max-w-3xl space-y-4">
        <ui-card>
          <ui-card-header>
            <h3 ui-card-title class="text-base">Workspace</h3>
            <ui-card-description>Visible to every member.</ui-card-description>
          </ui-card-header>
          <ui-card-content class="space-y-4">
            <div class="grid gap-2">
              <ui-label htmlFor="ws-name">Workspace name</ui-label>
              <ui-input id="ws-name" [value]="workspaceName()" (valueChange)="workspaceName.set($event)" />
            </div>
            <div class="grid gap-2">
              <ui-label htmlFor="ws-url">URL slug</ui-label>
              <div class="flex">
                <span class="bg-muted text-muted-foreground inline-flex items-center rounded-l-md border border-r-0 px-3 text-sm">
                  app.acme.com/
                </span>
                <ui-input id="ws-url" class="rounded-l-none" [value]="workspaceUrl()" (valueChange)="workspaceUrl.set($event)" />
              </div>
              <p class="text-muted-foreground text-xs">Renaming the slug breaks existing share links. Old links 404; we don't redirect.</p>
            </div>
            <div class="grid gap-2">
              <ui-label htmlFor="ws-email">Support email</ui-label>
              <ui-input id="ws-email" type="email" [value]="supportEmail()" (valueChange)="supportEmail.set($event)" />
            </div>
          </ui-card-content>
        </ui-card>

        <ui-card>
          <ui-card-header>
            <h3 ui-card-title class="text-base">Localization</h3>
            <ui-card-description>Affects date and time formatting across the workspace.</ui-card-description>
          </ui-card-header>
          <ui-card-content class="space-y-4">
            <div class="grid gap-2">
              <ui-label htmlFor="ws-timezone">Timezone</ui-label>
              <ui-select [value]="timezone()" (valueChange)="timezone.set($event)">
                <button ui-select-trigger id="ws-timezone" class="w-full"><ui-select-value placeholder="Select timezone" /></button>
                <ui-select-content>
                  @for (tz of timezones; track tz.value) {
                    <ui-select-item [value]="tz.value">{{ tz.label }}</ui-select-item>
                  }
                </ui-select-content>
              </ui-select>
            </div>
            <div class="grid gap-2">
              <ui-label htmlFor="ws-locale">Locale</ui-label>
              <ui-select [value]="locale()" (valueChange)="locale.set($event)">
                <button ui-select-trigger id="ws-locale" class="w-full"><ui-select-value placeholder="Select locale" /></button>
                <ui-select-content>
                  @for (l of locales; track l.value) {
                    <ui-select-item [value]="l.value">{{ l.label }}</ui-select-item>
                  }
                </ui-select-content>
              </ui-select>
            </div>
          </ui-card-content>
        </ui-card>

        <ui-card>
          <ui-card-header>
            <h3 ui-card-title class="text-base">Branding</h3>
          </ui-card-header>
          <ui-card-content class="space-y-4">
            <div class="grid gap-2">
              <ui-label id="ws-brand-label">Primary brand color</ui-label>
              <div class="flex items-center gap-2" role="radiogroup" aria-labelledby="ws-brand-label">
                @for (c of brandSwatches; track c.value) {
                  <button
                    type="button"
                    role="radio"
                    [attr.aria-checked]="brandColor() === c.value"
                    [attr.aria-label]="c.label"
                    [class]="'ring-offset-background focus-visible:ring-ring size-8 rounded-full border transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' + c.class + (brandColor() === c.value ? ' ring-foreground ring-2 ring-offset-2' : '')"
                    (click)="brandColor.set(c.value)"
                  ></button>
                }
              </div>
              <p class="text-muted-foreground text-xs">Used on shared report headers, exported PDFs, and the public-facing share page.</p>
            </div>
          </ui-card-content>
        </ui-card>

        <ui-card>
          <ui-card-header>
            <h3 ui-card-title class="text-base">Defaults</h3>
          </ui-card-header>
          <ui-card-content class="space-y-1">
            <div class="flex items-start justify-between gap-4 py-3">
              <div class="space-y-0.5">
                <ui-label htmlFor="allow-external-shares" class="text-sm font-medium">Allow external shares</ui-label>
                <p class="text-muted-foreground text-xs">Members can generate public read-only share links. Disabled by default at the Enterprise tier.</p>
              </div>
              <button ui-switch id="allow-external-shares" [checked]="allowExternalShares()" (checkedChange)="allowExternalShares.set($event)"></button>
            </div>
            <ui-separator />
            <div class="flex items-start justify-between gap-4 py-3">
              <div class="space-y-0.5">
                <ui-label htmlFor="require-sso" class="text-sm font-medium">Require SSO</ui-label>
                <p class="text-muted-foreground text-xs">All members must authenticate via your SAML or OIDC provider. Email/password is blocked.</p>
              </div>
              <button ui-switch id="require-sso" [checked]="requireSso()" (checkedChange)="requireSso.set($event)"></button>
            </div>
            <ui-separator />
            <div class="flex items-start justify-between gap-4 py-3">
              <div class="space-y-0.5">
                <ui-label htmlFor="send-weekly-digest" class="text-sm font-medium">Send weekly digest</ui-label>
                <p class="text-muted-foreground text-xs">Mondays at 9am workspace time. Usage, top projects, and any rate-limit hits from the prior week.</p>
              </div>
              <button ui-switch id="send-weekly-digest" [checked]="sendWeeklyDigest()" (checkedChange)="sendWeeklyDigest.set($event)"></button>
            </div>
          </ui-card-content>
        </ui-card>

        <div class="flex items-center justify-end gap-2">
          @if (status().kind === 'saved') {
            <div class="flex items-center gap-2 text-sm text-success">
              <lucide-icon [img]="SavedIcon" class="size-4" />
              {{ asSaved(status()).demo ? 'Saved (demo — not persisted)' : 'Saved' }}
            </div>
          } @else if (status().kind === 'error') {
            <div class="text-destructive flex items-center gap-2 text-sm">
              <lucide-icon [img]="ErrorIcon" class="size-4" />
              {{ asError(status()).message }}
            </div>
          }
          <button ui-button variant="outline">Cancel</button>
          <button ui-button [disabled]="status().kind === 'saving'" (click)="save()">
            @if (status().kind === 'saving') {
              <lucide-icon [img]="LoaderIcon" class="size-4 animate-spin" />
            }
            Save changes
          </button>
        </div>
      </ui-page-body>
    </ui-page>
  `,
})
export class SettingsGeneral {
  private readonly http = inject(HttpClient)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))

  protected readonly SavedIcon = CircleCheck
  protected readonly ErrorIcon = CircleAlert
  protected readonly LoaderIcon = LoaderCircle

  protected readonly timezones = TIMEZONES
  protected readonly locales = LOCALES
  protected readonly pageTitle = injectPageTitle()
  // Brand accent is picked from the theme's chart palette so it stays
  // legible in light and dark mode.
  protected readonly brandSwatches = [
    { value: 'chart-1', label: 'Color 1', class: 'bg-chart-1' },
    { value: 'chart-2', label: 'Color 2', class: 'bg-chart-2' },
    { value: 'chart-3', label: 'Color 3', class: 'bg-chart-3' },
    { value: 'chart-4', label: 'Color 4', class: 'bg-chart-4' },
    { value: 'chart-5', label: 'Color 5', class: 'bg-chart-5' },
  ]

  // User-scoped, persisted via /api/me/profile.
  protected readonly timezone = signal('UTC')
  protected readonly locale = signal('en')

  // Workspace-level state. UI shells until a workspaces table exists.
  protected readonly workspaceName = signal('Acme Inc')
  protected readonly workspaceUrl = signal('acme-inc')
  protected readonly supportEmail = signal('support@acme.com')
  protected readonly brandColor = signal('chart-1')
  protected readonly allowExternalShares = signal(true)
  protected readonly requireSso = signal(false)
  protected readonly sendWeeklyDigest = signal(true)

  protected readonly status = signal<SaveStatus>({ kind: 'idle' })

  constructor() {
    if (!this.browser) return
    this.http.get<ApiResponse<{ profile: Profile }>>('/api/me/profile', { withCredentials: true }).subscribe({
      next: (res) => {
        if (!res.ok) return
        this.timezone.set(res.data.profile.timezone)
        this.locale.set(res.data.profile.locale)
      },
      error: () => {},
    })
  }

  asSaved(status: SaveStatus): { kind: 'saved', demo?: boolean } {
    return status as { kind: 'saved', demo?: boolean }
  }

  asError(status: SaveStatus): { kind: 'error', message: string } {
    return status as { kind: 'error', message: string }
  }

  save(): void {
    if (!this.browser || this.status().kind === 'saving') return
    this.status.set({ kind: 'saving' })
    this.http
      .put<ApiResponse<{ profile: Profile, demo?: boolean }>>(
        '/api/me/profile',
        { timezone: this.timezone(), locale: this.locale() },
        { withCredentials: true },
      )
      .subscribe({
        next: (res) => {
          if (!res.ok) {
            this.status.set({ kind: 'error', message: res.error.message })
            return
          }
          this.status.set({ kind: 'saved', demo: res.data.demo })
        },
        error: (err: unknown) => {
          this.status.set({ kind: 'error', message: apiErrorMessage(err, 'Failed to save') })
        },
      })
  }
}
