// Team inbox. Ports nuxt-boilerplate's app/pages/dashboard/messages.vue 1:1.
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TranslatePipe } from '@ngx-translate/core'
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  CheckCheck,
  FileText,
  Inbox,
  LucideAngularModule,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Send as SentIcon,
  Star,
  Trash2,
} from 'lucide-angular'
import { UiAvatarComponent, UiAvatarFallbackComponent } from '@/app/components/ui/avatar/avatar.component'
import { UiBadgeComponent } from '@/app/components/ui/badge/badge.component'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import { UiInputComponent } from '@/app/components/ui/input/input.component'
import { UiOverlayScrollComponent } from '@/app/components/ui/overlay-scroll/overlay-scroll.component'
import { UiEmptyStateComponent } from '@/app/components/ui/empty-state/empty-state.component'
import { UiSeparatorComponent } from '@/app/components/ui/separator/separator.component'
import {
  UiSelectComponent,
  UiSelectContentComponent,
  UiSelectItemComponent,
  UiSelectTriggerComponent,
} from '@/app/components/ui/select'
import { UiTextareaComponent } from '@/app/components/ui/textarea'
import { cardVariants } from '@/app/components/ui/card/card.variants'
import { cn } from '@/app/core/utils/cn'
import { injectPageTitle } from '@/app/core/i18n'
import {
  UiPageBodyComponent,
  UiPageComponent,
  UiPageHeaderComponent,
  UiPageHeaderHeadingComponent,
} from '@/app/components/ui/page'
import {
  UiDialogComponent,
  UiDialogContentComponent,
  UiDialogDescriptionComponent,
  UiDialogFooterComponent,
  UiDialogHeaderComponent,
  UiDialogTitleComponent,
} from '@/app/components/ui/dialog/dialog.component'
import {
  UiPopoverComponent,
  UiPopoverContentComponent,
  UiPopoverTriggerComponent,
} from '@/app/components/ui/popover/popover.component'
import {
  UiTooltipComponent,
  UiTooltipContentComponent,
  UiTooltipProviderComponent,
  UiTooltipTriggerComponent,
} from '@/app/components/ui/tooltip/tooltip.component'

interface Message {
  id: string
  sender: string
  email: string
  initials: string
  subject: string
  preview: string
  body: string
  time: string
  read: boolean
  starred: boolean
  folder: 'inbox' | 'sent' | 'drafts' | 'spam'
  tags: string[]
}

type FolderId = Message['folder']

const FOLDERS: { id: FolderId, label: string, icon: typeof Inbox, count: number }[] = [
  { id: 'inbox', label: 'Inbox', icon: Inbox, count: 12 },
  { id: 'sent', label: 'Sent', icon: SentIcon, count: 0 },
  { id: 'drafts', label: 'Drafts', icon: FileText, count: 3 },
  { id: 'spam', label: 'Spam', icon: AlertCircle, count: 0 },
]

const MESSAGES: Message[] = [
  { id: '1', sender: 'Sarah Connor', email: 'sarah@acme.com', initials: 'SC', subject: 'Q2 roadmap review — Design Engineering', preview: 'Can we move the component audit to Thursday? The team needs one more day to finish the token migration.', body: 'Hi team,\n\nCan we move the component audit to Thursday? The team needs one more day to finish the token migration.\n\nAlso — the new KpiGrid spec looks great. One question: do we want to support 6-column layout or cap at 5?\n\nSarah', time: '10:32 AM', read: false, starred: true, folder: 'inbox', tags: ['work', 'roadmap'] },
  { id: '2', sender: 'Marcus Rivera', email: 'marcus@acme.com', initials: 'MR', subject: 'Re: Auth middleware token storage', preview: 'I reviewed the PR. The compliance-ready token storage looks solid. One nit on the retry logic — see line 84.', body: 'I reviewed the PR. The compliance-ready token storage looks solid. One nit on the retry logic — see line 84.\n\nAlso flagged the missing test for the edge case where refresh returns 401. Can you add that before merge?\n\n— Marcus', time: '9:15 AM', read: false, starred: false, folder: 'inbox', tags: ['code-review'] },
  { id: '3', sender: 'Alice Chen', email: 'alice@acme.com', initials: 'AC', subject: 'Sparkline tooltip precision', preview: 'Fixed in PR 1283. The hover now shows full-precision values instead of rounding to 1 decimal.', body: 'Fixed in PR 1283. The hover now shows full-precision values instead of rounding to 1 decimal.\n\nScreenshot attached. Let me know if the formatting looks off on your end.\n\nAlice', time: 'Yesterday', read: true, starred: true, folder: 'inbox', tags: ['bugfix'] },
  { id: '4', sender: 'David Kim', email: 'david@acme.com', initials: 'DK', subject: 'Dark mode WCAG AAA tokens', preview: 'Maybe we should land the WCAG AAA tokens as a separate PR? The diff is already +400 lines.', body: 'Maybe we should land the WCAG AAA tokens as a separate PR? The diff is already +400 lines.\n\nI worry about review fatigue if we bundle it with the high-contrast override.\n\nDavid', time: 'Yesterday', read: true, starred: false, folder: 'inbox', tags: ['design-system'] },
  { id: '5', sender: 'Eva Johnson', email: 'eva@acme.com', initials: 'EJ', subject: 'WIP: native AbortSignal in API wrapper', preview: 'Pushed 4 commits to feature/abort-signal. Still need to handle the timeout edge case.', body: 'Pushed 4 commits to feature/abort-signal. Still need to handle the timeout edge case.\n\nThe wrapper now accepts signal?: AbortSignal and passes it through to fetch. Works in Chrome and Firefox. Safari needs testing.\n\nEva', time: 'Yesterday', read: true, starred: false, folder: 'inbox', tags: ['engineering'] },
  { id: '6', sender: 'Frank Lee', email: 'frank@acme.com', initials: 'FL', subject: 'QA sign-off for Sprint 24', preview: 'All P0s passed. Two P1s remaining — both UI polish, no blockers for release.', body: 'All P0s passed. Two P1s remaining — both UI polish, no blockers for release.\n\nFull report is in Notion. Let me know if you want me to walk through the edge cases.\n\nFrank', time: 'Sep 25', read: true, starred: false, folder: 'inbox', tags: ['qa'] },
  { id: '7', sender: 'Olive Park', email: 'olive@acme.com', initials: 'OP', subject: 'Welcome to the team!', preview: 'Thanks for the onboarding doc. The local setup took 12 minutes — faster than expected.', body: 'Thanks for the onboarding doc. The local setup took 12 minutes — faster than expected.\n\nOne thing I noticed: the env.example is missing the DATABASE_URL variable. Should I open a PR?\n\nOlive', time: 'Sep 24', read: true, starred: false, folder: 'inbox', tags: ['onboarding'] },
  { id: '8', sender: 'Northwind Industries', email: 'ops@northwind.example', initials: 'NI', subject: 'Enterprise contract renewal', preview: 'We would like to renew for another 12 months at the current Enterprise tier.', body: 'We would like to renew for another 12 months at the current Enterprise tier.\n\nCould you send the updated invoice by end of week?\n\n— Northwind Ops', time: 'Sep 23', read: true, starred: true, folder: 'inbox', tags: ['sales'] },
  { id: '9', sender: 'Sentinel Labs', email: 'team@sentinel.example', initials: 'SL', subject: 'Feedback: streaming citations', preview: '"Streaming citations are a game-changer. Our legal team saves ~3h per brief."', body: '"Streaming citations are a game-changer. Our legal team saves ~3h per brief."\n\nWould love to see batch citation export in the next quarter. Happy to beta test.\n\n— Sentinel Labs', time: 'Sep 21', read: true, starred: true, folder: 'inbox', tags: ['feedback'] },
  { id: '10', sender: 'System', email: 'system@acme.com', initials: 'SY', subject: 'Weekly digest — Sep 21', preview: '37 tasks closed, 12 opened. 4 deploys to production. Zero incidents.', body: 'Weekly digest — Sep 21\n\n37 tasks closed, 12 opened.\n4 deploys to production.\nZero incidents.\n\nTop contributor: Alice Chen (8 merged PRs)\n\n— Acme Bot', time: 'Sep 21', read: true, starred: false, folder: 'inbox', tags: ['system'] },
]

// Hashed avatar tint from the chart-N/15 set so each sender keeps one color.
const AVATAR_TONES = [
  'bg-chart-1/15 text-chart-1',
  'bg-chart-2/15 text-chart-2',
  'bg-chart-3/15 text-chart-3',
  'bg-chart-4/15 text-chart-4',
  'bg-chart-5/15 text-chart-5',
]

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-messages',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    TranslatePipe,
    UiAvatarComponent,
    UiAvatarFallbackComponent,
    UiBadgeComponent,
    UiButtonComponent,
    UiDialogComponent,
    UiDialogContentComponent,
    UiDialogDescriptionComponent,
    UiDialogFooterComponent,
    UiDialogHeaderComponent,
    UiDialogTitleComponent,
    UiEmptyStateComponent,
    UiInputComponent,
    UiOverlayScrollComponent,
    UiPageBodyComponent,
    UiPageComponent,
    UiPageHeaderComponent,
    UiPageHeaderHeadingComponent,
    UiPopoverComponent,
    UiPopoverContentComponent,
    UiPopoverTriggerComponent,
    UiSelectComponent,
    UiSelectContentComponent,
    UiSelectItemComponent,
    UiSelectTriggerComponent,
    UiSeparatorComponent,
    UiTextareaComponent,
    UiTooltipComponent,
    UiTooltipContentComponent,
    UiTooltipProviderComponent,
    UiTooltipTriggerComponent,
  ],
  template: `
    <ui-page class="flex h-[calc(100dvh-3.5rem-2rem)] flex-col">
      <ui-page-header class="shrink-0">
        <ui-page-header-heading
          [title]="pageTitle()"
          description="Read and reply to messages from your team and customers."
        />
        <div slot="actions" class="flex items-center gap-2">
          <button ui-button size="sm" (click)="composeOpen.set(true)">
            <lucide-icon [img]="Plus" class="size-4" aria-hidden="true" />
            Compose
          </button>
        </div>
      </ui-page-header>

      <ui-page-body [class]="bodyClass">
        <!-- Folders (lg+) -->
        <div class="hidden w-56 shrink-0 flex-col border-r lg:flex">
          <div class="space-y-1 p-3">
            @for (folder of folders; track folder.id) {
              <button
                type="button"
                [attr.aria-pressed]="activeFolder() === folder.id"
                [attr.aria-current]="activeFolder() === folder.id ? 'page' : null"
                [class]="
                  'focus-visible:ring-ring flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none ' +
                  (activeFolder() === folder.id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted')
                "
                (click)="activeFolder.set(folder.id)"
              >
                <span class="flex items-center gap-2">
                  <lucide-icon [img]="folder.icon" class="size-4" aria-hidden="true" />
                  {{ folder.label }}
                </span>
                @if (folder.count > 0) {
                  <span ui-badge variant="secondary" class="px-1.5 tabular-nums">{{ folder.count }}</span>
                }
              </button>
            }
          </div>
          <ui-separator />
          <div class="p-3">
            <p class="text-muted-foreground mb-2 text-xs font-medium">Labels</p>
            <div class="flex flex-wrap gap-1.5">
              @for (tag of ['work', 'code-review', 'bugfix', 'sales', 'system']; track tag) {
                <span ui-badge variant="outline" class="hover:bg-accent cursor-pointer">{{ tag }}</span>
              }
            </div>
          </div>
        </div>

        <!-- Message list -->
        <div
          [class]="
            'min-w-0 flex-1 flex-col md:w-72 md:flex-none md:border-r lg:w-80 ' + (showDetail() ? 'hidden md:flex' : 'flex')
          "
        >
          <div class="space-y-2 border-b p-2">
            <!-- The selected label is rendered explicitly so the closed trigger
                 is never blank (ui-select-value can miss the first paint). -->
            <ui-select [value]="activeFolder()" (valueChange)="activeFolder.set($any($event))">
              <button ui-select-trigger size="sm" class="w-full lg:hidden" aria-label="Folder">
                <span class="truncate">{{ activeFolderLabel() }}</span>
              </button>
              <ui-select-content>
                @for (folder of folders; track folder.id) {
                  <ui-select-item [value]="folder.id">{{ folder.label }}</ui-select-item>
                }
              </ui-select-content>
            </ui-select>
            <div class="relative">
              <lucide-icon
                [img]="Search"
                class="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
                aria-hidden="true"
              />
              <ui-input
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
                placeholder="Search messages..."
                aria-label="Search messages"
                class="h-8 pl-8 text-sm"
              />
            </div>
          </div>
          <ui-overlay-scroll class="flex-1">
            <!-- WHY (Rule79): an empty result renders an EmptyState with a
                 clear-search action, not a bare sentence. -->
            @if (filteredMessages().length === 0) {
              <ui-empty-state
                [icon]="msgEmptyIcon"
                [title]="'dashboard.messages.emptySearchTitle' | translate"
                [description]="'dashboard.messages.emptySearchDescription' | translate"
                class="p-4"
              >
                <ng-template #msgEmptyIcon><lucide-icon [img]="Inbox" /></ng-template>
                <button ui-button variant="outline" size="sm" class="mt-4 h-8 text-xs" (click)="searchQuery.set('')">
                  {{ 'dashboard.messages.clearSearch' | translate }}
                </button>
              </ui-empty-state>
            }
            @for (msg of filteredMessages(); track msg.id) {
              <button
                type="button"
                [class]="
                  'focus-visible:ring-ring flex w-full cursor-pointer gap-3 border-b p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset ' +
                  (selectedId() === msg.id ? 'md:bg-accent' : 'hover:bg-muted/50') +
                  (!msg.read ? ' bg-primary/5' : '')
                "
                (click)="openMessage(msg.id)"
              >
                <ui-avatar class="size-9 shrink-0">
                  <ui-avatar-fallback [class]="'text-xs font-semibold ' + avatarTone(msg.sender)">
                    {{ msg.initials }}
                  </ui-avatar-fallback>
                </ui-avatar>
                <div class="min-w-0 flex-1 space-y-0.5">
                  <div class="flex items-center justify-between gap-2">
                    <!-- WHY (Rule28/30): truncated rows expose full text via
                         title so hover/touch long-press still reveals it. -->
                    <p [class]="'truncate text-sm ' + (!msg.read ? 'font-semibold' : 'font-medium')" [title]="msg.sender">
                      {{ msg.sender }}
                    </p>
                    <span class="text-muted-foreground shrink-0 text-xs tabular-nums">{{ msg.time }}</span>
                  </div>
                  <p [class]="'truncate text-sm ' + (!msg.read ? 'font-medium' : 'text-muted-foreground')" [title]="msg.subject">
                    {{ msg.subject }}
                  </p>
                  <p class="text-muted-foreground line-clamp-1 text-xs" [title]="msg.preview">{{ msg.preview }}</p>
                  <div class="flex items-center gap-1 pt-0.5">
                    @if (msg.starred) {
                      <lucide-icon [img]="Star" class="fill-chart-3 text-chart-3 size-3.5" aria-label="Starred" />
                    }
                    @for (tag of msg.tags.slice(0, 2); track tag) {
                      <span ui-badge variant="secondary" class="px-1.5 py-0">{{ tag }}</span>
                    }
                  </div>
                </div>
              </button>
            }
          </ui-overlay-scroll>
        </div>

        <!-- Reading pane -->
        <div [class]="'min-w-0 flex-1 flex-col ' + (showDetail() ? 'flex' : 'hidden md:flex')">
          @if (selectedMessage(); as sel) {
            <div class="flex items-start justify-between gap-4 border-b p-4">
              <div class="flex min-w-0 items-center gap-3">
                <button
                  ui-button
                  variant="ghost"
                  size="icon"
                  class="size-8 shrink-0 md:hidden"
                  aria-label="Back to messages"
                  (click)="showDetail.set(false)"
                >
                  <lucide-icon [img]="ArrowLeft" class="size-4" aria-hidden="true" />
                </button>
                <ui-avatar class="size-10 shrink-0">
                  <ui-avatar-fallback [class]="'text-sm font-semibold ' + avatarTone(sel.sender)">
                    {{ sel.initials }}
                  </ui-avatar-fallback>
                </ui-avatar>
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium" [title]="sel.sender">{{ sel.sender }}</p>
                  <p class="text-muted-foreground truncate text-xs" [title]="sel.email + ' · ' + sel.time">
                    {{ sel.email }} · {{ sel.time }}
                  </p>
                </div>
              </div>
              <div class="flex shrink-0 items-center gap-1">
                <ui-tooltip-provider>
                  <ui-tooltip>
                    <button
                      ui-button
                      ui-tooltip-trigger
                      variant="ghost"
                      size="icon"
                      class="size-8"
                      [attr.aria-label]="sel.starred ? 'Unstar' : 'Star'"
                    >
                      <lucide-icon
                        [img]="Star"
                        [class]="'size-4 ' + (sel.starred ? 'fill-chart-3 text-chart-3' : 'text-muted-foreground')"
                      />
                    </button>
                    <ui-tooltip-content>
                      <p>{{ sel.starred ? 'Unstar' : 'Star' }}</p>
                    </ui-tooltip-content>
                  </ui-tooltip>
                </ui-tooltip-provider>
                <ui-tooltip-provider>
                  <ui-tooltip>
                    <button ui-button ui-tooltip-trigger variant="ghost" size="icon" class="size-8" aria-label="Archive">
                      <lucide-icon [img]="Archive" class="text-muted-foreground size-4" />
                    </button>
                    <ui-tooltip-content><p>Archive</p></ui-tooltip-content>
                  </ui-tooltip>
                </ui-tooltip-provider>
                <ui-popover>
                  <button ui-button ui-popover-trigger variant="ghost" size="icon" class="size-8" aria-label="More actions">
                    <lucide-icon [img]="MoreHorizontal" class="text-muted-foreground size-4" />
                  </button>
                  <ui-popover-content align="end" class="w-40 p-1">
                    <button
                      type="button"
                      class="hover:bg-accent focus-visible:ring-ring flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <lucide-icon [img]="CheckCheck" class="size-3.5" aria-hidden="true" />Mark as read
                    </button>
                    <button
                      type="button"
                      class="hover:bg-accent text-destructive focus-visible:ring-ring flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <lucide-icon [img]="Trash2" class="size-3.5" aria-hidden="true" />Delete
                    </button>
                  </ui-popover-content>
                </ui-popover>
              </div>
            </div>

            <div class="flex-1 overflow-auto p-4">
              <h2 class="mb-2 text-base font-semibold">{{ sel.subject }}</h2>
              <div class="mb-4 flex flex-wrap gap-1.5">
                @for (tag of sel.tags; track tag) {
                  <span ui-badge variant="secondary">{{ tag }}</span>
                }
              </div>
              <p class="text-sm leading-relaxed whitespace-pre-line">{{ sel.body }}</p>
            </div>

            <div class="border-t p-4">
              <div class="flex items-end gap-2">
                <label for="msg-reply" class="sr-only">Reply</label>
                <ui-textarea
                  id="msg-reply"
                  placeholder="Reply..."
                  class="flex-1"
                  inputClassName="min-h-20 resize-y"
                  [value]="replyBody()"
                  (valueChange)="replyBody.set($event)"
                />
                <ui-tooltip-provider>
                  <ui-tooltip>
                    <button ui-button ui-tooltip-trigger size="icon" class="size-9" aria-label="Send reply" (click)="sendReply()">
                      <lucide-icon [img]="Send" class="size-4" />
                    </button>
                    <ui-tooltip-content><p>Send reply</p></ui-tooltip-content>
                  </ui-tooltip>
                </ui-tooltip-provider>
              </div>
            </div>
          } @else {
            <div class="text-muted-foreground flex flex-1 items-center justify-center">
              <p class="text-sm">Select a message to read</p>
            </div>
          }
        </div>
      </ui-page-body>
    </ui-page>

    <ui-dialog [open]="composeOpen()" (openChange)="composeOpen.set($event)">
      <ui-dialog-content class="sm:max-w-lg">
        <ui-dialog-header>
          <ui-dialog-title>New message</ui-dialog-title>
          <ui-dialog-description>Compose a new message to your team.</ui-dialog-description>
        </ui-dialog-header>
        <div class="grid gap-4 py-1">
          <ui-input placeholder="To" aria-label="To" />
          <ui-input placeholder="Subject" aria-label="Subject" />
          <label for="msg-compose" class="sr-only">Message</label>
          <ui-textarea id="msg-compose" placeholder="Write your message..." inputClassName="min-h-30 resize-y" />
        </div>
        <ui-dialog-footer>
          <button ui-button variant="outline" (click)="composeOpen.set(false)">Cancel</button>
          <button ui-button (click)="composeOpen.set(false)">Send</button>
        </ui-dialog-footer>
      </ui-dialog-content>
    </ui-dialog>
  `,
})
export class DashboardMessagesComponent {
  protected readonly Archive = Archive
  protected readonly ArrowLeft = ArrowLeft
  protected readonly CheckCheck = CheckCheck
  protected readonly Inbox = Inbox
  protected readonly MoreHorizontal = MoreHorizontal
  protected readonly Plus = Plus
  protected readonly Search = Search
  protected readonly Send = Send
  protected readonly Star = Star
  protected readonly Trash2 = Trash2

  readonly pageTitle = injectPageTitle()
  readonly bodyClass = cn(cardVariants(), 'flex min-h-0 flex-1 overflow-hidden')
  readonly folders = FOLDERS
  readonly activeFolder = signal<FolderId>('inbox')
  readonly activeFolderLabel = computed(() => FOLDERS.find((f) => f.id === this.activeFolder())?.label ?? '')
  readonly searchQuery = signal('')
  readonly selectedId = signal<string | null>('1')
  // Below md the panes stack: list first, then the reading pane with a back button.
  readonly showDetail = signal(false)
  readonly composeOpen = signal(false)
  readonly replyBody = signal('')

  readonly filteredMessages = computed(() => {
    let list = MESSAGES.filter((m) => m.folder === this.activeFolder())
    const q = this.searchQuery().trim().toLowerCase()
    if (q) {
      list = list.filter(
        (m) =>
          m.subject.toLowerCase().includes(q) ||
          m.sender.toLowerCase().includes(q) ||
          m.preview.toLowerCase().includes(q),
      )
    }
    return list
  })

  readonly selectedMessage = computed(() => MESSAGES.find((m) => m.id === this.selectedId()) ?? null)

  avatarTone(name: string): string {
    let hash = 0
    for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
    return AVATAR_TONES[hash % AVATAR_TONES.length]!
  }

  openMessage(id: string): void {
    this.selectedId.set(id)
    this.showDetail.set(true)
  }

  sendReply(): void {
    this.replyBody.set('')
  }
}
