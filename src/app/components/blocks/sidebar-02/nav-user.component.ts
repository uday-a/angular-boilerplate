import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core'
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  LucideAngularModule,
  Monitor,
  Moon,
  Palette,
  Sparkles,
  Sun,
} from 'lucide-angular'
import { injectTheme, type Theme } from '@/app/core/theme/theme.service'
import {
  UiAvatarComponent,
  UiAvatarFallbackComponent,
  UiAvatarImageComponent,
} from '@/app/components/ui/avatar/avatar.component'
import {
  UiDropdownMenuComponent,
  UiDropdownMenuContentComponent,
  UiDropdownMenuGroupComponent,
  UiDropdownMenuItemComponent,
  UiDropdownMenuLabelComponent,
  UiDropdownMenuRadioGroupComponent,
  UiDropdownMenuRadioItemComponent,
  UiDropdownMenuSeparatorComponent,
  UiDropdownMenuSubComponent,
  UiDropdownMenuSubContentComponent,
  UiDropdownMenuSubTriggerComponent,
  UiDropdownMenuTriggerComponent,
} from '@/app/components/ui/dropdown-menu/dropdown-menu.component'
import {
  UiSidebarMenuButtonComponent,
  UiSidebarMenuComponent,
  UiSidebarMenuItemComponent,
  injectSidebar,
} from '@/app/components/ui/sidebar/sidebar.component'
import type { SidebarUser } from './sidebar-02.models'

export type SidebarTheme = Theme

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'nav-user',
  standalone: true,
  host: { class: 'contents' },
  imports: [
    LucideAngularModule,
    UiAvatarComponent,
    UiAvatarFallbackComponent,
    UiAvatarImageComponent,
    UiDropdownMenuComponent,
    UiDropdownMenuTriggerComponent,
    UiDropdownMenuContentComponent,
    UiDropdownMenuGroupComponent,
    UiDropdownMenuItemComponent,
    UiDropdownMenuLabelComponent,
    UiDropdownMenuRadioGroupComponent,
    UiDropdownMenuRadioItemComponent,
    UiDropdownMenuSeparatorComponent,
    UiDropdownMenuSubComponent,
    UiDropdownMenuSubTriggerComponent,
    UiDropdownMenuSubContentComponent,
    UiSidebarMenuComponent,
    UiSidebarMenuItemComponent,
    UiSidebarMenuButtonComponent,
  ],
  template: `
    <ul ui-sidebar-menu>
      <li ui-sidebar-menu-item>
        <ui-dropdown-menu>
          <button
            type="button"
            ui-sidebar-menu-button
            ui-dropdown-menu-trigger
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:!justify-center"
          >
            <ui-avatar class="size-8 shrink-0 rounded-lg group-data-[collapsible=icon]:size-6">
              @if (user.avatar) {
                <ui-avatar-image [src]="user.avatar" [alt]="user.name" />
              }
              <ui-avatar-fallback class="rounded-lg text-xs group-data-[collapsible=icon]:text-xs">{{ initials }}</ui-avatar-fallback>
            </ui-avatar>
            <div class="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span class="truncate font-medium" [title]="user.name">{{ user.name }}</span>
              <span class="truncate text-xs" [title]="user.email">{{ user.email }}</span>
            </div>
            <lucide-icon [img]="ChevronsUpDown" class="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
          </button>
          <ui-dropdown-menu-content
            class="w-(--reka-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            [side]="sidebar.isMobile ? 'bottom' : 'right'"
            align="end"
            [sideOffset]="4"
          >
            <ui-dropdown-menu-label class="p-0 font-normal">
              <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <ui-avatar class="size-8 rounded-lg">
                  @if (user.avatar) {
                    <ui-avatar-image [src]="user.avatar" [alt]="user.name" />
                  }
                  <ui-avatar-fallback class="rounded-lg text-xs">{{ initials }}</ui-avatar-fallback>
                </ui-avatar>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold" [title]="user.name">{{ user.name }}</span>
                  <span class="truncate text-xs" [title]="user.email">{{ user.email }}</span>
                </div>
              </div>
            </ui-dropdown-menu-label>
            <ui-dropdown-menu-separator />
            <ui-dropdown-menu-group>
              <ui-dropdown-menu-item>
                <lucide-icon [img]="Sparkles" />
                Upgrade to Pro
              </ui-dropdown-menu-item>
            </ui-dropdown-menu-group>
            <ui-dropdown-menu-separator />
            <ui-dropdown-menu-group>
              <ui-dropdown-menu-item (click)="profileSelect.emit('account')">
                <lucide-icon [img]="BadgeCheck" />
                Account
              </ui-dropdown-menu-item>
              <ui-dropdown-menu-item (click)="profileSelect.emit('billing')">
                <lucide-icon [img]="CreditCard" />
                Billing
              </ui-dropdown-menu-item>
              <ui-dropdown-menu-item (click)="profileSelect.emit('notifications')">
                <lucide-icon [img]="Bell" />
                Notifications
              </ui-dropdown-menu-item>
            </ui-dropdown-menu-group>
            <ui-dropdown-menu-separator />
            <ui-dropdown-menu-sub>
              <ui-dropdown-menu-sub-trigger>
                <lucide-icon [img]="Palette" />
                Theme
                <span class="text-muted-foreground ml-auto text-xs capitalize">{{ theme.theme() }}</span>
              </ui-dropdown-menu-sub-trigger>
              <ui-dropdown-menu-sub-content class="min-w-36">
                <ui-dropdown-menu-radio-group [value]="theme.theme()" (valueChange)="theme.setTheme($any($event))">
                  <ui-dropdown-menu-radio-item value="light">
                    <lucide-icon [img]="Sun" /> Light
                  </ui-dropdown-menu-radio-item>
                  <ui-dropdown-menu-radio-item value="dark">
                    <lucide-icon [img]="Moon" /> Dark
                  </ui-dropdown-menu-radio-item>
                  <ui-dropdown-menu-radio-item value="system">
                    <lucide-icon [img]="Monitor" /> System
                  </ui-dropdown-menu-radio-item>
                </ui-dropdown-menu-radio-group>
              </ui-dropdown-menu-sub-content>
            </ui-dropdown-menu-sub>
            <ui-dropdown-menu-separator />
            <ui-dropdown-menu-item (click)="logout.emit()">
              <lucide-icon [img]="LogOut" />
              Log out
            </ui-dropdown-menu-item>
          </ui-dropdown-menu-content>
        </ui-dropdown-menu>
      </li>
    </ul>
  `,
})
export class NavUserComponent {
  readonly sidebar = injectSidebar()
  readonly theme = injectTheme()
  @Input() user: SidebarUser = { name: '', email: '' }
  @Output() profileSelect = new EventEmitter<string>()
  @Output() logout = new EventEmitter<void>()

  get initials(): string {
    const parts = this.user.name.trim().split(/\s+/).slice(0, 2)
    return parts.map((p) => p[0]?.toUpperCase()).join('') || 'U'
  }

  protected readonly ChevronsUpDown = ChevronsUpDown
  protected readonly Sparkles = Sparkles
  protected readonly BadgeCheck = BadgeCheck
  protected readonly CreditCard = CreditCard
  protected readonly Bell = Bell
  protected readonly Palette = Palette
  protected readonly Sun = Sun
  protected readonly Moon = Moon
  protected readonly Monitor = Monitor
  protected readonly LogOut = LogOut
}
