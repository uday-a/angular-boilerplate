// Boilerplate pricing: monthly/yearly toggle + Starter/Team/Enterprise tiers.
// Plan keys match `Plan` in server/utils/polar.ts so the parent page can pass
// them straight to /api/billing/checkout.
// Port of nuxt-boilerplate/app/components/blocks/Pricing01.vue 1:1 — emits
// `subscribe` (plan, cycle) and `contactSales`; the consumer wires checkout.
// Unbound outputs fall back to plain links (/sign-up, /login), like Next's
// optional onSubscribe / onContactSales props.
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, booleanAttribute, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Check, LucideAngularModule, Sparkles } from 'lucide-angular'
import { cn } from '@/app/core/utils/cn'
import { UiBadgeComponent } from '@/app/components/ui/badge/badge.component'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardFooterComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card/card.component'
import {
  UiToggleGroupComponent,
  UiToggleGroupItemComponent,
} from '@/app/components/ui/toggle-group/toggle-group.component'

export type Pricing01Cycle = 'monthly' | 'yearly'
export type Pricing01Plan = 'pro' | 'team' | 'enterprise'

export interface Pricing01SubscribeEvent {
  plan: Pricing01Plan
  cycle: Pricing01Cycle
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-pricing-01, [ui-pricing-01]',
  standalone: true,
  host: { '[attr.class]': '"contents"' },
  imports: [
    RouterLink,
    LucideAngularModule,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardFooterComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
    UiToggleGroupComponent,
    UiToggleGroupItemComponent,
  ],
  template: `
    <section
      data-slot="pricing-01"
      [class]="rootClass"
    >
      <div class="mx-auto max-w-6xl px-6" [class]="page ? 'py-4' : 'py-24'">
        <div class="mb-10 text-center">
          @if (page) {
            <h1 class="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Plans for teams of every size</h1>
          } @else {
            <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Pricing</p>
            <h2 class="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Plans for teams of every size</h2>
          }
          <p class="text-muted-foreground mx-auto mt-3 max-w-xl text-lg">
            No hidden fees. Cancel anytime. Save 20% with annual billing.
          </p>

          <div class="mt-6 inline-flex">
            <ui-toggle-group
              type="single"
              [value]="cycle()"
              (valueChange)="onCycleChange($event)"
            >
              <button ui-toggle-group-item value="monthly">Monthly</button>
              <button ui-toggle-group-item value="yearly">
                Yearly
                <span
                  ui-badge
                  variant="secondary"
                  class="ml-2"
                >
                  −20%
                </span>
              </button>
            </ui-toggle-group>
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-3">
          <div ui-card>
            <div ui-card-header>
              <h3 ui-card-title class="text-xl">Starter</h3>
              <p ui-card-description>For small teams trying things out.</p>
              <div class="mt-4 flex items-baseline gap-1">
                <span class="text-4xl font-semibold tracking-tight tabular-nums"> &#36;{{ cycle() === 'monthly' ? 9 : 7 }} </span>
                <span class="text-muted-foreground text-sm">/ user / month</span>
              </div>
            </div>
            <div ui-card-content>
              <ul class="space-y-3 text-sm">
                <li class="flex items-start gap-2">
                  <lucide-icon [img]="Check" class="text-success mt-0.5 size-4 shrink-0" />
                  <span>Up to 10 employees</span>
                </li>
                <li class="flex items-start gap-2">
                  <lucide-icon [img]="Check" class="text-success mt-0.5 size-4 shrink-0" />
                  <span>Core HR + directory</span>
                </li>
                <li class="flex items-start gap-2">
                  <lucide-icon [img]="Check" class="text-success mt-0.5 size-4 shrink-0" />
                  <span>Time off + holidays</span>
                </li>
                <li class="flex items-start gap-2">
                  <lucide-icon [img]="Check" class="text-success mt-0.5 size-4 shrink-0" />
                  <span>Email support</span>
                </li>
              </ul>
            </div>
            <div ui-card-footer>
              @if (subscribe.observed) {
                <button
                  ui-button
                  class="w-full"
                  variant="outline"
                  (click)="subscribe.emit({ plan: 'pro', cycle: cycle() })"
                >
                  Start free
                </button>
              } @else {
                <a ui-button routerLink="/sign-up" class="w-full" variant="outline">Start free</a>
              }
            </div>
          </div>

          <div class="relative">
            <span
              ui-badge
              class="absolute -top-3 left-1/2 z-10 -translate-x-1/2 gap-1 shadow-sm"
            >
              <lucide-icon [img]="Sparkles" class="size-3" /> Most popular
            </span>
            <div
              ui-card
              class="border-primary ring-primary/10 shadow-sm ring-1"
            >
              <div ui-card-header>
                <h3 ui-card-title class="text-xl">Team</h3>
                <p ui-card-description>For growing companies scaling people ops.</p>
                <div class="mt-4 flex items-baseline gap-1">
                  <span class="text-4xl font-semibold tracking-tight tabular-nums"> &#36;{{ cycle() === 'monthly' ? 29 : 24 }} </span>
                  <span class="text-muted-foreground text-sm">/ user / month</span>
                </div>
              </div>
              <div ui-card-content>
                <ul class="space-y-3 text-sm">
                  <li class="flex items-start gap-2">
                    <lucide-icon [img]="Check" class="text-success mt-0.5 size-4 shrink-0" />
                    <span>Unlimited employees</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <lucide-icon [img]="Check" class="text-success mt-0.5 size-4 shrink-0" />
                    <span>Payroll + tax filing</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <lucide-icon [img]="Check" class="text-success mt-0.5 size-4 shrink-0" />
                    <span>Onboarding workflows</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <lucide-icon [img]="Check" class="text-success mt-0.5 size-4 shrink-0" />
                    <span>Performance reviews</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <lucide-icon [img]="Check" class="text-success mt-0.5 size-4 shrink-0" />
                    <span>Slack + priority support</span>
                  </li>
                </ul>
              </div>
              <div ui-card-footer>
                @if (subscribe.observed) {
                  <button
                    ui-button
                    class="w-full"
                    (click)="subscribe.emit({ plan: 'team', cycle: cycle() })"
                  >
                    Start 14-day trial
                  </button>
                } @else {
                  <a ui-button routerLink="/sign-up" class="w-full">Start 14-day trial</a>
                }
              </div>
            </div>
          </div>

          <div ui-card>
            <div ui-card-header>
              <h3 ui-card-title class="text-xl">Enterprise</h3>
              <p ui-card-description>Custom controls for regulated industries.</p>
              <div class="mt-4 flex items-baseline gap-1">
                <span class="text-3xl font-semibold tracking-tight">Custom</span>
              </div>
            </div>
            <div ui-card-content>
              <ul class="space-y-3 text-sm">
                <li class="flex items-start gap-2">
                  <lucide-icon [img]="Check" class="text-success mt-0.5 size-4 shrink-0" />
                  <span>Everything in Team</span>
                </li>
                <li class="flex items-start gap-2">
                  <lucide-icon [img]="Check" class="text-success mt-0.5 size-4 shrink-0" />
                  <span>SSO + SCIM provisioning</span>
                </li>
                <li class="flex items-start gap-2">
                  <lucide-icon [img]="Check" class="text-success mt-0.5 size-4 shrink-0" />
                  <span>Audit logs + role policies</span>
                </li>
                <li class="flex items-start gap-2">
                  <lucide-icon [img]="Check" class="text-success mt-0.5 size-4 shrink-0" />
                  <span>Dedicated success manager</span>
                </li>
                <li class="flex items-start gap-2">
                  <lucide-icon [img]="Check" class="text-success mt-0.5 size-4 shrink-0" />
                  <span>99.99% SLA</span>
                </li>
              </ul>
            </div>
            <div ui-card-footer>
              @if (contactSales.observed) {
                <button
                  ui-button
                  class="w-full"
                  variant="outline"
                  (click)="contactSales.emit()"
                >
                  Talk to sales
                </button>
              } @else {
                <a ui-button routerLink="/login" class="w-full" variant="outline">Talk to sales</a>
              }
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class UiPricing01Component {
  protected readonly Check = Check
  protected readonly Sparkles = Sparkles

  // `page` renders the heading as the page's H1 (on /pricing) and drops the
  // eyebrow, so the page has one heading hierarchy.
  @Input({ transform: booleanAttribute }) page = false
  @Input('class') className?: string

  @Output() readonly subscribe = new EventEmitter<Pricing01SubscribeEvent>()
  @Output() readonly contactSales = new EventEmitter<void>()

  readonly cycle = signal<Pricing01Cycle>('monthly')

  get rootClass(): string {
    return cn('bg-background', this.className)
  }

  onCycleChange(value: string): void {
    if (value === 'monthly' || value === 'yearly') this.cycle.set(value)
  }
}
