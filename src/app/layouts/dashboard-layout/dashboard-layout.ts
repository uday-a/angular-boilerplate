// Dashboard shell — collapsible sidebar-02 family + sticky topbar (trigger,
// breadcrumb, GitHub badge, command palette, theme switch, notifications) +
// router outlet. Ports nuxt-boilerplate's DashboardLayout.vue + sidebar-02/
// Sidebar02.vue to Angular standalone + signals.
//
// Nav titles are `nav.items.*` keys, translated per render (and on locale
// switch) like Nuxt's t('nav.items.*').
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router'
import { filter } from 'rxjs'
import {
  Activity,
  Bell,
  CalendarDays,
  FileText,
  Folder,
  KanbanSquare,
  LayoutDashboard,
  LayoutTemplate,
  LifeBuoy,
  LucideAngularModule,
  MapPin,
  MessageSquare,
  Send,
  Settings2,
  ShieldCheck,
  Table2,
} from 'lucide-angular'
import { AuthService } from '@/app/core/auth/auth.service'
import { I18nService, PageTitleState } from '@/app/core/i18n'
import { ThemeService, type Theme } from '@/app/core/theme/theme.service'
import { routeLabel } from '@/app/core/dashboard/breadcrumb-labels'
import { isNavItemActive } from '@/app/core/dashboard/nav-active'
import { UiBreadcrumbItemComponent, UiBreadcrumbLinkComponent, UiBreadcrumbListComponent, UiBreadcrumbPageComponent, UiBreadcrumbSeparatorComponent, UiBreadcrumbComponent } from '@/app/components/ui/breadcrumb/breadcrumb.component'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import { UiSeparatorComponent } from '@/app/components/ui/separator/separator.component'
import {
  UiSidebarComponent,
  UiSidebarContentComponent,
  UiSidebarFooterComponent,
  UiSidebarHeaderComponent,
  UiSidebarInsetComponent,
  UiSidebarProviderComponent,
  UiSidebarRailComponent,
  UiSidebarTriggerComponent,
} from '@/app/components/ui/sidebar/sidebar.component'
import { UiThemeSwitchComponent, type Theme as SwitchTheme } from '@/app/components/ui/theme-switch/theme-switch.component'
import { UiOverlayScrollComponent } from '@/app/components/ui/overlay-scroll/overlay-scroll.component'
import { NavMainComponent } from '@/app/components/blocks/sidebar-02/nav-main.component'
import { NavProjectsComponent } from '@/app/components/blocks/sidebar-02/nav-projects.component'
import { NavSecondaryComponent } from '@/app/components/blocks/sidebar-02/nav-secondary.component'
import { NavUserComponent } from '@/app/components/blocks/sidebar-02/nav-user.component'
import { TeamSwitcherComponent } from '@/app/components/blocks/sidebar-02/team-switcher.component'
import { UiCommandPaletteComponent, type CommandPaletteItem } from '@/app/components/blocks/command-palette/command-palette.component'
import { UiLocaleSwitcherComponent } from '@/app/components/blocks/locale-switcher/locale-switcher.component'
import { UiNotificationsPopoverComponent } from '@/app/components/blocks/notifications-popover/notifications-popover.component'
import { UiThemeCustomizerComponent } from '@/app/components/blocks/theme-customizer'
import type { SidebarNavItem, SidebarProject } from '@/app/components/blocks/sidebar-02/sidebar-02.models'

const NAV_MAIN: Omit<SidebarNavItem, 'isActive'>[] = [
  { title: 'nav.items.dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'nav.items.messages', url: '/dashboard/messages', icon: MessageSquare },
  { title: 'nav.items.kanban', url: '/dashboard/kanban', icon: KanbanSquare },
  { title: 'nav.items.dataTable', url: '/dashboard/data-table', icon: Table2 },
  { title: 'nav.items.calendar', url: '/dashboard/calendar', icon: CalendarDays },
  { title: 'nav.items.activity', url: '/dashboard/activity', icon: Activity },
  { title: 'nav.items.locations', url: '/dashboard/locations', icon: MapPin },
  { title: 'nav.items.uiKit', url: '/dashboard/ui-kit', icon: LayoutTemplate },
  { title: 'nav.items.forms', url: '/dashboard/forms', icon: FileText },
  {
    title: 'nav.items.settings',
    url: '/settings',
    icon: Settings2,
    items: [
      { title: 'nav.items.general', url: '/settings/general' },
      { title: 'nav.items.account', url: '/settings/account' },
      { title: 'nav.items.security', url: '/settings/security' },
      { title: 'nav.items.apiKeys', url: '/settings/api-keys' },
      { title: 'nav.items.notifications', url: '/settings/notifications' },
      { title: 'nav.items.integrations', url: '/settings/integrations' },
      { title: 'nav.items.team', url: '/settings/team' },
      { title: 'nav.items.activityLog', url: '/settings/activity' },
      { title: 'nav.items.billing', url: '/settings/billing' },
      { title: 'nav.items.limits', url: '/settings/limits' },
    ],
  },
]

// Admin group (role-gated in navMain).
const NAV_ADMIN: Omit<SidebarNavItem, 'isActive'> = {
  title: 'nav.items.admin',
  url: '/admin/users',
  icon: ShieldCheck,
  items: [
    { title: 'nav.items.users', url: '/admin/users' },
    { title: 'nav.items.roles', url: '/admin/roles' },
  ],
}

const NAV_SECONDARY: Omit<SidebarNavItem, 'isActive'>[] = [
  { title: 'nav.items.support', url: '/support', icon: LifeBuoy },
  { title: 'nav.items.feedback', url: '/feedback', icon: Send },
]

const PROJECTS: SidebarProject[] = [
  { name: 'Design Engineering', url: '/projects/design-engineering', icon: Folder },
  { name: 'Sales & Marketing', url: '/projects/sales-marketing', icon: Folder },
  { name: 'Travel', url: '/projects/travel', icon: Folder },
]

export interface DashboardCrumb {
  label: string
  href?: string
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    LucideAngularModule,
    RouterLink,
    RouterOutlet,
    NavMainComponent,
    NavProjectsComponent,
    NavSecondaryComponent,
    NavUserComponent,
    TeamSwitcherComponent,
    UiBreadcrumbComponent,
    UiBreadcrumbItemComponent,
    UiBreadcrumbLinkComponent,
    UiBreadcrumbListComponent,
    UiBreadcrumbPageComponent,
    UiBreadcrumbSeparatorComponent,
    UiButtonComponent,
    UiCommandPaletteComponent,
    UiLocaleSwitcherComponent,
    UiNotificationsPopoverComponent,
    UiThemeCustomizerComponent,
    UiOverlayScrollComponent,
    UiSeparatorComponent,
    UiSidebarComponent,
    UiSidebarContentComponent,
    UiSidebarFooterComponent,
    UiSidebarHeaderComponent,
    UiSidebarInsetComponent,
    UiSidebarProviderComponent,
    UiSidebarRailComponent,
    UiSidebarTriggerComponent,
    UiThemeSwitchComponent,
  ],
  template: `
    <ui-sidebar-provider>
      <a
        href="#main-content"
        class="bg-background text-foreground ring-ring sr-only z-50 rounded-md text-sm font-medium shadow-md ring-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:px-3 focus:py-2"
      >Skip to content</a>
      <ui-sidebar collapsible="icon">
        <ui-sidebar-header>
          <team-switcher />
        </ui-sidebar-header>
        <ui-sidebar-content data-tour="sidebar-nav" class="gap-1 overflow-visible group-data-[collapsible=icon]:overflow-hidden">
          <ui-overlay-scroll class="min-h-0 flex-1">
            <nav aria-label="Sidebar" class="flex min-h-full flex-col gap-2">
              <nav-main [items]="navMain()" />
              <nav-projects [projects]="projects()" />
              <nav-secondary [items]="navSecondary()" class="mt-auto" />
            </nav>
          </ui-overlay-scroll>
        </ui-sidebar-content>
        <ui-sidebar-footer data-tour="profile">
          <nav-user [user]="navUser()" (profileSelect)="onProfileSelect($event)" (logout)="onLogout()" />
        </ui-sidebar-footer>
        <button ui-sidebar-rail></button>
      </ui-sidebar>
      <ui-sidebar-inset>
        <header
          class="bg-background sticky top-0 z-30 flex h-14 w-full shrink-0 items-center justify-between border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
        >
          <div class="flex min-w-0 items-center gap-2">
            <ui-sidebar-trigger class="-ml-1" />
            <ui-separator orientation="vertical" class="mr-2 h-4" />
            <ui-breadcrumb class="min-w-0 overflow-hidden">
              <!-- One line: earlier crumbs keep their width, the last one truncates. -->
              <ui-breadcrumb-list class="flex-nowrap">
                @for (crumb of breadcrumbs(); track crumb.label; let i = $index; let last = $last) {
                  <ui-breadcrumb-item [class]="i === 0 ? 'hidden shrink-0 md:block' : last ? 'min-w-0' : 'shrink-0'">
                    @if (crumb.href && !last) {
                      <a
                        ui-breadcrumb-link
                        [routerLink]="crumb.href"
                        class="text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors"
                      >
                        {{ crumb.label }}
                      </a>
                    } @else {
                      <ui-breadcrumb-page class="block truncate font-medium">{{ crumb.label }}</ui-breadcrumb-page>
                    }
                  </ui-breadcrumb-item>
                  @if (!last) {
                    <ui-breadcrumb-separator [class]="i === 0 ? 'hidden shrink-0 md:block' : 'shrink-0'" />
                  }
                }
              </ui-breadcrumb-list>
            </ui-breadcrumb>
          </div>
          <div class="flex shrink-0 items-center gap-1 px-2 sm:gap-3">
            <a
              href="https://github.com/uday-a/angular-boilerplate"
              data-tour="github"
              target="_blank"
              rel="noreferrer"
              class="border-border/80 bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors xl:inline-flex"
            >
              <svg class="size-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path
                  d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.4 11.4 0 016 0C17 4.7 18 5 18 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"
                />
              </svg>
              <span>Angular Starter</span>
            </a>
            <div data-tour="palette" class="inline-flex">
              <ui-command-palette (select)="onCommandSelect($event)" />
            </div>
            <div class="flex items-center gap-0.5">
              <ui-locale-switcher />
              <ui-theme-customizer />
              <div data-tour="theme" class="inline-flex">
                <ui-theme-switch
                  [modelValue]="theme.theme()"
                  variant="icon-only"
                  (modelValueChange)="onThemeChange($event)"
                />
              </div>
              <ui-notifications-popover>
                <ng-template let-unreadCount="unreadCount">
                  <button
                    ui-button
                    ui-popover-trigger
                    variant="ghost"
                    size="icon"
                    class="text-muted-foreground hover:text-foreground relative size-8 rounded-lg"
                    aria-label="Notifications"
                  >
                    <lucide-icon [img]="Bell" class="size-4" />
                    @if (unreadCount > 0) {
                      <span class="bg-primary ring-background absolute top-1.5 right-1.5 size-2 rounded-full ring-2"></span>
                    }
                  </button>
                </ng-template>
              </ui-notifications-popover>
            </div>
          </div>
        </header>
        <!-- WHY (Rule18): cap content width so ultra-wide viewports don't
             stretch charts into noise. -->
        <main id="main-content" tabindex="-1" class="mx-auto flex w-full max-w-[1600px] flex-1 flex-col p-4 outline-none">
          <router-outlet />
        </main>
      </ui-sidebar-inset>
    </ui-sidebar-provider>
  `,
})
export class DashboardLayoutComponent {
  protected readonly Bell = Bell

  private readonly router = inject(Router)
  private readonly auth = inject(AuthService)
  private readonly i18n = inject(I18nService)
  private readonly pageTitle = inject(PageTitleState)
  readonly theme = inject(ThemeService)

  private readonly sessionUser = toSignal(this.auth.user$, { initialValue: null })

  private readonly pathname = signal(this.router.url.split('?')[0] ?? '/')
  readonly navUser = computed(() => {
    const u = this.sessionUser()
    if (!u) return { name: 'Guest', email: '', avatar: '' }
    return { name: u.name || u.login || u.email || 'Guest', email: u.email ?? '', avatar: u.avatar ?? '' }
  })

  readonly navMain = computed(() => {
    const path = this.pathname()
    // The Admin section is role-gated client-side for navigation polish
    // only; the real enforcement is server-side (requireRole('admin')).
    const isAdmin = this.sessionUser()?.role === 'admin'
    return this.translateNav(isAdmin ? [...NAV_MAIN, NAV_ADMIN] : NAV_MAIN).map((item) => {
      const childActive = item.items?.some((sub) => isNavItemActive(path, sub.url)) ?? false
      const selfActive = isNavItemActive(path, item.url)
      return {
        ...item,
        isActive: selfActive || childActive,
        items: item.items?.map((sub) => ({ ...sub, isActive: isNavItemActive(path, sub.url) })),
      }
    })
  })

  readonly navSecondary = computed(() => {
    const path = this.pathname()
    return this.translateNav(NAV_SECONDARY).map((item) => ({ ...item, isActive: isNavItemActive(path, item.url) }))
  })

  readonly projects = computed(() => {
    const path = this.pathname()
    return PROJECTS.map((item) => ({ ...item, isActive: isNavItemActive(path, item.url) }))
  })

  readonly breadcrumbs = computed<DashboardCrumb[]>(() => {
    this.i18n.lang()
    const t = (k: string) => this.i18n.t(k)
    const parts = this.pathname().split('/').filter(Boolean)
    if (parts.length === 0) return [{ label: t('nav.items.dashboard') }]
    const page = this.pageTitle.current()
    return parts.map((_, i) => {
      const path = '/' + parts.slice(0, i + 1).join('/')
      const last = i === parts.length - 1
      // Last crumb: the page's own label when it set one for this path
      // (kanban task title, project name), else the route label.
      const label = last && page?.path === path ? page.label : routeLabel(path, t)
      return { label, href: last ? undefined : path }
    })
  })

  // Reads i18n.lang() so the calling computed re-translates on locale switch.
  private translateNav<T extends Omit<SidebarNavItem, 'isActive'>>(items: T[]): T[] {
    this.i18n.lang()
    const t = (k: string) => this.i18n.t(k)
    return items.map((item) => ({ ...item, title: t(item.title), items: item.items?.map((sub) => ({ ...sub, title: t(sub.title) })) }))
  }

  constructor() {
    // Refresh session state on shell entry (browser only; guard already ran).
    if (typeof window !== 'undefined') this.auth.fetch().subscribe()
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      this.pathname.set(e.urlAfterRedirects.split('?')[0] ?? '/')
    })
  }

  onThemeChange(next: SwitchTheme): void {
    if (next === 'black') return
    this.theme.setTheme(next as Theme)
  }

  onCommandSelect(item: CommandPaletteItem): void {
    if (item.hint) void this.router.navigate([item.hint])
  }

  onProfileSelect(key: string): void {
    if (key === 'account') void this.router.navigate(['/settings/account'])
    else if (key === 'billing') void this.router.navigate(['/settings/billing'])
    else if (key === 'notifications') void this.router.navigate(['/settings/notifications'])
    else if (key === 'logout') this.onLogout()
  }

  onLogout(): void {
    this.auth.logout().subscribe()
  }
}
