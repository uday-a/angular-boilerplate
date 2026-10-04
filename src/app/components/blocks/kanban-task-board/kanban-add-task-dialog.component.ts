// "New Task" dialog. Port of nuxt-boilerplate's
// components/kanban/KanbanAddTaskDialog.vue (title, description, priority,
// assignee, column, due date, tags, subtasks). Nuxt's rich-text editor is a
// plain textarea here (no Angular rich-text primitive in this repo).
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, signal } from '@angular/core'
import { CalendarIcon, CircleCheck, LucideAngularModule, Plus, X } from 'lucide-angular'
import {
  UiDialogComponent,
  UiDialogContentComponent,
  UiDialogDescriptionComponent,
  UiDialogFooterComponent,
  UiDialogHeaderComponent,
  UiDialogTitleComponent,
} from '@/app/components/ui/dialog/dialog.component'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import { UiInputComponent } from '@/app/components/ui/input/input.component'
import { UiLabelComponent } from '@/app/components/ui/label/label.component'
import { UiTextareaComponent } from '@/app/components/ui/textarea/textarea.component'
import {
  UiSelectComponent,
  UiSelectContentComponent,
  UiSelectItemComponent,
  UiSelectTriggerComponent,
  UiSelectValueComponent,
} from '@/app/components/ui/select/select.component'
import {
  UiPopoverComponent,
  UiPopoverContentComponent,
  UiPopoverTriggerComponent,
} from '@/app/components/ui/popover/popover.component'
import { UiCalendarComponent } from '@/app/components/ui/calendar/calendar.component'
import { assignees, priorityConfig, tagPresets, type KanbanColumn, type KanbanTask } from '@/app/core/dashboard/kanban'

type AssigneeKey = keyof typeof assignees
type TagKey = keyof typeof tagPresets

const pad = (n: number) => String(n).padStart(2, '0')
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const fmt = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

/** Build the new parent task (+ subtask tasks) with the next free id. Pure, so it is unit-testable. */
export function buildNewTasks(
  columns: KanbanColumn[],
  form: { title: string, description: string, priority: KanbanTask['priority'], assigneeKey: AssigneeKey, tagKeys: TagKey[], dueDate?: Date, subtasks: string[] },
): KanbanTask[] {
  const all = columns.flatMap(c => c.tasks)
  const maxId = all.reduce((max, t) => Math.max(max, parseInt(t.id.replace(/^[A-Z]+-/, ''), 10) || 0), 0)
  const prefix = all[0]?.id.split('-')[0] ?? 'TASK'
  const parentId = `${prefix}-${maxId + 1}`
  const assignee = assignees[form.assigneeKey]
  const subtasks: KanbanTask[] = form.subtasks.map((title, i) => ({
    id: `${prefix}-${maxId + 2 + i}`,
    title,
    priority: 'medium',
    assignee,
    tags: [],
    parentId,
    subtaskIds: [],
    commentItems: [],
    fileItems: [],
  }))
  return [
    {
      id: parentId,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      priority: form.priority,
      assignee,
      tags: form.tagKeys.map(k => tagPresets[k]),
      dueDate: form.dueDate ? isoDate(form.dueDate) : undefined,
      subtaskIds: subtasks.map(t => t.id),
      commentItems: [],
      fileItems: [],
    },
    ...subtasks,
  ]
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'kanban-add-task-dialog',
  standalone: true,
  imports: [
    LucideAngularModule,
    UiDialogComponent,
    UiDialogContentComponent,
    UiDialogDescriptionComponent,
    UiDialogFooterComponent,
    UiDialogHeaderComponent,
    UiDialogTitleComponent,
    UiButtonComponent,
    UiInputComponent,
    UiLabelComponent,
    UiTextareaComponent,
    UiSelectComponent,
    UiSelectContentComponent,
    UiSelectItemComponent,
    UiSelectTriggerComponent,
    UiSelectValueComponent,
    UiPopoverComponent,
    UiPopoverContentComponent,
    UiPopoverTriggerComponent,
    UiCalendarComponent,
  ],
  template: `
    <ui-dialog [open]="open" (openChange)="openChange.emit($event)">
      <ui-dialog-content class="max-h-[90dvh] overflow-y-auto sm:max-w-[680px]">
        <ui-dialog-header>
          <ui-dialog-title>New Task</ui-dialog-title>
          <ui-dialog-description>Adding task to {{ columnTitle() }}</ui-dialog-description>
        </ui-dialog-header>

        <div class="grid gap-4 py-2">
          <div class="grid gap-2">
            <ui-label htmlFor="task-title">Title</ui-label>
            <ui-input id="task-title" placeholder="Enter task title" [value]="title()" (valueChange)="title.set($event)" />
          </div>

          <div class="grid gap-2">
            <ui-label htmlFor="task-description">
              Description <span class="text-muted-foreground text-xs">(optional)</span>
            </ui-label>
            <ui-textarea id="task-description" [rows]="3" [value]="description()" (valueChange)="description.set($event)" />
          </div>

          <div class="grid gap-4 sm:grid-cols-3">
            <div class="grid gap-2">
              <ui-label>Priority</ui-label>
              <ui-select [value]="priority()" (valueChange)="priority.set($any($event))">
                <button ui-select-trigger aria-label="Priority"><ui-select-value placeholder="Priority" /></button>
                <ui-select-content>
                  @for (p of priorities; track p.key) {
                    <ui-select-item [value]="p.key">{{ p.label }}</ui-select-item>
                  }
                </ui-select-content>
              </ui-select>
            </div>
            <div class="grid gap-2">
              <ui-label>Assignee</ui-label>
              <ui-select [value]="assigneeKey()" (valueChange)="assigneeKey.set($any($event))">
                <button ui-select-trigger aria-label="Assignee"><ui-select-value placeholder="Assignee" /></button>
                <ui-select-content>
                  @for (a of people; track a.key) {
                    <ui-select-item [value]="a.key">{{ a.name }}</ui-select-item>
                  }
                </ui-select-content>
              </ui-select>
            </div>
            <div class="grid gap-2">
              <ui-label>Column</ui-label>
              <ui-select [value]="columnId()" (valueChange)="columnId.set($event)">
                <button ui-select-trigger aria-label="Column"><ui-select-value placeholder="Column" /></button>
                <ui-select-content>
                  @for (col of columns; track col.id) {
                    <ui-select-item [value]="col.id">{{ col.title }}</ui-select-item>
                  }
                </ui-select-content>
              </ui-select>
            </div>
          </div>

          <div class="grid gap-2">
            <ui-label>Due Date <span class="text-muted-foreground text-xs">(optional)</span></ui-label>
            <ui-popover [open]="dateOpen()" (openChange)="dateOpen.set($event)">
              <button
                ui-button
                ui-popover-trigger
                variant="outline"
                [class]="'w-full justify-start text-left font-normal' + (dueDate() ? '' : ' text-muted-foreground')"
              >
                <lucide-icon [img]="CalendarIcon" class="mr-2 size-4" aria-hidden="true" />
                {{ dueLabel() }}
              </button>
              <ui-popover-content align="start" class="w-auto p-0">
                <ui-calendar mode="single" [selected]="dueDate()" (select)="onDate($any($event))" />
              </ui-popover-content>
            </ui-popover>
          </div>

          <div class="grid gap-2">
            <ui-label>Tags <span class="text-muted-foreground text-xs">(optional)</span></ui-label>
            <div class="flex flex-wrap gap-2">
              @for (tag of tags; track tag.key) {
                <button
                  type="button"
                  [attr.aria-pressed]="tagKeys().includes(tag.key)"
                  [class]="
                    'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ' +
                    (tagKeys().includes(tag.key)
                      ? 'bg-primary text-primary-foreground border-transparent'
                      : 'border-border bg-background text-foreground hover:bg-muted')
                  "
                  (click)="toggleTag(tag.key)"
                >
                  @if (tagKeys().includes(tag.key)) {
                    <lucide-icon [img]="CheckIcon" class="size-3" aria-hidden="true" />
                  }
                  {{ tag.label }}
                </button>
              }
            </div>
          </div>

          <div class="grid gap-2">
            <ui-label>Subtasks <span class="text-muted-foreground text-xs">(optional)</span></ui-label>
            @if (subtasks().length) {
              <div class="space-y-2">
                @for (text of subtasks(); track $index) {
                  <div class="flex items-center gap-2">
                    <span class="flex-1 text-sm">{{ text }}</span>
                    <button ui-button variant="ghost" size="icon" class="size-6" aria-label="Remove subtask" (click)="removeSubtask($index)">
                      <lucide-icon [img]="XIcon" class="size-3" aria-hidden="true" />
                    </button>
                  </div>
                }
              </div>
            }
            <div class="flex items-center gap-2">
              <ui-input
                class="flex-1"
                placeholder="Add a subtask"
                [value]="subtaskDraft()"
                (valueChange)="subtaskDraft.set($event)"
                (keyup.enter)="addSubtask()"
              />
              <button ui-button variant="outline" size="icon" aria-label="Add subtask" (click)="addSubtask()">
                <lucide-icon [img]="PlusIcon" class="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <ui-dialog-footer>
          <button ui-button variant="outline" (click)="openChange.emit(false)">Cancel</button>
          <button ui-button [disabled]="!title().trim()" (click)="submit()">Create Task</button>
        </ui-dialog-footer>
      </ui-dialog-content>
    </ui-dialog>
  `,
})
export class KanbanAddTaskDialogComponent implements OnChanges {
  protected readonly CalendarIcon = CalendarIcon
  protected readonly CheckIcon = CircleCheck
  protected readonly PlusIcon = Plus
  protected readonly XIcon = X

  protected readonly priorities = (Object.keys(priorityConfig) as KanbanTask['priority'][]).map(key => ({ key, label: priorityConfig[key].label }))
  protected readonly people = (Object.keys(assignees) as AssigneeKey[]).map(key => ({ key, name: assignees[key].name }))
  protected readonly tags = (Object.keys(tagPresets) as TagKey[]).map(key => ({ key, label: tagPresets[key].label }))

  @Input() open = false
  @Input() columns: KanbanColumn[] = []
  @Input() initialColumnId = 'backlog'

  @Output() readonly openChange = new EventEmitter<boolean>()
  @Output() readonly create = new EventEmitter<{ columnId: string, tasks: KanbanTask[] }>()

  readonly columnId = signal('backlog')
  readonly title = signal('')
  readonly description = signal('')
  readonly priority = signal<KanbanTask['priority']>('medium')
  readonly assigneeKey = signal<AssigneeKey>('alice')
  readonly tagKeys = signal<TagKey[]>([])
  readonly subtasks = signal<string[]>([])
  readonly subtaskDraft = signal('')
  readonly dueDate = signal<Date | undefined>(undefined)
  readonly dateOpen = signal(false)

  ngOnChanges(): void {
    // Reset on every open (Nuxt watches `open`).
    if (!this.open) return
    this.columnId.set(this.initialColumnId)
    this.title.set('')
    this.description.set('')
    this.priority.set('medium')
    this.assigneeKey.set('alice')
    this.tagKeys.set([])
    this.subtasks.set([])
    this.subtaskDraft.set('')
    this.dueDate.set(undefined)
  }

  columnTitle(): string {
    return this.columns.find(c => c.id === this.columnId())?.title ?? 'column'
  }

  dueLabel(): string {
    const d = this.dueDate()
    return d ? fmt.format(d) : 'Pick a date'
  }

  onDate(d: Date | undefined): void {
    this.dueDate.set(d)
    this.dateOpen.set(false)
  }

  toggleTag(key: TagKey): void {
    this.tagKeys.update(keys => (keys.includes(key) ? keys.filter(k => k !== key) : [...keys, key]))
  }

  addSubtask(): void {
    const text = this.subtaskDraft().trim()
    if (!text) return
    this.subtasks.update(s => [...s, text])
    this.subtaskDraft.set('')
  }

  removeSubtask(index: number): void {
    this.subtasks.update(s => s.filter((_, i) => i !== index))
  }

  submit(): void {
    if (!this.title().trim()) return
    const tasks = buildNewTasks(this.columns, {
      title: this.title(),
      description: this.description(),
      priority: this.priority(),
      assigneeKey: this.assigneeKey(),
      tagKeys: this.tagKeys(),
      dueDate: this.dueDate(),
      subtasks: this.subtasks(),
    })
    this.create.emit({ columnId: this.columnId(), tasks })
    this.openChange.emit(false)
  }
}
