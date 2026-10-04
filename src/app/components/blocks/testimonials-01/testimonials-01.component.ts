// Boilerplate testimonials: one quote card at a time with dot pagination.
// Port of next-boilerplate/components/blocks/Testimonials01.tsx 1:1.
import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core'
import { LucideAngularModule, Quote } from 'lucide-angular'
import { cn } from '@/app/core/utils/cn'
import { UiAvatarComponent, UiAvatarFallbackComponent } from '@/app/components/ui/avatar/avatar.component'
import { UiCardComponent, UiCardContentComponent } from '@/app/components/ui/card/card.component'

const TESTIMONIALS = [
  {
    quote:
      'We replaced four spreadsheets and two SaaS tools with this. Onboarding time dropped from 6 days to under 4 hours.',
    name: 'Aisha Rahman',
    role: 'Head of People',
    company: 'Northwind Logistics',
    initials: 'AR',
  },
  {
    quote:
      'The audit trail alone is worth it. SOC2 evidence collection went from a quarterly nightmare to a one-click export.',
    name: 'Marco Vidal',
    role: 'Director of Compliance',
    company: 'Helio Health',
    initials: 'MV',
  },
  {
    quote:
      'My favourite part is how fast it is. No spinners, no loading states. Search returns instantly across the entire org.',
    name: 'Tomoko Saito',
    role: 'IT Operations',
    company: 'Pixel & Co',
    initials: 'TS',
  },
]

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-testimonials-01, [ui-testimonials-01]',
  standalone: true,
  host: { '[attr.class]': '"contents"' },
  imports: [LucideAngularModule, UiAvatarComponent, UiAvatarFallbackComponent, UiCardComponent, UiCardContentComponent],
  template: `
    <section
      data-slot="testimonials-01"
      [class]="rootClass"
    >
      <div class="mx-auto max-w-4xl px-6 py-24">
        <div class="text-center">
          <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Testimonials</p>
          <h2 class="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Loved by teams everywhere</h2>
        </div>

        @let t = testimonials[active()];
        <div
          ui-card
          class="mt-10"
        >
          <div
            ui-card-content
            class="space-y-6 p-8 text-center"
          >
            <lucide-icon [img]="Quote" class="text-primary mx-auto block size-8" />
            <p class="text-foreground text-xl leading-relaxed sm:text-2xl">&ldquo;{{ t.quote }}&rdquo;</p>
            <div class="flex flex-col items-center gap-2">
              <ui-avatar class="size-12">
                <ui-avatar-fallback>{{ t.initials }}</ui-avatar-fallback>
              </ui-avatar>
              <div>
                <p class="text-sm font-semibold">{{ t.name }}</p>
                <p class="text-muted-foreground text-xs">{{ t.role }} · {{ t.company }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-center gap-2">
          @for (item of testimonials; track item.name; let i = $index) {
            <button
              type="button"
              [attr.aria-label]="'Show testimonial from ' + item.name"
              [attr.aria-current]="i === active()"
              [class]="dotClass(i)"
              (click)="active.set(i)"
            ></button>
          }
        </div>
      </div>
    </section>
  `,
})
export class UiTestimonials01Component {
  protected readonly Quote = Quote
  protected readonly testimonials = TESTIMONIALS

  @Input('class') className?: string

  readonly active = signal(0)

  get rootClass(): string {
    return cn('bg-muted/30', this.className)
  }

  dotClass(i: number): string {
    return cn(
      'size-2 rounded-full transition-all duration-200',
      i === this.active() ? 'bg-primary w-6' : 'bg-muted-foreground/30 hover:bg-muted-foreground/60',
    )
  }
}
