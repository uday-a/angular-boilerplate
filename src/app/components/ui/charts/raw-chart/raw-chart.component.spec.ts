// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { UiRawChartComponent } from './raw-chart.component'

describe('UiRawChartComponent', () => {
  it('returns the passed option verbatim', () => {
    const c = new UiRawChartComponent()
    const option = { series: [{ type: 'bar' }] }
    c.option = option
    expect(c.getOption()).toBe(option)
  })

  it('defaults to an empty option and 300px height', () => {
    const c = new UiRawChartComponent()
    expect(c.getOption()).toEqual({})
    expect(c.heightStyle).toBe('300px')
    c.height = '100%'
    expect(c.heightStyle).toBe('100%')
  })
})
