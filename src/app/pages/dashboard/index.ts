// Dashboard overview — KPI strip + range tabs + charts + live map + tour.
// Ports nuxt-boilerplate `app/pages/dashboard/index.vue` HEAD 1:1 (signals
// for range, createDashboardData for the mock + Range model, echarts via
// lazy chart primitives which are SSR-safe, LeafletMap + Tour wired for real).
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, PLATFORM_ID, signal, ViewChild } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { TranslatePipe } from '@ngx-translate/core'
import { RouterLink } from '@angular/router'
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Briefcase, Building2, Calendar as CalendarIcon, DollarSign,
  LucideAngularModule, MapPin, Minus, Plus, RotateCcw, Sparkles, Table2, Timer, TrendingDown,
  Users, Zap, CheckCircle2,
} from 'lucide-angular'
import { createDashboardData, type Range } from '@/app/core/dashboard/dashboard-data'
import { I18nService, injectPageTitle } from '@/app/core/i18n'
import { formatPct } from '@/app/core/dashboard/funnel'
import {
  customerRadius, customerRegions, kindBadgeVariant, kindDotBg, kindDotClass, markerSizeClass,
  officeLocations, utcOffsetLabel,
} from '@/app/core/dashboard/locations'
import { getChartColors } from '@/app/components/ui/charts/use-chart-theme'
import type { DateRange, DayPickerSelected } from '@/app/components/ui/calendar/day-picker'
import { UiPageBodyComponent, UiPageComponent, UiPageHeaderComponent, UiPageHeaderHeadingComponent } from '@/app/components/ui/page/page.component'
import {
  UiCardActionComponent, UiCardComponent, UiCardContentComponent, UiCardDescriptionComponent, UiCardFooterComponent,
  UiCardHeaderComponent, UiCardTitleComponent,
} from '@/app/components/ui/card/card.component'
import { UiBadgeComponent } from '@/app/components/ui/badge/badge.component'
import {
  UiTooltipComponent,
  UiTooltipContentComponent,
  UiTooltipProviderComponent,
  UiTooltipTriggerComponent,
} from '@/app/components/ui/tooltip/tooltip.component'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import { UiProgressComponent } from '@/app/components/ui/progress/progress.component'
import { UiAvatarComponent, UiAvatarFallbackComponent } from '@/app/components/ui/avatar/avatar.component'
import { UiTabsComponent, UiTabsListComponent, UiTabsTriggerComponent } from '@/app/components/ui/tabs/tabs.component'
import { UiPopoverComponent, UiPopoverContentComponent, UiPopoverTriggerComponent } from '@/app/components/ui/popover/popover.component'
import { UiRangeCalendarComponent } from '@/app/components/ui/range-calendar/range-calendar.component'
import { UiCheckboxComponent } from '@/app/components/ui/checkbox/checkbox.component'
import { UiLabelComponent } from '@/app/components/ui/label/label.component'
import { UiTourComponent, type TourStep } from '@/app/components/ui/tour/tour.component'
import { UiSparklineComponent } from '@/app/components/ui/charts/sparkline/sparkline.component'
import { UiBarChartComponent } from '@/app/components/ui/charts/bar-chart/bar-chart.component'
import { UiFunnelChartComponent } from '@/app/components/ui/charts/funnel-chart/funnel-chart.component'
import { UiTreemapChartComponent } from '@/app/components/ui/charts/treemap-chart/treemap-chart.component'
import { UiCalendarHeatmapComponent } from '@/app/components/ui/charts/calendar-heatmap/calendar-heatmap.component'
import { UiRawChartComponent } from '@/app/components/ui/charts/raw-chart/raw-chart.component'
import { UiSectionCardComponent } from '@/app/components/ui/section-card/section-card.component'
import { UiEmptyStateComponent } from '@/app/components/ui/empty-state/empty-state.component'
import { UiDataListComponent, UiDataListItemComponent } from '@/app/components/ui/data-list/data-list.component'
import { UiIconBoxComponent } from '@/app/components/ui/icon-box/icon-box.component'
import { UiStatTileComponent } from '@/app/components/blocks/stat-tile/stat-tile.component'
import {
  UiLeafletCircleMarkerComponent, UiLeafletMapComponent, UiLeafletMarkerComponent,
  UiLeafletPopupComponent, UiLeafletTooltipComponent,
} from '@/app/components/ui/leaflet-map/leaflet-map.component'

const TOUR_STORAGE_KEY = 'uipkge-dashboard-tour-dismissed'
// Tour steps whose data-tour target differs from the i18n step key.
const TOUR_TARGETS: Partial<Record<string, string>> = { table: 'table-link', sidebar: 'sidebar-nav' }

// Region map: offices span SF → Sydney, so fitBounds snaps down to zoom 1
// on this wide, short card (the world repeats). Zoom 2 shows it once,
// centred on the band where the offices sit. Whole zoom = no tile seams.
const REGION_VIEW = { center: [20, 14] as [number, number], zoom: 2 }

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-index',
  standalone: true,
  imports: [
    LucideAngularModule,
    RouterLink,
    TranslatePipe,
    UiAvatarComponent,
    UiAvatarFallbackComponent,
    UiBadgeComponent,
    UiBarChartComponent,
    UiButtonComponent,
    UiCalendarHeatmapComponent,
    UiCardActionComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardFooterComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
    UiCheckboxComponent,
    UiDataListComponent,
    UiDataListItemComponent,
    UiEmptyStateComponent,
    UiFunnelChartComponent,
    UiIconBoxComponent,
    UiLabelComponent,
    UiLeafletCircleMarkerComponent,
    UiLeafletMapComponent,
    UiLeafletMarkerComponent,
    UiLeafletPopupComponent,
    UiLeafletTooltipComponent,
    UiPageBodyComponent,
    UiPageComponent,
    UiPageHeaderComponent,
    UiPageHeaderHeadingComponent,
    UiPopoverComponent,
    UiPopoverContentComponent,
    UiPopoverTriggerComponent,
    UiProgressComponent,
    UiRangeCalendarComponent,
    UiRawChartComponent,
    UiSectionCardComponent,
    UiSparklineComponent,
    UiStatTileComponent,
    UiTabsComponent,
    UiTabsListComponent,
    UiTabsTriggerComponent,
    UiTooltipComponent,
    UiTooltipContentComponent,
    UiTooltipProviderComponent,
    UiTooltipTriggerComponent,
    UiTourComponent,
    UiTreemapChartComponent,
  ],
  template: `
    <ui-page>
      <ui-page-header>
        <ui-page-header-heading
          [title]="pageTitle()"
          description="Real-time overview of revenue, traffic, and operations."
        />
        <div slot="actions" class="flex flex-wrap items-center gap-2 sm:justify-end">
          <ui-tabs [value]="range()" (valueChange)="onRangeChange($event)" class="w-auto">
            <ui-tabs-list class="h-8 w-auto">
              <ui-tabs-trigger value="24h" size="sm">24h</ui-tabs-trigger>
              <ui-tabs-trigger value="7d" size="sm">7d</ui-tabs-trigger>
              <ui-tabs-trigger value="30d" size="sm">30d</ui-tabs-trigger>
              <ui-tabs-trigger value="qtd" size="sm">QTD</ui-tabs-trigger>
              <ui-tabs-trigger value="ytd" size="sm">YTD</ui-tabs-trigger>
            </ui-tabs-list>
          </ui-tabs>
          <ui-popover [open]="customOpen()" (openChange)="customOpen.set($event)">
            <button
              ui-button
              ui-popover-trigger
              [variant]="range() === 'custom' ? 'secondary' : 'outline'"
              size="sm"
              class="gap-1.5"
            >
              <lucide-icon [img]="CalendarIcon" class="size-4" aria-hidden="true" />{{
                range() === 'custom' && customSpan() ? customSpan() : ('dashboard.range.custom' | translate)
              }}
            </button>
            <ui-popover-content align="end" class="w-auto p-0">
              <ui-range-calendar [selected]="customCal()" (select)="onCustomSelect($any($event))" />
            </ui-popover-content>
          </ui-popover>
          <button ui-button size="sm" class="gap-1.5">
            <lucide-icon [img]="Sparkles" class="size-4" aria-hidden="true" />Insights
          </button>
          <button
            ui-button
            variant="ghost"
            size="icon-sm"
            class="text-muted-foreground"
            [title]="'dashboard.tour.replay' | translate"
            [attr.aria-label]="'dashboard.tour.replay' | translate"
            (click)="replayTour()"
          >
            <lucide-icon [img]="RotateCcw" class="size-4" aria-hidden="true" />
          </button>
        </div>
      </ui-page-header>

      <ui-page-body class="@container space-y-4">
        <!-- WHY (Rule98): visible freshness stamp. The demo anchor is fixed
             (see createDashboardData asOfLabel) so SSR + client agree. -->
        <p class="text-muted-foreground text-xs">{{ 'dashboard.asOf' | translate: { date: asOfLabel } }}</p>
        <!-- KPI strip: 5 tiles, each with a trend-only Sparkline (Rule59).
             Minis are shape, not scale -- Sparkline is zero-based. -->
        <div data-tour="kpis" class="grid grid-cols-2 gap-3 sm:gap-4 @2xl:grid-cols-3 @5xl:grid-cols-5">
          <ui-stat-tile label="MRR" [value]="'$' + formatK(totalMrr)" [delta]="kpi().mrr.delta" [icon]="DollarSign" [definition]="'dashboard.kpiDefs.mrr' | translate">
            <ui-sparkline [data]="kpi().spark.revenue" [height]="36" variant="area" class="mt-2" ariaLabel="MRR trend sparkline" />
          </ui-stat-tile>

          <ui-stat-tile label="Active users" value="12,847" [delta]="kpi().users.delta" [icon]="UsersIcon" [definition]="'dashboard.kpiDefs.users' | translate">
            <ui-sparkline [data]="kpi().spark.users" [height]="36" variant="bars" [color]="chartBlue()" class="mt-2" ariaLabel="Active users trend bar chart" />
          </ui-stat-tile>

          <ui-stat-tile label="Requests / min" value="2,484" [delta]="kpi().rpm.delta" [icon]="ZapIcon" [definition]="'dashboard.kpiDefs.rpm' | translate">
            <ui-sparkline [data]="kpi().spark.requests" [height]="36" variant="line" [color]="chartBlue()" class="mt-2" ariaLabel="Requests per minute trend line" />
          </ui-stat-tile>

          <!-- Avg latency: rising is bad, so delta tone is negative. -->
          <ui-stat-tile label="Avg latency" value="412ms" [delta]="kpi().latency.delta" deltaTone="negative" [icon]="TimerIcon" [definition]="'dashboard.kpiDefs.latency' | translate">
            <ui-sparkline [data]="kpi().spark.latency" [height]="36" variant="dots" class="mt-2" ariaLabel="Average latency trend line with sampled points" />
          </ui-stat-tile>

          <!-- Churn: down is good, so delta stays positive even though it's
               a negative number. -->
          <ui-stat-tile label="Churn" value="1.8%" [delta]="kpi().churn.delta" [icon]="TrendingDownIcon" [definition]="'dashboard.kpiDefs.churn' | translate" class="col-span-2 @5xl:col-span-1">
            <div class="space-y-1.5 pt-2">
              <ui-progress [value]="98.2" class="h-1.5" />
              <div class="flex justify-between text-xs text-muted-foreground tabular-nums">
                <span>Retained 98.2%</span>
                <span>Target 99%</span>
              </div>
            </div>
          </ui-stat-tile>
        </div>

        <!-- Charts row 1: revenue combo (wide) + funnel + quota gauge -->
        <div data-tour="charts" class="grid gap-4 @4xl:grid-cols-3">
          <ui-card class="flex flex-col">
            <ui-card-header>
              <h3 ui-card-title class="text-base font-semibold">Revenue vs expenses</h3>
              <ui-card-description>{{ displayLabel() }} · in USD</ui-card-description>
              <ui-card-action>
                <span ui-badge variant="outline">MRR {{ kpi().mrr.delta }}</span>
              </ui-card-action>
            </ui-card-header>
            <ui-card-content>
              <ui-raw-chart [option]="revenueComboOption()" [height]="300" ariaLabel="Revenue versus expenses chart" />
            </ui-card-content>
            <ui-card-footer class="mt-auto">
              <dl class="grid w-full grid-cols-3 gap-2 border-t pt-3 text-center">
                <div>
                  <dt class="text-muted-foreground text-xs">Revenue</dt>
                  <dd class="text-sm font-medium tabular-nums">\${{ formatK(revenueTotals().revenue) }}</dd>
                </div>
                <div>
                  <dt class="text-muted-foreground text-xs">Expenses</dt>
                  <dd class="text-sm font-medium tabular-nums">\${{ formatK(revenueTotals().expenses) }}</dd>
                </div>
                <div>
                  <dt class="text-muted-foreground text-xs">Net</dt>
                  <dd class="text-sm font-medium tabular-nums">\${{ formatK(revenueTotals().net) }}</dd>
                </div>
              </dl>
            </ui-card-footer>
          </ui-card>
          <ui-card class="flex flex-col">
            <ui-card-header>
              <h3 ui-card-title class="text-base font-semibold">Conversion funnel</h3>
              <ui-card-description>{{ displayLabel() }} · {{ formatPctValue(funnelSummary().endToEnd) }} end-to-end</ui-card-description>
            </ui-card-header>
            <ui-card-content>
              <ui-funnel-chart [data]="funnel()" [height]="300" [option]="funnelOption()" />
            </ui-card-content>
          </ui-card>
          <ui-card class="flex flex-col">
            <ui-card-header>
              <h3 ui-card-title class="text-base font-semibold">Quota</h3>
              <ui-card-description>API · monthly</ui-card-description>
              <ui-card-action>
                <ui-tooltip-provider>
                  <ui-tooltip>
                    <span ui-badge ui-tooltip-trigger variant="outline" tabindex="0" class="text-muted-foreground px-1.5">
                      <lucide-icon [img]="CalendarIcon" class="size-3" aria-hidden="true" />
                      <span class="sr-only">{{ 'dashboard.range.staticNote' | translate }}</span>
                    </span>
                    <ui-tooltip-content class="text-xs">{{ 'dashboard.range.staticNote' | translate }}</ui-tooltip-content>
                  </ui-tooltip>
                </ui-tooltip-provider>
              </ui-card-action>
            </ui-card-header>
            <ui-card-content class="flex flex-1 flex-col gap-4">
              <ui-raw-chart [option]="gaugeOption()" [height]="220" ariaLabel="API quota usage gauge" />
              <dl class="grid grid-cols-3 gap-2 border-t pt-4 text-center">
                <div>
                  <dt class="text-muted-foreground text-xs">Used</dt>
                  <dd class="text-sm font-medium tabular-nums">{{ formatK(quotaMeta.used) }}<span class="text-muted-foreground block text-xs font-normal">{{ 'dashboard.quota.unit' | translate }}</span></dd>
                </div>
                <div>
                  <dt class="text-muted-foreground text-xs">Left</dt>
                  <dd class="text-sm font-medium tabular-nums">{{ formatK(quotaMeta.remaining) }}<span class="text-muted-foreground block text-xs font-normal">{{ 'dashboard.quota.unit' | translate }}</span></dd>
                </div>
                <div>
                  <dt class="text-muted-foreground text-xs">Resets</dt>
                  <dd class="text-sm font-medium tabular-nums">{{ quotaMeta.renews }}</dd>
                </div>
              </dl>
            </ui-card-content>
            <ui-card-footer class="mt-auto">
              <a ui-button variant="ghost" size="sm" routerLink="/settings/billing" class="text-muted-foreground w-full gap-1 text-xs">
                Need more quota? View plans<lucide-icon [img]="ArrowRight" class="size-3.5" aria-hidden="true" />
              </a>
            </ui-card-footer>
          </ui-card>
        </div>

        <!-- Charts row 2: bar chart + treemap + alerts list -->
        <div class="grid gap-4 @4xl:grid-cols-3">
          <!-- Chart cards stretch to the row (the alerts timeline sets its
               height), so the charts fill the card instead of a fixed 200px. -->
          <ui-card class="flex flex-col">
            <ui-card-header>
              <h3 ui-card-title class="text-base font-semibold">{{ requestsBlock().title }}</h3>
              <ui-card-description>{{ requestsBlock().subtitle }}</ui-card-description>
            </ui-card-header>
            <ui-card-content class="min-h-[200px] flex-1">
              <ui-bar-chart [data]="requestsBlock().data" xField="x" yField="y" height="100%" unit="requests" [option]="compactValueAxis" [ariaLabel]="requestsBlock().title" />
            </ui-card-content>
          </ui-card>
          <ui-card class="flex flex-col">
            <ui-card-header>
              <h3 ui-card-title class="text-base font-semibold">Headcount by department</h3>
              <ui-card-description>{{ totalHeadcount.toLocaleString() }} people across {{ totalDepartments }} departments</ui-card-description>
              <ui-card-action>
                <ui-tooltip-provider>
                  <ui-tooltip>
                    <span ui-badge ui-tooltip-trigger variant="outline" tabindex="0" class="text-muted-foreground px-1.5">
                      <lucide-icon [img]="CalendarIcon" class="size-3" aria-hidden="true" />
                      <span class="sr-only">{{ 'dashboard.range.staticNote' | translate }}</span>
                    </span>
                    <ui-tooltip-content class="text-xs">{{ 'dashboard.range.staticNote' | translate }}</ui-tooltip-content>
                  </ui-tooltip>
                </ui-tooltip-provider>
              </ui-card-action>
            </ui-card-header>
            <ui-card-content class="min-h-[200px] flex-1">
              <ui-treemap-chart [data]="segments" height="100%" ariaLabel="Headcount by department treemap" />
            </ui-card-content>
          </ui-card>
          <ui-card class="flex flex-col">
            <ui-card-header class="flex flex-row items-center justify-between space-y-0">
              <div>
                <h3 ui-card-title class="text-base font-semibold">Active alerts</h3>
                <ui-card-description>5 open · 12 resolved today</ui-card-description>
              </div>
              <button ui-button variant="ghost" size="sm" class="h-8 gap-1 text-xs">
                All<lucide-icon [img]="ArrowRight" class="size-3.5" aria-hidden="true" />
              </button>
            </ui-card-header>
            <ui-card-content class="flex flex-1 flex-col pb-4">
              <!-- Timeline: one continuous rail, a severity node per alert. -->
              <!-- WHY (Rule81): trivial failed-state branch -- an empty alert
                   list renders an EmptyState instead of a blank card. -->
              @if (alerts.length) {
                <ol class="flex flex-1 flex-col justify-between">
                  @for (a of alerts; track a.title; let i = $index; let last = $last) {
                    <li class="relative flex gap-3 pb-4 last:pb-0">
                      @if (!last) {
                        <span class="bg-border absolute top-8 bottom-0 left-4 w-px -translate-x-1/2" aria-hidden="true"></span>
                      }
                      <span [class]="'ring-card relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ' + severityClass[a.severity].node">
                        <lucide-icon [img]="a.icon" class="size-4" aria-hidden="true" />
                      </span>
                      <div class="min-w-0 flex-1 pt-0.5">
                        <div class="truncate text-sm font-medium" [title]="a.title">{{ a.title }}</div>
                        <div class="text-muted-foreground line-clamp-1 text-xs">{{ a.detail }}</div>
                        <div class="mt-1.5 flex items-center gap-2">
                          <span [class]="'rounded-sm px-1.5 py-0.5 text-xs font-medium ' + severityClass[a.severity].badge">
                            {{ severityClass[a.severity].label }}
                          </span>
                          <span class="text-muted-foreground min-w-0 truncate text-xs">{{ a.source }}</span>
                          <span class="text-muted-foreground ml-auto shrink-0 text-xs tabular-nums">{{ a.age }}</span>
                        </div>
                      </div>
                    </li>
                  }
                </ol>
              } @else {
                <ui-empty-state
                  [icon]="alertsEmptyIcon"
                  [title]="'dashboard.alerts.emptyTitle' | translate"
                  [description]="'dashboard.alerts.emptyDescription' | translate"
                >
                  <ng-template #alertsEmptyIcon><lucide-icon [img]="CheckCircle2Icon" /></ng-template>
                </ui-empty-state>
              }
            </ui-card-content>
          </ui-card>
        </div>

        <!-- Customers by region: muted world map embedded in a scrollable page,
             so wheel zoom stays off and the wheel scrolls the page. -->
        <ui-card>
          <ui-card-header>
            <h3 ui-card-title class="text-base font-semibold">{{ 'dashboard.locations.widgetTitle' | translate }}</h3>
            <ui-card-description>{{ 'dashboard.locations.widgetDescription' | translate }}</ui-card-description>
            <ui-card-action>
              <span ui-badge variant="outline" class="tabular-nums">
                <lucide-icon [img]="Building2" class="size-3" aria-hidden="true" />
                {{ officeCountLabel() }}
              </span>
            </ui-card-action>
          </ui-card-header>
          <!-- Map fills the card edge to edge (no inner frame), like locations. -->
          <ui-card-content class="p-0">
            <div class="relative isolate">
              <ui-leaflet-map
                #regionMap
                variant="muted"
                [center]="mapCenter"
                [zoom]="2"
                [minZoom]="1"
                [scrollWheelZoom]="false"
                [navigation]="false"
                class="h-[360px] w-full overflow-hidden"
                (created)="fitRegionMap(false)"
              >
                @for (c of customerRegions; track c.id) {
                  <ui-leaflet-circle-marker
                    [center]="c.lngLat"
                    [radius]="customerRadius(c.arr) * 0.8"
                    [color]="customerColor()"
                    [fillColor]="customerColor()"
                    [fillOpacity]="0.25"
                    [weight]="1.5"
                  >
                    <ui-leaflet-tooltip direction="top">
                      <span class="text-xs"><span class="font-medium">{{ c.city }}</span> · {{ accountsLabel(c.accounts) }}</span>
                    </ui-leaflet-tooltip>
                  </ui-leaflet-circle-marker>
                }
                @for (office of officeLocations; track office.id; let i = $index) {
                  <ui-leaflet-marker [lngLat]="office.lngLat" anchor="center">
                    <!-- WHY (Rule90): 200ms marker pop-in, and the HQ pulse is
                         gated with motion-safe so reduced-motion gets a static dot. -->
                    <span
                      class="animate-in fade-in-0 zoom-in-50 fill-mode-both relative flex items-center justify-center duration-200"
                      [style.animation-delay]="i * 70 + 'ms'"
                    >
                      @if (office.kind === 'hq') {
                        <span [class]="'absolute inset-0 rounded-full opacity-40 motion-safe:animate-ping ' + kindDotBg(office.kind)" aria-hidden="true"></span>
                      }
                      <span [class]="'outline-background relative block rounded-full ring-4 outline-2 transition-transform duration-200 hover:scale-125 ' + markerSize(office.headcount) + ' ' + kindDot(office.kind)"></span>
                    </span>
                    <ui-leaflet-popup [offset]="[0, -10]" [minWidth]="240">
                      <div class="w-60">
                        <div class="flex items-start justify-between gap-3 pr-5">
                          <div class="min-w-0">
                            <div class="flex items-center gap-1.5">
                              <span [class]="'size-2 shrink-0 rounded-full ' + kindDotBg(office.kind)" aria-hidden="true"></span>
                              <span class="truncate text-sm font-semibold" [title]="office.city">{{ office.city }}</span>
                            </div>
                            <div class="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                              <span class="truncate">{{ office.country }}</span>
                            </div>
                          </div>
                          <span ui-badge [variant]="badgeVariant(office.kind)" class="shrink-0">
                            {{ office.kind === 'hq' ? 'HQ' : office.kind === 'hub' ? 'Hub' : 'Office' }}
                          </span>
                        </div>
                        <div class="bg-muted/50 mt-3 grid grid-cols-3 divide-x rounded-md border">
                          <div class="px-2 py-1.5">
                            <div class="text-muted-foreground flex items-center gap-1 text-xs">
                              <lucide-icon [img]="UsersIcon" class="size-3.5" />
                              People
                            </div>
                            <div class="mt-0.5 text-sm font-semibold tabular-nums">{{ office.headcount }}</div>
                            <div class="text-success text-xs tabular-nums">+{{ office.growth }}%</div>
                          </div>
                          <div class="px-2 py-1.5">
                            <div class="text-muted-foreground flex items-center gap-1 text-xs">
                              <lucide-icon [img]="BriefcaseIcon" class="size-3.5" />
                              Roles
                            </div>
                            <div class="mt-0.5 text-sm font-semibold tabular-nums">{{ office.openRoles }}</div>
                            <div class="text-muted-foreground text-xs">hiring</div>
                          </div>
                          <div class="px-2 py-1.5">
                            <div class="text-muted-foreground flex items-center gap-1 text-xs">
                              <lucide-icon [img]="CalendarIcon" class="size-3.5" />
                              Opened
                            </div>
                            <div class="mt-0.5 text-sm font-semibold tabular-nums">{{ office.opened }}</div>
                            <div class="text-muted-foreground text-xs">{{ utcOffset(office.timezone) }}</div>
                          </div>
                        </div>
                        <div class="mt-3 flex items-center gap-2">
                          <span class="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                            {{ initials(office.lead) }}
                          </span>
                          <div class="min-w-0 text-xs">
                            <div class="truncate font-medium" [title]="office.lead">{{ office.lead }}</div>
                            <div class="text-muted-foreground">Office lead</div>
                          </div>
                        </div>
                      </div>
                    </ui-leaflet-popup>
                  </ui-leaflet-marker>
                }
              </ui-leaflet-map>
              <div class="bg-card/90 absolute right-3 bottom-3 z-[800] flex flex-col overflow-hidden rounded-md border backdrop-blur-sm">
                <button
                  ui-button
                  variant="ghost"
                  size="icon"
                  class="size-8 rounded-none"
                  aria-label="Zoom in"
                  title="Zoom in"
                  (click)="regionMap?.zoomIn()"
                >
                  <lucide-icon [img]="Plus" class="size-4" />
                </button>
                <button
                  ui-button
                  variant="ghost"
                  size="icon"
                  class="size-8 rounded-none border-t"
                  aria-label="Zoom out"
                  title="Zoom out"
                  (click)="regionMap?.zoomOut()"
                >
                  <lucide-icon [img]="Minus" class="size-4" />
                </button>
                <button
                  ui-button
                  variant="ghost"
                  size="icon"
                  class="size-8 rounded-none border-t"
                  aria-label="Reset view"
                  title="Reset view"
                  (click)="onMapReset()"
                >
                  <lucide-icon [img]="RotateCcw" class="size-4" />
                </button>
              </div>
            </div>
          </ui-card-content>
          <ui-card-footer class="justify-end pt-4">
            <a ui-button variant="ghost" size="sm" routerLink="/dashboard/locations" class="text-muted-foreground gap-1.5 text-xs">
              <lucide-icon [img]="MapPin" class="size-3.5" aria-hidden="true" />
              {{ 'dashboard.locations.viewAll' | translate }}
              <lucide-icon [img]="ArrowRight" class="size-3.5" aria-hidden="true" />
            </a>
          </ui-card-footer>
        </ui-card>

        <!-- Calendar heatmap (full width, dense) -->
        <ui-card>
          <ui-card-header>
            <h3 ui-card-title class="text-base font-semibold">Deploy activity · last 365 days</h3>
            <ui-card-description
              >{{ totalDeploys.toLocaleString() }} deploys · longest streak 18 days ·
              {{ 'dashboard.heatmap.asOf' | translate: { date: asOfLabel } }}</ui-card-description
            >
            <ui-card-action class="text-muted-foreground flex flex-wrap items-center justify-end gap-2 text-xs">
              <span ui-badge variant="outline">{{ 'dashboard.range.staticNote' | translate }}</span>
              <span>Less</span>
              <div class="flex gap-0.5">
                <span class="bg-chart-1/10 size-2.5 rounded-sm"></span>
                <span class="bg-chart-1/35 size-2.5 rounded-sm"></span>
                <span class="bg-chart-1/65 size-2.5 rounded-sm"></span>
                <span class="bg-chart-1 size-2.5 rounded-sm"></span>
              </div>
              <span>More</span>
            </ui-card-action>
          </ui-card-header>
          <ui-card-content>
            <ui-calendar-heatmap
              [data]="calendarData"
              [range]="calendarRange"
              [colorRange]="calendarColorRange()"
              [option]="calendarOption()"
              [height]="160"
              ariaLabel="Deploy activity heatmap for the last 365 days"
            />
          </ui-card-content>
        </ui-card>

        <!-- Bottom row: top products + customer list + recent activity -->
        <div class="grid gap-4 @4xl:grid-cols-3">
          <ui-card class="flex flex-col">
            <ui-card-header>
              <h3 ui-card-title class="text-base font-semibold">Top products by MRR</h3>
              <ui-card-description>5 products · \${{ formatK(totalMrr) }} total</ui-card-description>
            </ui-card-header>
            <ui-card-content class="space-y-3">
              @for (p of topProducts(); track p.name) {
                <div class="space-y-1">
                  <div class="flex items-baseline justify-between gap-3">
                    <span class="truncate text-sm" [title]="p.name">{{ p.name }}</span>
                    <div class="flex items-baseline gap-1.5">
                      <span class="text-sm font-semibold tabular-nums">\${{ formatK(p.mrr) }}</span>
                      <span [class]="'text-xs font-medium ' + (p.up ? 'text-success' : 'text-destructive')">
                        <lucide-icon [img]="p.up ? ArrowUpRight : ArrowDownRight" class="inline size-3.5" />{{ p.change }}
                      </span>
                    </div>
                  </div>
                  <ui-progress [value]="(p.mrr / totalMrr) * 100" class="h-1.5" />
                </div>
              }
              <!-- Share of MRR: one stacked bar, same order and colours as the list. -->
              <div class="space-y-2 border-t pt-3">
                <div class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Share of MRR</div>
                <div class="flex h-2 overflow-hidden rounded-full">
                  @for (p of topProducts(); track p.name; let i = $index) {
                    <div [class]="'h-full ' + shareColors[i % shareColors.length]" [style.width.%]="(p.mrr / totalMrr) * 100"></div>
                  }
                </div>
                <div class="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  @for (p of topProducts(); track p.name; let i = $index) {
                    <span class="flex items-center gap-1.5">
                      <span [class]="'size-2 rounded-full ' + shareColors[i % shareColors.length]"></span>
                      {{ p.name }} <span class="tabular-nums">{{ sharePct(p.mrr) }}%</span>
                    </span>
                  }
                </div>
              </div>
            </ui-card-content>
            <ui-card-footer class="mt-auto">
              <a ui-button variant="ghost" size="sm" routerLink="/settings/billing" class="text-muted-foreground w-full gap-1 text-xs">
                View plans<lucide-icon [img]="ArrowRight" class="size-3.5" />
              </a>
            </ui-card-footer>
          </ui-card>

          <ui-card class="flex flex-col">
            <ui-card-header>
              <h3 ui-card-title class="text-base font-semibold">Top customers</h3>
              <ui-card-description>By MRR · 6 of 142 accounts</ui-card-description>
            </ui-card-header>
            <ui-card-content class="divide-y">
              @for (c of topCustomers; track c.name) {
                <div class="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <ui-avatar class="size-8">
                    <ui-avatar-fallback class="bg-muted text-muted-foreground text-xs font-medium">
                      {{ c.avatar }}
                    </ui-avatar-fallback>
                  </ui-avatar>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium" [title]="c.name">{{ c.name }}</p>
                    <p class="text-muted-foreground text-xs">
                      {{ c.plan }} · <span [class]="'inline-block size-1.5 rounded-full ' + statusTone[c.status]"></span> {{ c.status }}
                    </p>
                  </div>
                  <span class="text-sm font-semibold tabular-nums whitespace-nowrap">\${{ formatK(c.mrr) }}</span>
                </div>
              }
            </ui-card-content>
            <ui-card-footer class="mt-auto">
              <a ui-button variant="ghost" size="sm" routerLink="/dashboard/data-table" class="text-muted-foreground w-full gap-1 text-xs">
                View all customers<lucide-icon [img]="ArrowRight" class="size-3.5" />
              </a>
            </ui-card-footer>
          </ui-card>

          <ui-section-card title="Recent activity" description="Live feed across products">
            <ui-data-list>
              @for (item of recentActivities; track item.title) {
                <ui-data-list-item>
                  <div class="flex items-center gap-3">
                    <ui-icon-box variant="muted">
                      <lucide-icon [img]="item.icon" [class]="'size-4 ' + item.iconClass" />
                    </ui-icon-box>
                    <div>
                      <p class="text-sm font-medium">{{ item.title }}</p>
                      <p class="text-muted-foreground text-xs">{{ item.detail }}</p>
                    </div>
                  </div>
                  <span class="text-muted-foreground ml-3 text-xs whitespace-nowrap tabular-nums">{{ item.age }}</span>
                </ui-data-list-item>
              }
            </ui-data-list>
            <a ui-button variant="ghost" size="sm" routerLink="/settings/activity" class="text-muted-foreground mt-auto w-full gap-1 text-xs">
              View all activity<lucide-icon [img]="ArrowRight" class="size-3.5" />
            </a>
          </ui-section-card>
        </div>

        <!-- Full data-table entry point (also a tour target). -->
        <div data-tour="table-link" class="flex justify-center">
          <a ui-button variant="ghost" size="sm" routerLink="/dashboard/data-table" class="text-muted-foreground gap-1.5 text-xs">
            <lucide-icon [img]="Table2" class="size-3.5" aria-hidden="true" />
            {{ 'dashboard.tableLink.label' | translate }}
            <lucide-icon [img]="ArrowRight" class="size-3.5" aria-hidden="true" />
          </a>
        </div>
      </ui-page-body>

      @if (isBrowser()) {
        <ui-tour
          [open]="tourOpen()"
          [current]="tourStep()"
          [steps]="tourSteps()"
          (openChange)="onTourOpenChange($event)"
          (currentChange)="tourStep.set($event)"
          (finish)="onTourFinish()"
          (close)="onTourClose()"
        />
        @if (tourOpen()) {
          <div class="bg-popover text-popover-foreground fixed right-4 bottom-4 z-[1002] flex items-center gap-2 rounded-lg border px-3 py-2 shadow-lg">
            <ui-checkbox id="tour-dont-show" [checked]="dontShowAgain()" (checkedChange)="dontShowAgain.set($event === true)" />
            <label ui-label for="tour-dont-show" class="cursor-pointer text-xs font-normal">{{ 'dashboard.tour.dontShowAgain' | translate }}</label>
          </div>
        }
      }
    </ui-page>
  `,
})
export class DashboardIndexComponent implements OnInit {
  protected readonly ArrowDownRight = ArrowDownRight
  protected readonly ArrowRight = ArrowRight
  protected readonly ArrowUpRight = ArrowUpRight
  protected readonly Building2 = Building2
  protected readonly BriefcaseIcon = Briefcase
  protected readonly CalendarIcon = CalendarIcon
  protected readonly CheckCircle2Icon = CheckCircle2
  protected readonly DollarSign = DollarSign
  protected readonly MapPin = MapPin
  protected readonly Minus = Minus
  protected readonly Plus = Plus
  protected readonly RotateCcw = RotateCcw
  protected readonly Sparkles = Sparkles
  protected readonly Table2 = Table2
  protected readonly TimerIcon = Timer
  protected readonly TrendingDownIcon = TrendingDown
  protected readonly UsersIcon = Users
  protected readonly ZapIcon = Zap

  private readonly i18n = inject(I18nService)
  readonly pageTitle = injectPageTitle()
  private readonly platformId = inject(PLATFORM_ID)
  readonly isBrowser = signal(isPlatformBrowser(this.platformId))

  readonly range = signal<Range>('30d')
  readonly customCal = signal<DateRange | undefined>(undefined)
  readonly customOpen = signal(false)

  readonly tourOpen = signal(false)
  readonly tourStep = signal(0)
  readonly dontShowAgain = signal(true)

  @ViewChild('regionMap') regionMap?: UiLeafletMapComponent

  readonly mapCenter: [number, number] = [-20, 20]

  private readonly data = createDashboardData(this.range)
  readonly revenueComboOption = this.data.revenueComboOption
  readonly revenueSeries = this.data.revenueSeries
  readonly requestsBlock = this.data.requestsBlock
  readonly funnel = this.data.funnel
  readonly funnelSummary = this.data.funnelSummary
  readonly funnelOption = this.data.funnelOption
  readonly segments = this.data.segments
  readonly totalHeadcount = this.data.totalHeadcount
  readonly totalDepartments = this.data.totalDepartments
  readonly calendarData = this.data.calendarData
  readonly calendarRange = this.data.calendarRange
  readonly calendarColorRange = this.data.calendarColorRange
  readonly calendarOption = this.data.calendarOption
  readonly gaugeOption = this.data.gaugeOption
  readonly quotaMeta = this.data.quotaMeta
  readonly topProducts = this.data.topProducts
  readonly alerts = this.data.alerts
  readonly topCustomers = this.data.topCustomers
  readonly activities = this.data.activities
  readonly recentActivities = this.data.activities.slice(0, 5)
  readonly totalMrr = this.data.totalMrr
  readonly totalDeploys = this.data.totalDeploys
  readonly asOfLabel = this.data.asOfLabel
  readonly statusTone = this.data.statusTone
  readonly formatK = this.data.formatK
  readonly kpi = this.data.kpi
  readonly rangeLabel = this.data.rangeLabel

  // Range totals for the revenue card footer -- balances the funnel card's
  // step-rates footer so the row stays even.
  readonly revenueTotals = computed(() => {
    const pts = this.revenueSeries()
    const revenue = pts.reduce((t, p) => t + p.revenue, 0)
    const expenses = pts.reduce((t, p) => t + p.expenses, 0)
    return { revenue, expenses, net: revenue - expenses }
  })

  readonly officeLocations = officeLocations
  readonly customerRegions = customerRegions

  readonly shareColors = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5']

  // "35k" instead of "35,000" — frees width for the bars.
  readonly compactValueAxis = {
    yAxis: { splitNumber: 4, axisLabel: { formatter: (v: number) => (v >= 1000 ? `${v / 1000}k` : String(v)) } },
  }

  readonly severityClass = {
    critical: { node: 'bg-destructive/10 text-destructive', badge: 'bg-destructive/10 text-destructive', label: 'Critical' },
    warning: { node: 'bg-warning/10 text-warning', badge: 'bg-warning/10 text-warning', label: 'Warning' },
    info: { node: 'bg-info/10 text-info', badge: 'bg-info/10 text-info', label: 'Info' },
  } as const

  readonly customStartEnd = computed(() => {
    const v = this.customCal()
    const s = v?.from
    const e = v?.to
    if (!s || !e) return null
    return { start: s, end: e }
  })

  readonly customSpan = computed(() => {
    const se = this.customStartEnd()
    if (!se) return null
    // WHY (Rule71): the label carries the year so "Sep 5 – Sep 12" is never
    // ambiguous across year boundaries.
    const df = new Intl.DateTimeFormat(this.i18n.lang(), { month: 'short', day: 'numeric', year: 'numeric' })
    return this.i18n.t('dashboard.range.customLabel', { start: df.format(se.start), end: df.format(se.end) })
  })

  readonly displayLabel = computed(() =>
    this.range() === 'custom' && this.customSpan() ? this.customSpan()! : this.rangeLabel(),
  )

  readonly officeCountLabel = computed(() => {
    this.i18n.lang()
    return this.i18n.tc('dashboard.locations.officeCount', officeLocations.length)
  })

  accountsLabel(n: number): string {
    this.i18n.lang()
    return this.i18n.tc('dashboard.locations.accounts', n)
  }

  // ponytail: the GitHub step's "Star on GitHub" action is dropped -- the
  // Angular Tour has no step action slot yet (registry-angular lacks it too).
  readonly tourSteps = computed<TourStep[]>(() => {
    this.i18n.lang()
    const t = (k: string) => this.i18n.t(k)
    const nav = {
      prevButtonText: t('dashboard.tour.back'),
      nextButtonText: t('dashboard.tour.next'),
      finishButtonText: t('dashboard.tour.finish'),
    }
    return (['kpis', 'charts', 'table', 'palette', 'theme', 'sidebar', 'profile', 'github'] as const).map((step) => ({
      target: `[data-tour="${TOUR_TARGETS[step] ?? step}"]`,
      title: t(`dashboard.tour.steps.${step}.title`),
      description: t(`dashboard.tour.steps.${step}.description`),
      ...nav,
    }))
  })

  ngOnInit(): void {
    if (!this.isBrowser()) return
    try {
      if (!localStorage.getItem(TOUR_STORAGE_KEY)) this.tourOpen.set(true)
    } catch {
      // Storage unreadable — leave the tour closed rather than nagging.
    }
  }

  onRangeChange(v: string): void {
    this.range.set(v as Range)
    if (v !== 'custom') this.customCal.set(undefined)
  }

  onCustomSelect(v: DayPickerSelected): void {
    const r = v as DateRange | undefined
    this.customCal.set(r)
    if (r?.from && r?.to) {
      this.range.set('custom')
      this.customOpen.set(false)
    }
  }

  formatPctValue(n: number): string {
    return formatPct(n)
  }

  sharePct(mrr: number): number {
    return Math.round((mrr / this.totalMrr) * 100)
  }

  customerColor(): string {
    return getChartColors()[1] ?? '#14b8a6'
  }

  chartBlue(): string {
    return getChartColors()[0] ?? '#2563eb'
  }

  customerRadius(arr: number): number {
    return customerRadius(arr)
  }

  kindDot(kind: Parameters<typeof kindDotClass>[0]): string {
    return kindDotClass(kind)
  }

  kindDotBg(kind: Parameters<typeof kindDotBg>[0]): string {
    return kindDotBg(kind)
  }

  markerSize(headcount: number): string {
    return markerSizeClass(headcount)
  }

  badgeVariant(kind: Parameters<typeof kindBadgeVariant>[0]): 'default' | 'secondary' | 'outline' {
    return kindBadgeVariant(kind)
  }

  utcOffset(timezone?: string): string {
    return timezone ? utcOffsetLabel(timezone) : ''
  }

  initials(lead: string): string {
    return lead.split(' ').map(n => n[0]).join('')
  }

  fitRegionMap(animate = false): void {
    const map = this.regionMap
    if (!map) return
    if (animate) map.flyTo({ ...REGION_VIEW, duration: 600 })
    else map.setView(REGION_VIEW)
  }

  onMapReset(): void {
    this.regionMap?.getMap()?.closePopup()
    this.fitRegionMap(true)
  }

  persistTourDismissed(): void {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, '1')
    } catch {
      // Private mode / blocked storage — tour just shows again next visit.
    }
  }

  // Finish always dismisses for good; skip (X / Escape) only persists
  // when "Don't show again" is checked.
  onTourFinish(): void {
    this.persistTourDismissed()
    this.tourOpen.set(false)
  }

  onTourClose(): void {
    if (this.dontShowAgain()) this.persistTourDismissed()
    this.tourOpen.set(false)
  }

  onTourOpenChange(open: boolean): void {
    // Tour emits openChange(false) on both Finish and skip; route through
    // the same persist rules as the explicit handlers.
    if (!open) {
      this.onTourClose()
      return
    }
    this.tourOpen.set(true)
  }

  replayTour(): void {
    this.tourStep.set(0)
    this.dontShowAgain.set(true)
    this.tourOpen.set(true)
  }
}
