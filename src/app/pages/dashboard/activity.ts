// Daily session heatmap + live audit feed. Ports nuxt-boilerplate's
// app/pages/dashboard/activity.vue (createMonthGrid + deterministic mock;
// /api/activity rows render in "Recent events", sample-data banner otherwise).
import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { TranslatePipe } from '@ngx-translate/core'
import {
  Activity as ActivityIcon,
  AlertCircle,
  Calendar as CalendarIcon,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  Flame,
  FolderPlus,
  LogIn,
  LucideAngularModule,
  MessageSquare,
  MousePointer2,
  Sparkles,
  TrendingUp,
  UserPlus,
  X,
  type LucideIconData,
} from 'lucide-angular'
import {
  createMonthGrid,
  dateFromKey,
  isoDate,
  type DateKey,
} from '@/app/core/dashboard/month-grid'
import { type ApiResponse } from '@/app/core/api/api'
import { I18nService, injectPageTitle } from '@/app/core/i18n'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import { UiCardComponent, UiCardHeaderComponent, UiCardTitleComponent } from '@/app/components/ui/card/card.component'
import { UiEmptyStateComponent } from '@/app/components/ui/empty-state/empty-state.component'
import {
  UiPageBodyComponent,
  UiPageComponent,
  UiPageHeaderComponent,
  UiPageHeaderHeadingComponent,
} from '@/app/components/ui/page'
import { UiDemoDataBannerComponent } from '@/app/components/blocks/demo-data-banner'
import { UiStatTileComponent } from '@/app/components/blocks/stat-tile/stat-tile.component'
import type { ActivityItem } from '@/app/pages/settings/settings-activity'

function djb2(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i)
  return Math.abs(h)
}

// 5-level intensity -> one chart-2 opacity ramp (legend reuses it).
const INTENSITY_RAMP = ['bg-muted/40', 'bg-chart-2/15', 'bg-chart-2/35', 'bg-chart-2/60', 'bg-chart-2/90'] as const

function feedActionIcon(action: string): LucideIconData {
  if (action.startsWith('auth.')) return LogIn
  if (action.startsWith('projects.')) return FolderPlus
  if (action.startsWith('feedback.')) return MessageSquare
  if (action.startsWith('team.')) return UserPlus
  return ActivityIcon
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-activity',
  standalone: true,
  imports: [
    LucideAngularModule,
    TranslatePipe,
    UiButtonComponent,
    UiCardComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
    UiDemoDataBannerComponent,
    UiEmptyStateComponent,
    UiPageBodyComponent,
    UiPageComponent,
    UiPageHeaderComponent,
    UiPageHeaderHeadingComponent,
    UiStatTileComponent,
  ],
  host: {
    '(window:mouseup)': 'grid.endDrag()',
    '(window:mouseleave)': 'grid.endDrag()',
  },
  template: `
    <ui-page>
      <ui-page-header>
        <ui-page-header-heading
          [title]="pageTitle()"
          description="Daily session heatmap. Drag or shift-click to summarize a range."
        />
      </ui-page-header>

      <ui-page-body class="space-y-4">
        @if (!hasLive()) {
          <ui-demo-data-banner />
        }

        <!-- KPI strip -->
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <ui-stat-tile
            label="Total this month"
            [value]="monthStats().total.toLocaleString()"
            caption="sessions"
            [icon]="ActivityIcon"
          />
          <ui-stat-tile
            label="Avg per active day"
            [value]="'' + monthStats().avg"
            caption="sessions/day"
            [icon]="ChartColumn"
          />
          <ui-stat-tile
            label="Peak day"
            [value]="'' + (monthStats().peak?.count ?? 0)"
            [caption]="monthStats().peak ? fmtKey(monthStats().peak!.key) : '—'"
            [icon]="TrendingUp"
          />
          <ui-stat-tile
            label="Current streak"
            [value]="'' + monthStats().streak"
            [caption]="'day' + (monthStats().streak === 1 ? '' : 's') + ' in a row'"
            [icon]="Flame"
          />
        </div>

        <!-- Heatmap card -->
        <div ui-card>
          <!-- Toolbar -->
          <div class="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-2">
            <div class="flex items-center gap-2">
              <button ui-button variant="outline" size="icon" class="size-8" aria-label="Previous month" (click)="grid.prevMonth()">
                <lucide-icon [img]="ChevronLeft" class="size-4" />
              </button>
              <button ui-button variant="outline" size="icon" class="size-8" aria-label="Next month" (click)="grid.nextMonth()">
                <lucide-icon [img]="ChevronRight" class="size-4" />
              </button>
              <button ui-button variant="ghost" size="sm" class="h-7 text-xs" (click)="grid.goToToday()">Today</button>
              <h2 class="ml-2 text-sm font-semibold">{{ grid.monthLabel() }}</h2>
            </div>
            <div class="text-muted-foreground flex items-center gap-4 text-xs">
              @if (grid.isRange()) {
                <div
                  class="bg-primary/10 text-primary ring-primary/20 flex items-center gap-1.5 rounded-full px-2 py-0.5 ring-1 ring-inset"
                >
                  <lucide-icon [img]="MousePointer2" class="size-3.5" aria-hidden="true" />
                  <span class="tabular-nums"
                    >{{ grid.rangeDayCount() }} days · {{ rangeStats().total.toLocaleString() }} sessions · avg
                    {{ rangeStats().avg }}</span
                  >
                  <button type="button" class="hover:text-foreground ml-0.5" aria-label="Clear range" (click)="grid.clearRange()">
                    <lucide-icon [img]="X" class="size-3.5" />
                  </button>
                </div>
              }
              <div class="flex items-center gap-1.5">
                <lucide-icon [img]="Sparkles" class="size-3.5" aria-hidden="true" />
                <span class="tabular-nums">{{ monthStats().total.toLocaleString() }} this month</span>
              </div>
            </div>
          </div>

          <!-- Weekday header -->
          <div class="bg-muted/10 text-muted-foreground grid grid-cols-7 border-b text-xs font-medium tracking-wider uppercase">
            @for (w of grid.weekdays(); track w) {
              <div class="p-2">{{ w }}</div>
            }
          </div>

          <!-- Heatmap grid -->
          <div class="grid grid-cols-7 select-none">
            @for (d of monthCells(); track d.key; let i = $index) {
              <button
                type="button"
                [class]="cellClass(d.key, d.inMonth, i)"
                [title]="fmtKey(d.key) + ': ' + d.count + ' session' + (d.count === 1 ? '' : 's')"
                (mousedown)="grid.onCellMouseDown(d.key, $event)"
                (mouseenter)="grid.onCellMouseEnter(d.key)"
              >
                <!-- Intensity fill -->
                <div
                  [class]="'pointer-events-none absolute inset-1 rounded-md transition-all group-hover:inset-0.5 ' + intensityClass(d.count)"
                ></div>
                <!-- Date number -->
                <span [class]="dateClass(d.key)">{{ d.date.getDate() }}</span>
                <!-- Count badge, revealed on hover for active cells -->
                @if (d.count > 0 && d.inMonth) {
                  <!-- WHY (Rule95): focus-within joins hover so keyboard/touch
                       users get the count too -- hover alone hides it from them. -->
                  <span
                    class="text-foreground relative z-10 text-xs tabular-nums opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                    >{{ d.count }}</span
                  >
                }
              </button>
            }
          </div>

          <!-- Legend -->
          <div class="bg-muted/20 text-muted-foreground flex flex-wrap items-center gap-2 border-t px-4 py-2 text-xs">
            <lucide-icon [img]="CalendarIcon" class="size-3.5" aria-hidden="true" />
            <span>Less</span>
            @for (cls of intensityRamp; track cls) {
              <span [class]="'h-2.5 w-4 rounded-sm ' + cls"></span>
            }
            <span>More</span>
            <span class="ml-auto">Drag or shift-click to summarize a range.</span>
          </div>
        </div>

        <!-- Range detail (only when range > 1) -->
        @if (grid.isRange()) {
          <div ui-card class="p-4">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Selected range</p>
                <p class="mt-1 text-base font-semibold">
                  {{ fmtKey(grid.rangeBounds().lo) }} → {{ fmtKey(grid.rangeBounds().hi) }}
                </p>
              </div>
              <div class="grid grid-cols-3 gap-4 text-right">
                <div>
                  <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Days</p>
                  <!-- WHY (Rule27): KPI values sit on text-2xl so the range
                       summary matches the tile hierarchy. -->
                  <p class="text-2xl font-semibold tracking-tight tabular-nums">{{ grid.rangeDayCount() }}</p>
                </div>
                <div>
                  <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Active</p>
                  <p class="text-2xl font-semibold tracking-tight tabular-nums">{{ rangeStats().active }}</p>
                </div>
                <div>
                  <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Total</p>
                  <p class="text-2xl font-semibold tracking-tight tabular-nums">
                    {{ rangeStats().total.toLocaleString() }}
                  </p>
                </div>
              </div>
            </div>
            <!-- Mini per-day bars across range -->
            <div class="mt-4 flex h-12 items-end gap-0.5">
              @for (c of rangeStats().cells; track c.key) {
                <div
                  [class]="'flex-1 rounded-sm transition-colors ' + (c.count === 0 ? 'bg-muted/40' : 'bg-chart-2')"
                  [style.height]="c.count === 0 ? '8%' : Math.min(100, 12 + c.count * 4) + '%'"
                  [title]="fmtKey(c.key) + ': ' + c.count + ' sessions'"
                ></div>
              }
            </div>
          </div>
        }

        <!-- Live events (audit log) -->
        <div ui-card>
          <div ui-card-header class="border-b">
            <h2 ui-card-title class="text-base">{{ 'settings.activity.feed.title' | translate }}</h2>
          </div>
          @if (feedPending()) {
            <div class="text-muted-foreground px-4 py-3 text-sm">{{ 'settings.activity.states.loading' | translate }}</div>
          } @else if (feedError()) {
            <ui-empty-state [icon]="feedErrorIcon" role="alert" [title]="'settings.activity.states.error' | translate" class="py-4">
              <ng-template #feedErrorIcon><lucide-icon [img]="AlertCircle" /></ng-template>
              <button ui-button variant="outline" size="sm" class="mt-4" (click)="loadFeed()">
                {{ 'settings.activity.states.retry' | translate }}
              </button>
            </ui-empty-state>
          } @else if (hasLive()) {
            <ul class="divide-y">
              @for (item of feedItems(); track item.id) {
                <li class="flex items-center gap-2 px-4 py-2">
                  <lucide-icon [img]="feedIcon(item.action)" class="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium" [title]="describeItem(item)">{{ describeItem(item) }}</p>
                    <p class="text-muted-foreground truncate text-xs" [title]="actorLabel(item)">{{ actorLabel(item) }}</p>
                  </div>
                  <time [title]="formatFull(item.createdAt)" class="text-muted-foreground shrink-0 text-xs tabular-nums">
                    {{ timeAgo(item.createdAt) }}
                  </time>
                </li>
              }
            </ul>
          } @else {
            <p class="text-muted-foreground px-4 py-3 text-sm">{{ 'settings.activity.states.empty' | translate }}</p>
          }
        </div>
      </ui-page-body>
    </ui-page>
  `,
})
export class DashboardActivityComponent {
  protected readonly ActivityIcon = ActivityIcon
  protected readonly AlertCircle = AlertCircle
  protected readonly CalendarIcon = CalendarIcon
  protected readonly ChartColumn = ChartColumn
  protected readonly ChevronLeft = ChevronLeft
  protected readonly ChevronRight = ChevronRight
  protected readonly Flame = Flame
  protected readonly MousePointer2 = MousePointer2
  protected readonly Sparkles = Sparkles
  protected readonly TrendingUp = TrendingUp
  protected readonly X = X
  protected readonly Math = Math

  private readonly http = inject(HttpClient)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly i18n = inject(I18nService)
  readonly pageTitle = injectPageTitle()
  readonly intensityRamp = INTENSITY_RAMP
  readonly grid = createMonthGrid()

  // Live audit feed (envelope checked via res.ok). Empty (no DB / demo
  // session) keeps the mock heatmap as the fallback and shows the banner.
  readonly feedItems = signal<ActivityItem[]>([])
  readonly feedPending = signal(this.browser)
  readonly feedError = signal(false)
  readonly hasLive = computed(() => this.feedItems().length > 0)

  readonly monthCells = computed(() =>
    this.grid.gridDays().map((d) => ({ ...d, count: this.activityFor(d.key) })),
  )

  readonly monthStats = computed(() => {
    const inMonth = this.monthCells().filter((c) => c.inMonth)
    const total = inMonth.reduce((acc, c) => acc + c.count, 0)
    const nonZero = inMonth.filter((c) => c.count > 0)
    const peak = inMonth.reduce<{ key: string, count: number } | null>(
      (best, c) => (best === null || c.count > best.count ? { key: c.key, count: c.count } : best),
      null,
    )
    const avg = nonZero.length ? Math.round(total / nonZero.length) : 0

    let streak = 0
    const cursorDate = dateFromKey(this.grid.todayKey)
    for (let i = 0; i < 365; i++) {
      const d = new Date(cursorDate)
      d.setDate(cursorDate.getDate() - i)
      if (this.activityFor(isoDate(d)) > 0) streak++
      else break
    }
    return { total, avg, peak, streak }
  })

  readonly rangeStats = computed(() => {
    const { lo } = this.grid.rangeBounds()
    const cells: { key: string, count: number }[] = []
    const start = dateFromKey(lo)
    const days = this.grid.rangeDayCount()
    for (let i = 0; i < days; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i)
      const key = isoDate(d)
      cells.push({ key, count: this.activityFor(key) })
    }
    const total = cells.reduce((a, c) => a + c.count, 0)
    const active = cells.filter((c) => c.count > 0).length
    const avg = days > 0 ? Math.round(total / days) : 0
    return { total, avg, active, cells }
  })

  constructor() {
    this.loadFeed()
  }

  loadFeed(): void {
    if (!this.browser) return
    this.feedPending.set(true)
    this.feedError.set(false)
    this.http.get<ApiResponse<{ items: ActivityItem[], total: number }>>('/api/activity', { withCredentials: true }).subscribe({
      next: (res) => {
        this.feedPending.set(false)
        if (res.ok) this.feedItems.set(res.data.items)
        else this.feedError.set(true)
      },
      error: () => {
        this.feedPending.set(false)
        this.feedError.set(true)
      },
    })
  }

  feedIcon(action: string): LucideIconData {
    return feedActionIcon(action)
  }

  describeItem(item: ActivityItem): string {
    const suffix = item.entity ? ` · ${item.entity}${item.entityId ? ` #${item.entityId}` : ''}` : ''
    return `${item.action}${suffix}`
  }

  actorLabel(item: ActivityItem): string {
    this.i18n.lang()
    return item.actorEmail ?? this.i18n.t('settings.activity.feed.deletedUser')
  }

  formatFull(value: string): string {
    return new Date(value).toLocaleString(this.i18n.lang(), { dateStyle: 'medium', timeStyle: 'short' })
  }

  timeAgo(value: string): string {
    const diffMs = new Date(value).getTime() - Date.now()
    const rtf = new Intl.RelativeTimeFormat(this.i18n.lang(), { numeric: 'auto' })
    if (Math.abs(diffMs) / 1000 < 60) return rtf.format(Math.round(diffMs / 1000), 'second')
    const mins = Math.round(diffMs / 60000)
    if (Math.abs(mins) < 60) return rtf.format(mins, 'minute')
    const hours = Math.round(diffMs / 3600000)
    if (Math.abs(hours) < 24) return rtf.format(hours, 'hour')
    const days = Math.round(diffMs / 86400000)
    if (Math.abs(days) < 30) return rtf.format(days, 'day')
    const months = Math.round(diffMs / 2592000000)
    if (Math.abs(months) < 12) return rtf.format(months, 'month')
    return rtf.format(Math.round(diffMs / 31536000000), 'year')
  }

  activityFor(key: string): number {
    const d = dateFromKey(key)
    if (key > this.grid.todayKey) return 0
    const dow = d.getDay()
    const base = dow === 0 || dow === 6 ? 5 : 20
    const noise = (djb2(key) % 14) - 6
    return Math.max(0, base + noise)
  }

  intensityClass(n: number): string {
    if (n === 0) return INTENSITY_RAMP[0]
    if (n < 5) return INTENSITY_RAMP[1]
    if (n < 12) return INTENSITY_RAMP[2]
    if (n < 20) return INTENSITY_RAMP[3]
    return INTENSITY_RAMP[4]
  }

  cellClass(key: DateKey, inMonth: boolean, i: number): string {
    return [
      'group focus-visible:ring-ring relative isolate flex h-20 items-start justify-between border-r border-b p-1.5 text-left transition-all focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none',
      (i + 1) % 7 === 0 ? 'border-r-0' : '',
      i >= 35 ? 'border-b-0' : '',
      !inMonth ? 'opacity-40' : '',
      this.grid.inRange(key) ? 'ring-1 ring-inset ring-primary/60 z-10' : '',
    ].filter(Boolean).join(' ')
  }

  dateClass(key: DateKey): string {
    return (
      'relative z-10 inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums ' +
      (key === this.grid.todayKey ? 'bg-primary text-primary-foreground font-semibold' : 'text-foreground')
    )
  }

  fmtKey(key: string): string {
    return dateFromKey(key).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }
}
