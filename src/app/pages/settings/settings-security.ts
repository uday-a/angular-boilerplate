// Settings → Security — mirrors nuxt-boilerplate
// `app/pages/settings/security.vue` 1:1. Fully mock UI (TOTP toggle,
// sessions, API tokens) until the session/token endpoints exist.
import { Component, inject, signal } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { Key, Laptop, LucideAngularModule, Smartphone, Trash2, type LucideIconData } from 'lucide-angular'
import { UiBadgeComponent } from '@/app/components/ui/badge'
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

interface Session {
  id: string
  device: string
  browser: string
  location: string
  current: boolean
  lastActive: string
  icon: LucideIconData
}

const SESSIONS: Session[] = [
  { id: '1', device: 'MacBook Pro', browser: 'Chrome 130 · macOS 15', location: 'New York, US', current: true, lastActive: 'Active now', icon: Laptop },
  { id: '2', device: 'iPhone 15', browser: 'Safari · iOS 18', location: 'New York, US', current: false, lastActive: '2 hours ago', icon: Smartphone },
]

const TOKENS = [
  { id: 't1', name: 'CLI · uday-laptop', scopes: ['read', 'write'], created: '2026-03-12', lastUsed: '2026-05-16' },
]

@Component({
  selector: 'app-settings-security',
  standalone: true,
  imports: [
    LucideAngularModule,
    UiBadgeComponent,
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
    <div class="max-w-3xl space-y-4">
      <header class="space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight">Security</h1>
        <p class="text-muted-foreground text-sm">Sessions, two-factor auth, and API tokens.</p>
      </header>

      <ui-card>
        <ui-card-header>
          <ui-card-title class="text-base">Two-factor authentication</ui-card-title>
          <ui-card-description>Require a code from your authenticator app on every sign-in.</ui-card-description>
        </ui-card-header>
        <ui-card-content>
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-0.5">
              <ui-label class="text-sm font-medium">Authenticator app (TOTP)</ui-label>
              <p class="text-muted-foreground text-xs">Compatible with 1Password, Authy, Google Authenticator.</p>
            </div>
            <ui-switch [checked]="mfaEnabled()" (checkedChange)="mfaEnabled.set($event)" />
          </div>
        </ui-card-content>
      </ui-card>

      <ui-card>
        <ui-card-header>
          <ui-card-title class="text-base">Active sessions</ui-card-title>
          <ui-card-description>Devices currently signed in to your account.</ui-card-description>
        </ui-card-header>
        <ui-card-content class="space-y-3">
          @for (s of sessions; track s.id; let i = $index) {
            <div>
              <div class="flex items-start justify-between gap-4 py-2">
                <div class="flex items-start gap-3">
                  <lucide-icon [img]="s.icon" class="text-muted-foreground size-4 mt-0.5" />
                  <div class="space-y-0.5">
                    <div class="flex items-center gap-2">
                      <p class="text-sm font-medium">{{ s.device }}</p>
                      @if (s.current) {
                        <ui-badge variant="secondary">This device</ui-badge>
                      }
                    </div>
                    <p class="text-muted-foreground text-xs">{{ s.browser }} · {{ s.location }}</p>
                    <p class="text-muted-foreground text-xs">{{ s.lastActive }}</p>
                  </div>
                </div>
                @if (!s.current) {
                  <button ui-button variant="ghost" size="sm">Revoke</button>
                }
              </div>
              @if (i < sessions.length - 1) {
                <ui-separator />
              }
            </div>
          }
          <div class="pt-2">
            <button ui-button variant="outline" size="sm">Sign out all other sessions</button>
          </div>
        </ui-card-content>
      </ui-card>

      <ui-card>
        <ui-card-header class="flex flex-row items-center justify-between gap-4">
          <div>
            <ui-card-title class="text-base">API tokens</ui-card-title>
            <ui-card-description>Personal access tokens for CLI and API use.</ui-card-description>
          </div>
          <button ui-button size="sm">
            <lucide-icon [img]="KeyIcon" class="size-4" />
            Create token
          </button>
        </ui-card-header>
        <ui-card-content class="space-y-3">
          @if (!tokens.length) {
            <div class="text-muted-foreground text-sm">No tokens yet.</div>
          }
          @for (t of tokens; track t.id) {
            <div class="flex items-start justify-between gap-4 py-2">
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium">{{ t.name }}</p>
                  @for (scope of t.scopes; track scope) {
                    <ui-badge variant="secondary">{{ scope }}</ui-badge>
                  }
                </div>
                <p class="text-muted-foreground text-xs">Created {{ t.created }} · last used {{ t.lastUsed }}</p>
              </div>
              <button ui-button variant="ghost" size="icon" aria-label="Revoke token">
                <lucide-icon [img]="TrashIcon" class="text-destructive size-4" />
              </button>
            </div>
          }
        </ui-card-content>
      </ui-card>
    </div>
  `,
})
export class SettingsSecurity {
  protected readonly KeyIcon = Key
  protected readonly TrashIcon = Trash2

  protected readonly mfaEnabled = signal(false)
  protected readonly sessions = SESSIONS
  protected readonly tokens = TOKENS

  constructor() {
    inject(Title).setTitle('Security · Settings')
  }
}
