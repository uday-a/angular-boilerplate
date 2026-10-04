// Settings → Billing — mirrors nuxt-boilerplate
// `app/pages/settings/billing.vue` 1:1.
//
// GET /api/me/subscription drives the plan card; after a successful
// checkout (?status=success) the page polls the endpoint 6× at 1.5s
// intervals because Polar's webhook fires async. "Manage subscription"
// opens the portal via POST /api/billing/portal → redirect. Usage bars
// and invoice history are static fixtures, as in nuxt.
import { Component, DestroyRef, PLATFORM_ID, computed, inject, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { TranslatePipe } from '@ngx-translate/core'
import {
  CircleAlert,
  CircleCheck,
  Copy,
  CreditCard,
  Download,
  LoaderCircle,
  LucideAngularModule,
} from 'lucide-angular'
import { UiBadgeComponent } from '@/app/components/ui/badge'
import { UiButtonComponent } from '@/app/components/ui/button'
import {
  UiCardActionComponent,
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card'
import {
  UiTableBodyComponent,
  UiTableCellComponent,
  UiTableComponent,
  UiTableHeadComponent,
  UiTableHeaderComponent,
  UiTableRowComponent,
} from '@/app/components/ui/table'
import { UiUsageBarComponent } from '@/app/components/blocks/usage-bar'
import {
  UiTooltipComponent,
  UiTooltipContentComponent,
  UiTooltipProviderComponent,
  UiTooltipTriggerComponent,
} from '@/app/components/ui/tooltip/tooltip.component'
import { toast } from '@/app/components/ui/sonner/sonner.component'
import { type ApiResponse, apiErrorMessage } from '@/app/core/api/api'
import { UiDemoDataBannerComponent } from '@/app/components/blocks/demo-data-banner'
import { UiPageBodyComponent, UiPageComponent, UiPageHeaderComponent, UiPageHeaderHeadingComponent } from '@/app/components/ui/page'
import { SAMPLE_INVOICES, SAMPLE_PLAN, SAMPLE_USAGE, type UsageMetric, usageText } from '@/app/core/dashboard/usage-mock'
import { I18nService, injectPageTitle } from '@/app/core/i18n'

export interface SubscriptionRow {
  status: string
  productId: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  canceledAt: string | null
  plan: 'pro' | 'team' | 'enterprise' | null
}

const ACTIVE_STATUSES = ['active', 'trialing', 'past_due']

@Component({
  selector: 'app-settings-billing',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    UiCardActionComponent,
    UiDemoDataBannerComponent,
    UiPageBodyComponent,
    UiPageComponent,
    UiPageHeaderComponent,
    UiPageHeaderHeadingComponent,
    LucideAngularModule,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
    UiTableBodyComponent,
    UiTableCellComponent,
    UiTableComponent,
    UiTableHeadComponent,
    UiTableHeaderComponent,
    UiTableRowComponent,
    UiTooltipComponent,
    UiTooltipContentComponent,
    UiTooltipProviderComponent,
    UiTooltipTriggerComponent,
    UiUsageBarComponent,
  ],
  template: `
    <ui-page>
      <ui-page-header>
        <ui-page-header-heading [title]="pageTitle()" description="Plan, usage, payment method, and invoice history." />
      </ui-page-header>

      <ui-page-body class="space-y-4">
        @if (isSample()) {
          <ui-demo-data-banner message="Sample billing data. Your plan and invoices appear here once you subscribe." />
        }

        <div class="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <ui-card>
            <ui-card-header>
              <ui-card-description class="text-xs font-medium tracking-wider uppercase">Current plan</ui-card-description>
              <h3 ui-card-title class="text-base">{{ plan().name }}</h3>
              <ui-card-action>
                <span ui-badge variant="secondary">{{ renewsLabel() ? 'Renews ' + renewsLabel() : 'No renewal date' }}</span>
              </ui-card-action>
            </ui-card-header>
            <ui-card-content class="space-y-4">
              @if (justCheckedOut() && !hasActiveSub()) {
                <div class="border-primary/30 bg-primary/5 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <lucide-icon [img]="LoaderIcon" class="text-primary size-4 animate-spin" aria-hidden="true" />
                  Finalizing your subscription…
                </div>
              } @else if (subscription()) {
                <p class="text-sm capitalize">{{ subscription()!.status }}</p>
              } @else if (plan().price !== null) {
                <p class="text-sm">
                  <span class="text-2xl font-semibold tracking-tight tabular-nums">\${{ plan().price }}</span>
                  <span class="text-muted-foreground"> / {{ cycle }}</span>
                </p>
              }
              <div class="flex flex-wrap gap-2">
                @if (hasActiveSub()) {
                  <button ui-button [disabled]="portalState() === 'opening'" (click)="openPortal()">
                    @if (portalState() === 'opening') {
                      <lucide-icon [img]="LoaderIcon" class="size-4 animate-spin" aria-hidden="true" />
                    } @else {
                      <lucide-icon [img]="CardIcon" class="size-4" aria-hidden="true" />
                    }
                    Manage subscription
                  </button>
                } @else {
                  <a ui-button routerLink="/pricing">Change plan</a>
                }
              </div>
              @if (portalError()) {
                <div class="text-destructive flex items-center gap-2 text-sm">
                  <lucide-icon [img]="AlertIcon" class="size-4" aria-hidden="true" />
                  {{ portalError() }}
                </div>
              }
            </ui-card-content>
          </ui-card>

          <ui-card>
            <ui-card-header>
              <h3 ui-card-title class="text-base">Payment method</h3>
            </ui-card-header>
            <ui-card-content class="space-y-4">
              <div class="flex items-center gap-4">
                <lucide-icon [img]="CardIcon" class="text-muted-foreground size-5" aria-hidden="true" />
                <div class="flex-1">
                  <p class="text-sm font-medium">Visa ending in 4242</p>
                  <p class="text-muted-foreground text-xs tabular-nums">Expires 09 / 28</p>
                </div>
              </div>
              <button ui-button variant="outline" size="sm" class="w-full">Update card</button>
            </ui-card-content>
          </ui-card>
        </div>

        <ui-card>
          <ui-card-header>
            <h3 ui-card-title class="text-base">Usage this cycle</h3>
            <ui-card-description>
              {{ renewsLabel() ? 'Resets ' + renewsLabel() + '.' : 'Resets at the start of each billing cycle.' }}
              Anything over the cap is billed at the overage rate.
            </ui-card-description>
          </ui-card-header>
          <ui-card-content class="space-y-4">
            @for (u of usageThisCycle; track u.id) {
              <ui-usage-bar
                [label]="u.label"
                [used]="u.used"
                [limit]="u.limit"
                [valueText]="usageText(u)"
                [scope]="u.period === 'cycle' ? 'this cycle' : 'workspace total'"
              />
            }
          </ui-card-content>
        </ui-card>

        <ui-card>
          <ui-card-header>
            <h3 ui-card-title class="text-base">Invoices</h3>
            <ui-card-description>PDF downloads stay available for 7 years.</ui-card-description>
          </ui-card-header>
          <ui-table>
            <thead ui-table-header>
              <tr ui-table-row>
                <th ui-table-head>Invoice</th>
                <th ui-table-head>Issued</th>
                <th ui-table-head>Period</th>
                <th ui-table-head class="text-right">{{ 'dashboard.billing.amount' | translate }}</th>
                <th ui-table-head>Status</th>
                <th ui-table-head>Method</th>
                <th ui-table-head class="text-right">PDF</th>
              </tr>
            </thead>
            <tbody ui-table-body>
              @for (inv of invoices; track inv.id) {
                <tr ui-table-row>
                  <td ui-table-cell class="font-mono text-xs">
                    <span class="inline-flex items-center gap-1.5">
                      {{ inv.id }}
                      <button
                        type="button"
                        class="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center rounded p-0.5 focus-visible:ring-2 focus-visible:outline-none"
                        [attr.aria-label]="'dashboard.billing.copyAria' | translate: { id: inv.id }"
                        [title]="'dashboard.billing.copyAria' | translate: { id: inv.id }"
                        (click)="copyInvoiceId(inv.id)"
                      >
                        <lucide-icon [img]="CopyIcon" class="size-3.5" aria-hidden="true" />
                      </button>
                    </span>
                  </td>
                  <td ui-table-cell class="text-muted-foreground text-xs tabular-nums">{{ inv.date }}</td>
                  <td ui-table-cell>{{ inv.period }}</td>
                  <td ui-table-cell class="text-right text-sm tabular-nums">\${{ inv.amount.toFixed(2) }}</td>
                  <td ui-table-cell>
                    <span class="text-success flex items-center gap-1.5 text-xs capitalize">
                      <lucide-icon [img]="PaidIcon" class="size-3.5" aria-hidden="true" />
                      {{ inv.status }}
                    </span>
                  </td>
                  <td ui-table-cell class="text-muted-foreground text-xs">{{ inv.method }}</td>
                  <td ui-table-cell class="text-right">
                    <!-- WHY (Rule76/87): the download trigger is 32px with both
                         an accessible name and a tooltip. -->
                    <ui-tooltip-provider [delayDuration]="300">
                      <ui-tooltip>
                        <button
                          ui-button
                          ui-tooltip-trigger
                          variant="ghost"
                          size="icon"
                          class="size-8"
                          [attr.aria-label]="'dashboard.billing.downloadAria' | translate: { id: inv.id }"
                        >
                          <lucide-icon [img]="DownloadIcon" class="size-4" aria-hidden="true" />
                        </button>
                        <ui-tooltip-content>{{ 'dashboard.billing.downloadAria' | translate: { id: inv.id } }}</ui-tooltip-content>
                      </ui-tooltip>
                    </ui-tooltip-provider>
                  </td>
                </tr>
              }
            </tbody>
          </ui-table>
        </ui-card>
      </ui-page-body>
    </ui-page>
  `,
})
export class SettingsBilling {
  private readonly http = inject(HttpClient)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly i18n = inject(I18nService)

  protected readonly LoaderIcon = LoaderCircle
  protected readonly CardIcon = CreditCard
  protected readonly AlertIcon = CircleAlert
  protected readonly PaidIcon = CircleCheck
  protected readonly DownloadIcon = Download
  protected readonly CopyIcon = Copy

  protected readonly pageTitle = injectPageTitle()
  protected readonly usageThisCycle = SAMPLE_USAGE.filter(u => u.billable)
  protected readonly invoices = SAMPLE_INVOICES
  protected readonly cycle = SAMPLE_PLAN.cycle

  protected readonly justCheckedOut = signal(
    inject(ActivatedRoute).snapshot.queryParamMap.get('status') === 'success',
  )
  protected readonly subscription = signal<SubscriptionRow | null>(null)
  protected readonly hasActiveSub = computed(() => {
    const sub = this.subscription()
    return !!sub && ACTIVE_STATUSES.includes(sub.status)
  })

  // Derive the displayed plan from the real subscription. Without one the
  // page shows the shared sample plan (usage-mock) so plan, usage and
  // invoices agree with each other and with Settings -> Limits.
  protected readonly isSample = computed(() => !this.subscription())
  protected readonly plan = computed(() => {
    const sub = this.subscription()
    if (!sub) return { name: SAMPLE_PLAN.name, price: SAMPLE_PLAN.price as number | null, renews: SAMPLE_PLAN.renews as string | null }
    const label = sub.plan ? sub.plan[0]!.toUpperCase() + sub.plan.slice(1) : 'Subscribed'
    return { name: label, price: null, renews: sub.currentPeriodEnd }
  })

  protected readonly renewsLabel = computed(() => {
    const renews = this.plan().renews
    return renews
      ? new Date(renews).toLocaleDateString(this.i18n.lang(), { month: 'short', day: 'numeric', year: 'numeric' })
      : null
  })

  protected readonly portalState = signal<'idle' | 'opening' | 'error'>('idle')
  protected readonly portalError = signal<string | null>(null)

  constructor() {
    if (!this.browser) return
    this.refreshSub()
    // Post-checkout poll (nuxt: onMounted 6×1.5s) — the subscription row
    // may not exist yet on first read.
    if (this.justCheckedOut()) {
      let attempts = 0
      const timer = setInterval(() => {
        attempts++
        this.refreshSub()
        if (this.hasActiveSub() || attempts >= 6) clearInterval(timer)
      }, 1500)
      inject(DestroyRef).onDestroy(() => clearInterval(timer))
    }
  }

  usageText(u: UsageMetric): string {
    return usageText(u)
  }

  // WHY (Rule67): the invoice id carries a copy button (clipboard with a
  // textarea fallback for non-secure contexts) so ids leave the page intact.
  async copyInvoiceId(id: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(id)
    } catch {
      if (typeof document === 'undefined') return
      const ta = document.createElement('textarea')
      ta.value = id
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    toast.success(this.i18n.t('dashboard.billing.copied'))
  }

  refreshSub(): void {
    this.http.get<ApiResponse<{ subscription: SubscriptionRow | null }>>('/api/me/subscription', { withCredentials: true }).subscribe({
      next: (res) => {
        if (res.ok) this.subscription.set(res.data.subscription)
      },
      error: () => {},
    })
  }

  openPortal(): void {
    if (!this.browser || this.portalState() === 'opening') return
    this.portalState.set('opening')
    this.portalError.set(null)
    this.http.post<ApiResponse<{ url: string }>>('/api/billing/portal', {}, { withCredentials: true }).subscribe({
      next: (res) => {
        if (!res.ok) {
          this.portalError.set(res.error.message)
          this.portalState.set('error')
          return
        }
        window.location.href = res.data.url
      },
      error: (err: unknown) => {
        this.portalError.set(apiErrorMessage(err, 'Could not open portal'))
        this.portalState.set('error')
      },
    })
  }
}
