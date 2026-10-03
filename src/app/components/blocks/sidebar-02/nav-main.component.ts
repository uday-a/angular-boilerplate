// Sidebar group nav — ports nuxt-boilerplate's `NavMain.vue` 740c76c
// behaviour: groups with children open when one of their pages is active —
// also after client-side navigation, not only on first render — and stay
// user-toggleable. The parent row of a group toggles it instead of
// navigating; only the children are links.
import { Component, Input, ChangeDetectionStrategy, OnChanges, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ChevronRight, LucideAngularModule } from 'lucide-angular'
import {
  UiCollapsibleComponent,
  UiCollapsibleContentComponent,
  UiCollapsibleTriggerComponent,
} from '@/app/components/ui/collapsible/collapsible.component'
import {
  UiSidebarGroupComponent,
  UiSidebarGroupLabelComponent,
  UiSidebarMenuButtonComponent,
  UiSidebarMenuComponent,
  UiSidebarMenuItemComponent,
  UiSidebarMenuSubButtonComponent,
  UiSidebarMenuSubComponent,
  UiSidebarMenuSubItemComponent,
} from '@/app/components/ui/sidebar/sidebar.component'
import type { SidebarNavItem } from './sidebar-02.models'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'nav-main',
  standalone: true,
  host: { class: 'contents' },
  imports: [
    LucideAngularModule,
    RouterLink,
    UiCollapsibleComponent,
    UiCollapsibleTriggerComponent,
    UiCollapsibleContentComponent,
    UiSidebarGroupComponent,
    UiSidebarGroupLabelComponent,
    UiSidebarMenuComponent,
    UiSidebarMenuItemComponent,
    UiSidebarMenuButtonComponent,
    UiSidebarMenuSubComponent,
    UiSidebarMenuSubItemComponent,
    UiSidebarMenuSubButtonComponent,
  ],
  template: `
    <ui-sidebar-group>
      <ui-sidebar-group-label>Platform</ui-sidebar-group-label>
      <ul ui-sidebar-menu>
        @for (item of items; track item.title) {
          @if (item.items?.length) {
            <li ui-sidebar-menu-item ui-collapsible [open]="isOpen(item.title)" (openChange)="setOpen(item.title, $event)">
              <button
                type="button"
                ui-sidebar-menu-button
                ui-collapsible-trigger
                [tooltip]="item.title"
                [isActive]="!!item.isActive"
                class="group/trigger data-[active=true]:text-sidebar-foreground data-[active=true]:font-medium"
              >
                <lucide-icon [img]="item.icon" class="size-4 shrink-0" />
                <span>{{ item.title }}</span>
                <lucide-icon
                  [img]="ChevronRight"
                  class="ml-auto size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/trigger:rotate-90"
                />
              </button>
              <ui-collapsible-content>
                <ul ui-sidebar-menu-sub>
                  @for (subItem of item.items; track subItem.title) {
                    <li ui-sidebar-menu-sub-item>
                      <a
                        ui-sidebar-menu-sub-button
                        [routerLink]="subItem.url"
                        [isActive]="!!subItem.isActive"
                        class="data-[active=true]:bg-sidebar-primary/10 data-[active=true]:text-sidebar-primary dark:data-[active=true]:text-sidebar-foreground data-[active=true]:font-medium"
                      >
                        <span>{{ subItem.title }}</span>
                      </a>
                    </li>
                  }
                </ul>
              </ui-collapsible-content>
            </li>
          } @else {
            <li ui-sidebar-menu-item>
              <a
                ui-sidebar-menu-button
                [routerLink]="item.url"
                [tooltip]="item.title"
                [isActive]="!!item.isActive"
                class="data-[active=true]:bg-sidebar-primary/10 data-[active=true]:text-sidebar-primary dark:data-[active=true]:text-sidebar-foreground data-[active=true]:font-medium data-[active=true]:[&>svg]:text-sidebar-primary dark:data-[active=true]:[&>svg]:text-sidebar-foreground"
              >
                <lucide-icon [img]="item.icon" class="size-4 shrink-0" />
                <span>{{ item.title }}</span>
              </a>
            </li>
          }
        }
      </ul>
    </ui-sidebar-group>
  `,
})
export class NavMainComponent implements OnChanges {
  @Input() items: SidebarNavItem[] = []
  protected readonly ChevronRight = ChevronRight

  /** User-toggled + auto-opened group state, keyed by group title. */
  private readonly openState = signal<Record<string, boolean>>({})

  ngOnChanges(): void {
    for (const item of this.items) {
      if (item.isActive) this.openState.update((s) => ({ ...s, [item.title]: true }))
    }
  }

  isOpen(title: string): boolean {
    return this.openState()[title] ?? false
  }

  setOpen(title: string, open: boolean): void {
    this.openState.update((s) => ({ ...s, [title]: open }))
  }
}
