// Settings → Limits — mirrors nuxt-boilerplate
// `app/pages/settings/limits.vue` 1:1. Fully mock UI (quota rows, rate
// limits) until the usage-metering endpoint exists.
import { Component, inject } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { ChevronRight, LucideAngularModule, TriangleAlert } from 'lucide-angular'
import { UiButtonComponent } from '@/app/components/ui/button'
import { UiUsageBarComponent } from '@/app/components/blocks/usage-bar/usage-bar.component'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card'

const QUOTAS: { name: string, used: number, limit: number, period: string }[] = [
  { name: 'Genesis API calls', used: 248120, limit: 600000, period: 'this month' },
  { name: 'Explorer API calls', used: 71300, limit: 200000, period: 'this month' },
  { name: 'Quantum API calls', used: 1840000, limit: 3000000, period: 'this month' },
  { name: 'Batch endpoint requests', used: 2140, limit: 5000, period: 'this month' },
  { name: 'File bundles (active)', used: 47, limit: 50, period: 'workspace total' },
  { name: 'Compute hours', used: 127.4, limit: 250, period: 'this month' },
  { name: 'Storage', used: 38.2, limit: 100, period: 'workspace total' },
  { name: 'Team seats', used: 8, limit: 25, period: 'workspace total' },
]

const RATE_LIMITS = [
  { endpoint: '/complete', tier: 'Pro', perMinute: 600, burst: 100 },
  { endpoint: '/complete/stream', tier: 'Pro', perMinute: 600, burst: 100 },
  { endpoint: '/complete (Explorer)', tier: 'Pro', perMinute: 200, burst: 50 },
  { endpoint: '/complete (Quantum)', tier: 'Pro', perMinute: 3000, burst: 500 },
  { endpoint: '/batch', tier: 'Pro', perMinute: 10, burst: 5 },
  { endpoint: '/files/upload', tier: 'Pro', perMinute: 60, burst: 20 },
]

export function formatQuota(n: number): string {
  return n >= 1000 ? n.toLocaleString() : String(n)
}

@Component({
  selector: 'app-settings-limits',
  standalone: true,
  imports: [
    LucideAngularModule,
    UiButtonComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
    UiUsageBarComponent,
  ],
  template: `
    <div class="space-y-4">
      <header class="space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight">Limits</h1>
        <p class="text-muted-foreground text-sm">Quotas and rate limits for your workspace. Quotas at 90% or more need attention.</p>
      </header>

      <ui-card class="border-destructive/30 bg-destructive/10">
        <ui-card-content class="flex items-start gap-3 py-4">
          <lucide-icon [img]="WarnIcon" class="text-destructive mt-0.5 size-5 shrink-0" />
          <div class="flex-1 space-y-1">
            <p class="text-sm font-semibold">File bundles approaching limit</p>
            <p class="text-muted-foreground text-xs">47 of 50 active bundles. Archive unused bundles or upgrade to remove the cap.</p>
          </div>
          <button ui-button variant="outline" size="sm">Manage bundles</button>
        </ui-card-content>
      </ui-card>

      <ui-card>
        <ui-card-header>
          <ui-card-title class="text-base">Quotas</ui-card-title>
          <ui-card-description>Monthly quotas reset on the 1st. Workspace-total quotas don't reset.</ui-card-description>
        </ui-card-header>
        <ui-card-content class="space-y-4">
          @for (q of quotas; track q.name) {
            <ui-usage-bar
              [label]="q.name"
              [used]="q.used"
              [limit]="q.limit"
              [scope]="q.period"
              [valueText]="fmt(q.used) + ' / ' + fmt(q.limit)"
            />
          }
        </ui-card-content>
      </ui-card>

      <ui-card>
        <ui-card-header>
          <ui-card-title class="text-base">Rate limits</ui-card-title>
          <ui-card-description>Per-API-key limits. Multiple keys multiply your effective ceiling.</ui-card-description>
        </ui-card-header>
        <ui-card-content class="divide-y">
          @for (r of rateLimits; track r.endpoint) {
            <div class="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div class="space-y-0.5">
                <p class="font-mono text-sm">{{ r.endpoint }}</p>
                <p class="text-muted-foreground text-xs">{{ r.tier }} tier</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium tabular-nums">
                  {{ r.perMinute.toLocaleString() }} <span class="text-muted-foreground font-normal">/ min</span>
                </p>
                <p class="text-muted-foreground text-xs tabular-nums">Burst: {{ r.burst }}</p>
              </div>
            </div>
          }
        </ui-card-content>
      </ui-card>

      <ui-card class="hover:bg-muted/40 cursor-pointer transition-colors">
        <ui-card-content class="flex items-center justify-between gap-4 py-4">
          <div>
            <p class="text-sm font-semibold">Need higher limits?</p>
            <p class="text-muted-foreground text-xs">Enterprise tier lifts all caps and adds dedicated capacity in your region.</p>
          </div>
          <lucide-icon [img]="ChevronIcon" class="text-muted-foreground size-4" />
        </ui-card-content>
      </ui-card>
    </div>
  `,
})
export class SettingsLimits {
  protected readonly WarnIcon = TriangleAlert
  protected readonly ChevronIcon = ChevronRight

  protected readonly quotas = QUOTAS
  protected readonly rateLimits = RATE_LIMITS

  constructor() {
    inject(Title).setTitle('Limits · Settings')
  }

  fmt(n: number): string {
    return formatQuota(n)
  }
}
