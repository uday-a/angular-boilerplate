import { describe, expect, it } from 'vitest'
import en from '../../../assets/i18n/en.json'
import { routeLabel } from './breadcrumb-labels'
import { isNavItemActive } from './nav-active'

const t = (key: string) => key.split('.').reduce<unknown>((node, k) => (node as Record<string, unknown>)?.[k], en) as string ?? key

describe('routeLabel', () => {
  it('disambiguates repeated segments by full path', () => {
    expect(routeLabel('/settings/activity', t)).toBe('Activity log')
    expect(routeLabel('/dashboard/activity', t)).toBe('Activity')
    expect(routeLabel('/settings/api-keys', t)).toBe('API keys')
    expect(routeLabel('/admin/roles', t)).toBe('Roles & permissions')
    expect(routeLabel('/dashboard/data-table', t)).toBe('Customers')
  })

  it('humanizes unknown segments', () => {
    expect(routeLabel('/projects/design-engineering', t)).toBe('Design engineering')
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
