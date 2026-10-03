// Edit teams + activeTeam below to match your tenant model. The dropdown
// is the full team switcher pattern -- avatar tile, label, kbd shortcut,
// and a "Add team" footer row. Wire the select handler to your tenant API.

import { Component, signal, ChangeDetectionStrategy } from '@angular/core'
import { AudioWaveform, Check, ChevronsUpDown, Command, LucideAngularModule, Plus } from 'lucide-angular'
import {
  UiDropdownMenuComponent,
  UiDropdownMenuContentComponent,
  UiDropdownMenuItemComponent,
  UiDropdownMenuLabelComponent,
  UiDropdownMenuSeparatorComponent,
  UiDropdownMenuShortcutComponent,
  UiDropdownMenuTriggerComponent,
} from '@/app/components/ui/dropdown-menu/dropdown-menu.component'
import {
  UiSidebarMenuButtonComponent,
  UiSidebarMenuComponent,
  UiSidebarMenuItemComponent,
  injectSidebar,
} from '@/app/components/ui/sidebar/sidebar.component'
import type { SidebarTeam } from './sidebar-02.models'

const teams: SidebarTeam[] = [
  { name: 'UIPKGE', logo: 'uipkge', plan: 'Angular' },
  { name: 'Globex', logo: AudioWaveform, plan: 'Startup' },
  { name: 'Initech', logo: Command, plan: 'Free' },
]

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'team-switcher',
  standalone: true,
  host: { class: 'contents' },
  imports: [
    LucideAngularModule,
    UiSidebarMenuComponent,
    UiSidebarMenuItemComponent,
    UiSidebarMenuButtonComponent,
    UiDropdownMenuComponent,
    UiDropdownMenuTriggerComponent,
    UiDropdownMenuContentComponent,
    UiDropdownMenuItemComponent,
    UiDropdownMenuLabelComponent,
    UiDropdownMenuSeparatorComponent,
    UiDropdownMenuShortcutComponent,
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
            <div
              class="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg group-data-[collapsible=icon]:size-6"
            >
              @if (activeTeam().logo === 'uipkge') {
                <svg
                  viewBox="0 0 32 32"
                  class="size-8 group-data-[collapsible=icon]:size-6"
                  aria-hidden="true"
                >
                  <rect x="0.5" y="0.5" width="31" height="31" rx="7" class="fill-card stroke-border" stroke-width="1" />
                  <rect x="6" y="6" width="8" height="8" rx="1.6" class="fill-foreground" />
                  <rect x="18" y="6" width="8" height="8" rx="1.6" class="fill-primary" />
                  <rect x="6" y="18" width="8" height="8" rx="1.6" class="fill-muted-foreground/35" />
                  <rect x="18" y="18" width="8" height="8" rx="1.6" class="fill-foreground" />
                </svg>
              } @else {
                <lucide-icon [img]="$any(activeTeam().logo)" class="size-8 group-data-[collapsible=icon]:size-6" />
              }
            </div>
            <div class="flex flex-1 flex-col justify-center gap-0.5 text-left min-w-0 group-data-[collapsible=icon]:hidden">
              <span class="truncate font-semibold text-sm leading-none tracking-tight" [title]="activeTeam().name">{{ activeTeam().name }}</span>
              <span class="truncate text-xs text-muted-foreground leading-none" [title]="activeTeam().plan">{{ activeTeam().plan }}</span>
            </div>
            <lucide-icon [img]="ChevronsUpDown" class="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
          </button>
          <ui-dropdown-menu-content
            class="w-(--reka-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            [side]="sidebar.isMobile ? 'bottom' : 'right'"
            align="start"
            [sideOffset]="4"
          >
            <ui-dropdown-menu-label class="text-muted-foreground text-xs">Teams</ui-dropdown-menu-label>
            @for (team of teams; track team.name; let i = $index) {
              <ui-dropdown-menu-item class="gap-2 p-2" (select)="activeTeam.set(team)">
                <div class="flex size-6 items-center justify-center rounded-sm border p-0.5">
                  @if (team.logo === 'uipkge') {
                    <svg viewBox="0 0 32 32" class="size-full shrink-0" aria-hidden="true">
                      <rect x="0.5" y="0.5" width="31" height="31" rx="7" class="fill-card stroke-border" stroke-width="1" />
                      <rect x="6" y="6" width="8" height="8" rx="1.6" class="fill-foreground" />
                      <rect x="18" y="6" width="8" height="8" rx="1.6" class="fill-primary" />
                      <rect x="6" y="18" width="8" height="8" rx="1.6" class="fill-muted-foreground/35" />
                      <rect x="18" y="18" width="8" height="8" rx="1.6" class="fill-foreground" />
                    </svg>
                  } @else {
                    <lucide-icon [img]="$any(team.logo)" class="size-full shrink-0" />
                  }
                </div>
                {{ team.name }}
                @if (activeTeam() === team) {
                  <lucide-icon [img]="Check" class="ml-auto size-4" />
                } @else {
                  <ui-dropdown-menu-shortcut>⌘{{ i + 1 }}</ui-dropdown-menu-shortcut>
                }
              </ui-dropdown-menu-item>
            }
            <ui-dropdown-menu-separator />
            <ui-dropdown-menu-item class="gap-2 p-2">
              <div class="bg-background flex size-6 items-center justify-center rounded-md border">
                <lucide-icon [img]="Plus" class="size-4" />
              </div>
              <div class="text-muted-foreground font-medium">Add team</div>
            </ui-dropdown-menu-item>
          </ui-dropdown-menu-content>
        </ui-dropdown-menu>
      </li>
    </ul>
  `,
})
export class TeamSwitcherComponent {
  readonly sidebar = injectSidebar()
  readonly teams = teams
  readonly activeTeam = signal<SidebarTeam>(teams[0]!)
  protected readonly ChevronsUpDown = ChevronsUpDown
  protected readonly Check = Check
  protected readonly Plus = Plus
}
