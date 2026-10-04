// Settings hub — mirrors nuxt-boilerplate `app/pages/settings/index.vue`
// 1:1: ten section cards linking to the settings sub-pages.
import { Component, computed, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import {
  Bell,
  CircleUserRound,
  CreditCard,
  Gauge,
  History,
  KeyRound,
  LucideAngularModule,
  Plug,
  Settings2,
  ShieldCheck,
  Users,
} from 'lucide-angular'
import { UiCardComponent } from '@/app/components/ui/card'
import { UiIconBoxComponent } from '@/app/components/ui/icon-box'
import {
  UiPageBodyComponent,
  UiPageComponent,
  UiPageHeaderComponent,
  UiPageHeaderHeadingComponent,
} from '@/app/components/ui/page'
import { I18nService, injectPageTitle } from '@/app/core/i18n'
import { SAMPLE_PLAN, SAMPLE_USAGE, usagePct } from '@/app/core/dashboard/usage-mock'

@Component({
  selector: 'app-settings-hub',
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    UiCardComponent,
    UiIconBoxComponent,
    UiPageComponent,
    UiPageBodyComponent,
    UiPageHeaderComponent,
    UiPageHeaderHeadingComponent,
  ],
  template: `
    <ui-page>
      <ui-page-header>
        <ui-page-header-heading [title]="pageTitle()" description="Workspace configuration. Changes apply to all members." />
      </ui-page-header>

      <ui-page-body>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (s of sections(); track s.slug) {
            <a
              [routerLink]="['/settings', s.slug]"
              class="group focus-visible:ring-ring/50 block rounded-xl outline-none focus-visible:ring-[3px]"
            >
              <ui-card class="group-hover:border-foreground/20 group-hover:bg-muted/40 flex h-full flex-row items-start gap-4 p-4 transition-colors">
                <ui-icon-box size="md" aria-hidden="true">
                  <lucide-icon [img]="s.icon" class="size-4.5" />
                </ui-icon-box>
                <div class="min-w-0 flex-1 space-y-1">
                  <p class="text-sm font-semibold">{{ s.title }}</p>
                  <p class="text-muted-foreground text-xs">{{ s.description }}</p>
                  <p class="text-muted-foreground pt-1 text-xs tabular-nums">{{ s.meta }}</p>
                </div>
              </ui-card>
            </a>
          }
        </div>
      </ui-page-body>
    </ui-page>
  `,
})
export class SettingsHub {
  private readonly i18n = inject(I18nService)
  protected readonly pageTitle = injectPageTitle()

  // Titles come from the same nav.items.* labels as the sidebar and the
  // page H1, so a card never names its page differently.
  protected readonly sections = computed(() => {
    const lang = this.i18n.lang()
    const t = (k: string) => this.i18n.t(k)
    const apiCalls = SAMPLE_USAGE.find(u => u.id === 'api-calls')!
    const renews = new Date(SAMPLE_PLAN.renews).toLocaleDateString(lang, { month: 'short', day: 'numeric' })
    return [
      { slug: 'general', icon: Settings2, title: t('nav.items.general'), description: 'Workspace name, URL, locale and defaults.', meta: 'Acme Inc' },
      { slug: 'account', icon: CircleUserRound, title: t('nav.items.account'), description: 'Profile, email, password and account deletion.', meta: 'Personal' },
      { slug: 'security', icon: ShieldCheck, title: t('nav.items.security'), description: 'Two-factor auth and active sessions.', meta: '2 active sessions' },
      { slug: 'api-keys', icon: KeyRound, title: t('nav.items.apiKeys'), description: 'Scoped keys for scripts, CLIs and integrations.', meta: 'Read or read-write scopes' },
      { slug: 'notifications', icon: Bell, title: t('nav.items.notifications'), description: 'Email and in-app delivery preferences.', meta: 'Email · in-app' },
      { slug: 'integrations', icon: Plug, title: t('nav.items.integrations'), description: 'Connected apps and webhooks.', meta: '1 connected' },
      { slug: 'team', icon: Users, title: t('nav.items.team'), description: 'Members, roles and invitations.', meta: '8 members · 2 pending' },
      { slug: 'activity', icon: History, title: t('nav.items.activityLog'), description: 'Audit trail of sign-ins and changes.', meta: 'Workspace-wide' },
      { slug: 'billing', icon: CreditCard, title: t('nav.items.billing'), description: 'Plan, payment method and invoices.', meta: `${SAMPLE_PLAN.name} · renews ${renews}` },
      { slug: 'limits', icon: Gauge, title: t('nav.items.limits'), description: 'Quotas and per-key rate limits.', meta: `${usagePct(apiCalls)}% of API calls used` },
    ]
  })
}
