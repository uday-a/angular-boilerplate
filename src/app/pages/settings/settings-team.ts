// Settings → Team — members, roles, invitations. Ports nuxt-boilerplate
// `app/pages/settings/team.vue`: the roster reads GET /api/team/members,
// pending invites read GET /api/team/invites, invites send via POST
// /api/team/invites (with a client-side email check before the round-trip),
// resend = DELETE the stale row + POST a fresh token, revoke = DELETE
// /api/team/invites/:id. Dates format with the i18n locale so SSR and
// client agree.
import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { Title } from '@angular/platform-browser'
import {
  CloudOff,
  Ellipsis,
  LoaderCircle,
  LucideAngularModule,
  Mail,
  Search,
  UserPlus,
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
import {
  UiDropdownMenuComponent,
  UiDropdownMenuContentComponent,
  UiDropdownMenuItemComponent,
  UiDropdownMenuTriggerComponent,
} from '@/app/components/ui/dropdown-menu'
import { UiInputComponent } from '@/app/components/ui/input'
import { UiLabelComponent } from '@/app/components/ui/label'
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
import { type ApiResponse, apiErrorMessage } from '@/app/core/api/api'
import { I18nService } from '@/app/core/i18n'

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

// Catch obvious typos before the round-trip; the server still validates.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function memberInitials(name: string): string {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
}

/** Display name for a team role id (`user` renders as "Member", matching Nuxt `admin.roleNames`). */
export function roleDisplayName(role: string): string {
  const names: Record<string, string> = { admin: 'Admin', editor: 'Editor', user: 'Member' }
  return names[role] ?? role
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
    UiDropdownMenuComponent,
    UiDropdownMenuContentComponent,
    UiDropdownMenuItemComponent,
    UiDropdownMenuTriggerComponent,
    UiInputComponent,
    UiLabelComponent,
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
  ],
  template: `
    <div class="space-y-4">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div class="space-y-1">
          <h1 class="text-2xl font-semibold tracking-tight">Team</h1>
          <p class="text-muted-foreground text-sm">{{ headerLine() }}</p>
        </div>
        <ui-dialog [open]="dialogOpen()" (openChange)="dialogOpen.set($event)">
          <button ui-button ui-dialog-trigger class="gap-2">
            <lucide-icon [img]="InviteIcon" class="size-4" /> Invite member
          </button>
          <ui-dialog-content class="sm:max-w-md">
            <ui-dialog-header>
              <ui-dialog-title>Invite a teammate</ui-dialog-title>
              <ui-dialog-description>They’ll get an email with a link to join.</ui-dialog-description>
            </ui-dialog-header>
            <div class="grid gap-4 py-1">
              <div class="grid gap-2">
                <ui-label htmlFor="invite-email">Email</ui-label>
                <ui-input
                  id="invite-email"
                  type="email"
                  [value]="inviteEmail()"
                  (valueChange)="inviteEmail.set($event)"
                  placeholder="teammate@company.com"
                  autocomplete="off"
                />
              </div>
              <div class="grid gap-2">
                <ui-label>Role</ui-label>
                <ui-select [value]="inviteRole()" (valueChange)="inviteRole.set($event)">
                  <button ui-select-trigger><ui-select-value placeholder="Role" /></button>
                  <ui-select-content>
                    <ui-select-item value="admin">Admin</ui-select-item>
                    <ui-select-item value="editor">Editor</ui-select-item>
                    <ui-select-item value="user">Member</ui-select-item>
                  </ui-select-content>
                </ui-select>
              </div>
              @if (submitError()) {
                <p class="text-destructive text-sm" role="alert">{{ submitError() }}</p>
              }
            </div>
            <ui-dialog-footer>
              <button ui-button variant="outline" (click)="dialogOpen.set(false)">Cancel</button>
              <button ui-button [disabled]="submitState() === 'submitting' || !inviteEmail()" (click)="sendInvite()">
                @if (submitState() === 'submitting') {
                  <lucide-icon [img]="LoaderIcon" class="size-4 animate-spin" />
                  Sending…
                } @else {
                  Send invite
                }
              </button>
            </ui-dialog-footer>
          </ui-dialog-content>
        </ui-dialog>
      </header>

      @if (notice()) {
        <div class="border-success/30 bg-success/10 text-success rounded-md border px-3 py-2 text-sm">
          {{ notice() }}
        </div>
      }

      <div class="flex items-center gap-2">
        <div class="relative flex-1 max-w-sm">
          <lucide-icon
            [img]="SearchIcon"
            class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
          />
          <ui-input
            [value]="search()"
            (valueChange)="search.set($event)"
            placeholder="Search by name or email…"
            class="pl-8 h-9"
          />
        </div>
      </div>

      <ui-card>
        @if (membersPending()) {
          <div class="text-muted-foreground flex items-center gap-2 px-4 py-4 text-sm">
            <lucide-icon [img]="LoaderIcon" class="size-4 animate-spin" />
            Loading members…
          </div>
        } @else if (membersFailed()) {
          <ui-empty-state
            [icon]="membersFailedIcon"
            role="alert"
            title="Couldn’t load members"
            description="Something went wrong on our side. Please try again."
            class="px-4"
          >
            <ng-template #membersFailedIcon><lucide-icon [img]="CloudIcon" /></ng-template>
            <button ui-button variant="outline" size="sm" class="mt-4" (click)="loadMembers()">Retry</button>
          </ui-empty-state>
        } @else {
          <ui-table>
            <thead ui-table-header>
              <tr ui-table-row>
                <th ui-table-head>Member</th>
                <th ui-table-head>Role</th>
                <th ui-table-head>Joined</th>
                <th ui-table-head class="w-[40px]"></th>
              </tr>
            </thead>
            <tbody ui-table-body>
              @for (m of visibleMembers(); track m.id) {
                <tr ui-table-row>
                  <td ui-table-cell>
                    <div class="flex items-center gap-3">
                      <ui-avatar class="size-8">
                        <ui-avatar-fallback class="bg-muted text-muted-foreground text-xs font-medium">
                          {{ initials(m.name || m.email) }}
                        </ui-avatar-fallback>
                      </ui-avatar>
                      <div>
                        <p class="text-sm font-medium">{{ m.name || m.email }}</p>
                        <p class="text-muted-foreground text-xs">{{ m.email }}</p>
                      </div>
                    </div>
                  </td>
                  <td ui-table-cell>
                    <ui-badge variant="outline">{{ roleName(m.role) }}</ui-badge>
                  </td>
                  <td ui-table-cell class="text-muted-foreground text-xs tabular-nums">{{ fmtDate(m.createdAt) }}</td>
                  <td ui-table-cell>
                    <ui-dropdown-menu>
                      <button ui-button ui-dropdown-menu-trigger variant="ghost" size="icon" class="size-7">
                        <lucide-icon [img]="MoreIcon" class="size-3.5" />
                      </button>
                      <ui-dropdown-menu-content align="end">
                        <ui-dropdown-menu-item>Change role…</ui-dropdown-menu-item>
                        <ui-dropdown-menu-item>View activity</ui-dropdown-menu-item>
                        <ui-dropdown-menu-item class="text-destructive">Remove from workspace</ui-dropdown-menu-item>
                      </ui-dropdown-menu-content>
                    </ui-dropdown-menu>
                  </td>
                </tr>
              }
            </tbody>
          </ui-table>
        }
      </ui-card>

      <ui-card>
        <ui-card-header>
          <ui-card-title class="text-base flex items-center gap-2">
            <lucide-icon [img]="MailIcon" class="size-4" /> Pending invites
          </ui-card-title>
          <ui-card-description>Resend or revoke invitations that haven’t been accepted yet.</ui-card-description>
        </ui-card-header>
        <ui-card-content class="divide-y">
          @if (invitesPending()) {
            <div class="text-muted-foreground flex items-center gap-2 py-2 text-sm">
              <lucide-icon [img]="LoaderIcon" class="size-4 animate-spin" />
              Loading invites…
            </div>
          } @else if (invites().length === 0) {
            <p class="text-muted-foreground py-2 text-sm">No pending invites. Everyone’s in.</p>
          } @else {
            @for (p of invites(); track p.id) {
              <div class="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div class="space-y-0.5">
                  <p class="text-sm font-medium">{{ p.email }}</p>
                  <p class="text-muted-foreground text-xs">Invited as {{ roleName(p.role) }} · Expires {{ fmtDate(p.expiresAt) }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    ui-button
                    variant="outline"
                    size="sm"
                    [disabled]="resendingEmail() === p.email"
                    (click)="resendInvite(p)"
                  >
                    @if (resendingEmail() === p.email) {
                      <lucide-icon [img]="LoaderIcon" class="size-3.5 animate-spin" />
                    }
                    Resend
                  </button>
                  <button ui-button variant="ghost" size="sm" class="text-destructive" (click)="revokeInvite(p)">
                    Revoke
                  </button>
                </div>
              </div>
            }
          }
          @if (inviteActionError()) {
            <p class="text-destructive pt-2 text-sm" role="alert">{{ inviteActionError() }}</p>
          }
        </ui-card-content>
      </ui-card>
    </div>
  `,
})
export class SettingsTeam {
  private readonly http = inject(HttpClient)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly i18n = inject(I18nService)

  protected readonly InviteIcon = UserPlus
  protected readonly SearchIcon = Search
  protected readonly MoreIcon = Ellipsis
  protected readonly MailIcon = Mail
  protected readonly LoaderIcon = LoaderCircle
  protected readonly CloudIcon = CloudOff

  protected readonly members = signal<TeamMember[]>([])
  protected readonly membersPending = signal(true)
  protected readonly membersFailed = signal(false)
  protected readonly search = signal('')

  protected readonly invites = signal<PendingInvite[]>([])
  protected readonly invitesPending = signal(true)
  protected readonly inviteActionError = signal<string | null>(null)
  protected readonly resendingEmail = signal<string | null>(null)
  protected readonly notice = signal<string | null>(null)

  protected readonly dialogOpen = signal(false)
  protected readonly inviteEmail = signal('')
  protected readonly inviteRole = signal('user')
  protected readonly submitState = signal<'idle' | 'submitting' | 'error'>('idle')
  protected readonly submitError = signal<string | null>(null)

  protected readonly visibleMembers = computed(() => {
    const q = this.search().trim().toLowerCase()
    if (!q) return this.members()
    return this.members().filter((m) => `${m.name ?? ''} ${m.email}`.toLowerCase().includes(q))
  })

  protected readonly headerLine = computed(() => {
    const owners = this.members().filter((m) => m.role === 'owner' || m.role === 'admin').length
    return `${this.members().length} members · ${this.invites().length} pending invites · ${owners} admin${owners === 1 ? '' : 's'}`
  })

  constructor() {
    inject(Title).setTitle('Team · Settings')
    if (!this.browser) {
      this.membersPending.set(false)
      this.invitesPending.set(false)
      return
    }
    this.loadMembers()
    this.loadInvites()
  }

  initials(name: string): string {
    return memberInitials(name)
  }

  roleName(role: string): string {
    return roleDisplayName(role)
  }

  fmtDate(value: string): string {
    return new Date(value).toLocaleDateString(this.i18n.locale, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  loadMembers(): void {
    if (!this.browser) return
    this.membersPending.set(true)
    this.membersFailed.set(false)
    this.http.get<ApiResponse<{ members: TeamMember[] }>>('/api/team/members', { withCredentials: true }).subscribe({
      next: (res) => {
        this.membersPending.set(false)
        if (res.ok) this.members.set(res.data.members)
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
    this.http.get<ApiResponse<{ invites: PendingInvite[] }>>('/api/team/invites', { withCredentials: true }).subscribe({
      next: (res) => {
        this.invitesPending.set(false)
        if (res.ok) this.invites.set(res.data.invites)
      },
      error: () => {
        this.invitesPending.set(false)
      },
    })
  }

  sendInvite(): void {
    if (!this.browser || this.submitState() === 'submitting') return
    if (!EMAIL_RE.test(this.inviteEmail().trim())) {
      this.submitError.set('Enter a valid email address, like name@company.com.')
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
          this.notice.set(`Invite sent to ${res.data.invite.email}.`)
          this.loadInvites()
        },
        error: (err: unknown) => {
          this.submitError.set(apiErrorMessage(err, 'Failed to send invite'))
          this.submitState.set('error')
        },
      })
  }

  revokeInvite(invite: PendingInvite): void {
    if (!this.browser) return
    this.inviteActionError.set(null)
    this.http
      .delete<ApiResponse<{ revoked: number }>>(`/api/team/invites/${invite.id}`, { withCredentials: true })
      .subscribe({
        next: (res) => {
          if (!res.ok) {
            this.inviteActionError.set(res.error.message)
            return
          }
          this.loadInvites()
        },
        error: (err: unknown) => {
          this.inviteActionError.set(apiErrorMessage(err, 'Failed to revoke invite'))
        },
      })
  }

  // Resend = revoke the stale row, then issue a fresh token via POST, so a
  // given email never stacks duplicate pending rows.
  resendInvite(invite: PendingInvite): void {
    if (!this.browser || this.resendingEmail() !== null) return
    this.resendingEmail.set(invite.email)
    this.notice.set(null)
    this.inviteActionError.set(null)
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
            this.inviteActionError.set(res.error.message)
            this.loadInvites()
            return
          }
          this.notice.set(`Invite sent to ${invite.email}.`)
          this.loadInvites()
        },
        error: (err: unknown) => {
          this.resendingEmail.set(null)
          this.inviteActionError.set(apiErrorMessage(err, 'Failed to resend invite'))
          this.loadInvites()
        },
      })
  }
}
