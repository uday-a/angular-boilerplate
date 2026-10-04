import {
  Component,
  EventEmitter,
  Input,
  Output,
  booleanAttribute,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core'
import {
  FileText,
  Inbox,
  KanbanSquare,
  LayoutDashboard,
  LucideAngularModule,
  Search,
  Settings,
  Users,
  type LucideIconData,
} from 'lucide-angular'
import {
  UiCommandDialogComponent,
  UiCommandEmptyComponent,
  UiCommandGroupComponent,
  UiCommandInputComponent,
  UiCommandItemComponent,
  UiCommandListComponent,
  UiCommandSeparatorComponent,
  UiCommandShortcutComponent,
} from '@/app/components/ui/command/command.component'

export interface CommandPaletteItem {
  label: string
  value?: string
  hint?: string
  icon?: LucideIconData
  onSelect?: () => void
}

export interface CommandPaletteGroup {
  heading: string
  items: CommandPaletteItem[]
}

const defaultGroups: CommandPaletteGroup[] = [
  {
    heading: 'Navigate',
    items: [
      { label: 'Dashboard', hint: '/dashboard', icon: LayoutDashboard },
      { label: 'Messages', hint: '/dashboard/messages', icon: Inbox },
      { label: 'Kanban', hint: '/dashboard/kanban', icon: KanbanSquare },
      { label: 'Team', hint: '/settings/team', icon: Users },
    ],
  },
  {
    heading: 'Settings',
    items: [
      { label: 'General', hint: '/settings/general', icon: FileText },
      { label: 'Settings', hint: '/settings', icon: Settings },
    ],
  },
]

/**
 * CommandPalette -- the Nuxt block, 1:1: a slim header search trigger (with a
 * platform-aware Cmd-K / Ctrl-K hint) plus the modal CommandDialog. Drop it once and
 * the global keyboard shortcut wires itself. `[showTrigger]="false"` hides the inline
 * button; open it from elsewhere through a template ref (`palette.show()` / `toggle()`).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-command-palette, [ui-command-palette]',
  standalone: true,
  // Nuxt renders a fragment (trigger + dialog): keep this wrapper out of the layout.
  host: { class: 'contents', '(window:keydown)': 'onKeydown($event)' },
  imports: [
    LucideAngularModule,
    UiCommandDialogComponent,
    UiCommandEmptyComponent,
    UiCommandGroupComponent,
    UiCommandInputComponent,
    UiCommandItemComponent,
    UiCommandListComponent,
    UiCommandSeparatorComponent,
    UiCommandShortcutComponent,
  ],
  template: `
    @if (showTrigger) {
      <button
        type="button"
        class="bg-background border-input hover:bg-accent hover:text-foreground text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 relative hidden h-8 w-full items-center gap-2 rounded-lg border px-2.5 text-sm shadow-xs transition-colors outline-none focus-visible:ring-[3px] sm:flex md:w-[180px] lg:w-[240px]"
        aria-label="Open command palette"
        (click)="show()"
      >
        <lucide-icon [img]="Search" class="size-3.5 shrink-0" />
        <span class="flex-1 truncate text-left">{{ triggerLabel }}</span>
        <kbd
          class="bg-muted/80 text-muted-foreground pointer-events-none flex h-5 items-center justify-center rounded-md border px-1.5 font-mono text-xs font-medium"
        >
          <span>{{ triggerShortcut }}</span>
        </kbd>
      </button>
    }

    <ui-command-dialog
      [open]="open()"
      (openChange)="setOpen($event)"
      title="Command palette"
      description="Search pages and run commands"
    >
      <ui-command-input [placeholder]="placeholder" />
      <ui-command-list class="max-h-[480px]">
        <ui-command-empty>No matches.</ui-command-empty>
        @for (group of groups; track group.heading; let last = $last) {
          <ui-command-group [heading]="group.heading">
            @for (item of group.items; track item.label) {
              <ui-command-item
                data-slot="command-palette"
                [value]="group.heading + ' ' + item.label + ' ' + (item.hint ?? '')"
                (select)="pick(item)"
              >
                @if (item.icon) {
                  <lucide-icon [img]="item.icon" class="size-4" />
                }
                <span>{{ item.label }}</span>
                @if (item.hint) {
                  <ui-command-shortcut class="text-muted-foreground">{{ item.hint }}</ui-command-shortcut>
                }
              </ui-command-item>
            }
          </ui-command-group>
          @if (!last) {
            <ui-command-separator />
          }
        }
      </ui-command-list>
    </ui-command-dialog>
  `,
})
export class UiCommandPaletteComponent {
  protected readonly Search = Search

  @Input() groups: CommandPaletteGroup[] = defaultGroups
  @Input() placeholder = 'Search pages, commands…'
  @Input() triggerLabel = 'Search…'
  @Input({ transform: booleanAttribute }) showTrigger = true
  /** Fires after an item's own `onSelect`, with the picked item (React `onSelect`). */
  @Output() select = new EventEmitter<CommandPaletteItem>()

  readonly open = signal(false)
  readonly triggerShortcut =
    typeof navigator === 'undefined' ? '⌘K' : /Mac|iPhone|iPad/i.test(navigator.platform) ? '⌘K' : 'Ctrl K'

  setOpen(value: boolean): void {
    if (value === this.open()) return
    this.open.set(value)
  }

  show(): void {
    this.setOpen(true)
  }

  hide(): void {
    this.setOpen(false)
  }

  toggle(): void {
    this.setOpen(!this.open())
  }

  pick(item: CommandPaletteItem): void {
    this.hide()
    item.onSelect?.()
    this.select.emit(item)
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      this.toggle()
    }
  }
}
