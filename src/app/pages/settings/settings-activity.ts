// Settings → Activity — audit trail of sign-ins, projects, invites and
// settings changes. Ports nuxt-boilerplate `app/pages/settings/activity.vue`
// 1:1 (see also next-boilerplate `settings/activity/page.tsx`): the action
// filter is pushed to the server (?action= substring match); the entity
// filter is applied client-side. Dates format with the i18n locale so SSR
// and client agree (no hydration mismatch).
import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { HttpClient, HttpParams } from '@angular/common/http'
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
import { UiPageBodyComponent, UiPageComponent, UiPageHeaderComponent, UiPageHeaderHeadingComponent } from '@/app/components/ui/page'
import { I18nService, injectPageTitle } from '@/app/core/i18n'

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
    UiPageBodyComponent,
    UiPageComponent,
    UiPageHeaderComponent,
    UiPageHeaderHeadingComponent,
    UiTableBodyComponent,
    UiTableCellComponent,
    UiTableComponent,
    UiTableHeadComponent,
    UiTableHeaderComponent,
    UiTableRowComponent,
  ],
  template: `
    <ui-page>
      <ui-page-header>
        <ui-page-header-heading [title]="pageTitle()" [description]="t('settings.activity.description')" />
      </ui-page-header>

      <ui-page-body class="space-y-4">
        <ui-card>
          <div class="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center">
            <div class="w-full sm:w-64">
              <ng-template #searchIcon><lucide-icon [img]="SearchIcon" class="size-4" /></ng-template>
              <ui-input
                size="small"
                [prefixIcon]="searchIcon"
                [value]="actionQuery()"
                (valueChange)="onActionQuery($event)"
                [placeholder]="t('settings.activity.filters.action')"
                [aria-label]="t('settings.activity.filters.action')"
              />
            </div>
            <div class="w-full sm:w-64">
              <ng-template #tagIcon><lucide-icon [img]="TagIcon" class="size-4" /></ng-template>
              <ui-input
                size="small"
                [prefixIcon]="tagIcon"
                [value]="entityQuery()"
                (valueChange)="entityQuery.set($event)"
                [placeholder]="t('settings.activity.filters.entity')"
                [aria-label]="t('settings.activity.filters.entity')"
              />
            </div>
          </div>

          @if (pending()) {
            <div class="text-muted-foreground flex items-center gap-2 px-4 py-4 text-sm">
              <lucide-icon [img]="LoaderIcon" class="size-4 animate-spin" />
              {{ t('settings.activity.states.loading') }}
            </div>
          } @else if (loadError()) {
            <ui-empty-state
              [icon]="loadErrorIcon"
              role="alert"
              [title]="t('settings.activity.states.error')"
              description="Something went wrong on our side. Please try again."
            >
              <ng-template #loadErrorIcon><lucide-icon [img]="CloudIcon" /></ng-template>
              <button ui-button variant="outline" size="sm" class="mt-4" (click)="load()">{{ t('settings.activity.states.retry') }}</button>
            </ui-empty-state>
          } @else if (filtered().length === 0 && isFiltering()) {
            <!-- Filters active: say so and offer the way out. -->
            <ui-empty-state
              [icon]="noMatchIcon"
              [title]="t('settings.activity.states.noMatchTitle')"
              [description]="t('settings.activity.states.noMatchDescription')"
            >
              <ng-template #noMatchIcon><lucide-icon [img]="SearchIcon" /></ng-template>
              <button ui-button variant="outline" size="sm" class="mt-4" (click)="clearFilters()">
                {{ t('settings.activity.states.clearFilters') }}
              </button>
            </ui-empty-state>
          } @else if (filtered().length === 0) {
            <!-- Nothing recorded: explain why, so support can tell "empty" from "broken". -->
            <ui-empty-state
              [icon]="noActivityIcon"
              [title]="t('settings.activity.states.empty')"
              [description]="t('settings.activity.states.emptyDescription')"
            >
              <ng-template #noActivityIcon><lucide-icon [img]="ActivityIcon" /></ng-template>
            </ui-empty-state>
          } @else {
            <ui-table>
              <thead ui-table-header>
                <tr ui-table-row>
                  <th ui-table-head>{{ t('settings.activity.table.event') }}</th>
                  <th ui-table-head>{{ t('settings.activity.table.actor') }}</th>
                  <th ui-table-head>{{ t('settings.activity.table.entity') }}</th>
                  <th ui-table-head class="text-right">{{ t('settings.activity.table.time') }}</th>
                </tr>
              </thead>
              <tbody ui-table-body>
                @for (item of filtered(); track item.id) {
                  <tr ui-table-row>
                    <td ui-table-cell>
                      <span class="flex items-center gap-2 text-sm font-medium">
                        <lucide-icon [img]="iconFor(item.action)" class="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
                        <span class="font-mono text-xs">{{ item.action }}</span>
                      </span>
                    </td>
                    <td ui-table-cell class="text-muted-foreground max-w-55 truncate text-xs" [attr.title]="item.actorEmail">
                      {{ item.actorEmail ?? t('settings.activity.feed.deletedUser') }}
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
      </ui-page-body>
    </ui-page>
  `,
})
export class SettingsActivity {
  private readonly http = inject(HttpClient)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly i18n = inject(I18nService)
  protected readonly pageTitle = injectPageTitle()

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

  // Reads lang() so a locale switch re-renders the copy.
  t(key: string, params?: Record<string, string | number>): string {
    this.i18n.lang()
    return this.i18n.t(key, params)
  }

  iconFor(action: string): LucideIconData {
    return actionIconFor(action)
  }

  labelFor(item: ActivityItem): string {
    return entityLabel(item)
  }

  formatFull(value: string): string {
    return new Date(value).toLocaleString(this.i18n.lang(), { dateStyle: 'medium', timeStyle: 'short' })
  }

  timeAgo(value: string): string {
    const date = new Date(value)
    const diffMs = date.getTime() - Date.now()
    const rtf = new Intl.RelativeTimeFormat(this.i18n.lang(), { numeric: 'auto' })
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
