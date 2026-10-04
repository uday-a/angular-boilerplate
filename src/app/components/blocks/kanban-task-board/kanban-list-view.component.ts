// List view of the kanban board. Port of nuxt-boilerplate's
// components/kanban/KanbanListView.vue: sortable columns, grouped by status
// with collapsible groups, inline status select, per-row detail link.
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import {
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  LucideAngularModule,
  MessageSquare,
  Paperclip,
} from 'lucide-angular'
import { UiBadgeComponent } from '@/app/components/ui/badge/badge.component'
import {
  UiSelectComponent,
  UiSelectContentComponent,
  UiSelectItemComponent,
  UiSelectTriggerComponent,
  UiSelectValueComponent,
} from '@/app/components/ui/select/select.component'
import { UiTooltipDirective } from '@/app/components/ui/tooltip/tooltip.component'
import { getTaskColumn, type KanbanColumn, type KanbanTask } from '@/app/core/dashboard/kanban'
import {
  KanbanDueBadgeComponent,
  KanbanPriorityBadgeComponent,
  KanbanSubtaskProgressComponent,
  KanbanUserAvatarComponent,
} from './kanban-parts'

type SortField = 'id' | 'title' | 'priority' | 'assignee' | 'dueDate' | 'status'

interface FlatTask {
  task: KanbanTask
  columnId: string
  dotColor: string
}

const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
const GRID = 'grid grid-cols-[60px_1fr_100px_110px_130px_100px_80px] items-center gap-2'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'kanban-list-view',
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    UiBadgeComponent,
    UiSelectComponent,
    UiSelectContentComponent,
    UiSelectItemComponent,
    UiSelectTriggerComponent,
    UiSelectValueComponent,
    UiTooltipDirective,
    KanbanDueBadgeComponent,
    KanbanPriorityBadgeComponent,
    KanbanSubtaskProgressComponent,
    KanbanUserAvatarComponent,
  ],
  host: { class: 'flex min-h-0 flex-1 flex-col overflow-auto pb-3 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]' },
  template: `
    <div class="min-w-[760px]">
      <div [class]="'bg-muted text-muted-foreground sticky top-0 z-10 rounded-t-lg border px-3 py-2 text-xs font-medium tracking-wider uppercase ' + grid">
        @for (h of headers; track h.field) {
          <button
            type="button"
            class="focus-visible:ring-ring flex items-center gap-1 rounded-sm text-left focus-visible:ring-2 focus-visible:outline-none"
            [attr.aria-sort]="ariaSort(h.field)"
            (click)="toggleSort(h.field)"
          >
            {{ h.label }}
            <lucide-icon
              [img]="SortIcon"
              [class]="'size-3 ' + (sortField() === h.field ? 'text-foreground' : 'text-muted-foreground')"
              aria-hidden="true"
            />
          </button>
        }
        <span class="text-center">Info</span>
      </div>

      @for (group of groups(); track group.column.id) {
        <button
          type="button"
          class="bg-muted/30 hover:bg-muted/50 flex w-full items-center gap-2 border-x border-b px-3 py-1.5 text-left transition-colors"
          [attr.aria-expanded]="!collapsedGroups().has(group.column.id)"
          (click)="toggleGroup(group.column.id)"
        >
          <lucide-icon
            [img]="collapsedGroups().has(group.column.id) ? ChevronRightIcon : ChevronDownIcon"
            class="text-muted-foreground size-3.5"
            aria-hidden="true"
          />
          <span [class]="'size-2 rounded-full ' + group.column.dotColor"></span>
          <span class="text-sm font-medium">{{ group.column.title }}</span>
          <ui-badge variant="secondary" class="ml-1 h-4 px-1.5 text-xs tabular-nums">{{ group.tasks.length }}</ui-badge>
        </button>

        @if (!collapsedGroups().has(group.column.id)) {
          @for (item of group.tasks; track item.task.id) {
            <div [class]="'group/row hover:bg-muted/30 relative border-x border-b px-3 py-2 transition-colors ' + grid">
              <span class="text-muted-foreground font-mono text-xs">{{ item.task.id }}</span>

              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <!-- Row's one link, stretched over the row; the status select
                       and tooltips sit above it (z-10). -->
                  <a
                    [routerLink]="['/dashboard/kanban', item.task.id]"
                    [title]="item.task.title"
                    [class]="
                      'truncate text-left text-sm font-medium outline-none after:absolute after:inset-0 focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50 focus-visible:after:ring-inset ' +
                      (item.columnId === 'done' ? 'text-muted-foreground line-through' : '')
                    "
                  >
                    {{ item.task.title }}
                  </a>
                  <lucide-icon
                    [img]="ExternalLinkIcon"
                    class="text-muted-foreground size-3 shrink-0 opacity-0 transition-opacity group-hover/row:opacity-100"
                    aria-hidden="true"
                  />
                </div>
                @if (item.task.tags.length || item.task.subtaskIds.length) {
                  <div class="mt-0.5 flex items-center gap-1.5">
                    @for (tag of item.task.tags; track tag.label) {
                      <span [class]="'rounded-md px-1.5 py-0 text-xs font-medium ring-1 ring-inset ' + tag.color">{{ tag.label }}</span>
                    }
                    @if (item.task.subtaskIds.length) {
                      <kanban-subtask-progress
                        class="ml-1 min-w-24"
                        [done]="subtasksDone(item.task)"
                        [total]="item.task.subtaskIds.length"
                      />
                    }
                  </div>
                }
              </div>

              <div>
                <ui-select [value]="item.columnId" (valueChange)="moveTask.emit({ task: item.task, columnId: $event })">
                  <button
                    ui-select-trigger
                    aria-label="Status"
                    class="hover:bg-muted relative z-10 h-6 w-auto gap-1 rounded-md border-none bg-transparent px-1.5 text-xs font-medium shadow-none"
                  >
                    <span [class]="'size-1.5 shrink-0 rounded-full ' + item.dotColor"></span>
                    <ui-select-value />
                  </button>
                  <ui-select-content>
                    @for (col of allColumns; track col.id) {
                      <ui-select-item [value]="col.id">{{ col.title }}</ui-select-item>
                    }
                  </ui-select-content>
                </ui-select>
              </div>

              <kanban-priority-badge [priority]="item.task.priority" />

              <div class="flex min-w-0 items-center gap-2">
                <kanban-user-avatar [name]="item.task.assignee.name" [color]="item.task.assignee.color" size="xs" />
                <span class="relative z-10 truncate text-xs" [title]="item.task.assignee.name">{{ item.task.assignee.name }}</span>
              </div>

              <div class="flex">
                @if (item.task.dueDate) {
                  <kanban-due-badge [dueDate]="item.task.dueDate" variant="chip" />
                } @else {
                  <span class="text-muted-foreground text-xs">—</span>
                }
              </div>

              <div class="flex items-center justify-center gap-2">
                @if (item.task.commentItems.length) {
                  <span
                    class="text-muted-foreground relative z-10 flex items-center gap-0.5 text-xs tabular-nums"
                    [uiTooltip]="item.task.commentItems.length + ' comments'"
                  >
                    <lucide-icon [img]="CommentIcon" class="size-3" aria-hidden="true" />
                    {{ item.task.commentItems.length }}
                  </span>
                }
                @if (item.task.fileItems.length) {
                  <span
                    class="text-muted-foreground relative z-10 flex items-center gap-0.5 text-xs tabular-nums"
                    [uiTooltip]="item.task.fileItems.length + ' files'"
                  >
                    <lucide-icon [img]="FileIcon" class="size-3" aria-hidden="true" />
                    {{ item.task.fileItems.length }}
                  </span>
                }
              </div>
            </div>
          }
        }
      }

      @if (flatCount() === 0) {
        <div class="text-muted-foreground flex items-center justify-center rounded-b-lg border-x border-b py-4 text-sm">
          No tasks match your filters.
        </div>
      }
    </div>
  `,
})
export class KanbanListViewComponent {
  protected readonly SortIcon = ArrowUpDown
  protected readonly ChevronDownIcon = ChevronDown
  protected readonly ChevronRightIcon = ChevronRight
  protected readonly ExternalLinkIcon = ExternalLink
  protected readonly CommentIcon = MessageSquare
  protected readonly FileIcon = Paperclip
  protected readonly grid = GRID

  protected readonly headers: { field: SortField, label: string }[] = [
    { field: 'id', label: 'ID' },
    { field: 'title', label: 'Task' },
    { field: 'status', label: 'Status' },
    { field: 'priority', label: 'Priority' },
    { field: 'assignee', label: 'Assignee' },
    { field: 'dueDate', label: 'Due' },
  ]

  private readonly filtered = signal<KanbanColumn[]>([])
  private readonly all = signal<KanbanColumn[]>([])

  /** Filtered columns (what to show). */
  @Input({ required: true }) set columns(v: KanbanColumn[]) {
    this.filtered.set(v)
  }

  /** Every column (status options, subtask progress, group order). */
  @Input({ required: true }) set allColumns(v: KanbanColumn[]) {
    this.all.set(v)
  }

  get allColumns(): KanbanColumn[] {
    return this.all()
  }

  @Output() readonly moveTask = new EventEmitter<{ task: KanbanTask, columnId: string }>()

  readonly sortField = signal<SortField>('status')
  readonly sortDir = signal<'asc' | 'desc'>('asc')
  readonly collapsedGroups = signal<ReadonlySet<string>>(new Set())

  private readonly flat = computed<FlatTask[]>(() => {
    const items: FlatTask[] = []
    for (const col of this.filtered()) {
      for (const task of col.tasks) items.push({ task, columnId: col.id, dotColor: col.dotColor })
    }
    const order = this.all().map(c => c.id)
    const field = this.sortField()
    const dir = this.sortDir() === 'desc' ? -1 : 1
    return items.sort((a, b) => {
      let cmp = 0
      switch (field) {
        case 'id':
          cmp = parseInt(a.task.id.replace(/^[A-Z]+-/, ''), 10) - parseInt(b.task.id.replace(/^[A-Z]+-/, ''), 10)
          break
        case 'title':
          cmp = a.task.title.localeCompare(b.task.title)
          break
        case 'priority':
          cmp = (priorityOrder[a.task.priority] ?? 99) - (priorityOrder[b.task.priority] ?? 99)
          break
        case 'assignee':
          cmp = a.task.assignee.name.localeCompare(b.task.assignee.name)
          break
        case 'dueDate':
          cmp = (a.task.dueDate ?? '9999').localeCompare(b.task.dueDate ?? '9999')
          break
        case 'status':
          cmp = order.indexOf(a.columnId) - order.indexOf(b.columnId)
          break
      }
      return cmp * dir
    })
  })

  readonly flatCount = computed(() => this.flat().length)
  readonly groups = computed(() =>
    this.all().map(column => ({ column, tasks: this.flat().filter(t => t.columnId === column.id) })),
  )

  toggleSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDir.update(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      this.sortField.set(field)
      this.sortDir.set('asc')
    }
  }

  ariaSort(field: SortField): 'ascending' | 'descending' | 'none' {
    if (this.sortField() !== field) return 'none'
    return this.sortDir() === 'asc' ? 'ascending' : 'descending'
  }

  toggleGroup(id: string): void {
    this.collapsedGroups.update((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  subtasksDone(task: KanbanTask): number {
    return task.subtaskIds.filter(id => getTaskColumn(this.all(), id)?.id === 'done').length
  }
}
