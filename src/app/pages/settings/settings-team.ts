// Settings → Team — members, roles, invitations. Ports nuxt-boilerplate
// `app/pages/settings/team.vue`: the roster reads GET /api/team/members,
// pending invites read GET /api/team/invites, invites send via POST
// /api/team/invites (with a client-side email check before the round-trip),
// resend = DELETE the stale row + POST a fresh token, revoke = DELETE
// /api/team/invites/:id. Search / role / joined-range filters, local edit
// and remove (with undo toast) row actions. Dates format with the i18n
// locale so SSR and client agree. Role labels always go through
// admin.roleNames (Member / Editor / Admin), never the raw role id.
import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { isPlatformBrowser } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import {
  Calendar,
  CircleAlert,
  CircleCheck,
  CloudOff,
  LoaderCircle,
  LucideAngularModule,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
  UserPlus,
  UserX,
} from 'lucide-angular'
import { UiAvatarComponent, UiAvatarFallbackComponent } from '@/app/components/ui/avatar'
import { UiBadgeComponent } from '@/app/components/ui/badge'
import { UiButtonComponent } from '@/app/components/ui/button'
import { UiEmptyStateComponent } from '@/app/components/ui/empty-state'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card'
import {
  UiDialogComponent,
  UiDialogContentComponent,
  UiDialogDescriptionComponent,
  UiDialogFooterComponent,
  UiDialogHeaderComponent,
  UiDialogTitleComponent,
  UiDialogTriggerComponent,
} from '@/app/components/ui/dialog'
import { UiInputComponent } from '@/app/components/ui/input'
import { UiLabelComponent } from '@/app/components/ui/label'
import { UiPageBodyComponent, UiPageComponent, UiPageHeaderComponent, UiPageHeaderHeadingComponent } from '@/app/components/ui/page'
import { UiPopoverComponent, UiPopoverContentComponent, UiPopoverTriggerComponent } from '@/app/components/ui/popover'
import { UiRangeCalendarComponent, type DateRange } from '@/app/components/ui/range-calendar'
import {
  UiSelectComponent,
  UiSelectContentComponent,
  UiSelectItemComponent,
  UiSelectTriggerComponent,
  UiSelectValueComponent,
} from '@/app/components/ui/select'
import { toast } from '@/app/components/ui/sonner'
import {
  UiTableBodyComponent,
  UiTableCellComponent,
  UiTableComponent,
  UiTableHeadComponent,
  UiTableHeaderComponent,
  UiTableRowComponent,
} from '@/app/components/ui/table'
import { UiTooltipDirective, UiTooltipProviderComponent } from '@/app/components/ui/tooltip'
import { type ApiResponse, apiErrorMessage } from '@/app/core/api/api'
import { AuthService } from '@/app/core/auth/auth.service'
import { I18nService, injectPageTitle } from '@/app/core/i18n'

export interface TeamMember {
  id: number
  name: string | null
  email: string
  role: string
  createdAt: string
}

export interface PendingInvite {
  id: number
  email: string
  role: string
  expiresAt: string
  createdAt: string
}

const ROLES = ['admin', 'editor', 'user'] as const

// Catch obvious typos before the round-trip; the server still validates.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function memberInitials(name: string): string {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
}

@Component({
  selector: 'app-settings-team',
  standalone: true,
  imports: [
    LucideAngularModule,
    UiAvatarComponent,
    UiAvatarFallbackComponent,
    UiBadgeComponent,
    UiButtonComponent,
    UiEmptyStateComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
    UiDialogComponent,
    UiDialogContentComponent,
    UiDialogDescriptionComponent,
    UiDialogFooterComponent,
    UiDialogHeaderComponent,
    UiDialogTitleComponent,
    UiDialogTriggerComponent,
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
        <ui-page-header-heading [title]="pageTitle()" [description]="headerDescription()" />
        @if (canInvite() && !invitesForbidden()) {
          <div slot="actions">
            <ui-dialog [open]="dialogOpen()" (openChange)="dialogOpen.set($event)">
              <button ui-button ui-dialog-trigger size="sm">
                <lucide-icon [img]="InviteIcon" class="size-4" aria-hidden="true" /> {{ t('settings.team.invite') }}
              </button>
              <ui-dialog-content>
                <ui-dialog-header>
                  <ui-dialog-title>{{ t('settings.team.dialogTitle') }}</ui-dialog-title>
                  <ui-dialog-description>{{ t('settings.team.dialogDescription') }}</ui-dialog-description>
                </ui-dialog-header>
                <div class="grid gap-4 py-1">
                  <div class="grid gap-2">
                    <ui-label htmlFor="invite-email">{{ t('settings.team.emailLabel') }}</ui-label>
                    <ui-input
                      id="invite-email"
                      type="email"
                      [value]="inviteEmail()"
                      (valueChange)="inviteEmail.set($event)"
                      [placeholder]="t('settings.team.emailPlaceholder')"
                    />
                  </div>
                  <div class="grid gap-2">
                    <ui-label htmlFor="invite-role">{{ t('settings.team.roleLabel') }}</ui-label>
                    <ui-select [value]="inviteRole()" (valueChange)="inviteRole.set($event)">
                      <button ui-select-trigger id="invite-role"><ui-select-value /></button>
                      <ui-select-content>
                        @for (r of inviteRoles; track r) {
                          <ui-select-item [value]="r">{{ roleName(r) }}</ui-select-item>
                        }
                      </ui-select-content>
                    </ui-select>
                  </div>
                  @if (submitError()) {
                    <div class="text-destructive flex items-center gap-2 text-sm">
                      <lucide-icon [img]="AlertIcon" class="size-4" aria-hidden="true" />
                      {{ submitError() }}
                    </div>
                  }
                </div>
                <ui-dialog-footer>
                  <button ui-button variant="outline" [disabled]="submitState() === 'submitting'" (click)="dialogOpen.set(false)">
                    {{ t('settings.team.cancel') }}
                  </button>
                  <button ui-button [disabled]="submitState() === 'submitting' || !inviteEmail()" (click)="sendInvite()">
                    @if (submitState() === 'submitting') {
                      <lucide-icon [img]="LoaderIcon" class="size-4 animate-spin" />
                    }
                    {{ submitState() === 'submitting' ? t('settings.team.sending') : t('settings.team.send') }}
                  </button>
                </ui-dialog-footer>
              </ui-dialog-content>
            </ui-dialog>
          </div>
        }
      </ui-page-header>

      <ui-page-body class="space-y-4">
        @if (notice()) {
          <div
            class="border-success/30 bg-success/10 text-success flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            role="status"
          >
            <lucide-icon [img]="SuccessIcon" class="size-4" aria-hidden="true" />
            {{ notice() }}
          </div>
        }

        @if (membersFailed()) {
          <ui-card>
            <ui-empty-state
              [icon]="membersFailedIcon"
              role="alert"
              title="Couldn't load the team"
              [description]="t('settings.team.loadFailed')"
            >
              <ng-template #membersFailedIcon><lucide-icon [img]="CloudIcon" /></ng-template>
              <button ui-button variant="outline" size="sm" class="mt-4" (click)="loadMembers()">
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
                  [value]="query()"
                  (valueChange)="query.set($event)"
                  [placeholder]="t('settings.team.search')"
                  [aria-label]="t('settings.team.search')"
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
                {{ t('admin.filters.showing', { shown: filteredMembers().length, total: members().length }) }}
              </span>
            </div>

            <ui-tooltip-provider [delayDuration]="300">
              <ui-table>
                <thead ui-table-header>
                  <tr ui-table-row>
                    <th ui-table-head>{{ t('settings.team.member') }}</th>
                    <th ui-table-head>{{ t('settings.team.role') }}</th>
                    <th ui-table-head>{{ t('settings.team.status') }}</th>
                    <th ui-table-head>{{ t('settings.team.joined') }}</th>
                    <th ui-table-head class="w-24 text-right"><span class="sr-only">{{ t('admin.actions') }}</span></th>
                  </tr>
                </thead>
                <tbody ui-table-body>
                  @if (membersPending()) {
                    <tr ui-table-row>
                      <td ui-table-cell colspan="5" class="text-muted-foreground text-sm">{{ t('settings.team.loading') }}</td>
                    </tr>
                  } @else if (filteredMembers().length === 0) {
                    <tr ui-table-row>
                      <td ui-table-cell colspan="5">
                        <ui-empty-state
                          [icon]="emptyIcon"
                          [title]="members().length ? t('admin.noMatchTitle') : t('settings.team.emptyMembers')"
                          [description]="members().length ? t('admin.noMatchDescription') : undefined"
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
                    @for (m of filteredMembers(); track m.id) {
                      <tr ui-table-row>
                        <td ui-table-cell>
                          <div class="flex items-center gap-3">
                            <ui-avatar class="size-8">
                              <ui-avatar-fallback class="bg-muted text-muted-foreground text-xs font-medium">
                                {{ initials(displayName(m)) }}
                              </ui-avatar-fallback>
                            </ui-avatar>
                            <div>
                              <div class="text-sm font-medium">{{ displayName(m) }}</div>
                              <div class="text-muted-foreground text-xs">{{ m.email }}</div>
                            </div>
                          </div>
                        </td>
                        <td ui-table-cell>
                          <ui-badge variant="outline">{{ roleName(m.role) }}</ui-badge>
                        </td>
                        <td ui-table-cell>
                          <span class="flex items-center gap-1.5 text-xs">
                            <span class="bg-success size-1.5 rounded-full" aria-hidden="true"></span>
                            {{ t('settings.team.active') }}
                          </span>
                        </td>
                        <td ui-table-cell class="text-muted-foreground text-xs tabular-nums">{{ fmtDate(m.createdAt) }}</td>
                        <td ui-table-cell class="text-right">
                          <div class="flex justify-end gap-1">
                            <button
                              ui-button
                              variant="ghost"
                              size="icon"
                              class="text-muted-foreground hover:text-foreground size-8"
                              [uiTooltip]="t('admin.menu.edit')"
                              [attr.aria-label]="t('admin.editFor', { name: displayName(m) })"
                              (click)="openEdit(m)"
                            >
                              <lucide-icon [img]="EditIcon" class="size-4" />
                            </button>
                            <button
                              ui-button
                              variant="ghost"
                              size="icon"
                              class="text-muted-foreground hover:text-destructive hover:bg-destructive/10 size-8"
                              [uiTooltip]="t('settings.team.remove')"
                              [attr.aria-label]="t('settings.team.removeFor', { name: displayName(m) })"
                              (click)="removing.set(m)"
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

        @if (canInvite() && !invitesForbidden()) {
          <ui-card>
            <ui-card-header>
              <h3 ui-card-title class="text-base">{{ t('settings.team.pendingTitle') }}</h3>
              <ui-card-description>{{ t('settings.team.pendingDescription') }}</ui-card-description>
            </ui-card-header>
            <ui-card-content class="divide-y">
              @if (invitesFailed()) {
                <div class="flex flex-wrap items-center justify-between gap-4 py-3 first:pt-0">
                  <span class="text-muted-foreground text-sm">Couldn't load pending invites.</span>
                  <button ui-button variant="outline" size="sm" (click)="loadInvites()">{{ t('settings.activity.states.retry') }}</button>
                </div>
              } @else if (invitesPending()) {
                <div class="text-muted-foreground py-3 text-sm first:pt-0">{{ t('settings.team.loading') }}</div>
              } @else if (invites().length === 0) {
                <div class="text-muted-foreground py-3 text-sm first:pt-0">{{ t('settings.team.emptyPending') }}</div>
              } @else {
                @for (p of invites(); track p.id) {
                  <!-- flex-wrap: the Resend / Revoke pair drops below the email at 375px instead of overflowing. -->
                  <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0">
                    <div class="min-w-0 space-y-0.5">
                      <p class="truncate text-sm font-medium">{{ p.email }}</p>
                      <p class="text-muted-foreground text-xs tabular-nums">
                        {{ t('settings.team.invitedAs', { role: roleName(p.role) }) }} · {{ t('settings.team.expires', { date: fmtDate(p.expiresAt) }) }}
                      </p>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        ui-button
                        variant="outline"
                        size="sm"
                        [disabled]="resendingEmail() === p.email || revokingId() === p.id"
                        (click)="resendInvite(p)"
                      >
                        @if (resendingEmail() === p.email) {
                          <lucide-icon [img]="LoaderIcon" class="size-4 animate-spin" aria-hidden="true" />
                        }
                        {{ t('settings.team.resend') }}
                      </button>
                      <button
                        ui-button
                        variant="ghost"
                        size="sm"
                        class="text-destructive"
                        [disabled]="revokingId() === p.id || resendingEmail() === p.email"
                        (click)="revokeInvite(p.id)"
                      >
                        @if (revokingId() === p.id) {
                          <lucide-icon [img]="LoaderIcon" class="size-4 animate-spin" aria-hidden="true" />
                        }
                        {{ t('settings.team.revoke') }}
                      </button>
                    </div>
                  </div>
                }
              }
              @if (revokeError()) {
                <div class="text-destructive flex items-center gap-2 pt-3 text-sm" role="alert">
                  <lucide-icon [img]="AlertIcon" class="size-4" aria-hidden="true" />
                  {{ revokeError() }}
                </div>
              }
            </ui-card-content>
          </ui-card>
        } @else {
          <p class="text-muted-foreground text-xs">{{ t('settings.team.viewerNote') }}</p>
        }
      </ui-page-body>

      <ui-dialog [open]="editing() !== null" (openChange)="$event || editing.set(null)">
        <ui-dialog-content class="sm:max-w-md">
          <ui-dialog-header>
            <ui-dialog-title>{{ t('settings.team.editTitle') }}</ui-dialog-title>
            <ui-dialog-description>{{ t('settings.team.editDescription') }}</ui-dialog-description>
          </ui-dialog-header>
          <form id="edit-member-form" novalidate (submit)="saveEdit($event)">
            <div class="grid gap-4 py-1">
              <div class="grid gap-2">
                <ui-label htmlFor="edit-member-name">{{ t('admin.edit.name') }}</ui-label>
                <ui-input id="edit-member-name" [value]="editName()" (valueChange)="editName.set($event)" autocomplete="off" />
              </div>
              <div class="grid gap-2">
                <ui-label htmlFor="edit-member-email">{{ t('settings.team.emailLabel') }}</ui-label>
                <ui-input id="edit-member-email" type="email" [value]="editEmail()" (valueChange)="editEmail.set($event)" autocomplete="off" />
              </div>
              <div class="grid gap-2">
                <ui-label htmlFor="edit-member-role">{{ t('settings.team.role') }}</ui-label>
                <ui-select [value]="editRole()" (valueChange)="editRole.set($event)">
                  <button ui-select-trigger id="edit-member-role"><ui-select-value /></button>
                  <ui-select-content>
                    @for (r of roles; track r) {
                      <ui-select-item [value]="r">{{ roleName(r) }}</ui-select-item>
                    }
                  </ui-select-content>
                </ui-select>
              </div>
              @if (editError()) {
                <p class="text-destructive text-sm" role="alert">{{ editError() }}</p>
              }
            </div>
          </form>
          <ui-dialog-footer>
            <button ui-button variant="outline" (click)="editing.set(null)">{{ t('admin.edit.cancel') }}</button>
            <button ui-button type="submit" form="edit-member-form">{{ t('admin.edit.save') }}</button>
          </ui-dialog-footer>
        </ui-dialog-content>
      </ui-dialog>

      <ui-dialog [open]="removing() !== null" (openChange)="$event || removing.set(null)">
        <ui-dialog-content class="sm:max-w-md">
          <ui-dialog-header>
            <ui-dialog-title>{{ t('settings.team.removeTitle', { name: removingName() }) }}</ui-dialog-title>
            <ui-dialog-description>{{ t('settings.team.removeDescription') }}</ui-dialog-description>
          </ui-dialog-header>
          <ui-dialog-footer>
            <button ui-button variant="outline" (click)="removing.set(null)">{{ t('admin.edit.cancel') }}</button>
            <button ui-button variant="destructive" (click)="confirmRemove()">
              <lucide-icon [img]="TrashIcon" class="size-4" aria-hidden="true" />
              {{ t('settings.team.remove') }}
            </button>
          </ui-dialog-footer>
        </ui-dialog-content>
      </ui-dialog>
    </ui-page>
  `,
})
export class SettingsTeam {
  private readonly http = inject(HttpClient)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly i18n = inject(I18nService)
  private readonly sessionUser = toSignal(inject(AuthService).user$, { initialValue: null })
  protected readonly pageTitle = injectPageTitle()

  protected readonly InviteIcon = UserPlus
  protected readonly SearchIcon = Search
  protected readonly LoaderIcon = LoaderCircle
  protected readonly CloudIcon = CloudOff
  protected readonly AlertIcon = CircleAlert
  protected readonly SuccessIcon = CircleCheck
  protected readonly CalendarIcon = Calendar
  protected readonly EditIcon = Pencil
  protected readonly ResetIcon = RotateCcw
  protected readonly TrashIcon = Trash2
  protected readonly EmptyIcon = UserX

  protected readonly roles = ROLES
  // Invite select lists the least-privileged role first (the default).
  protected readonly inviteRoles = ['user', 'editor', 'admin'] as const

  protected readonly canInvite = computed(() => ['admin', 'editor'].includes(this.sessionUser()?.role ?? ''))

  protected readonly members = signal<TeamMember[]>([])
  // Starts true on both platforms: SSR renders "Loading team…", never a
  // flash of the empty state.
  protected readonly membersPending = signal(true)
  protected readonly membersFailed = signal(false)

  protected readonly invites = signal<PendingInvite[]>([])
  protected readonly invitesPending = signal(true)
  // A 403 on the invites endpoint just means the viewer isn't admin/editor —
  // not a failure. Show the viewer note instead of an error banner.
  protected readonly invitesForbidden = signal(false)
  protected readonly invitesFailed = signal(false)
  protected readonly revokingId = signal<number | null>(null)
  protected readonly resendingEmail = signal<string | null>(null)
  protected readonly revokeError = signal<string | null>(null)
  protected readonly notice = signal<string | null>(null)

  protected readonly dialogOpen = signal(false)
  protected readonly inviteEmail = signal('')
  protected readonly inviteRole = signal('user')
  protected readonly submitState = signal<'idle' | 'submitting' | 'error'>('idle')
  protected readonly submitError = signal<string | null>(null)

  // ── Filters ────────────────────────────────────────────────────────────
  protected readonly query = signal('')
  protected readonly roleFilter = signal<'all' | (typeof ROLES)[number]>('all')
  protected readonly joinedRange = signal<DateRange | undefined>(undefined)
  protected readonly rangeOpen = signal(false)

  protected readonly filteredMembers = computed(() => {
    const q = this.query().trim().toLowerCase()
    const r = this.joinedRange()
    const from = r?.from ? r.from.getTime() : null
    // Inclusive end: the whole of the last selected day.
    const to = r?.to ? r.to.getTime() + 86_400_000 - 1 : null
    return this.members().filter((m) => {
      if (this.roleFilter() !== 'all' && m.role !== this.roleFilter()) return false
      if (q && !`${m.name ?? ''} ${m.email}`.toLowerCase().includes(q)) return false
      const joined = new Date(m.createdAt).getTime()
      if (from !== null && joined < from) return false
      if (to !== null && joined > to) return false
      return true
    })
  })

  protected readonly activeFilters = computed(
    () => (this.query().trim() ? 1 : 0) + (this.roleFilter() !== 'all' ? 1 : 0) + (this.joinedRange()?.from ? 1 : 0),
  )

  // ── Row actions (local until PATCH / DELETE /api/team/members/:id) ─────
  protected readonly editing = signal<TeamMember | null>(null)
  protected readonly editName = signal('')
  protected readonly editEmail = signal('')
  protected readonly editRole = signal('user')
  protected readonly editError = signal('')
  protected readonly removing = signal<TeamMember | null>(null)

  constructor() {
    if (!this.browser) return
    this.loadMembers()
    this.loadInvites()
  }

  // Copy getters are methods reading lang(), so a locale switch re-renders them.
  t(key: string, params?: Record<string, string | number>): string {
    this.i18n.lang()
    return this.i18n.t(key, params)
  }

  headerDescription(): string {
    if (this.membersFailed()) return 'Members, roles, and pending invitations.'
    if (this.invitesForbidden() || this.invitesFailed()) return `${this.members().length} members`
    return this.t('settings.team.subtitle', { members: this.members().length, pending: this.invites().length })
  }

  rangeLabel(): string {
    const r = this.joinedRange()
    if (!r?.from || !r?.to) return this.t('admin.filters.joined')
    const df = new Intl.DateTimeFormat(this.i18n.lang(), { month: 'short', day: 'numeric', year: 'numeric' })
    return `${df.format(r.from)} – ${df.format(r.to)}`
  }

  removingName(): string {
    const m = this.removing()
    return m ? this.displayName(m) : ''
  }

  onRole(value: string): void {
    this.roleFilter.set(value as 'all' | (typeof ROLES)[number])
  }

  onRange(r: DateRange | undefined): void {
    this.joinedRange.set(r)
    if (r?.from && r?.to) this.rangeOpen.set(false)
  }

  resetFilters(): void {
    this.query.set('')
    this.roleFilter.set('all')
    this.joinedRange.set(undefined)
  }

  displayName(m: TeamMember): string {
    return m.name || m.email.split('@')[0] || m.email
  }

  initials(name: string): string {
    return memberInitials(name)
  }

  roleName(role: string): string {
    return this.t(`admin.roleNames.${role}`)
  }

  fmtDate(value: string): string {
    return new Date(value).toLocaleDateString(this.i18n.lang(), { month: 'short', day: 'numeric', year: 'numeric' })
  }

  openEdit(m: TeamMember): void {
    this.editing.set(m)
    this.editName.set(m.name ?? '')
    this.editEmail.set(m.email)
    this.editRole.set(m.role)
    this.editError.set('')
  }

  saveEdit(event: Event): void {
    event.preventDefault()
    const m = this.editing()
    if (!m) return
    const name = this.editName().trim()
    const email = this.editEmail().trim()
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
      this.editError.set(this.t('settings.team.editInvalid'))
      return
    }
    const updated = { ...m, name, email, role: this.editRole() }
    this.members.update(list => list.map(x => (x.id === m.id ? updated : x)))
    this.editing.set(null)
    toast.success(this.t('admin.toast.updated', { name: this.displayName(updated) }))
  }

  confirmRemove(): void {
    const m = this.removing()
    if (!m) return
    const index = this.members().findIndex(x => x.id === m.id)
    this.members.update(list => list.filter(x => x.id !== m.id))
    this.removing.set(null)
    const name = this.displayName(m)
    toast.success(this.t('settings.team.removed', { name }), {
      action: {
        label: this.t('admin.toast.undo'),
        onClick: () => {
          this.members.update((list) => {
            const next = [...list]
            next.splice(Math.min(index, next.length), 0, m)
            return next
          })
          toast(this.t('admin.toast.restored', { name }))
        },
      },
    })
  }

  loadMembers(): void {
    if (!this.browser) return
    this.membersPending.set(true)
    this.membersFailed.set(false)
    // Boolean flags only: raw fetch errors never reach the UI.
    this.http.get<ApiResponse<{ members: TeamMember[] }>>('/api/team/members', { withCredentials: true }).subscribe({
      next: (res) => {
        this.membersPending.set(false)
        if (res.ok) this.members.set(res.data.members.map(m => ({ ...m })))
        else this.membersFailed.set(true)
      },
      error: () => {
        this.membersPending.set(false)
        this.membersFailed.set(true)
      },
    })
  }

  loadInvites(): void {
    if (!this.browser) return
    this.invitesPending.set(true)
    this.invitesFailed.set(false)
    this.invitesForbidden.set(false)
    this.http.get<ApiResponse<{ invites: PendingInvite[] }>>('/api/team/invites', { withCredentials: true }).subscribe({
      next: (res) => {
        this.invitesPending.set(false)
        if (res.ok) this.invites.set(res.data.invites)
        else if (res.error.code === 'FORBIDDEN') this.invitesForbidden.set(true)
        else this.invitesFailed.set(true)
      },
      error: (err: unknown) => {
        this.invitesPending.set(false)
        if ((err as { status?: number }).status === 403) this.invitesForbidden.set(true)
        else this.invitesFailed.set(true)
      },
    })
  }

  sendInvite(): void {
    if (!this.browser || this.submitState() === 'submitting') return
    if (!EMAIL_RE.test(this.inviteEmail().trim())) {
      this.submitError.set(this.t('settings.team.invalidEmail'))
      this.submitState.set('error')
      return
    }
    this.submitState.set('submitting')
    this.submitError.set(null)
    this.http
      .post<ApiResponse<{ invite: PendingInvite }>>(
        '/api/team/invites',
        { email: this.inviteEmail().trim(), role: this.inviteRole() },
        { withCredentials: true },
      )
      .subscribe({
        next: (res) => {
          if (!res.ok) {
            this.submitError.set(res.error.message)
            this.submitState.set('error')
            return
          }
          this.inviteEmail.set('')
          this.inviteRole.set('user')
          this.submitState.set('idle')
          this.dialogOpen.set(false)
          this.notice.set(this.t('settings.team.inviteSent', { email: res.data.invite.email }))
          this.loadInvites()
        },
        error: (err: unknown) => {
          this.submitError.set(apiErrorMessage(err, this.t('settings.team.inviteFailed')))
          this.submitState.set('error')
        },
      })
  }

  revokeInvite(id: number): void {
    if (!this.browser) return
    this.revokingId.set(id)
    this.notice.set(null)
    this.http
      .delete<ApiResponse<{ revoked: number }>>(`/api/team/invites/${id}`, { withCredentials: true })
      .subscribe({
        next: (res) => {
          this.revokingId.set(null)
          if (!res.ok) {
            this.revokeError.set(res.error.message)
            return
          }
          this.revokeError.set(null)
          this.loadInvites()
        },
        error: (err: unknown) => {
          this.revokingId.set(null)
          this.revokeError.set(apiErrorMessage(err, this.t('settings.team.revokeFailed')))
        },
      })
  }

  // Resend = revoke the stale row, then issue a fresh token via POST, so a
  // given email never stacks duplicate pending rows.
  resendInvite(invite: PendingInvite): void {
    if (!this.browser || this.resendingEmail() !== null) return
    this.resendingEmail.set(invite.email)
    this.notice.set(null)
    this.revokeError.set(null)
    this.http
      .delete<ApiResponse<{ revoked: number }>>(`/api/team/invites/${invite.id}`, { withCredentials: true })
      .subscribe({
        next: () => this.issueFreshInvite(invite),
        error: () => this.issueFreshInvite(invite),
      })
  }

  private issueFreshInvite(invite: PendingInvite): void {
    this.http
      .post<ApiResponse<{ invite: PendingInvite }>>(
        '/api/team/invites',
        { email: invite.email, role: invite.role },
        { withCredentials: true },
      )
      .subscribe({
        next: (res) => {
          this.resendingEmail.set(null)
          if (!res.ok) {
            this.revokeError.set(res.error.message)
            this.loadInvites()
            return
          }
          this.notice.set(this.t('settings.team.inviteSent', { email: invite.email }))
          this.loadInvites()
        },
        error: (err: unknown) => {
          this.resendingEmail.set(null)
          this.revokeError.set(apiErrorMessage(err, this.t('settings.team.inviteFailed')))
          this.loadInvites()
        },
      })
  }
}
