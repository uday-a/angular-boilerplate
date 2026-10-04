// Full kanban board. Port of nuxt-boilerplate's components/blocks/KanbanBoard.vue
// + components/kanban/{KanbanToolbar,KanbanColumn,KanbanCard}.vue: header
// with task count + "Add task", search / priority / assignee filters with an
// active-filter chip row, board/list toggle, collapsible columns, native
// drag-and-drop with an insertion indicator, cards with id, priority, tags,
// subtask progress, due chip, comment/attachment counts and assignee.
//
// State lives in KanbanStore (root-provided) so it survives the page being
// recreated by the /dashboard/kanban/:id route. Cards link to that route;
// the page renders the task sheet for it.
import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core'
import { Router, RouterLink } from '@angular/router'
import { TranslatePipe } from '@ngx-translate/core'
import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  Filter,
  LayoutGrid,
  List,
  LucideAngularModule,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  X,
} from 'lucide-angular'
import { cn } from '@/app/core/utils/cn'
import { UiBadgeComponent } from '@/app/components/ui/badge/badge.component'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import { UiInputComponent } from '@/app/components/ui/input/input.component'
import { UiPageHeaderComponent, UiPageHeaderHeadingComponent } from '@/app/components/ui/page/page.component'
import { UiToggleGroupComponent, UiToggleGroupItemComponent } from '@/app/components/ui/toggle-group/toggle-group.component'
import { UiTooltipDirective } from '@/app/components/ui/tooltip/tooltip.component'
import {
  UiDropdownMenuComponent,
  UiDropdownMenuContentComponent,
  UiDropdownMenuItemComponent,
  UiDropdownMenuSeparatorComponent,
  UiDropdownMenuTriggerComponent,
} from '@/app/components/ui/dropdown-menu/dropdown-menu.component'
import { toast } from '@/app/components/ui/sonner/sonner.component'
import { KanbanStore } from '@/app/core/dashboard/kanban-data'
import {
  assignees,
  getInitials,
  getTaskColumn,
  priorityConfig,
  type KanbanColumn,
  type KanbanTask,
} from '@/app/core/dashboard/kanban'
import {
  KanbanDueBadgeComponent,
  KanbanPriorityBadgeComponent,
  KanbanSubtaskProgressComponent,
  KanbanUserAvatarComponent,
} from './kanban-parts'
import { KanbanListViewComponent } from './kanban-list-view.component'
import { KanbanAddTaskDialogComponent } from './kanban-add-task-dialog.component'

/** Filter columns by search (title or id), priority and assignee name. Pure for tests. */
export function filterColumns(
  columns: KanbanColumn[],
  f: { search: string, priority: string | null, assignee: string | null },
): KanbanColumn[] {
  const q = f.search.toLowerCase()
  return columns.map(col => ({
    ...col,
    tasks: col.tasks.filter(t =>
      (!q || t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
      && (!f.priority || t.priority === f.priority)
      && (!f.assignee || t.assignee.name === f.assignee),
    ),
  }))
}

/** Move a task to (columnId, index); index defaults to the end. Returns new columns. */
export function moveTaskTo(columns: KanbanColumn[], taskId: string, toColumnId: string, toIndex?: number): KanbanColumn[] {
  const next = columns.map(c => ({ ...c, tasks: [...c.tasks] }))
  let fromCol = -1
  let fromIdx = -1
  next.forEach((col, ci) => {
    const i = col.tasks.findIndex(t => t.id === taskId)
    if (i !== -1) {
      fromCol = ci
      fromIdx = i
    }
  })
  const target = next.findIndex(c => c.id === toColumnId)
  if (fromCol === -1 || target === -1) return columns
  const moved = next[fromCol]!.tasks.splice(fromIdx, 1)[0]
  if (!moved) return columns
  let at = toIndex ?? next[target]!.tasks.length + 1
  if (fromCol === target && fromIdx < at) at--
  at = Math.max(0, Math.min(at, next[target]!.tasks.length))
  next[target]!.tasks.splice(at, 0, moved)
  return next
}

const priorityKeys = Object.keys(priorityConfig) as KanbanTask['priority'][]
const people = Object.values(assignees)

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-kanban-task-board',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    LucideAngularModule,
    UiBadgeComponent,
    UiButtonComponent,
    UiInputComponent,
    UiPageHeaderComponent,
    UiPageHeaderHeadingComponent,
    UiToggleGroupComponent,
    UiToggleGroupItemComponent,
    UiTooltipDirective,
    UiDropdownMenuComponent,
    UiDropdownMenuContentComponent,
    UiDropdownMenuItemComponent,
    UiDropdownMenuSeparatorComponent,
    UiDropdownMenuTriggerComponent,
    KanbanDueBadgeComponent,
    KanbanPriorityBadgeComponent,
    KanbanSubtaskProgressComponent,
    KanbanUserAvatarComponent,
    KanbanListViewComponent,
    KanbanAddTaskDialogComponent,
  ],
  host: { 'data-slot': 'kanban-board', class: 'flex h-[calc(100dvh-3.5rem-2rem)] flex-col overflow-hidden' },
  template: `
    <ui-page-header class="mb-4 shrink-0">
      <ui-page-header-heading [title]="title" [description]="description" />
      <div slot="actions" class="flex shrink-0 items-center gap-2">
        <ui-badge variant="secondary" class="tabular-nums">{{ totalTasks() }} tasks</ui-badge>
        <button ui-button size="sm" (click)="openAddTask(defaultColumnId)">
          <lucide-icon [img]="PlusIcon" class="size-4" aria-hidden="true" />
          Add task
        </button>
      </div>
    </ui-page-header>

    <!-- Toolbar (KanbanToolbar) -->
    <div class="mb-3 flex shrink-0 flex-wrap items-center gap-2">
      <div class="relative w-full sm:w-56">
        <lucide-icon
          [img]="SearchIcon"
          class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 z-10 size-3.5 -translate-y-1/2"
          aria-hidden="true"
        />
        <ui-input
          class="h-8 pl-8 text-sm"
          placeholder="Search tasks..."
          aria-label="Search tasks"
          [value]="store.search()"
          (valueChange)="store.search.set($event)"
        />
      </div>

      <ui-dropdown-menu>
        <button ui-button ui-dropdown-menu-trigger variant="outline" size="sm" class="h-8 gap-1.5 text-xs">
          <lucide-icon [img]="FilterIcon" class="size-3" aria-hidden="true" />
          Priority
          @if (store.priority()) {
            <ui-badge class="ml-0.5 h-4 min-w-4 justify-center rounded px-1 text-xs">1</ui-badge>
          }
          <lucide-icon [img]="ChevronDownIcon" class="text-muted-foreground size-3" aria-hidden="true" />
        </button>
        <ui-dropdown-menu-content align="start" class="w-40">
          @for (key of priorityKeys; track key) {
            <ui-dropdown-menu-item class="gap-2" (select)="togglePriority(key)">
              <lucide-icon [img]="priorityConfig[key].icon" [class]="'size-3.5 ' + priorityConfig[key].class" aria-hidden="true" />
              {{ priorityConfig[key].label }}
              @if (store.priority() === key) {
                <span class="bg-primary ml-auto size-1.5 rounded-full"></span>
              }
            </ui-dropdown-menu-item>
          }
          @if (store.priority()) {
            <ui-dropdown-menu-separator />
            <ui-dropdown-menu-item (select)="store.priority.set(null)">Clear filter</ui-dropdown-menu-item>
          }
        </ui-dropdown-menu-content>
      </ui-dropdown-menu>

      <ui-toggle-group
        type="single"
        size="sm"
        class="bg-muted ml-auto flex items-center gap-0.5 rounded-md p-0.5"
        [value]="store.viewMode()"
        (valueChange)="$event && store.viewMode.set($event)"
      >
        <button
          ui-toggle-group-item
          value="board"
          class="data-[state=on]:bg-background size-7 min-w-7 rounded-sm p-0 data-[state=on]:shadow-sm"
          [attr.aria-label]="'dashboard.kanban.boardView' | translate"
          [uiTooltip]="'dashboard.kanban.boardView' | translate"
        >
          <lucide-icon [img]="BoardIcon" class="size-3.5" aria-hidden="true" />
        </button>
        <button
          ui-toggle-group-item
          value="list"
          class="data-[state=on]:bg-background size-7 min-w-7 rounded-sm p-0 data-[state=on]:shadow-sm"
          [attr.aria-label]="'dashboard.kanban.listView' | translate"
          [uiTooltip]="'dashboard.kanban.listView' | translate"
        >
          <lucide-icon [img]="ListIcon" class="size-3.5" aria-hidden="true" />
        </button>
      </ui-toggle-group>

      <div class="flex items-center">
        @for (a of people; track a.name) {
          <button
            type="button"
            [class]="assigneeButtonClass(a.name)"
            [attr.aria-label]="'Filter by ' + a.name"
            [attr.aria-pressed]="store.assignee() === a.name"
            [uiTooltip]="a.name + (store.assignee() === a.name ? ' (filtered)' : '')"
            tooltipSide="bottom"
            (click)="store.assignee.set(store.assignee() === a.name ? null : a.name)"
          >
            <span [class]="'border-background flex size-7 items-center justify-center rounded-full border-2 text-xs font-semibold ' + a.color">
              {{ initials(a.name) }}
            </span>
          </button>
        }
      </div>
    </div>

    @if (store.priority() || store.assignee() || store.search().trim()) {
      <div class="mb-3 flex shrink-0 flex-wrap items-center gap-1.5">
        @if (store.priority(); as p) {
          <ui-badge variant="secondary" class="gap-1 py-0.5 pr-1 text-xs">
            {{ 'dashboard.kanban.priority' | translate }}: {{ priorityLabel(p) }}
            <button type="button" [class]="chipClose" [attr.aria-label]="'dashboard.kanban.clearFilter' | translate" (click)="store.priority.set(null)">
              <lucide-icon [img]="XIcon" class="size-3" aria-hidden="true" />
            </button>
          </ui-badge>
        }
        @if (store.assignee(); as a) {
          <ui-badge variant="secondary" class="gap-1 py-0.5 pr-1 text-xs">
            {{ 'dashboard.kanban.assignee' | translate }}: {{ a }}
            <button type="button" [class]="chipClose" [attr.aria-label]="'dashboard.kanban.clearFilter' | translate" (click)="store.assignee.set(null)">
              <lucide-icon [img]="XIcon" class="size-3" aria-hidden="true" />
            </button>
          </ui-badge>
        }
        @if (store.search().trim()) {
          <ui-badge variant="secondary" class="max-w-56 gap-1 py-0.5 pr-1 text-xs">
            <span class="truncate">{{ 'dashboard.kanban.search' | translate }}: "{{ store.search().trim() }}"</span>
            <button type="button" [class]="chipClose + ' shrink-0'" [attr.aria-label]="'dashboard.kanban.clearFilter' | translate" (click)="store.search.set('')">
              <lucide-icon [img]="XIcon" class="size-3" aria-hidden="true" />
            </button>
          </ui-badge>
        }
      </div>
    }

    @if (store.viewMode() === 'board') {
      <div
        class="relative flex min-h-0 flex-1 items-start gap-3 overflow-x-auto overflow-y-hidden pb-3 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]"
      >
        @for (column of filtered(); track column.id) {
          <div
            [class]="
              'group/col flex max-h-full min-h-0 shrink-0 flex-col transition-all duration-200 ' +
              (isCollapsed(column.id) ? 'w-12' : 'border-border/70 bg-muted/40 w-[300px] rounded-xl border p-2')
            "
            (dragover)="$event.preventDefault()"
            (drop)="onDrop()"
          >
            @if (isCollapsed(column.id)) {
              <button
                type="button"
                class="bg-muted/40 hover:bg-muted/60 flex h-full flex-col items-center gap-2 rounded-xl px-1 pt-3 pb-4 transition-colors"
                [attr.aria-label]="'Expand ' + column.title"
                (click)="toggleCollapse(column.id)"
              >
                <span [class]="'size-2 shrink-0 rounded-full ' + column.dotColor"></span>
                <span [class]="'rotate-180 text-xs font-semibold tracking-tight [writing-mode:vertical-lr] ' + column.color">{{ column.title }}</span>
                <ui-badge variant="secondary" class="mt-1 h-5 min-w-5 justify-center rounded-md px-1 text-xs tabular-nums">
                  {{ column.tasks.length }}
                </ui-badge>
                <lucide-icon [img]="ExpandIcon" class="text-muted-foreground mt-auto size-3.5" aria-hidden="true" />
              </button>
            } @else {
              <div class="mb-2 flex shrink-0 items-center gap-2 rounded-lg bg-[color-mix(in_oklch,var(--muted)_40%,var(--background))] px-2 py-1.5">
                <button
                  type="button"
                  class="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                  aria-label="Collapse column"
                  uiTooltip="Collapse column"
                  (click)="toggleCollapse(column.id)"
                >
                  <lucide-icon [img]="CollapseIcon" class="size-3.5" aria-hidden="true" />
                </button>
                <span [class]="'size-2 shrink-0 rounded-full ' + column.dotColor"></span>
                <h3 [class]="'text-sm font-semibold tracking-tight ' + column.color">{{ column.title }}</h3>
                <span class="text-muted-foreground bg-muted rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums">
                  {{ column.tasks.length }}
                </span>
                <div class="ml-auto flex items-center">
                  <button
                    ui-button
                    variant="ghost"
                    size="icon"
                    class="text-muted-foreground size-6"
                    [attr.aria-label]="'Add task to ' + column.title"
                    (click)="openAddTask(column.id)"
                  >
                    <lucide-icon [img]="PlusIcon" class="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div
                [class]="
                  'flex min-h-15 flex-col overflow-y-auto rounded-lg transition-all duration-200 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] ' +
                  (dragOverColumn() === column.id && draggedTask() ? 'bg-primary/[0.06] ring-primary/25 ring-1 ring-inset' : '')
                "
                (dragover)="onLaneDragOver($event, column.id, column.tasks.length)"
              >
                @for (task of column.tasks; track task.id; let i = $index) {
                  <div
                    [class]="
                      'mx-1 transition-all duration-150 ' +
                      (dragOverColumn() === column.id && dropTargetIndex() === i && draggedTask() && draggedTask() !== task.id
                        ? 'bg-primary h-0.5 rounded-full'
                        : 'h-0')
                    "
                  ></div>
                  <div
                    draggable="true"
                    [attr.data-task-id]="task.id"
                    [class]="'mt-2 first:mt-0 ' + (draggedTask() === task.id ? 'scale-95 rotate-1 opacity-30' : 'opacity-100')"
                    (dragstart)="onDragStart($event, task.id)"
                    (dragend)="resetDrag()"
                    (dragover)="onCardDragOver($event, column.id, i)"
                  >
                    <!-- Card (KanbanCard): the title link is stretched over the
                         card with after:inset-0; menu + avatar sit above it. -->
                    <div
                      class="group/card bg-card animate-in fade-in-0 slide-in-from-bottom-1.5 hover:border-border relative cursor-grab rounded-lg border p-3 transition-all duration-150 hover:shadow-md active:scale-[0.97] active:cursor-grabbing"
                    >
                      <div [class]="accentClass(task)"></div>

                      <div class="mb-1 flex items-center justify-between pl-2">
                        <div class="flex items-center gap-2">
                          <span class="text-muted-foreground font-mono text-xs">{{ task.id }}</span>
                          @if (task.priority === 'urgent' || task.priority === 'high') {
                            <kanban-priority-badge [priority]="task.priority" />
                          }
                        </div>
                        <ui-dropdown-menu>
                          <button
                            ui-button
                            ui-dropdown-menu-trigger
                            variant="ghost"
                            size="icon"
                            class="text-muted-foreground relative z-10 -mr-1 size-6 opacity-0 transition-opacity group-focus-within/card:opacity-100 group-hover/card:opacity-100 data-[state=open]:opacity-100"
                            [attr.aria-label]="'More actions for ' + task.id"
                          >
                            <lucide-icon [img]="MoreIcon" class="size-3.5" aria-hidden="true" />
                          </button>
                          <ui-dropdown-menu-content align="end" class="w-36">
                            <ui-dropdown-menu-item (select)="openTask(task.id)">Quick view</ui-dropdown-menu-item>
                            <ui-dropdown-menu-item class="gap-2" (select)="openTask(task.id)">
                              <lucide-icon [img]="ExternalLinkIcon" class="size-3.5" aria-hidden="true" />
                              Open detail
                            </ui-dropdown-menu-item>
                            <ui-dropdown-menu-item>Edit</ui-dropdown-menu-item>
                            <ui-dropdown-menu-item>Move to...</ui-dropdown-menu-item>
                            <ui-dropdown-menu-item>Assign to...</ui-dropdown-menu-item>
                            <ui-dropdown-menu-separator />
                            <ui-dropdown-menu-item class="text-destructive">Delete</ui-dropdown-menu-item>
                          </ui-dropdown-menu-content>
                        </ui-dropdown-menu>
                      </div>

                      <a
                        draggable="false"
                        [routerLink]="['/dashboard/kanban', task.id]"
                        [attr.aria-label]="cardLabel(task, column.title)"
                        [class]="
                          'mb-2 block w-full cursor-[inherit] pl-2 text-left text-sm leading-snug font-medium outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50 ' +
                          (column.id === 'done' ? 'decoration-muted-foreground/40 line-through' : '')
                        "
                        (click)="onCardClick($event)"
                      >
                        {{ task.title }}
                      </a>

                      @if (task.tags.length) {
                        <div class="mb-2 flex flex-wrap gap-1 pl-2">
                          @for (tag of task.tags; track tag.label) {
                            <span [class]="'rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ' + tag.color">{{ tag.label }}</span>
                          }
                        </div>
                      }

                      @if (task.subtaskIds.length) {
                        <kanban-subtask-progress class="mb-2 pl-2" [done]="subtasksDone(task)" [total]="task.subtaskIds.length" />
                      }

                      <div class="flex items-center gap-2 pl-2">
                        @if (task.dueDate) {
                          <kanban-due-badge [dueDate]="task.dueDate" variant="chip" />
                        }
                        @if (task.commentItems.length) {
                          <div class="text-muted-foreground flex items-center gap-1 text-xs tabular-nums">
                            <lucide-icon [img]="CommentIcon" class="size-3" aria-hidden="true" />
                            {{ task.commentItems.length }}
                            <span class="sr-only">comments</span>
                          </div>
                        }
                        @if (task.fileItems.length) {
                          <div class="text-muted-foreground flex items-center gap-1 text-xs tabular-nums">
                            <lucide-icon [img]="FileIcon" class="size-3" aria-hidden="true" />
                            {{ task.fileItems.length }}
                            <span class="sr-only">attachments</span>
                          </div>
                        }
                        <span class="relative z-10 ml-auto" [uiTooltip]="task.assignee.name" tooltipSide="bottom">
                          <kanban-user-avatar [name]="task.assignee.name" [color]="task.assignee.color" size="xs" />
                        </span>
                      </div>
                    </div>
                  </div>
                }

                @if (column.tasks.length > 0) {
                  <div
                    [class]="
                      'mx-1 transition-all duration-150 ' +
                      (dragOverColumn() === column.id && dropTargetIndex() === column.tasks.length && draggedTask()
                        ? 'bg-primary mt-2 h-0.5 rounded-full'
                        : 'h-0')
                    "
                  ></div>
                } @else {
                  <button
                    type="button"
                    class="text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed py-4 transition-colors"
                    (click)="openAddTask(column.id)"
                  >
                    <lucide-icon [img]="PlusIcon" class="mb-1 size-4" aria-hidden="true" />
                    <span class="text-xs">No tasks</span>
                  </button>
                }
              </div>

              <button
                type="button"
                class="text-muted-foreground hover:text-foreground hover:bg-muted/60 mt-2 flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-xs transition-colors"
                (click)="openAddTask(column.id)"
              >
                <lucide-icon [img]="PlusIcon" class="size-3.5" aria-hidden="true" />
                Add task
              </button>
            }
          </div>
        }
      </div>
    } @else {
      <kanban-list-view [columns]="filtered()" [allColumns]="store.columns()" (moveTask)="moveViaSelect($event.task, $event.columnId)" />
    }

    <kanban-add-task-dialog
      [open]="addOpen()"
      [columns]="store.columns()"
      [initialColumnId]="addColumnId()"
      (openChange)="addOpen.set($event)"
      (create)="onCreate($event.columnId, $event.tasks)"
    />
  `,
})
export class UiKanbanTaskBoardComponent {
  protected readonly store = inject(KanbanStore)
  private readonly router = inject(Router)

  protected readonly PlusIcon = Plus
  protected readonly SearchIcon = Search
  protected readonly FilterIcon = Filter
  protected readonly ChevronDownIcon = ChevronDown
  protected readonly BoardIcon = LayoutGrid
  protected readonly ListIcon = List
  protected readonly XIcon = X
  protected readonly CollapseIcon = ChevronsLeft
  protected readonly ExpandIcon = ChevronsRight
  protected readonly MoreIcon = MoreHorizontal
  protected readonly ExternalLinkIcon = ExternalLink
  protected readonly CommentIcon = MessageSquare
  protected readonly FileIcon = Paperclip
  protected readonly priorityConfig = priorityConfig
  protected readonly priorityKeys = priorityKeys
  protected readonly people = people
  protected readonly chipClose =
    'hover:text-foreground focus-visible:ring-ring inline-flex items-center rounded-full p-0.5 focus-visible:ring-2 focus-visible:outline-none'

  @Input() title = 'Kanban Board'
  @Input() description = 'Drag tasks across columns to update their status.'
  @Input() defaultColumnId = 'backlog'

  readonly filtered = computed(() =>
    filterColumns(this.store.columns(), {
      search: this.store.search(),
      priority: this.store.priority(),
      assignee: this.store.assignee(),
    }),
  )
  readonly totalTasks = computed(() => this.store.columns().reduce((n, c) => n + c.tasks.length, 0))

  readonly draggedTask = signal<string | null>(null)
  readonly dragOverColumn = signal<string | null>(null)
  readonly dropTargetIndex = signal(-1)
  private lastDragEnd = 0

  readonly addOpen = signal(false)
  readonly addColumnId = signal('backlog')

  initials(name: string): string {
    return getInitials(name)
  }

  priorityLabel(key: string): string {
    return priorityConfig[key as KanbanTask['priority']]?.label ?? key
  }

  togglePriority(key: string): void {
    this.store.priority.set(this.store.priority() === key ? null : key)
  }

  assigneeButtonClass(name: string): string {
    const sel = this.store.assignee()
    return cn(
      'ring-background relative -ml-1.5 rounded-full outline-none transition-all first:ml-0 focus-visible:ring-1 focus-visible:ring-ring/50',
      sel === name ? 'ring-primary z-20 ring-1' : sel ? 'opacity-40 hover:opacity-70' : 'hover:z-10 hover:scale-110',
    )
  }

  isCollapsed(id: string): boolean {
    return this.store.collapsed().has(id)
  }

  toggleCollapse(id: string): void {
    this.store.collapsed.update((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  accentClass(task: KanbanTask): string {
    return cn(
      'absolute top-3 bottom-3 left-0 w-[1.5px] rounded-full transition-all duration-150',
      priorityConfig[task.priority].bg,
      task.priority === 'low' ? 'opacity-40' : task.priority === 'medium' ? 'opacity-60' : 'opacity-90',
    )
  }

  cardLabel(task: KanbanTask, status: string): string {
    return `${task.title}, ${status}, ${priorityConfig[task.priority].label} priority`
  }

  subtasksDone(task: KanbanTask): number {
    return task.subtaskIds.filter(id => getTaskColumn(this.store.columns(), id)?.id === 'done').length
  }

  openTask(id: string): void {
    void this.router.navigate(['/dashboard/kanban', id])
  }

  onCardClick(event: MouseEvent): void {
    // A drop can land a click on the card; swallow it.
    if (Date.now() - this.lastDragEnd < 200) event.preventDefault()
  }

  openAddTask(columnId: string): void {
    this.addColumnId.set(columnId)
    this.addOpen.set(true)
  }

  onCreate(columnId: string, tasks: KanbanTask[]): void {
    this.store.columns.update(cols => cols.map(c => (c.id === columnId ? { ...c, tasks: [...c.tasks, ...tasks] } : c)))
  }

  moveViaSelect(task: KanbanTask, columnId: string): void {
    const cols = this.store.columns()
    const from = getTaskColumn(cols, task.id)
    const to = cols.find(c => c.id === columnId)
    if (!from || !to || from.id === columnId) return
    this.store.columns.set(moveTaskTo(cols, task.id, columnId))
    toast(`${task.id} moved to ${to.title}`)
  }

  onDragStart(event: DragEvent, taskId: string): void {
    this.draggedTask.set(taskId)
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', taskId)
    }
  }

  resetDrag(): void {
    this.draggedTask.set(null)
    this.dragOverColumn.set(null)
    this.dropTargetIndex.set(-1)
    this.lastDragEnd = Date.now()
  }

  onCardDragOver(event: DragEvent, columnId: string, index: number): void {
    event.preventDefault()
    event.stopPropagation()
    this.dragOverColumn.set(columnId)
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    this.dropTargetIndex.set(event.clientY < rect.top + rect.height / 2 ? index : index + 1)
  }

  onLaneDragOver(event: DragEvent, columnId: string, count: number): void {
    event.preventDefault()
    this.dragOverColumn.set(columnId)
    this.dropTargetIndex.set(count)
  }

  onDrop(): void {
    const id = this.draggedTask()
    const col = this.dragOverColumn()
    if (id && col) {
      // Indexes come from the filtered view; map back to the full column by
      // the task we drop before (or append).
      const view = this.filtered().find(c => c.id === col)?.tasks ?? []
      const anchor = view[this.dropTargetIndex()]
      const full = this.store.columns().find(c => c.id === col)?.tasks ?? []
      const at = anchor ? full.findIndex(t => t.id === anchor.id) : undefined
      this.store.columns.set(moveTaskTo(this.store.columns(), id, col, at === -1 ? undefined : at))
    }
    this.resetDrag()
  }
}
