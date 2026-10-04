// Boilerplate features: eyebrow + headline over a 1 / 2 / 3-column grid of six
// module cards (icon tile, title, one-line description).
// Port of next-boilerplate/components/blocks/Features01.tsx 1:1.
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { BarChart3, Calendar, FileCheck2, LucideAngularModule, ShieldCheck, Users, Wallet } from 'lucide-angular'
import { cn } from '@/app/core/utils/cn'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card/card.component'

const FEATURES = [
  {
    icon: Users,
    title: 'Employee directory',
    description: 'Single source of truth for people, roles and reporting lines — searchable and exportable.',
  },
  {
    icon: Wallet,
    title: 'Payroll',
    description: 'Multi-currency runs with automatic tax filing and direct deposit. Pause and resume in one click.',
  },
  {
    icon: BarChart3,
    title: 'Performance',
    description: 'OKRs, 1:1s, 360 reviews and continuous feedback all linked to the org chart.',
  },
  {
    icon: FileCheck2,
    title: 'Onboarding',
    description: '34 templated tasks split across pre-start, day 1, week 1, month 1 and 90-day milestones.',
  },
  {
    icon: Calendar,
    title: 'Time off',
    description: 'Accrual-based leave with manager approval workflow and shared team calendar.',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance',
    description: 'GDPR, SOC2 and HIPAA-ready audit trails. Right-to-erasure built in.',
  },
]

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-features-01, [ui-features-01]',
  standalone: true,
  host: { '[attr.class]': '"contents"' },
  imports: [LucideAngularModule, UiCardComponent, UiCardContentComponent, UiCardHeaderComponent, UiCardTitleComponent],
  template: `
    <section
      data-slot="features-01"
      [class]="rootClass"
    >
      <div class="mx-auto max-w-6xl px-6 py-24">
        <div class="mb-12 max-w-2xl space-y-3">
          <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Features</p>
          <h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">Everything teams need, nothing they don't.</h2>
          <p class="text-muted-foreground text-lg">
            Six modules that work together out of the box. Pay only for what you use.
          </p>
        </div>
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          @for (feature of features; track feature.title) {
            <div ui-card>
              <div
                ui-card-header
                class="space-y-3"
              >
                <div class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                  <lucide-icon [img]="feature.icon" class="size-5" />
                </div>
                <h3 ui-card-title class="text-base">{{ feature.title }}</h3>
              </div>
              <div ui-card-content>
                <p class="text-muted-foreground text-sm">{{ feature.description }}</p>
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class UiFeatures01Component {
  protected readonly features = FEATURES

  @Input('class') className?: string

  get rootClass(): string {
    return cn('bg-background', this.className)
  }
}
