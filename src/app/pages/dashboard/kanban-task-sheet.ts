// Task detail sheet for the kanban board. Ports nuxt-boilerplate's
// KanbanTaskSheet (status, description, tags, assignee, subtasks, comments,
// files) onto the ui-sheet primitive. Open state is controlled by the page
// via [task] (null = closed); every dismiss path (Escape, overlay click,
// the X button) funnels through openChange -> close. All interactive
// elements are native controls or ui-* primitives, so the dialog stays
// keyboard accessible and SSR-safe (the sheet only touches the document
// when opened, which can only happen from a browser event).
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core'
import { Circle, CircleCheck, Clock, LucideAngularModule, type LucideIconData } from 'lucide-angular'
import { cn } from '@/app/core/utils/cn'
import {
  UiSheetComponent,
  UiSheetContentComponent,
  UiSheetDescriptionComponent,
  UiSheetFooterComponent,
  UiSheetHeaderComponent,
  UiSheetTitleComponent,
} from '@/app/components/ui/sheet/sheet.component'
import {
  KanbanDueBadgeComponent,
  KanbanPriorityBadgeComponent,
  KanbanUserAvatarComponent,
} from '@/app/components/blocks/kanban-task-board/kanban-parts'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import {
  fileIconMap,
  findTaskById,
  getTaskColumn,
  priorityConfig,
  type KanbanColumn,
  type KanbanTask,
} from '@/app/core/dashboard/kanban'

export interface KanbanSheetMove {
  taskId: string
  columnId: string
}

export interface KanbanSheetComment {
  taskId: string
  text: string
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kanban-task-sheet',
  standalone: true,
  imports: [
    LucideAngularModule,
    UiSheetComponent,
    UiSheetContentComponent,
    UiSheetDescriptionComponent,
    UiSheetFooterComponent,
    UiSheetHeaderComponent,
    UiSheetTitleComponent,
    KanbanDueBadgeComponent,
    KanbanPriorityBadgeComponent,
    KanbanUserAvatarComponent,
    UiButtonComponent,
  ],
  template: `
    <ui-sheet [open]="task !== null" (openChange)="onOpenChange($event)">
      <ui-sheet-content class="gap-0 overflow-hidden p-0 sm:max-w-md">
        @if (task; as t) {
          <div [class]="stripClass(t)"></div>
          <ui-sheet-header class="border-b">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-muted-foreground font-mono text-xs tracking-tight">{{ t.id }}</span>
              <span class="text-muted-foreground" aria-hidden="true">·</span>
              <select
                aria-label="Status"
                [value]="columnIdFor(t)"
                (change)="onStatusChange(t, $event)"
                class="hover:bg-secondary h-7 w-auto cursor-pointer gap-1 rounded-md border-none bg-transparent px-1.5 text-xs font-medium shadow-none outline-none"
              >
                @for (col of columns; track col.id) {
                  <option [value]="col.id" [selected]="col.id === columnIdFor(t)">
                    {{ col.title }}
                  </option>
                }
              </select>
              <kanban-priority-badge [priority]="t.priority" iconSize="size-3" />
            </div>
            <ui-sheet-title class="text-base leading-snug font-semibold tracking-tight">
              {{ t.title }}
            </ui-sheet-title>
            <ui-sheet-description class="sr-only">Task details for {{ t.id }}</ui-sheet-description>
          </ui-sheet-header>

          <div class="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            @if (t.description) {
              <p class="text-muted-foreground text-sm leading-relaxed">{{ t.description }}</p>
            } @else {
              <p class="text-muted-foreground text-sm leading-relaxed">No description provided.</p>
            }

            <div class="flex flex-wrap gap-1.5">
              @if (t.tags.length) {
                @for (tag of t.tags; track tag.label) {
                  <span [class]="tagPillClass(tag.color)">{{ tag.label }}</span>
                }
              } @else {
                <span class="text-muted-foreground text-xs">No tags</span>
              }
            </div>

            <div class="bg-border h-px"></div>

            <div class="flex items-center gap-3">
              <kanban-user-avatar [name]="t.assignee.name" [color]="t.assignee.color" size="md" />
              <div>
                <p class="text-sm leading-tight font-medium">{{ t.assignee.name }}</p>
                <p class="text-muted-foreground text-xs">Assignee</p>
              </div>
              <div class="ml-auto text-right">
                @if (t.dueDate) {
                  <kanban-due-badge [dueDate]="t.dueDate" />
                } @else {
                  <p class="text-muted-foreground flex items-center gap-1 text-sm leading-tight">
                    <lucide-icon [img]="ClockIcon" class="size-3" />
                    No due date
                  </p>
                }
              </div>
            </div>

            @if (t.parentId; as parentId) {
              <div class="flex items-center gap-2">
                <span class="text-muted-foreground text-xs">Parent:</span>
                <button
                  type="button"
                  class="text-primary text-xs font-medium hover:underline"
                  (click)="openTask.emit(parentId)"
                >
                  {{ parentId }}
                </button>
              </div>
            }

            <div>
              <h4 class="mb-2 text-sm font-semibold">
                Subtasks
                @if (t.subtaskIds.length) {
                  <span class="text-muted-foreground font-normal">({{ t.subtaskIds.length }})</span>
                }
              </h4>
              @if (t.subtaskIds.length) {
                <ul class="space-y-1">
                  @for (sub of subtasksOf(t); track sub.id) {
                    <li>
                      <button
                        type="button"
                        class="hover:bg-muted/50 flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors"
                        (click)="openTask.emit(sub.id)"
                      >
                        <lucide-icon
                          [img]="sub.done ? CircleCheckIcon : CircleIcon"
                          [class]="sub.done ? 'text-success size-3.5 shrink-0' : 'text-muted-foreground size-3.5 shrink-0'"
                          aria-hidden="true"
                        />
                        @if (sub.done) {
                          <span class="sr-only">Done:</span>
                        }
                        <span class="min-w-0 flex-1 truncate text-xs font-medium">{{ sub.title }}</span>
                        <span class="text-muted-foreground font-mono text-xs">{{ sub.id }}</span>
                      </button>
                    </li>
                  }
                </ul>
              } @else {
                <p class="text-muted-foreground text-xs">No subtasks.</p>
              }
            </div>

            <div class="bg-border h-px"></div>

            <div>
              <h4 class="mb-2 text-sm font-semibold">
                Comments
                @if (t.commentItems.length) {
                  <span class="text-muted-foreground font-normal">({{ t.commentItems.length }})</span>
                }
              </h4>
              @if (t.commentItems.length) {
                <ul class="space-y-2.5">
                  @for (comment of t.commentItems; track comment.id) {
                    <li class="flex gap-2.5">
                      <kanban-user-avatar [name]="comment.author" [color]="comment.authorColor" size="sm" />
                      <div class="min-w-0 flex-1">
                        <p class="flex items-baseline gap-2">
                          <span class="text-xs font-medium">{{ comment.author }}</span>
                          <span class="text-muted-foreground text-xs">{{ comment.time }}</span>
                        </p>
                        <p class="text-sm leading-relaxed">{{ comment.text }}</p>
                      </div>
                    </li>
                  }
                </ul>
              } @else {
                <p class="text-muted-foreground text-xs">No comments yet.</p>
              }
              <div class="mt-2.5 flex items-center gap-2">
                <input
                  [value]="draft()"
                  (input)="draft.set($any($event.target).value)"
                  type="text"
                  placeholder="Write a comment…"
                  aria-label="Write a comment"
                  class="placeholder:text-muted-foreground border-input bg-background h-8 flex-1 rounded-md border px-2.5 text-sm outline-none"
                  (keydown.enter)="submitComment(t)"
                />
                <button ui-button size="sm" class="h-8 px-2.5 text-xs" (click)="submitComment(t)">Add</button>
              </div>
            </div>

            <div class="bg-border h-px"></div>

            <div>
              <h4 class="mb-2 text-sm font-semibold">
                Files
                @if (t.fileItems.length) {
                  <span class="text-muted-foreground font-normal">({{ t.fileItems.length }})</span>
                }
              </h4>
              @if (t.fileItems.length) {
                <ul class="space-y-1">
                  @for (file of t.fileItems; track file.id) {
                    <li class="flex items-center gap-2.5 rounded-md px-1.5 py-1.5">
                      <div class="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md">
                        <lucide-icon [img]="fileIcon(file.type)" class="text-muted-foreground size-4" />
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-xs font-medium" [title]="file.name">{{ file.name }}</p>
                        <p class="text-muted-foreground text-xs">{{ file.size }}</p>
                      </div>
                    </li>
                  }
                </ul>
              } @else {
                <p class="text-muted-foreground text-xs">No files attached.</p>
              }
            </div>
          </div>

          <ui-sheet-footer class="border-t">
            <button ui-button variant="outline" class="w-full" (click)="close.emit()">Close</button>
          </ui-sheet-footer>
        }
      </ui-sheet-content>
    </ui-sheet>
  `,
})
export class KanbanTaskSheetComponent {
  protected readonly ClockIcon = Clock
  protected readonly CircleIcon = Circle
  protected readonly CircleCheckIcon = CircleCheck

  @Input() task: KanbanTask | null = null
  @Input() columns: KanbanColumn[] = []

  @Output() readonly close = new EventEmitter<void>()
  @Output() readonly moveTask = new EventEmitter<KanbanSheetMove>()
  @Output() readonly addComment = new EventEmitter<KanbanSheetComment>()
  @Output() readonly openTask = new EventEmitter<string>()

  readonly draft = signal('')

  onOpenChange(open: boolean): void {
    if (!open) this.close.emit()
  }

  columnIdFor(task: KanbanTask): string {
    return getTaskColumn(this.columns, task.id)?.id ?? ''
  }

  onStatusChange(task: KanbanTask, event: Event): void {
    const value = (event.target as HTMLSelectElement).value
    if (value && value !== this.columnIdFor(task)) {
      this.moveTask.emit({ taskId: task.id, columnId: value })
    }
  }

  stripClass(task: KanbanTask): string {
    return cn('h-1 w-full shrink-0', priorityConfig[task.priority].bg)
  }




  tagPillClass(color: string): string {
    return cn('rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset', color)
  }




  subtasksOf(task: KanbanTask): { id: string, title: string, done: boolean }[] {
    return task.subtaskIds.map((id) => {
      const sub = findTaskById(this.columns, id)
      return {
        id,
        title: sub?.title ?? id,
        done: getTaskColumn(this.columns, id)?.id === 'done',
      }
    })
  }

  fileIcon(type: string): LucideIconData {
    return fileIconMap[type] ?? fileIconMap['other']
  }

  submitComment(task: KanbanTask): void {
    const text = this.draft().trim()
    if (!text) return
    this.addComment.emit({ taskId: task.id, text })
    this.draft.set('')
  }
}
