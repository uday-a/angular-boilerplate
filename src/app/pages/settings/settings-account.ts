// Settings → Account — mirrors nuxt-boilerplate
// `app/pages/settings/account.vue` 1:1.
//
// Name + bio persist via PUT /api/me/profile. Email is read-only
// (changing it requires the reverification flow, not this page).
// Password fields and the danger-zone actions are visual-only.
import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core'
import { AsyncPipe, isPlatformBrowser } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { CircleAlert, CircleCheck, LoaderCircle, LucideAngularModule } from 'lucide-angular'
import {
  UiAvatarComponent,
  UiAvatarFallbackComponent,
  UiAvatarImageComponent,
} from '@/app/components/ui/avatar'
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
import { UiSeparatorComponent } from '@/app/components/ui/separator'
import { UiTextareaComponent } from '@/app/components/ui/textarea'
import { type ApiResponse, apiErrorMessage } from '@/app/core/api/api'
import { AuthService } from '@/app/core/auth/auth.service'
import type { Profile } from './settings-general'
import {
  UiPageBodyComponent,
  UiPageComponent,
  UiPageHeaderComponent,
  UiPageHeaderHeadingComponent,
} from '@/app/components/ui/page'
import { injectPageTitle } from '@/app/core/i18n'

type SaveStatus
  = | { kind: 'idle' }
    | { kind: 'saving' }
    | { kind: 'saved', demo?: boolean }
    | { kind: 'error', message: string }

@Component({
  selector: 'app-settings-account',
  standalone: true,
  imports: [
    UiPageComponent,
    UiPageBodyComponent,
    UiPageHeaderComponent,
    UiPageHeaderHeadingComponent,
    AsyncPipe,
    LucideAngularModule,
    UiAvatarComponent,
    UiAvatarFallbackComponent,
    UiAvatarImageComponent,
    UiButtonComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
    UiInputComponent,
    UiLabelComponent,
    UiSeparatorComponent,
    UiTextareaComponent,
  ],
  template: `
    <ui-page>
      <ui-page-header>
        <ui-page-header-heading [title]="pageTitle()" description="Your personal profile and credentials." />
      </ui-page-header>

      <ui-page-body class="max-w-3xl space-y-4">
        <ui-card>
          <ui-card-header>
            <h3 ui-card-title class="text-base">Profile</h3>
            <ui-card-description>How you appear in the workspace.</ui-card-description>
          </ui-card-header>
          <ui-card-content class="space-y-4">
            <div class="flex items-center gap-4">
              <ui-avatar class="size-16">
                @if ((auth.user$ | async)?.avatar; as avatarUrl) {
                  <ui-avatar-image [src]="avatarUrl" [alt]="name()" />
                }
                <ui-avatar-fallback>{{ initials() }}</ui-avatar-fallback>
              </ui-avatar>
              <div class="space-y-1">
                <button ui-button variant="outline" size="sm">Upload photo</button>
                <p class="text-muted-foreground text-xs">PNG or JPG, up to 2MB.</p>
              </div>
            </div>
            <div class="grid gap-2">
              <ui-label htmlFor="acct-name">Full name</ui-label>
              <ui-input id="acct-name" [value]="name()" (valueChange)="name.set($event)" />
            </div>
            <div class="grid gap-2">
              <ui-label htmlFor="acct-bio">Bio</ui-label>
              <ui-textarea id="acct-bio" [rows]="3" placeholder="A short paragraph about yourself." [value]="bio()" (valueChange)="bio.set($event)" />
              <p class="text-muted-foreground text-xs">500 characters max. Visible to workspace members.</p>
            </div>
            <div class="grid gap-2">
              <ui-label htmlFor="acct-email">Email</ui-label>
              <ui-input id="acct-email" type="email" [disabled]="true" [value]="email()" (valueChange)="email.set($event)" />
              <p class="text-muted-foreground text-xs">
                Your email comes from your sign-in provider. Change it there to update it here.
              </p>
            </div>
          </ui-card-content>
        </ui-card>

        <ui-card>
          <ui-card-header>
            <h3 ui-card-title class="text-base">Password</h3>
            <ui-card-description>Use 12+ characters with a mix of letters, numbers, and symbols.</ui-card-description>
          </ui-card-header>
          <ui-card-content class="space-y-4">
            <div class="grid gap-2">
              <ui-label htmlFor="pw-current">Current password</ui-label>
              <ui-input id="pw-current" type="password" [value]="currentPassword()" (valueChange)="currentPassword.set($event)" />
            </div>
            <div class="grid gap-2">
              <ui-label htmlFor="pw-new">New password</ui-label>
              <ui-input id="pw-new" type="password" [value]="newPassword()" (valueChange)="newPassword.set($event)" />
            </div>
            <div class="grid gap-2">
              <ui-label htmlFor="pw-confirm">Confirm new password</ui-label>
              <ui-input id="pw-confirm" type="password" [value]="confirmPassword()" (valueChange)="confirmPassword.set($event)" />
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
          <button ui-button [disabled]="status().kind === 'saving' || !name()" (click)="save()">
            @if (status().kind === 'saving') {
              <lucide-icon [img]="LoaderIcon" class="size-4 animate-spin" />
            }
            Save changes
          </button>
        </div>

        <ui-card class="border-destructive/40">
          <ui-card-header>
            <h3 ui-card-title class="text-base text-destructive">Danger zone</h3>
            <ui-card-description>Irreversible account actions.</ui-card-description>
          </ui-card-header>
          <ui-card-content class="space-y-4">
            <div class="flex items-start justify-between gap-4">
              <div class="space-y-0.5">
                <p class="text-sm font-medium">Delete account</p>
                <p class="text-muted-foreground text-xs">
                  Permanently remove your account and all personal data. Workspace data is retained per your billing plan.
                </p>
              </div>
              <button ui-button variant="destructive">Delete account</button>
            </div>
            <ui-separator />
            <div class="flex items-start justify-between gap-4">
              <div class="space-y-0.5">
                <p class="text-sm font-medium">Export data</p>
                <p class="text-muted-foreground text-xs">Download a JSON archive of your personal data.</p>
              </div>
              <button ui-button variant="outline">Request export</button>
            </div>
          </ui-card-content>
        </ui-card>
      </ui-page-body>
    </ui-page>
  `,
})
export class SettingsAccount {
  private readonly http = inject(HttpClient)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))
  protected readonly auth = inject(AuthService)
  protected readonly pageTitle = injectPageTitle()

  protected readonly SavedIcon = CircleCheck
  protected readonly ErrorIcon = CircleAlert
  protected readonly LoaderIcon = LoaderCircle

  protected readonly name = signal('')
  protected readonly bio = signal('')
  protected readonly email = signal(this.auth.user?.email ?? '')
  protected readonly currentPassword = signal('')
  protected readonly newPassword = signal('')
  protected readonly confirmPassword = signal('')

  protected readonly initials = computed(() =>
    (this.name() || 'U')
      .split(' ')
      .map((s) => s[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  )

  protected readonly status = signal<SaveStatus>({ kind: 'idle' })

  constructor() {
    if (!this.browser) return
    this.http.get<ApiResponse<{ profile: Profile }>>('/api/me/profile', { withCredentials: true }).subscribe({
      next: (res) => {
        if (!res.ok) return
        this.name.set(res.data.profile.name ?? '')
        this.bio.set(res.data.profile.bio ?? '')
      },
      error: () => {},
    })
    // Email reflects the live session (it arrives async via the guard).
    this.auth.user$.subscribe((user) => {
      if (user?.email) this.email.set(user.email)
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
    const bio = this.bio().trim()
    this.http
      .put<ApiResponse<{ profile: Profile, demo?: boolean }>>(
        '/api/me/profile',
        { name: this.name(), bio: bio || null },
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
