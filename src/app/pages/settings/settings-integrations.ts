// Settings → Integrations — mirrors nuxt-boilerplate
// `app/pages/settings/integrations.vue` 1:1. Fully mock UI (OAuth app
// cards, webhooks) until the integration endpoints exist.
import { Component, inject } from '@angular/core'
import { Title } from '@angular/platform-browser'
import {
  ExternalLink,
  Github,
  LucideAngularModule,
  Plug,
  Plus,
  Slack,
  type LucideIconData,
} from 'lucide-angular'
import { UiBadgeComponent } from '@/app/components/ui/badge'
import { UiButtonComponent } from '@/app/components/ui/button'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card'
import { UiSeparatorComponent } from '@/app/components/ui/separator'

interface Integration {
  id: string
  name: string
  description: string
  icon: LucideIconData
  connected: boolean
  account?: string
}

const INTEGRATIONS: Integration[] = [
  { id: 'github', name: 'GitHub', description: 'Link repositories and surface PR activity in the workspace.', icon: Github, connected: true, account: 'uday' },
  { id: 'slack', name: 'Slack', description: 'Send notifications and command shortcuts into a Slack workspace.', icon: Slack, connected: false },
]

@Component({
  selector: 'app-settings-integrations',
  standalone: true,
  imports: [
    LucideAngularModule,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
    UiSeparatorComponent,
  ],
  template: `
    <div class="max-w-3xl space-y-4">
      <header class="space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight">Integrations</h1>
        <p class="text-muted-foreground text-sm">Connect external services and configure webhooks.</p>
      </header>

      <ui-card>
        <ui-card-header>
          <ui-card-title class="text-base">Available</ui-card-title>
          <ui-card-description>OAuth apps connected to your workspace.</ui-card-description>
        </ui-card-header>
        <ui-card-content class="space-y-3">
          @for (item of integrations; track item.id; let idx = $index) {
            <div>
              <div class="flex items-start justify-between gap-4 py-2">
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
        <ui-card-header class="flex flex-row items-center justify-between gap-4">
          <div>
            <ui-card-title class="text-base">Webhooks</ui-card-title>
            <ui-card-description>POST workspace events as JSON to your endpoint.</ui-card-description>
          </div>
          <button ui-button size="sm">
            <lucide-icon [img]="PlusIcon" class="size-4" />
            Add webhook
          </button>
        </ui-card-header>
        <ui-card-content>
          <div class="text-muted-foreground flex items-center gap-2 text-sm">
            No webhooks configured.
            <a href="#" class="text-foreground inline-flex items-center gap-1 underline-offset-4 hover:underline">
              Read the docs <lucide-icon [img]="ExternalIcon" class="size-3" />
            </a>
          </div>
        </ui-card-content>
      </ui-card>
    </div>
  `,
})
export class SettingsIntegrations {
  protected readonly PlugIcon = Plug
  protected readonly PlusIcon = Plus
  protected readonly ExternalIcon = ExternalLink
  protected readonly integrations = INTEGRATIONS

  constructor() {
    inject(Title).setTitle('Integrations · Settings')
  }
}
