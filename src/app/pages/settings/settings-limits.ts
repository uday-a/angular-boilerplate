// Settings → Limits — mirrors nuxt-boilerplate
// `app/pages/settings/limits.vue` 1:1. Quotas share usage-mock with
// Settings → Billing so both pages agree; rate limits are static until
// a metering endpoint exists.
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ChevronRight, LucideAngularModule, TriangleAlert } from 'lucide-angular'
import { UiDemoDataBannerComponent } from '@/app/components/blocks/demo-data-banner'
import { UiUsageBarComponent } from '@/app/components/blocks/usage-bar'
import { UiButtonComponent } from '@/app/components/ui/button'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card'
import { UiPageBodyComponent, UiPageComponent, UiPageHeaderComponent, UiPageHeaderHeadingComponent } from '@/app/components/ui/page'
import { SAMPLE_PLAN, SAMPLE_USAGE, type UsageMetric, usagePct, usageText } from '@/app/core/dashboard/usage-mock'
import { injectPageTitle } from '@/app/core/i18n'

const RATE_LIMITS = [
  { endpoint: '/v1/projects', perMinute: 600, burst: 100 },
  { endpoint: '/v1/deploys', perMinute: 300, burst: 60 },
  { endpoint: '/v1/events', perMinute: 3000, burst: 500 },
  { endpoint: '/v1/customers', perMinute: 600, burst: 100 },
  { endpoint: '/v1/batch', perMinute: 10, burst: 5 },
  { endpoint: '/v1/files/upload', perMinute: 60, burst: 20 },
]

@Component({
  selector: 'app-settings-limits',
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    UiButtonComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
    UiDemoDataBannerComponent,
    UiPageBodyComponent,
    UiPageComponent,
    UiPageHeaderComponent,
    UiPageHeaderHeadingComponent,
    UiUsageBarComponent,
  ],
  template: `
    <ui-page>
      <ui-page-header>
        <ui-page-header-heading [title]="pageTitle()" description="Quotas and rate limits for your workspace." />
      </ui-page-header>

      <ui-page-body class="max-w-3xl space-y-4">
        <ui-demo-data-banner message="Sample usage data. Connect metering to see live quotas." />

        @for (q of critical; track q.id) {
          <ui-card class="border-destructive/30 bg-destructive/5">
            <ui-card-content class="flex items-start gap-4 p-4">
              <lucide-icon [img]="WarnIcon" class="text-destructive mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div class="flex-1 space-y-1">
                <p class="text-sm font-semibold">{{ q.label }} approaching limit</p>
                <p class="text-muted-foreground text-xs tabular-nums">
                  {{ q.used.toLocaleString() }} of {{ q.limit.toLocaleString() }} used. Archive unused items or upgrade to raise the cap.
                </p>
              </div>
              <button ui-button variant="outline" size="sm">Review</button>
            </ui-card-content>
          </ui-card>
        }

        <ui-card>
          <ui-card-header>
            <h3 ui-card-title class="text-base">Quotas</h3>
            <ui-card-description>Cycle quotas reset on the 1st. Workspace totals don't reset.</ui-card-description>
          </ui-card-header>
          <ui-card-content class="space-y-4">
            @for (q of quotas; track q.id) {
              <ui-usage-bar
                [label]="q.label"
                [used]="q.used"
                [limit]="q.limit"
                [valueText]="usageText(q)"
                [scope]="q.period === 'cycle' ? 'this cycle' : 'workspace total'"
              />
            }
          </ui-card-content>
        </ui-card>

        <ui-card>
          <ui-card-header>
            <h3 ui-card-title class="text-base">Rate limits</h3>
            <ui-card-description>Per-API-key limits on the {{ planName }} plan. Multiple keys multiply your effective ceiling.</ui-card-description>
          </ui-card-header>
          <ui-card-content class="divide-y">
            @for (r of rateLimits; track r.endpoint) {
              <div class="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <p class="font-mono text-sm">{{ r.endpoint }}</p>
                <div class="text-right">
                  <p class="text-sm font-medium tabular-nums">
                    {{ r.perMinute.toLocaleString() }} <span class="text-muted-foreground font-normal">/ min</span>
                  </p>
                  <p class="text-muted-foreground text-xs tabular-nums">Burst {{ r.burst }}</p>
                </div>
              </div>
            }
          </ui-card-content>
        </ui-card>

        <a routerLink="/pricing" class="group focus-visible:ring-ring/50 block rounded-xl outline-none focus-visible:ring-[3px]">
          <ui-card class="group-hover:bg-muted/40 transition-colors">
            <ui-card-content class="flex items-center justify-between gap-4 p-4">
              <div class="space-y-1">
                <p class="text-sm font-semibold">Need higher limits?</p>
                <p class="text-muted-foreground text-xs">Enterprise lifts all caps and adds dedicated capacity in your region.</p>
              </div>
              <lucide-icon [img]="ChevronIcon" class="text-muted-foreground size-4" aria-hidden="true" />
            </ui-card-content>
          </ui-card>
        </a>
      </ui-page-body>
    </ui-page>
  `,
})
export class SettingsLimits {
  protected readonly WarnIcon = TriangleAlert
  protected readonly ChevronIcon = ChevronRight
  protected readonly pageTitle = injectPageTitle()

  // Same sample meters as Settings → Billing, so both pages agree.
  protected readonly quotas = SAMPLE_USAGE
  // Quotas at or over the UsageBar destructive threshold get a callout.
  protected readonly critical = SAMPLE_USAGE.filter(q => usagePct(q) >= 90)
  protected readonly rateLimits = RATE_LIMITS
  protected readonly planName = SAMPLE_PLAN.name

  usageText(q: UsageMetric): string {
    return usageText(q)
  }
}
