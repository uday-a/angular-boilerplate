// Daily session heatmap. Ports nuxt-boilerplate's
// app/pages/dashboard/activity.vue 1:1 (createMonthGrid + deterministic mock).
import { ChangeDetectionStrategy, Component, computed } from '@angular/core'
import { Title } from '@angular/platform-browser'
import {
  Activity as ActivityIcon,
  Calendar as CalendarIcon,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  Flame,
  LucideAngularModule,
  MousePointer2,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-angular'
import {
  createMonthGrid,
  dateFromKey,
  isoDate,
  type DateKey,
} from '@/app/core/dashboard/month-grid'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import { UiStatTileComponent } from '@/app/components/blocks/stat-tile/stat-tile.component'

function djb2(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i)
  return Math.abs(h)
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-activity',
  standalone: true,
  imports: [
    LucideAngularModule,
    UiButtonComponent,
    UiStatTileComponent,
  ],
  host: {
    '(window:mouseup)': 'grid.endDrag()',
    '(window:mouseleave)': 'grid.endDrag()',
  },
  template: `
    <div class="flex flex-col gap-4" (mouseup)="grid.endDrag()">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div class="space-y-1">
          <h1 class="text-2xl font-semibold tracking-tight">Activity</h1>
          <p class="text-muted-foreground text-sm">Daily session heatmap. Drag or shift-click to summarize a range.</p>
        </div>
      </header>

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

      <div class="rounded-xl border bg-card overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-2.5">
          <div class="flex items-center gap-2">
            <button ui-button variant="outline" size="icon" class="size-8" aria-label="Previous month" (click)="grid.prevMonth()">
              <lucide-icon [img]="ChevronLeft" class="size-4" />
            </button>
            <button ui-button variant="outline" size="icon" class="size-8" aria-label="Next month" (click)="grid.nextMonth()">
              <lucide-icon [img]="ChevronRight" class="size-4" />
            </button>
            <button ui-button variant="ghost" size="sm" class="h-7 text-xs" (click)="grid.goToToday()">Today</button>
            <h2 class="text-sm font-semibold ml-2">{{ grid.monthLabel() }}</h2>
          </div>
          <div class="flex items-center gap-3 text-xs text-muted-foreground">
            @if (grid.isRange()) {
              <div
                class="flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-foreground ring-1 ring-inset ring-primary/20"
              >
                <lucide-icon [img]="MousePointer2" class="size-3" />
                <span>
                  {{ grid.rangeDayCount() }} days · {{ rangeStats().total.toLocaleString() }} sessions · avg
                  {{ rangeStats().avg }}
                </span>
                <button class="ml-0.5 hover:text-foreground" (click)="grid.clearRange()">
                  <lucide-icon [img]="X" class="size-3" />
                </button>
              </div>
            }
            <div class="flex items-center gap-1.5">
              <lucide-icon [img]="Sparkles" class="size-3" />
              <span>{{ monthStats().total.toLocaleString() }} this month</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-7 border-b bg-muted/10 text-xs uppercase tracking-wider text-muted-foreground">
          @for (w of grid.weekdays(); track w) {
            <div class="px-2 py-2 font-medium">{{ w }}</div>
          }
        </div>

        <div class="grid grid-cols-7 select-none">
          @for (d of monthCells(); track d.key; let i = $index) {
            <button
              type="button"
              [class]="cellClass(d.key, d.inMonth, i)"
              [title]="fmtKey(d.key) + ' — ' + d.count + ' session' + (d.count === 1 ? '' : 's')"
              (mousedown)="grid.onCellMouseDown(d.key, $event)"
              (mouseenter)="grid.onCellMouseEnter(d.key)"
            >
              <div
                [class]="
                  'pointer-events-none absolute inset-1 rounded-md transition-all group-hover:brightness-125 group-hover:inset-0.5 ' +
                  intensityClass(d.count)
                "
              ></div>
              <span [class]="dateClass(d.key, d.inMonth)">{{ d.date.getDate() }}</span>
              @if (d.count > 0 && d.inMonth) {
                <!-- WHY (Rule95): focus-within joins hover so keyboard/touch
                     users get the count too -- hover alone hides it from them. -->
                <span
                  class="relative z-10 text-xs tabular-nums text-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                >
                  {{ d.count }}
                </span>
              }
            </button>
          }
        </div>

        <div class="flex flex-wrap items-center gap-3 border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
          <lucide-icon [img]="CalendarIcon" class="size-3" />
          <span>Less</span>
          <span class="h-2.5 w-4 rounded-sm bg-muted/40"></span>
          <span class="h-2.5 w-4 rounded-sm bg-chart-1/15"></span>
          <span class="h-2.5 w-4 rounded-sm bg-chart-1/35"></span>
          <span class="h-2.5 w-4 rounded-sm bg-chart-1/60"></span>
          <span class="h-2.5 w-4 rounded-sm bg-chart-1/85"></span>
          <span>More</span>
          <span class="ml-auto">Tip: drag or shift-click to summarize a range.</span>
        </div>
      </div>

      @if (grid.isRange()) {
        <div class="rounded-xl border bg-card p-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Selected range</p>
              <p class="mt-1 text-base font-semibold">
                {{ fmtKey(grid.rangeBounds().lo) }} → {{ fmtKey(grid.rangeBounds().hi) }}
              </p>
            </div>
            <div class="grid grid-cols-3 gap-3 text-right">
              <div>
                <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Days</p>
                <!-- WHY (Rule27): KPI values sit on text-2xl so the range
                     summary matches the tile hierarchy. -->
                <p class="text-2xl font-semibold tracking-tight tabular-nums">{{ grid.rangeDayCount() }}</p>
              </div>
              <div>
                <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active</p>
                <p class="text-2xl font-semibold tracking-tight tabular-nums">{{ rangeStats().active }}</p>
              </div>
              <div>
                <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total</p>
                <p class="text-2xl font-semibold tracking-tight tabular-nums">
                  {{ rangeStats().total.toLocaleString() }}
                </p>
              </div>
            </div>
          </div>
          <div class="mt-4 flex items-end gap-0.5 h-12">
            @for (c of rangeStats().cells; track c.key) {
              <div
                [class]="'flex-1 rounded-sm transition-colors ' + (c.count === 0 ? 'bg-muted/30' : 'bg-chart-1/70')"
                [style.height]="c.count === 0 ? '8%' : Math.min(100, 12 + c.count * 4) + '%'"
                [title]="fmtKey(c.key) + ' — ' + c.count + ' sessions'"
              ></div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class DashboardActivityComponent {
  protected readonly ActivityIcon = ActivityIcon
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

  readonly grid = createMonthGrid()

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

  constructor(title: Title) {
    title.setTitle('Activity')
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
    if (n === 0) return 'bg-muted/40'
    if (n < 5) return 'bg-chart-1/15'
    if (n < 12) return 'bg-chart-1/35'
    if (n < 20) return 'bg-chart-1/60'
    return 'bg-chart-1/85'
  }

  cellClass(key: DateKey, inMonth: boolean, i: number): string {
    return [
      'group relative isolate flex h-20 items-start justify-between border-b border-r p-1.5 text-left transition-all focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      (i + 1) % 7 === 0 ? 'border-r-0' : '',
      i >= 35 ? 'border-b-0' : '',
      !inMonth ? 'opacity-40' : '',
      this.grid.inRange(key) ? 'ring-1 ring-inset ring-primary/60 z-10' : '',
    ].filter(Boolean).join(' ')
  }

  dateClass(key: DateKey, inMonth: boolean): string {
    return [
      'relative inline-flex size-5 items-center justify-center rounded-full text-xs tabular-nums z-10',
      key === this.grid.todayKey ? 'bg-foreground text-background font-semibold ring-2 ring-primary' : '',
      key !== this.grid.todayKey && inMonth ? 'text-foreground' : '',
      !inMonth ? 'text-muted-foreground' : '',
    ].filter(Boolean).join(' ')
  }

  fmtKey(key: string): string {
    return dateFromKey(key).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }
}
