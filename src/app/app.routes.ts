import { Injector, inject } from '@angular/core'
import { Routes, type UrlSegment } from '@angular/router'
import { authGuard, guestGuard } from './core/auth/auth.guard'
import { roleGuard } from './core/auth/role.guard'

// Every page loads lazily (loadComponent) so the initial bundle stays small —
// with ~25 pages + the chart stack, eager imports blow the 2MB initial budget.
// The DashboardLayout shell itself is lazy too: marketing visitors never
// download the sidebar shell.
export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home').then(m => m.Home) },
  { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.Login), canActivate: [guestGuard] },
  { path: 'sign-up', loadComponent: () => import('./pages/sign-up/sign-up').then(m => m.SignUp), canActivate: [guestGuard] },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password').then(m => m.ForgotPassword),
    canActivate: [guestGuard],
  },
  { path: 'mfa', loadComponent: () => import('./pages/mfa/mfa').then(m => m.Mfa), canActivate: [guestGuard] },
  { path: 'pricing', loadComponent: () => import('./pages/pricing/pricing').then(m => m.Pricing) },
  { path: 'terms', loadComponent: () => import('./pages/terms/terms').then(m => m.Terms) },
  { path: 'privacy', loadComponent: () => import('./pages/privacy/privacy').then(m => m.Privacy) },
  { path: 'invite/:token', loadComponent: () => import('./pages/invite/invite').then(m => m.Invite) },
  {
    path: 'onboarding',
    loadComponent: () => import('./pages/onboarding/onboarding').then(m => m.Onboarding),
    canActivate: [authGuard],
  },
  // Authenticated section (nuxt `layout: 'dashboard'`). ONE shell —
  // DashboardLayoutComponent (sidebar-02 family + topbar + outlet) — parents
  // every authenticated page: /dashboard/*, /projects/*, /settings/*,
  // /feedback, /support. canActivateChild runs authGuard once per navigation
  // below the shell; the shell instance persists across section switches.
  {
    path: '',
    loadComponent: () =>
      import('./layouts/dashboard-layout/dashboard-layout').then(m => m.DashboardLayoutComponent),
    canActivateChild: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/index').then(m => m.DashboardIndexComponent),
      },
      {
        path: 'dashboard/kanban',
        loadComponent: () => import('./pages/dashboard/kanban').then(m => m.DashboardKanbanComponent),
      },
      {
        // Deep link into a task (opens the task sheet for :id). Unknown ids
        // fail canMatch and fall through to the '**' 404 page.
        path: 'dashboard/kanban/:id',
        // Lazy import keeps the kanban seed out of the initial bundle.
        canMatch: [async (_route: unknown, segments: UrlSegment[]) => {
          const injector = inject(Injector)
          const { KanbanStore } = await import('./core/dashboard/kanban-data')
          const { findTaskById } = await import('./core/dashboard/kanban')
          return !!findTaskById(injector.get(KanbanStore).columns(), segments.at(-1)?.path ?? '')
        }],
        loadComponent: () => import('./pages/dashboard/kanban').then(m => m.DashboardKanbanComponent),
      },
      {
        path: 'dashboard/calendar',
        loadComponent: () => import('./pages/dashboard/calendar').then(m => m.DashboardCalendarComponent),
      },
      {
        path: 'dashboard/activity',
        loadComponent: () => import('./pages/dashboard/activity').then(m => m.DashboardActivityComponent),
      },
      {
        path: 'dashboard/locations',
        loadComponent: () => import('./pages/dashboard/dashboard-locations').then(m => m.DashboardLocations),
      },
      {
        path: 'dashboard/messages',
        loadComponent: () => import('./pages/dashboard/messages').then(m => m.DashboardMessagesComponent),
      },
      {
        path: 'dashboard/data-table',
        loadComponent: () => import('./pages/dashboard/data-table').then(m => m.DashboardDataTableComponent),
      },
      {
        path: 'dashboard/ui-kit',
        loadComponent: () => import('./pages/dashboard/ui-kit').then(m => m.DashboardUiKitComponent),
      },
      {
        path: 'dashboard/forms',
        loadComponent: () => import('./pages/dashboard/forms').then(m => m.DashboardFormsComponent),
      },
      {
        path: 'dashboard/form-example',
        loadComponent: () =>
          import('./pages/dashboard/form-example').then(m => m.DashboardFormExampleComponent),
      },
      {
        path: 'projects',
        loadComponent: () => import('./pages/projects/projects-list').then(m => m.ProjectsList),
      },
      {
        path: 'projects/:slug',
        loadComponent: () => import('./pages/projects/project-detail').then(m => m.ProjectDetail),
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings-hub').then(m => m.SettingsHub),
      },
      {
        path: 'settings/general',
        loadComponent: () => import('./pages/settings/settings-general').then(m => m.SettingsGeneral),
      },
      {
        path: 'settings/account',
        loadComponent: () => import('./pages/settings/settings-account').then(m => m.SettingsAccount),
      },
      {
        path: 'settings/security',
        loadComponent: () => import('./pages/settings/settings-security').then(m => m.SettingsSecurity),
      },
      {
        path: 'settings/notifications',
        loadComponent: () =>
          import('./pages/settings/settings-notifications').then(m => m.SettingsNotifications),
      },
      {
        path: 'settings/integrations',
        loadComponent: () =>
          import('./pages/settings/settings-integrations').then(m => m.SettingsIntegrations),
      },
      {
        path: 'settings/team',
        loadComponent: () => import('./pages/settings/settings-team').then(m => m.SettingsTeam),
      },
      {
        path: 'settings/activity',
        loadComponent: () => import('./pages/settings/settings-activity').then(m => m.SettingsActivity),
      },
      {
        path: 'settings/api-keys',
        loadComponent: () => import('./pages/settings/settings-api-keys').then(m => m.SettingsApiKeys),
      },
      {
        path: 'settings/billing',
        loadComponent: () => import('./pages/settings/settings-billing').then(m => m.SettingsBilling),
      },
      {
        path: 'settings/limits',
        loadComponent: () => import('./pages/settings/settings-limits').then(m => m.SettingsLimits),
      },
      {
        // Admin-only section (nuxt `middleware: ['auth', 'role'], requiredRole: 'admin'`).
        // roleGuard is navigation polish; server/utils/auth-redirect.ts gates
        // SSR and requireRole('admin') gates /api/admin/*.
        path: 'admin',
        canActivate: [roleGuard],
        data: { requiredRole: 'admin' },
        children: [
          {
            path: 'users',
            loadComponent: () => import('./pages/admin/admin-users').then(m => m.AdminUsers),
          },
          {
            path: 'roles',
            loadComponent: () => import('./pages/admin/admin-roles').then(m => m.AdminRoles),
          },
        ],
      },
      {
        path: 'feedback',
        loadComponent: () => import('./pages/feedback/feedback').then(m => m.Feedback),
      },
      {
        path: 'support',
        loadComponent: () => import('./pages/support/support').then(m => m.Support),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then(m => m.NotFound),
  },
]
