import { Component, Input, ChangeDetectionStrategy } from '@angular/core'
import { RouterLink } from '@angular/router'
import { LucideAngularModule } from 'lucide-angular'
import {
  UiSidebarGroupComponent,
  UiSidebarGroupContentComponent,
  UiSidebarMenuButtonComponent,
  UiSidebarMenuComponent,
  UiSidebarMenuItemComponent,
} from '@/app/components/ui/sidebar/sidebar.component'
import type { SidebarNavItem } from './sidebar-02.models'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'nav-secondary',
  standalone: true,
  host: { class: 'contents' },
  imports: [
    LucideAngularModule,
    RouterLink,
    UiSidebarGroupComponent,
    UiSidebarGroupContentComponent,
    UiSidebarMenuComponent,
    UiSidebarMenuItemComponent,
    UiSidebarMenuButtonComponent,
  ],
  template: `
    <ui-sidebar-group [class]="className">
      <ui-sidebar-group-content>
        <ul ui-sidebar-menu>
          @for (item of items; track item.title) {
            <li ui-sidebar-menu-item>
              <a
                ui-sidebar-menu-button
                size="sm"
                [routerLink]="item.url"
                [isActive]="!!item.isActive"
                class="data-[active=true]:bg-sidebar-primary/10 data-[active=true]:text-sidebar-primary dark:data-[active=true]:text-sidebar-foreground data-[active=true]:font-medium data-[active=true]:[&>svg]:text-sidebar-primary dark:data-[active=true]:[&>svg]:text-sidebar-foreground"
              >
                <lucide-icon [img]="item.icon" class="size-4 shrink-0" />
                <span>{{ item.title }}</span>
              </a>
            </li>
          }
        </ul>
      </ui-sidebar-group-content>
    </ui-sidebar-group>
  `,
})
export class NavSecondaryComponent {
  @Input() items: SidebarNavItem[] = []
  /** Forwarded to the SidebarGroup, like Nuxt's fallthrough attrs (e.g. class="mt-auto"). */
  @Input('class') className?: string
}
