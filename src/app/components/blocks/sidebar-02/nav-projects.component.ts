import { Component, Input, ChangeDetectionStrategy } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Folder, Forward, LucideAngularModule, MoreHorizontal, Trash2 } from 'lucide-angular'
import {
  UiDropdownMenuComponent,
  UiDropdownMenuContentComponent,
  UiDropdownMenuItemComponent,
  UiDropdownMenuSeparatorComponent,
  UiDropdownMenuTriggerComponent,
} from '@/app/components/ui/dropdown-menu/dropdown-menu.component'
import {
  UiSidebarGroupComponent,
  UiSidebarGroupLabelComponent,
  UiSidebarMenuActionComponent,
  UiSidebarMenuButtonComponent,
  UiSidebarMenuComponent,
  UiSidebarMenuItemComponent,
  injectSidebar,
} from '@/app/components/ui/sidebar/sidebar.component'
import type { SidebarProject } from './sidebar-02.models'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'nav-projects',
  standalone: true,
  host: { class: 'contents' },
  imports: [
    LucideAngularModule,
    RouterLink,
    UiDropdownMenuComponent,
    UiDropdownMenuTriggerComponent,
    UiDropdownMenuContentComponent,
    UiDropdownMenuItemComponent,
    UiDropdownMenuSeparatorComponent,
    UiSidebarGroupComponent,
    UiSidebarGroupLabelComponent,
    UiSidebarMenuComponent,
    UiSidebarMenuItemComponent,
    UiSidebarMenuButtonComponent,
    UiSidebarMenuActionComponent,
  ],
  template: `
    <!--
      Upstream shadcn-vue hides this entire group on icon-mode collapse with
      group-data-[collapsible=icon]:hidden. We keep it visible so the project icons
      stay reachable in the narrow column; the group label and the <span> children
      of each menu button already self-hide on collapse, leaving an icon-only
      column that lines up with NavMain.
    -->
    <ui-sidebar-group>
      <ui-sidebar-group-label>Projects</ui-sidebar-group-label>
      <ul ui-sidebar-menu>
        @for (item of projects; track item.name) {
          <li ui-sidebar-menu-item>
            <a
              ui-sidebar-menu-button
              [routerLink]="item.url"
              [isActive]="!!item.isActive"
              class="data-[active=true]:bg-sidebar-primary/10 data-[active=true]:text-sidebar-primary dark:data-[active=true]:text-sidebar-foreground data-[active=true]:font-medium data-[active=true]:[&>svg]:text-sidebar-primary dark:data-[active=true]:[&>svg]:text-sidebar-foreground"
            >
              <lucide-icon [img]="item.icon" class="size-4 shrink-0" />
              <span>{{ item.name }}</span>
            </a>
            <ui-dropdown-menu>
              <button type="button" ui-sidebar-menu-action ui-dropdown-menu-trigger showOnHover>
                <lucide-icon [img]="MoreHorizontal" class="size-4 shrink-0" />
                <span class="sr-only">More</span>
              </button>
              <ui-dropdown-menu-content
                class="w-48 rounded-lg"
                [side]="sidebar.isMobile ? 'bottom' : 'right'"
                [align]="sidebar.isMobile ? 'end' : 'start'"
              >
                <ui-dropdown-menu-item>
                  <lucide-icon [img]="Folder" class="text-muted-foreground" />
                  <span>View Project</span>
                </ui-dropdown-menu-item>
                <ui-dropdown-menu-item>
                  <lucide-icon [img]="Forward" class="text-muted-foreground" />
                  <span>Share Project</span>
                </ui-dropdown-menu-item>
                <ui-dropdown-menu-separator />
                <ui-dropdown-menu-item>
                  <lucide-icon [img]="Trash2" class="text-muted-foreground" />
                  <span>Delete Project</span>
                </ui-dropdown-menu-item>
              </ui-dropdown-menu-content>
            </ui-dropdown-menu>
          </li>
        }
        <li ui-sidebar-menu-item>
          <button type="button" ui-sidebar-menu-button>
            <lucide-icon [img]="MoreHorizontal" class="size-4 shrink-0" />
            <span>More</span>
          </button>
        </li>
      </ul>
    </ui-sidebar-group>
  `,
})
export class NavProjectsComponent {
  readonly sidebar = injectSidebar()
  @Input() projects: SidebarProject[] = []
  protected readonly MoreHorizontal = MoreHorizontal
  protected readonly Folder = Folder
  protected readonly Forward = Forward
  protected readonly Trash2 = Trash2
}
