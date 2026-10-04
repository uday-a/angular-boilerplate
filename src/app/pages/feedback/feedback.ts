// Feedback — mirrors nuxt-boilerplate `app/pages/feedback/index.vue` 1:1:
// category + subject + message (+ screenshots) → POST /api/feedback →
// status banner. The "recent from the team" sidebar is a static fixture,
// as in nuxt.
import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { TranslatePipe } from '@ngx-translate/core'
import {
  Bug,
  CircleAlert,
  CircleCheck,
  Lightbulb,
  LucideAngularModule,
  Send,
  Sparkles,
  ThumbsUp,
  type LucideIconData,
} from 'lucide-angular'
import { UiDemoDataBannerComponent } from '@/app/components/blocks/demo-data-banner'
import { UiBadgeComponent, type BadgeVariant } from '@/app/components/ui/badge'
import { UiButtonComponent } from '@/app/components/ui/button'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card'
import { UiFileUploadComponent, UiFileUploadContentComponent, UiFileUploadItemComponent } from '@/app/components/ui/file-upload'
import { UiInputComponent } from '@/app/components/ui/input'
import { UiPageBodyComponent, UiPageComponent, UiPageHeaderComponent, UiPageHeaderHeadingComponent } from '@/app/components/ui/page'
import { UiLabelComponent } from '@/app/components/ui/label'
import { UiRadioGroupComponent, UiRadioGroupItemComponent } from '@/app/components/ui/radio-group'
import { UiTextareaComponent } from '@/app/components/ui/textarea'
import { type ApiResponse, apiErrorMessage } from '@/app/core/api/api'
import { I18nService, injectPageTitle } from '@/app/core/i18n'

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
  { kind: 'bug', author: 'Mark R.', summary: 'Chart tooltip flickers when a series crosses zero', upvotes: 8, status: 'in-progress', age: '2d ago' },
  { kind: 'idea', author: 'Alice C.', summary: 'Pin favorite projects to the top of the sidebar', upvotes: 14, status: 'planned', age: '4d ago' },
  { kind: 'idea', author: 'David K.', summary: 'Compare two billing periods side by side on the usage page', upvotes: 32, status: 'planned', age: '1w ago' },
  { kind: 'bug', author: 'Eva J.', summary: 'CSV export adds a blank line at the end of the file', upvotes: 3, status: 'shipped', age: '1w ago' },
  { kind: 'idea', author: 'Frank L.', summary: 'Slack notifications when a deploy finishes', upvotes: 21, status: 'considering', age: '2w ago' },
  { kind: 'praise', author: 'Olivia P.', summary: 'The new search is incredibly fast — feels instant.', upvotes: 11, status: '', age: '2w ago' },
]

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  'shipped': 'success',
  'in-progress': 'info',
  'planned': 'secondary',
  'considering': 'outline',
}

const KIND_ICON: Record<string, LucideIconData> = { bug: Bug, idea: Lightbulb, praise: Sparkles }

// Screenshots: images only, capped at 3 files / 5 MB each (Nuxt limits).
export const MAX_FEEDBACK_FILES = 3
export const MAX_FEEDBACK_FILE_BYTES = 5 * 1024 * 1024

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [
    TranslatePipe,
    LucideAngularModule,
    UiDemoDataBannerComponent,
    UiFileUploadComponent,
    UiFileUploadContentComponent,
    UiFileUploadItemComponent,
    UiPageBodyComponent,
    UiPageComponent,
    UiPageHeaderComponent,
    UiPageHeaderHeadingComponent,
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
    <ui-page>
      <ui-page-header>
        <ui-page-header-heading
          [title]="pageTitle()"
          description="Tell us what's broken, what's missing and what works. We read every note within 48 hours."
        />
      </ui-page-header>

      <ui-page-body class="grid gap-4 lg:grid-cols-3">
        <ui-card class="lg:col-span-2">
          <ui-card-header>
            <h3 ui-card-title class="text-base">Send us a note</h3>
            <ui-card-description>Pick the closest category so the right person replies.</ui-card-description>
          </ui-card-header>
          <ui-card-content class="space-y-4">
            <div class="grid gap-2">
              <ui-label id="fb-category">Category</ui-label>
              <ui-radio-group
                [value]="category()"
                (valueChange)="onCategoryChange($event)"
                aria-labelledby="fb-category"
                class="grid grid-cols-3 gap-2"
              >
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
              <p class="text-muted-foreground text-xs">For bugs, include the steps you took and the request ID from any error message.</p>
            </div>

            <div class="grid gap-2">
              <ui-label>{{ 'feedback.attachments.label' | translate }}</ui-label>
              <ui-file-upload
                accept="image/*"
                multiple
                [value]="files()"
                [disabled]="status().kind === 'sending'"
                (valueChange)="onFilesPicked($event)"
              >
                @if (files().length) {
                  <ui-file-upload-content>
                    @for (f of files(); track f.name + '-' + f.size; let i = $index) {
                      <ui-file-upload-item [file]="f" (remove)="removeFile(i)" />
                    }
                  </ui-file-upload-content>
                }
              </ui-file-upload>
              <p class="text-muted-foreground text-xs">{{ 'feedback.attachments.hint' | translate }}</p>
              @if (fileError()) {
                <p class="text-destructive text-xs">{{ fileError() }}</p>
              }
            </div>

            @if (status().kind === 'sent') {
              <div
                class="border-success/30 bg-success/10 text-success flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                role="status"
              >
                <lucide-icon [img]="SentIcon" class="size-4 shrink-0" aria-hidden="true" />
                Thanks — we got it.
              </div>
            } @else if (status().kind === 'error') {
              <div
                class="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                role="alert"
              >
                <lucide-icon [img]="ErrorIcon" class="size-4 shrink-0" aria-hidden="true" />
                {{ asError(status()).message }}
              </div>
            }

            <div class="flex justify-end gap-2">
              <button ui-button variant="outline" [disabled]="status().kind === 'sending'">Save draft</button>
              <button ui-button [disabled]="!canSend()" (click)="onSend()">
                <lucide-icon [img]="SendIcon" class="size-4" aria-hidden="true" />
                {{ status().kind === 'sending' ? 'Sending…' : 'Send' }}
              </button>
            </div>
          </ui-card-content>
        </ui-card>

        <ui-card>
          <ui-card-header>
            <h3 ui-card-title class="text-base">Recent from the team</h3>
            <ui-card-description>Public feedback from your workspace.</ui-card-description>
          </ui-card-header>
          <ui-card-content class="space-y-4">
            <ui-demo-data-banner message="Sample feedback. Your team's notes will appear here." />
            @for (r of recent; track r.summary) {
              <div class="border-b pb-4 last:border-0 last:pb-0">
                <div class="flex items-start gap-3">
                  <lucide-icon [img]="kindIcon(r.kind)" class="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <div class="min-w-0 flex-1 space-y-1">
                    <p class="text-sm">{{ r.summary }}</p>
                    <div class="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                      <span>{{ r.author }} · {{ r.age }}</span>
                      @if (r.status) {
                        <span ui-badge [variant]="statusVariant(r.status)" class="capitalize">{{ r.status.replace('-', ' ') }}</span>
                      }
                    </div>
                  </div>
                  <button
                    type="button"
                    [attr.aria-label]="'Upvote: ' + r.upvotes + ' votes'"
                    class="hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors"
                  >
                    <lucide-icon [img]="UpvoteIcon" class="size-3.5" aria-hidden="true" />
                    <span class="tabular-nums">{{ r.upvotes }}</span>
                  </button>
                </div>
              </div>
            }
          </ui-card-content>
        </ui-card>
      </ui-page-body>
    </ui-page>
  `,
})
export class Feedback {
  private readonly http = inject(HttpClient)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly i18n = inject(I18nService)
  protected readonly pageTitle = injectPageTitle()

  protected readonly SendIcon = Send
  protected readonly SentIcon = CircleCheck
  protected readonly ErrorIcon = CircleAlert
  protected readonly UpvoteIcon = ThumbsUp

  protected readonly categories = CATEGORIES
  protected readonly recent = RECENT

  protected readonly category = signal<FeedbackCategory>('idea')
  protected readonly subject = signal('')
  protected readonly message = signal('')
  protected readonly status = signal<FeedbackStatus>({ kind: 'idle' })
  protected readonly files = signal<File[]>([])
  protected readonly fileError = signal<string | null>(null)

  // Mirrors nuxt's send-button gate (subject ≥3, message ≥10, not sending).
  protected readonly canSend = computed(
    () => this.status().kind !== 'sending' && this.subject().length >= 3 && this.message().length >= 10,
  )

  kindIcon(kind: string): LucideIconData {
    return KIND_ICON[kind] ?? Lightbulb
  }

  statusVariant(status: string): BadgeVariant {
    return STATUS_VARIANT[status] ?? 'outline'
  }

  // Validated here for fast feedback (Nuxt also re-checks server-side).
  onFilesPicked(next: File[]): void {
    this.fileError.set(null)
    const merged = [...this.files()]
    for (const f of next) {
      if (!f.type.startsWith('image/')) {
        this.fileError.set(this.i18n.t('feedback.attachments.badType', { name: f.name }))
        continue
      }
      if (f.size > MAX_FEEDBACK_FILE_BYTES) {
        this.fileError.set(this.i18n.t('feedback.attachments.tooBig', { name: f.name }))
        continue
      }
      if (merged.length >= MAX_FEEDBACK_FILES) {
        this.fileError.set(this.i18n.t('feedback.attachments.tooMany'))
        break
      }
      if (merged.some(m => m.name === f.name && m.size === f.size)) continue
      merged.push(f)
    }
    this.files.set(merged.slice(0, MAX_FEEDBACK_FILES))
  }

  removeFile(index: number): void {
    this.files.update(list => list.filter((_, i) => i !== index))
    if (!this.files().length) this.fileError.set(null)
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
    // Multipart so screenshots ride along (server re-validates them).
    const form = new FormData()
    form.append('category', this.category())
    form.append('subject', this.subject())
    form.append('message', this.message())
    for (const f of this.files()) form.append('files', f, f.name)
    this.http
      .post<ApiResponse<{ delivered: boolean, id: string | null }>>('/api/feedback', form, { withCredentials: true })
      .subscribe({
        next: (res) => {
          if (!res.ok) {
            this.status.set({ kind: 'error', message: res.error.message })
            return
          }
          this.status.set({ kind: 'sent', delivered: res.data.delivered })
          this.subject.set('')
          this.message.set('')
          this.files.set([])
          this.fileError.set(null)
        },
        error: (err: unknown) => {
          this.status.set({ kind: 'error', message: apiErrorMessage(err, 'Failed to send feedback') })
        },
      })
  }
}
