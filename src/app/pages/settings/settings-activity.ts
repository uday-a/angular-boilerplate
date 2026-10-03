// Settings → Activity — audit trail of sign-ins, projects, invites and
// settings changes. Ports nuxt-boilerplate `app/pages/settings/activity.vue`
// 1:1 (see also next-boilerplate `settings/activity/page.tsx`): the action
// filter is pushed to the server (?action= substring match); the entity
// filter is applied client-side. Dates format with the i18n locale so SSR
// and client agree (no hydration mismatch).
import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Title } from '@angular/platform-browser'
import {
  Activity as ActivityIcon,
  CloudOff,
  FolderPlus,
  LoaderCircle,
  LogIn,
  LucideAngularModule,
  MessageSquare,
  Search,
  Tag,
  UserPlus,
  type LucideIconData,
} from 'lucide-angular'
import { UiButtonComponent } from '@/app/components/ui/button'
import { UiEmptyStateComponent } from '@/app/components/ui/empty-state'
import { UiCardComponent } from '@/app/components/ui/card'
import { UiInputComponent } from '@/app/components/ui/input'
import {
  UiTableBodyComponent,
  UiTableCellComponent,
  UiTableComponent,
  UiTableHeadComponent,
  UiTableHeaderComponent,
  UiTableRowComponent,
} from '@/app/components/ui/table'
import { type ApiResponse, apiErrorMessage } from '@/app/core/api/api'
import { I18nService } from '@/app/core/i18n'

export interface ActivityItem {
  id: number
  userId: number | null
  action: string
  entity: string | null
  entityId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  actorEmail: string | null
}

function actionIconFor(action: string): LucideIconData {
  if (action.startsWith('auth.')) return LogIn
  if (action.startsWith('projects.')) return FolderPlus
  if (action.startsWith('feedback.')) return MessageSquare
  if (action.startsWith('team.')) return UserPlus
  return ActivityIcon
}

export function entityLabel(item: Pick<ActivityItem, 'entity' | 'entityId'>): string {
  if (!item.entity) return '—'
  return item.entityId ? `${item.entity} #${item.entityId}` : item.entity
}

@Component({
  selector: 'app-settings-activity',
  standalone: true,
  imports: [
    LucideAngularModule,
    UiButtonComponent,
    UiEmptyStateComponent,
    UiCardComponent,
    UiInputComponent,
    UiTableBodyComponent,
    UiTableCellComponent,
    UiTableComponent,
    UiTableHeadComponent,
    UiTableHeaderComponent,
    UiTableRowComponent,
  ],
  template: `
    <div class="space-y-4">
      <header class="space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight">Activity log</h1>
        <p class="text-muted-foreground text-sm">Audit trail of who did what in your workspace.</p>
      </header>

      <div class="flex flex-wrap items-center gap-2">
        <div class="relative max-w-xs flex-1">
          <lucide-icon
            [img]="SearchIcon"
            class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          />
          <ui-input
            [value]="actionQuery()"
            (valueChange)="onActionQuery($event)"
            placeholder="Filter by action (e.g. team)"
            class="pl-8 h-9"
          />
        </div>
        <div class="relative max-w-xs flex-1">
          <lucide-icon
            [img]="TagIcon"
            class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          />
          <ui-input
            [value]="entityQuery()"
            (valueChange)="entityQuery.set($event)"
            placeholder="Filter by entity"
            class="pl-8 h-9"
          />
        </div>
      </div>

      <ui-card>
        @if (pending()) {
          <div class="text-muted-foreground flex items-center gap-2 px-4 py-4 text-sm">
            <lucide-icon [img]="LoaderIcon" class="size-4 animate-spin" />
            Loading activity…
          </div>
        } @else if (loadError()) {
          <ui-empty-state
            [icon]="loadErrorIcon"
            role="alert"
            title="Could not load activity."
            description="Something went wrong on our side. Please try again."
            class="px-4"
          >
            <ng-template #loadErrorIcon><lucide-icon [img]="CloudIcon" /></ng-template>
            <button ui-button variant="outline" size="sm" class="mt-4" (click)="load()">Retry</button>
          </ui-empty-state>
        } @else if (filtered().length === 0 && isFiltering()) {
          <ui-empty-state
            [icon]="noMatchIcon"
            title="No matching events"
            description="Nothing matches these filters. Try a broader search."
            class="px-4"
          >
            <ng-template #noMatchIcon><lucide-icon [img]="SearchIcon" /></ng-template>
            <button ui-button variant="outline" size="sm" class="mt-4" (click)="clearFilters()">Clear filters</button>
          </ui-empty-state>
        } @else if (filtered().length === 0) {
          <ui-empty-state
            [icon]="noActivityIcon"
            title="No activity yet."
            description="Events appear here as you sign in, create projects, invite teammates or change settings. Demo workspaces and apps without a database don’t record events."
            class="px-4"
          >
            <ng-template #noActivityIcon><lucide-icon [img]="ActivityIcon" /></ng-template>
          </ui-empty-state>
        } @else {
          <ui-table>
            <thead ui-table-header>
              <tr ui-table-row>
                <th ui-table-head>Event</th>
                <th ui-table-head>Actor</th>
                <th ui-table-head>Entity</th>
                <th ui-table-head class="text-right">Time</th>
              </tr>
            </thead>
            <tbody ui-table-body>
              @for (item of filtered(); track item.id) {
                <tr ui-table-row>
                  <td ui-table-cell>
                    <span class="flex items-center gap-2 text-sm font-medium">
                      <lucide-icon [img]="iconFor(item.action)" class="text-muted-foreground size-4 shrink-0" />
                      <span class="font-mono text-xs">{{ item.action }}</span>
                    </span>
                  </td>
                  <td ui-table-cell class="text-muted-foreground max-w-55 truncate text-xs" [title]="item.actorEmail ?? 'Deleted user'">
                    {{ item.actorEmail ?? 'Deleted user' }}
                  </td>
                  <td ui-table-cell class="text-muted-foreground text-xs">{{ labelFor(item) }}</td>
                  <td ui-table-cell class="text-right">
                    <time [title]="formatFull(item.createdAt)" class="text-muted-foreground text-xs tabular-nums">
                      {{ timeAgo(item.createdAt) }}
                    </time>
                  </td>
                </tr>
              }
            </tbody>
          </ui-table>
        }
      </ui-card>
    </div>
  `,
})
export class SettingsActivity {
  private readonly http = inject(HttpClient)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly i18n = inject(I18nService)

  protected readonly SearchIcon = Search
  protected readonly TagIcon = Tag
  protected readonly LoaderIcon = LoaderCircle
  protected readonly CloudIcon = CloudOff
  protected readonly ActivityIcon = ActivityIcon

  protected readonly actionQuery = signal('')
  protected readonly entityQuery = signal('')
  protected readonly items = signal<ActivityItem[]>([])
  protected readonly pending = signal(true)
  protected readonly loadError = signal(false)

  protected readonly filtered = computed(() => {
    const needle = this.entityQuery().trim().toLowerCase()
    if (!needle) return this.items()
    return this.items().filter(
      (item) => item.entity?.toLowerCase().includes(needle) || item.entityId?.toLowerCase().includes(needle),
    )
  })

  protected readonly isFiltering = computed(() => Boolean(this.actionQuery().trim() || this.entityQuery().trim()))

  private debounce?: ReturnType<typeof setTimeout>

  constructor() {
    inject(Title).setTitle('Activity log · Settings')
    if (this.browser) this.load()
    else this.pending.set(false)
  }

  onActionQuery(value: string): void {
    this.actionQuery.set(value)
    clearTimeout(this.debounce)
    this.debounce = setTimeout(() => this.load(), value ? 300 : 0)
  }

  clearFilters(): void {
    this.actionQuery.set('')
    this.entityQuery.set('')
    this.load()
  }

  load(): void {
    if (!this.browser) return
    this.pending.set(true)
    this.loadError.set(false)
    let params = new HttpParams()
    const q = this.actionQuery().trim()
    if (q) params = params.set('action', q)
    this.http
      .get<ApiResponse<{ items: ActivityItem[], total: number }>>('/api/activity', {
        params,
        withCredentials: true,
      })
      .subscribe({
        next: (res) => {
          this.pending.set(false)
          if (res.ok) this.items.set(res.data.items)
          else this.loadError.set(true)
        },
        error: (err: unknown) => {
          this.pending.set(false)
          this.loadError.set(true)
          void apiErrorMessage(err, 'Failed to load activity')
        },
      })
  }

  iconFor(action: string): LucideIconData {
    return actionIconFor(action)
  }

  labelFor(item: ActivityItem): string {
    return entityLabel(item)
  }

  formatFull(value: string): string {
    return new Date(value).toLocaleString(this.i18n.locale, { dateStyle: 'medium', timeStyle: 'short' })
  }

  timeAgo(value: string): string {
    const date = new Date(value)
    const diffMs = date.getTime() - Date.now()
    const rtf = new Intl.RelativeTimeFormat(this.i18n.locale, { numeric: 'auto' })
    const absSec = Math.abs(diffMs) / 1000
    if (absSec < 60) return rtf.format(Math.round(diffMs / 1000), 'second')
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
}
