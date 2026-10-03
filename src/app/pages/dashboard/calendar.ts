// Schedule, meetings, and deadlines. Ports nuxt-boilerplate's
// app/pages/dashboard/calendar.vue 1:1 (createMonthGrid + inline seed data).
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Title } from '@angular/platform-browser'
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  Circle,
  CircleAlert,
  CircleCheckBig,
  Clock,
  Copy,
  CopyPlus,
  Eye,
  ListFilter,
  LucideAngularModule,
  MapPin,
  MousePointer2,
  Pencil,
  Plane,
  Plus,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Users,
  Video,
  X,
  type LucideIconData,
} from 'lucide-angular'
import {
  createMonthGrid,
  dateFromKey,
} from '@/app/core/dashboard/month-grid'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import { UiAvatarComponent, UiAvatarFallbackComponent } from '@/app/components/ui/avatar/avatar.component'
import { UiEmptyStateComponent } from '@/app/components/ui/empty-state/empty-state.component'
import { UiInputComponent } from '@/app/components/ui/input/input.component'
import { UiOverlayScrollComponent } from '@/app/components/ui/overlay-scroll/overlay-scroll.component'
import { UiSeparatorComponent } from '@/app/components/ui/separator/separator.component'
import { UiSkeletonComponent } from '@/app/components/ui/skeleton/skeleton.component'
import { UiStatTileComponent } from '@/app/components/blocks/stat-tile/stat-tile.component'
import {
  UiDialogComponent,
  UiDialogContentComponent,
  UiDialogDescriptionComponent,
  UiDialogFooterComponent,
  UiDialogHeaderComponent,
  UiDialogTitleComponent,
} from '@/app/components/ui/dialog/dialog.component'
import {
  UiSelectComponent,
  UiSelectContentComponent,
  UiSelectItemComponent,
  UiSelectTriggerComponent,
  UiSelectValueComponent,
} from '@/app/components/ui/select/select.component'
import {
  UiContextMenuComponent,
  UiContextMenuContentComponent,
  UiContextMenuItemComponent,
  UiContextMenuLabelComponent,
  UiContextMenuSeparatorComponent,
  UiContextMenuShortcutComponent,
  UiContextMenuTriggerComponent,
} from '@/app/components/ui/context-menu/context-menu.component'

interface CalendarEvent {
  id: string
  title: string
  date: string
  start: string
  end: string
  type: 'meeting' | 'task' | 'reminder' | 'travel'
  description: string
  location?: string
  attendees?: string[]
  status: 'confirmed' | 'tentative' | 'cancelled'
}

type TypeKey = CalendarEvent['type']

const TYPE_META: Record<TypeKey, {
  label: string
  icon: LucideIconData
  chip: string
  bar: string
  dot: string
}> = {
  meeting: { label: 'Meeting', icon: Video, chip: 'bg-chart-1/15 text-foreground ring-chart-1/30', bar: 'bg-chart-1', dot: 'bg-chart-1' },
  task: { label: 'Task', icon: CircleCheckBig, chip: 'bg-chart-2/15 text-foreground ring-chart-2/30', bar: 'bg-chart-2', dot: 'bg-chart-2' },
  reminder: { label: 'Reminder', icon: CircleAlert, chip: 'bg-chart-3/15 text-foreground ring-chart-3/30', bar: 'bg-chart-3', dot: 'bg-chart-3' },
  travel: { label: 'Travel', icon: Plane, chip: 'bg-chart-4/15 text-foreground ring-chart-4/30', bar: 'bg-chart-4', dot: 'bg-chart-4' },
}

const TYPE_KEYS: TypeKey[] = ['meeting', 'task', 'reminder', 'travel']

const SEED_EVENTS: CalendarEvent[] = [
  { id: '1', title: 'Q2 Roadmap Review', date: '2026-05-16', start: '10:00', end: '11:30', type: 'meeting', description: 'Review Design Engineering backlog and prioritize Sprint 25.', location: 'Conference Room A', attendees: ['Sarah Connor', 'Marcus Rivera', 'Alice Chen'], status: 'confirmed' },
  { id: '2', title: 'Customer call — Northwind', date: '2026-05-16', start: '14:00', end: '14:45', type: 'meeting', description: 'Contract renewal discussion. Prepare usage report.', location: 'Zoom', attendees: ['Marcus Rivera'], status: 'confirmed' },
  { id: '3', title: 'Deploy window', date: '2026-05-16', start: '16:00', end: '17:00', type: 'task', description: 'Production deploy for dashboard v2.1. Zero-downtime expected.', status: 'confirmed' },
  { id: '4', title: 'Team standup', date: '2026-05-19', start: '09:30', end: '10:00', type: 'meeting', description: 'Daily sync. Blockers and wins.', location: 'Slack huddle', attendees: ['Design Engineering'], status: 'confirmed' },
  { id: '5', title: 'UX critique', date: '2026-05-20', start: '11:00', end: '12:00', type: 'meeting', description: 'Review new onboarding flow mockups.', location: 'Figma', attendees: ['Alice Chen', 'David Kim'], status: 'tentative' },
  { id: '6', title: 'Berlin trip — Marcus', date: '2026-05-20', start: '08:00', end: '20:00', type: 'travel', description: 'Customer onsite at Sentinel Labs.', location: 'Berlin', status: 'confirmed' },
  { id: '7', title: 'Performance review deadline', date: '2026-05-22', start: '17:00', end: '17:00', type: 'reminder', description: 'Submit peer feedback via Lattice.', status: 'confirmed' },
  { id: '8', title: 'Vue Conf 2026', date: '2026-05-28', start: '09:00', end: '18:00', type: 'travel', description: 'Alice attending. Prepare talk slides.', location: 'San Francisco', attendees: ['Alice Chen'], status: 'confirmed' },
]

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-calendar',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    UiAvatarComponent,
    UiAvatarFallbackComponent,
    UiButtonComponent,
    UiContextMenuComponent,
    UiContextMenuContentComponent,
    UiContextMenuItemComponent,
    UiContextMenuLabelComponent,
    UiContextMenuSeparatorComponent,
    UiContextMenuShortcutComponent,
    UiContextMenuTriggerComponent,
    UiDialogComponent,
    UiDialogContentComponent,
    UiDialogDescriptionComponent,
    UiDialogFooterComponent,
    UiDialogHeaderComponent,
    UiDialogTitleComponent,
    UiEmptyStateComponent,
    UiInputComponent,
    UiOverlayScrollComponent,
    UiSelectComponent,
    UiSelectContentComponent,
    UiSelectItemComponent,
    UiSelectTriggerComponent,
    UiSelectValueComponent,
    UiSeparatorComponent,
    UiSkeletonComponent,
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
          <h1 class="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p class="text-muted-foreground text-sm">
            Schedule, meetings, and deadlines. Drag or shift-click to select a range.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <div class="relative">
            <lucide-icon [img]="Search" class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <ui-input
              [ngModel]="search()"
              (ngModelChange)="search.set($event)"
              placeholder="Search events…"
              class="h-8 w-56 pl-8 text-xs"
            />
          </div>
          <ui-select [value]="view()" (valueChange)="view.set($any($event))">
            <ui-select-trigger class="h-8 w-24 text-xs">
              <ui-select-value />
            </ui-select-trigger>
            <ui-select-content>
              <ui-select-item value="month">Month</ui-select-item>
              <ui-select-item value="week">Week</ui-select-item>
              <ui-select-item value="day">Day</ui-select-item>
            </ui-select-content>
          </ui-select>
          <button ui-button size="sm" class="gap-1.5">
            <lucide-icon [img]="Plus" class="size-3.5" />
            New event
          </button>
        </div>
      </header>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        @for (type of typeKeys; track type) {
          <button
            type="button"
            class="focus-visible:ring-ring flex flex-col rounded-xl text-left focus-visible:ring-2 focus-visible:outline-none"
            [attr.aria-pressed]="search().toLowerCase() === typeMeta[type].label.toLowerCase()"
            (click)="toggleTypeSearch(type)"
          >
            <ui-stat-tile
              class="flex-1"
              [label]="typeMeta[type].label"
              [value]="'' + monthCounts()[type]"
              caption="this month"
              [dotClass]="typeMeta[type].dot"
              [hasFooter]="true"
            >
              @if (typeStats()[type].next) {
                <p slot="footer" class="truncate" [title]="typeStats()[type].next!.title">
                  Next: {{ fmtNextDate(typeStats()[type].next!.date) }} ·
                  <span class="text-foreground font-medium">{{ typeStats()[type].next!.title }}</span>
                </p>
              } @else {
                <p slot="footer">Nothing upcoming</p>
              }
            </ui-stat-tile>
          </button>
        }
      </div>

      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div class="rounded-xl border bg-card overflow-hidden">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-2.5">
            <div class="flex items-center gap-2">
              <button ui-button variant="outline" size="icon" class="size-7" (click)="grid.prevMonth()">
                <lucide-icon [img]="ChevronLeft" class="size-4" />
              </button>
              <button ui-button variant="outline" size="icon" class="size-7" (click)="grid.nextMonth()">
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
                  <span>{{ grid.rangeDayCount() }} days · {{ rangeEvents().length }} events</span>
                  <button class="ml-0.5 hover:text-foreground" (click)="grid.clearRange()">
                    <lucide-icon [img]="X" class="size-3" />
                  </button>
                </div>
              }
              <div class="flex items-center gap-1.5">
                <lucide-icon [img]="Sparkles" class="size-3" />
                <span>{{ monthCounts().total }} event{{ monthCounts().total === 1 ? '' : 's' }} this month</span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-7 border-b bg-muted/10 text-xs uppercase tracking-wider text-muted-foreground">
            @for (w of grid.weekdays(); track w) {
              <div class="px-2 py-2 font-medium">{{ w }}</div>
            }
          </div>

          <div class="grid grid-cols-7 select-none">
            @if (loading()) {
              @for (i of skeletonCells; track i) {
                <div class="h-24 border-b border-r p-1.5 last:border-r-0">
                  <ui-skeleton class="h-3 w-6" />
                  <ui-skeleton class="mt-2 h-3 w-full" />
                </div>
              }
            } @else {
              @for (d of grid.gridDays(); track d.key; let i = $index) {
                <ui-context-menu>
                  <span ui-context-menu-trigger class="contents">
                    <!-- WHY (Rule94): the cell is a plain div (role=group, never
                         a button) so the event chip inside can be a REAL button.
                         No nested interactives; the chip is keyboard reachable
                         by Tab and the cell anchors via Enter/Space. -->
                    <div
                      [class]="cellClass(d.key, d.inMonth, i)"
                      tabindex="0"
                      role="group"
                      [attr.aria-label]="fmtDayLong(d.key) + ': ' + (eventsByDate().get(d.key)?.length ?? 0) + ' events'"
                      (mousedown)="grid.onCellMouseDown(d.key, $event)"
                      (mouseenter)="grid.onCellMouseEnter(d.key)"
                      (keydown.enter)="selectSingleDay(d.key)"
                      (keydown.space)="$event.preventDefault(); selectSingleDay(d.key)"
                    >
                      <div class="flex items-center justify-between">
                        <span [class]="dateClass(d.key, d.inMonth)">{{ d.date.getDate() }}</span>
                        @if ((eventsByDate().get(d.key)?.length ?? 0) > 0) {
                          <span class="text-xs tabular-nums text-muted-foreground">
                            {{ eventsByDate().get(d.key)!.length }}
                          </span>
                        }
                      </div>
                      <div class="flex flex-col gap-0.5">
                        @for (e of (eventsByDate().get(d.key) ?? []).slice(0, 1); track e.id) {
                          <button
                            type="button"
                            [class]="
                              'focus-visible:ring-ring flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-xs ring-1 ring-inset cursor-pointer focus-visible:outline-none focus-visible:ring-2 ' +
                              typeMeta[e.type].chip
                            "
                            [title]="timeRange(e) + ' · ' + e.title"
                            [attr.aria-label]="e.title + ', ' + timeRange(e)"
                            (mousedown)="$event.stopPropagation()"
                            (click)="openEvent(e); $event.stopPropagation()"
                            (contextmenu)="$event.stopPropagation()"
                          >
                            <span class="tabular-nums opacity-70">{{ e.start }}</span>
                            <span class="truncate">{{ e.title }}</span>
                          </button>
                        }
                        @if ((eventsByDate().get(d.key)?.length ?? 0) > 1) {
                          <span class="px-1 text-xs text-muted-foreground">
                            +{{ eventsByDate().get(d.key)!.length - 1 }} more
                          </span>
                        }
                      </div>
                    </div>
                  </span>
                  <ui-context-menu-content class="w-56">
                    <ui-context-menu-label class="text-xs text-muted-foreground">
                      {{ fmtDayLong(d.key) }}
                    </ui-context-menu-label>
                    <ui-context-menu-separator />
                    <ui-context-menu-item class="gap-2">
                      <lucide-icon [img]="CalendarPlus" class="size-3.5" /> New event
                      <ui-context-menu-shortcut>N</ui-context-menu-shortcut>
                    </ui-context-menu-item>
                    <ui-context-menu-item class="gap-2" (select)="grid.selectWeekOf(d.key)">
                      <lucide-icon [img]="CalendarDays" class="size-3.5" /> Select this week
                    </ui-context-menu-item>
                    <ui-context-menu-item
                      class="gap-2"
                      [disabled]="(eventsByDate().get(d.key)?.length ?? 0) === 0"
                      (select)="selectSingleDay(d.key)"
                    >
                      <lucide-icon [img]="Eye" class="size-3.5" /> View day · {{ eventsByDate().get(d.key)?.length ?? 0 }}
                      event{{ (eventsByDate().get(d.key)?.length ?? 0) === 1 ? '' : 's' }}
                    </ui-context-menu-item>
                    <ui-context-menu-separator />
                    <ui-context-menu-item class="gap-2" (select)="copyDate(d.key)">
                      <lucide-icon [img]="Copy" class="size-3.5" /> Copy date
                      <ui-context-menu-shortcut class="tabular-nums">{{ d.key }}</ui-context-menu-shortcut>
                    </ui-context-menu-item>
                    <ui-context-menu-item class="gap-2" (select)="grid.goToToday()">
                      <lucide-icon [img]="ArrowRight" class="size-3.5" /> Go to today
                    </ui-context-menu-item>
                    @if (grid.isRange()) {
                      <ui-context-menu-item
                        class="gap-2 text-destructive focus:text-destructive"
                        (select)="grid.clearRange()"
                      >
                        <lucide-icon [img]="X" class="size-3.5" /> Clear range
                      </ui-context-menu-item>
                    }
                  </ui-context-menu-content>
                </ui-context-menu>
              }
            }
          </div>

          <div class="flex flex-wrap items-center gap-3 border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
            <lucide-icon [img]="ListFilter" class="size-3" />
            @for (key of typeKeys; track key) {
              <div class="flex items-center gap-1.5">
                <span [class]="'size-2 rounded-full ' + typeMeta[key].dot"></span>
                {{ typeMeta[key].label }}
              </div>
            }
            <span class="ml-auto">Tip: drag or shift-click to range. Right-click for actions.</span>
          </div>
        </div>

        <aside class="flex flex-col gap-4">
          @if (!grid.isRange()) {
            <div class="rounded-xl border bg-card overflow-hidden">
              <div class="border-b bg-muted/30 px-4 py-3">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {{ grid.rangeStart() === grid.todayKey ? 'Today' : 'Selected' }}
                    </p>
                    <p class="mt-0.5 text-sm font-semibold">{{ fmtDayLong(grid.rangeStart()) }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Events</p>
                    <p class="text-sm font-semibold tabular-nums">{{ selectedDayEvents().length }}</p>
                  </div>
                </div>
              </div>
              <ui-overlay-scroll class="max-h-[420px] p-3">
                @if (loading()) {
                  @for (i of [1, 2, 3]; track i) {
                    <div class="mb-2 space-y-2 rounded-lg p-2.5">
                      <ui-skeleton class="h-3 w-32" />
                      <ui-skeleton class="h-2 w-20" />
                    </div>
                  }
                } @else if (selectedDayEvents().length === 0) {
                  <ui-empty-state [icon]="dayEmptyIcon" title="Nothing scheduled" description="Click a date or add a new event.">
                    <ng-template #dayEmptyIcon><lucide-icon [img]="CalendarDays" /></ng-template>
                    <button ui-button size="sm" variant="outline" class="mt-4 gap-1.5 h-7 text-xs">
                      <lucide-icon [img]="Plus" class="size-3" /> New event
                    </button>
                  </ui-empty-state>
                } @else {
                  @for (e of selectedDayEvents(); track e.id) {
                    <div
                      class="group relative flex cursor-pointer gap-3 rounded-lg p-2.5 transition-colors hover:bg-accent/50"
                      (click)="openEvent(e)"
                    >
                      <div [class]="'w-0.5 shrink-0 rounded-full ' + typeMeta[e.type].bar"></div>
                      <div class="min-w-0 flex-1 space-y-1">
                        <div class="flex items-start justify-between gap-2">
                          <p class="text-sm font-medium leading-tight">{{ e.title }}</p>
                          <span
                            [class]="
                              'shrink-0 rounded px-1.5 py-0.5 text-xs uppercase tracking-wider ring-1 ring-inset ' +
                              typeMeta[e.type].chip
                            "
                          >
                            {{ typeMeta[e.type].label }}
                          </span>
                        </div>
                        <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                          <span class="inline-flex items-center gap-1">
                            <lucide-icon [img]="Clock" class="size-3" />{{ e.start }}–{{ e.end }}
                          </span>
                          @if (e.location) {
                            <span class="inline-flex items-center gap-1">
                              <lucide-icon [img]="MapPin" class="size-3" />{{ e.location }}
                            </span>
                          }
                        </div>
                        @if (e.attendees?.length) {
                          <div class="flex items-center -space-x-1.5 pt-0.5">
                            @for (a of e.attendees!.slice(0, 4); track a) {
                              <ui-avatar size="sm" class="border-2 border-background">
                                <ui-avatar-fallback size="sm" class="bg-primary/10 text-primary">
                                  {{ initials(a) }}
                                </ui-avatar-fallback>
                              </ui-avatar>
                            }
                            @if (e.attendees!.length > 4) {
                              <span class="pl-2 text-xs text-muted-foreground">+{{ e.attendees!.length - 4 }}</span>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  }
                }
              </ui-overlay-scroll>
            </div>
          } @else {
            <div class="rounded-xl border bg-card overflow-hidden">
              <div class="border-b bg-muted/30 px-4 py-3">
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Range · {{ grid.rangeDayCount() }} days
                    </p>
                    <p class="mt-0.5 truncate text-sm font-semibold">
                      {{ fmtDayShort(grid.rangeBounds().lo) }} → {{ fmtDayShort(grid.rangeBounds().hi) }}
                    </p>
                  </div>
                  <button ui-button variant="ghost" size="icon" class="size-7" (click)="grid.clearRange()">
                    <lucide-icon [img]="X" class="size-3.5" />
                  </button>
                </div>
                <div class="mt-3 grid grid-cols-4 gap-2">
                  @for (t of typeKeys; track t) {
                    <div>
                      <div class="flex items-center gap-1 text-xs text-muted-foreground">
                        <span [class]="'size-1.5 rounded-full ' + typeMeta[t].dot"></span>
                        {{ typeMeta[t].label }}
                      </div>
                      <p class="mt-0.5 text-sm font-semibold tabular-nums">{{ rangeTypeCounts()[t] }}</p>
                    </div>
                  }
                </div>
              </div>
              <ui-overlay-scroll class="max-h-[420px]">
                @if (rangeEvents().length === 0) {
                  <ui-empty-state title="No events in range" class="px-4" />
                } @else {
                  @for (e of rangeEvents(); track e.id) {
                    <div
                      class="flex cursor-pointer items-start gap-3 border-b px-3 py-2.5 transition-colors last:border-b-0 hover:bg-accent/40"
                      (click)="openEvent(e)"
                    >
                      <div
                        class="flex w-10 shrink-0 flex-col items-center rounded-md border bg-background/60 px-1 py-1 text-center"
                      >
                        <span class="text-xs uppercase text-muted-foreground">
                          {{ monthShort(e.date) }}
                        </span>
                        <span class="text-sm font-semibold leading-none tabular-nums">{{ dayNum(e.date) }}</span>
                      </div>
                      <div [class]="'w-0.5 self-stretch shrink-0 rounded-full ' + typeMeta[e.type].bar"></div>
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-xs font-medium">{{ e.title }}</p>
                        <p class="text-xs text-muted-foreground tabular-nums mt-0.5">
                          {{ e.start }}–{{ e.end }}@if (e.location) {
                            <span> · {{ e.location }}</span>
                          }
                        </p>
                      </div>
                      <span
                        [class]="
                          'shrink-0 rounded px-1.5 py-0.5 text-xs uppercase tracking-wider ring-1 ring-inset ' +
                          typeMeta[e.type].chip
                        "
                      >
                        {{ typeMeta[e.type].label }}
                      </span>
                    </div>
                  }
                }
              </ui-overlay-scroll>
            </div>
          }

          <div class="rounded-xl border bg-card overflow-hidden">
            <div class="border-b bg-muted/30 px-4 py-2.5">
              <p class="text-sm font-semibold">Up next</p>
              <p class="text-xs text-muted-foreground">After today</p>
            </div>
            <div class="divide-y">
              @if (loading()) {
                @for (i of [1, 2, 3]; track i) {
                  <div class="flex items-center gap-3 p-3">
                    <ui-skeleton class="size-9 rounded-md" />
                    <div class="flex-1 space-y-1">
                      <ui-skeleton class="h-3 w-32" />
                      <ui-skeleton class="h-2 w-20" />
                    </div>
                  </div>
                }
              } @else if (upcoming().length === 0) {
                <ui-empty-state title="Nothing on the horizon" class="px-4" />
              } @else {
                @for (e of upcoming(); track e.id) {
                  <button
                    type="button"
                    class="group flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-accent/40"
                    (click)="openEvent(e)"
                  >
                    <div
                      class="flex size-10 shrink-0 flex-col items-center justify-center rounded-md border bg-background text-center"
                    >
                      <span class="text-xs uppercase text-muted-foreground">{{ monthShort(e.date) }}</span>
                      <span class="text-sm font-semibold leading-none tabular-nums">{{ dayNum(e.date) }}</span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-1.5">
                        <span [class]="'size-1.5 rounded-full ' + typeMeta[e.type].dot"></span>
                        <p class="truncate text-xs font-medium">{{ e.title }}</p>
                      </div>
                      <p class="text-xs text-muted-foreground tabular-nums mt-0.5">
                        {{ e.start }}–{{ e.end }}@if (e.location) {
                          <span> · {{ e.location }}</span>
                        }
                      </p>
                    </div>
                  </button>
                }
              }
            </div>
          </div>
        </aside>
      </div>

      <ui-dialog [open]="eventOpen()" (openChange)="eventOpen.set($event)">
        @if (selectedEvent()) {
          <ui-dialog-content class="sm:max-w-md">
            <ui-dialog-header>
              <div class="flex items-center gap-2">
                <div
                  [class]="
                    'flex size-8 items-center justify-center rounded-md ring-1 ring-inset ' +
                    typeMeta[selectedEvent()!.type].chip
                  "
                >
                  <lucide-icon [img]="typeMeta[selectedEvent()!.type].icon" class="size-4" />
                </div>
                <div>
                  <ui-dialog-title class="text-base">{{ selectedEvent()!.title }}</ui-dialog-title>
                  <ui-dialog-description class="text-xs">
                    {{ typeMeta[selectedEvent()!.type].label }} · {{ selectedEvent()!.status }}
                  </ui-dialog-description>
                </div>
              </div>
            </ui-dialog-header>
            <div class="space-y-3 py-2">
              <p class="text-sm text-muted-foreground">{{ selectedEvent()!.description }}</p>
              <ui-separator />
              <div class="grid gap-2 text-sm">
                <div class="flex items-center gap-2">
                  <lucide-icon [img]="Clock" class="size-4 text-muted-foreground" />
                  <span>{{ selectedEvent()!.date }} · {{ selectedEvent()!.start }} – {{ selectedEvent()!.end }}</span>
                </div>
                @if (selectedEvent()!.location) {
                  <div class="flex items-center gap-2">
                    <lucide-icon [img]="MapPin" class="size-4 text-muted-foreground" />
                    <span>{{ selectedEvent()!.location }}</span>
                  </div>
                }
                @if (selectedEvent()!.attendees?.length) {
                  <div class="flex items-start gap-2">
                    <lucide-icon [img]="Users" class="size-4 text-muted-foreground mt-0.5" />
                    <div class="flex flex-wrap items-center gap-1.5">
                      @for (a of selectedEvent()!.attendees!; track a) {
                        <div class="flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs">
                          <ui-avatar size="sm">
                            <ui-avatar-fallback size="sm" class="bg-primary/10 text-primary">
                              {{ initials(a) }}
                            </ui-avatar-fallback>
                          </ui-avatar>
                          <span>{{ a }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
            <ui-dialog-footer>
              <button ui-button variant="outline" size="sm">Edit</button>
              <button ui-button size="sm" variant="destructive">Cancel event</button>
            </ui-dialog-footer>
          </ui-dialog-content>
        }
      </ui-dialog>
    </div>
  `,
})
export class DashboardCalendarComponent {
  protected readonly ArrowRight = ArrowRight
  protected readonly CalendarDays = CalendarDays
  protected readonly CalendarPlus = CalendarPlus
  protected readonly ChevronLeft = ChevronLeft
  protected readonly ChevronRight = ChevronRight
  protected readonly Clock = Clock
  protected readonly Copy = Copy
  protected readonly Eye = Eye
  protected readonly ListFilter = ListFilter
  protected readonly MapPin = MapPin
  protected readonly MousePointer2 = MousePointer2
  protected readonly Pencil = Pencil
  protected readonly Plus = Plus
  protected readonly CopyPlus = CopyPlus
  protected readonly Search = Search
  protected readonly Sparkles = Sparkles
  protected readonly Trash2 = Trash2
  protected readonly Users = Users
  protected readonly X = X
  protected readonly Circle = Circle

  readonly typeMeta = TYPE_META
  readonly typeKeys = TYPE_KEYS
  readonly skeletonCells = Array.from({ length: 35 }, (_, i) => i)

  readonly view = signal<'month' | 'week' | 'day'>('month')
  readonly eventOpen = signal(false)
  readonly selectedEvent = signal<CalendarEvent | null>(null)
  readonly search = signal('')
  readonly events = signal<CalendarEvent[]>(SEED_EVENTS)
  readonly loading = signal(false)

  readonly grid = createMonthGrid({ initialDate: '2026-05-16' })

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase()
    if (!q) return this.events()
    return this.events().filter(
      (e) =>
        e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q),
    )
  })

  readonly eventsByDate = computed(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const e of this.filtered()) {
      if (!map.has(e.date)) map.set(e.date, [])
      map.get(e.date)!.push(e)
    }
    for (const arr of map.values()) arr.sort((a, b) => a.start.localeCompare(b.start))
    return map
  })

  readonly monthCounts = computed(() => {
    const cur = this.grid.cursor()
    const y = cur.getFullYear()
    const m = cur.getMonth()
    const init = { meeting: 0, task: 0, travel: 0, reminder: 0, total: 0 }
    for (const e of this.events()) {
      const d = new Date(e.date)
      if (d.getFullYear() === y && d.getMonth() === m) {
        init[e.type]++
        init.total++
      }
    }
    return init
  })

  readonly typeStats = computed(() => {
    const out: Record<TypeKey, { next: CalendarEvent | null }> = {
      meeting: { next: null },
      task: { next: null },
      reminder: { next: null },
      travel: { next: null },
    }
    for (const t of Object.keys(out) as TypeKey[]) {
      const sorted = this.events()
        .filter((e) => e.type === t && e.date >= this.grid.todayKey)
        .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
      out[t].next = sorted[0] ?? null
    }
    return out
  })

  readonly rangeEvents = computed(() => {
    const { lo, hi } = this.grid.rangeBounds()
    return this.filtered()
      .filter((e) => e.date >= lo && e.date <= hi)
      .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
  })

  readonly rangeTypeCounts = computed(() => {
    const init = { meeting: 0, task: 0, travel: 0, reminder: 0 }
    for (const e of this.rangeEvents()) init[e.type]++
    return init
  })

  readonly selectedDayEvents = computed(() => this.eventsByDate().get(this.grid.rangeStart()) ?? [])

  readonly upcoming = computed(() =>
    this.filtered()
      .filter((e) => e.date > this.grid.todayKey)
      .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
      .slice(0, 4),
  )

  constructor(title: Title) {
    title.setTitle('Calendar')
  }

  // NOTE: `search` is signal-backed and bound via the ngModel split form so the
  // `filtered` computed re-evaluates on each keystroke under OnPush.

  toggleTypeSearch(type: TypeKey): void {
    const label = this.typeMeta[type].label.toLowerCase()
    this.search.set(label === this.search().toLowerCase() ? '' : label)
  }

  openEvent(e: CalendarEvent): void {
    this.selectedEvent.set(e)
    this.eventOpen.set(true)
  }

  // WHY (Rule94): keyboard anchor for a day cell. The cell itself is a plain
  // <div> (no nested button) and each event chip is a real <button> -- Enter
  // on the focused cell anchors the single-day selection.
  // (selectSingleDay below is that anchor; it delegates to grid.selectDay.)

  timeRange(e: CalendarEvent): string {
    return `${e.start} – ${e.end}`
  }

  copyDate(key: string): void {
    try {
      void navigator?.clipboard?.writeText(key).catch(() => undefined)
    } catch {
      /* clipboard unavailable */
    }
  }

  selectSingleDay(key: string): void {
    this.grid.selectDay(key)
  }

  fmtNextDate(key: string): string {
    if (key === this.grid.todayKey) return 'Today'
    return dateFromKey(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  fmtDayLong(key: string): string {
    return dateFromKey(key).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  fmtDayShort(key: string): string {
    return dateFromKey(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  monthShort(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' })
  }

  dayNum(dateStr: string): number {
    return new Date(dateStr).getDate()
  }

  initials(name: string): string {
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2)
  }

  cellClass(key: string, inMonth: boolean, i: number): string {
    return [
      'group relative flex h-24 w-full cursor-default flex-col gap-1 border-b border-r p-1.5 text-left transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      (i + 1) % 7 === 0 ? 'border-r-0' : '',
      i >= 35 ? 'border-b-0' : '',
      this.cellRangeClass(key, inMonth),
      !inMonth && !this.grid.inRange(key) ? 'text-muted-foreground' : '',
    ].filter(Boolean).join(' ')
  }

  dateClass(key: string, inMonth: boolean): string {
    return [
      'inline-flex size-5 items-center justify-center rounded-full text-xs tabular-nums',
      key === this.grid.todayKey ? 'bg-primary text-primary-foreground font-semibold' : '',
      key !== this.grid.todayKey && inMonth ? 'text-foreground' : '',
      !inMonth ? 'text-muted-foreground' : '',
    ].filter(Boolean).join(' ')
  }

  cellRangeClass(key: string, inMonth: boolean): string {
    const { lo, hi } = this.grid.rangeBounds()
    if (!this.grid.inRange(key)) return inMonth ? 'bg-background hover:bg-accent/40' : 'bg-muted/20 hover:bg-muted/30'
    if (key === lo && key === hi) return 'bg-accent/30 ring-1 ring-inset ring-primary/60'
    let cls = 'bg-primary/10 hover:bg-primary/15'
    if (key === lo) cls += ' ring-1 ring-inset ring-primary/60'
    if (key === hi) cls += ' ring-1 ring-inset ring-primary/60'
    return cls
  }
}
