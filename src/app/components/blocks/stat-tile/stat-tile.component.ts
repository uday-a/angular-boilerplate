// The app's one stat tile. Every KPI strip (dashboard, calendar,
// activity, locations) uses this so label, number and delta read the
// same everywhere. Port of nuxt-boilerplate's `StatTile.vue`
// (see also next-boilerplate `StatTile.tsx`). Content projects under the
// number; `footer` is a muted line pinned to the bottom.
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import type { LucideIconData } from 'lucide-angular'
import { Info, LucideAngularModule, TrendingDown, TrendingUp } from 'lucide-angular'
import { cn } from '@/app/core/utils/cn'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardHeaderComponent,
} from '@/app/components/ui/card'
import {
  UiTooltipComponent,
  UiTooltipContentComponent,
  UiTooltipProviderComponent,
  UiTooltipTriggerComponent,
} from '@/app/components/ui/tooltip/tooltip.component'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-stat-tile, [ui-stat-tile]',
  standalone: true,
  host: { '[attr.class]': '"contents"' },
  imports: [
    LucideAngularModule,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardHeaderComponent,
    UiTooltipComponent,
    UiTooltipContentComponent,
    UiTooltipProviderComponent,
    UiTooltipTriggerComponent,
  ],
  template: `
    <div ui-card [class]="rootClass">
      <div ui-card-header class="px-4 pt-4 pb-1">
        <p
          ui-card-description
          class="text-muted-foreground flex items-center justify-between gap-2 text-xs font-medium tracking-wider uppercase"
        >
          <span class="flex min-w-0 items-center gap-1.5">
            @if (dotClass) {
              <span [class]="cn('size-2 shrink-0 rounded-full', dotClass)" aria-hidden="true"></span>
            }
            <span class="truncate" [title]="label">{{ label }}</span>
            @if (definition) {
              <ui-tooltip-provider>
                <ui-tooltip>
                  <button
                    type="button"
                    ui-tooltip-trigger
                    class="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex shrink-0 items-center rounded focus-visible:ring-2 focus-visible:outline-none"
                    [attr.aria-label]="label + ' definition'"
                  >
                    <lucide-icon [img]="InfoIcon" class="size-3.5" />
                  </button>
                  <ui-tooltip-content class="max-w-56 text-xs">{{ definition }}</ui-tooltip-content>
                </ui-tooltip>
              </ui-tooltip-provider>
            }
          </span>
          @if (icon) {
            <lucide-icon [img]="icon" class="text-muted-foreground size-4 shrink-0" />
          }
        </p>
      </div>
      <div ui-card-content class="flex flex-1 flex-col px-4 pb-4">
        <div class="flex flex-wrap items-baseline gap-x-2">
          <span class="text-2xl font-semibold tracking-tight tabular-nums">{{ value }}</span>
          @if (delta) {
            <span [class]="deltaClass">
              <lucide-icon [img]="deltaDown ? TrendingDownIcon : TrendingUpIcon" class="size-3" />
              {{ delta }}
            </span>
          }
        </div>
        @if (caption) {
          <p class="text-muted-foreground mt-0.5 text-xs">{{ caption }}</p>
        }
        <ng-content />
        @if (hasFooter) {
          <div class="text-muted-foreground mt-auto pt-3 text-xs">
            <ng-content select="[slot=footer]" />
          </div>
        }
      </div>
    </div>
  `,
})
export class UiStatTileComponent {
  /** Uppercase label row. */
  @Input() label = ''
  /** Big number string (pre-formatted by the caller). */
  @Input() value = ''
  /** Delta string, e.g. `+14%`. */
  @Input() delta?: string
  /**
   * Tone for the delta string. Default 'positive'. Use 'negative' when
   * the metric is "up = bad" (latency) — direction can't be inferred
   * from the sign because churn going DOWN is good.
   */
  @Input() deltaTone: 'positive' | 'negative' = 'positive'
  /** Short muted unit/context under the value ("sessions/day"). */
  @Input() caption?: string
  @Input() icon?: LucideIconData
  /** Category dot before the label, e.g. 'bg-chart-1'. */
  @Input() dotClass?: string
  // WHY (Rule97): optional formula/grain note rendered as an info tooltip
  // next to the label so a KPI's definition is one hover away.
  @Input() definition?: string
  /** Set when projecting a `[slot=footer]` node (pins the footer styles). */
  @Input() hasFooter = false
  @Input('class') className?: string

  protected readonly cn = cn
  protected readonly InfoIcon = Info
  protected readonly TrendingUpIcon = TrendingUp
  protected readonly TrendingDownIcon = TrendingDown

  // WHY (Rules 37/40): color never carries direction alone -- a shape
  // (TrendingUp/TrendingDown) rides next to the delta. Sign is read from the
  // string ('-', '−' and '↓' count as down); tone only picks the color.
  get deltaDown(): boolean {
    const d = (this.delta ?? '').trim()
    return d.startsWith('-') || d.startsWith('−') || d.startsWith('↓')
  }

  get rootClass(): string {
    return cn('flex flex-col', this.className)
  }

  get deltaClass(): string {
    return cn(
      'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
      this.deltaTone === 'negative' ? 'text-destructive' : 'text-success',
    )
  }
}
