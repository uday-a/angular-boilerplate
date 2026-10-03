// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { UiFunnelChartComponent } from './funnel-chart.component'
import { funnelBarOpacity } from '@/app/core/dashboard/funnel'

const DATA_30D = [
  { name: 'Visitors', value: 24850, realValue: 24850 },
  { name: 'Sign-ups', value: 14910, realValue: 14910 },
  { name: 'Activated', value: 5964, realValue: 5964 },
  { name: 'Paid', value: 1789, realValue: 1789 },
  { name: 'Retained 30d', value: 447, realValue: 447 },
]

function makeChart(data = DATA_30D): UiFunnelChartComponent {
  const c = new UiFunnelChartComponent()
  c.data = data
  return c
}

describe('UiFunnelChartComponent option geometry', () => {
  it('builds a true ECharts funnel (triangle series)', () => {
    const option = makeChart().getOption() as { series: { type: string, sort: string, minSize: string }[] }
    expect(option.series).toHaveLength(1)
    expect(option.series[0]!.type).toBe('funnel')
    // Data order top->bottom, never re-sorted.
    expect(option.series[0]!.sort).toBe('none')
    // Tail floor keeps the last stage label from truncating.
    expect(option.series[0]!.minSize).toBe('28%')
  })

  it('keeps stage order top->bottom in data order', () => {
    const option = makeChart().getOption() as { series: { data: { name: string }[] }[] }
    expect(option.series[0]!.data.map((d) => d.name)).toEqual([
      'Visitors',
      'Sign-ups',
      'Activated',
      'Paid',
      'Retained 30d',
    ])
  })

  it('paints solid pre-blended stages (1.0 -> 0.45 depth) with a same-colour round stroke', () => {
    // jsdom has no canvas: fake one whose blended pixel encodes the alpha, so
    // the test proves each stage is primary pre-blended at its depth opacity.
    const proto = HTMLCanvasElement.prototype as unknown as { getContext: unknown }
    const original = proto.getContext
    proto.getContext = () => {
      const ctx = { fillStyle: '', globalAlpha: 1, fillRect() {}, getImageData: () => ({ data: [Math.round(ctx.globalAlpha * 100), 0, 0, 255] }) }
      return ctx
    }
    try {
      const option = makeChart().getOption() as {
        color: string[]
        series: { gap: number, data: { itemStyle: { color: string, opacity?: number, borderColor: string, borderWidth: number, borderJoin: string } }[] }[]
      }
      expect(option.color).toHaveLength(1)
      expect(option.series[0]!.gap).toBe(11)
      const items = option.series[0]!.data
      // Solid fills, no per-stage opacity (it would darken the overlapping stroke).
      for (const d of items) expect(d.itemStyle.opacity).toBeUndefined()
      // Top stage is the untouched primary; the rest fade by depth.
      expect(items[0]!.itemStyle.color).toBe(option.color[0])
      expect(items.slice(1).map((d) => d.itemStyle.color)).toEqual(
        [1, 2, 3, 4].map((i) => `rgb(${Math.round(funnelBarOpacity(i, 5) * 100)}, 0, 0)`),
      )
      expect(funnelBarOpacity(4, 5)).toBe(0.45)
      // Same-colour 6px round-join stroke softens the polygon corners.
      for (const d of items) {
        expect(d.itemStyle.borderColor).toBe(d.itemStyle.color)
        expect(d.itemStyle.borderWidth).toBe(6)
        expect(d.itemStyle.borderJoin).toBe('round')
      }
    }
    finally {
      proto.getContext = original
    }
  })

  it('labels stages inside with name + "count · cumulative"', () => {
    const c = makeChart()
    const option = c.getOption() as {
      series: { label: { position: string, formatter: (p: { dataIndex: number }) => string } }[]
    }
    const label = option.series[0]!.label
    expect(label.position).toBe('inside')
    expect(label.formatter({ dataIndex: 1 })).toContain('14,910 · 60%')
    expect(label.formatter({ dataIndex: 4 })).toContain('447 · 1.8%')
  })

  it('resolves legacy triangle payloads to real counts', () => {
    const c = makeChart([
      { name: 'Paid', value: 5964, realValue: 1789 },
      { name: 'Retained 30d', value: 5964, realValue: 447 },
    ])
    const option = c.getOption() as { series: { data: { value: number }[] }[] }
    expect(option.series[0]!.data.map((d) => d.value)).toEqual([1789, 447])
  })

  it('enables ECharts aria with the funnel description', () => {
    const option = makeChart().getOption() as { aria: { enabled: boolean, label: { description: string } } }
    expect(option.aria.enabled).toBe(true)
    expect(option.aria.label.description).toContain('Conversion funnel:')
    expect(option.aria.label.description).toContain('End-to-end 1.8% retained.')
  })

  it('lets the dashboard thin layer override aria without touching the funnel', () => {
    const c = makeChart()
    c.option = { aria: { enabled: true, label: { description: 'Conversion funnel, Last 30 days: custom' } } }
    const option = c.getOption() as {
      aria: { label: { description: string } }
      series: { type: string }[]
    }
    expect(option.aria.label.description).toBe('Conversion funnel, Last 30 days: custom')
    expect(option.series[0]!.type).toBe('funnel')
  })

  it('reports real counts + step rates from the tooltip', () => {
    const option = makeChart().getOption() as {
      tooltip: { formatter: (p: { dataIndex: number }) => string }
    }
    const tip = option.tooltip.formatter({ dataIndex: 1 })
    expect(tip).toContain('Sign-ups')
    expect(tip).toContain('Count: 14,910')
    expect(tip).toContain('Step rate: 60% of Visitors')
    expect(tip).toContain('Cumulative: 60% of top')
    expect(option.tooltip.formatter({ dataIndex: 0 })).toContain('Baseline: 100% of top')
  })

  it('falls back to the funnel description when no ariaLabel input is set', () => {
    expect(makeChart().effectiveAriaLabel()).toContain('Conversion funnel:')
    const c = makeChart()
    c.ariaLabel = 'Custom name'
    expect(c.effectiveAriaLabel()).toBe('Custom name')
  })

  it('formats step pills with the source stage', () => {
    const c = makeChart()
    const steps = c.funnelStats().steps
    expect(c.stepPill(steps[0]!)).toBe('100% · Visitors')
    expect(c.stepPill(steps[4]!)).toBe('→ 25% from Paid')
  })
})
