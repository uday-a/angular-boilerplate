// Support — mirrors nuxt-boilerplate `app/pages/support/index.vue` 1:1:
// status banner + channel cards + FAQ accordion. Fully static content.
import { Component, inject } from '@angular/core'
import { Title } from '@angular/platform-browser'
import {
  BookOpen,
  CircleCheck,
  ExternalLink,
  LifeBuoy,
  LucideAngularModule,
  Mail,
  MessageSquare,
  type LucideIconData,
} from 'lucide-angular'
import {
  UiAccordionComponent,
  UiAccordionContentComponent,
  UiAccordionItemComponent,
  UiAccordionTriggerComponent,
} from '@/app/components/ui/accordion'
import { UiBadgeComponent } from '@/app/components/ui/badge'
import { UiButtonComponent } from '@/app/components/ui/button'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card'

const FAQ = [
  { q: 'My API call returned a 429. What\'s the right backoff?', a: 'Exponential backoff with full jitter, capped at 30 seconds. Use the Retry-After header value as the starting point — we set it precisely for your current bucket. The SDK does this automatically; only worry about it if you\'re hitting the REST API directly.' },
  { q: 'How do I rotate my API key without an outage?', a: 'Generate the new key in Settings → API keys. Both keys are valid for the next 24 hours. Switch your production environment to the new key, verify it\'s working, then revoke the old one. There is no downtime if you do this in order.' },
  { q: 'Can I run the SDK on Cloudflare Workers / edge runtimes?', a: 'Yes. The SDK is ESM-only with no Node-specific dependencies. The one quirk: SSE streaming requires you to pass { fetch: (req) => fetch(req, { duplex: \'half\' }) } in the client constructor — the default fetch on Workers needs this hint.' },
  { q: 'How does the batch endpoint handle partial failures?', a: 'Each prompt in a batch is processed independently. The response is a list where each element is either a success or an error object — you process them like a result-of-T array. One bad prompt does not fail the whole batch and does not get charged.' },
  { q: 'Are my prompts used to train your models?', a: 'No. By default, prompts and completions are retained for 30 days for abuse review only, then deleted. Enterprise accounts can opt for zero retention via a contractual amendment.' },
  { q: 'What\'s the difference between sessions and contexts?', a: 'Sessions hold conversation state (the message list, tool history). Contexts hold static data (files, knowledge base entries) that you reference from many sessions. Use a session when the state belongs to one user-conversation. Use a context when the same documents are read by many sessions.' },
  { q: 'How do I cap costs per workspace?', a: 'Settings → Limits lets you set a hard monthly spending cap. When you hit it, API calls return 402 Payment Required until the next billing cycle or until you raise the cap. Soft caps (email warning at 80% / 100%) are also configurable.' },
  { q: 'Why does Explorer cost so much more than Genesis?', a: 'Explorer\'s million-token context is a more expensive model to serve. If your prompt fits in under 128K tokens, Genesis will give you very similar output quality at one-half the cost and one-third the latency. The model card has a guide for when each is appropriate.' },
]

interface Channel {
  icon: LucideIconData
  title: string
  description: string
  href: string
  meta: string
  cta: string
}

const CHANNELS: Channel[] = [
  { icon: BookOpen, title: 'Documentation', description: 'Self-serve guides for 90% of questions.', href: '#', meta: '75 pages', cta: 'Browse docs' },
  { icon: MessageSquare, title: 'Community Discord', description: 'Async Q&A with the team and other builders. Typically responded to within 4 hours.', href: '#', meta: '3,400 members', cta: 'Join Discord' },
  { icon: Mail, title: 'Email support', description: 'Pro and Enterprise. Median response time: 2.4 hours during business days.', href: 'mailto:support@uipkge.dev', meta: 'support@uipkge.dev', cta: 'Email us' },
]

const STATUS = { level: 'all-systems-go', label: 'All systems operational', updated: '2 minutes ago' }

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [
    LucideAngularModule,
    UiAccordionComponent,
    UiAccordionContentComponent,
    UiAccordionItemComponent,
    UiAccordionTriggerComponent,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
  ],
  template: `
    <div class="space-y-4">
      <header class="space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight">Support</h1>
        <p class="text-muted-foreground text-sm">Documentation, community, and human help — pick whichever gets you unstuck fastest.</p>
      </header>

      <ui-card class="border-success/30 bg-success/10">
        <ui-card-content class="flex items-center gap-3 py-4">
          <lucide-icon [img]="StatusIcon" class="text-success size-5 shrink-0" />
          <div class="flex-1 space-y-0.5">
            <p class="text-sm font-semibold">{{ status.label }}</p>
            <p class="text-muted-foreground text-xs">
              Updated {{ status.updated }}. <a href="#" class="text-foreground underline-offset-4 hover:underline">View status page →</a>
            </p>
          </div>
        </ui-card-content>
      </ui-card>

      <div class="grid gap-4 lg:grid-cols-3">
        @for (c of channels; track c.title) {
          <ui-card>
            <ui-card-header>
              <div class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                <lucide-icon [img]="c.icon" class="size-5" />
              </div>
              <ui-card-title class="text-base pt-3">{{ c.title }}</ui-card-title>
              <ui-card-description>{{ c.description }}</ui-card-description>
            </ui-card-header>
            <ui-card-content class="space-y-3">
              <ui-badge variant="secondary">{{ c.meta }}</ui-badge>
              <a ui-button variant="outline" size="sm" class="w-full gap-1.5" [href]="c.href">
                {{ c.cta }}
                <lucide-icon [img]="ExternalIcon" class="size-3" />
              </a>
            </ui-card-content>
          </ui-card>
        }
      </div>

      <ui-card>
        <ui-card-header>
          <ui-card-title class="text-base flex items-center gap-2">
            <lucide-icon [img]="FaqIcon" class="size-4" /> Frequently asked
          </ui-card-title>
          <ui-card-description>Eight questions that account for ~70% of inbound tickets.</ui-card-description>
        </ui-card-header>
        <ui-card-content>
          <ui-accordion type="single" collapsible class="w-full">
            @for (f of faq; track f.q; let i = $index) {
              <ui-accordion-item [value]="'item-' + i">
                <ui-accordion-trigger class="text-left text-sm">{{ f.q }}</ui-accordion-trigger>
                <ui-accordion-content class="text-muted-foreground text-sm leading-relaxed">
                  {{ f.a }}
                </ui-accordion-content>
              </ui-accordion-item>
            }
          </ui-accordion>
        </ui-card-content>
      </ui-card>
    </div>
  `,
})
export class Support {
  protected readonly StatusIcon = CircleCheck
  protected readonly ExternalIcon = ExternalLink
  protected readonly FaqIcon = LifeBuoy

  protected readonly faq = FAQ
  protected readonly channels = CHANNELS
  protected readonly status = STATUS

  constructor() {
    inject(Title).setTitle('Support')
  }
}
