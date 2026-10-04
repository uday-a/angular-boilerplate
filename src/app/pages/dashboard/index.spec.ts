// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'

// jsdom has no canvas 2d context, so ECharts' zrender painter throws
// uncaught exceptions (null.clearRect / null.dpr) that fail the run even
// though all assertions pass. Stub getContext with a no-op 2d context
// before any chart primitive initialises.
function stubCanvas(): void {
  if (typeof HTMLCanvasElement === 'undefined') return
  const proto = HTMLCanvasElement.prototype as unknown as Record<string, unknown>
  if (proto['__uipkgeStubbed']) return
  const noop = () => {}
  const ctx = {
    dpr: 1,
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    font: '',
    textAlign: '',
    textBaseline: '',
    clearRect: noop,
    fillRect: noop,
    strokeRect: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    arc: noop,
    fill: noop,
    stroke: noop,
    save: noop,
    restore: noop,
    translate: noop,
    scale: noop,
    rotate: noop,
    setTransform: noop,
    setLineDash: noop,
    getLineDash: () => [],
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    createPattern: () => null,
    measureText: () => ({ width: 0 }),
    fillText: noop,
    strokeText: noop,
    drawImage: noop,
    getImageData: () => ({ data: [128, 128, 128, 255] }),
    putImageData: noop,
    clip: noop,
    quadraticCurveTo: noop,
    bezierCurveTo: noop,
    rect: noop,
  }
  HTMLCanvasElement.prototype.getContext = (() => ctx) as unknown as typeof HTMLCanvasElement.prototype.getContext
  proto['__uipkgeStubbed'] = true
}
stubCanvas()

import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { DashboardIndexComponent } from '@/app/pages/dashboard/index'
import { provideTestI18n, seedI18n } from '../../../../test-utils/i18n'

describe('DashboardIndexComponent', () => {
  let fixture: ComponentFixture<DashboardIndexComponent>

  beforeEach(async () => {
    localStorage.clear()
    await TestBed.configureTestingModule({
      imports: [DashboardIndexComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([]), provideTestI18n()],
    }).compileComponents()
    seedI18n()
    fixture = TestBed.createComponent(DashboardIndexComponent)
    fixture.detectChanges()
    await fixture.whenStable()
  })

  it('renders the Nuxt HEAD sections in order with identical copy', () => {
    const text = fixture.nativeElement.textContent as string
    for (const copy of [
      'Real-time overview of revenue, traffic, and operations.',
      'MRR',
      'Active users',
      'Requests / min',
      'Avg latency',
      'Churn',
      'Revenue vs expenses',
      'Conversion funnel',
      'Last 30 days · 1.8% end-to-end',
      'Quota',
      'Used',
      'Left',
      'Resets',
      'Headcount by department',
      '1,221 people across 5 departments',
      'Active alerts',
      '5 open · 12 resolved today',
      'Customers by region',
      'Deploy activity · last 365 days',
      'Top products by MRR',
      'Share of MRR',
      'View plans',
      'Top customers',
      'By MRR · 6 of 142 accounts',
      'Recent activity',
      'Open the full data table',
    ]) {
      expect(text).toContain(copy)
    }
  })

  it('renders card titles as h3 headings so the page outline matches Nuxt', () => {
    const headings = [...(fixture.nativeElement as HTMLElement).querySelectorAll('h3')].map((h) => h.textContent?.trim())
    for (const title of ['Revenue vs expenses', 'Conversion funnel', 'Quota', 'Active alerts', 'Customers by region', 'Top customers']) {
      expect(headings).toContain(title)
    }
  })

  it('shows five KPI tiles and no Conversion tile', () => {
    const text = fixture.nativeElement.textContent as string
    // No Conversion KPI tile (its old 7.4% headline is gone); the funnel card stays.
    expect(text).toContain('Conversion funnel')
    expect(text).not.toContain('7.4%')
    // Quota gauge meta: 482.3k used / 517.7k left / Oct 1 reset.
    expect(text).toContain('482.3k')
    expect(text).toContain('517.7k')
    expect(text).toContain('Oct 1')
  })

  it('opens the tour on first visit and persists dismissal', () => {
    const cmp = fixture.componentInstance
    expect(cmp.tourOpen()).toBe(true)
    cmp.onTourFinish()
    expect(cmp.tourOpen()).toBe(false)
    expect(localStorage.getItem('uipkge-dashboard-tour-dismissed')).toBe('1')
  })

  it('flips to the custom range when both calendar endpoints are picked', () => {
    const cmp = fixture.componentInstance
    cmp.onCustomSelect({ from: new Date('2026-09-01'), to: new Date('2026-09-14') })
    fixture.detectChanges()
    expect(cmp.range()).toBe('custom')
    expect(cmp.displayLabel()).toContain('Sep')
    cmp.onRangeChange('30d')
    expect(cmp.range()).toBe('30d')
    expect(cmp.customCal()).toBeUndefined()
  })
})
