// Support — mirrors nuxt-boilerplate `app/pages/support/index.vue` 1:1:
// status banner + channel cards + FAQ accordion. Fully static content.
import { Component } from '@angular/core'
import {
  BookOpen,
  CircleCheck,
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
import { UiPageBodyComponent, UiPageComponent, UiPageHeaderComponent, UiPageHeaderHeadingComponent } from '@/app/components/ui/page'
import { injectPageTitle } from '@/app/core/i18n'

const FAQ = [
  { q: 'How do I invite someone to my workspace?', a: 'Go to Settings → Team and choose Invite member. Enter their email and pick a role. They get a link that stays valid for 7 days; you can resend or revoke it from the same page.' },
  { q: 'How do I rotate an API key without downtime?', a: 'Create the new key in Settings → API keys. Both keys work for the next 24 hours. Switch your services to the new key, check they are working, then revoke the old one.' },
  { q: 'What happens when we reach a plan limit?', a: 'You get an email at 80% and 100% of any limit. Seats and projects stop at the limit until you upgrade; API calls return a 429 response until the next billing period or until you raise the limit in Settings → Limits.' },
  { q: 'Can I change plans mid-cycle?', a: 'Yes. Upgrades take effect immediately and are prorated on your next invoice. Downgrades apply at the end of the current billing period.' },
  { q: 'How do I set up single sign-on?', a: 'SSO is available on the Enterprise plan. In Settings → Security, add your identity provider (Okta, Azure AD or Google Workspace) and verify your domain. Members are then asked to sign in through your provider.' },
  { q: 'Where can I download invoices?', a: 'Settings → Billing lists every invoice with a PDF download. Billing admins can also add a billing email so invoices are sent there automatically.' },
  { q: 'How do I export my data?', a: 'Workspace owners can export projects, tasks and members as CSV or JSON from Settings → General. Large exports are emailed as a download link when ready.' },
  { q: 'How do I delete my workspace?', a: 'Workspace owners can delete it from Settings → General. Your data is kept for 30 days in case you change your mind, then permanently removed.' },
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
  { icon: BookOpen, title: 'Documentation', description: 'Step-by-step guides for setup, billing, integrations and the API.', href: '#', meta: '75 pages', cta: 'Browse docs' },
  { icon: MessageSquare, title: 'Community', description: 'Ask questions and share tips with the team and other customers. Most questions get an answer within 4 hours.', href: '#', meta: '3,400 members', cta: 'Join the community' },
  { icon: Mail, title: 'Email support', description: 'On Team and Enterprise plans. Median reply time is 2.4 hours on business days.', href: 'mailto:support@uipkge.dev', meta: 'support@uipkge.dev', cta: 'Email us' },
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
    UiPageBodyComponent,
    UiPageComponent,
    UiPageHeaderComponent,
    UiPageHeaderHeadingComponent,
  ],
  template: `
    <ui-page>
      <ui-page-header>
        <ui-page-header-heading [title]="pageTitle()" description="Guides, community answers and help from our team." />
      </ui-page-header>

      <ui-page-body class="space-y-4">
        <ui-card class="border-success/30 bg-success/5">
          <ui-card-content class="flex items-center gap-3 py-4">
            <lucide-icon [img]="StatusIcon" class="text-success size-5 shrink-0" aria-hidden="true" />
            <div class="flex-1 space-y-1">
              <p class="text-sm font-semibold">{{ status.label }}</p>
              <p class="text-muted-foreground text-xs">
                Updated {{ status.updated }}. <a href="#" class="text-foreground underline-offset-4 hover:underline">View status page →</a>
              </p>
            </div>
          </ui-card-content>
        </ui-card>

        <div class="grid gap-4 lg:grid-cols-3">
          @for (c of channels; track c.title) {
            <ui-card class="flex flex-col">
              <ui-card-header>
                <div class="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-lg">
                  <lucide-icon [img]="c.icon" class="size-5" aria-hidden="true" />
                </div>
                <h3 ui-card-title class="text-base">{{ c.title }}</h3>
                <ui-card-description>{{ c.description }}</ui-card-description>
              </ui-card-header>
              <ui-card-content class="mt-auto space-y-4">
                <span ui-badge variant="secondary">{{ c.meta }}</span>
                <a ui-button variant="outline" size="sm" class="w-full" [href]="c.href">{{ c.cta }}</a>
              </ui-card-content>
            </ui-card>
          }
        </div>

        <ui-card>
          <ui-card-header>
            <h3 ui-card-title class="text-base">Frequently asked</h3>
            <ui-card-description>Quick answers to the questions we hear most.</ui-card-description>
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
      </ui-page-body>
    </ui-page>
  `,
})
export class Support {
  protected readonly StatusIcon = CircleCheck
  protected readonly pageTitle = injectPageTitle()

  protected readonly faq = FAQ
  protected readonly channels = CHANNELS
  protected readonly status = STATUS
}
