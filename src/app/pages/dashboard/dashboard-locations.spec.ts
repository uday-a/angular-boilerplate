// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { DashboardLocations, formatArr } from '@/app/pages/dashboard/dashboard-locations'
import { officeLocations } from '@/app/core/dashboard/locations'
import { provideTestI18n, seedI18n } from '../../../../test-utils/i18n'

describe('DashboardLocations', () => {
  let fixture: ComponentFixture<DashboardLocations>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardLocations],
      providers: [provideZonelessChangeDetection(), provideRouter([]), provideTestI18n()],
    }).compileComponents()
    seedI18n()
    fixture = TestBed.createComponent(DashboardLocations)
    fixture.detectChanges()
    await fixture.whenStable()
  })

  const text = () => fixture.nativeElement.textContent as string

  it('renders the office list, the region breakdown and the customer cities', () => {
    expect(text()).toContain('Every office, hub, and HQ on one live map.')
    expect(text()).toContain('San Francisco')
    expect(text()).toContain('Headcount by region')
    expect(text()).toContain('Top customer cities')
  })

  it('filters the list and the KPIs by search and kind (stats never describe hidden offices)', () => {
    fixture.componentInstance.search.set('london')
    fixture.detectChanges()
    const listed = () => [...fixture.nativeElement.querySelectorAll('li[id^="location-"]')].map((li: Element) => li.id)
    expect(listed()).toEqual(['location-london'])
    expect(fixture.componentInstance.totalHeadcount()).toBe(158)

    fixture.componentInstance.search.set('')
    fixture.componentInstance.onKind('hub')
    fixture.detectChanges()
    const hubs = officeLocations.filter(o => o.kind === 'hub')
    expect(fixture.componentInstance.filtered().length).toBe(hubs.length)
    expect(fixture.componentInstance.openRoles()).toBe(hubs.reduce((s, o) => s + o.openRoles, 0))
  })

  it('rolls headcount up by region with shares that add to ~100%', () => {
    const regions = fixture.componentInstance.regions()
    expect(regions.map(r => r.key)).toEqual(['americas', 'emea', 'apac'])
    expect(regions.reduce((s, r) => s + r.headcount, 0)).toBe(1221)
    expect(Math.abs(regions.reduce((s, r) => s + r.share, 0) - 100)).toBeLessThanOrEqual(1)
    expect(fixture.componentInstance.largestRegion().key).toBe('americas')
  })

  it('switches map layers between offices, customers and both', () => {
    const c = fixture.componentInstance
    expect([c.showOffices(), c.showCustomers()]).toEqual([true, false])
    c.layer.set('customers')
    expect([c.showOffices(), c.showCustomers()]).toEqual([false, true])
    c.layer.set('both')
    expect([c.showOffices(), c.showCustomers()]).toEqual([true, true])
  })

  it('formats ARR in $k under a million and $M above', () => {
    expect(formatArr(870)).toBe('$870k')
    expect(formatArr(3120)).toBe('$3.1M')
  })
})
