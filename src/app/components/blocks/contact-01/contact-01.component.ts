// Boilerplate contact section: info column (email/phone/office + map
// placeholder) + message card with sent confirmation state.
// Port of nuxt-boilerplate/app/components/blocks/Contact01.vue 1:1 —
// emits `submit` with the form payload; the consumer wires delivery.
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core'
import { CheckCircle2, LucideAngularModule, Mail, MapPin, Phone, Send } from 'lucide-angular'
import { cn } from '@/app/core/utils/cn'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card/card.component'
import { UiInputComponent } from '@/app/components/ui/input/input.component'
import { UiLabelComponent } from '@/app/components/ui/label/label.component'
import {
  UiSelectComponent,
  UiSelectContentComponent,
  UiSelectItemComponent,
  UiSelectTriggerComponent,
  UiSelectValueComponent,
} from '@/app/components/ui/select/select.component'
import { UiTextareaComponent } from '@/app/components/ui/textarea/textarea.component'

export interface Contact01SubmitPayload {
  name: string
  email: string
  company: string
  subject: string
  message: string
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-contact-01, [ui-contact-01]',
  standalone: true,
  host: { '[attr.class]': '"contents"' },
  imports: [
    LucideAngularModule,
    UiButtonComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
    UiInputComponent,
    UiLabelComponent,
    UiSelectComponent,
    UiSelectContentComponent,
    UiSelectItemComponent,
    UiSelectTriggerComponent,
    UiSelectValueComponent,
    UiTextareaComponent,
  ],
  template: `
    <section
      data-slot="contact-01"
      [class]="rootClass"
    >
      <div class="mx-auto max-w-6xl px-6 py-24">
        <div class="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div class="space-y-6">
            <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Contact</p>
            <h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">Talk to a human</h2>
            <p class="text-muted-foreground text-lg">
              Tell us a bit about your team and we'll show you how we'd fit. Average reply: 4 hours.
            </p>

            <div class="space-y-3 pt-4">
              <div class="flex items-center gap-3">
                <div class="bg-primary/10 text-primary rounded-lg p-2">
                  <lucide-icon [img]="Mail" class="size-4" />
                </div>
                <div>
                  <p class="text-muted-foreground text-xs uppercase">Email</p>
                  <a
                    href="mailto:hello@acme.test"
                    class="text-sm font-medium hover:underline"
                  >
                    hello&#64;acme.test
                  </a>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="bg-primary/10 text-primary rounded-lg p-2">
                  <lucide-icon [img]="Phone" class="size-4" />
                </div>
                <div>
                  <p class="text-muted-foreground text-xs uppercase">Phone</p>
                  <p class="text-sm font-medium">+1 (415) 555-0142</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="bg-primary/10 text-primary rounded-lg p-2">
                  <lucide-icon [img]="MapPin" class="size-4" />
                </div>
                <div>
                  <p class="text-muted-foreground text-xs uppercase">Office</p>
                  <p class="text-sm font-medium">120 Howard St, San Francisco</p>
                </div>
              </div>
            </div>

            <div class="bg-muted/40 mt-6 flex h-48 items-center justify-center rounded-lg border border-dashed">
              <p class="text-muted-foreground text-sm">Map placeholder</p>
            </div>
          </div>

          <div ui-card>
            @if (!sent()) {
              <div ui-card-header>
                <h3 ui-card-title>Send us a message</h3>
                <p ui-card-description>We reply during business hours (PT)</p>
              </div>
              <div ui-card-content>
                <form
                  class="space-y-4"
                  (submit)="onSubmit($event)"
                >
                  <div class="grid gap-4 sm:grid-cols-2">
                    <div class="grid gap-2">
                      <label ui-label for="contact-name">Name</label>
                      <ui-input
                        id="contact-name"
                        [value]="name()"
                        (valueChange)="name.set($event)"
                        required
                      />
                    </div>
                    <div class="grid gap-2">
                      <label ui-label for="contact-email">Work email</label>
                      <ui-input
                        id="contact-email"
                        [value]="email()"
                        (valueChange)="email.set($event)"
                        type="email"
                        required
                      />
                    </div>
                  </div>
                  <div class="grid gap-2">
                    <label ui-label for="contact-company">Company</label>
                    <ui-input
                      id="contact-company"
                      [value]="company()"
                      (valueChange)="company.set($event)"
                    />
                  </div>
                  <div class="grid gap-2">
                    <label ui-label for="contact-subject">I'm interested in</label>
                    <ui-select
                      [value]="subject()"
                      (valueChange)="subject.set($event)"
                    >
                      <button ui-select-trigger id="contact-subject">
                        <ui-select-value />
                      </button>
                      <ui-select-content>
                        <ui-select-item value="sales">Talking to sales</ui-select-item>
                        <ui-select-item value="support">Customer support</ui-select-item>
                        <ui-select-item value="partnership">Partnerships</ui-select-item>
                        <ui-select-item value="other">Something else</ui-select-item>
                      </ui-select-content>
                    </ui-select>
                  </div>
                  <div class="grid gap-2">
                    <label ui-label for="contact-message">Message</label>
                    <ui-textarea
                      id="contact-message"
                      [value]="message()"
                      (valueChange)="message.set($event)"
                      placeholder="How can we help?"
                      required
                    />
                  </div>
                  <button
                    ui-button
                    type="submit"
                    class="w-full"
                    [disabled]="!canSubmit()"
                  >
                    Send message
                    <lucide-icon [img]="Send" class="ml-2 size-4" />
                  </button>
                </form>
              </div>
            } @else {
              <div
                ui-card-content
                class="space-y-4 pt-8 text-center"
              >
                <div
                  class="bg-[var(--success)]/10 text-[var(--success)] mx-auto flex size-12 items-center justify-center rounded-full"
                >
                  <lucide-icon [img]="CheckCircle2" class="size-6" />
                </div>
                <div class="space-y-1">
                  <h3 class="text-lg font-semibold">Message sent</h3>
                  <p class="text-muted-foreground text-sm">
                    Thanks {{ name() }}, we'll be in touch within a few hours.
                  </p>
                </div>
                <button
                  ui-button
                  variant="outline"
                  (click)="sent.set(false)"
                >
                  Send another
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
})
export class UiContact01Component {
  protected readonly CheckCircle2 = CheckCircle2
  protected readonly Mail = Mail
  protected readonly MapPin = MapPin
  protected readonly Phone = Phone
  protected readonly Send = Send

  @Input('class') className?: string

  @Output() readonly submit = new EventEmitter<Contact01SubmitPayload>()

  readonly name = signal('')
  readonly email = signal('')
  readonly company = signal('')
  readonly subject = signal('sales')
  readonly message = signal('')
  readonly sent = signal(false)

  readonly canSubmit = computed(() => !!this.name() && !!this.email() && !!this.message())

  get rootClass(): string {
    return cn('bg-background', this.className)
  }

  onSubmit(event: Event): void {
    event.preventDefault()
    if (!this.canSubmit()) return
    this.submit.emit({
      name: this.name(),
      email: this.email(),
      company: this.company(),
      subject: this.subject(),
      message: this.message(),
    })
    this.sent.set(true)
  }
}
