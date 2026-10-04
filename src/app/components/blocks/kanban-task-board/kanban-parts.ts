// Small presentational pieces shared by the kanban board, list view and task
// sheet. Ports nuxt-boilerplate's components/kanban/{DueDateBadge,
// PriorityBadge,SubtaskProgress,UserAvatar}.vue.
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { TranslatePipe } from '@ngx-translate/core'
import { CircleAlert, CircleCheck, Clock, LucideAngularModule } from 'lucide-angular'
import { cn } from '@/app/core/utils/cn'
import { UiAvatarComponent, UiAvatarFallbackComponent } from '@/app/components/ui/avatar/avatar.component'
import { formatDueDate, getDueStatus, getInitials, priorityConfig, type KanbanTask } from '@/app/core/dashboard/kanban'

// Urgency must not rely on color alone: overdue swaps the icon, and both
// overdue + due-soon carry a screen-reader label ("Overdue: Oct 2").
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'kanban-due-badge',
  standalone: true,
  imports: [LucideAngularModule, TranslatePipe],
  host: { '[class]': 'hostClass' },
  template: `
    <lucide-icon [img]="status === 'overdue' ? AlertIcon : ClockIcon" class="size-3" aria-hidden="true" />
    @if (status === 'overdue') {
      <span class="sr-only">{{ 'dashboard.kanban.overdue' | translate }}:</span>
    } @else if (status === 'soon') {
      <span class="sr-only">{{ 'dashboard.kanban.dueSoon' | translate }}:</span>
    }
    {{ label }}
  `,
})
export class KanbanDueBadgeComponent {
  protected readonly AlertIcon = CircleAlert
  protected readonly ClockIcon = Clock

  @Input({ required: true }) dueDate!: string
  @Input() variant: 'chip' | 'inline' = 'inline'

  get status() {
    return getDueStatus(this.dueDate)
  }

  get label(): string {
    return formatDueDate(this.dueDate)
  }

  get hostClass(): string {
    const s = this.status
    if (this.variant === 'chip') {
      return cn(
        'flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium',
        s === 'overdue' ? 'bg-destructive/10 text-destructive' : s === 'soon' ? 'bg-warning/10 text-warning' : 'text-muted-foreground bg-muted',
      )
    }
    return cn(
      'flex items-center gap-1 text-sm leading-tight font-medium',
      s === 'overdue' ? 'text-destructive' : s === 'soon' ? 'text-warning' : 'text-foreground',
    )
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'kanban-priority-badge',
  standalone: true,
  imports: [LucideAngularModule],
  host: { class: 'flex items-center gap-1' },
  template: `
    <lucide-icon [img]="config.icon" [class]="iconSize + ' ' + config.class" aria-hidden="true" />
    <span [class]="'text-xs font-semibold ' + config.class">{{ config.label }}</span>
  `,
})
export class KanbanPriorityBadgeComponent {
  @Input({ required: true }) priority!: KanbanTask['priority']
  @Input() iconSize = 'size-3.5'

  get config() {
    return priorityConfig[this.priority]
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'kanban-subtask-progress',
  standalone: true,
  imports: [LucideAngularModule],
  host: { class: 'block' },
  template: `
    @if (total > 0) {
      <div class="mb-1 flex items-center justify-between">
        <span class="text-muted-foreground text-xs tabular-nums">
          @if (complete) {
            <lucide-icon [img]="CheckIcon" class="text-success mr-0.5 inline size-3" aria-hidden="true" />
          }
          {{ done }}/{{ total }} subtasks
        </span>
        <span class="text-muted-foreground text-xs font-medium tabular-nums">{{ percent }}%</span>
      </div>
      <div class="bg-muted h-1.5 overflow-hidden rounded-full">
        <div
          [class]="'h-full rounded-full transition-all duration-500 ' + (complete ? 'bg-success' : 'bg-primary')"
          [style.width.%]="percent"
        ></div>
      </div>
    }
  `,
})
export class KanbanSubtaskProgressComponent {
  protected readonly CheckIcon = CircleCheck

  @Input() done = 0
  @Input() total = 0

  get percent(): number {
    return this.total > 0 ? Math.round((this.done / this.total) * 100) : 0
  }

  get complete(): boolean {
    return this.total > 0 && this.done === this.total
  }
}

const avatarSizes = { xs: 'size-6', sm: 'size-7', md: 'size-8' } as const

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'kanban-user-avatar',
  standalone: true,
  imports: [UiAvatarComponent, UiAvatarFallbackComponent],
  host: { class: 'contents' },
  template: `
    <ui-avatar [class]="sizeClass + ' shrink-0'">
      <ui-avatar-fallback [class]="'text-xs font-semibold ' + color">{{ initials }}</ui-avatar-fallback>
    </ui-avatar>
  `,
})
export class KanbanUserAvatarComponent {
  @Input({ required: true }) name!: string
  @Input() color = 'bg-muted text-muted-foreground'
  @Input() size: keyof typeof avatarSizes = 'sm'

  get sizeClass(): string {
    return avatarSizes[this.size]
  }

  get initials(): string {
    return getInitials(this.name)
  }
}
