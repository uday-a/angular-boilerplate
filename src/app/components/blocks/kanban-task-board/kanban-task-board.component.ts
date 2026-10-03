// Full kanban task board surface (SimpleKanban port): status columns with item counts, HTML5
// drag-and-drop card movement with an insertion indicator, inline quick-add, priority badges,
// tags, dates and assignee avatars. Port of the Vue/React SimpleKanban 1:1.
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core'
import { Calendar, Check, GripVertical, LucideAngularModule, Plus } from 'lucide-angular'
import { cn } from '@/app/core/utils/cn'
import { UiAvatarComponent, UiAvatarFallbackComponent } from '@/app/components/ui/avatar/avatar.component'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'

export interface SimpleKanbanItem {
  id: string
  title: string
  description?: string
  date?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  tag?: string
  tagColor?: string
  assignee?: {
    name: string
    initials?: string
    avatar?: string
  }
}

export interface SimpleKanbanColumn {
  id: string
  title: string
  color?: string
  dotColor?: string
  items: SimpleKanbanItem[]
}

const DEFAULT_DOT_COLORS: Record<string, string> = {
  backlog: 'bg-muted-foreground',
  todo: 'bg-chart-1',
  'in-progress': 'bg-chart-3',
  review: 'bg-chart-4',
  done: 'bg-chart-2',
}

const PRIORITY_STYLES: Record<string, { label: string; class: string }> = {
  low: { label: 'Low', class: 'bg-muted text-muted-foreground' },
  medium: { label: 'Medium', class: 'bg-info/10 text-info' },
  high: { label: 'High', class: 'bg-warning/10 text-warning' },
  urgent: { label: 'Urgent', class: 'bg-destructive/10 text-destructive font-medium' },
}

const defaultColumns: SimpleKanbanColumn[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    items: [
      {
        id: 'sk-1',
        title: 'Cross-platform auth synchronization',
        description: 'Implement token refresh rotation across mobile and web clients.',
        date: 'May 15 - Jun 2, 2026',
        priority: 'high',
        tag: 'Auth',
        assignee: { name: 'Alice Chen', initials: 'AC' },
      },
      {
        id: 'sk-2',
        title: 'Scale multi-region edge caching',
        description: 'Benchmark Cloudflare worker cache hit ratios for static registry files.',
        date: 'Jun 22 - Jul 10, 2026',
        priority: 'medium',
        tag: 'Infra',
        assignee: { name: 'Dan Ruiz', initials: 'DR' },
      },
      {
        id: 'sk-3',
        title: 'Extensible drag & drop plugin architecture',
        date: 'Jul 28 - Aug 14, 2026',
        priority: 'low',
        tag: 'Core',
      },
    ],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    items: [
      {
        id: 'sk-4',
        title: 'Real-time telemetry event streaming',
        description: 'Wire SSE endpoints for instant live preview updates.',
        date: 'May 16 - Jun 9, 2026',
        priority: 'urgent',
        tag: 'Realtime',
        assignee: { name: 'Sarah Miller', initials: 'SM' },
      },
      {
        id: 'sk-5',
        title: 'OKLCH theme token harmonizer',
        description: 'Calibrate contrast ratios across light and dark modes.',
        date: 'Apr 26 - May 20, 2026',
        priority: 'high',
        tag: 'Design',
        assignee: { name: 'Leo Vance', initials: 'LV' },
      },
    ],
  },
  {
    id: 'review',
    title: 'In Review',
    items: [
      {
        id: 'sk-6',
        title: 'Astro island SSR hydration benchmark',
        description: 'Verify sub-50ms TTFB across dual-framework demo islands.',
        date: 'Aug 3 - Aug 18, 2026',
        priority: 'medium',
        tag: 'Performance',
        assignee: { name: 'Alice Chen', initials: 'AC' },
      },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    items: [
      {
        id: 'sk-7',
        title: 'Sub-pixel border and shadow layering',
        description: 'Refined neutral borders matching Linear & Raycast standards.',
        date: 'Mar 10 - Apr 12, 2026',
        priority: 'low',
        tag: 'Craft',
        assignee: { name: 'Dan Ruiz', initials: 'DR' },
      },
      {
        id: 'sk-8',
        title: 'Zero-config JSON registry endpoint schema',
        date: 'Feb 14 - Mar 2, 2026',
        priority: 'high',
        tag: 'Registry',
      },
    ],
  },
]

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-kanban-task-board, [ui-kanban-task-board]',
  standalone: true,
  // React renders the root <div> itself: the host stays out of layout and `class` goes to the root.
  host: { '[attr.class]': '"contents"' },
  imports: [LucideAngularModule, UiAvatarComponent, UiAvatarFallbackComponent, UiButtonComponent],
  template: `
    <div data-slot="kanban-task-board" [class]="rootClass">
      @for (column of columns(); track column.id) {
        <div
          data-slot="kanban-column"
          [class]="columnClass(column.id)"
          (dragover)="handleDragOverColumn($event, column.id, column.items.length)"
          (drop)="handleDrop($event, column.id)"
        >
          <!-- Column Header -->
          <div class="mb-3 flex items-center justify-between gap-2 px-1">
            <div class="flex items-center gap-2">
              <span [class]="dotClass(column)"></span>
              <h3 class="text-foreground text-sm font-semibold tracking-tight">{{ column.title }}</h3>
              <span class="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums">
                {{ column.items.length }}
              </span>
            </div>
            @if (allowAdd()) {
              <button
                ui-button
                variant="ghost"
                size="icon"
                class="text-muted-foreground hover:text-foreground size-7 rounded-lg"
                [attr.aria-label]="'Add item to ' + column.title"
                (click)="startAdd(column.id)"
              >
                <lucide-icon [img]="Plus" class="size-3.5" />
              </button>
            }
          </div>

          <!-- Column Cards Container -->
          <div class="flex min-h-[120px] flex-1 flex-col gap-2.5">
            @if (addingColumnId() === column.id) {
              <div
                class="bg-card border-border animate-in fade-in zoom-in-95 rounded-lg border p-2.5 shadow-xs duration-150"
              >
                <input
                  [value]="newTitle()"
                  (input)="newTitle.set($any($event.target).value)"
                  type="text"
                  placeholder="Item title..."
                  class="placeholder:text-muted-foreground w-full bg-transparent text-sm font-medium outline-none"
                  (keydown.enter)="handleInlineAdd(column.id)"
                  (keydown.escape)="addingColumnId.set(null)"
                />
                <div class="mt-2.5 flex items-center justify-end gap-1.5">
                  <button
                    ui-button
                    size="sm"
                    variant="ghost"
                    class="h-7 px-2 text-xs"
                    (click)="addingColumnId.set(null)"
                  >
                    Cancel
                  </button>
                  <button ui-button size="sm" class="h-7 gap-1 px-2.5 text-xs" (click)="handleInlineAdd(column.id)">
                    <lucide-icon [img]="Check" class="size-3" />
                    Add
                  </button>
                </div>
              </div>
            }

            @for (item of column.items; track item.id; let i = $index) {
              @if (showGap(column.id, i, item.id)) {
                <div class="bg-primary/20 h-1.5 w-full rounded-full"></div>
              }
              <div
                role="button"
                tabindex="0"
                draggable="true"
                data-slot="kanban-card"
                [class]="cardClasses(item.id)"
                [attr.aria-label]="cardAriaLabel(item, column.title)"
                (dragstart)="handleDragStart($event, item.id)"
                (dragend)="handleDragEnd()"
                (dragover)="handleCardDragOver($event, column.id, i)"
                (click)="handleCardClick(item, column.id)"
                (keydown.enter)="handleCardKey($event, item, column.id)"
                (keydown.space)="handleCardKey($event, item, column.id)"
              >
                <div class="flex items-start justify-between gap-2">
                  <p class="text-foreground line-clamp-2 text-sm leading-snug font-medium">{{ item.title }}</p>
                  <lucide-icon
                    [img]="GripVertical"
                    class="text-muted-foreground size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </div>
                @if (item.description) {
                  <p class="text-muted-foreground line-clamp-2 text-xs leading-relaxed">{{ item.description }}</p>
                }
                @if (item.date || item.tag || item.priority || item.assignee) {
                  <div
                    class="border-border/40 mt-1 flex flex-wrap items-center justify-between gap-1.5 border-t pt-1 text-xs"
                  >
                    <div class="flex flex-wrap items-center gap-1.5">
                      @if (item.date) {
                        <div class="text-muted-foreground flex items-center gap-1 text-xs">
                          <lucide-icon [img]="Calendar" class="text-muted-foreground size-3" />
                          <span>{{ item.date }}</span>
                        </div>
                      }
                      @if (item.tag) {
                        <span [class]="tagClass(item)">{{ item.tag }}</span>
                      }
                      @if (item.priority) {
                        <span [class]="priorityClassFor(item)">{{ priorityLabel(item) }}</span>
                      }
                    </div>
                    @if (item.assignee) {
                      <ui-avatar class="border-background size-5 shrink-0 border">
                        <ui-avatar-fallback class="text-xs font-medium">
                          {{ assigneeInitials(item) }}
                        </ui-avatar-fallback>
                      </ui-avatar>
                    }
                  </div>
                }
              </div>
            }

            @if (showTrailingGap(column.id, column.items.length)) {
              <div class="bg-primary/20 h-1.5 w-full rounded-full"></div>
            }

            @if (column.items.length === 0 && addingColumnId() !== column.id) {
              <div
                class="border-border/60 text-muted-foreground flex flex-1 items-center justify-center rounded-lg border border-dashed py-8 text-center text-xs"
              >
                Drop items here
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class UiKanbanTaskBoardComponent {
  protected readonly Calendar = Calendar
  protected readonly Check = Check
  protected readonly GripVertical = GripVertical
  protected readonly Plus = Plus

  @Input() set initialColumns(v: SimpleKanbanColumn[] | undefined) {
    if (v) this.columns.set(v.map((c) => ({ ...c, items: [...c.items] })))
  }
  @Input() set allowInlineAdd(v: boolean) {
    this.allowAdd.set(v ?? true)
  }
  @Input('class') className?: string
  @Input() cardClass?: string

  @Output() readonly columnsChange = new EventEmitter<SimpleKanbanColumn[]>()
  @Output() readonly cardClick = new EventEmitter<{ item: SimpleKanbanItem; columnId: string }>()
  @Output() readonly cardMove = new EventEmitter<{
    item: SimpleKanbanItem
    fromColumnId: string
    toColumnId: string
    newIndex: number
  }>()
  @Output() readonly addItem = new EventEmitter<{ columnId: string; title: string }>()

  readonly columns = signal<SimpleKanbanColumn[]>(defaultColumns.map((c) => ({ ...c, items: [...c.items] })))
  readonly allowAdd = signal(true)
  readonly draggedId = signal<string | null>(null)
  readonly dragOverColumnId = signal<string | null>(null)
  readonly dropTargetIndex = signal(-1)
  readonly addingColumnId = signal<string | null>(null)
  readonly newTitle = signal('')
  readonly selectedCard = signal<string | null>(null)
  private lastDragTime = 0

  readonly totalCards = computed(() => this.columns().reduce((n, c) => n + c.items.length, 0))

  get rootClass(): string {
    return cn('flex min-h-[380px] w-full [scrollbar-width:thin] items-start gap-4 overflow-x-auto pb-4', this.className)
  }

  dotClass(column: SimpleKanbanColumn): string {
    return cn('size-2 rounded-full', column.dotColor || column.color || DEFAULT_DOT_COLORS[column.id] || 'bg-primary')
  }

  columnClass(columnId: string): string {
    return cn(
      'bg-muted/40 border-border/80 flex w-72 shrink-0 flex-col rounded-xl border p-3 transition-colors',
      this.dragOverColumnId() === columnId && 'border-primary/50 bg-muted/60 ring-primary/10 ring-2',
    )
  }

  cardClasses(id: string): string {
    return cn(
      'group bg-card text-card-foreground border-border/80 hover:border-border relative flex cursor-grab flex-col gap-2 rounded-lg border p-3 shadow-xs transition-colors hover:shadow-sm active:cursor-grabbing',
      'focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
      this.draggedId() === id && 'ring-primary/40 opacity-40 shadow-md ring-2',
      this.cardClass,
    )
  }

  tagClass(item: SimpleKanbanItem): string {
    return cn('rounded-md px-1.5 py-0.5 text-xs font-medium', item.tagColor || 'bg-secondary text-secondary-foreground')
  }

  priorityLabel(item: SimpleKanbanItem): string {
    if (!item.priority) return ''
    return PRIORITY_STYLES[item.priority]?.label ?? item.priority
  }

  priorityClassFor(item: SimpleKanbanItem): string {
    if (!item.priority) return ''
    return cn('rounded-md px-1.5 py-0.5 text-xs', PRIORITY_STYLES[item.priority]?.class ?? '')
  }

  assigneeInitials(item: SimpleKanbanItem): string {
    const a = item.assignee
    if (!a) return ''
    return a.initials || a.name.slice(0, 2).toUpperCase()
  }

  // Screen-reader name: title first, then column + priority for context.
  cardAriaLabel(item: SimpleKanbanItem, columnTitle: string): string {
    const priority = item.priority ? PRIORITY_STYLES[item.priority]?.label ?? item.priority : null
    return [item.title, columnTitle, priority ? `${priority} priority` : null].filter(Boolean).join(', ')
  }

  showGap(columnId: string, index: number, itemId: string): boolean {
    return this.dragOverColumnId() === columnId && this.dropTargetIndex() === index && this.draggedId() !== itemId
  }

  showTrailingGap(columnId: string, itemsCount: number): boolean {
    return this.dragOverColumnId() === columnId && (this.dropTargetIndex() ?? -1) >= itemsCount && !!this.draggedId()
  }

  handleDragStart(e: DragEvent, id: string): void {
    this.draggedId.set(id)
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', id)
    }
  }

  handleDragEnd(): void {
    this.draggedId.set(null)
    this.dragOverColumnId.set(null)
    this.dropTargetIndex.set(-1)
    this.lastDragTime = Date.now()
  }

  handleDragOverColumn(e: DragEvent, columnId: string, itemsCount: number): void {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    this.dragOverColumnId.set(columnId)
    this.dropTargetIndex.set(itemsCount)
  }

  handleCardDragOver(e: DragEvent, columnId: string, index: number): void {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    this.dragOverColumnId.set(columnId)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    this.dropTargetIndex.set(e.clientY < midY ? index : index + 1)
  }

  handleDrop(e: DragEvent, targetColumnId: string): void {
    e.preventDefault()
    const dragged = this.draggedId()
    if (!dragged || !targetColumnId) {
      this.handleDragEnd()
      return
    }
    const next = this.columns().map((col) => ({ ...col, items: [...col.items] }))
    let sourceColIdx = -1
    let itemIdx = -1
    for (let c = 0; c < next.length; c++) {
      const idx = next[c]!.items.findIndex((item) => item.id === dragged)
      if (idx !== -1) {
        sourceColIdx = c
        itemIdx = idx
        break
      }
    }
    const targetColIdx = next.findIndex((c) => c.id === targetColumnId)
    if (sourceColIdx === -1 || targetColIdx === -1) {
      this.handleDragEnd()
      return
    }
    const sourceCol = next[sourceColIdx]!
    const targetCol = next[targetColIdx]!
    const [removed] = sourceCol.items.splice(itemIdx, 1)
    if (!removed) {
      this.handleDragEnd()
      return
    }
    let at = this.dropTargetIndex()
    if (at < 0) at = targetCol.items.length
    if (sourceColIdx === targetColIdx && itemIdx < at) at--
    targetCol.items.splice(at, 0, removed)
    this.columns.set(next)
    this.cardMove.emit({ item: removed, fromColumnId: sourceCol.id, toColumnId: targetColumnId, newIndex: at })
    this.columnsChange.emit(next)
    this.handleDragEnd()
  }

  handleCardClick(item: SimpleKanbanItem, columnId: string): void {
    if (Date.now() - this.lastDragTime < 150) return
    this.selectedCard.set(item.id)
    this.cardClick.emit({ item, columnId })
  }

  handleCardKey(e: Event, item: SimpleKanbanItem, columnId: string): void {
    e.preventDefault()
    this.selectedCard.set(item.id)
    this.cardClick.emit({ item, columnId })
  }

  startAdd(columnId: string): void {
    this.addingColumnId.set(columnId)
    this.newTitle.set('')
  }

  handleInlineAdd(columnId: string): void {
    const text = this.newTitle().trim()
    if (!text) {
      this.addingColumnId.set(null)
      return
    }
    if (this.addItem.observed) {
      this.addItem.emit({ columnId, title: text })
    } else {
      const next = this.columns().map((col) =>
        col.id === columnId ? { ...col, items: [...col.items, { id: `item-${Date.now()}`, title: text }] } : col,
      )
      this.columns.set(next)
      this.columnsChange.emit(next)
    }
    this.newTitle.set('')
    this.addingColumnId.set(null)
  }

  /** Programmatic move (used by specs + consumers without DOM drag events). */
  moveCard(itemId: string, toColumnId: string, toIndex?: number): boolean {
    const next = this.columns().map((col) => ({ ...col, items: [...col.items] }))
    let removed: SimpleKanbanItem | undefined
    let fromColumnId = ''
    for (const col of next) {
      const idx = col.items.findIndex((i) => i.id === itemId)
      if (idx !== -1) {
        fromColumnId = col.id
        removed = col.items.splice(idx, 1)[0]
        break
      }
    }
    const target = next.find((c) => c.id === toColumnId)
    if (!removed || !target) return false
    const at = toIndex === undefined ? target.items.length : Math.max(0, Math.min(toIndex, target.items.length))
    target.items.splice(at, 0, removed)
    this.columns.set(next)
    this.cardMove.emit({ item: removed, fromColumnId, toColumnId, newIndex: at })
    this.columnsChange.emit(next)
    return true
  }
}
