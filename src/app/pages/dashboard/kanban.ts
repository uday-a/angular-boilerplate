// Kanban. Ports nuxt-boilerplate's app/pages/dashboard/kanban.vue +
// KanbanBoard: columns seeded from the shared kanban-data lib, rendered
// through the registry's kanban-task-board block, with a task sheet dialog
// (KanbanTaskSheet port) for card click / keyboard open.
//
// The sheet is route-synced: a card click sets ?task=<id> (same route, so
// board state is preserved), and dashboard/kanban/:id deep-links straight
// into the sheet. An unknown id renders the plain board — never a redirect.
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router } from '@angular/router'
import { Title } from '@angular/platform-browser'
import { createInitialColumns } from '@/app/core/dashboard/kanban-data'
import {
  assignees,
  findTaskById,
  getInitials,
  type KanbanColumn,
  type KanbanTask,
} from '@/app/core/dashboard/kanban'
import {
  UiKanbanTaskBoardComponent,
  type SimpleKanbanColumn,
  type SimpleKanbanItem,
} from '@/app/components/blocks/kanban-task-board/kanban-task-board.component'
import {
  KanbanTaskSheetComponent,
  type KanbanSheetComment,
  type KanbanSheetMove,
} from './kanban-task-sheet'

function toSimple(columns: KanbanColumn[]): SimpleKanbanColumn[] {
  return columns.map((col) => ({
    id: col.id,
    title: col.title,
    dotColor: col.dotColor,
    items: col.tasks
      .filter((t) => !t.parentId)
      .map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        date: t.dueDate,
        priority: t.priority,
        tag: t.tags[0]?.label,
        assignee: { name: t.assignee.name, initials: getInitials(t.assignee.name) },
      })),
  }))
}

// Next free HR-* id (mirrors the Nuxt add-task dialog's maxId scan).
function nextTaskId(columns: KanbanColumn[]): string {
  let max = 100
  for (const col of columns) {
    for (const t of col.tasks) {
      const m = /^HR-(\d+)$/.exec(t.id)
      if (m) max = Math.max(max, Number(m[1]))
    }
  }
  return `HR-${max + 1}`
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-kanban',
  standalone: true,
  imports: [UiKanbanTaskBoardComponent, KanbanTaskSheetComponent],
  template: `
    <div class="space-y-4">
      <header class="space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight">Kanban</h1>
        <p class="text-muted-foreground text-sm">Drag cards between columns to track work from backlog to done.</p>
      </header>
      <ui-kanban-task-board
        [initialColumns]="simpleColumns()"
        (cardClick)="openTaskById($event.item.id)"
        (cardMove)="onCardMove($event)"
        (addItem)="onAddItem($event.columnId, $event.title)"
      />
      <app-kanban-task-sheet
        [task]="selectedTask()"
        [columns]="fullColumns()"
        (close)="closeSheet()"
        (moveTask)="onSheetMove($event)"
        (addComment)="onSheetComment($event)"
        (openTask)="openTaskById($event)"
      />
    </div>
  `,
})
export class DashboardKanbanComponent {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)

  // Demo board seeded from the registry's kanban-data lib. Swap
  // createInitialColumns() for a real fetcher when wiring to your DB.
  // Source of truth (full task model for the sheet). The board gets a
  // derived SimpleKanban view; drag moves and quick-adds are applied back
  // here so both stay in sync.
  readonly fullColumns = signal<KanbanColumn[]>(createInitialColumns())
  readonly simpleColumns = computed<SimpleKanbanColumn[]>(() => toSimple(this.fullColumns()))
  readonly selectedId = signal<string | null>(null)
  readonly selectedTask = computed<KanbanTask | null>(() => {
    const id = this.selectedId()
    return id ? (findTaskById(this.fullColumns(), id) ?? null) : null
  })

  constructor(title: Title) {
    title.setTitle('Kanban')
    // Snapshot first (covers SSR + first paint), then stay in sync with
    // client-side navigations. No window/document access — SSR-safe.
    this.selectedId.set(this.route.snapshot.paramMap.get('id') ?? this.route.snapshot.queryParamMap.get('task'))
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((pm) => {
      const id = pm.get('id')
      if (id) this.selectedId.set(id)
    })
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((qm) => {
      if (!this.route.snapshot.paramMap.get('id')) this.selectedId.set(qm.get('task'))
    })
  }

  openTaskById(id: string): void {
    // Card click / keyboard open. Query param on the base route keeps the
    // same component instance (board state preserved); the :id deep-link
    // route navigates between detail URLs instead.
    if (this.route.snapshot.paramMap.get('id')) {
      void this.router.navigate(['/dashboard/kanban', id])
    } else {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { task: id },
        queryParamsHandling: 'merge',
      })
    }
  }

  closeSheet(): void {
    this.selectedId.set(null)
    if (this.route.snapshot.paramMap.get('id')) {
      void this.router.navigate(['/dashboard/kanban'])
    } else {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { task: null },
        queryParamsHandling: 'merge',
      })
    }
  }

  onCardMove(event: { item: SimpleKanbanItem, fromColumnId: string, toColumnId: string, newIndex: number }): void {
    this.moveTaskIn(event.item.id, event.toColumnId, event.newIndex)
  }

  onSheetMove(event: KanbanSheetMove): void {
    this.moveTaskIn(event.taskId, event.columnId)
  }

  onAddItem(columnId: string, title: string): void {
    const text = title.trim()
    if (!text) return
    this.fullColumns.update((cols) => {
      const next = cols.map((c) => ({ ...c, tasks: [...c.tasks] }))
      const target = next.find((c) => c.id === columnId) ?? next[0]
      if (!target) return cols
      target.tasks.push({
        id: nextTaskId(cols),
        title: text,
        priority: 'medium',
        assignee: assignees.alice,
        tags: [],
        subtaskIds: [],
        commentItems: [],
        fileItems: [],
      })
      return next
    })
  }

  onSheetComment(event: KanbanSheetComment): void {
    const text = event.text.trim()
    if (!text) return
    this.fullColumns.update((cols) =>
      cols.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) =>
          t.id === event.taskId
            ? {
                ...t,
                commentItems: [
                  ...t.commentItems,
                  {
                    id: `c${Date.now()}`,
                    author: 'Admin User',
                    authorColor: 'bg-muted text-muted-foreground',
                    text,
                    time: 'Just now',
                  },
                ],
              }
            : t,
        ),
      })),
    )
  }

  private moveTaskIn(taskId: string, toColumnId: string, toIndex?: number): void {
    this.fullColumns.update((cols) => {
      const next = cols.map((c) => ({ ...c, tasks: [...c.tasks] }))
      let moved: KanbanTask | undefined
      for (const col of next) {
        const idx = col.tasks.findIndex((t) => t.id === taskId)
        if (idx !== -1) {
          moved = col.tasks.splice(idx, 1)[0]
          break
        }
      }
      const target = next.find((c) => c.id === toColumnId)
      if (!moved || !target) return cols
      const at = toIndex === undefined ? target.tasks.length : Math.max(0, Math.min(toIndex, target.tasks.length))
      target.tasks.splice(at, 0, moved)
      return next
    })
  }
}
