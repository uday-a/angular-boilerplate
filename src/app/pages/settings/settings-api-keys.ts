// Settings → API keys — personal tokens for scripts and integrations.
// Ports nuxt-boilerplate `app/pages/settings/api-keys.vue` 1:1 (see also
// next-boilerplate `settings/api-keys/page.tsx`): create form (name +
// scope + expiry), key table, show-raw-once dialog, and a designed revoke
// confirmation dialog (never window.confirm()). Dates format with the i18n
// locale so SSR and client agree.
import { Component, PLATFORM_ID, inject, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { Title } from '@angular/platform-browser'
import {
  AlertTriangle,
  CircleAlert,
  Check,
  CloudOff,
  Copy,
  KeyRound,
  LoaderCircle,
  LucideAngularModule,
  Plus,
  Trash2,
} from 'lucide-angular'
import { UiBadgeComponent } from '@/app/components/ui/badge'
import { UiButtonComponent } from '@/app/components/ui/button'
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
} from '@/app/components/ui/dialog'
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
import { cn } from '@/app/core/utils/cn'

export interface ApiKeyRow {
  id: number
  name: string
  prefix: string
  scopes: string
  lastUsedAt: string | null
  expiresAt: string | null
  revokedAt: string | null
  createdAt: string
  sample?: boolean
}

export function scopeBadges(scopes: string): string[] {
  return scopes.split(' ').filter(Boolean)
}

@Component({
  selector: 'app-settings-api-keys',
  standalone: true,
  imports: [
    LucideAngularModule,
    UiBadgeComponent,
    UiButtonComponent,
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
      <header class="space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight">API keys</h1>
        <p class="text-muted-foreground text-sm">Personal tokens for scripts and integrations. Keep them secret.</p>
      </header>

      <ui-card>
        <ui-card-header>
          <h2 ui-card-title class="text-base">Create a key</h2>
          <ui-card-description>Name it, pick scopes and an expiry. The full key is shown once.</ui-card-description>
        </ui-card-header>
        <ui-card-content>
          <form class="grid gap-3 sm:grid-cols-[1fr_170px_150px_auto] sm:items-end" (submit)="createKey($event)">
            <div class="grid gap-2">
              <ui-label htmlFor="ak-name">Name</ui-label>
              <ui-input
                id="ak-name"
                [value]="name()"
                (valueChange)="name.set($event)"
                placeholder="CI deploy key"
                maxlength="64"
              />
            </div>
            <div class="grid gap-2">
              <ui-label>Scopes</ui-label>
              <ui-select [value]="scope()" (valueChange)="scope.set($event)">
                <button ui-select-trigger><ui-select-value placeholder="Scopes" /></button>
                <ui-select-content>
                  <ui-select-item value="read">Read only</ui-select-item>
                  <ui-select-item value="read write">Read + write</ui-select-item>
                </ui-select-content>
              </ui-select>
            </div>
            <div class="grid gap-2">
              <ui-label>Expires</ui-label>
              <ui-select [value]="expiry()" (valueChange)="expiry.set($event)">
                <button ui-select-trigger><ui-select-value placeholder="Expiry" /></button>
                <ui-select-content>
                  <ui-select-item value="30">30 days</ui-select-item>
                  <ui-select-item value="90">90 days</ui-select-item>
                  <ui-select-item value="never">Never</ui-select-item>
                </ui-select-content>
              </ui-select>
            </div>
            <button ui-button type="submit" [disabled]="creating() || !name().trim()">
              @if (creating()) {
                <lucide-icon [img]="LoaderIcon" class="size-4 animate-spin" />
                Creating…
              } @else {
                <lucide-icon [img]="PlusIcon" class="size-4" />
                Create key
              }
            </button>
          </form>
          @if (createError()) {
            <div class="text-destructive mt-3 flex items-center gap-2 text-sm">
              <lucide-icon [img]="AlertIcon" class="size-4" />
              {{ createError() }}
            </div>
          }
        </ui-card-content>
      </ui-card>

      <ui-card>
        <ui-card-header>
          <h2 ui-card-title class="text-base">Your keys</h2>
          <ui-card-description>Revoke a key the moment you stop trusting it.</ui-card-description>
        </ui-card-header>
        <ui-card-content>
          @if (fetchFailed()) {
            <div class="flex flex-col items-center gap-2 py-4 text-center" role="alert">
              <lucide-icon [img]="CloudIcon" class="text-muted-foreground size-8" />
              <p class="text-sm font-medium">Couldn’t load API keys</p>
              <p class="text-muted-foreground text-xs">Something went wrong on our side. Please try again.</p>
              <button ui-button variant="outline" size="sm" class="mt-4" (click)="load()">Retry</button>
            </div>
          } @else if (pending()) {
            <div class="text-muted-foreground flex items-center gap-2 py-4 text-sm">
              <lucide-icon [img]="LoaderIcon" class="size-4 animate-spin" />
              Loading keys…
            </div>
          } @else if (keys().length === 0) {
            <div class="flex flex-col items-center gap-2 py-4 text-center">
              <lucide-icon [img]="KeyIcon" class="text-muted-foreground size-8" />
              <p class="text-sm font-medium">No API keys yet</p>
              <p class="text-muted-foreground text-xs">Create your first key above to automate this workspace.</p>
            </div>
          } @else {
            <ui-table>
              <thead ui-table-header>
                <tr ui-table-row>
                  <th ui-table-head scope="col">Name</th>
                  <th ui-table-head scope="col">Key</th>
                  <th ui-table-head scope="col">Scopes</th>
                  <th ui-table-head scope="col" class="tabular-nums">Created</th>
                  <th ui-table-head scope="col" class="tabular-nums">Expires</th>
                  <th ui-table-head scope="col" class="tabular-nums">Last used</th>
                  <th ui-table-head scope="col" class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody ui-table-body>
                @for (k of keys(); track k.id) {
                  <tr ui-table-row [class]="rowClass(k)">
                    <td ui-table-cell class="font-medium">
                      <span class="mr-2">{{ k.name }}</span>
                      @if (k.sample) {
                        <span ui-badge variant="outline">Sample</span>
                      }
                      @if (k.revokedAt) {
                        <span ui-badge variant="secondary">Revoked</span>
                      }
                    </td>
                    <td ui-table-cell><code class="text-muted-foreground font-mono text-xs">{{ k.prefix }}…</code></td>
                    <td ui-table-cell>
                      <div class="flex gap-1">
                        @for (s of badges(k.scopes); track s) {
                          <span ui-badge variant="secondary">{{ s }}</span>
                        }
                      </div>
                    </td>
                    <td ui-table-cell class="text-muted-foreground text-xs tabular-nums">{{ fmtDate(k.createdAt) }}</td>
                    <td ui-table-cell class="text-muted-foreground text-xs tabular-nums">{{ fmtDate(k.expiresAt) }}</td>
                    <td ui-table-cell class="text-muted-foreground text-xs tabular-nums">{{ k.lastUsedAt ? fmtDate(k.lastUsedAt) : 'Never used' }}</td>
                    <td ui-table-cell class="text-right">
                      @if (!k.revokedAt) {
                        <button
                          ui-button
                          variant="ghost"
                          size="icon"
                          [attr.aria-label]="'Revoke key ' + k.name"
                          [disabled]="revokingId() === k.id"
                          (click)="revokeTarget.set(k)"
                        >
                          @if (revokingId() === k.id) {
                            <lucide-icon [img]="LoaderIcon" class="size-4 animate-spin" />
                          } @else {
                            <lucide-icon [img]="TrashIcon" class="text-destructive size-4" />
                          }
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </ui-table>
          }

          @if (actionError()) {
            <div class="text-destructive mt-3 flex items-center gap-2 text-sm">
              <lucide-icon [img]="AlertIcon" class="size-4" />
              {{ actionError() }}
            </div>
          }
        </ui-card-content>
      </ui-card>

      <ui-dialog [open]="showRaw()" (openChange)="onRawOpenChange($event)">
        <ui-dialog-content>
          <ui-dialog-header>
            <ui-dialog-title>Copy your key</ui-dialog-title>
            <ui-dialog-description>This is the only time the full key is displayed.</ui-dialog-description>
          </ui-dialog-header>
          <div class="grid gap-4 py-1">
            <div class="bg-muted flex items-center gap-2 rounded-md border px-3 py-2">
              <code class="flex-1 font-mono text-xs break-all">{{ rawKey() }}</code>
              <button ui-button variant="outline" size="sm" class="shrink-0" (click)="copyRaw()">
                @if (copied()) {
                  <lucide-icon [img]="CheckIcon" class="size-4" />
                  Copied
                } @else {
                  <lucide-icon [img]="CopyIcon" class="size-4" />
                  Copy
                }
              </button>
            </div>
            <div class="border-warning/30 bg-warning/10 text-warning flex items-start gap-2 rounded-md border px-3 py-2">
              <lucide-icon [img]="WarnIcon" class="size-4 shrink-0" />
              <p class="text-xs">
                Store it somewhere safe now — you won’t be able to see it again. Anyone with this key can act as
                you within its scopes.
              </p>
            </div>
          </div>
          <ui-dialog-footer>
            <button ui-button (click)="closeRaw()">Done</button>
          </ui-dialog-footer>
        </ui-dialog-content>
      </ui-dialog>

      <ui-dialog [open]="revokeTarget() !== null" (openChange)="onRevokeOpenChange($event)">
        <ui-dialog-content class="sm:max-w-md">
          <ui-dialog-header>
            <ui-dialog-title>Revoke “{{ revokeTarget()?.name }}”?</ui-dialog-title>
            <ui-dialog-description>Calls using this key will start failing with 401. This can’t be undone.</ui-dialog-description>
          </ui-dialog-header>
          <ui-dialog-footer>
            <button ui-button variant="outline" (click)="revokeTarget.set(null)">Cancel</button>
            <button ui-button variant="destructive" (click)="revokeSelected()">
              <lucide-icon [img]="TrashIcon" class="size-4" />
              Revoke
            </button>
          </ui-dialog-footer>
        </ui-dialog-content>
      </ui-dialog>
    </div>
  `,
})
export class SettingsApiKeys {
  private readonly http = inject(HttpClient)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly i18n = inject(I18nService)

  protected readonly AlertIcon = CircleAlert
  protected readonly CheckIcon = Check
  protected readonly CloudIcon = CloudOff
  protected readonly CopyIcon = Copy
  protected readonly KeyIcon = KeyRound
  protected readonly LoaderIcon = LoaderCircle
  protected readonly PlusIcon = Plus
  protected readonly TrashIcon = Trash2
  protected readonly WarnIcon = AlertTriangle

  protected readonly keys = signal<ApiKeyRow[]>([])
  protected readonly pending = signal(true)
  protected readonly fetchFailed = signal(false)

  protected readonly name = signal('')
  protected readonly scope = signal('read')
  protected readonly expiry = signal('90')
  protected readonly creating = signal(false)
  protected readonly createError = signal<string | null>(null)

  // Show-raw-once dialog state. rawKey lives only in memory and is cleared
  // the moment the dialog closes — refresh the page and it's gone for good.
  protected readonly showRaw = signal(false)
  protected readonly rawKey = signal<string | null>(null)
  protected readonly copied = signal(false)

  // Key awaiting confirmation in the revoke dialog. Same pattern as
  // delete-user: a designed dialog with the consequence spelled out, not
  // window.confirm().
  protected readonly revokeTarget = signal<ApiKeyRow | null>(null)
  protected readonly revokingId = signal<number | null>(null)
  protected readonly actionError = signal<string | null>(null)
  // Demo sample rows are re-served on every fetch — track locally-dismissed
  // ones so a revoke sticks for the session.
  protected readonly dismissedIds = signal<readonly number[]>([])

  constructor() {
    inject(Title).setTitle('API keys · Settings')
    if (this.browser) this.load()
    else this.pending.set(false)
  }

  badges(scopes: string): string[] {
    return scopeBadges(scopes)
  }

  rowClass(k: ApiKeyRow): string {
    return cn(k.revokedAt && 'opacity-60')
  }

  fmtDate(value: string | null): string {
    if (!value) return 'Never'
    return new Date(value).toLocaleDateString(this.i18n.locale, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  load(): void {
    if (!this.browser) return
    this.pending.set(true)
    this.fetchFailed.set(false)
    this.http.get<ApiResponse<{ keys: ApiKeyRow[] }>>('/api/keys', { withCredentials: true }).subscribe({
      next: (res) => {
        this.pending.set(false)
        if (res.ok) this.keys.set(res.data.keys.filter((k) => !this.dismissedIds().includes(k.id)))
        else this.fetchFailed.set(true)
      },
      error: () => {
        this.pending.set(false)
        this.fetchFailed.set(true)
      },
    })
  }

  createKey(event: Event): void {
    event.preventDefault()
    if (!this.browser || !this.name().trim() || this.creating()) return
    this.creating.set(true)
    this.createError.set(null)
    this.http
      .post<ApiResponse<{ key: ApiKeyRow, rawKey: string }>>(
        '/api/keys',
        {
          name: this.name().trim(),
          scopes: this.scope().split(' '),
          ...(this.expiry() === 'never' ? {} : { expiresInDays: Number(this.expiry()) }),
        },
        { withCredentials: true },
      )
      .subscribe({
        next: (res) => {
          this.creating.set(false)
          if (!res.ok) {
            this.createError.set(res.error.message)
            return
          }
          this.rawKey.set(res.data.rawKey)
          this.showRaw.set(true)
          this.copied.set(false)
          this.name.set('')
          this.load()
        },
        error: (err: unknown) => {
          this.creating.set(false)
          this.createError.set(apiErrorMessage(err, 'Failed to create API key'))
        },
      })
  }

  revokeSelected(): void {
    const k = this.revokeTarget()
    if (!this.browser || !k || this.revokingId() !== null) return
    this.revokeTarget.set(null)
    // Sample rows live only in the demo response — dismiss locally.
    if (k.sample) {
      this.dismissedIds.set([...this.dismissedIds(), k.id])
      return
    }
    this.revokingId.set(k.id)
    this.actionError.set(null)
    this.http.delete<ApiResponse<{ revoked: number }>>(`/api/keys/${k.id}`, { withCredentials: true }).subscribe({
      next: (res) => {
        this.revokingId.set(null)
        if (!res.ok) {
          this.actionError.set(res.error.message)
          return
        }
        this.load()
      },
      error: (err: unknown) => {
        this.revokingId.set(null)
        this.actionError.set(apiErrorMessage(err, 'Failed to revoke API key'))
      },
    })
  }

  onRevokeOpenChange(open: boolean): void {
    if (!open) this.revokeTarget.set(null)
  }

  onRawOpenChange(open: boolean): void {
    if (!open) this.closeRaw()
  }

  copyRaw(): void {
    const key = this.rawKey()
    if (!this.browser || !key) return
    const done = (): void => {
      this.copied.set(true)
      setTimeout(() => this.copied.set(false), 2000)
    }
    try {
      const clipboard = (navigator as Navigator & { clipboard?: { writeText(t: string): Promise<void> } }).clipboard
      if (!clipboard) throw new Error('no clipboard')
      void clipboard.writeText(key).then(done, () => this.legacyCopy(key, done))
    } catch {
      this.legacyCopy(key, done)
    }
  }

  private legacyCopy(key: string, done: () => void): void {
    try {
      const ta = document.createElement('textarea')
      ta.value = key
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    } catch {
      /* clipboard unavailable */
    }
    done()
  }

  closeRaw(): void {
    this.showRaw.set(false)
    this.rawKey.set(null)
    this.copied.set(false)
  }
}
