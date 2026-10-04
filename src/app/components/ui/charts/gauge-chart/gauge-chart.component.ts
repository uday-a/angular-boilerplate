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
import {
  getChartTextColor,
  gaugeThresholds,
  whenSized,
} from '../use-chart-theme'

/**
 * Angular port of the UIPKGE GaugeChart — single-value dial with
 * progress arc and animated detail readout. Standalone, theme-aware.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-gauge-chart, [ui-gauge-chart]',
  standalone: true,
  host: {
    '[attr.data-slot]': '"gauge-chart"',
    '[attr.data-uipkge]': '""',
    '[class]': 'hostClass',
    '[attr.role]': '"img"',
    '[attr.aria-label]': 'ariaLabel || "Chart"',
    '[attr.tabindex]': '0',
    '[style.height]': 'heightStyle',
  },
  template: `<div #chartEl class="size-full"></div>`,
})
export class UiGaugeChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  /** Current value. Default 0. */
  @Input() value = 0
  /** Scale minimum. Default 0. */
  @Input() min = 0
  /** Scale maximum. Default 100. */
  @Input() max = 100
  /** Dial label. Default 'Score'. */
  @Input() name = 'Score'
  /** Show progress arc. Default true. */
  @Input() progress = true
  /** Unit suffix for the detail readout. Default ''. */
  @Input() unit = ''
  /** Dial label, like React/Vue (`data[0].name`); falls back to `name` when unset. */
  @Input() label?: string
  /** Colour stops as [percentage, hex] pairs. Defaults to the shared gaugeThresholds. */
  @Input() thresholds: [number, string][] = gaugeThresholds
  @Input() height: number | string = 220
  @Input() option?: Record<string, unknown>
  /** Accessible name announced for the chart image. Defaults to "Chart". */
  @Input() ariaLabel?: string
  @Input('class') className?: string

  ratio(): number {
    if (this.max <= this.min) return 0
    return Math.min(1, Math.max(0, (this.value - this.min) / (this.max - this.min)))
  }
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

  /** Build the merged ECharts option (pure — no DOM needed, unit-testable). */
  getOption(): Record<string, unknown> {
    const userOption: Record<string, any> = this.option ?? {}
    const { series: userSeries, ...userRest } = userOption
    return {
      series: Array.isArray(userSeries)
        ? userSeries
        : [
            {
              type: 'gauge',
              min: this.min,
              max: this.max,
              // Layout from the Vue GaugeChart: the arc sits lower and the
              // readout + label get explicit offsets, so at small heights the
              // value never collides with the axis labels or the title.
              center: ['50%', '60%'],
              radius: '85%',
              startAngle: 200,
              endAngle: -20,
              progress: { show: this.progress, width: 14 },
              axisLine: {
                lineStyle: { width: 14, color: this.thresholds.map(([stop, color]) => [stop, color]) },
              },
              axisTick: { show: false },
              splitLine: { show: false },
              axisLabel: { color: getChartTextColor(), fontSize: 11, distance: -34 },
              pointer: { show: false },
              anchor: { show: false },
              detail: {
                valueAnimation: true,
                fontSize: 28,
                fontWeight: 600,
                color: getChartTextColor(),
                formatter: `{value}${this.unit ? ' ' + this.unit : ''}`,
                offsetCenter: [0, '40%'],
              },
              title: { color: getChartTextColor(), fontSize: 12, fontWeight: 500, offsetCenter: [0, '88%'] },
              data: [{ value: this.value, name: this.label ?? this.name }],
            },
          ],
      ...userRest,
    }
  }

  /** ECharts chart + component modules, resolved lazily so SSR never loads canvas code. */
  private chartModules(charts: Record<string, unknown>, comps: Record<string, unknown>): unknown[] {
    return [charts['GaugeChart'], comps['TitleComponent']]
  }

  async ngAfterViewInit(): Promise<void> {
    if (typeof window === 'undefined' || !this.chartEl?.nativeElement) return
    const [{ use }, { CanvasRenderer }, charts, comps] = await Promise.all([
      import('echarts/core'),
      import('echarts/renderers'),
      import('echarts/charts'),
      import('echarts/components'),
    ])
    use([CanvasRenderer, ...(this.chartModules(charts, comps) as never[])])
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
    if (this.chart && Object.keys(changes).length) {
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
