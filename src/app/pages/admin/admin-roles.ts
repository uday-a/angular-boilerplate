// Admin → Roles — RBAC permission matrix (sample data, no backend).
// Ports nuxt-boilerplate `app/pages/admin/roles.vue` 1:1: grants held as
// Sets per role, `saved` is the baseline we diff against, group checkboxes
// are tri-state, role summary cards highlight their column.
import { Component, computed, inject, signal } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { Lock, LucideAngularModule, Search, ShieldAlert, Users } from 'lucide-angular'
import { UiPageBodyComponent, UiPageComponent, UiPageHeaderComponent, UiPageHeaderHeadingComponent } from '@/app/components/ui/page'
import {
  UiCardComponent,
  UiCardActionComponent,
  cardVariants,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card'
import { UiButtonComponent } from '@/app/components/ui/button'
import { UiEmptyStateComponent } from '@/app/components/ui/empty-state'
import { UiCheckboxComponent, type CheckedState } from '@/app/components/ui/checkbox'
import { UiInputComponent } from '@/app/components/ui/input'
import { UiTooltipComponent, UiTooltipContentComponent, UiTooltipTriggerComponent } from '@/app/components/ui/tooltip'
import { UiDemoDataBannerComponent } from '@/app/components/blocks/demo-data-banner'
import { I18nService } from '@/app/core/i18n'
import { cn } from '@/app/core/utils/cn'
import {
  allPermissionIds,
  defaultGrants,
  permissionGroups,
  roles,
  type RoleId,
} from '@/app/core/rbac/rbac-mock'

function toSets(g: Record<RoleId, string[]>): Record<RoleId, Set<string>> {
  return Object.fromEntries(Object.entries(g).map(([k, v]) => [k, new Set(v)])) as Record<RoleId, Set<string>>
}

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [
    LucideAngularModule,
    UiButtonComponent,
    UiEmptyStateComponent,
    UiCardComponent,
    UiCardActionComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
    UiCheckboxComponent,
    UiDemoDataBannerComponent,
    UiInputComponent,
    UiPageBodyComponent,
    UiPageComponent,
    UiPageHeaderComponent,
    UiPageHeaderHeadingComponent,
    UiTooltipComponent,
    UiTooltipContentComponent,
    UiTooltipTriggerComponent,
  ],
  template: `
    <ui-page>
      <ui-page-header>
        <ui-page-header-heading [title]="t('nav.items.roles')" [description]="t('admin.roles.description')" />
        @if (changeCount() > 0) {
          <span slot="actions" class="text-warning text-xs font-medium tabular-nums">
            {{ i18n.tc('admin.roles.unsaved', changeCount()) }}
          </span>
        } @else if (savedFlash()) {
          <span slot="actions" class="text-success text-xs font-medium">{{ t('admin.roles.saved') }}</span>
        }
        <button slot="actions" ui-button variant="outline" size="sm" [disabled]="changeCount() === 0" (click)="discard()">
          {{ t('admin.roles.discard') }}
        </button>
        <button slot="actions" ui-button size="sm" [disabled]="changeCount() === 0" (click)="save()">
          {{ t('admin.roles.save') }}
        </button>
      </ui-page-header>

      <ui-page-body class="space-y-4">
        <ui-demo-data-banner [message]="t('admin.roles.demo')" />

        <!-- Role summaries: click to highlight that column -->
        <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          @for (role of roles; track role.id) {
            <button
              type="button"
              [attr.aria-pressed]="focusRole() === role.id"
              [class]="roleCardClass(role.id)"
              (click)="focusRole.set(focusRole() === role.id ? null : role.id)"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-sm font-semibold">{{ role.name }}</span>
                @if (role.locked) {
                  <lucide-icon [img]="LockIcon" class="text-muted-foreground size-3.5" [attr.aria-label]="t('admin.roles.locked')" />
                }
              </div>
              <p class="text-muted-foreground mt-1 line-clamp-2 text-xs">{{ role.description }}</p>
              <div class="text-muted-foreground mt-3 flex items-center justify-between text-xs tabular-nums">
                <span class="flex items-center gap-1">
                  <lucide-icon [img]="UsersIcon" class="size-3.5" aria-hidden="true" />
                  {{ i18n.tc('admin.roles.members', role.members) }}
                </span>
                <span><span class="text-foreground font-medium">{{ grantSize(role.id) }}</span>/{{ totalPerms }}</span>
              </div>
              <div class="bg-muted mt-2 h-1 overflow-hidden rounded-full">
                <div
                  class="bg-primary h-full rounded-full transition-[width] duration-200"
                  [style.width.%]="Math.round((grantSize(role.id) / totalPerms) * 100)"
                ></div>
              </div>
            </button>
          }
        </div>

        <!-- Permission matrix -->
        <ui-card class="gap-0 py-0">
          <ui-card-header class="border-b">
            <ui-card-title class="text-base">{{ t('admin.roles.matrix.title') }}</ui-card-title>
            <ui-card-description>{{ t('admin.roles.matrix.description') }}</ui-card-description>
            <ui-card-action>
              <ng-template #searchIcon><lucide-icon [img]="SearchIcon" class="size-4" /></ng-template>
              <ui-input
                size="small"
                [prefixIcon]="searchIcon"
                allowClear
                [value]="search()"
                (valueChange)="search.set($event)"
                [placeholder]="t('admin.roles.matrix.search')"
                [aria-label]="t('admin.roles.matrix.search')"
                class="w-40 sm:w-64"
              />
            </ui-card-action>
          </ui-card-header>
          <ui-card-content class="p-0">
            @if (visibleGroups().length > 0) {
              <div class="max-h-[640px] overflow-auto">
                <table class="w-full min-w-[720px] border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr>
                      <th scope="col" class="bg-card text-muted-foreground sticky top-0 left-0 z-20 border-b px-4 py-2.5 text-left text-xs font-medium tracking-wider uppercase">
                        {{ t('admin.roles.matrix.permission') }}
                      </th>
                      @for (role of roles; track role.id) {
                        <th scope="col" [class]="roleHeadClass(role.id)">
                          <span class="inline-flex items-center gap-1">
                            {{ role.name }}
                            @if (role.locked) {
                              <lucide-icon [img]="LockIcon" class="size-3" aria-hidden="true" />
                            }
                          </span>
                        </th>
                      }
                    </tr>
                  </thead>
                  @for (group of visibleGroups(); track group.id) {
                    <tbody>
                      <!-- Group row: tri-state checkbox per role -->
                      <tr class="bg-muted">
                        <th scope="rowgroup" class="bg-muted sticky left-0 border-b px-4 py-2 text-left text-xs font-semibold">
                          {{ group.label }}
                          <span class="text-muted-foreground ml-1 font-normal">{{ group.permissions.length }}</span>
                        </th>
                        @for (role of roles; track role.id) {
                          <td [class]="'border-b px-2 py-2 text-center' + (focusRole() === role.id ? ' bg-primary/5' : '')">
                            <div class="flex justify-center">
                              <ui-checkbox
                                [checked]="groupState(role.id, permIds(group.permissions))"
                                [disabled]="role.locked"
                                [aria-label]="t('admin.roles.matrix.groupAria', { group: group.label, role: role.name })"
                                (checkedChange)="toggleGroup(role.id, permIds(group.permissions), $event === true)"
                              />
                            </div>
                          </td>
                        }
                      </tr>
                      @for (perm of group.permissions; track perm.id) {
                        <tr class="hover:bg-muted/40 transition-colors">
                          <th scope="row" class="bg-card sticky left-0 border-b px-4 py-2.5 text-left font-normal">
                            <div class="flex items-center gap-1.5">
                              <span class="font-medium">{{ perm.label }}</span>
                              @if (perm.risky) {
                                <ui-tooltip>
                                  <span ui-tooltip-trigger>
                                    <lucide-icon [img]="RiskyIcon" class="text-warning size-3.5" [attr.aria-label]="t('admin.roles.risky')" />
                                  </span>
                                  <ui-tooltip-content>{{ t('admin.roles.riskyHint') }}</ui-tooltip-content>
                                </ui-tooltip>
                              }
                            </div>
                            <div class="text-muted-foreground text-xs">{{ perm.description }}</div>
                          </th>
                          @for (role of roles; track role.id) {
                            <td [class]="roleCellClass(role.id, isChanged(role.id, perm.id))">
                              <div class="flex justify-center">
                                <ui-checkbox
                                  [checked]="has(role.id, perm.id)"
                                  [disabled]="role.locked"
                                  [aria-label]="perm.label + ' — ' + role.name"
                                  (checkedChange)="toggle(role.id, perm.id, $event === true)"
                                />
                              </div>
                            </td>
                          }
                        </tr>
                      }
                    </tbody>
                  }
                </table>
              </div>
            } @else {
              <ui-empty-state
                [icon]="noMatchIcon"
                [title]="t('admin.roles.matrix.emptyTitle')"
                [description]="t('admin.roles.matrix.emptyDescription')"
                class="px-4"
              >
                <ng-template #noMatchIcon><lucide-icon [img]="SearchIcon" /></ng-template>
              </ui-empty-state>
            }
          </ui-card-content>
          <div class="text-muted-foreground flex flex-wrap items-center gap-4 border-t px-4 py-2.5 text-xs">
            <span class="flex items-center gap-1.5">
              <lucide-icon [img]="RiskyIcon" class="text-warning size-3.5" aria-hidden="true" />
              {{ t('admin.roles.legend.risky') }}
            </span>
            <span class="flex items-center gap-1.5">
              <span class="bg-warning/10 border-warning/60 size-3.5 rounded-sm border"></span>
              {{ t('admin.roles.legend.changed') }}
            </span>
            <span class="flex items-center gap-1.5">
              <lucide-icon [img]="LockIcon" class="size-3.5" aria-hidden="true" />
              {{ t('admin.roles.legend.locked') }}
            </span>
          </div>
        </ui-card>
      </ui-page-body>
    </ui-page>
  `,
})
export class AdminRoles {
  protected readonly LockIcon = Lock
  protected readonly UsersIcon = Users
  protected readonly SearchIcon = Search
  protected readonly RiskyIcon = ShieldAlert
  protected readonly Math = Math

  protected readonly roles = roles
  protected readonly totalPerms = allPermissionIds.length
  protected readonly search = signal('')
  protected readonly focusRole = signal<RoleId | null>(null)
  protected readonly savedFlash = signal(false)

  // Grants are held as Sets per role; `saved` is the baseline we diff against.
  private readonly saved = signal(toSets(defaultGrants))
  private readonly grants = signal(toSets(defaultGrants))

  protected readonly changeCount = computed(() =>
    roles.reduce((sum, r) => sum + allPermissionIds.filter((id) => this.isChanged(r.id, id)).length, 0),
  )

  protected readonly visibleGroups = computed(() => {
    const q = this.search().trim().toLowerCase()
    if (!q) return permissionGroups
    return permissionGroups
      .map((g) => ({
        ...g,
        permissions: g.permissions.filter((p) =>
          `${g.label} ${p.label} ${p.description}`.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.permissions.length)
  })

  private flashTimer?: ReturnType<typeof setTimeout>

  protected readonly i18n = inject(I18nService)

  constructor() {
    inject(Title).setTitle('Roles & permissions')
  }

  t(key: string, params?: Record<string, string | number>): string {
    return this.i18n.t(key, params)
  }

  has(role: RoleId, perm: string): boolean {
    return this.grants()[role].has(perm)
  }

  isChanged(role: RoleId, perm: string): boolean {
    return this.has(role, perm) !== this.saved()[role].has(perm)
  }

  grantSize(role: RoleId): number {
    return this.grants()[role].size
  }

  permIds(perms: { id: string }[]): string[] {
    return perms.map((p) => p.id)
  }

  toggle(role: RoleId, perm: string, on: boolean): void {
    const next = new Set(this.grants()[role])
    if (on) next.add(perm)
    else next.delete(perm)
    this.grants.update((g) => ({ ...g, [role]: next }))
  }

  // Group checkbox: checked / indeterminate / unchecked from its permissions.
  groupState(role: RoleId, ids: string[]): CheckedState {
    const n = ids.filter((id) => this.has(role, id)).length
    return n === 0 ? false : n === ids.length ? true : 'indeterminate'
  }

  toggleGroup(role: RoleId, ids: string[], on: boolean): void {
    const next = new Set(this.grants()[role])
    ids.forEach((id) => (on ? next.add(id) : next.delete(id)))
    this.grants.update((g) => ({ ...g, [role]: next }))
  }

  save(): void {
    const snap: Record<RoleId, string[]> = Object.fromEntries(
      roles.map((r) => [r.id, [...this.grants()[r.id]]]),
    ) as Record<RoleId, string[]>
    this.saved.set(toSets(snap))
    this.savedFlash.set(true)
    clearTimeout(this.flashTimer)
    this.flashTimer = setTimeout(() => this.savedFlash.set(false), 2000)
  }

  discard(): void {
    const snap: Record<RoleId, string[]> = Object.fromEntries(
      roles.map((r) => [r.id, [...this.saved()[r.id]]]),
    ) as Record<RoleId, string[]>
    this.grants.set(toSets(snap))
  }

  roleCardClass(role: RoleId): string {
    return cn(
      cardVariants(),
      'focus-visible:ring-ring/50 p-4 text-left focus-visible:ring-[3px] focus-visible:outline-none',
      this.focusRole() === role ? 'border-primary/50 bg-primary/5 ring-1 ring-primary' : 'hover:border-foreground/20',
    )
  }

  roleHeadClass(role: RoleId): string {
    return [
      'sticky top-0 z-10 w-24 border-b px-2 py-2.5 text-center text-xs font-medium',
      this.focusRole() === role ? 'bg-primary/5 text-foreground' : 'bg-card text-muted-foreground',
    ].join(' ')
  }

  roleCellClass(role: RoleId, changed: boolean): string {
    return [
      'border-b px-2 py-2.5 text-center transition-colors',
      changed ? 'bg-warning/10 ring-1 ring-inset ring-warning/60' : this.focusRole() === role ? 'bg-primary/5' : '',
    ]
      .filter(Boolean)
      .join(' ')
  }
}
