// Live demos for the /dashboard/ui-kit catalog cards. Ports
// nuxt-boilerplate's app/components/ui-kit/demos/*Demo.vue (one small,
// realistic example per installed primitive). The page mounts this inside
// `@defer (on viewport)`, so it ships as its own lazy chunk; the heavy
// charts and map demos live in ui-kit-demo-charts.ts / ui-kit-demo-map.ts
// so they get chunks of their own.
import { ChangeDetectionStrategy, Component, DestroyRef, Input, afterNextRender, inject, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import {
  Bold,
  CircleAlert,
  Copy,
  CreditCard,
  Fingerprint,
  FolderKanban,
  FolderOpen,
  Hash,
  House,
  Image as ImageIcon,
  Italic,
  LayoutDashboard,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  LucideAngularModule,
  Mail,
  Palette,
  Plus,
  Search,
  Settings,
  Trash2,
  Underline,
  User,
  X,
} from 'lucide-angular'
import {
  UiAccordionComponent,
  UiAccordionContentComponent,
  UiAccordionItemComponent,
  UiAccordionTriggerComponent,
} from '@/app/components/ui/accordion/accordion.component'
import { UiAvatarComponent, UiAvatarFallbackComponent, UiAvatarGroupComponent } from '@/app/components/ui/avatar/avatar.component'
import { UiBadgeComponent } from '@/app/components/ui/badge/badge.component'
import {
  UiBreadcrumbComponent,
  UiBreadcrumbItemComponent,
  UiBreadcrumbLinkComponent,
  UiBreadcrumbListComponent,
  UiBreadcrumbPageComponent,
  UiBreadcrumbSeparatorComponent,
} from '@/app/components/ui/breadcrumb/breadcrumb.component'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import { UiCalendarComponent } from '@/app/components/ui/calendar/calendar.component'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardFooterComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card/card.component'
import { UiCheckboxComponent } from '@/app/components/ui/checkbox/checkbox.component'
import {
  UiCollapsibleComponent,
  UiCollapsibleContentComponent,
  UiCollapsibleTriggerComponent,
} from '@/app/components/ui/collapsible/collapsible.component'
import {
  UiCommandComponent,
  UiCommandEmptyComponent,
  UiCommandGroupComponent,
  UiCommandInputComponent,
  UiCommandItemComponent,
  UiCommandListComponent,
} from '@/app/components/ui/command/command.component'
import {
  UiContextMenuComponent,
  UiContextMenuContentComponent,
  UiContextMenuItemComponent,
  UiContextMenuSeparatorComponent,
  UiContextMenuShortcutComponent,
  UiContextMenuTriggerComponent,
} from '@/app/components/ui/context-menu/context-menu.component'
import { UiDataListComponent, UiDataListItemComponent } from '@/app/components/ui/data-list/data-list.component'
import {
  UiDialogComponent,
  UiDialogContentComponent,
  UiDialogDescriptionComponent,
  UiDialogFooterComponent,
  UiDialogHeaderComponent,
  UiDialogTitleComponent,
  UiDialogTriggerComponent,
} from '@/app/components/ui/dialog/dialog.component'
import {
  UiDropdownMenuComponent,
  UiDropdownMenuContentComponent,
  UiDropdownMenuItemComponent,
  UiDropdownMenuSeparatorComponent,
  UiDropdownMenuTriggerComponent,
} from '@/app/components/ui/dropdown-menu/dropdown-menu.component'
import { UiEmptyStateComponent } from '@/app/components/ui/empty-state/empty-state.component'
import {
  UiFileUploadComponent,
  UiFileUploadContentComponent,
  UiFileUploadItemComponent,
} from '@/app/components/ui/file-upload/file-upload.component'
import { UiFormActionsComponent, UiFormItemComponent } from '@/app/components/ui/form/form.component'
import { UiIconBoxComponent } from '@/app/components/ui/icon-box/icon-box.component'
import { UiInputComponent } from '@/app/components/ui/input/input.component'
import { UiKpiGridComponent } from '@/app/components/ui/kpi-grid/kpi-grid.component'
import { UiLabelComponent } from '@/app/components/ui/label/label.component'
import { UiOverlayScrollComponent } from '@/app/components/ui/overlay-scroll/overlay-scroll.component'
import { UiPageBodyComponent, UiPageComponent, UiPageHeaderComponent } from '@/app/components/ui/page/page.component'
import {
  UiPinInputComponent,
  UiPinInputGroupComponent,
  UiPinInputSeparatorComponent,
  UiPinInputSlotComponent,
} from '@/app/components/ui/pin-input/pin-input.component'
import {
  UiPopoverComponent,
  UiPopoverContentComponent,
  UiPopoverTriggerComponent,
} from '@/app/components/ui/popover/popover.component'
import { UiProgressComponent } from '@/app/components/ui/progress/progress.component'
import { UiRadioGroupComponent, UiRadioGroupItemComponent } from '@/app/components/ui/radio-group/radio-group.component'
import { UiRangeCalendarComponent } from '@/app/components/ui/range-calendar/range-calendar.component'
import { UiSectionCardComponent } from '@/app/components/ui/section-card/section-card.component'
import {
  UiSelectComponent,
  UiSelectContentComponent,
  UiSelectItemComponent,
  UiSelectTriggerComponent,
  UiSelectValueComponent,
} from '@/app/components/ui/select/select.component'
import { UiSeparatorComponent } from '@/app/components/ui/separator/separator.component'
import {
  UiSheetComponent,
  UiSheetContentComponent,
  UiSheetDescriptionComponent,
  UiSheetFooterComponent,
  UiSheetHeaderComponent,
  UiSheetTitleComponent,
  UiSheetTriggerComponent,
} from '@/app/components/ui/sheet/sheet.component'
import {
  UiSidebarComponent,
  UiSidebarContentComponent,
  UiSidebarGroupComponent,
  UiSidebarGroupLabelComponent,
  UiSidebarMenuButtonComponent,
  UiSidebarMenuComponent,
  UiSidebarMenuItemComponent,
  UiSidebarProviderComponent,
} from '@/app/components/ui/sidebar/sidebar.component'
import { UiSkeletonComponent } from '@/app/components/ui/skeleton/skeleton.component'
import { UiSliderComponent } from '@/app/components/ui/slider/slider.component'
import { toast } from '@/app/components/ui/sonner/sonner.component'
import { UiSwitchComponent } from '@/app/components/ui/switch/switch.component'
import {
  UiTableBodyComponent,
  UiTableCellComponent,
  UiTableComponent,
  UiTableHeadComponent,
  UiTableHeaderComponent,
  UiTableRowComponent,
} from '@/app/components/ui/table/table.component'
import {
  UiTabsComponent,
  UiTabsContentComponent,
  UiTabsListComponent,
  UiTabsTriggerComponent,
} from '@/app/components/ui/tabs/tabs.component'
import { UiTextareaComponent } from '@/app/components/ui/textarea/textarea.component'
import { UiThemeSwitchComponent } from '@/app/components/ui/theme-switch/theme-switch.component'
import { UiToggleComponent } from '@/app/components/ui/toggle/toggle.component'
import { UiToggleGroupComponent, UiToggleGroupItemComponent } from '@/app/components/ui/toggle-group/toggle-group.component'
import {
  UiTooltipComponent,
  UiTooltipContentComponent,
  UiTooltipProviderComponent,
  UiTooltipTriggerComponent,
} from '@/app/components/ui/tooltip/tooltip.component'
import { UiTourComponent, type TourStep } from '@/app/components/ui/tour/tour.component'
import { UiStatTileComponent } from '@/app/components/blocks/stat-tile/stat-tile.component'

const daysAgo = (n: number) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ui-kit-demo',
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    UiAccordionComponent,
    UiAccordionContentComponent,
    UiAccordionItemComponent,
    UiAccordionTriggerComponent,
    UiAvatarComponent,
    UiAvatarFallbackComponent,
    UiAvatarGroupComponent,
    UiBadgeComponent,
    UiBreadcrumbComponent,
    UiBreadcrumbItemComponent,
    UiBreadcrumbLinkComponent,
    UiBreadcrumbListComponent,
    UiBreadcrumbPageComponent,
    UiBreadcrumbSeparatorComponent,
    UiButtonComponent,
    UiCalendarComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardFooterComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
    UiCheckboxComponent,
    UiCollapsibleComponent,
    UiCollapsibleContentComponent,
    UiCollapsibleTriggerComponent,
    UiCommandComponent,
    UiCommandEmptyComponent,
    UiCommandGroupComponent,
    UiCommandInputComponent,
    UiCommandItemComponent,
    UiCommandListComponent,
    UiContextMenuComponent,
    UiContextMenuContentComponent,
    UiContextMenuItemComponent,
    UiContextMenuSeparatorComponent,
    UiContextMenuShortcutComponent,
    UiContextMenuTriggerComponent,
    UiDataListComponent,
    UiDataListItemComponent,
    UiDialogComponent,
    UiDialogContentComponent,
    UiDialogDescriptionComponent,
    UiDialogFooterComponent,
    UiDialogHeaderComponent,
    UiDialogTitleComponent,
    UiDialogTriggerComponent,
    UiDropdownMenuComponent,
    UiDropdownMenuContentComponent,
    UiDropdownMenuItemComponent,
    UiDropdownMenuSeparatorComponent,
    UiDropdownMenuTriggerComponent,
    UiEmptyStateComponent,
    UiFileUploadComponent,
    UiFileUploadContentComponent,
    UiFileUploadItemComponent,
    UiFormActionsComponent,
    UiFormItemComponent,
    UiIconBoxComponent,
    UiInputComponent,
    UiKpiGridComponent,
    UiLabelComponent,
    UiOverlayScrollComponent,
    UiPageBodyComponent,
    UiPageComponent,
    UiPageHeaderComponent,
    UiPinInputComponent,
    UiPinInputGroupComponent,
    UiPinInputSeparatorComponent,
    UiPinInputSlotComponent,
    UiPopoverComponent,
    UiPopoverContentComponent,
    UiPopoverTriggerComponent,
    UiProgressComponent,
    UiRadioGroupComponent,
    UiRadioGroupItemComponent,
    UiRangeCalendarComponent,
    UiSectionCardComponent,
    UiSelectComponent,
    UiSelectContentComponent,
    UiSelectItemComponent,
    UiSelectTriggerComponent,
    UiSelectValueComponent,
    UiSeparatorComponent,
    UiSheetComponent,
    UiSheetContentComponent,
    UiSheetDescriptionComponent,
    UiSheetFooterComponent,
    UiSheetHeaderComponent,
    UiSheetTitleComponent,
    UiSheetTriggerComponent,
    UiSidebarComponent,
    UiSidebarContentComponent,
    UiSidebarGroupComponent,
    UiSidebarGroupLabelComponent,
    UiSidebarMenuButtonComponent,
    UiSidebarMenuComponent,
    UiSidebarMenuItemComponent,
    UiSidebarProviderComponent,
    UiSkeletonComponent,
    UiSliderComponent,
    UiStatTileComponent,
    UiSwitchComponent,
    UiTableBodyComponent,
    UiTableCellComponent,
    UiTableComponent,
    UiTableHeadComponent,
    UiTableHeaderComponent,
    UiTableRowComponent,
    UiTabsComponent,
    UiTabsContentComponent,
    UiTabsListComponent,
    UiTabsTriggerComponent,
    UiTextareaComponent,
    UiThemeSwitchComponent,
    UiToggleComponent,
    UiToggleGroupComponent,
    UiToggleGroupItemComponent,
    UiTooltipComponent,
    UiTooltipContentComponent,
    UiTooltipProviderComponent,
    UiTooltipTriggerComponent,
    UiTourComponent,
  ],
  template: `
    @switch (name) {
      @case ('accordion') {
        <ui-accordion type="single" [collapsible]="true">
          <ui-accordion-item value="item-1">
            <ui-accordion-trigger>Is it accessible?</ui-accordion-trigger>
            <ui-accordion-content>Yes. It adheres to the WAI-ARIA design pattern for accordions.</ui-accordion-content>
          </ui-accordion-item>
          <ui-accordion-item value="item-2">
            <ui-accordion-trigger>Can I customize styles?</ui-accordion-trigger>
            <ui-accordion-content>Absolutely. All components are built with Tailwind and expose class props.</ui-accordion-content>
          </ui-accordion-item>
          <ui-accordion-item value="item-3">
            <ui-accordion-trigger>Is it SSR-friendly?</ui-accordion-trigger>
            <ui-accordion-content>Yes. Components work with Angular SSR and hydration.</ui-accordion-content>
          </ui-accordion-item>
        </ui-accordion>
      }
      @case ('avatar') {
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <ui-avatar class="size-10"><ui-avatar-fallback>EW</ui-avatar-fallback></ui-avatar>
            <div>
              <p class="text-sm font-medium">Emma Wilson</p>
              <p class="text-muted-foreground text-xs">emma.wilson&#64;example.com</p>
            </div>
          </div>
          <ui-avatar-group>
            @for (p of people; track p) {
              <ui-avatar><ui-avatar-fallback>{{ initials(p) }}</ui-avatar-fallback></ui-avatar>
            }
          </ui-avatar-group>
        </div>
      }
      @case ('badge') {
        <div class="flex flex-wrap gap-2">
          <ui-badge>Pro</ui-badge>
          <ui-badge variant="secondary">Draft</ui-badge>
          <ui-badge variant="outline">v2.4.0</ui-badge>
          <ui-badge variant="success">Paid</ui-badge>
          <ui-badge variant="warning">Due soon</ui-badge>
          <ui-badge variant="info">Beta</ui-badge>
          <ui-badge variant="destructive">Failed</ui-badge>
        </div>
      }
      @case ('breadcrumb') {
        <ui-breadcrumb>
          <ui-breadcrumb-list>
            <ui-breadcrumb-item>
              <a ui-breadcrumb-link routerLink="/dashboard">
                <lucide-icon [img]="HouseIcon" class="size-3.5" aria-hidden="true" />
                <span class="sr-only">Dashboard</span>
              </a>
            </ui-breadcrumb-item>
            <ui-breadcrumb-separator />
            <ui-breadcrumb-item><a ui-breadcrumb-link routerLink="/settings">Settings</a></ui-breadcrumb-item>
            <ui-breadcrumb-separator />
            <ui-breadcrumb-item><ui-breadcrumb-page>UI Kit</ui-breadcrumb-page></ui-breadcrumb-item>
          </ui-breadcrumb-list>
        </ui-breadcrumb>
      }
      @case ('button') {
        <div class="space-y-4">
          <div class="flex flex-wrap items-center gap-2">
            <button ui-button size="sm"><lucide-icon [img]="PlusIcon" class="size-4" aria-hidden="true" />New project</button>
            <button ui-button size="sm" variant="outline">Outline</button>
            <button ui-button size="sm" variant="secondary">Secondary</button>
            <button ui-button size="sm" variant="ghost">Ghost</button>
            <button ui-button size="sm" variant="link">Link</button>
            <button ui-button size="sm" variant="destructive"><lucide-icon [img]="TrashIcon" class="size-4" aria-hidden="true" />Delete</button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button ui-button size="xs">Extra small</button>
            <button ui-button size="sm">Small</button>
            <button ui-button>Default</button>
            <button ui-button size="icon" variant="outline" aria-label="Add"><lucide-icon [img]="PlusIcon" class="size-4" aria-hidden="true" /></button>
            <button ui-button size="sm" [disabled]="true"><lucide-icon [img]="LoaderIcon" class="size-4 animate-spin" aria-hidden="true" />Saving</button>
          </div>
        </div>
      }
      @case ('calendar') {
        <div class="flex flex-wrap items-start gap-4">
          <ui-calendar mode="single" class="rounded-md border" [selected]="date()" (select)="date.set($any($event))" />
          <p class="text-muted-foreground text-xs">Selected: <span class="text-foreground tabular-nums">{{ isoDay(date()) }}</span></p>
        </div>
      }
      @case ('card') {
        <ui-card class="max-w-sm">
          <ui-card-header>
            <ui-card-title class="text-base">Deploy to production</ui-card-title>
            <ui-card-description>web-app · main · 3 commits ahead</ui-card-description>
          </ui-card-header>
          <ui-card-content class="text-sm">The last deploy finished 2 hours ago with no errors.</ui-card-content>
          <ui-card-footer class="gap-2">
            <button ui-button size="sm">Deploy</button>
            <button ui-button size="sm" variant="outline">View diff</button>
          </ui-card-footer>
        </ui-card>
      }
      @case ('checkbox') {
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <ui-checkbox id="ui-kit-terms" />
            <ui-label htmlFor="ui-kit-terms" class="text-sm font-normal">Accept terms</ui-label>
          </div>
          <div class="flex items-center gap-2">
            <ui-checkbox id="ui-kit-news" [defaultChecked]="true" />
            <ui-label htmlFor="ui-kit-news" class="text-sm font-normal">Newsletter</ui-label>
          </div>
        </div>
      }
      @case ('collapsible') {
        <ui-collapsible>
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium">3 repositories connected</p>
            <button ui-button ui-collapsible-trigger variant="ghost" size="sm">Toggle</button>
          </div>
          <ui-collapsible-content class="mt-2 space-y-2">
            @for (repo of repos; track repo) {
              <div class="rounded-md border px-3 py-2 font-mono text-xs">{{ repo }}</div>
            }
          </ui-collapsible-content>
        </ui-collapsible>
      }
      @case ('command') {
        <ui-command class="rounded-lg border shadow-sm">
          <ui-command-input placeholder="Type a command or search..." />
          <ui-command-list>
            <ui-command-empty>No results found.</ui-command-empty>
            <ui-command-group heading="Suggestions">
              <ui-command-item value="calendar"><lucide-icon [img]="HashIcon" class="mr-2 size-4" />Calendar</ui-command-item>
              <ui-command-item value="search"><lucide-icon [img]="SearchIcon" class="mr-2 size-4" />Search Emoji</ui-command-item>
              <ui-command-item value="calculator"><lucide-icon [img]="CardIcon" class="mr-2 size-4" />Calculator</ui-command-item>
            </ui-command-group>
            <ui-command-group heading="Settings">
              <ui-command-item value="profile"><lucide-icon [img]="UserIcon" class="mr-2 size-4" />Profile</ui-command-item>
              <ui-command-item value="billing"><lucide-icon [img]="CardIcon" class="mr-2 size-4" />Billing</ui-command-item>
              <ui-command-item value="settings"><lucide-icon [img]="SettingsIcon" class="mr-2 size-4" />Settings</ui-command-item>
            </ui-command-group>
          </ui-command-list>
        </ui-command>
      }
      @case ('context-menu') {
        <ui-context-menu>
          <div ui-context-menu-trigger class="text-muted-foreground flex h-24 items-center justify-center rounded-md border border-dashed text-sm">
            Right-click here
          </div>
          <ui-context-menu-content class="w-48">
            <ui-context-menu-item>Open <ui-context-menu-shortcut>⌘O</ui-context-menu-shortcut></ui-context-menu-item>
            <ui-context-menu-item>Duplicate <ui-context-menu-shortcut>⌘D</ui-context-menu-shortcut></ui-context-menu-item>
            <ui-context-menu-separator />
            <ui-context-menu-item class="text-destructive">Delete</ui-context-menu-item>
          </ui-context-menu-content>
        </ui-context-menu>
      }
      @case ('data-list') {
        <ui-data-list>
          <ui-data-list-item><span class="text-muted-foreground text-sm">Status</span><ui-badge variant="success">Active</ui-badge></ui-data-list-item>
          <ui-data-list-item><span class="text-muted-foreground text-sm">Region</span><span class="font-mono text-sm">us-east-1</span></ui-data-list-item>
          <ui-data-list-item><span class="text-muted-foreground text-sm">Plan</span><ui-badge>Pro</ui-badge></ui-data-list-item>
          <ui-data-list-item><span class="text-muted-foreground text-sm">Seats</span><span class="text-sm tabular-nums">8 of 25</span></ui-data-list-item>
        </ui-data-list>
      }
      @case ('dialog') {
        <ui-dialog [open]="dialogOpen()" (openChange)="dialogOpen.set($event)">
          <button ui-button ui-dialog-trigger variant="outline" size="sm">Open dialog</button>
          <ui-dialog-content>
            <ui-dialog-header>
              <ui-dialog-title>Confirm action</ui-dialog-title>
              <ui-dialog-description>This will permanently delete the selected item. This action cannot be undone.</ui-dialog-description>
            </ui-dialog-header>
            <ui-dialog-footer>
              <button ui-button variant="outline" size="sm" (click)="dialogOpen.set(false)">Cancel</button>
              <button ui-button variant="destructive" size="sm" (click)="dialogOpen.set(false)">Delete</button>
            </ui-dialog-footer>
          </ui-dialog-content>
        </ui-dialog>
      }
      @case ('dropdown-menu') {
        <ui-dropdown-menu>
          <button ui-button ui-dropdown-menu-trigger variant="outline" size="sm">Menu</button>
          <ui-dropdown-menu-content>
            <ui-dropdown-menu-item>View</ui-dropdown-menu-item>
            <ui-dropdown-menu-item>Edit</ui-dropdown-menu-item>
            <ui-dropdown-menu-separator />
            <ui-dropdown-menu-item class="text-destructive">Delete</ui-dropdown-menu-item>
          </ui-dropdown-menu-content>
        </ui-dropdown-menu>
      }
      @case ('empty-state') {
        <ui-empty-state
          [icon]="folderIcon"
          title="No projects yet"
          description="Create a project to start tracking deploys and usage."
          headingTag="h4"
          class="py-4"
        >
          <ng-template #folderIcon><lucide-icon [img]="FolderIcon" /></ng-template>
          <button ui-button size="sm" class="mt-4">New project</button>
        </ui-empty-state>
      }
      @case ('file-upload') {
        <ui-file-upload accept="image/*" multiple [value]="files()" (valueChange)="files.set($event)">
          @if (files().length) {
            <ui-file-upload-content>
              @for (f of files(); track f.name + '-' + f.size; let i = $index) {
                <ui-file-upload-item [file]="f" (remove)="removeFile(i)" />
              }
            </ui-file-upload-content>
          }
        </ui-file-upload>
      }
      @case ('form') {
        <div class="max-w-md space-y-4">
          <ui-form-item label="Workspace name" description="Shown in invites and on invoices." [required]="true">
            <ui-input id="ui-kit-form-name" value="Acme Inc" />
          </ui-form-item>
          <ui-form-item label="Billing email" status="error" help="Enter a valid email address.">
            <ui-input id="ui-kit-form-email" value="billing@acme" status="error" />
          </ui-form-item>
          <ui-form-actions>
            <button ui-button variant="outline" size="sm">Cancel</button>
            <button ui-button size="sm">Save</button>
          </ui-form-actions>
        </div>
      }
      @case ('icon-box') {
        <div class="flex gap-2">
          <ui-icon-box><lucide-icon [img]="MailIcon" class="size-4" /></ui-icon-box>
          <ui-icon-box variant="muted"><lucide-icon [img]="SettingsIcon" class="size-4" /></ui-icon-box>
          <ui-icon-box variant="muted"><lucide-icon [img]="PaletteIcon" class="size-4" /></ui-icon-box>
          <ui-icon-box variant="custom"><lucide-icon [img]="FingerprintIcon" class="size-4" /></ui-icon-box>
        </div>
      }
      @case ('input') {
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <ui-label htmlFor="ui-kit-input-email">Text input</ui-label>
            <ui-input id="ui-kit-input-email" [prefixIcon]="mailIcon" placeholder="name@example.com" />
            <ng-template #mailIcon><lucide-icon [img]="MailIcon" class="size-4" /></ng-template>
          </div>
          <div class="space-y-2">
            <ui-label htmlFor="ui-kit-input-password">Password</ui-label>
            <ui-input id="ui-kit-input-password" type="password" value="secret123" />
          </div>
        </div>
      }
      @case ('kpi-grid') {
        <ui-kpi-grid [columns]="2">
          @for (tile of tiles; track tile.label) {
            <ui-stat-tile [label]="tile.label" [value]="tile.value" [delta]="tile.delta" [deltaTone]="tile.tone" />
          }
        </ui-kpi-grid>
      }
      @case ('label') {
        <div class="max-w-xs space-y-2">
          <ui-label htmlFor="ui-kit-label-workspace">Workspace name</ui-label>
          <ui-input id="ui-kit-label-workspace" placeholder="Acme Inc" />
        </div>
      }
      @case ('overlay-scroll') {
        <ui-overlay-scroll class="h-24 rounded-md border p-2">
          @for (i of lines; track i) {
            <p class="py-1 text-xs">Scrollable content line {{ i }}</p>
          }
        </ui-overlay-scroll>
      }
      @case ('page') {
        <!-- ui-page-header-heading renders an h1; the preview uses a plain
             title to keep one h1 per page. -->
        <ui-page class="space-y-4">
          <ui-page-header>
            <p class="text-2xl font-semibold tracking-tight">Projects</p>
            <p class="text-muted-foreground mt-1 text-sm">Every project in this workspace.</p>
            <button slot="actions" ui-button size="sm"><lucide-icon [img]="PlusIcon" class="size-4" aria-hidden="true" />New project</button>
          </ui-page-header>
          <ui-page-body class="text-muted-foreground rounded-md border border-dashed p-4 text-sm">PageBody content</ui-page-body>
        </ui-page>
      }
      @case ('pin-input') {
        <div class="space-y-2">
          <ui-label>Verification code</ui-label>
          <ui-pin-input class="flex gap-2" [value]="otp()" (valueChange)="otp.set($event)">
            <ui-pin-input-group>
              <ui-pin-input-slot [index]="0" />
              <ui-pin-input-slot [index]="1" />
              <ui-pin-input-slot [index]="2" />
              <ui-pin-input-separator />
              <ui-pin-input-slot [index]="3" />
              <ui-pin-input-slot [index]="4" />
              <ui-pin-input-slot [index]="5" />
            </ui-pin-input-group>
          </ui-pin-input>
        </div>
      }
      @case ('popover') {
        <ui-popover>
          <button ui-button ui-popover-trigger variant="outline" size="sm">Popover</button>
          <ui-popover-content class="w-56">
            <p class="text-sm font-medium">Quick actions</p>
            <p class="text-muted-foreground mt-1 text-xs">Choose an action for this item.</p>
            <ui-separator class="my-2" />
            <div class="space-y-1">
              <button type="button" class="hover:bg-accent flex w-full items-center gap-1.5 rounded px-2 py-1 text-xs">
                <lucide-icon [img]="CopyIcon" class="size-3.5" aria-hidden="true" />Copy
              </button>
              <button type="button" class="hover:bg-accent text-destructive flex w-full items-center gap-1.5 rounded px-2 py-1 text-xs">
                <lucide-icon [img]="XIcon" class="size-3.5" aria-hidden="true" />Remove
              </button>
            </div>
          </ui-popover-content>
        </ui-popover>
      }
      @case ('progress') {
        <div class="space-y-4">
          @for (row of progressRows; track row.label) {
            <div class="space-y-1">
              <div class="flex justify-between text-xs"><span>{{ row.label }}</span><span class="tabular-nums">{{ row.value }}%</span></div>
              <ui-progress [value]="row.value" [attr.aria-label]="row.label" />
            </div>
          }
        </div>
      }
      @case ('radio-group') {
        <ui-radio-group defaultValue="comfortable" aria-label="Density">
          @for (o of densities; track o.value) {
            <div class="flex items-center gap-2">
              <ui-radio-group-item [id]="'ui-kit-radio-' + o.value" [value]="o.value" />
              <ui-label [htmlFor]="'ui-kit-radio-' + o.value" class="text-sm font-normal">{{ o.label }}</ui-label>
            </div>
          }
        </ui-radio-group>
      }
      @case ('range-calendar') {
        <div class="flex flex-wrap items-start gap-4">
          <ui-range-calendar class="rounded-md border" [selected]="range()" (select)="range.set($any($event))" />
          <p class="text-muted-foreground text-xs">
            <span class="text-foreground tabular-nums">{{ isoDay(range().from) }}</span>
            to
            <span class="text-foreground tabular-nums">{{ isoDay(range().to) }}</span>
          </p>
        </div>
      }
      @case ('section-card') {
        <ui-section-card title="Account details" description="Your workspace identity">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">Plan</span>
            <ui-badge>Pro</ui-badge>
          </div>
        </ui-section-card>
      }
      @case ('select') {
        <div class="max-w-xs space-y-2">
          <ui-label>Plan</ui-label>
          <ui-select defaultValue="pro">
            <button ui-select-trigger aria-label="Plan"><ui-select-value /></button>
            <ui-select-content>
              <ui-select-item value="free">Free</ui-select-item>
              <ui-select-item value="pro">Pro</ui-select-item>
              <ui-select-item value="enterprise">Enterprise</ui-select-item>
            </ui-select-content>
          </ui-select>
        </div>
      }
      @case ('separator') {
        <div class="space-y-2">
          <p class="text-sm font-medium">Workspace</p>
          <p class="text-muted-foreground text-xs">Settings shared by every member.</p>
          <ui-separator class="my-4" />
          <div class="flex h-5 items-center gap-4 text-sm">
            <span>General</span>
            <ui-separator orientation="vertical" />
            <span>Members</span>
            <ui-separator orientation="vertical" />
            <span>Billing</span>
          </div>
        </div>
      }
      @case ('sheet') {
        <ui-sheet [open]="sheetOpen()" (openChange)="sheetOpen.set($event)">
          <button ui-button ui-sheet-trigger variant="outline" size="sm">Open sheet</button>
          <ui-sheet-content>
            <ui-sheet-header>
              <ui-sheet-title>Details</ui-sheet-title>
              <ui-sheet-description>View and edit item details.</ui-sheet-description>
            </ui-sheet-header>
            <div class="space-y-4 px-4">
              <div class="space-y-2">
                <ui-label htmlFor="ui-kit-sheet-name">Name</ui-label>
                <ui-input id="ui-kit-sheet-name" value="Acme Inc" />
              </div>
              <div class="space-y-2">
                <ui-label htmlFor="ui-kit-sheet-email">Email</ui-label>
                <ui-input id="ui-kit-sheet-email" value="hello@acme.com" />
              </div>
            </div>
            <ui-sheet-footer>
              <button ui-button size="sm" (click)="sheetOpen.set(false)">Save</button>
            </ui-sheet-footer>
          </ui-sheet-content>
        </ui-sheet>
      }
      @case ('sidebar') {
        <!-- A static (collapsible="none") sidebar. The app's real one is the
             sidebar-02 block in the dashboard layout. -->
        <ui-sidebar-provider class="min-h-0">
          <ui-sidebar collapsible="none" class="h-auto rounded-md border">
            <ui-sidebar-content>
              <ui-sidebar-group>
                <ui-sidebar-group-label>Platform</ui-sidebar-group-label>
                <ui-sidebar-menu>
                  @for (item of navItems; track item.title) {
                    <ui-sidebar-menu-item>
                      <button ui-sidebar-menu-button [isActive]="item.active">
                        <lucide-icon [img]="item.icon" aria-hidden="true" />
                        <span>{{ item.title }}</span>
                      </button>
                    </ui-sidebar-menu-item>
                  }
                </ui-sidebar-menu>
              </ui-sidebar-group>
            </ui-sidebar-content>
          </ui-sidebar>
        </ui-sidebar-provider>
      }
      @case ('skeleton') {
        <div class="space-y-4">
          @if (loading()) {
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <ui-skeleton class="size-10 rounded-full" />
                <div class="space-y-1">
                  <ui-skeleton class="h-2 w-24" />
                  <ui-skeleton class="h-2 w-32" />
                </div>
              </div>
              <ui-skeleton class="h-2 w-full" />
              <ui-skeleton class="h-2 w-3/4" />
            </div>
          } @else {
            <div class="space-y-2 text-sm">
              <div class="flex items-center gap-2">
                <ui-avatar class="size-10"><ui-avatar-fallback>JD</ui-avatar-fallback></ui-avatar>
                <div>
                  <p class="font-medium">John Doe</p>
                  <p class="text-muted-foreground text-xs">john.doe&#64;example.com</p>
                </div>
              </div>
              <p class="text-muted-foreground">Content loaded.</p>
            </div>
          }
          <button ui-button variant="outline" size="sm" (click)="replay()">Replay</button>
        </div>
      }
      @case ('slider') {
        <div class="max-w-sm space-y-2">
          <ui-label htmlFor="ui-kit-slider">Slider ({{ slider()[0] }}%)</ui-label>
          <ui-slider id="ui-kit-slider" [value]="slider()" (valueChange)="slider.set($event)" [min]="0" [max]="100" [step]="1" aria-label="Demo slider" />
        </div>
      }
      @case ('sonner') {
        <div class="flex flex-wrap gap-2">
          <button ui-button variant="outline" size="sm" (click)="toastSuccess()">Success</button>
          <button ui-button variant="outline" size="sm" (click)="toastError()">Error</button>
          <button ui-button variant="outline" size="sm" (click)="toastUndo()">With undo</button>
        </div>
      }
      @case ('switch') {
        <div class="max-w-xs space-y-2">
          <div class="flex items-center justify-between">
            <ui-label htmlFor="ui-kit-switch-notifications" class="text-sm font-normal">Notifications</ui-label>
            <ui-switch id="ui-kit-switch-notifications" [defaultChecked]="true" />
          </div>
          <div class="flex items-center justify-between">
            <ui-label htmlFor="ui-kit-switch-digest" class="text-sm font-normal">Weekly digest</ui-label>
            <ui-switch id="ui-kit-switch-digest" />
          </div>
        </div>
      }
      @case ('table') {
        <ui-table>
          <thead ui-table-header>
            <tr ui-table-row>
              <th ui-table-head>Invoice</th>
              <th ui-table-head>Customer</th>
              <th ui-table-head>Status</th>
              <th ui-table-head class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody ui-table-body>
            @for (inv of invoices; track inv.id) {
              <tr ui-table-row>
                <td ui-table-cell class="font-mono text-xs">{{ inv.id }}</td>
                <td ui-table-cell>{{ inv.customer }}</td>
                <td ui-table-cell><ui-badge [variant]="inv.status === 'Paid' ? 'success' : 'warning'">{{ inv.status }}</ui-badge></td>
                <td ui-table-cell class="text-right tabular-nums">{{ inv.amount }}</td>
              </tr>
            }
          </tbody>
        </ui-table>
      }
      @case ('tabs') {
        <ui-tabs defaultValue="overview">
          <ui-tabs-list>
            <button ui-tabs-trigger value="overview">Overview</button>
            <button ui-tabs-trigger value="deploys">Deploys</button>
            <button ui-tabs-trigger value="settings">Settings</button>
          </ui-tabs-list>
          <ui-tabs-content value="overview" class="text-muted-foreground pt-2 text-sm">Traffic and error rates for the last 7 days.</ui-tabs-content>
          <ui-tabs-content value="deploys" class="text-muted-foreground pt-2 text-sm">12 deploys this week, all successful.</ui-tabs-content>
          <ui-tabs-content value="settings" class="text-muted-foreground pt-2 text-sm">Environment variables and build settings.</ui-tabs-content>
        </ui-tabs>
      }
      @case ('textarea') {
        <div class="space-y-2">
          <ui-label htmlFor="ui-kit-textarea">Message</ui-label>
          <ui-textarea id="ui-kit-textarea" placeholder="Enter your message..." [rows]="3" />
        </div>
      }
      @case ('theme-switch') {
        <div class="space-y-4">
          <ui-theme-switch modelValue="light" variant="cards" />
          <div class="flex flex-wrap items-center gap-4">
            <ui-theme-switch modelValue="dark" variant="icons" />
            <ui-theme-switch modelValue="system" variant="pill" />
          </div>
        </div>
      }
      @case ('toggle') {
        <div class="flex gap-2">
          <button ui-toggle aria-label="Bold"><lucide-icon [img]="BoldIcon" class="size-4" /></button>
          <button ui-toggle aria-label="Italic"><lucide-icon [img]="ItalicIcon" class="size-4" /></button>
          <button ui-toggle aria-label="Underline"><lucide-icon [img]="UnderlineIcon" class="size-4" /></button>
        </div>
      }
      @case ('toggle-group') {
        <ui-toggle-group type="single" defaultValue="list">
          <button ui-toggle-group-item value="list" aria-label="Bulleted list"><lucide-icon [img]="ListIcon" class="size-4" /></button>
          <button ui-toggle-group-item value="ordered" aria-label="Numbered list"><lucide-icon [img]="ListOrderedIcon" class="size-4" /></button>
          <button ui-toggle-group-item value="link" aria-label="Link"><lucide-icon [img]="LinkIcon" class="size-4" /></button>
          <button ui-toggle-group-item value="image" aria-label="Image"><lucide-icon [img]="ImageIcon" class="size-4" /></button>
        </ui-toggle-group>
      }
      @case ('tooltip') {
        <ui-tooltip-provider>
          <ui-tooltip>
            <button ui-button ui-tooltip-trigger variant="ghost" size="icon" class="size-8" aria-label="More information">
              <lucide-icon [img]="AlertIcon" class="size-4" aria-hidden="true" />
            </button>
            <ui-tooltip-content><p>More information about this feature</p></ui-tooltip-content>
          </ui-tooltip>
        </ui-tooltip-provider>
      }
      @case ('tour') {
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <div #searchEl class="flex-1">
              <ui-input placeholder="Search projects" aria-label="Search projects" />
            </div>
            <div #createEl>
              <button ui-button size="sm">New project</button>
            </div>
          </div>
          <button ui-button variant="outline" size="sm" (click)="startTour(searchEl, createEl)">Start tour</button>
          <ui-tour
            [open]="tourOpen()"
            [current]="tourStep()"
            [steps]="tourSteps()"
            (openChange)="tourOpen.set($event)"
            (currentChange)="tourStep.set($event)"
          />
        </div>
      }
    }
  `,
})
export class UiKitDemoComponent {
  @Input({ required: true }) name!: string

  protected readonly AlertIcon = CircleAlert
  protected readonly BoldIcon = Bold
  protected readonly CardIcon = CreditCard
  protected readonly CopyIcon = Copy
  protected readonly FingerprintIcon = Fingerprint
  protected readonly FolderIcon = FolderOpen
  protected readonly HashIcon = Hash
  protected readonly HouseIcon = House
  protected readonly ImageIcon = ImageIcon
  protected readonly ItalicIcon = Italic
  protected readonly LinkIcon = LinkIcon
  protected readonly ListIcon = List
  protected readonly ListOrderedIcon = ListOrdered
  protected readonly LoaderIcon = Loader2
  protected readonly MailIcon = Mail
  protected readonly PaletteIcon = Palette
  protected readonly PlusIcon = Plus
  protected readonly SearchIcon = Search
  protected readonly SettingsIcon = Settings
  protected readonly TrashIcon = Trash2
  protected readonly UnderlineIcon = Underline
  protected readonly UserIcon = User
  protected readonly XIcon = X

  protected readonly people = ['Emma Wilson', 'Liam Carter', 'Olivia Brooks', 'Noah Bennett']
  protected readonly repos = ['acme/web-app', 'acme/api-gateway', 'acme/billing-service']
  protected readonly lines = Array.from({ length: 10 }, (_, i) => i + 1)
  protected readonly tiles = [
    { label: 'Total revenue', value: '$84,230', delta: '+12.5%', tone: 'positive' as const },
    { label: 'Active users', value: '2,420', delta: '+8.2%', tone: 'positive' as const },
    { label: 'Conversion rate', value: '3.24%', delta: '-0.4%', tone: 'negative' as const },
    { label: 'Avg. order value', value: '$64.50', delta: '+2.1%', tone: 'positive' as const },
  ]
  protected readonly progressRows = [
    { label: 'Uploading', value: 78 },
    { label: 'Processing', value: 42 },
    { label: 'Complete', value: 100 },
  ]
  protected readonly densities = [
    { value: 'compact', label: 'Compact' },
    { value: 'comfortable', label: 'Comfortable' },
    { value: 'spacious', label: 'Spacious' },
  ]
  protected readonly invoices = [
    { id: 'INV-1042', customer: 'Northwind Labs', amount: '$1,280.00', status: 'Paid' },
    { id: 'INV-1041', customer: 'Brightline Co', amount: '$640.00', status: 'Due' },
    { id: 'INV-1040', customer: 'Harbor Analytics', amount: '$2,150.00', status: 'Paid' },
  ]
  protected readonly navItems = [
    { title: 'Dashboard', icon: LayoutDashboard, active: true },
    { title: 'Projects', icon: FolderKanban, active: false },
    { title: 'Settings', icon: Settings, active: false },
  ]

  readonly date = signal<Date | undefined>(daysAgo(0))
  readonly range = signal<{ from: Date | undefined, to?: Date }>({ from: daysAgo(6), to: daysAgo(0) })
  readonly dialogOpen = signal(false)
  readonly sheetOpen = signal(false)
  readonly files = signal<File[]>([])
  readonly otp = signal('')
  readonly slider = signal([65])
  readonly loading = signal(true)
  readonly tourOpen = signal(false)
  readonly tourStep = signal(0)
  readonly tourSteps = signal<TourStep[]>([])
  private loadingTimer: ReturnType<typeof setTimeout> | undefined

  constructor() {
    const destroyRef = inject(DestroyRef)
    afterNextRender(() => this.replay())
    destroyRef.onDestroy(() => clearTimeout(this.loadingTimer))
  }

  initials(name: string): string {
    return name.split(' ').map(p => p[0]).join('')
  }

  isoDay(d?: Date): string {
    if (!d) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }

  removeFile(i: number): void {
    this.files.update(f => f.filter((_, idx) => idx !== i))
  }

  replay(): void {
    this.loading.set(true)
    clearTimeout(this.loadingTimer)
    this.loadingTimer = setTimeout(() => this.loading.set(false), 2000)
  }

  // The <ui-toaster> host is mounted once in app.html; demos just call toast().
  toastSuccess(): void {
    toast.success('Changes saved')
  }

  toastError(): void {
    toast.error('Couldn’t reach the server')
  }

  toastUndo(): void {
    toast.success('Invoice INV-2031 deleted', { action: { label: 'Undo', onClick: () => toast('Invoice restored') } })
  }

  startTour(search: HTMLElement, create: HTMLElement): void {
    this.tourSteps.set([
      { target: search, title: 'Search', description: 'Find any project by name.' },
      { target: create, title: 'Create', description: 'Start a new project here.' },
    ])
    this.tourStep.set(0)
    this.tourOpen.set(true)
  }
}
