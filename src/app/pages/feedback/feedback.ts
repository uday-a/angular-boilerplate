// Feedback — mirrors nuxt-boilerplate `app/pages/feedback/index.vue` 1:1:
// category + subject + message → POST /api/feedback → status banner.
// The "recent from the team" sidebar is a static fixture, as in nuxt.
import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { Title } from '@angular/platform-browser'
import {
  Bug,
  CircleAlert,
  CircleCheck,
  Lightbulb,
  LucideAngularModule,
  MessageCircle,
  Send,
  Sparkles,
  ThumbsUp,
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
import { UiInputComponent } from '@/app/components/ui/input'
import { UiLabelComponent } from '@/app/components/ui/label'
import { UiRadioGroupComponent, UiRadioGroupItemComponent } from '@/app/components/ui/radio-group'
import { UiTextareaComponent } from '@/app/components/ui/textarea'
import { type ApiResponse, apiErrorMessage } from '@/app/core/api/api'

export type FeedbackCategory = 'idea' | 'bug' | 'praise'

type FeedbackStatus
  = | { kind: 'idle' }
    | { kind: 'sending' }
    | { kind: 'sent', delivered: boolean }
    | { kind: 'error', message: string }

const CATEGORIES: { value: FeedbackCategory, label: string, id: string }[] = [
  { value: 'idea', label: 'Idea', id: 'cat-idea' },
  { value: 'bug', label: 'Bug', id: 'cat-bug' },
  { value: 'praise', label: 'Praise', id: 'cat-praise' },
]

const RECENT = [
  { kind: 'bug', author: 'Marcus R.', summary: 'Sparkline tooltip flickers when crossing zero', upvotes: 8, status: 'in-progress', age: '2d ago' },
  { kind: 'idea', author: 'Alice C.', summary: 'Let me pin sessions from the playground header, not just the menu', upvotes: 14, status: 'planned', age: '4d ago' },
  { kind: 'idea', author: 'David K.', summary: 'Add a "compare two models side-by-side" view in the playground', upvotes: 32, status: 'planned', age: '1w ago' },
  { kind: 'bug', author: 'Eva J.', summary: 'JSON mode adds a trailing newline on Quantum responses', upvotes: 3, status: 'shipped', age: '1w ago' },
  { kind: 'idea', author: 'Frank L.', summary: 'Slack notifications when batch jobs finish', upvotes: 21, status: 'considering', age: '2w ago' },
  { kind: 'praise', author: 'Olive P.', summary: 'The new docs search is incredibly fast — feels instant.', upvotes: 11, status: '', age: '2w ago' },
]

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  'shipped': 'default',
  'in-progress': 'secondary',
  'planned': 'outline',
  'considering': 'outline',
}

const KIND_ICON: Record<string, LucideIconData> = { bug: Bug, idea: Lightbulb, praise: Sparkles }

const KIND_COLOR: Record<string, string> = {
  bug: 'text-chart-3',
  idea: 'text-chart-4',
  praise: 'text-chart-2',
}

@Component({
  selector: 'app-feedback',
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
    UiInputComponent,
    UiLabelComponent,
    UiRadioGroupComponent,
    UiRadioGroupItemComponent,
    UiTextareaComponent,
  ],
  template: `
    <div class="space-y-4">
      <header class="space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight">Feedback</h1>
        <p class="text-muted-foreground text-sm">
          Tell us what's broken, what's missing, what feels right. We read every submission within 48 hours.
        </p>
      </header>

      <div class="grid gap-4 lg:grid-cols-[1fr_400px]">
        <ui-card>
          <ui-card-header>
            <ui-card-title class="text-base">Send us a note</ui-card-title>
            <ui-card-description>Choose the closest match. We route based on category and respond from the right person.</ui-card-description>
          </ui-card-header>
          <ui-card-content class="space-y-4">
            <div class="grid gap-2">
              <ui-label>Category</ui-label>
              <ui-radio-group [value]="category()" (valueChange)="onCategoryChange($event)" class="grid grid-cols-3 gap-2">
                @for (c of categories; track c.value) {
                  <div
                    class="hover:bg-muted/40 [&:has([data-state=checked])]:bg-muted [&:has([data-state=checked])]:border-foreground/30 flex items-center gap-2 rounded-lg border p-3 cursor-pointer"
                  >
                    <ui-radio-group-item [id]="c.id" [value]="c.value" />
                    <ui-label [htmlFor]="c.id" class="cursor-pointer text-sm font-medium">{{ c.label }}</ui-label>
                  </div>
                }
              </ui-radio-group>
            </div>

            <div class="grid gap-2">
              <ui-label htmlFor="fb-subject">Subject</ui-label>
              <ui-input id="fb-subject" placeholder="One-line summary" [value]="subject()" (valueChange)="subject.set($event)" />
            </div>

            <div class="grid gap-2">
              <ui-label htmlFor="fb-message">Details</ui-label>
              <ui-textarea
                id="fb-message"
                [rows]="6"
                placeholder="What happened? What were you expecting? Anything we should reproduce?"
                [value]="message()"
                (valueChange)="message.set($event)"
              />
              <p class="text-muted-foreground text-xs">
                If this is a bug, include the API request ID from the error toast — we can pull the exact server-side log.
              </p>
            </div>

            @if (status().kind === 'sent') {
              <div
                class="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
              >
                <lucide-icon [img]="SentIcon" class="size-4" />
                {{ asSent(status()).delivered ? 'Thanks — we got it.' : 'Sent (dev mode — printed to server log).' }}
              </div>
            } @else if (status().kind === 'error') {
              <div
                class="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                <lucide-icon [img]="ErrorIcon" class="size-4" />
                {{ asError(status()).message }}
              </div>
            }

            <div class="flex justify-end gap-2">
              <button ui-button variant="outline" [disabled]="status().kind === 'sending'">Save draft</button>
              <button ui-button class="gap-2" [disabled]="!canSend()" (click)="onSend()">
                <lucide-icon [img]="SendIcon" class="size-4" />
                {{ status().kind === 'sending' ? 'Sending…' : 'Send' }}
              </button>
            </div>
          </ui-card-content>
        </ui-card>

        <ui-card>
          <ui-card-header>
            <ui-card-title class="text-base flex items-center gap-2">
              <lucide-icon [img]="RecentIcon" class="size-4" /> Recent from the team
            </ui-card-title>
            <ui-card-description>Public feedback from your workspace.</ui-card-description>
          </ui-card-header>
          <ui-card-content class="space-y-3">
            @for (r of recent; track r.summary) {
              <div class="border-b pb-3 last:border-0 last:pb-0">
                <div class="flex items-start gap-2.5">
                  <lucide-icon [img]="kindIcon(r.kind)" [class]="'mt-0.5 size-4 shrink-0 ' + kindColor(r.kind)" />
                  <div class="min-w-0 flex-1 space-y-1">
                    <p class="text-sm leading-snug">{{ r.summary }}</p>
                    <div class="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                      <span>{{ r.author }} · {{ r.age }}</span>
                      @if (r.status) {
                        <span class="text-muted-foreground" aria-hidden="true">·</span>
                        <ui-badge [variant]="statusVariant(r.status)" class="capitalize">
                          {{ r.status.replace('-', ' ') }}
                        </ui-badge>
                      }
                    </div>
                  </div>
                  <button
                    class="hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors"
                  >
                    <lucide-icon [img]="UpvoteIcon" class="size-3" />
                    <span class="tabular-nums">{{ r.upvotes }}</span>
                  </button>
                </div>
              </div>
            }
          </ui-card-content>
        </ui-card>
      </div>
    </div>
  `,
})
export class Feedback {
  private readonly http = inject(HttpClient)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))

  protected readonly SendIcon = Send
  protected readonly SentIcon = CircleCheck
  protected readonly ErrorIcon = CircleAlert
  protected readonly RecentIcon = MessageCircle
  protected readonly UpvoteIcon = ThumbsUp

  protected readonly categories = CATEGORIES
  protected readonly recent = RECENT

  protected readonly category = signal<FeedbackCategory>('idea')
  protected readonly subject = signal('')
  protected readonly message = signal('')
  protected readonly status = signal<FeedbackStatus>({ kind: 'idle' })

  // Mirrors nuxt's send-button gate (subject ≥3, message ≥10, not sending).
  protected readonly canSend = computed(
    () => this.status().kind !== 'sending' && this.subject().length >= 3 && this.message().length >= 10,
  )

  constructor() {
    inject(Title).setTitle('Feedback')
  }

  kindIcon(kind: string): LucideIconData {
    return KIND_ICON[kind] ?? Lightbulb
  }

  kindColor(kind: string): string {
    return KIND_COLOR[kind] ?? KIND_COLOR['idea']!
  }

  statusVariant(status: string): BadgeVariant {
    return STATUS_VARIANT[status] ?? 'outline'
  }

  asSent(status: FeedbackStatus): { kind: 'sent', delivered: boolean } {
    return status as { kind: 'sent', delivered: boolean }
  }

  asError(status: FeedbackStatus): { kind: 'error', message: string } {
    return status as { kind: 'error', message: string }
  }

  onCategoryChange(next: string): void {
    if (next === 'idea' || next === 'bug' || next === 'praise') this.category.set(next)
  }

  onSend(): void {
    if (!this.browser || !this.canSend()) return
    this.status.set({ kind: 'sending' })
    this.http
      .post<ApiResponse<{ delivered: boolean, id: string | null }>>(
        '/api/feedback',
        { category: this.category(), subject: this.subject(), message: this.message() },
        { withCredentials: true },
      )
      .subscribe({
        next: (res) => {
          if (!res.ok) {
            this.status.set({ kind: 'error', message: res.error.message })
            return
          }
          this.status.set({ kind: 'sent', delivered: res.data.delivered })
          this.subject.set('')
          this.message.set('')
        },
        error: (err: unknown) => {
          this.status.set({ kind: 'error', message: apiErrorMessage(err, 'Failed to send feedback') })
        },
      })
  }
}
