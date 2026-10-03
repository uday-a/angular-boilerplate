// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { DashboardLocations } from '@/app/pages/dashboard/dashboard-locations'
import { officeLocations } from '@/app/core/dashboard/locations'

describe('DashboardLocations', () => {
  let fixture: ComponentFixture<DashboardLocations>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardLocations],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents()
    fixture = TestBed.createComponent(DashboardLocations)
    fixture.detectChanges()
    await fixture.whenStable()
  })

  it('renders every office card plus the customer breakdown', () => {
    const text = fixture.nativeElement.textContent as string
    expect(text).toContain('Every office, hub, and HQ on one live map.')
    expect(text).toContain('San Francisco')
    expect(text).toContain('Where customers concentrate')
  })

  it('filters by search and kind', () => {
    fixture.componentInstance.search.set('london')
    fixture.detectChanges()
    let text = fixture.nativeElement.textContent as string
    expect(text).toContain('London')
    expect(text).not.toContain('Tokyo')
    fixture.componentInstance.search.set('')
    fixture.componentInstance.onKind('hub')
    fixture.detectChanges()
    text = fixture.nativeElement.textContent as string
    expect(text).toContain('3 of 12')
    expect(officeLocations.filter((o) => o.kind === 'hub').length).toBe(3)
  })
})
