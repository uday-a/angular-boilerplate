import { describe, expect, it } from 'vitest'
import { breadcrumbSegmentLabel, routeLabel } from './breadcrumb-labels'
import { isNavItemActive } from './nav-active'

describe('breadcrumbSegmentLabel', () => {
  it('maps known dashboard segments', () => {
    expect(breadcrumbSegmentLabel('dashboard')).toBe('Dashboard')
    expect(breadcrumbSegmentLabel('data-table')).toBe('Customers')
    expect(breadcrumbSegmentLabel('ui-kit')).toBe('UI Kit')
    expect(breadcrumbSegmentLabel('form-example')).toBe('Validated form')
  })

  it('maps API keys without humanize drift', () => {
    expect(breadcrumbSegmentLabel('api-keys')).toBe('API keys')
  })

  it('title-cases unknown segments', () => {
    expect(breadcrumbSegmentLabel('design-engineering')).toBe('Design engineering')
  })
})

describe('routeLabel', () => {
  it('disambiguates repeated segments by full path', () => {
    expect(routeLabel('/settings/activity')).toBe('Activity log')
    expect(routeLabel('/dashboard/activity')).toBe('Activity')
    expect(routeLabel('/settings/api-keys')).toBe('API keys')
    expect(routeLabel('/admin/roles')).toBe('Roles & permissions')
    expect(routeLabel('/dashboard/data-table')).toBe('Customers')
  })
})

describe('isNavItemActive', () => {
  it('matches dashboard exact-only', () => {
    expect(isNavItemActive('/dashboard', '/dashboard')).toBe(true)
    expect(isNavItemActive('/dashboard/kanban', '/dashboard')).toBe(false)
  })

  it('matches exact and nested paths', () => {
    expect(isNavItemActive('/dashboard/kanban', '/dashboard/kanban')).toBe(true)
    expect(isNavItemActive('/settings/account', '/settings')).toBe(true)
    expect(isNavItemActive('/support', '/settings')).toBe(false)
  })

  it('ignores query strings', () => {
    expect(isNavItemActive('/dashboard?error=forbidden', '/dashboard')).toBe(true)
  })
})
