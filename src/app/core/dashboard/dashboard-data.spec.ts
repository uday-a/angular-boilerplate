// @vitest-environment jsdom
import { signal } from '@angular/core'
import { describe, expect, it } from 'vitest'
import { createDashboardData, type Range } from './dashboard-data'
import { formatPct, formatStepRatesLine } from './funnel'

describe('createDashboardData', () => {
  it('swaps deltas + sparks per range while headlines stay constant', () => {
    const range = signal<Range>('24h')
    const data = createDashboardData(range)
    expect(data.kpi().mrr.delta).toBe('+0.4%')
    expect(data.kpi().spark.revenue).toHaveLength(24)
    expect(data.rangeLabel()).toBe('Last 24 hours')

    range.set('7d')
    expect(data.kpi().mrr.delta).toBe('+2.8%')
    expect(data.kpi().spark.revenue).toHaveLength(7)
    expect(data.requestsBlock().title).toBe('Requests by day')
  })

  it('scales the funnel to the selected window', () => {
    const range = signal<Range>('30d')
    const data = createDashboardData(range)
    expect(data.funnel()[0]?.value).toBe(24850)
    range.set('ytd')
    expect(data.funnel()[0]?.value).toBe(124200)
    range.set('custom')
    expect(data.funnel()[0]?.value).toBe(14900)
  })

  it('preserves headcount totals in the department treemap', () => {
    const data = createDashboardData()
    expect(data.totalHeadcount).toBe(1221)
    expect(data.totalDepartments).toBe(5)
    expect(data.segments.reduce((s, x) => s + x.value, 0)).toBe(1221)
  })

  it('tracks MRR in the ytd revenue series', () => {
    const range = signal<Range>('ytd')
    const data = createDashboardData(range)
    expect(data.revenueSeries()[0]?.x).toBe('Jan')
    expect(data.revenueSeries()).toHaveLength(9)
    expect(data.revenueSeries()[0]).toMatchObject({ revenue: 73000, expenses: 58000 })
  })

  it('groups the revenue combo into four buckets with profit + refunds', () => {
    const data = createDashboardData(signal<Range>('30d'))
    const option = data.revenueComboOption() as { series: { name: string }[] }
    expect(option.series.map(s => s.name)).toEqual(['Revenue', 'Expenses', 'Profit', 'Refunds'])
    expect(data.revenueSeries()[0]).toHaveProperty('profit')
    expect(data.revenueSeries()[0]).toHaveProperty('refunds')
  })

  it('exposes the quota gauge (482.3k used, Oct 1 reset)', () => {
    const data = createDashboardData()
    expect(data.quotaMeta.used).toBe(482_300)
    expect(data.quotaMeta.remaining).toBe(517_700)
    expect(data.quotaMeta.renews).toBe('Oct 1')
    expect(data.quotaUsed).toBe(48)
  })

  it('anchors the deploy heatmap to 2026-09-28', () => {
    const data = createDashboardData()
    expect(data.calendarRange[1]).toBe('2026-09-28')
    expect(data.calendarData).toHaveLength(365)
  })

  it('ranks customers by MRR with token status tones', () => {
    const data = createDashboardData()
    expect(data.topCustomers[0]?.name).toBe('Olympus Robotics')
    expect(data.statusTone['healthy']).toBe('bg-success')
    expect(data.alerts).toHaveLength(5)
    expect(data.alerts[0]?.severity).toBe('critical')
  })

  it('formats thousands compactly', () => {
    const data = createDashboardData()
    expect(data.formatK(4800)).toBe('4.8k')
    expect(data.formatK(980)).toBe('980')
  })

  it('exposes the 30d demo funnel with exact counts + summary', () => {
    const data = createDashboardData(signal<Range>('30d'))
    expect(data.funnel().map((f) => f.value)).toEqual([24850, 14910, 5964, 1789, 447])
    expect(data.funnelSummary().visitors).toBe(24850)
    expect(data.funnelSummary().retained).toBe(447)
    expect(formatPct(data.funnelSummary().endToEnd)).toBe('1.8%')
    expect(formatStepRatesLine(data.funnelSummary())).toBe('Step rates: 60% → 40% → 30% → 25%')
  })

  it('updates funnel counts + summary when the range changes', () => {
    const range = signal<Range>('30d')
    const data = createDashboardData(range)
    expect(data.funnelSummary().visitors).toBe(24850)
    range.set('24h')
    expect(data.funnel().map((f) => f.value)).toEqual([1000, 600, 240, 72, 18])
    expect(data.funnelSummary().visitors).toBe(1000)
    expect(data.funnelSummary().retained).toBe(18)
    expect(formatStepRatesLine(data.funnelSummary())).toBe('Step rates: 60% → 40% → 30% → 25%')
    range.set('7d')
    expect(data.funnel().map((f) => f.value)).toEqual([6000, 3600, 1440, 432, 108])
  })

  it('keeps funnelOption a thin range-aware layer (no series override)', () => {
    const range = signal<Range>('30d')
    const data = createDashboardData(range)
    expect('series' in (data.funnelOption() as Record<string, unknown>)).toBe(false)
    expect(data.funnelOption().aria.label.description).toContain('Last 30 days')
    expect(data.funnelOption().aria.label.description).toContain('End-to-end 1.8% retained.')
    range.set('ytd')
    expect(data.funnelOption().aria.label.description).toContain('Year to date')
  })
})
