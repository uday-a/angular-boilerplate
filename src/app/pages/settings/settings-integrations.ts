// Settings → Integrations — mirrors nuxt-boilerplate
// `app/pages/settings/integrations.vue` 1:1. Fully mock UI (OAuth app
// cards, webhooks) until the integration endpoints exist.
import { Component } from '@angular/core'
import {
  ExternalLink,
  Github,
  LucideAngularModule,
  Plug,
  Plus,
  Slack,
  Webhook,
  type LucideIconData,
} from 'lucide-angular'
import { UiBadgeComponent } from '@/app/components/ui/badge'
import { UiButtonComponent } from '@/app/components/ui/button'
import {
  UiCardActionComponent,
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card'
import { UiSeparatorComponent } from '@/app/components/ui/separator'
import {
  UiPageBodyComponent,
  UiPageComponent,
  UiPageHeaderComponent,
  UiPageHeaderHeadingComponent,
} from '@/app/components/ui/page'
import { injectPageTitle } from '@/app/core/i18n'

interface Integration {
  id: string
  name: string
  description: string
  icon: LucideIconData
  connected: boolean
  account?: string
}

const INTEGRATIONS: Integration[] = [
  { id: 'github', name: 'GitHub', description: 'Link repositories and surface PR activity in the workspace.', icon: Github, connected: true, account: 'acme-inc' },
  { id: 'slack', name: 'Slack', description: 'Send notifications and command shortcuts into a Slack workspace.', icon: Slack, connected: false },
  { id: 'webhook', name: 'Webhooks', description: 'POST workspace events to a URL you control.', icon: Webhook, connected: false },
]

@Component({
  selector: 'app-settings-integrations',
  standalone: true,
  imports: [
    UiPageComponent,
    UiPageBodyComponent,
    UiPageHeaderComponent,
    UiPageHeaderHeadingComponent,
    LucideAngularModule,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardActionComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
    UiSeparatorComponent,
  ],
  template: `
    <ui-page>
      <ui-page-header>
        <ui-page-header-heading [title]="pageTitle()" description="Connect external services and configure webhooks." />
      </ui-page-header>

      <ui-page-body class="max-w-3xl space-y-4">
        <ui-card>
          <ui-card-header>
            <h3 ui-card-title class="text-base">Available</h3>
            <ui-card-description>OAuth apps and event sinks.</ui-card-description>
          </ui-card-header>
          <ui-card-content class="space-y-3">
            @for (item of integrations; track item.id; let idx = $index) {
              <div>
                <div class="flex flex-wrap items-start justify-between gap-4 py-2">
                  <div class="flex items-start gap-3">
                    <div class="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-md">
                      <lucide-icon [img]="item.icon" class="size-5" />
                    </div>
                    <div class="space-y-0.5">
                      <div class="flex items-center gap-2">
                        <p class="text-sm font-medium">{{ item.name }}</p>
                        @if (item.connected) {
                          <ui-badge variant="secondary">
                            Connected{{ item.account ? ' · ' + item.account : '' }}
                          </ui-badge>
                        }
                      </div>
                      <p class="text-muted-foreground text-xs">{{ item.description }}</p>
                    </div>
                  </div>
                  @if (item.connected) {
                    <button ui-button variant="outline" size="sm">Disconnect</button>
                  } @else {
                    <button ui-button variant="outline" size="sm">
                      <lucide-icon [img]="PlugIcon" class="size-4" />
                      Connect
                    </button>
                  }
                </div>
                @if (idx < integrations.length - 1) {
                  <ui-separator />
                }
              </div>
            }
          </ui-card-content>
        </ui-card>

        <ui-card>
          <ui-card-header>
            <h3 ui-card-title class="text-base">Webhooks</h3>
            <ui-card-description>POST workspace events as JSON to your endpoint.</ui-card-description>
            <ui-card-action>
              <button ui-button size="sm">
                <lucide-icon [img]="PlusIcon" class="size-4" />
                Add webhook
              </button>
            </ui-card-action>
          </ui-card-header>
          <ui-card-content>
            <div class="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
              No webhooks configured.
              <a href="#" class="text-foreground inline-flex items-center gap-1 underline-offset-4 hover:underline">
                Read the docs <lucide-icon [img]="ExternalIcon" class="size-3.5" aria-hidden="true" />
              </a>
            </div>
          </ui-card-content>
        </ui-card>
      </ui-page-body>
    </ui-page>
  `,
})
export class SettingsIntegrations {
  protected readonly pageTitle = injectPageTitle()
  protected readonly PlugIcon = Plug
  protected readonly PlusIcon = Plus
  protected readonly ExternalIcon = ExternalLink
  protected readonly integrations = INTEGRATIONS

}
