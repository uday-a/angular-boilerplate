// Admin → Users — first consumer of the role gate: server-side
// requireRole('admin') on /api/admin/users is the real gate; the 403 card
// below only keeps non-admins from flashing the table before the redirect.
// Ports nuxt-boilerplate `app/pages/admin/users.vue`: search + role
// filters, local edit dialog, delete confirmation with undo toast, dates
// formatted with the i18n locale. Copy comes from the shared admin.* keys.
import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { isPlatformBrowser } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { Title } from '@angular/platform-browser'
import {
  ArrowUpDown,
  Calendar,
  CloudOff,
  LucideAngularModule,
  Pencil,
  RotateCcw,
  Search,
  ShieldAlert,
  Trash2,
  UserX,
} from 'lucide-angular'
import { UiAvatarComponent, UiAvatarFallbackComponent } from '@/app/components/ui/avatar'
import { UiBadgeComponent } from '@/app/components/ui/badge'
import { UiButtonComponent } from '@/app/components/ui/button'
import { UiEmptyStateComponent } from '@/app/components/ui/empty-state'
import { UiCardComponent } from '@/app/components/ui/card'
import {
  UiDialogComponent,
  UiDialogContentComponent,
  UiDialogDescriptionComponent,
  UiDialogFooterComponent,
  UiDialogHeaderComponent,
  UiDialogTitleComponent,
} from '@/app/components/ui/dialog'
import { UiInputComponent } from '@/app/components/ui/input'
import { UiLabelComponent } from '@/app/components/ui/label'
import { UiPageBodyComponent, UiPageComponent, UiPageHeaderComponent, UiPageHeaderHeadingComponent } from '@/app/components/ui/page'
import { UiPopoverComponent, UiPopoverContentComponent, UiPopoverTriggerComponent } from '@/app/components/ui/popover'
import { UiRangeCalendarComponent, type DateRange } from '@/app/components/ui/range-calendar'
import { toast } from '@/app/components/ui/sonner'
import { UiTooltipDirective, UiTooltipProviderComponent } from '@/app/components/ui/tooltip'
import {
  UiSelectComponent,
  UiSelectContentComponent,
  UiSelectItemComponent,
  UiSelectTriggerComponent,
  UiSelectValueComponent,
} from '@/app/components/ui/select'
import {
  UiTableBodyComponent,
  UiTableCellComponent,
  UiTableComponent,
  UiTableHeadComponent,
  UiTableHeaderComponent,
  UiTableRowComponent,
} from '@/app/components/ui/table'
import type { ApiResponse } from '@/app/core/api/api'
import { AuthService } from '@/app/core/auth/auth.service'
import { I18nService } from '@/app/core/i18n'

export interface AdminUser {
  id: number
  login: string
  name: string | null
  role: string
  createdAt: string
}

const ROLES = ['admin', 'editor', 'user'] as const
type AdminSortKey = 'name' | 'role' | 'joined'

export function userInitials(n: string): string {
  return n.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    LucideAngularModule,
    UiAvatarComponent,
    UiAvatarFallbackComponent,
    UiBadgeComponent,
    UiButtonComponent,
    UiEmptyStateComponent,
    UiCardComponent,
    UiDialogComponent,
    UiDialogContentComponent,
    UiDialogDescriptionComponent,
    UiDialogFooterComponent,
    UiDialogHeaderComponent,
    UiDialogTitleComponent,
    UiInputComponent,
    UiLabelComponent,
    UiPageBodyComponent,
    UiPageComponent,
    UiPageHeaderComponent,
    UiPageHeaderHeadingComponent,
    UiPopoverComponent,
    UiPopoverContentComponent,
    UiPopoverTriggerComponent,
    UiRangeCalendarComponent,
    UiSelectComponent,
    UiSelectContentComponent,
    UiSelectItemComponent,
    UiSelectTriggerComponent,
    UiSelectValueComponent,
    UiTableBodyComponent,
    UiTableCellComponent,
    UiTableComponent,
    UiTableHeadComponent,
    UiTableHeaderComponent,
    UiTableRowComponent,
    UiTooltipDirective,
    UiTooltipProviderComponent,
  ],
  template: `
    <ui-page>
      <ui-page-header>
        <ui-page-header-heading [title]="t('nav.items.users')" [description]="description()" />
      </ui-page-header>

      <ui-page-body>
        @if (forbidden()) {
          <ui-card>
            <ui-empty-state
              [icon]="forbiddenIcon"
              role="alert"
              [title]="t('admin.adminsOnly')"
              [description]="forbiddenDescription()"
              class="px-4"
            >
              <ng-template #forbiddenIcon><lucide-icon [img]="ShieldIcon" /></ng-template>
            </ui-empty-state>
          </ui-card>
        } @else if (failed()) {
          <ui-card>
            <ui-empty-state
              [icon]="failedIcon"
              role="alert"
              [title]="t('admin.loadFailedTitle')"
              [description]="t('admin.loadFailed')"
              class="px-4"
            >
              <ng-template #failedIcon><lucide-icon [img]="CloudIcon" /></ng-template>
              <button ui-button variant="outline" size="sm" class="mt-4" (click)="load()">
                {{ t('settings.activity.states.retry') }}
              </button>
            </ui-empty-state>
          </ui-card>
        } @else {
          <ui-card>
            <div class="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center">
              <div class="w-full sm:w-64">
                <ng-template #searchIcon><lucide-icon [img]="SearchIcon" class="size-4" /></ng-template>
                <ui-input
                  size="small"
                  [prefixIcon]="searchIcon"
                  allowClear
                  [value]="search()"
                  (valueChange)="search.set($event)"
                  [placeholder]="t('admin.filters.search')"
                  [aria-label]="t('admin.filters.search')"
                />
              </div>
              <ui-select [value]="roleFilter()" (valueChange)="onRole($event)">
                <button ui-select-trigger size="sm" class="sm:w-36" [attr.aria-label]="t('admin.filters.role')">
                  <ui-select-value [placeholder]="t('admin.filters.allRoles')" />
                </button>
                <ui-select-content>
                  <ui-select-item value="all">{{ t('admin.filters.allRoles') }}</ui-select-item>
                  @for (r of roles; track r) {
                    <ui-select-item [value]="r">{{ roleName(r) }}</ui-select-item>
                  }
                </ui-select-content>
              </ui-select>
              <ui-popover [open]="rangeOpen()" (openChange)="rangeOpen.set($event)">
                <button
                  ui-button
                  ui-popover-trigger
                  variant="outline"
                  size="sm"
                  [class]="'justify-start gap-2 font-normal' + (joinedRange()?.from ? '' : ' text-muted-foreground')"
                >
                  <lucide-icon [img]="CalendarIcon" class="size-4" aria-hidden="true" />
                  {{ rangeLabel() }}
                </button>
                <ui-popover-content align="start" class="w-auto p-0">
                  <ui-range-calendar [selected]="joinedRange()" (select)="onRange($any($event))" />
                </ui-popover-content>
              </ui-popover>
              @if (activeFilters() > 0) {
                <button ui-button variant="ghost" size="sm" class="text-muted-foreground gap-1.5" (click)="resetFilters()">
                  <lucide-icon [img]="ResetIcon" class="size-3.5" aria-hidden="true" />
                  {{ t('admin.filters.reset') }}
                </button>
              }
              <span class="text-muted-foreground text-xs whitespace-nowrap tabular-nums sm:ml-auto">
                {{ t('admin.filters.showing', { shown: filtered().length, total: users().length }) }}
              </span>
            </div>

            <ui-tooltip-provider [delayDuration]="300">
              <ui-table>
                <!-- WHY (Rule64): sticky header matches the data table. -->
                <thead ui-table-header class="bg-background sticky top-0 z-10">
                  <tr ui-table-row>
                    @for (col of sortCols; track col.key) {
                      <th ui-table-head scope="col" [attr.aria-sort]="ariaSort(col.key)">
                        <button
                          type="button"
                          class="hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1 rounded-sm font-medium focus-visible:outline-none focus-visible:ring-2"
                          (click)="toggleSort(col.key)"
                        >
                          {{ t(col.label) }}<lucide-icon
                            [img]="SortIcon"
                            aria-hidden="true"
                            [class]="'size-3 ' + (sortKey() === col.key ? 'text-foreground' : 'text-muted-foreground')"
                          />
                        </button>
                      </th>
                    }
                    <th ui-table-head class="w-24 text-right"><span class="sr-only">{{ t('admin.actions') }}</span></th>
                  </tr>
                </thead>
                <tbody ui-table-body>
                  @if (pending()) {
                    <tr ui-table-row>
                      <td ui-table-cell colspan="4" class="text-muted-foreground text-sm">{{ t('admin.loading') }}</td>
                    </tr>
                  } @else if (filtered().length === 0) {
                    <tr ui-table-row>
                      <td ui-table-cell colspan="4">
                        <ui-empty-state
                          [icon]="emptyIcon"
                          [title]="users().length ? t('admin.noMatchTitle') : t('admin.empty')"
                          [description]="users().length ? t('admin.noMatchDescription') : undefined"
                        >
                          <ng-template #emptyIcon><lucide-icon [img]="EmptyIcon" /></ng-template>
                          @if (activeFilters() > 0) {
                            <button ui-button variant="outline" size="sm" class="mt-4" (click)="resetFilters()">
                              {{ t('admin.filters.reset') }}
                            </button>
                          }
                        </ui-empty-state>
                      </td>
                    </tr>
                  } @else {
                    @for (u of sorted(); track u.id) {
                      <tr ui-table-row>
                        <td ui-table-cell>
                          <div class="flex items-center gap-3">
                            <ui-avatar class="size-8">
                              <ui-avatar-fallback class="bg-muted text-muted-foreground text-xs font-medium">
                                {{ initials(u.name || u.login) }}
                              </ui-avatar-fallback>
                            </ui-avatar>
                            <div>
                              <div class="text-sm font-medium">{{ u.name || u.login }}</div>
                              <div class="text-muted-foreground text-xs">&#64;{{ u.login }}</div>
                            </div>
                          </div>
                        </td>
                        <td ui-table-cell>
                          <ui-badge variant="outline">{{ roleName(u.role) }}</ui-badge>
                        </td>
                        <td ui-table-cell class="text-muted-foreground text-xs tabular-nums">{{ fmtDate(u.createdAt) }}</td>
                        <td ui-table-cell class="text-right">
                          <div class="flex justify-end gap-1">
                            <button
                              ui-button
                              variant="ghost"
                              size="icon"
                              class="text-muted-foreground hover:text-foreground size-8"
                              [uiTooltip]="t('admin.menu.edit')"
                              [attr.aria-label]="t('admin.editFor', { name: u.name || u.login })"
                              (click)="openEdit(u)"
                            >
                              <lucide-icon [img]="EditIcon" class="size-4" />
                            </button>
                            <button
                              ui-button
                              variant="ghost"
                              size="icon"
                              class="text-muted-foreground hover:text-destructive hover:bg-destructive/10 size-8"
                              [uiTooltip]="t('admin.menu.delete')"
                              [attr.aria-label]="t('admin.deleteFor', { name: u.name || u.login })"
                              (click)="deleting.set(u)"
                            >
                              <lucide-icon [img]="TrashIcon" class="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </ui-table>
            </ui-tooltip-provider>
          </ui-card>
        }
      </ui-page-body>

      <ui-dialog [open]="editing() !== null" (openChange)="onEditOpenChange($event)">
        <ui-dialog-content class="sm:max-w-md">
          <ui-dialog-header>
            <ui-dialog-title>{{ t('admin.edit.title') }}</ui-dialog-title>
            <ui-dialog-description>{{ t('admin.edit.description') }}</ui-dialog-description>
          </ui-dialog-header>
          <form id="edit-user-form" (submit)="saveEdit($event)">
            <div class="grid gap-4 py-1">
              <div class="grid gap-2">
                <ui-label htmlFor="edit-name">{{ t('admin.edit.name') }}</ui-label>
                <ui-input id="edit-name" [value]="formName()" (valueChange)="formName.set($event)" autocomplete="off" />
              </div>
              <div class="grid gap-2">
                <ui-label htmlFor="edit-login">{{ t('admin.edit.username') }}</ui-label>
                <ui-input id="edit-login" [value]="formLogin()" (valueChange)="formLogin.set($event)" autocomplete="off" />
              </div>
              <div class="grid gap-2">
                <ui-label htmlFor="edit-role">{{ t('admin.role') }}</ui-label>
                <ui-select [value]="formRole()" (valueChange)="formRole.set($event)">
                  <button ui-select-trigger id="edit-role"><ui-select-value /></button>
                  <ui-select-content>
                    @for (r of roles; track r) {
                      <ui-select-item [value]="r">{{ roleName(r) }}</ui-select-item>
                    }
                  </ui-select-content>
                </ui-select>
              </div>
              @if (formError()) {
                <p class="text-destructive text-sm" role="alert">{{ formError() }}</p>
              }
            </div>
          </form>
          <ui-dialog-footer>
            <button ui-button variant="outline" (click)="editing.set(null)">{{ t('admin.edit.cancel') }}</button>
            <button ui-button type="submit" form="edit-user-form">{{ t('admin.edit.save') }}</button>
          </ui-dialog-footer>
        </ui-dialog-content>
      </ui-dialog>

      <ui-dialog [open]="deleting() !== null" (openChange)="onDeleteOpenChange($event)">
        <ui-dialog-content class="sm:max-w-md">
          <ui-dialog-header>
            <ui-dialog-title>{{ t('admin.delete.title', { name: deleting()?.name || deleting()?.login || '' }) }}</ui-dialog-title>
            <ui-dialog-description>{{ t('admin.delete.description') }}</ui-dialog-description>
          </ui-dialog-header>
          <ui-dialog-footer>
            <button ui-button variant="outline" (click)="deleting.set(null)">{{ t('admin.edit.cancel') }}</button>
            <button ui-button variant="destructive" (click)="confirmDelete()">
              <lucide-icon [img]="TrashIcon" class="size-4" aria-hidden="true" />
              {{ t('admin.delete.confirm') }}
            </button>
          </ui-dialog-footer>
        </ui-dialog-content>
      </ui-dialog>
    </ui-page>
  `,
})
export class AdminUsers {
  private readonly http = inject(HttpClient)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly i18n = inject(I18nService)
  private readonly sessionUser = toSignal(inject(AuthService).user$, { initialValue: null })

  protected readonly ShieldIcon = ShieldAlert
  protected readonly CloudIcon = CloudOff
  protected readonly EmptyIcon = UserX
  protected readonly EditIcon = Pencil
  protected readonly TrashIcon = Trash2
  protected readonly ResetIcon = RotateCcw
  protected readonly SearchIcon = Search
  protected readonly SortIcon = ArrowUpDown
  protected readonly CalendarIcon = Calendar

  protected readonly roles = ROLES
  protected readonly sortCols: { key: AdminSortKey, label: string }[] = [
    { key: 'name', label: 'admin.user' },
    { key: 'role', label: 'admin.role' },
    { key: 'joined', label: 'admin.joined' },
  ]

  protected readonly users = signal<AdminUser[]>([])
  // Starts true on both platforms: SSR renders "Loading users…" (the list is
  // fetched in the browser), never a flash of the "No users yet" empty state.
  protected readonly pending = signal(true)
  protected readonly forbidden = signal(false)
  protected readonly failed = signal(false)

  // WHY (Rule83): the 403 names the current role vs the required admin role
  // and gives a next step, instead of a bare "no permission".
  // Copy getters are methods, not computed(), so a locale switch re-renders them.
  forbiddenDescription(): string {
    const role = this.sessionUser()?.role ?? this.t('admin.roleNames.user')
    return `${this.t('admin.forbidden')} ${this.t('admin.forbiddenRole', { role })} ${this.t('admin.forbiddenHelp')}`
  }

  description(): string {
    return this.forbidden() || this.failed() ? this.t('admin.everyone') : this.t('admin.subtitle', { count: this.users().length })
  }

  // ── Filters ────────────────────────────────────────────────────────────
  protected readonly search = signal('')
  protected readonly roleFilter = signal<'all' | (typeof ROLES)[number]>('all')
  protected readonly joinedRange = signal<DateRange | undefined>(undefined)
  protected readonly rangeOpen = signal(false)

  rangeLabel(): string {
    const r = this.joinedRange()
    if (!r?.from || !r?.to) return this.t('admin.filters.joined')
    const df = new Intl.DateTimeFormat(this.i18n.locale, { month: 'short', day: 'numeric', year: 'numeric' })
    return `${df.format(r.from)} – ${df.format(r.to)}`
  }

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase()
    const r = this.joinedRange()
    const from = r?.from ? r.from.getTime() : null
    // Inclusive end: the whole of the last selected day.
    const to = r?.to ? r.to.getTime() + 86_400_000 - 1 : null
    return this.users().filter((u) => {
      if (this.roleFilter() !== 'all' && u.role !== this.roleFilter()) return false
      if (q && !`${u.name ?? ''} ${u.login}`.toLowerCase().includes(q)) return false
      const joined = new Date(u.createdAt).getTime()
      if (from !== null && joined < from) return false
      if (to !== null && joined > to) return false
      return true
    })
  })

  protected readonly activeFilters = computed(
    () => (this.search().trim() ? 1 : 0) + (this.roleFilter() !== 'all' ? 1 : 0) + (this.joinedRange()?.from ? 1 : 0),
  )

  // WHY (Rule65): client sorting on User / Role / Joined. Default Joined desc
  // (newest first) matches how admins scan this list.
  protected readonly sortKey = signal<AdminSortKey>('joined')
  protected readonly sortDir = signal<'asc' | 'desc'>('desc')

  protected readonly sorted = computed(() => {
    const dir = this.sortDir() === 'asc' ? 1 : -1
    return [...this.filtered()].sort((a, b) => {
      if (this.sortKey() === 'joined') return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
      if (this.sortKey() === 'role') return a.role.localeCompare(b.role) * dir
      return (a.name ?? a.login).localeCompare(b.name ?? b.login) * dir
    })
  })

  // ── Row actions ────────────────────────────────────────────────────────
  protected readonly editing = signal<AdminUser | null>(null)
  protected readonly formName = signal('')
  protected readonly formLogin = signal('')
  protected readonly formRole = signal('user')
  protected readonly formError = signal('')

  protected readonly deleting = signal<AdminUser | null>(null)

  constructor() {
    inject(Title).setTitle(this.t('nav.items.users'))
    this.load()
  }

  t(key: string, params?: Record<string, string | number>): string {
    return this.i18n.t(key, params)
  }

  toggleSort(key: AdminSortKey): void {
    if (this.sortKey() === key) this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc')
    else {
      this.sortKey.set(key)
      this.sortDir.set(key === 'joined' ? 'desc' : 'asc')
    }
  }

  ariaSort(key: AdminSortKey): 'ascending' | 'descending' | 'none' {
    if (this.sortKey() !== key) return 'none'
    return this.sortDir() === 'asc' ? 'ascending' : 'descending'
  }

  onRole(value: string): void {
    this.roleFilter.set(value as 'all' | (typeof ROLES)[number])
  }

  onRange(r: DateRange | undefined): void {
    this.joinedRange.set(r)
    if (r?.from && r?.to) this.rangeOpen.set(false)
  }

  resetFilters(): void {
    this.search.set('')
    this.roleFilter.set('all')
    this.joinedRange.set(undefined)
  }

  initials(n: string): string {
    return userInitials(n)
  }

  roleName(role: string): string {
    return this.t(`admin.roleNames.${role}`)
  }

  fmtDate(d: string): string {
    return new Date(d).toLocaleDateString(this.i18n.locale, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  load(): void {
    if (!this.browser) return
    this.pending.set(true)
    this.forbidden.set(false)
    this.failed.set(false)
    // Boolean flags only: raw fetch errors never reach the UI.
    this.http.get<ApiResponse<AdminUser[]>>('/api/admin/users', { withCredentials: true }).subscribe({
      next: (res) => {
        this.pending.set(false)
        if (res.ok) this.users.set(res.data.map((u) => ({ ...u })))
        else if (res.error.code === 'FORBIDDEN') this.forbidden.set(true)
        else this.failed.set(true)
      },
      error: (err: unknown) => {
        this.pending.set(false)
        const body = (err as { error?: { error?: { code?: string } } }).error?.error
        if (body?.code === 'FORBIDDEN' || (err as { status?: number }).status === 403) this.forbidden.set(true)
        else this.failed.set(true)
      },
    })
  }

  openEdit(u: AdminUser): void {
    this.editing.set(u)
    this.formName.set(u.name ?? '')
    this.formLogin.set(u.login)
    this.formRole.set(u.role)
    this.formError.set('')
  }

  onEditOpenChange(open: boolean): void {
    if (!open) this.editing.set(null)
  }

  saveEdit(event: Event): void {
    event.preventDefault()
    const u = this.editing()
    if (!u) return
    const name = this.formName().trim()
    const login = this.formLogin().trim()
    if (!name || !login) {
      this.formError.set(this.t('admin.edit.required'))
      return
    }
    // Local-only until PATCH /api/admin/users/:id exists.
    this.users.update((list) => list.map((x) => (x.id === u.id ? { ...x, name, login, role: this.formRole() } : x)))
    this.editing.set(null)
    toast.success(this.t('admin.toast.updated', { name }))
  }

  onDeleteOpenChange(open: boolean): void {
    if (!open) this.deleting.set(null)
  }

  confirmDelete(): void {
    const u = this.deleting()
    if (!u) return
    const index = this.users().findIndex((x) => x.id === u.id)
    this.users.update((list) => list.filter((x) => x.id !== u.id))
    this.deleting.set(null)
    const name = u.name || u.login
    toast.success(this.t('admin.toast.deleted', { name }), {
      action: {
        label: this.t('admin.toast.undo'),
        onClick: () => {
          this.users.update((list) => {
            const next = [...list]
            next.splice(Math.min(index, next.length), 0, u)
            return next
          })
          toast(this.t('admin.toast.restored', { name }))
        },
      },
    })
  }
}
