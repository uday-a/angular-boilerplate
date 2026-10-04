// Schedule, meetings and deadlines. Ports nuxt-boilerplate's
// app/pages/dashboard/calendar.vue (createMonthGrid + inline seed data
// anchored to today, so the sample schedule always sits around the current
// date). Window mouseup ends a drag-select (host listener, SSR-safe).
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core'
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
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
  Trash2,
  Users,
  Video,
  X,
  type LucideIconData,
} from 'lucide-angular'
import { injectPageTitle } from '@/app/core/i18n'
import { createMonthGrid, dateFromKey, isoDate } from '@/app/core/dashboard/month-grid'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import { UiAvatarComponent, UiAvatarFallbackComponent } from '@/app/components/ui/avatar/avatar.component'
import {
  UiCardComponent,
  UiCardDescriptionComponent,
  UiCardHeaderComponent,
} from '@/app/components/ui/card/card.component'
import { UiInputComponent } from '@/app/components/ui/input/input.component'
import { UiOverlayScrollComponent } from '@/app/components/ui/overlay-scroll/overlay-scroll.component'
import {
  UiPageBodyComponent,
  UiPageComponent,
  UiPageHeaderComponent,
  UiPageHeaderHeadingComponent,
} from '@/app/components/ui/page/page.component'
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

// Event types map to the categorical chart ramp (chart-1..4) everywhere on
// the page: stat dot, cell chip, side-rail bar and type pill.
const TYPE_META: Record<TypeKey, { label: string, icon: LucideIconData, dot: string, pill: string, chip: string, iconBox: string }> = {
  meeting: { label: 'Meeting', icon: Video, dot: 'bg-chart-1', pill: 'bg-chart-1/15 text-foreground', chip: 'bg-chart-1/15 text-foreground border-chart-1', iconBox: 'bg-chart-1/15 text-chart-1' },
  task: { label: 'Task', icon: CircleCheck, dot: 'bg-chart-2', pill: 'bg-chart-2/15 text-foreground', chip: 'bg-chart-2/15 text-foreground border-chart-2', iconBox: 'bg-chart-2/15 text-chart-2' },
  reminder: { label: 'Reminder', icon: CircleAlert, dot: 'bg-chart-3', pill: 'bg-chart-3/15 text-foreground', chip: 'bg-chart-3/15 text-foreground border-chart-3', iconBox: 'bg-chart-3/15 text-chart-3' },
  travel: { label: 'Travel', icon: Plane, dot: 'bg-chart-4', pill: 'bg-chart-4/15 text-foreground', chip: 'bg-chart-4/15 text-foreground border-chart-4', iconBox: 'bg-chart-4/15 text-chart-4' },
}

const TYPE_KEYS = Object.keys(TYPE_META) as TypeKey[]

// Calendar is a demo page; the seed lives inline. Swap for an API call when
// you wire a real events table. `d(n)` = date key n days from today.
export function seedEvents(today: Date): CalendarEvent[] {
  const d = (n: number) => {
    const x = new Date(today)
    x.setDate(today.getDate() + n)
    return isoDate(x)
  }
  return [
    { id: '1', title: 'Q4 roadmap review', date: d(0), start: '10:00', end: '11:30', type: 'meeting', description: 'Review the platform backlog and agree the Q4 priorities.', location: 'Conference Room A', attendees: ['Sarah Connor', 'Marcus Rivera', 'Alice Chen'], status: 'confirmed' },
    { id: '2', title: 'Customer call: Northwind', date: d(0), start: '14:00', end: '14:45', type: 'meeting', description: 'Contract renewal discussion. Prepare usage report.', location: 'Zoom', attendees: ['Marcus Rivera'], status: 'confirmed' },
    { id: '3', title: 'Deploy window', date: d(0), start: '16:00', end: '17:00', type: 'task', description: 'Production deploy for dashboard v2.1. Zero-downtime expected.', status: 'confirmed' },
    { id: '4', title: 'Team standup', date: d(-1), start: '09:30', end: '10:00', type: 'meeting', description: 'Daily sync. Blockers and wins.', location: 'Slack huddle', attendees: ['Platform team'], status: 'confirmed' },
    { id: '5', title: 'UX critique', date: d(1), start: '11:00', end: '12:00', type: 'meeting', description: 'Review new onboarding flow mockups.', location: 'Figma', attendees: ['Alice Chen', 'David Kim'], status: 'tentative' },
    { id: '6', title: 'Berlin trip: Marcus', date: d(2), start: '08:00', end: '20:00', type: 'travel', description: 'Customer onsite at Sentinel Labs.', location: 'Berlin', status: 'confirmed' },
    { id: '7', title: 'Renew SSL certificates', date: d(3), start: '17:00', end: '17:00', type: 'reminder', description: 'Certificates for api.example.com expire next week.', status: 'confirmed' },
    { id: '8', title: 'Vue Conf', date: d(9), start: '09:00', end: '18:00', type: 'travel', description: 'Alice attending. Prepare talk slides.', location: 'San Francisco', attendees: ['Alice Chen'], status: 'confirmed' },
    { id: '9', title: 'Invoice run', date: d(-3), start: '12:00', end: '13:00', type: 'task', description: 'Send monthly invoices and reconcile failed payments.', status: 'confirmed' },
    { id: '10', title: 'Security review', date: d(-6), start: '15:00', end: '16:00', type: 'meeting', description: 'Quarterly access and API key audit.', location: 'Zoom', attendees: ['Sarah Connor', 'David Kim'], status: 'confirmed' },
    { id: '11', title: 'Pricing page copy due', date: d(-8), start: '17:00', end: '17:00', type: 'reminder', description: 'Final copy for the new Team plan.', status: 'confirmed' },
  ]
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-calendar',
  standalone: true,
  imports: [
    LucideAngularModule,
    UiAvatarComponent,
    UiAvatarFallbackComponent,
    UiButtonComponent,
    UiCardComponent,
    UiCardDescriptionComponent,
    UiCardHeaderComponent,
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
    UiInputComponent,
    UiOverlayScrollComponent,
    UiPageBodyComponent,
    UiPageComponent,
    UiPageHeaderComponent,
    UiPageHeaderHeadingComponent,
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
    <ui-page>
      <ui-page-header>
        <ui-page-header-heading
          [title]="pageTitle()"
          description="Schedule, meetings and deadlines. Drag or shift-click to select a range."
        />
        <div slot="actions" class="flex min-w-0 flex-wrap items-center gap-2">
          <div class="relative w-full sm:w-56">
            <lucide-icon
              [img]="Search"
              class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 z-10 size-3.5 -translate-y-1/2"
              aria-hidden="true"
            />
            <ui-input
              size="small"
              class="pl-8"
              placeholder="Search events…"
              aria-label="Search events"
              [value]="search()"
              (valueChange)="search.set($event)"
            />
          </div>
          <ui-select [value]="view()" (valueChange)="view.set($any($event))">
            <button ui-select-trigger size="sm" class="w-24 text-xs" aria-label="Calendar view"><ui-select-value /></button>
            <ui-select-content>
              <ui-select-item value="month">Month</ui-select-item>
              <ui-select-item value="week">Week</ui-select-item>
              <ui-select-item value="day">Day</ui-select-item>
            </ui-select-content>
          </ui-select>
          <button ui-button size="sm">
            <lucide-icon [img]="Plus" class="size-4" aria-hidden="true" />
            New event
          </button>
        </div>
      </ui-page-header>

      <ui-page-body class="space-y-4">
        <!-- Stats strip -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          @for (type of typeKeys; track type) {
            <ui-stat-tile
              [label]="typeMeta[type].label"
              [value]="'' + monthCounts()[type]"
              caption="this month"
              [dotClass]="typeMeta[type].dot"
              [hasFooter]="true"
            >
              @if (nextByType()[type]; as next) {
                <p slot="footer" class="truncate" [title]="'Next: ' + fmtNextDate(next.date) + ' · ' + next.title">
                  Next: {{ fmtNextDate(next.date) }} · <span class="text-foreground font-medium">{{ next.title }}</span>
                </p>
              } @else {
                <p slot="footer">Nothing upcoming</p>
              }
            </ui-stat-tile>
          }
        </div>

        <!-- Main: calendar + side rail -->
        <div class="grid gap-4 lg:grid-cols-3">
          <!-- Month grid -->
          <ui-card class="lg:col-span-2">
            <div class="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-2">
              <div class="flex items-center gap-2">
                <button ui-button variant="outline" size="icon" class="size-7" aria-label="Previous month" (click)="grid.prevMonth()">
                  <lucide-icon [img]="ChevronLeft" class="size-4" aria-hidden="true" />
                </button>
                <button ui-button variant="outline" size="icon" class="size-7" aria-label="Next month" (click)="grid.nextMonth()">
                  <lucide-icon [img]="ChevronRight" class="size-4" aria-hidden="true" />
                </button>
                <button ui-button variant="ghost" size="sm" class="h-7 text-xs" (click)="grid.goToToday()">Today</button>
                <h2 class="ml-2 text-sm font-semibold">{{ grid.monthLabel() }}</h2>
              </div>
              <div class="text-muted-foreground flex flex-wrap items-center gap-4 text-xs">
                @if (grid.isRange()) {
                  <div class="bg-primary/10 text-primary ring-primary/20 flex items-center gap-1.5 rounded-full px-2 py-0.5 ring-1 ring-inset">
                    <lucide-icon [img]="MousePointer2" class="size-3.5" aria-hidden="true" />
                    <span class="tabular-nums">{{ grid.rangeDayCount() }} days · {{ rangeEvents().length }} events</span>
                    <button type="button" class="hover:text-foreground ml-0.5" aria-label="Clear range" (click)="grid.clearRange()">
                      <lucide-icon [img]="X" class="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                }
                <div class="flex items-center gap-1.5">
                  <lucide-icon [img]="Sparkles" class="size-3.5" aria-hidden="true" />
                  <span class="tabular-nums">{{ monthCounts().total }} event{{ monthCounts().total === 1 ? '' : 's' }} this month</span>
                </div>
              </div>
            </div>

            <!-- Weekday header -->
            <div class="bg-muted/10 text-muted-foreground grid grid-cols-7 border-b text-xs font-medium tracking-wider uppercase">
              @for (w of grid.weekdays(); track w) {
                <div class="p-2">{{ w }}</div>
              }
            </div>

            <!-- Cells -->
            <div class="grid grid-cols-7 select-none">
              @if (loading()) {
                @for (i of skeletonCells; track i) {
                  <div class="h-28 border-r border-b p-1.5 last:border-r-0">
                    <ui-skeleton class="h-3 w-6" />
                    <ui-skeleton class="mt-2 h-3 w-full" />
                  </div>
                }
              } @else {
                @for (d of grid.gridDays(); track d.key; let i = $index) {
                  <ui-context-menu>
                    <!-- WHY (Rule94): the cell is a plain div (role=group, never
                         a button) so the event chip inside can be a REAL button.
                         No nested interactives; the chip is keyboard reachable
                         by Tab and the cell anchors via Enter/Space. -->
                    <div
                      ui-context-menu-trigger
                      [class]="cellClass(d.key, d.inMonth, i)"
                      tabindex="0"
                      role="group"
                      [attr.aria-label]="fmtDayLong(d.key) + ': ' + countOn(d.key) + ' events'"
                      (mousedown)="grid.onCellMouseDown(d.key, $event)"
                      (mouseenter)="grid.onCellMouseEnter(d.key)"
                      (keydown.enter)="grid.selectDay(d.key)"
                      (keydown.space)="$event.preventDefault(); grid.selectDay(d.key)"
                    >
                      <div class="flex items-center justify-between">
                        <span [class]="dateClass(d.key, d.inMonth)">{{ d.date.getDate() }}</span>
                        @if (countOn(d.key) > 0) {
                          <span class="text-muted-foreground text-xs tabular-nums">{{ countOn(d.key) }}</span>
                        }
                      </div>
                      <div class="flex min-w-0 flex-col gap-0.5">
                        @for (e of visibleEvents(d.key); track e.id) {
                          <ui-context-menu>
                            <button
                              ui-context-menu-trigger
                              type="button"
                              [class]="
                                'focus-visible:ring-ring flex w-full min-w-0 cursor-pointer flex-col rounded-sm border-l-2 px-1 py-0.5 text-left text-xs leading-4 focus-visible:ring-2 focus-visible:outline-none ' +
                                typeMeta[e.type].chip
                              "
                              [title]="timeRange(e) + ' · ' + e.title"
                              [attr.aria-label]="e.title + ', ' + timeRange(e)"
                              (mousedown)="$event.stopPropagation()"
                              (click)="$event.stopPropagation(); openEvent(e)"
                              (contextmenu)="$event.stopPropagation()"
                            >
                              <span class="truncate font-medium">{{ e.title }}</span>
                              <span class="text-muted-foreground tabular-nums">{{ e.start }}</span>
                            </button>
                            <ui-context-menu-content class="w-52">
                              <ui-context-menu-label class="text-muted-foreground flex items-center gap-1.5 text-xs">
                                <span [class]="'size-2 shrink-0 rounded-full ' + typeMeta[e.type].dot"></span>
                                <span class="truncate">{{ e.title }}</span>
                              </ui-context-menu-label>
                              <ui-context-menu-separator />
                              <ui-context-menu-item (select)="openEvent(e)">
                                <lucide-icon [img]="Eye" aria-hidden="true" /> View details
                                <ui-context-menu-shortcut>↵</ui-context-menu-shortcut>
                              </ui-context-menu-item>
                              <ui-context-menu-item><lucide-icon [img]="Pencil" aria-hidden="true" /> Edit</ui-context-menu-item>
                              <ui-context-menu-item><lucide-icon [img]="CopyPlus" aria-hidden="true" /> Duplicate</ui-context-menu-item>
                              <ui-context-menu-item (select)="copyDate(e.date)"><lucide-icon [img]="Copy" aria-hidden="true" /> Copy date</ui-context-menu-item>
                              <ui-context-menu-separator />
                              <ui-context-menu-item variant="destructive"><lucide-icon [img]="Trash2" aria-hidden="true" /> Cancel event</ui-context-menu-item>
                            </ui-context-menu-content>
                          </ui-context-menu>
                        }
                        @if (countOn(d.key) > visibleEvents(d.key).length) {
                          <span class="text-muted-foreground px-1 text-xs">+{{ countOn(d.key) - visibleEvents(d.key).length }} more</span>
                        }
                      </div>
                    </div>
                    <ui-context-menu-content class="w-56">
                      <ui-context-menu-label class="text-muted-foreground text-xs">{{ fmtDayLong(d.key) }}</ui-context-menu-label>
                      <ui-context-menu-separator />
                      <ui-context-menu-item>
                        <lucide-icon [img]="CalendarPlus" aria-hidden="true" /> New event
                        <ui-context-menu-shortcut>N</ui-context-menu-shortcut>
                      </ui-context-menu-item>
                      <ui-context-menu-item (select)="grid.selectWeekOf(d.key)">
                        <lucide-icon [img]="CalendarDays" aria-hidden="true" /> Select this week
                      </ui-context-menu-item>
                      <ui-context-menu-item [disabled]="countOn(d.key) === 0" (select)="grid.selectDay(d.key)">
                        <lucide-icon [img]="Eye" aria-hidden="true" /> View day · {{ countOn(d.key) }} event{{ countOn(d.key) === 1 ? '' : 's' }}
                      </ui-context-menu-item>
                      <ui-context-menu-separator />
                      <ui-context-menu-item (select)="copyDate(d.key)">
                        <lucide-icon [img]="Copy" aria-hidden="true" /> Copy date
                        <ui-context-menu-shortcut class="tabular-nums">{{ d.key }}</ui-context-menu-shortcut>
                      </ui-context-menu-item>
                      <ui-context-menu-item (select)="grid.goToToday()">
                        <lucide-icon [img]="ArrowRight" aria-hidden="true" /> Go to today
                      </ui-context-menu-item>
                      @if (grid.isRange()) {
                        <ui-context-menu-item variant="destructive" (select)="grid.clearRange()">
                          <lucide-icon [img]="X" aria-hidden="true" /> Clear range
                        </ui-context-menu-item>
                      }
                    </ui-context-menu-content>
                  </ui-context-menu>
                }
              }
            </div>

            <!-- Legend -->
            <div class="bg-muted/20 text-muted-foreground flex flex-wrap items-center gap-4 border-t px-4 py-2 text-xs">
              <lucide-icon [img]="ListFilter" class="size-3.5" aria-hidden="true" />
              @for (key of typeKeys; track key) {
                <div class="flex items-center gap-1.5">
                  <span [class]="'size-2 rounded-full ' + typeMeta[key].dot"></span>
                  {{ typeMeta[key].label }}
                </div>
              }
              <span class="ml-auto">Drag or shift-click to select a range. Right-click for actions.</span>
            </div>
          </ui-card>

          <!-- Side rail -->
          <aside class="flex flex-col gap-4">
            @if (!grid.isRange()) {
              <!-- Selected day -->
              <ui-card>
                <div class="border-b p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                        {{ grid.rangeStart() === grid.todayKey ? 'Today' : 'Selected' }}
                      </p>
                      <p class="mt-0.5 text-base font-semibold">{{ fmtDayLong(grid.rangeStart()) }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Events</p>
                      <p class="text-sm font-semibold tabular-nums">{{ selectedDayEvents().length }}</p>
                    </div>
                  </div>
                </div>
                <ui-overlay-scroll class="max-h-[420px] p-2">
                  @if (loading()) {
                    @for (i of [1, 2, 3]; track i) {
                      <div class="mb-2 space-y-2 rounded-lg border p-3">
                        <ui-skeleton class="h-3 w-32" />
                        <ui-skeleton class="h-2 w-20" />
                      </div>
                    }
                  } @else if (selectedDayEvents().length === 0) {
                    <div class="flex flex-col items-center justify-center gap-2 py-4 text-center">
                      <div class="bg-muted flex size-10 items-center justify-center rounded-full">
                        <lucide-icon [img]="CalendarDays" class="text-muted-foreground size-5" aria-hidden="true" />
                      </div>
                      <p class="text-sm font-medium">Nothing scheduled</p>
                      <p class="text-muted-foreground text-xs">Click a date or add a new event.</p>
                      <button ui-button size="sm" variant="outline" class="mt-1">
                        <lucide-icon [img]="Plus" class="size-4" aria-hidden="true" /> New event
                      </button>
                    </div>
                  } @else {
                    @for (e of selectedDayEvents(); track e.id) {
                      <ui-context-menu>
                        <button
                          ui-context-menu-trigger
                          type="button"
                          class="group hover:bg-accent/50 focus-visible:ring-ring/50 relative flex w-full gap-2 rounded-lg p-2 text-left transition-colors outline-none focus-visible:ring-[3px]"
                          (click)="openEvent(e)"
                        >
                          <div [class]="'w-0.5 shrink-0 rounded-full ' + typeMeta[e.type].dot"></div>
                          <div class="min-w-0 flex-1 space-y-1">
                            <div class="flex items-start justify-between gap-2">
                              <p class="text-sm leading-tight font-medium">{{ e.title }}</p>
                              <span [class]="'shrink-0 rounded px-1.5 py-0.5 text-xs ' + typeMeta[e.type].pill">{{ typeMeta[e.type].label }}</span>
                            </div>
                            <div class="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                              <span class="inline-flex items-center gap-1.5 tabular-nums">
                                <lucide-icon [img]="Clock" class="size-3.5" aria-hidden="true" />{{ timeRange(e) }}
                              </span>
                              @if (e.location) {
                                <span class="inline-flex items-center gap-1.5">
                                  <lucide-icon [img]="MapPin" class="size-3.5" aria-hidden="true" />{{ e.location }}
                                </span>
                              }
                            </div>
                            @if (e.attendees?.length) {
                              <div class="flex items-center -space-x-1.5 pt-0.5">
                                @for (a of e.attendees!.slice(0, 4); track $index) {
                                  <ui-avatar class="border-background size-6 border-2">
                                    <ui-avatar-fallback class="bg-muted text-muted-foreground text-xs">{{ initials(a) }}</ui-avatar-fallback>
                                  </ui-avatar>
                                }
                                @if (e.attendees!.length > 4) {
                                  <span class="text-muted-foreground pl-2 text-xs">+{{ e.attendees!.length - 4 }}</span>
                                }
                              </div>
                            }
                          </div>
                        </button>
                        <ui-context-menu-content class="w-48">
                          <ui-context-menu-label class="text-muted-foreground truncate text-xs">{{ e.title }}</ui-context-menu-label>
                          <ui-context-menu-separator />
                          <ui-context-menu-item (select)="openEvent(e)"><lucide-icon [img]="Eye" aria-hidden="true" /> View details</ui-context-menu-item>
                          <ui-context-menu-item><lucide-icon [img]="Pencil" aria-hidden="true" /> Edit</ui-context-menu-item>
                          <ui-context-menu-item><lucide-icon [img]="CopyPlus" aria-hidden="true" /> Duplicate</ui-context-menu-item>
                          <ui-context-menu-separator />
                          <ui-context-menu-item variant="destructive"><lucide-icon [img]="Trash2" aria-hidden="true" /> Cancel event</ui-context-menu-item>
                        </ui-context-menu-content>
                      </ui-context-menu>
                    }
                  }
                </ui-overlay-scroll>
              </ui-card>
            } @else {
              <!-- Range summary -->
              <ui-card>
                <div class="border-b p-4">
                  <div class="flex items-center justify-between gap-4">
                    <div class="min-w-0">
                      <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Range · {{ grid.rangeDayCount() }} days</p>
                      <p class="mt-0.5 truncate text-base font-semibold">
                        {{ fmtDayShort(grid.rangeBounds().lo) }} → {{ fmtDayShort(grid.rangeBounds().hi) }}
                      </p>
                    </div>
                    <button ui-button variant="ghost" size="icon" class="size-7" aria-label="Clear range" (click)="grid.clearRange()">
                      <lucide-icon [img]="X" class="size-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div class="mt-3 grid grid-cols-2 gap-2">
                    @for (t of typeKeys; track t) {
                      <div class="flex items-center justify-between gap-2 px-2 py-1.5">
                        <div class="text-muted-foreground flex items-center gap-1.5 text-xs">
                          <span [class]="'size-2 rounded-full ' + typeMeta[t].dot"></span>
                          {{ typeMeta[t].label }}
                        </div>
                        <p class="text-sm font-semibold tabular-nums">{{ rangeTypeCounts()[t] }}</p>
                      </div>
                    }
                  </div>
                </div>
                <ui-overlay-scroll class="max-h-[420px]">
                  @if (rangeEvents().length === 0) {
                    <p class="text-muted-foreground px-4 py-4 text-center text-xs">No events in range.</p>
                  } @else {
                    @for (e of rangeEvents(); track e.id) {
                      <button
                        type="button"
                        class="hover:bg-accent/40 focus-visible:ring-ring/50 flex w-full items-start gap-2 border-b px-3 py-2 text-left transition-colors outline-none last:border-b-0 focus-visible:ring-[3px] focus-visible:ring-inset"
                        (click)="openEvent(e)"
                      >
                        <div class="bg-background flex w-10 shrink-0 flex-col items-center rounded-md p-1 text-center">
                          <span class="text-muted-foreground text-xs uppercase">{{ fmtMonthShort(e.date) }}</span>
                          <span class="text-sm leading-none font-semibold tabular-nums">{{ dayNum(e.date) }}</span>
                        </div>
                        <div [class]="'w-0.5 shrink-0 self-stretch rounded-full ' + typeMeta[e.type].dot"></div>
                        <div class="min-w-0 flex-1">
                          <p class="truncate text-sm font-medium" [title]="e.title">{{ e.title }}</p>
                          <p class="text-muted-foreground mt-0.5 text-xs tabular-nums">
                            {{ timeRange(e) }}@if (e.location) {<span> · {{ e.location }}</span>}
                          </p>
                        </div>
                        <span [class]="'shrink-0 rounded px-1.5 py-0.5 text-xs ' + typeMeta[e.type].pill">{{ typeMeta[e.type].label }}</span>
                      </button>
                    }
                  }
                </ui-overlay-scroll>
              </ui-card>
            }

            <!-- Upcoming -->
            <ui-card>
              <ui-card-header class="border-b">
                <h2 class="text-base leading-none font-semibold tracking-tight">Up next</h2>
                <ui-card-description>After today</ui-card-description>
              </ui-card-header>
              <div class="divide-y">
                @if (loading()) {
                  @for (i of [1, 2, 3]; track i) {
                    <div class="flex items-center gap-2 p-3">
                      <ui-skeleton class="size-10 rounded-md" />
                      <div class="flex-1 space-y-1">
                        <ui-skeleton class="h-3 w-32" />
                        <ui-skeleton class="h-2 w-20" />
                      </div>
                    </div>
                  }
                } @else if (upcoming().length === 0) {
                  <p class="text-muted-foreground px-4 py-4 text-center text-xs">Nothing on the horizon.</p>
                } @else {
                  @for (e of upcoming(); track e.id) {
                    <button
                      type="button"
                      class="group hover:bg-accent/40 flex w-full items-center gap-2 p-3 text-left transition-colors"
                      (click)="openEvent(e)"
                    >
                      <div class="bg-background flex size-10 shrink-0 flex-col items-center justify-center rounded-md text-center">
                        <span class="text-muted-foreground text-xs uppercase">{{ fmtMonthShort(e.date) }}</span>
                        <span class="text-sm leading-none font-semibold tabular-nums">{{ dayNum(e.date) }}</span>
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-1.5">
                          <span [class]="'size-2 shrink-0 rounded-full ' + typeMeta[e.type].dot"></span>
                          <p class="truncate text-sm font-medium" [title]="e.title">{{ e.title }}</p>
                        </div>
                        <p class="text-muted-foreground mt-0.5 text-xs tabular-nums">
                          {{ timeRange(e) }}@if (e.location) {<span> · {{ e.location }}</span>}
                        </p>
                      </div>
                    </button>
                  }
                }
              </div>
            </ui-card>
          </aside>
        </div>
      </ui-page-body>

      <!-- Event detail dialog -->
      <ui-dialog [open]="eventOpen()" (openChange)="eventOpen.set($event)">
        @if (selectedEvent(); as ev) {
          <ui-dialog-content class="sm:max-w-md">
            <ui-dialog-header>
              <div class="flex items-center gap-2">
                <div [class]="'flex size-8 items-center justify-center rounded-md ' + typeMeta[ev.type].iconBox">
                  <lucide-icon [img]="typeMeta[ev.type].icon" class="size-4" aria-hidden="true" />
                </div>
                <div>
                  <ui-dialog-title class="text-base">{{ ev.title }}</ui-dialog-title>
                  <ui-dialog-description class="text-xs">{{ typeMeta[ev.type].label }} · {{ ev.status }}</ui-dialog-description>
                </div>
              </div>
            </ui-dialog-header>
            <div class="space-y-3 py-2">
              <p class="text-muted-foreground text-sm">{{ ev.description }}</p>
              <ui-separator />
              <div class="grid gap-2 text-sm">
                <div class="flex items-center gap-2">
                  <lucide-icon [img]="Clock" class="text-muted-foreground size-4" aria-hidden="true" />
                  <span class="tabular-nums">{{ fmtDayLong(ev.date) }} · {{ timeRange(ev) }}</span>
                </div>
                @if (ev.location) {
                  <div class="flex items-center gap-2">
                    <lucide-icon [img]="MapPin" class="text-muted-foreground size-4" aria-hidden="true" />
                    <span>{{ ev.location }}</span>
                  </div>
                }
                @if (ev.attendees?.length) {
                  <div class="flex items-start gap-2">
                    <lucide-icon [img]="Users" class="text-muted-foreground mt-0.5 size-4" aria-hidden="true" />
                    <div class="flex flex-wrap items-center gap-1.5">
                      @for (a of ev.attendees!; track a) {
                        <div class="bg-muted flex items-center gap-1.5 rounded-full py-0.5 pr-2 pl-0.5 text-xs">
                          <ui-avatar class="size-6">
                            <ui-avatar-fallback class="bg-background text-muted-foreground text-xs">{{ initials(a) }}</ui-avatar-fallback>
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
    </ui-page>
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
  protected readonly CopyPlus = CopyPlus
  protected readonly Eye = Eye
  protected readonly ListFilter = ListFilter
  protected readonly MapPin = MapPin
  protected readonly MousePointer2 = MousePointer2
  protected readonly Pencil = Pencil
  protected readonly Plus = Plus
  protected readonly Search = Search
  protected readonly Sparkles = Sparkles
  protected readonly Trash2 = Trash2
  protected readonly Users = Users
  protected readonly X = X

  readonly pageTitle = injectPageTitle()
  readonly typeMeta = TYPE_META
  readonly typeKeys = TYPE_KEYS
  readonly skeletonCells = Array.from({ length: 35 }, (_, i) => i)

  // Opens on today; "today" is frozen at construction (predictable for SSR).
  readonly grid = createMonthGrid()

  readonly view = signal<'month' | 'week' | 'day'>('month')
  readonly eventOpen = signal(false)
  readonly selectedEvent = signal<CalendarEvent | null>(null)
  readonly search = signal('')
  readonly events = signal<CalendarEvent[]>(seedEvents(this.grid.today))
  readonly loading = signal(false)

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase()
    if (!q) return this.events()
    return this.events().filter(
      e => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q),
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
    const init = { meeting: 0, task: 0, travel: 0, reminder: 0, total: 0 }
    for (const e of this.events()) {
      const d = dateFromKey(e.date)
      if (d.getFullYear() === cur.getFullYear() && d.getMonth() === cur.getMonth()) {
        init[e.type]++
        init.total++
      }
    }
    return init
  })

  // Next upcoming event per type (from today onward, not just this month).
  readonly nextByType = computed(() => {
    const out = {} as Record<TypeKey, CalendarEvent | null>
    for (const t of TYPE_KEYS) {
      const sorted = this.events()
        .filter(e => e.type === t && e.date >= this.grid.todayKey)
        .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
      out[t] = sorted[0] ?? null
    }
    return out
  })

  readonly rangeEvents = computed(() => {
    const { lo, hi } = this.grid.rangeBounds()
    return this.filtered()
      .filter(e => e.date >= lo && e.date <= hi)
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
      .filter(e => e.date > this.grid.todayKey)
      .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
      .slice(0, 4),
  )

  countOn(key: string): number {
    return this.eventsByDate().get(key)?.length ?? 0
  }

  // Cells fit two chips. With three or more events, show one chip and
  // "+N more" so the chip keeps room for its time line.
  visibleEvents(key: string): CalendarEvent[] {
    const list = this.eventsByDate().get(key) ?? []
    return list.slice(0, list.length > 2 ? 1 : 2)
  }

  openEvent(e: CalendarEvent): void {
    this.selectedEvent.set(e)
    this.eventOpen.set(true)
  }

  copyDate(key: string): void {
    navigator?.clipboard?.writeText(key).catch(() => undefined)
  }

  timeRange(e: CalendarEvent): string {
    return e.start === e.end ? e.start : `${e.start}–${e.end}`
  }

  fmtNextDate(key: string): string {
    if (key === this.grid.todayKey) return 'Today'
    return this.fmtDayShort(key)
  }

  fmtDayLong(key: string): string {
    return dateFromKey(key).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  fmtDayShort(key: string): string {
    return dateFromKey(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  fmtMonthShort(key: string): string {
    return dateFromKey(key).toLocaleDateString('en-US', { month: 'short' })
  }

  dayNum(key: string): number {
    return dateFromKey(key).getDate()
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2)
  }

  cellClass(key: string, inMonth: boolean, i: number): string {
    return [
      'group focus-visible:ring-ring relative flex h-28 min-w-0 cursor-default flex-col gap-1 border-r border-b p-1.5 text-left transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none',
      (i + 1) % 7 === 0 ? 'border-r-0' : '',
      i >= 35 ? 'border-b-0' : '',
      this.cellRangeClass(key, inMonth),
    ].filter(Boolean).join(' ')
  }

  dateClass(key: string, inMonth: boolean): string {
    return [
      'inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums',
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
