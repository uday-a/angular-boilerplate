// Kanban. Ports nuxt-boilerplate's app/pages/dashboard/kanban.vue: the full
// KanbanBoard block over the shared KanbanStore, plus the task sheet.
//
// dashboard/kanban/:id deep-links into a task: the board renders with that
// task's sheet open; an unknown id is a real 404 (canMatch in app.routes.ts
// falls through to the not-found page). Cards link to that route; closing the sheet returns to
// /dashboard/kanban. Board state lives in KanbanStore, so it survives the
// page being recreated between the two routes.
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router } from '@angular/router'
import { map } from 'rxjs'
import { I18nService, injectPageTitle } from '@/app/core/i18n'
import { KanbanStore } from '@/app/core/dashboard/kanban-data'
import { findTaskById, type KanbanTask } from '@/app/core/dashboard/kanban'
import { moveTaskTo, UiKanbanTaskBoardComponent } from '@/app/components/blocks/kanban-task-board'
import {
  KanbanTaskSheetComponent,
  type KanbanSheetComment,
  type KanbanSheetMove,
} from './kanban-task-sheet'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-kanban',
  standalone: true,
  imports: [UiKanbanTaskBoardComponent, KanbanTaskSheetComponent],
  template: `
    <ui-kanban-task-board
      [title]="heading()"
      description="Track product work across releases, bugs, docs and customer onboarding."
    />
    <app-kanban-task-sheet
      [task]="selectedTask()"
      [columns]="store.columns()"
      (close)="closeSheet()"
      (moveTask)="onSheetMove($event)"
      (addComment)="onSheetComment($event)"
      (openTask)="openTask($event)"
    />
  `,
})
export class DashboardKanbanComponent {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly i18n = inject(I18nService)
  protected readonly store = inject(KanbanStore)

  // Board heading stays "Kanban"; the tab title is the open task's title
  // ("<Task title> | UIPKGE") on the :id route.
  readonly heading = computed(() => {
    this.i18n.lang()
    return this.i18n.t('nav.items.kanban')
  })

  private readonly selectedId = toSignal(this.route.paramMap.pipe(map(pm => pm.get('id'))), {
    initialValue: this.route.snapshot.paramMap.get('id'),
  })

  readonly selectedTask = computed<KanbanTask | null>(() => {
    const id = this.selectedId()
    return id ? (findTaskById(this.store.columns(), id) ?? null) : null
  })

  // Declared after selectedTask: injectPageTitle reads it immediately.
  readonly pageTitle = injectPageTitle(() => this.selectedTask()?.title || this.heading())

  openTask(id: string): void {
    void this.router.navigate(['/dashboard/kanban', id])
  }

  closeSheet(): void {
    void this.router.navigate(['/dashboard/kanban'])
  }

  onSheetMove(event: KanbanSheetMove): void {
    this.store.columns.update(cols => moveTaskTo(cols, event.taskId, event.columnId))
  }

  onSheetComment(event: KanbanSheetComment): void {
    const text = event.text.trim()
    if (!text) return
    this.store.columns.update(cols =>
      cols.map(col => ({
        ...col,
        tasks: col.tasks.map(t =>
          t.id === event.taskId
            ? {
                ...t,
                commentItems: [
                  ...t.commentItems,
                  { id: `c${Date.now()}`, author: 'Admin User', authorColor: 'bg-muted text-muted-foreground', text, time: 'Just now' },
                ],
              }
            : t,
        ),
      })),
    )
  }
}
