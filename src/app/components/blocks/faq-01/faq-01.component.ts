// Boilerplate FAQ: centred heading + single-open collapsible accordion of six
// questions. Port of next-boilerplate/components/blocks/Faq01.tsx 1:1.
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { cn } from '@/app/core/utils/cn'
import {
  UiAccordionComponent,
  UiAccordionContentComponent,
  UiAccordionHeaderComponent,
  UiAccordionItemComponent,
  UiAccordionTriggerComponent,
} from '@/app/components/ui/accordion/accordion.component'

const FAQS = [
  {
    value: 'trial',
    question: 'How does the 14-day free trial work?',
    answer:
      'Sign up with a work email — no credit card. You get every feature on the Team plan for 14 days. At the end of the trial you pick a plan or your workspace switches to read-only until you do; nothing is deleted.',
  },
  {
    value: 'migration',
    question: 'Can we migrate from our current tool?',
    answer:
      'Yes. Most teams import people, time off balances and org structure with one CSV. We have prebuilt importers for BambooHR, Personio, Rippling and Gusto; for everything else, our team will run the migration with you free of charge.',
  },
  {
    value: 'security',
    question: 'Is our employee data secure?',
    answer:
      'SOC 2 Type II, ISO 27001, GDPR and HIPAA compliant. Data is encrypted at rest (AES-256) and in transit (TLS 1.3). EU customers stay on EU-region infrastructure. Full audit trail is available on every plan.',
  },
  {
    value: 'pricing',
    question: 'What does the per-user pricing include?',
    answer:
      'All core modules — directory, payroll, time off, performance, onboarding — are included on the Team plan. SSO, SCIM, audit logs and a dedicated success manager are Enterprise-only. There are no per-feature add-ons.',
  },
  {
    value: 'support',
    question: 'What support do we get?',
    answer:
      'Email support is included on every plan with a 4-hour business-hours reply. Team and Enterprise customers get a shared Slack channel; Enterprise adds a named success manager and a 99.99% uptime SLA with credits.',
  },
  {
    value: 'cancel',
    question: 'How do we cancel?',
    answer:
      'One click in Settings → Billing. We charge month-to-month or annually; if you cancel mid-cycle, your workspace stays active through the end of the period and you can export all data as CSV or JSON before it ends.',
  },
]

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-faq-01, [ui-faq-01]',
  standalone: true,
  host: { '[attr.class]': '"contents"' },
  imports: [
    UiAccordionComponent,
    UiAccordionContentComponent,
    UiAccordionHeaderComponent,
    UiAccordionItemComponent,
    UiAccordionTriggerComponent,
  ],
  template: `
    <section
      data-slot="faq-01"
      [class]="rootClass"
    >
      <div class="mx-auto max-w-3xl px-6 py-24">
        <div class="text-center">
          <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">FAQ</p>
          <h2 class="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Questions, answered</h2>
          <p class="text-muted-foreground mx-auto mt-3 max-w-xl text-lg">
            Anything we missed? Email<a
              href="mailto:hello@acme.test"
              class="hover:text-foreground underline underline-offset-4"
              >hello@acme.test</a
            >and we'll reply within a day.
          </p>
        </div>

        <ui-accordion
          type="single"
          collapsible
          class="mt-10 w-full"
        >
          @for (faq of faqs; track faq.value) {
            <ui-accordion-item [value]="faq.value">
              <h3 ui-accordion-header>
                <button ui-accordion-trigger>{{ faq.question }}</button>
              </h3>
              <ui-accordion-content>{{ faq.answer }}</ui-accordion-content>
            </ui-accordion-item>
          }
        </ui-accordion>
      </div>
    </section>
  `,
})
export class UiFaq01Component {
  protected readonly faqs = FAQS

  @Input('class') className?: string

  get rootClass(): string {
    return cn('bg-background', this.className)
  }
}
