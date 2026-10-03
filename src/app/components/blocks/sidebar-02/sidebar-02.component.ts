import { Component, ChangeDetectionStrategy } from '@angular/core'
import {
  UiSidebarComponent,
  UiSidebarContentComponent,
  UiSidebarFooterComponent,
  UiSidebarHeaderComponent,
  UiSidebarRailComponent,
} from '@/app/components/ui/sidebar/sidebar.component'
import {
  Activity,
  CalendarDays,
  FileText,
  Folder,
  KanbanSquare,
  LayoutDashboard,
  LayoutTemplate,
  LifeBuoy,
  MapPin,
  MessageSquare,
  Send,
  Settings2,
  ShieldCheck,
  Table2,
} from 'lucide-angular'
import { NavMainComponent } from './nav-main.component'
import { NavProjectsComponent } from './nav-projects.component'
import { NavSecondaryComponent } from './nav-secondary.component'
import { NavUserComponent } from './nav-user.component'
import { TeamSwitcherComponent } from './team-switcher.component'
import { UiOverlayScrollComponent } from '@/app/components/ui/overlay-scroll/overlay-scroll.component'
import type { SidebarNavItem, SidebarProject, SidebarUser } from './sidebar-02.models'

const data: {
  user: SidebarUser
  navMain: SidebarNavItem[]
  navSecondary: SidebarNavItem[]
  projects: SidebarProject[]
} = {
  user: {
    name: 'Guest',
    email: '',
  },
  navMain: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Messages', url: '/dashboard/messages', icon: MessageSquare },
    { title: 'Kanban', url: '/dashboard/kanban', icon: KanbanSquare },
    { title: 'Customers', url: '/dashboard/data-table', icon: Table2 },
    { title: 'Calendar', url: '/dashboard/calendar', icon: CalendarDays },
    { title: 'Activity', url: '/dashboard/activity', icon: Activity },
    { title: 'Locations', url: '/dashboard/locations', icon: MapPin },
    { title: 'UI Kit', url: '/dashboard/ui-kit', icon: LayoutTemplate },
    { title: 'Forms', url: '/dashboard/forms', icon: FileText },
    {
      title: 'Settings',
      url: '/settings',
      icon: Settings2,
      items: [
        { title: 'General', url: '/settings/general' },
        { title: 'Account', url: '/settings/account' },
        { title: 'Security', url: '/settings/security' },
        { title: 'API keys', url: '/settings/api-keys' },
        { title: 'Notifications', url: '/settings/notifications' },
        { title: 'Integrations', url: '/settings/integrations' },
        { title: 'Team', url: '/settings/team' },
        { title: 'Activity log', url: '/settings/activity' },
        { title: 'Billing', url: '/settings/billing' },
        { title: 'Limits', url: '/settings/limits' },
      ],
    },
    {
      title: 'Admin',
      url: '/admin/users',
      icon: ShieldCheck,
      items: [
        { title: 'Users', url: '/admin/users' },
        { title: 'Roles & permissions', url: '/admin/roles' },
      ],
    },
  ],
  navSecondary: [
    { title: 'Support', url: '/support', icon: LifeBuoy },
    { title: 'Feedback', url: '/feedback', icon: Send },
  ],
  projects: [
    { name: 'Design Engineering', url: '/projects/design-engineering', icon: Folder },
    { name: 'Sales & Marketing', url: '/projects/sales-marketing', icon: Folder },
    { name: 'Travel', url: '/projects/travel', icon: Folder },
  ],
}

/**
 * Sidebar02 -- the Nuxt block, 1:1: a `collapsible="icon"` Sidebar with TeamSwitcher
 * header, primary nav, projects, secondary links and a user dropdown footer. It reads
 * the surrounding <ui-sidebar-provider> (pair with <ui-sidebar-inset> +
 * <ui-sidebar-trigger>), so the trigger, the rail and Cmd/Ctrl+B all collapse it.
 * Edit `data` to change routes; each section is a sibling file.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-sidebar-02, [ui-sidebar-02]',
  standalone: true,
  // Nuxt renders <Sidebar> itself: keep this wrapper out of the provider's flex layout.
  host: { class: 'contents' },
  imports: [
    UiSidebarComponent,
    UiSidebarHeaderComponent,
    UiSidebarContentComponent,
    UiSidebarFooterComponent,
    UiSidebarRailComponent,
    TeamSwitcherComponent,
    NavMainComponent,
    NavProjectsComponent,
    NavSecondaryComponent,
    NavUserComponent,
    UiOverlayScrollComponent,
  ],
  template: `
    <ui-sidebar collapsible="icon">
      <ui-sidebar-header>
        <team-switcher />
      </ui-sidebar-header>
      <ui-sidebar-content
        data-tour="sidebar-nav"
        class="gap-1 overflow-visible group-data-[collapsible=icon]:overflow-hidden"
      >
        <ui-overlay-scroll class="min-h-0 flex-1">
          <nav aria-label="Sidebar" class="flex min-h-full flex-col gap-2">
            <nav-main [items]="data.navMain" />
            <nav-projects [projects]="data.projects" />
            <nav-secondary [items]="data.navSecondary" class="mt-auto" />
          </nav>
        </ui-overlay-scroll>
      </ui-sidebar-content>
      <ui-sidebar-footer data-tour="profile">
        <nav-user [user]="data.user" />
      </ui-sidebar-footer>
      <button ui-sidebar-rail></button>
    </ui-sidebar>
  `,
})
export class UiSidebar02Component {
  readonly data = data
}
