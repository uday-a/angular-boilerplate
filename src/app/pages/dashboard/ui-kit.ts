// Every primitive demonstrated in realistic contexts. Ports
// nuxt-boilerplate's app/pages/dashboard/ui-kit.vue.
//
// DIVERGENCES:
// - KpiGrid (Angular) is a bare grid wrapper with no `items` prop, so the KPI
//   tiles are spelled out inline as cards.
// - RichTextEditor is stubbed: it needs @tiptap/* which this repo has not
//   installed. The section renders a placeholder noting the follow-up.
import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Title } from '@angular/platform-browser'
import { RouterLink } from '@angular/router'
import {
  Bold,
  CircleAlert,
  Copy,
  CreditCard,
  Hash,
  House,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  LucideAngularModule,
  Mail,
  Palette,
  ScanFace,
  Search,
  Settings,
  Underline,
  User,
  X,
} from 'lucide-angular'
import { UiAvatarComponent, UiAvatarFallbackComponent } from '@/app/components/ui/avatar/avatar.component'
import { UiBadgeComponent } from '@/app/components/ui/badge/badge.component'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card/card.component'
import { UiCheckboxComponent } from '@/app/components/ui/checkbox/checkbox.component'
import { UiInputComponent } from '@/app/components/ui/input/input.component'
import { UiLabelComponent } from '@/app/components/ui/label/label.component'
import { UiProgressComponent } from '@/app/components/ui/progress/progress.component'
import { UiSeparatorComponent } from '@/app/components/ui/separator/separator.component'
import { UiSkeletonComponent } from '@/app/components/ui/skeleton/skeleton.component'
import { UiSliderComponent } from '@/app/components/ui/slider/slider.component'
import { UiSwitchComponent } from '@/app/components/ui/switch/switch.component'
import { UiTextareaComponent } from '@/app/components/ui/textarea/textarea.component'
import {
  UiBreadcrumbComponent,
  UiBreadcrumbItemComponent,
  UiBreadcrumbLinkComponent,
  UiBreadcrumbListComponent,
  UiBreadcrumbPageComponent,
  UiBreadcrumbSeparatorComponent,
} from '@/app/components/ui/breadcrumb/breadcrumb.component'
import {
  UiAccordionComponent,
  UiAccordionContentComponent,
  UiAccordionItemComponent,
  UiAccordionTriggerComponent,
} from '@/app/components/ui/accordion/accordion.component'
import {
  UiCollapsibleComponent,
  UiCollapsibleContentComponent,
  UiCollapsibleTriggerComponent,
} from '@/app/components/ui/collapsible/collapsible.component'
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
  UiSheetComponent,
  UiSheetContentComponent,
  UiSheetDescriptionComponent,
  UiSheetHeaderComponent,
  UiSheetTitleComponent,
  UiSheetTriggerComponent,
} from '@/app/components/ui/sheet/sheet.component'
import {
  UiPopoverComponent,
  UiPopoverContentComponent,
  UiPopoverTriggerComponent,
} from '@/app/components/ui/popover/popover.component'
import {
  UiTooltipComponent,
  UiTooltipContentComponent,
  UiTooltipProviderComponent,
  UiTooltipTriggerComponent,
} from '@/app/components/ui/tooltip/tooltip.component'
import {
  UiDropdownMenuComponent,
  UiDropdownMenuContentComponent,
  UiDropdownMenuItemComponent,
  UiDropdownMenuSeparatorComponent,
  UiDropdownMenuTriggerComponent,
} from '@/app/components/ui/dropdown-menu/dropdown-menu.component'
import {
  UiSelectComponent,
  UiSelectContentComponent,
  UiSelectItemComponent,
  UiSelectTriggerComponent,
  UiSelectValueComponent,
} from '@/app/components/ui/select/select.component'
import { UiToggleComponent } from '@/app/components/ui/toggle/toggle.component'
import {
  UiToggleGroupComponent,
  UiToggleGroupItemComponent,
} from '@/app/components/ui/toggle-group/toggle-group.component'
import {
  UiRadioGroupComponent,
  UiRadioGroupItemComponent,
} from '@/app/components/ui/radio-group/radio-group.component'
import {
  UiPinInputComponent,
  UiPinInputGroupComponent,
  UiPinInputSeparatorComponent,
  UiPinInputSlotComponent,
} from '@/app/components/ui/pin-input/pin-input.component'
import { UiKpiGridComponent } from '@/app/components/ui/kpi-grid/kpi-grid.component'
import { UiStatTileComponent } from '@/app/components/blocks/stat-tile/stat-tile.component'
import { UiDataListComponent, UiDataListItemComponent } from '@/app/components/ui/data-list/data-list.component'
import { UiSectionCardComponent } from '@/app/components/ui/section-card/section-card.component'
import { UiIconBoxComponent } from '@/app/components/ui/icon-box/icon-box.component'
import {
  UiCommandComponent,
  UiCommandEmptyComponent,
  UiCommandGroupComponent,
  UiCommandInputComponent,
  UiCommandItemComponent,
  UiCommandListComponent,
} from '@/app/components/ui/command/command.component'
import { UiThemeSwitchComponent } from '@/app/components/ui/theme-switch/theme-switch.component'
import { UiOverlayScrollComponent } from '@/app/components/ui/overlay-scroll/overlay-scroll.component'

const KPI_ITEMS = [
  { label: 'Total Revenue', value: '$84,230', change: '+12.5%' },
  { label: 'Active Users', value: '2,420', change: '+8.2%' },
  { label: 'Conversion Rate', value: '3.24%', change: '-0.4%' },
  { label: 'Avg. Order Value', value: '$64.50', change: '+2.1%' },
]

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-ui-kit',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    RouterLink,
    UiAccordionComponent,
    UiAccordionContentComponent,
    UiAccordionItemComponent,
    UiAccordionTriggerComponent,
    UiAvatarComponent,
    UiAvatarFallbackComponent,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
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
    UiIconBoxComponent,
    UiInputComponent,
    UiKpiGridComponent,
    UiStatTileComponent,
    UiLabelComponent,
    UiOverlayScrollComponent,
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
    UiSheetHeaderComponent,
    UiSheetTitleComponent,
    UiSheetTriggerComponent,
    UiSkeletonComponent,
    UiSliderComponent,
    UiSwitchComponent,
    UiTextareaComponent,
    UiThemeSwitchComponent,
    UiToggleComponent,
    UiToggleGroupComponent,
    UiToggleGroupItemComponent,
    UiTooltipComponent,
    UiTooltipContentComponent,
    UiTooltipProviderComponent,
    UiTooltipTriggerComponent,
    UiBreadcrumbComponent,
    UiBreadcrumbItemComponent,
    UiBreadcrumbLinkComponent,
    UiBreadcrumbListComponent,
    UiBreadcrumbPageComponent,
    UiBreadcrumbSeparatorComponent,
  ],
  template: `
    <div class="space-y-4">
      <header class="space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight">UI Kit</h1>
        <p class="text-muted-foreground text-sm">Every primitive demonstrated in realistic contexts.</p>
      </header>

      <div ui-card>
        <div ui-card-header>
          <h3 ui-card-title class="text-base">Breadcrumb</h3>
          <p ui-card-description>Navigation hierarchy with links and current page.</p>
        </div>
        <div ui-card-content>
          <ui-breadcrumb>
            <ui-breadcrumb-list>
              <ui-breadcrumb-item>
                <a ui-breadcrumb-link [routerLink]="'/dashboard'">
                  <lucide-icon [img]="House" class="size-3.5" />
                </a>
              </ui-breadcrumb-item>
              <ui-breadcrumb-separator />
              <ui-breadcrumb-item>
                <a ui-breadcrumb-link [routerLink]="'/settings'">Settings</a>
              </ui-breadcrumb-item>
              <ui-breadcrumb-separator />
              <ui-breadcrumb-item><ui-breadcrumb-page>UI Kit</ui-breadcrumb-page></ui-breadcrumb-item>
            </ui-breadcrumb-list>
          </ui-breadcrumb>
        </div>
      </div>

      <div ui-card>
        <div ui-card-header>
          <h3 ui-card-title class="text-base">KpiGrid</h3>
          <p ui-card-description>Metric tiles with trend indicators.</p>
        </div>
        <div ui-card-content>
          <ui-kpi-grid>
            @for (kpi of kpiItems; track kpi.label) {
              <!-- All four metrics are up-is-good, so the sign picks the tone. -->
              <ui-stat-tile
                [label]="kpi.label"
                [value]="kpi.value"
                [delta]="kpi.change"
                [deltaTone]="kpi.change.startsWith('-') ? 'negative' : 'positive'"
              />
            }
          </ui-kpi-grid>
        </div>
      </div>

      <div ui-card>
        <div ui-card-header>
          <h3 ui-card-title class="text-base">Command</h3>
          <p ui-card-description>Keyboard-driven command palette for search and actions.</p>
        </div>
        <div ui-card-content>
          <ui-command class="rounded-lg border shadow-sm">
            <ui-command-input placeholder="Type a command or search..." />
            <ui-command-list>
              <ui-command-empty>No results found.</ui-command-empty>
              <ui-command-group heading="Suggestions">
                <ui-command-item value="calendar">
                  <lucide-icon [img]="Hash" class="mr-2 size-4" />Calendar
                </ui-command-item>
                <ui-command-item value="search">
                  <lucide-icon [img]="Search" class="mr-2 size-4" />Search Emoji
                </ui-command-item>
                <ui-command-item value="calculator">
                  <lucide-icon [img]="CreditCard" class="mr-2 size-4" />Calculator
                </ui-command-item>
              </ui-command-group>
              <ui-command-group heading="Settings">
                <ui-command-item value="profile">
                  <lucide-icon [img]="User" class="mr-2 size-4" />Profile
                </ui-command-item>
                <ui-command-item value="billing">
                  <lucide-icon [img]="CreditCard" class="mr-2 size-4" />Billing
                </ui-command-item>
                <ui-command-item value="settings">
                  <lucide-icon [img]="Settings" class="mr-2 size-4" />Settings
                </ui-command-item>
              </ui-command-group>
            </ui-command-list>
          </ui-command>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div ui-card>
          <div ui-card-header>
            <h3 ui-card-title class="text-base">Dialog</h3>
            <p ui-card-description>Modal overlay for critical actions.</p>
          </div>
          <div ui-card-content>
            <ui-dialog [open]="dialogOpen()" (openChange)="dialogOpen.set($event)">
              <button ui-button ui-dialog-trigger variant="outline" size="sm">Open dialog</button>
              <ui-dialog-content>
                <ui-dialog-header>
                  <ui-dialog-title>Confirm action</ui-dialog-title>
                  <ui-dialog-description>
                    This will permanently delete the selected item. This action cannot be undone.
                  </ui-dialog-description>
                </ui-dialog-header>
                <ui-dialog-footer>
                  <button ui-button variant="outline" size="sm" (click)="dialogOpen.set(false)">Cancel</button>
                  <button ui-button variant="destructive" size="sm" (click)="dialogOpen.set(false)">Delete</button>
                </ui-dialog-footer>
              </ui-dialog-content>
            </ui-dialog>
          </div>
        </div>

        <div ui-card>
          <div ui-card-header>
            <h3 ui-card-title class="text-base">Sheet</h3>
            <p ui-card-description>Slide-in panel for detail views.</p>
          </div>
          <div ui-card-content>
            <ui-sheet [open]="sheetOpen()" (openChange)="sheetOpen.set($event)">
              <button ui-button ui-sheet-trigger variant="outline" size="sm">Open sheet</button>
              <ui-sheet-content>
                <ui-sheet-header>
                  <ui-sheet-title>Details</ui-sheet-title>
                  <ui-sheet-description>View and edit item details.</ui-sheet-description>
                </ui-sheet-header>
                <div class="space-y-3 py-4">
                  <div class="space-y-1">
                    <ui-label>Name</ui-label>
                    <ui-input value="Acme Inc" />
                  </div>
                  <div class="space-y-1">
                    <ui-label>Email</ui-label>
                    <ui-input value="hello@acme.com" />
                  </div>
                </div>
                <button ui-button size="sm" class="w-full" (click)="sheetOpen.set(false)">Save</button>
              </ui-sheet-content>
            </ui-sheet>
          </div>
        </div>

        <div ui-card>
          <div ui-card-header>
            <h3 ui-card-title class="text-base">Popover + Tooltip</h3>
            <p ui-card-description>Contextual menus and hover hints.</p>
          </div>
          <div ui-card-content class="flex items-center gap-2">
            <ui-popover>
              <button ui-button ui-popover-trigger variant="outline" size="sm">Popover</button>
              <ui-popover-content class="w-56">
                <p class="text-sm font-medium">Quick actions</p>
                <p class="text-muted-foreground text-xs mt-1">Choose an action for this item.</p>
                <ui-separator class="my-2" />
                <div class="space-y-1">
                  <button class="flex w-full items-center gap-2 rounded px-2 py-1 text-xs hover:bg-accent">
                    <lucide-icon [img]="Copy" class="size-3" />Copy
                  </button>
                  <button
                    class="flex w-full items-center gap-2 rounded px-2 py-1 text-xs hover:bg-accent text-destructive"
                  >
                    <lucide-icon [img]="X" class="size-3" />Remove
                  </button>
                </div>
              </ui-popover-content>
            </ui-popover>

            <ui-tooltip-provider>
              <ui-tooltip>
                <button ui-button ui-tooltip-trigger variant="ghost" size="icon" class="size-8">
                  <lucide-icon [img]="CircleAlert" class="size-4" />
                </button>
                <ui-tooltip-content><p>More information about this feature</p></ui-tooltip-content>
              </ui-tooltip>
            </ui-tooltip-provider>

            <ui-dropdown-menu>
              <button ui-button ui-dropdown-menu-trigger variant="outline" size="sm">Menu</button>
              <ui-dropdown-menu-content>
                <ui-dropdown-menu-item>View</ui-dropdown-menu-item>
                <ui-dropdown-menu-item>Edit</ui-dropdown-menu-item>
                <ui-dropdown-menu-separator />
                <ui-dropdown-menu-item class="text-destructive">Delete</ui-dropdown-menu-item>
              </ui-dropdown-menu-content>
            </ui-dropdown-menu>
          </div>
        </div>
      </div>

      <div ui-card>
        <div ui-card-header>
          <h3 ui-card-title class="text-base">Form controls</h3>
          <p ui-card-description>Inputs, selects, toggles, and validation states.</p>
        </div>
        <div ui-card-content class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div class="space-y-2">
            <ui-label>Text input</ui-label>
            <ui-input placeholder="name@example.com" />
          </div>
          <div class="space-y-2">
            <ui-label>Password</ui-label>
            <ui-input type="password" value="secret123" />
          </div>
          <div class="space-y-2">
            <ui-label>Select</ui-label>
            <ui-select defaultValue="pro">
              <ui-select-trigger><ui-select-value /></ui-select-trigger>
              <ui-select-content>
                <ui-select-item value="free">Free</ui-select-item>
                <ui-select-item value="pro">Pro</ui-select-item>
                <ui-select-item value="enterprise">Enterprise</ui-select-item>
              </ui-select-content>
            </ui-select>
          </div>
          <div class="space-y-2">
            <ui-label>Textarea</ui-label>
            <ui-textarea placeholder="Enter your message..." rows="3" />
          </div>
          <div class="space-y-2">
            <ui-label for="ui-kit-slider">Slider ({{ sliderValue()[0] }}%)</ui-label>
            <ui-slider
              id="ui-kit-slider"
              [value]="sliderValue()"
              (valueChange)="sliderValue.set($event)"
              [min]="0"
              [max]="100"
              [step]="1"
              aria-label="Demo slider"
            />
          </div>
          <div class="space-y-2">
            <ui-label>Pin Input</ui-label>
            <ui-pin-input [value]="otpValue()" (valueChange)="otpValue.set($event)" class="flex gap-2">
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
          <div class="space-y-2">
            <ui-label>Checkbox</ui-label>
            <div class="flex items-center gap-2">
              <ui-checkbox id="terms" />
              <ui-label for="terms" class="text-sm font-normal">Accept terms</ui-label>
            </div>
            <div class="flex items-center gap-2">
              <ui-checkbox id="news" [defaultChecked]="true" />
              <ui-label for="news" class="text-sm font-normal">Newsletter</ui-label>
            </div>
          </div>
          <div class="space-y-2">
            <ui-label>Switch</ui-label>
            <div class="flex items-center justify-between">
              <ui-label for="ui-kit-switch-notifications" class="text-sm font-normal">Notifications</ui-label>
              <ui-switch id="ui-kit-switch-notifications" [defaultChecked]="true" />
            </div>
            <div class="flex items-center justify-between">
              <ui-label for="ui-kit-switch-dark-mode" class="text-sm font-normal">Dark mode</ui-label>
              <ui-switch id="ui-kit-switch-dark-mode" />
            </div>
          </div>
          <div class="space-y-2">
            <ui-label>Radio group</ui-label>
            <ui-radio-group defaultValue="comfortable">
              <div class="flex items-center gap-2">
                <ui-radio-group-item value="compact" />
                <ui-label class="text-sm font-normal">Compact</ui-label>
              </div>
              <div class="flex items-center gap-2">
                <ui-radio-group-item value="comfortable" />
                <ui-label class="text-sm font-normal">Comfortable</ui-label>
              </div>
              <div class="flex items-center gap-2">
                <ui-radio-group-item value="spacious" />
                <ui-label class="text-sm font-normal">Spacious</ui-label>
              </div>
            </ui-radio-group>
          </div>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div ui-card>
          <div ui-card-header>
            <h3 ui-card-title class="text-base">Toggle</h3>
            <p ui-card-description>Binary state button.</p>
          </div>
          <div ui-card-content class="flex gap-2">
            <button ui-toggle><lucide-icon [img]="Bold" class="size-4" /></button>
            <button ui-toggle><lucide-icon [img]="Italic" class="size-4" /></button>
            <button ui-toggle><lucide-icon [img]="Underline" class="size-4" /></button>
          </div>
        </div>
        <div ui-card>
          <div ui-card-header>
            <h3 ui-card-title class="text-base">ToggleGroup</h3>
            <p ui-card-description>Exclusive or multiple selection.</p>
          </div>
          <div ui-card-content>
            <ui-toggle-group type="single" defaultValue="list">
              <ui-toggle-group-item value="list">
                <lucide-icon [img]="List" class="size-4" />
              </ui-toggle-group-item>
              <ui-toggle-group-item value="ordered">
                <lucide-icon [img]="ListOrdered" class="size-4" />
              </ui-toggle-group-item>
              <ui-toggle-group-item value="link">
                <lucide-icon [img]="LinkIcon" class="size-4" />
              </ui-toggle-group-item>
              <ui-toggle-group-item value="image">
                <lucide-icon [img]="ImageIcon" class="size-4" />
              </ui-toggle-group-item>
            </ui-toggle-group>
          </div>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div ui-card>
          <div ui-card-header>
            <h3 ui-card-title class="text-base">Progress</h3>
            <p ui-card-description>Visual completion indicator.</p>
          </div>
          <div ui-card-content class="space-y-4">
            <div class="space-y-1">
              <div class="flex justify-between text-xs">
                <span>Uploading</span><span>78%</span>
              </div>
              <ui-progress [value]="78" />
            </div>
            <div class="space-y-1">
              <div class="flex justify-between text-xs">
                <span>Processing</span><span>42%</span>
              </div>
              <ui-progress [value]="42" />
            </div>
            <div class="space-y-1">
              <div class="flex justify-between text-xs">
                <span>Complete</span><span>100%</span>
              </div>
              <ui-progress [value]="100" />
            </div>
          </div>
        </div>

        <div ui-card>
          <div ui-card-header>
            <h3 ui-card-title class="text-base">Skeleton</h3>
            <p ui-card-description>Loading placeholder shimmer.</p>
          </div>
          <div ui-card-content class="space-y-3">
            @if (loadingDemo()) {
              <div class="flex items-center gap-3">
                <ui-skeleton class="size-10 rounded-full" />
                <div class="space-y-1">
                  <ui-skeleton class="h-2 w-24" />
                  <ui-skeleton class="h-2 w-32" />
                </div>
              </div>
              <ui-skeleton class="h-20 w-full" />
              <ui-skeleton class="h-2 w-full" />
              <ui-skeleton class="h-2 w-3/4" />
            } @else {
              <div class="text-sm text-muted-foreground">
                <div class="flex items-center gap-3 mb-3">
                  <ui-avatar class="size-10">
                    <ui-avatar-fallback>JD</ui-avatar-fallback>
                  </ui-avatar>
                  <div>
                    <p class="font-medium">John Doe</p>
                    <p class="text-xs">john&#64;example.com</p>
                  </div>
                </div>
                <p>Content loaded successfully.</p>
              </div>
            }
          </div>
        </div>

        <div ui-card>
          <div ui-card-header>
            <h3 ui-card-title class="text-base">ThemeSwitch</h3>
            <p ui-card-description>Light / dark / system toggle.</p>
          </div>
          <div ui-card-content class="space-y-3">
            <ui-theme-switch modelValue="light" variant="cards" />
            <ui-theme-switch modelValue="dark" variant="icons" />
            <ui-theme-switch modelValue="system" variant="pill" />
          </div>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div ui-card>
          <div ui-card-header>
            <h3 ui-card-title class="text-base">Accordion</h3>
            <p ui-card-description>Collapsible content sections.</p>
          </div>
          <div ui-card-content>
            <ui-accordion type="single" [collapsible]="true">
              <ui-accordion-item value="item-1">
                <ui-accordion-trigger>Is it accessible?</ui-accordion-trigger>
                <ui-accordion-content>Yes. It adheres to the WAI-ARIA design pattern for accordions.</ui-accordion-content>
              </ui-accordion-item>
              <ui-accordion-item value="item-2">
                <ui-accordion-trigger>Can I customize styles?</ui-accordion-trigger>
                <ui-accordion-content>
                  Absolutely. All components are built with Tailwind and expose class props.
                </ui-accordion-content>
              </ui-accordion-item>
              <ui-accordion-item value="item-3">
                <ui-accordion-trigger>Is it SSR-friendly?</ui-accordion-trigger>
                <ui-accordion-content>Yes. Components work with Angular SSR and hydration.</ui-accordion-content>
              </ui-accordion-item>
            </ui-accordion>
          </div>
        </div>

        <div ui-card>
          <div ui-card-header>
            <h3 ui-card-title class="text-base">Collapsible</h3>
            <p ui-card-description>Show/hide content with animation.</p>
          </div>
          <div ui-card-content>
            <ui-collapsible>
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium">&#64;peduarte starred 3 repos</p>
                <button ui-button ui-collapsible-trigger variant="ghost" size="sm">Toggle</button>
              </div>
              <ui-collapsible-content class="space-y-2 mt-2">
                <div class="rounded-md border px-3 py-2 text-xs font-mono">&#64;radix-ui/primitives</div>
                <div class="rounded-md border px-3 py-2 text-xs font-mono">&#64;radix-ui/colors</div>
                <div class="rounded-md border px-3 py-2 text-xs font-mono">&#64;radix-ui/react-slot</div>
              </ui-collapsible-content>
            </ui-collapsible>
          </div>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <ui-section-card title="Account details" description="Your workspace identity">
          <ui-data-list>
            <ui-data-list-item>
              <span class="text-sm text-muted-foreground">Status</span>
              <span ui-badge variant="secondary">Active</span>
            </ui-data-list-item>
            <ui-data-list-item>
              <span class="text-sm text-muted-foreground">Region</span>
              <span class="text-sm">us-east-1</span>
            </ui-data-list-item>
            <ui-data-list-item>
              <span class="text-sm text-muted-foreground">Plan</span>
              <span ui-badge>Pro</span>
            </ui-data-list-item>
            <ui-data-list-item>
              <span class="text-sm text-muted-foreground">Seats</span>
              <span class="text-sm">8 of 25</span>
            </ui-data-list-item>
          </ui-data-list>
        </ui-section-card>

        <div ui-card>
          <div ui-card-header>
            <h3 ui-card-title class="text-base">IconBox + OverlayScroll</h3>
            <p ui-card-description>Icon containers and custom scrollbars.</p>
          </div>
          <div ui-card-content class="space-y-3">
            <div class="flex gap-2">
              <ui-icon-box>
                <lucide-icon [img]="Mail" class="size-4" />
              </ui-icon-box>
              <ui-icon-box variant="muted">
                <lucide-icon [img]="Settings" class="size-4" />
              </ui-icon-box>
              <ui-icon-box variant="muted">
                <lucide-icon [img]="Palette" class="size-4" />
              </ui-icon-box>
              <ui-icon-box variant="custom">
                <lucide-icon [img]="ScanFace" class="size-4" />
              </ui-icon-box>
            </div>
            <ui-overlay-scroll class="h-24 rounded-md border p-2">
              @for (i of scrollLines; track i) {
                <p class="text-xs py-1">Scrollable content line {{ i }}</p>
              }
            </ui-overlay-scroll>
          </div>
        </div>
      </div>

      <div ui-card>
        <div ui-card-header>
          <h3 ui-card-title class="text-base">RichTextEditor</h3>
          <p ui-card-description>Tiptap-based editor with formatting toolbar.</p>
        </div>
        <div ui-card-content>
          <div class="rounded-md border border-dashed p-4 text-center">
            <p class="text-sm font-medium">Rich text editor — pending &#64;tiptap install</p>
            <p class="text-muted-foreground mt-1 text-xs">
              The registry's rich-text-editor needs &#64;tiptap/* packages. Install them and copy the component to
              enable this section.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardUiKitComponent {
  protected readonly Bold = Bold
  protected readonly CircleAlert = CircleAlert
  protected readonly Copy = Copy
  protected readonly CreditCard = CreditCard
  protected readonly Hash = Hash
  protected readonly House = House
  protected readonly ImageIcon = ImageIcon
  protected readonly Italic = Italic
  protected readonly LinkIcon = LinkIcon
  protected readonly List = List
  protected readonly ListOrdered = ListOrdered
  protected readonly Mail = Mail
  protected readonly Palette = Palette
  protected readonly ScanFace = ScanFace
  protected readonly Search = Search
  protected readonly Settings = Settings
  protected readonly Underline = Underline
  protected readonly User = User
  protected readonly X = X

  readonly kpiItems = KPI_ITEMS
  readonly scrollLines = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  readonly otpValue = signal('')
  readonly dialogOpen = signal(false)
  readonly sheetOpen = signal(false)
  readonly sliderValue = signal([65])
  readonly loadingDemo = signal(true)

  constructor(title: Title) {
    title.setTitle('UI Kit')
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      setTimeout(() => this.loadingDemo.set(false), 2000)
    }
  }
}
