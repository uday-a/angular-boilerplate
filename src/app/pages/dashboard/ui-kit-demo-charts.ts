// Charts demo for the /dashboard/ui-kit catalog (port of nuxt-boilerplate's
// ChartsDemo.vue). Its own file so ECharts lands in a separate lazy chunk.
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { UiBarChartComponent } from '@/app/components/ui/charts/bar-chart/bar-chart.component'
import { UiGaugeChartComponent } from '@/app/components/ui/charts/gauge-chart/gauge-chart.component'
import { UiLineChartComponent } from '@/app/components/ui/charts/line-chart/line-chart.component'
import { UiSparklineComponent } from '@/app/components/ui/charts/sparkline/sparkline.component'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ui-kit-demo-charts',
  standalone: true,
  imports: [UiBarChartComponent, UiGaugeChartComponent, UiLineChartComponent, UiSparklineComponent],
  template: `
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="space-y-1 sm:col-span-2">
        <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">LineChart</p>
        <ui-line-chart [data]="revenue" xField="x" [yField]="['revenue', 'expenses']" [height]="200" />
      </div>
      <div class="space-y-1">
        <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">BarChart</p>
        <ui-bar-chart [data]="deploys" [height]="160" />
      </div>
      <div class="space-y-1">
        <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">GaugeChart</p>
        <ui-gauge-chart [value]="68" unit="%" [height]="160" />
      </div>
      <div class="space-y-1 sm:col-span-2">
        <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Sparkline</p>
        <ui-sparkline [data]="spark" [height]="36" />
      </div>
    </div>
  `,
})
export class UiKitChartsDemoComponent {
  protected readonly revenue = [
    { x: 'Apr', revenue: 42, expenses: 30 },
    { x: 'May', revenue: 48, expenses: 32 },
    { x: 'Jun', revenue: 51, expenses: 35 },
    { x: 'Jul', revenue: 58, expenses: 36 },
    { x: 'Aug', revenue: 63, expenses: 38 },
    { x: 'Sep', revenue: 71, expenses: 41 },
  ]
  protected readonly deploys = [
    { x: 'Mon', y: 12 },
    { x: 'Tue', y: 18 },
    { x: 'Wed', y: 9 },
    { x: 'Thu', y: 21 },
    { x: 'Fri', y: 15 },
  ]
  protected readonly spark = [4, 6, 5, 8, 7, 9, 12, 11, 14]
}
