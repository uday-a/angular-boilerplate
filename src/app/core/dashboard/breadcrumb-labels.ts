/** Human-readable labels for DashboardLayout pathname segments. */
const SEGMENT_LABELS: Record<string, string> = {
  'dashboard': 'Dashboard',
  'kanban': 'Kanban',
  'calendar': 'Calendar',
  'activity': 'Activity',
  'data-table': 'Customers',
  'locations': 'Locations',
  'ui-kit': 'UI Kit',
  'messages': 'Messages',
  'forms': 'Forms',
  'form-example': 'Validated form',
  'settings': 'Settings',
  'account': 'Account',
  'general': 'General',
  'security': 'Security',
  'api-keys': 'API keys',
  'notifications': 'Notifications',
  'integrations': 'Integrations',
  'team': 'Team',
  'billing': 'Billing',
  'limits': 'Limits',
  'admin': 'Admin',
  'users': 'Users',
  'roles': 'Roles & permissions',
  'projects': 'Projects',
  'support': 'Support',
  'feedback': 'Feedback',
}

export function breadcrumbSegmentLabel(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
}

/**
 * Full-path labels, mirroring nuxt-boilerplate `ROUTE_LABEL_KEYS`: segments
 * repeat (`/dashboard/activity` is "Activity", `/settings/activity` is
 * "Activity log"), so the last crumb resolves against the whole path.
 */
const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/messages': 'Messages',
  '/dashboard/kanban': 'Kanban',
  '/dashboard/data-table': 'Customers',
  '/dashboard/calendar': 'Calendar',
  '/dashboard/activity': 'Activity',
  '/dashboard/locations': 'Locations',
  '/dashboard/ui-kit': 'UI Kit',
  '/dashboard/forms': 'Forms',
  '/dashboard/form-example': 'Validated form',
  '/settings': 'Settings',
  '/settings/general': 'General',
  '/settings/account': 'Account',
  '/settings/security': 'Security',
  '/settings/api-keys': 'API keys',
  '/settings/notifications': 'Notifications',
  '/settings/integrations': 'Integrations',
  '/settings/team': 'Team',
  '/settings/activity': 'Activity log',
  '/settings/billing': 'Billing',
  '/settings/limits': 'Limits',
  '/admin': 'Admin',
  '/admin/users': 'Users',
  '/admin/roles': 'Roles & permissions',
  '/projects': 'Projects',
  '/support': 'Support',
  '/feedback': 'Feedback',
}

/** Label for a route path; falls back to the per-segment label. */
export function routeLabel(path: string): string {
  const direct = ROUTE_LABELS[path]
  if (direct) return direct
  const parts = path.split('/').filter(Boolean)
  if (parts.length === 0) return 'Dashboard'
  return breadcrumbSegmentLabel(parts[parts.length - 1] ?? '')
}
