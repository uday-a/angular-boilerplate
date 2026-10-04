// One usage meter for Billing and Limits. Colour follows a single
// threshold rule: < 70% neutral, 70-89% warning, >= 90% destructive.
// Port of nuxt-boilerplate's `UsageBar.vue`.
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { cn } from '@/app/core/utils/cn'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-usage-bar, [ui-usage-bar]',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div class="space-y-1.5">
      <div class="flex items-baseline justify-between gap-3 text-sm">
        <span class="font-medium">
          {{ label }}
          @if (scope) {
            <span class="text-muted-foreground ml-1 text-xs font-normal">{{ scope }}</span>
          }
        </span>
        <span class="text-muted-foreground text-xs tabular-nums">
          {{ text }} <span [class]="pctClass">({{ pct }}%)</span>
        </span>
      </div>
      <div
        class="bg-muted h-1.5 w-full overflow-hidden rounded-full"
        role="progressbar"
        [attr.aria-label]="label"
        [attr.aria-valuenow]="pct"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div [class]="barClass" [style.width.%]="pct"></div>
      </div>
    </div>
  `,
})
export class UiUsageBarComponent {
  @Input() label = ''
  @Input() used = 0
  @Input() limit = 0
  /** Pre-formatted "used / limit" text; defaults to locale numbers. */
  @Input() valueText?: string
  /** Muted qualifier next to the label ("this month", "workspace total"). */
  @Input() scope?: string
  @Input('class') className?: string

  get pct(): number {
    return this.limit > 0 ? Math.min(100, Math.round((this.used / this.limit) * 100)) : 0
  }

  get text(): string {
    return this.valueText ?? `${this.used.toLocaleString()} / ${this.limit.toLocaleString()}`
  }

  get barClass(): string {
    const tone = this.pct >= 90 ? 'bg-destructive' : this.pct >= 70 ? 'bg-warning' : 'bg-primary'
    return cn('h-full rounded-full transition-[width] duration-200', tone)
  }

  get pctClass(): string {
    return this.pct >= 90
      ? 'text-destructive font-medium'
      : this.pct >= 70
        ? 'text-warning font-medium'
        : ''
  }
}
