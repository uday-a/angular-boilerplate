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
import { Title } from '@angular/platform-browser'
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
import { I18nService } from '@/app/core/i18n'

export interface SubscriptionRow {
  status: string
  productId: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  canceledAt: string | null
  plan: 'pro' | 'team' | 'enterprise' | null
}

const ACTIVE_STATUSES = ['active', 'trialing', 'past_due']

const USAGE_THIS_CYCLE = [
  { label: 'API calls', used: 482300, limit: 1000000, unit: '' },
  { label: 'Compute (hours)', used: 127.4, limit: 250, unit: 'h' },
  { label: 'Storage', used: 38.2, limit: 100, unit: 'GB' },
  { label: 'Team seats', used: 8, limit: 25, unit: '' },
]

const INVOICES = [
  { id: 'INV-2031', date: '2026-05-01', period: 'Apr 2026', amount: 148.40, status: 'paid', method: 'Visa ··4242' },
  { id: 'INV-2018', date: '2026-04-01', period: 'Mar 2026', amount: 148.40, status: 'paid', method: 'Visa ··4242' },
  { id: 'INV-1994', date: '2026-03-01', period: 'Feb 2026', amount: 145.00, status: 'paid', method: 'Visa ··4242' },
  { id: 'INV-1972', date: '2026-02-01', period: 'Jan 2026', amount: 145.00, status: 'paid', method: 'Visa ··4242' },
  { id: 'INV-1948', date: '2026-01-01', period: 'Dec 2025', amount: 145.00, status: 'paid', method: 'Visa ··4242' },
  { id: 'INV-1923', date: '2025-12-01', period: 'Nov 2025', amount: 133.00, status: 'paid', method: 'Visa ··4242' },
]

export function usagePct(used: number, limit: number): number {
  return Math.min(100, Math.round((used / limit) * 100))
}

export function formatUsage(n: number, unit: string): string {
  return `${n.toLocaleString()}${unit}`
}

@Component({
  selector: 'app-settings-billing',
  standalone: true,
  imports: [
    RouterLink,
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
    <div class="space-y-4">
      <header class="space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight">Billing</h1>
        <p class="text-muted-foreground text-sm">Plan, usage, payment method, and invoice history.</p>
      </header>

      <div class="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <ui-card>
          <ui-card-header>
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-1">
                <ui-card-description class="text-xs uppercase tracking-wider">Current plan</ui-card-description>
                <ui-card-title class="text-base">{{ plan().name }}</ui-card-title>
              </div>
              @if (plan().renews) {
                <ui-badge variant="secondary">Renews {{ renewsDate() }}</ui-badge>
              }
            </div>
          </ui-card-header>
          <ui-card-content class="space-y-3">
            @if (justCheckedOut() && !hasActiveSub()) {
              <div class="border-primary/30 bg-primary/5 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <lucide-icon [img]="LoaderIcon" class="text-primary size-4 animate-spin" />
                Finalising your subscription… (Polar's webhook usually arrives in a second or two.)
              </div>
            } @else if (subscription()) {
              <span
                ui-badge
                [variant]="subscription()!.status === 'past_due' ? 'warning' : hasActiveSub() ? 'success' : 'secondary'"
                class="capitalize"
              >{{ subscription()!.status }}</span>
            } @else {
              <div class="text-muted-foreground text-sm">
                You're on the free tier. Upgrade for more seats, integrations, and priority support.
              </div>
            }
            <div class="flex flex-wrap gap-2 pt-2">
              @if (hasActiveSub()) {
                <button ui-button [disabled]="portalState() === 'opening'" (click)="openPortal()">
                  @if (portalState() === 'opening') {
                    <lucide-icon [img]="LoaderIcon" class="size-4 animate-spin" />
                  } @else {
                    <lucide-icon [img]="CardIcon" class="size-4" />
                  }
                  Manage subscription
                </button>
              } @else {
                <a ui-button routerLink="/pricing">View plans</a>
              }
            </div>
            @if (portalError()) {
              <div class="text-destructive flex items-center gap-2 text-sm">
                <lucide-icon [img]="AlertIcon" class="size-4" />
                {{ portalError() }}
              </div>
            }
          </ui-card-content>
        </ui-card>

        <ui-card>
          <ui-card-header>
            <ui-card-title class="text-base">Payment method</ui-card-title>
          </ui-card-header>
          <ui-card-content class="space-y-3">
            <div class="bg-muted/40 flex items-center gap-3 rounded-lg border p-3">
              <lucide-icon [img]="CardIcon" class="text-muted-foreground size-5" />
              <div class="flex-1">
                <p class="text-sm font-medium">Visa ending in 4242</p>
                <p class="text-muted-foreground text-xs">Expires 09 / 28</p>
              </div>
            </div>
            <button ui-button variant="outline" size="sm" class="w-full">Update card</button>
          </ui-card-content>
        </ui-card>
      </div>

      <ui-card>
        <ui-card-header>
          <ui-card-title class="text-base">Usage this cycle</ui-card-title>
          <ui-card-description>
            Resets {{ plan().renews }}. Anything over the cap is billed at the overage rate (see plan details).
          </ui-card-description>
        </ui-card-header>
        <ui-card-content class="space-y-4">
          @for (u of usage; track u.label) {
            <ui-usage-bar
              [label]="u.label"
              [used]="u.used"
              [limit]="u.limit"
              [valueText]="fmt(u.used, u.unit) + ' / ' + fmt(u.limit, u.unit)"
            />
          }
        </ui-card-content>
      </ui-card>

      <ui-card>
        <ui-card-header>
          <ui-card-title class="text-base">Invoices</ui-card-title>
          <ui-card-description>PDF downloads stay available for 7 years.</ui-card-description>
        </ui-card-header>
        <ui-table>
          <thead ui-table-header>
            <tr ui-table-row>
              <th ui-table-head>Invoice              </th>
              <th ui-table-head>Issued              </th>
              <th ui-table-head>Period              </th>
              <th ui-table-head class="text-right">Amount ($)              </th>
              <th ui-table-head>Status              </th>
              <th ui-table-head>Method              </th>
              <th ui-table-head class="text-right">PDF              </th>
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
                      class="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center rounded p-0.5 focus-visible:outline-none focus-visible:ring-2"
                      [attr.aria-label]="'Copy ' + inv.id"
                      [title]="'Copy ' + inv.id"
                      (click)="copyInvoiceId(inv.id)"
                    >
                      <lucide-icon [img]="CopyIcon" class="size-3.5" />
                    </button>
                  </span>
                </td>
                <td ui-table-cell class="text-muted-foreground text-xs tabular-nums">{{ inv.date }}</td>
                <td ui-table-cell class="text-xs">{{ inv.period }}</td>
                <td ui-table-cell class="text-right tabular-nums">\${{ inv.amount.toFixed(2) }}</td>
                <td ui-table-cell>
                  <span class="text-success flex items-center gap-1 text-xs capitalize">
                    <lucide-icon [img]="PaidIcon" class="size-3" />
                    {{ inv.status }}
                  </span>
                </td>
                <td ui-table-cell class="text-muted-foreground text-xs">{{ inv.method }}</td>
                <td ui-table-cell class="text-right">
                  <!-- WHY (Rule76/87): the download trigger is 32px with both
                       an accessible name and a tooltip. -->
                  <ui-tooltip-provider>
                    <ui-tooltip>
                      <button ui-button ui-tooltip-trigger variant="ghost" size="icon" class="size-8" [attr.aria-label]="'Download ' + inv.id">
                        <lucide-icon [img]="DownloadIcon" class="size-4" />
                      </button>
                      <ui-tooltip-content><p>Download {{ inv.id }}</p></ui-tooltip-content>
                    </ui-tooltip>
                  </ui-tooltip-provider>
                </td>
              </tr>
            }
          </tbody>
        </ui-table>
      </ui-card>
    </div>
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

  protected readonly usage = USAGE_THIS_CYCLE
  protected readonly invoices = INVOICES

  protected readonly justCheckedOut = signal(
    inject(ActivatedRoute).snapshot.queryParamMap.get('status') === 'success',
  )
  protected readonly subscription = signal<SubscriptionRow | null>(null)
  protected readonly hasActiveSub = computed(() => {
    const sub = this.subscription()
    return !!sub && ACTIVE_STATUSES.includes(sub.status)
  })

  // Displayed plan label derived from the real subscription, falling back
  // to a "Free" presentation when the user hasn't checked out yet.
  protected readonly plan = computed(() => {
    const sub = this.subscription()
    if (!sub) return { name: 'Free', price: 0, cycle: '—', renews: null as string | null }
    const label = sub.plan ? sub.plan[0]!.toUpperCase() + sub.plan.slice(1) : 'Subscribed'
    return { name: label, price: 0, cycle: '—', renews: sub.currentPeriodEnd }
  })

  protected readonly renewsDate = computed(() => {
    const renews = this.plan().renews
    return renews
      ? new Date(renews).toLocaleDateString(this.i18n.locale, { month: 'short', day: 'numeric', year: 'numeric' })
      : ''
  })

  protected readonly portalState = signal<'idle' | 'opening' | 'error'>('idle')
  protected readonly portalError = signal<string | null>(null)

  constructor() {
    inject(Title).setTitle('Billing · Settings')
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

  pct(used: number, limit: number): number {
    return usagePct(used, limit)
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
    toast.success('Invoice ID copied')
  }

  fmt(n: number, unit: string): string {
    return formatUsage(n, unit)
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
