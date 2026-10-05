import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core'
import type * as echarts from 'echarts/core'
import { cn } from '@/app/core/utils/cn'
import { getChartColors, whenSized } from '../use-chart-theme'

export type SparklineVariant = 'area' | 'bars' | 'line' | 'dots'

/**
 * Angular port of the UIPKGE Sparkline — inline micro-chart for KPI tiles.
 * Standalone ECharts wrapper (line + bar registered so consumers can swap
 * `type: 'bar'` via the option escape hatch). Theme-aware via registry tokens.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-sparkline, [ui-sparkline]',
  standalone: true,
  host: {
    '[attr.data-slot]': '"sparkline"',
    '[attr.data-uipkge]': '""',
    '[class]': 'hostClass',
    '[attr.role]': '"img"',
    '[attr.aria-label]': 'ariaLabel || "Chart"',
    '[attr.tabindex]': '0',
    '[style.height]': 'heightStyle',
  },
  template: `<div #chartEl class="size-full"></div>`,
})
export class UiSparklineComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() data: number[] = []
  @Input() color?: string
  @Input() height: number | string = 40
  /** Mini form per KPI so every card reads distinct: area fill, bars,
   *  plain line, or line with sample dots. */
  @Input() variant: SparklineVariant = 'area'
  @Input() option?: Record<string, unknown>
  /** Accessible name announced for the chart image. Defaults to "Chart". */
  @Input() ariaLabel?: string
  @Input('class') className?: string

  @ViewChild('chartEl', { static: false }) chartEl?: ElementRef<HTMLDivElement>

  private chart: echarts.ECharts | null = null
  private destroyed = false
  private unsubscribeTheme: (() => void) | null = null

  get hostClass(): string {
    return cn('block focus-visible:ring-ring w-full focus-visible:ring-2 focus-visible:outline-none', this.className)
  }

  get heightStyle(): string {
    return /^\d+$/.test(String(this.height)) ? `${this.height}px` : String(this.height)
  }

  resolveColor(): string {
    return this.color ?? getChartColors()[1]!
  }

  /** Build the merged ECharts option (pure — no DOM needed, unit-testable). */
  getOption(): Record<string, unknown> {
    const color = this.resolveColor()
    const bars = {
      type: 'bar',
      barWidth: '60%',
      itemStyle: { color, borderRadius: [2, 2, 0, 0] },
      data: this.data,
    }
    const line: Record<string, unknown> = {
      type: 'line',
      smooth: true,
      // Dots variant marks every sample; area keeps the original
      // last-point dot; plain line stays clean.
      symbol: this.variant === 'dots' ? 'circle' : 'none',
      symbolSize: this.variant === 'dots' ? 5 : 0,
      showSymbol: this.variant === 'dots',
      endLabel: { show: false },
      lineStyle: { width: this.variant === 'area' ? 1.75 : 2, color },
      data:
        this.variant === 'area'
          ? this.data.map((v, i) => ({
            value: v,
            symbol: i === this.data.length - 1 ? 'circle' : 'none',
            symbolSize: i === this.data.length - 1 ? 5 : 0,
          }))
          : this.data,
    }
    if (this.variant === 'area') {
      // WHY (Rule51): flat area fill at low opacity -- no linear-gradient
      // wash. Gradients read as decoration, not data.
      line['areaStyle'] = { opacity: 0.12, color }
    }
    const series = [this.variant === 'bars' ? bars : line]
    const userOption: Record<string, any> = this.option ?? {}
    const { series: userSeries, ...userRest } = userOption
    const mergedSeries = Array.isArray(userSeries) ? series.map((s, i) => ({ ...s, ...(userSeries[i] ?? {}) })) : series
    return {
      grid: { left: 0, right: 0, top: 2, bottom: 2 },
      xAxis: { type: 'category', show: false, data: this.data.map((_, i) => i) },
      // WHY (Rule45): zero-based so a small trend can't read as a cliff.
      // Sparklines show shape; the zero base keeps them honest.
      yAxis: { type: 'value', show: false, min: 0 },
      tooltip: { show: false },
      series: mergedSeries,
      ...userRest,
    }
  }

  async ngAfterViewInit(): Promise<void> {
    if (typeof window === 'undefined' || !this.chartEl?.nativeElement) return
    const [{ use }, { CanvasRenderer }, { LineChart, BarChart }, { GridComponent, TooltipComponent }] =
      await Promise.all([
        import('echarts/core'),
        import('echarts/renderers'),
        import('echarts/charts'),
        import('echarts/components'),
      ])
    use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent])
    const { init } = await import('echarts/core')
    if (!(await whenSized(this.chartEl.nativeElement, () => !this.destroyed))) return
    this.chart = init(this.chartEl.nativeElement)
    this.chart.setOption(this.getOption())
    const { onChartThemeChange } = await import('../use-chart-theme')
    this.unsubscribeTheme = onChartThemeChange(() => this.chart?.setOption(this.getOption()))
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => this.chart?.resize()).observe(this.chartEl.nativeElement)
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.chart && (changes['data'] || changes['option'] || changes['color'] || changes['variant'])) {
      this.chart.setOption(this.getOption())
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true
    this.unsubscribeTheme?.()
    this.unsubscribeTheme = null
    try {
      this.chart?.dispose()
    } catch {
      /* already disposed */
    }
    this.chart = null
  }
}
