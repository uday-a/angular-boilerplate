import {
  Component,
  ContentChild,
  Injector,
  TemplateRef,
  ViewChild,
  computed,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import {
  Archive,
  BellOff,
  CreditCard,
  FileText,
  LucideAngularModule,
  Rocket,
  ShieldCheck,
  TriangleAlert,
  UserPlus,
  X,
  type LucideIconData,
} from 'lucide-angular'
import { cn } from '@/app/core/utils/cn'
import { UiBadgeComponent } from '@/app/components/ui/badge/badge.component'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import {
  UiPopoverComponent,
  UiPopoverContentComponent,
  UiPopoverTriggerComponent,
} from '@/app/components/ui/popover/popover.component'

export type NotificationCategory = 'team' | 'billing' | 'deploy' | 'alert' | 'security' | 'system'

export interface Notification {
  id: string
  title: string
  body: string
  category: NotificationCategory
  timestamp: Date
  read: boolean
  actionUrl?: string
  actor?: string
}

/** Context of the trigger template: `let-unreadCount="unreadCount"` (or `let-count` for $implicit). */
export interface NotificationsPopoverTriggerContext {
  $implicit: number
  unreadCount: number
}

const categoryConfig: Record<NotificationCategory, { icon: LucideIconData; accent: string; bg: string }> = {
  team: {
    icon: UserPlus,
    accent: 'bg-success',
    bg: 'bg-success/10 text-success',
  },
  billing: {
    icon: CreditCard,
    accent: 'bg-info',
    bg: 'bg-info/10 text-info',
  },
  deploy: {
    icon: Rocket,
    accent: 'bg-chart-1',
    bg: 'bg-chart-1/10 text-chart-1',
  },
  alert: {
    icon: TriangleAlert,
    accent: 'bg-warning',
    bg: 'bg-warning/10 text-warning',
  },
  security: {
    icon: ShieldCheck,
    accent: 'bg-primary',
    bg: 'bg-primary/10 text-primary',
  },
  system: {
    icon: FileText,
    accent: 'bg-muted-foreground',
    bg: 'bg-muted text-muted-foreground',
  },
}

const now = new Date()

const initialNotifications: Notification[] = [
  {
    id: '1',
    title: 'Deploy succeeded',
    body: 'v2.14.0 is live in production. 38 changes shipped.',
    category: 'deploy',
    timestamp: new Date(now.getTime() - 720000),
    read: false,
    actor: 'Deploy bot',
  },
  {
    id: '2',
    title: 'New member joined',
    body: 'Chloe Morgan accepted your invite and joined as Editor.',
    category: 'team',
    timestamp: new Date(now.getTime() - 2700000),
    read: false,
    actor: 'Chloe Morgan',
  },
  {
    id: '3',
    title: 'Usage at 94% of limit',
    body: 'Active file bundles: 47 of 50 used. Upgrade or archive to stay under the cap.',
    category: 'alert',
    timestamp: new Date(now.getTime() - 7200000),
    read: false,
  },
  {
    id: '4',
    title: 'Invoice paid',
    body: 'INV-2031 for $149.00 was charged to Visa ending 4242.',
    category: 'billing',
    timestamp: new Date(now.getTime() - 18000000),
    read: true,
  },
  {
    id: '5',
    title: 'New sign-in from Berlin',
    body: 'Chrome on macOS. If this wasn’t you, revoke the session in Security.',
    category: 'security',
    timestamp: new Date(now.getTime() - 28800000),
    read: true,
  },
  {
    id: '6',
    title: 'Weekly report ready',
    body: 'Your workspace summary for Sep 22 – 28 is ready to view.',
    category: 'system',
    timestamp: new Date(now.getTime() - 93600000),
    read: true,
  },
  {
    id: '7',
    title: 'Deploy rolled back',
    body: 'v2.13.2 was rolled back after a failed health check in eu-west.',
    category: 'deploy',
    timestamp: new Date(now.getTime() - 100800000),
    read: true,
    actor: 'Deploy bot',
  },
  {
    id: '8',
    title: 'API key expires soon',
    body: 'The “CI deploys” key expires in 7 days. Rotate it to avoid failed builds.',
    category: 'security',
    timestamp: new Date(now.getTime() - 172800000),
    read: true,
  },
]

const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

function formatTime(date: Date): string {
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays}d ago`
}

/**
 * NotificationsPopover -- the Nuxt block, 1:1. A header-grade notifications panel:
 * All / Unread filter tabs, Today / Earlier groups, category-coloured accent bars,
 * hover-dismiss, mark-all-read and a staggered slide-in.
 *
 * Bring your own trigger (Nuxt's scoped slot): project an
 * `<ng-template>` whose context carries the live `unreadCount`, and put
 * `ui-popover-trigger` on the element -- the reka-ui `asChild` equivalent, so the button
 * itself gets aria-expanded / data-state and focus returns to it on close:
 *
 * ```html
 * <ui-notifications-popover>
 *   <ng-template let-unreadCount="unreadCount">
 *     <button ui-button ui-popover-trigger variant="ghost" size="icon" aria-label="Notifications">
 *       <lucide-icon [img]="Bell" class="size-4" />
  *     @if (unreadCount > 0) { <span class="bg-primary ring-background absolute top-1.5 right-1.5 size-2 rounded-full ring-2"></span> }
 *     </button>
 *   </ng-template>
 * </ui-notifications-popover>
 * ```
 *
  * The Nuxt block relies on OverlayScroll + a bottom fade div; here the scroll area
  * is Tailwind utilities and the keyframe comes from tw-animate-css
  * (`animate-in fade-in-0 slide-in-from-bottom-1`), which Popover already uses.
  */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-notifications-popover, [ui-notifications-popover]',
  standalone: true,
  // Nuxt renders no wrapper (Popover root has no element): keep the host out of layout.
  host: { class: 'contents' },
  imports: [
    NgTemplateOutlet,
    LucideAngularModule,
    UiBadgeComponent,
    UiButtonComponent,
    UiPopoverComponent,
    UiPopoverTriggerComponent,
    UiPopoverContentComponent,
  ],
  template: `
    <ui-popover [open]="isOpen()" (openChange)="isOpen.set($event)">
      @if (triggerTemplate) {
        <ng-container
          *ngTemplateOutlet="
            triggerTemplate;
            context: { $implicit: unreadCount(), unreadCount: unreadCount() };
            injector: triggerInjector
          "
        />
      } @else {
        <span ui-popover-trigger></span>
      }
      <ui-popover-content
        align="end"
        [sideOffset]="8"
        class="notification-panel w-[380px] overflow-hidden rounded-lg border p-0 shadow-xl"
      >
        <div class="flex items-center justify-between px-4 pt-4 pb-3">
          <div class="flex items-center gap-2.5">
            <h3 class="text-sm font-semibold tracking-tight">Notifications</h3>
            @if (unreadCount() > 0) {
              <span
                ui-badge
                class="bg-primary/15 text-primary hover:bg-primary/15 h-5 rounded-full px-1.5 text-xs font-semibold tabular-nums"
              >
                {{ unreadCount() }}
              </span>
            }
          </div>
          @if (unreadCount() > 0) {
            <button
              ui-button
              variant="ghost"
              size="sm"
              class="text-muted-foreground hover:text-foreground -mr-1 h-7 px-2 text-xs"
              (click)="markAllRead()"
            >
              Mark all read
            </button>
          }
        </div>

        <div class="border-b px-4">
          <div class="flex gap-0">
            <button [class]="tabClass('all')" (click)="activeFilter.set('all')">
              All
              @if (activeFilter() === 'all') {
                <span class="bg-primary absolute right-0 bottom-0 left-0 h-[2px] rounded-t-full"></span>
              }
            </button>
            <button [class]="tabClass('unread')" (click)="activeFilter.set('unread')">
              Unread
              @if (activeFilter() === 'unread') {
                <span class="bg-primary absolute right-0 bottom-0 left-0 h-[2px] rounded-t-full"></span>
              }
            </button>
          </div>
        </div>

        <div
          class="notification-scroll [&::-webkit-scrollbar-thumb]:bg-border relative max-h-[420px] overflow-y-auto after:pointer-events-none after:sticky after:right-0 after:bottom-0 after:left-0 after:-mt-6 after:block after:h-6 after:bg-[linear-gradient(to_bottom,transparent,var(--popover))] after:content-[''] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-[2px] [&::-webkit-scrollbar-track]:bg-transparent"
        >
          @if (filteredNotifications().length === 0) {
            <div class="flex flex-col items-center justify-center py-4 text-center">
              <div class="bg-muted mb-3 rounded-full p-3">
                <lucide-icon [img]="BellOff" class="text-muted-foreground size-5" />
              </div>
              <p class="text-sm font-medium">All caught up</p>
              <p class="text-muted-foreground mt-0.5 text-xs">
                No {{ activeFilter() === 'unread' ? 'unread ' : '' }}notifications
              </p>
            </div>
          } @else {
            @if (groupedNotifications().today.length > 0) {
              <div class="px-4 pt-3 pb-1">
                <span class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Today</span>
              </div>
              @for (n of groupedNotifications().today; track n.id; let index = $index) {
                <ng-container *ngTemplateOutlet="item; context: { $implicit: n, delay: index * 30 }" />
              }
            }

            @if (groupedNotifications().earlier.length > 0) {
              <div class="px-4 pt-3 pb-1">
                <span class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Earlier</span>
              </div>
              @for (n of groupedNotifications().earlier; track n.id; let index = $index) {
                <ng-container
                  *ngTemplateOutlet="
                    item;
                    context: { $implicit: n, delay: (groupedNotifications().today.length + index) * 30 }
                  "
                />
              }
            }
          }
        </div>

        <div class="bg-popover relative z-10 border-t px-4 py-2.5">
          <a
            href="#"
            class="text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 text-xs transition-colors"
            (click)="isOpen.set(false)"
          >
            <lucide-icon [img]="Archive" class="size-3.5" />
            View all notifications
          </a>
        </div>
      </ui-popover-content>
    </ui-popover>

    <ng-template #item let-n let-delay="delay">
      <div
        data-slot="notifications-popover"
        class="group hover:bg-muted animate-in fade-in-0 slide-in-from-bottom-1 relative cursor-pointer transition-colors duration-150"
        [style.animation-delay.ms]="delay"
        (click)="markAsRead(n.id)"
      >
        <div
          [class]="
            cn(
              'absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full transition-opacity',
              !n.read ? categoryStyle(n).accent : 'opacity-0'
            )
          "
        ></div>

        <div class="flex gap-3 px-4 py-3">
          <div [class]="cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg', categoryStyle(n).bg)">
            <lucide-icon [img]="categoryStyle(n).icon" class="size-4" />
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <p [class]="cn('text-sm leading-snug', !n.read ? 'font-semibold' : 'font-medium')">
                {{ n.title }}
              </p>
              <div class="flex shrink-0 items-center gap-1.5">
                <span class="text-muted-foreground text-xs whitespace-nowrap tabular-nums">
                  {{ formatTime(n.timestamp) }}
                </span>
                @if (!n.read) {
                  <span class="bg-primary size-1.5 shrink-0 rounded-full"></span>
                }
              </div>
            </div>
            <p class="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed">{{ n.body }}</p>
          </div>

          <button
            type="button"
            class="text-muted-foreground hover:text-foreground focus-visible:ring-ring mt-0.5 shrink-0 rounded opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none"
            title="Dismiss"
            aria-label="Dismiss"
            (click)="$event.stopPropagation(); dismissNotification(n.id)"
          >
            <lucide-icon [img]="X" class="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </ng-template>
  `,
})
export class UiNotificationsPopoverComponent {
  /** Your trigger: an `<ng-template>` receiving `unreadCount`; mark its element `ui-popover-trigger`. */
  @ContentChild(TemplateRef) triggerTemplate?: TemplateRef<NotificationsPopoverTriggerContext>
  @ViewChild(UiPopoverComponent, { static: true }) private popover!: UiPopoverComponent

  /** Lets `ui-popover-trigger` inside the consumer's template find this block's Popover root. */
  readonly triggerInjector = Injector.create({
    providers: [{ provide: UiPopoverComponent, useFactory: () => this.popover }],
  })

  protected readonly Archive = Archive
  protected readonly BellOff = BellOff
  protected readonly X = X
  protected readonly config = categoryConfig
  protected readonly cn = cn
  protected readonly formatTime = formatTime

  readonly notifications = signal<Notification[]>(initialNotifications)
  readonly activeFilter = signal<'all' | 'unread'>('all')
  readonly isOpen = signal(false)

  readonly unreadCount = computed(() => this.notifications().filter((n) => !n.read).length)

  readonly filteredNotifications = computed(() => {
    if (this.activeFilter() === 'unread') {
      return this.notifications().filter((n) => !n.read)
    }
    return this.notifications()
  })

  /**
   * The row template's `let-n` is untyped (`any`) in an ng-template context, and indexing the
   * config Record with it fails a strict consumer app (TS7053). A typed accessor keeps it typed.
   */
  protected categoryStyle(n: Notification) {
    return this.config[n.category]
  }

  readonly groupedNotifications = computed(() => {
    const today = this.filteredNotifications().filter((n) => n.timestamp >= todayStart)
    const earlier = this.filteredNotifications().filter((n) => n.timestamp < todayStart)
    return { today, earlier }
  })

  protected tabClass(filter: 'all' | 'unread'): string {
    return cn(
      'focus-visible:ring-ring relative rounded-t px-3 pb-2.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
      this.activeFilter() === filter ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
    )
  }

  markAsRead(id: string): void {
    this.notifications.update((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  markAllRead(): void {
    this.notifications.update((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  dismissNotification(id: string): void {
    this.notifications.update((prev) => prev.filter((n) => n.id !== id))
  }
}
