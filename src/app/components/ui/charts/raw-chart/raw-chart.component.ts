import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input,
  OnChanges, OnDestroy, SimpleChanges, ViewChild,
} from '@angular/core'
import type * as echarts from 'echarts/core'
import { cn } from '@/app/core/utils/cn'
import { whenSized } from '../use-chart-theme'

/**
 * Angular port of UIPKGE RawChart — renders an arbitrary ECharts option
 * verbatim (no series scaffolding). The caller owns echarts registration
 * intent via the option; this wrapper lazy-loads the union the dashboard
 * needs (bar + line + gauge + grid + legend + tooltip) so SSR never loads
 * canvas code. Theme-aware via onChartThemeChange. Standalone.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-raw-chart, [ui-raw-chart]',
  standalone: true,
  host: {
    '[attr.data-slot]': '"raw-chart"',
    '[attr.data-uipkge]': '""',
    '[class]': 'hostClass',
    '[attr.role]': '"img"',
    '[attr.aria-label]': 'ariaLabel || "Chart"',
    '[attr.tabindex]': '0',
    '[style.height]': 'heightStyle',
  },
  template: `<div #chartEl class="size-full"></div>`,
})
export class UiRawChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() option?: Record<string, unknown>
  @Input() height: number | string = 300
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

  getOption(): Record<string, unknown> {
    return this.option ?? {}
  }

  async ngAfterViewInit(): Promise<void> {
    if (typeof window === 'undefined' || !this.chartEl?.nativeElement) return
    const [{ use }, { CanvasRenderer }, charts, comps] = await Promise.all([
      import('echarts/core'),
      import('echarts/renderers'),
      import('echarts/charts'),
      import('echarts/components'),
    ])
    use([
      CanvasRenderer,
      charts['BarChart'],
      charts['LineChart'],
      charts['GaugeChart'],
      comps['GridComponent'],
      comps['LegendComponent'],
      comps['TooltipComponent'],
    ] as never[])
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
    if (this.chart && changes['option']) {
      this.chart.setOption(this.getOption(), true)
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
