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
  computeFunnelStats,
  describeFunnelForAria,
  formatPct,
  formatStepPill,
  funnelBarOpacity,
  normalizeFunnelStages,
  type FunnelStageInput,
  type FunnelStep,
} from '@/app/core/dashboard/funnel'
import {
  getChartBgColor,
  getChartColors,
  getChartMutedColor,
  getChartTextColor,
  getChartTooltipBg,
  getChartTooltipBorder,
  getChartTooltipText,
  whenSized,
} from '../use-chart-theme'

// Solid stage colour = primary laid over the card surface at the depth
// opacity. Pre-blending (instead of item opacity) keeps the same-colour
// round-join stroke from showing as a darker ring where it overlaps the fill.
// A 1px canvas resolves any CSS colour format (hex, rgb, oklch).
function blendOver(fg: string, bg: string, alpha: number): string {
  if (alpha >= 1 || typeof document === 'undefined') return fg
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return fg
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 1, 1)
  ctx.globalAlpha = alpha
  ctx.fillStyle = fg
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Angular port of the UIPKGE FunnelChart — true ECharts funnel (triangle):
 * stage order top->bottom matches the data order via sort:'none'. Single-hue
 * chart-1 blue fading 1.0 -> 0.45 by depth; minSize keeps the tail wide
 * enough that its inside label hides cleanly instead of truncating.
 * Standalone, theme-aware, SSR-safe (ECharts lazy).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-funnel-chart, [ui-funnel-chart]',
  standalone: true,
  host: {
    '[attr.data-slot]': '"funnel-chart"',
    '[attr.data-uipkge]': '""',
    '[class]': 'hostClass',
  },
  template: `
    <div [class]="wrapperClass">
      <div
        #chartEl
        role="img"
        tabindex="0"
        [attr.aria-label]="effectiveAriaLabel()"
        [style.height]="heightStyle"
        class="w-full rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      ></div>
      <!-- Step-conversion pills: HTML (not canvas) so they wrap instead of
        clipping at narrow widths. The sr-only table below is the precise
        screen-reader source; these pills are the glanceable summary. -->
      @if (funnelStats().steps.length > 0) {
        <ul class="mt-3 flex flex-wrap gap-1.5" aria-label="Step conversion rates">
          @for (s of funnelStats().steps; track s.name; let i = $index) {
            <li class="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium tabular-nums">
              {{ stepPill(s) }}
            </li>
          }
        </ul>
      }
      <table class="sr-only">
        <caption>Conversion funnel by stage</caption>
        <thead>
          <tr>
            <th scope="col">Stage</th>
            <th scope="col">Count</th>
            <th scope="col">Step rate</th>
            <th scope="col">Cumulative</th>
          </tr>
        </thead>
        <tbody>
          @for (s of funnelStats().steps; track s.name; let i = $index) {
            <tr>
              <th scope="row">{{ s.name }}</th>
              <td>{{ s.value.toLocaleString() }}</td>
              <td>{{ s.stepRate === null ? '100% baseline' : formatPctValue(s.stepRate) + ' from ' + s.prevName }}</td>
              <td>{{ formatPctValue(s.cumulative) }} of top</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class UiFunnelChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() data: FunnelStageInput[] = []
  @Input() showLabels = true
  @Input() showLegend = false
  @Input() height: number | string = 300
  /** ECharts option escape hatch -- merged on top of the computed option. */
  @Input() option?: Record<string, unknown>
  /** Accessible name announced for the chart image. Defaults to the funnel description. */
  @Input() ariaLabel?: string
  @Input('class') className?: string

  @ViewChild('chartEl', { static: false }) chartEl?: ElementRef<HTMLDivElement>

  private chart: echarts.ECharts | null = null
  private destroyed = false
  private unsubscribeTheme: (() => void) | null = null

  get hostClass(): string {
    return cn('block w-full', this.className)
  }

  get wrapperClass(): string {
    return cn('w-full')
  }

  get heightStyle(): string {
    return /^\d+$/.test(String(this.height)) ? `${this.height}px` : String(this.height)
  }

  /** Normalized stages (legacy triangle `realValue` payloads resolve to real counts). */
  funnelStages() {
    return normalizeFunnelStages(this.data)
  }

  /** Range-aware stats for pills, the sr-only table and the accessible name. */
  funnelStats() {
    return computeFunnelStats(this.funnelStages())
  }

  effectiveAriaLabel(): string {
    return this.ariaLabel ?? describeFunnelForAria(this.funnelStats())
  }

  stepPill(step: FunnelStep): string {
    return formatStepPill(step)
  }

  formatPctValue(n: number): string {
    return formatPct(n)
  }

  /** Build the merged ECharts option (pure — no DOM needed, unit-testable). */
  getOption(): Record<string, unknown> {
    const stages = this.funnelStages()
    const stats = this.funnelStats()
    // --chart-1 blue, NOT --primary (--primary is near-monochrome in both
    // themes and reads black/white; chart-1 keeps its hue by token contract).
    const primary = getChartColors()[0] ?? '#2563eb'
    const base: Record<string, unknown> = {
      color: [primary],
      tooltip: {
        trigger: 'item',
        backgroundColor: getChartTooltipBg(),
        borderColor: getChartTooltipBorder(),
        textStyle: { color: getChartTooltipText(), fontSize: 12 },
        formatter: (p: { dataIndex: number }) => {
          const s = stats.steps[p.dataIndex]
          if (!s) return ''
          const lines = [
            `<strong>${s.name}</strong>`,
            `Count: ${s.value.toLocaleString()}`,
            s.stepRate === null
              ? 'Baseline: 100% of top'
              : `Step rate: ${formatPct(s.stepRate)} of ${s.prevName}`,
            `Cumulative: ${formatPct(s.cumulative)} of top`,
          ]
          if (s.delta !== null) {
            const sign = s.delta < 0 ? '−' : '+'
            lines.push(`Δ vs prior: ${sign}${Math.abs(s.delta).toLocaleString()}`)
          }
          return lines.join('<br/>')
        },
      },
      aria: { enabled: true, label: { description: this.effectiveAriaLabel() } },
      legend: this.showLegend
        ? { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 12, color: getChartTextColor() } }
        : undefined,
      series: [
        {
          name: 'Count',
          type: 'funnel',
          // Data order top->bottom (largest first in practice, but never
          // re-sorted -- equal stages keep their meaning).
          sort: 'none',
          orient: 'vertical',
          // Gap absorbs the 3px outer half of each stage's 6px round-join stroke
          // below, keeping a ~5px visible gutter between stages.
          gap: 11,
          // Tail floor: the last stage stays wide enough for its inside
          // label to hide cleanly instead of rendering truncated text.
          minSize: '28%',
          top: 8,
          bottom: 8,
          left: 8,
          right: 8,
          data: stages.map((s, i) => {
            const fill = blendOver(primary, getChartBgColor(), funnelBarOpacity(i, stages.length))
            return {
              name: s.name,
              value: s.value,
              itemStyle: {
                color: fill,
                // ECharts funnel polygons have no borderRadius; a same-colour
                // stroke with round joins softens the corners (~3px radius).
                borderColor: fill,
                borderWidth: 6,
                borderJoin: 'round',
              },
            }
          }),
          // Smooth grow-in: staggered per-stage rise with a soft cubic-out
          // ease, re-played on range changes.
          animationDuration: 700,
          animationEasing: 'cubicOut',
          animationDelay: (idx: number) => idx * 60,
          label: {
            show: this.showLabels,
            position: 'inside',
            // WHY (Rule2): inside-label ink comes from the surface token, not
            // a raw '#fff' -- it tracks light/dark like every other token.
            color: getChartBgColor(),
            fontSize: 12,
            fontWeight: 600,
            overflow: 'truncate',
            formatter: (p: { dataIndex: number }) => {
              const s = stats.steps[p.dataIndex]
              if (!s) return ''
              return `{t|${s.name}}\n{v|${s.value.toLocaleString()} · ${formatPct(s.cumulative)}}`
            },
            rich: {
              t: { fontSize: 12, fontWeight: 600, lineHeight: 16 },
              v: { fontSize: 12, fontWeight: 500, lineHeight: 16 },
            },
          },
          labelLayout: { hideOverlap: true },
          emphasis: { focus: 'self', scaleSize: 4 },
          // Non-hovered stages grey out (solid muted fill, readable label)
          // instead of ECharts' default near-transparent blur.
          blur: {
            itemStyle: { color: getChartMutedColor(), borderColor: getChartMutedColor(), opacity: 1 },
            label: { color: getChartTextColor(), opacity: 1 },
          },
        },
      ],
    }
    return { ...base, ...(this.option ?? {}) }
  }

  /** ECharts chart + component modules, resolved lazily so SSR never loads canvas code. */
  private chartModules(charts: Record<string, unknown>, comps: Record<string, unknown>): unknown[] {
    return [charts['FunnelChart'], comps['TooltipComponent'], comps['LegendComponent'], comps['AriaComponent']]
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
