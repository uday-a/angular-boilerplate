// Settings hub — mirrors nuxt-boilerplate `app/pages/settings/index.vue`
// 1:1: eight section cards linking to the settings sub-pages.
import { Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Title } from '@angular/platform-browser'
import {
  ArrowRight,
  Bell,
  CircleUserRound,
  CreditCard,
  Gauge,
  History,
  KeyRound,
  LucideAngularModule,
  Plug,
  ShieldCheck,
  User,
  Users,
  type LucideIconData,
} from 'lucide-angular'
import { UiBadgeComponent } from '@/app/components/ui/badge'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card'

interface SettingsSection {
  slug: string
  icon: LucideIconData
  title: string
  description: string
  meta: string
}

const SECTIONS: SettingsSection[] = [
  { slug: 'general', icon: User, title: 'General', description: 'Workspace name, timezone, default locale, brand colours.', meta: 'You · 4 fields' },
  { slug: 'account', icon: CircleUserRound, title: 'Account', description: 'Profile, email, password, account deletion.', meta: 'Your personal info' },
  { slug: 'security', icon: ShieldCheck, title: 'Security', description: 'Sessions, two-factor auth, API tokens.', meta: '1 active session' },
  { slug: 'api-keys', icon: KeyRound, title: 'API keys', description: 'Scoped keys for scripts, CLIs and integrations.', meta: 'Read or read-write scopes' },
  { slug: 'notifications', icon: Bell, title: 'Notifications', description: 'Email and in-app delivery preferences.', meta: 'Email · in-app' },
  { slug: 'integrations', icon: Plug, title: 'Integrations', description: 'Connected OAuth apps and webhooks.', meta: '0 connected' },
  { slug: 'team', icon: Users, title: 'Team', description: 'Members, roles, invitations, and SSO configuration.', meta: '8 members · 2 pending invites' },
  { slug: 'activity', icon: History, title: 'Activity log', description: 'Audit trail of sign-ins and changes.', meta: 'Workspace-wide' },
  { slug: 'billing', icon: CreditCard, title: 'Billing', description: 'Current plan, payment method, invoices, usage caps.', meta: 'Pro · $148.40 this cycle' },
  { slug: 'limits', icon: Gauge, title: 'Limits', description: 'API quotas, rate limits, storage allowances per workspace.', meta: '47% of monthly quota' },
]

@Component({
  selector: 'app-settings-hub',
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    UiBadgeComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
  ],
  template: `
    <div class="space-y-4">
      <header class="space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight">Settings</h1>
        <p class="text-muted-foreground text-sm">Workspace configuration. Changes apply to all members.</p>
      </header>

      <div class="grid gap-4 sm:grid-cols-2">
        @for (s of sections; track s.slug) {
          <a [routerLink]="['/settings', s.slug]" class="group block">
            <ui-card class="hover:border-foreground/20 h-full transition-colors">
              <ui-card-header>
                <div class="flex items-start justify-between gap-3">
                  <div class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                    <lucide-icon [img]="s.icon" class="size-5" />
                  </div>
                  <lucide-icon
                    [img]="ArrowIcon"
                    class="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 size-4 transition-transform"
                  />
                </div>
                <ui-card-title class="text-base pt-3">{{ s.title }}</ui-card-title>
                <ui-card-description>{{ s.description }}</ui-card-description>
              </ui-card-header>
              <ui-card-content>
                <ui-badge variant="secondary">{{ s.meta }}</ui-badge>
              </ui-card-content>
            </ui-card>
          </a>
        }
      </div>
    </div>
  `,
})
export class SettingsHub {
  protected readonly ArrowIcon = ArrowRight
  protected readonly sections = SECTIONS

  constructor() {
    inject(Title).setTitle('Settings')
  }
}
