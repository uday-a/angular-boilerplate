// Customers data table — search, faceted filters, sorting, pagination,
// selection, density, column visibility, CSV export, detail sheet. Ports
// nuxt-boilerplate's app/pages/dashboard/data-table.vue (signals replace
// refs; the interactive grid renders identically on server/client — loading
// starts true on both, flipping false post-hydration, so no ClientOnly gate
// is needed).
import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { TranslatePipe } from '@ngx-translate/core'
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ArrowUpRight,
  Building2,
  CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  CreditCard,
  Download,
  Funnel,
  LucideAngularModule,
  Mail,
  MapPin,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  UserPlus,
  Users,
  X,
  type LucideIconData,
} from 'lucide-angular'
import { UiAvatarComponent, UiAvatarFallbackComponent } from '@/app/components/ui/avatar/avatar.component'
import { UiBadgeComponent } from '@/app/components/ui/badge/badge.component'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import {
  UiPageBodyComponent,
  UiPageComponent,
  UiPageHeaderComponent,
  UiPageHeaderHeadingComponent,
} from '@/app/components/ui/page'
import { UiRangeCalendarComponent } from '@/app/components/ui/range-calendar/range-calendar.component'
import type { DateRange as CalRange, DayPickerSelected } from '@/app/components/ui/calendar/day-picker'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardHeaderComponent,
} from '@/app/components/ui/card/card.component'
import { UiCheckboxComponent, type CheckedState } from '@/app/components/ui/checkbox/checkbox.component'
import {
  UiDropdownMenuComponent,
  UiDropdownMenuContentComponent,
  UiDropdownMenuItemComponent,
  UiDropdownMenuSeparatorComponent,
  UiDropdownMenuTriggerComponent,
} from '@/app/components/ui/dropdown-menu/dropdown-menu.component'
import { UiInputComponent } from '@/app/components/ui/input/input.component'
import {
  UiPopoverComponent,
  UiPopoverContentComponent,
  UiPopoverTriggerComponent,
} from '@/app/components/ui/popover/popover.component'
import {
  UiSelectComponent,
  UiSelectContentComponent,
  UiSelectItemComponent,
  UiSelectTriggerComponent,
} from '@/app/components/ui/select/select.component'
import { UiSeparatorComponent } from '@/app/components/ui/separator/separator.component'
import {
  UiSheetComponent,
  UiSheetContentComponent,
  UiSheetDescriptionComponent,
  UiSheetFooterComponent,
  UiSheetHeaderComponent,
  UiSheetTitleComponent,
} from '@/app/components/ui/sheet/sheet.component'
import { UiSkeletonComponent } from '@/app/components/ui/skeleton/skeleton.component'
import {
  UiTableBodyComponent,
  UiTableCellComponent,
  UiTableComponent,
  UiTableEmptyComponent,
  UiTableHeadComponent,
  UiTableHeaderComponent,
  UiTableRowComponent,
} from '@/app/components/ui/table/table.component'
import {
  UiToggleGroupComponent,
  UiToggleGroupItemComponent,
} from '@/app/components/ui/toggle-group/toggle-group.component'
import {
  UiTooltipComponent,
  UiTooltipContentComponent,
  UiTooltipProviderComponent,
  UiTooltipTriggerComponent,
} from '@/app/components/ui/tooltip/tooltip.component'
import { toast } from '@/app/components/ui/sonner/sonner.component'
import { formatMoney, formatNumber } from '@/app/core/utils/cn'
import { I18nService, injectPageTitle } from '@/app/core/i18n'

type Status = 'active' | 'trial' | 'churned' | 'invited'
type Plan = 'Free' | 'Pro' | 'Team' | 'Enterprise'
type Density = 'compact' | 'comfortable'
type DateRange = 'all' | '7d' | '30d' | '90d' | 'custom'

interface Customer {
  id: string
  name: string
  email: string
  plan: Plan
  status: Status
  mrr: number
  seats: number
  country: string
  lastSeen: string
  createdAt: string
}

const CUSTOMERS: Customer[] = [
  { id: '1', name: 'Northwind Industries', email: 'ops@northwind.example', plan: 'Enterprise', status: 'active', mrr: 4800, seats: 220, country: 'US', lastSeen: '2026-09-28', createdAt: '2023-06-27' },
  { id: '2', name: 'Sentinel Labs', email: 'team@sentinel.example', plan: 'Enterprise', status: 'active', mrr: 3600, seats: 145, country: 'US', lastSeen: '2026-09-28', createdAt: '2023-08-16' },
  { id: '3', name: 'Apex Logistics', email: 'admin@apex.example', plan: 'Pro', status: 'trial', mrr: 0, seats: 12, country: 'CA', lastSeen: '2026-09-27', createdAt: '2026-09-14' },
  { id: '4', name: 'Olympus Robotics', email: 'finance@olympus.example', plan: 'Enterprise', status: 'active', mrr: 5200, seats: 310, country: 'DE', lastSeen: '2026-09-28', createdAt: '2023-04-04' },
  { id: '5', name: 'Crescent Health', email: 'it@crescent.example', plan: 'Pro', status: 'active', mrr: 1800, seats: 64, country: 'UK', lastSeen: '2026-09-28', createdAt: '2024-05-23' },
  { id: '6', name: 'Polaris Software', email: 'eng@polaris.example', plan: 'Pro', status: 'active', mrr: 980, seats: 38, country: 'US', lastSeen: '2026-09-26', createdAt: '2024-11-13' },
  { id: '7', name: 'Bluefin Studios', email: 'studio@bluefin.example', plan: 'Team', status: 'active', mrr: 720, seats: 22, country: 'AU', lastSeen: '2026-09-28', createdAt: '2025-06-30' },
  { id: '8', name: 'Mercury Holdings', email: 'ops@mercury.example', plan: 'Enterprise', status: 'churned', mrr: 0, seats: 0, country: 'US', lastSeen: '2026-08-05', createdAt: '2022-09-17' },
  { id: '9', name: 'Vertex Analytics', email: 'data@vertex.example', plan: 'Team', status: 'active', mrr: 1240, seats: 41, country: 'US', lastSeen: '2026-09-28', createdAt: '2025-01-26' },
  { id: '10', name: 'Magnolia Foods', email: 'sales@magnolia.example', plan: 'Free', status: 'invited', mrr: 0, seats: 0, country: 'FR', lastSeen: '2026-09-25', createdAt: '2026-09-22' },
  { id: '11', name: 'Driftwood Hotels', email: 'gm@driftwood.example', plan: 'Pro', status: 'active', mrr: 2100, seats: 78, country: 'ES', lastSeen: '2026-09-27', createdAt: '2024-08-04' },
  { id: '12', name: 'Cobalt Manufacturing', email: 'plant@cobalt.example', plan: 'Enterprise', status: 'active', mrr: 6800, seats: 420, country: 'DE', lastSeen: '2026-09-28', createdAt: '2022-02-15' },
  { id: '13', name: 'Skyline Couriers', email: 'fleet@skyline.example', plan: 'Pro', status: 'trial', mrr: 0, seats: 8, country: 'US', lastSeen: '2026-09-24', createdAt: '2026-09-11' },
  { id: '14', name: 'Harbor Insurance', email: 'risk@harbor.example', plan: 'Enterprise', status: 'churned', mrr: 0, seats: 0, country: 'UK', lastSeen: '2026-07-04', createdAt: '2022-05-31' },
  { id: '15', name: 'Iron Peak Mining', email: 'site@ironpeak.example', plan: 'Team', status: 'active', mrr: 1480, seats: 52, country: 'CA', lastSeen: '2026-09-28', createdAt: '2023-12-18' },
  { id: '16', name: 'Linden Education', email: 'admin@linden.example', plan: 'Pro', status: 'active', mrr: 920, seats: 31, country: 'NL', lastSeen: '2026-09-26', createdAt: '2025-03-25' },
  { id: '17', name: 'Quartz Media', email: 'news@quartz.example', plan: 'Team', status: 'active', mrr: 640, seats: 19, country: 'US', lastSeen: '2026-09-28', createdAt: '2025-09-05' },
  { id: '18', name: 'Aurelia Cosmetics', email: 'web@aurelia.example', plan: 'Pro', status: 'trial', mrr: 0, seats: 11, country: 'FR', lastSeen: '2026-09-22', createdAt: '2026-09-01' },
  { id: '19', name: 'Tundra Outdoors', email: 'shop@tundra.example', plan: 'Free', status: 'invited', mrr: 0, seats: 0, country: 'CA', lastSeen: '2026-09-23', createdAt: '2026-09-20' },
  { id: '20', name: 'Falcon Aviation', email: 'ops@falcon.example', plan: 'Enterprise', status: 'active', mrr: 8200, seats: 540, country: 'US', lastSeen: '2026-09-28', createdAt: '2021-11-01' },
  { id: '21', name: 'Larkspur Retail', email: 'pos@larkspur.example', plan: 'Pro', status: 'active', mrr: 1380, seats: 47, country: 'UK', lastSeen: '2026-09-27', createdAt: '2024-07-12' },
  { id: '22', name: 'Bronze Brewing', email: 'taproom@bronze.example', plan: 'Team', status: 'active', mrr: 540, seats: 16, country: 'US', lastSeen: '2026-09-28', createdAt: '2025-12-13' },
  { id: '23', name: 'Cinder Energy', email: 'grid@cinder.example', plan: 'Enterprise', status: 'churned', mrr: 0, seats: 0, country: 'AU', lastSeen: '2026-08-16', createdAt: '2023-01-25' },
  { id: '24', name: 'Marina Logistics', email: 'port@marina.example', plan: 'Pro', status: 'active', mrr: 1620, seats: 58, country: 'NL', lastSeen: '2026-09-28', createdAt: '2024-09-26' },
  { id: '25', name: 'Hazel Coffee', email: 'roast@hazel.example', plan: 'Free', status: 'invited', mrr: 0, seats: 0, country: 'US', lastSeen: '2026-09-21', createdAt: '2026-09-21' },
  { id: '26', name: 'Granite Capital', email: 'desk@granite.example', plan: 'Enterprise', status: 'active', mrr: 7400, seats: 380, country: 'UK', lastSeen: '2026-09-28', createdAt: '2022-08-09' },
  { id: '27', name: 'Hollow Bay Studios', email: 'art@hollowbay.example', plan: 'Team', status: 'trial', mrr: 0, seats: 9, country: 'CA', lastSeen: '2026-09-26', createdAt: '2026-09-18' },
  { id: '28', name: 'Pioneer Telecom', email: 'noc@pioneer.example', plan: 'Enterprise', status: 'active', mrr: 5400, seats: 290, country: 'US', lastSeen: '2026-09-28', createdAt: '2023-06-15' },
  { id: '29', name: 'Sable Property', email: 'leasing@sable.example', plan: 'Pro', status: 'active', mrr: 1160, seats: 35, country: 'AU', lastSeen: '2026-09-27', createdAt: '2024-12-29' },
  { id: '30', name: 'Ember Bakery', email: 'order@ember.example', plan: 'Free', status: 'invited', mrr: 0, seats: 0, country: 'US', lastSeen: '2026-09-17', createdAt: '2026-09-16' },
  { id: '31', name: 'Cascade Bikes', email: 'workshop@cascade.example', plan: 'Team', status: 'active', mrr: 780, seats: 24, country: 'US', lastSeen: '2026-09-28', createdAt: '2025-10-03' },
  { id: '32', name: 'Lighthouse Legal', email: 'firm@lighthouse.example', plan: 'Pro', status: 'churned', mrr: 0, seats: 0, country: 'UK', lastSeen: '2026-06-04', createdAt: '2023-11-21' },
  { id: '33', name: 'Briar Travel', email: 'desk@briar.example', plan: 'Team', status: 'trial', mrr: 0, seats: 14, country: 'FR', lastSeen: '2026-09-25', createdAt: '2026-09-13' },
  { id: '34', name: 'Pacific Outfit', email: 'hello@pacific.example', plan: 'Pro', status: 'active', mrr: 1380, seats: 49, country: 'US', lastSeen: '2026-09-28', createdAt: '2024-09-02' },
  { id: '35', name: 'Reverie Audio', email: 'mix@reverie.example', plan: 'Team', status: 'active', mrr: 920, seats: 28, country: 'DE', lastSeen: '2026-09-28', createdAt: '2025-05-28' },
  { id: '36', name: 'Tidewater Ferry', email: 'ops@tidewater.example', plan: 'Pro', status: 'active', mrr: 1540, seats: 51, country: 'CA', lastSeen: '2026-09-27', createdAt: '2024-10-18' },
  { id: '37', name: 'Glassline Optics', email: 'lab@glassline.example', plan: 'Enterprise', status: 'active', mrr: 3120, seats: 168, country: 'JP', lastSeen: '2026-09-28', createdAt: '2024-04-23' },
  { id: '38', name: 'Wildwood Press', email: 'editor@wildwood.example', plan: 'Pro', status: 'trial', mrr: 0, seats: 7, country: 'UK', lastSeen: '2026-09-23', createdAt: '2026-09-08' },
  { id: '39', name: 'Quill & Co', email: 'studio@quill.example', plan: 'Free', status: 'invited', mrr: 0, seats: 0, country: 'US', lastSeen: '2026-09-19', createdAt: '2026-09-18' },
  { id: '40', name: 'Aster Pharmaceuticals', email: 'rd@aster.example', plan: 'Enterprise', status: 'active', mrr: 9400, seats: 612, country: 'CH', lastSeen: '2026-09-28', createdAt: '2021-01-28' },
  { id: '41', name: 'Birchwood Co-op', email: 'admin@birchwood.example', plan: 'Team', status: 'churned', mrr: 0, seats: 0, country: 'CA', lastSeen: '2026-06-27', createdAt: '2023-09-12' },
  { id: '42', name: 'Sunpeak Solar', email: 'fleet@sunpeak.example', plan: 'Pro', status: 'active', mrr: 1280, seats: 42, country: 'ES', lastSeen: '2026-09-28', createdAt: '2025-03-02' },
  { id: '43', name: 'Halcyon Hospitality', email: 'concierge@halcyon.example', plan: 'Enterprise', status: 'active', mrr: 4200, seats: 240, country: 'US', lastSeen: '2026-09-28', createdAt: '2023-07-22' },
  { id: '44', name: 'Verdant Farms', email: 'mgmt@verdant.example', plan: 'Pro', status: 'active', mrr: 860, seats: 27, country: 'NL', lastSeen: '2026-09-27', createdAt: '2026-01-06' },
  { id: '45', name: 'Onyx Defense', email: 'gov@onyx.example', plan: 'Enterprise', status: 'active', mrr: 11200, seats: 880, country: 'US', lastSeen: '2026-09-28', createdAt: '2020-06-17' },
  { id: '46', name: 'Lumen Education', email: 'campus@lumen.example', plan: 'Team', status: 'trial', mrr: 0, seats: 18, country: 'UK', lastSeen: '2026-09-24', createdAt: '2026-09-05' },
  { id: '47', name: 'Saffron Spices', email: 'shop@saffron.example', plan: 'Free', status: 'invited', mrr: 0, seats: 0, country: 'IN', lastSeen: '2026-09-22', createdAt: '2026-09-22' },
  { id: '48', name: 'Beacon Cycling', email: 'team@beacon.example', plan: 'Pro', status: 'active', mrr: 1060, seats: 33, country: 'US', lastSeen: '2026-09-28', createdAt: '2025-04-16' },
]

const statusTone: Record<Status, string> = {
  active: 'border-success/20 bg-success/10 text-success',
  trial: 'border-info/20 bg-info/10 text-info',
  invited: 'border-warning/20 bg-warning/10 text-warning',
  churned: 'border-destructive/20 bg-destructive/10 text-destructive',
}

const statusDot: Record<Status, string> = {
  active: 'bg-success',
  trial: 'bg-info',
  invited: 'bg-warning',
  churned: 'bg-destructive',
}

interface ColumnDef {
  key: string
  label: string
  sortable: boolean
  defaultVisible: boolean
  alignRight?: boolean
}

const columnDefs = (t: (key: string) => string): ColumnDef[] => [
  { key: 'name', label: 'Customer', sortable: true, defaultVisible: true },
  { key: 'plan', label: 'Plan', sortable: true, defaultVisible: true },
  { key: 'status', label: 'Status', sortable: true, defaultVisible: true },
  // WHY (Rule62): measured headers carry their units so "$4,800" and "220"
  // never read as unitless.
  { key: 'mrr', label: t('dashboard.table.headers.mrr'), sortable: true, defaultVisible: true, alignRight: true },
  { key: 'seats', label: t('dashboard.table.headers.seats'), sortable: true, defaultVisible: true, alignRight: true },
  { key: 'country', label: 'Country', sortable: true, defaultVisible: false },
  { key: 'lastSeen', label: 'Last seen', sortable: true, defaultVisible: true },
  { key: 'createdAt', label: 'Created', sortable: true, defaultVisible: false },
]

const STATUSES: Status[] = ['active', 'trial', 'invited', 'churned']
const PLANS: Plan[] = ['Free', 'Pro', 'Team', 'Enterprise']

type SortKey = 'name' | 'plan' | 'status' | 'mrr' | 'seats' | 'country' | 'lastSeen' | 'createdAt'

const PLAN_CHIP_TONE: Record<Plan, string> = {
  Free: 'bg-muted text-muted-foreground',
  Pro: 'bg-chart-1/15 text-foreground',
  Team: 'bg-chart-2/15 text-foreground',
  Enterprise: 'bg-chart-3/15 text-foreground',
}

interface TimelineEvent {
  icon: LucideIconData
  title: string
  meta: string
  tone: string
}

// Hashed pick from the chart-N/15 set -- keeps each customer's avatar
// stable across renders without storing a seed in the row data.
const AVATAR_TONES = [
  'bg-chart-1/15 text-chart-1',
  'bg-chart-2/15 text-chart-2',
  'bg-chart-3/15 text-chart-3',
  'bg-chart-4/15 text-chart-4',
  'bg-chart-5/15 text-chart-5',
]

function toggleSetValue<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

function isoDay(d: Date | undefined): string | null {
  if (!d) return null
  // Local calendar day (not UTC) so a picked date never shifts by one.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-data-table',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    TranslatePipe,
    UiAvatarComponent,
    UiAvatarFallbackComponent,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardHeaderComponent,
    UiCheckboxComponent,
    UiDropdownMenuComponent,
    UiDropdownMenuContentComponent,
    UiDropdownMenuItemComponent,
    UiDropdownMenuSeparatorComponent,
    UiDropdownMenuTriggerComponent,
    UiInputComponent,
    UiPageBodyComponent,
    UiPageComponent,
    UiPageHeaderComponent,
    UiPageHeaderHeadingComponent,
    UiPopoverComponent,
    UiPopoverContentComponent,
    UiPopoverTriggerComponent,
    UiRangeCalendarComponent,
    UiSelectComponent,
    UiSelectContentComponent,
    UiSelectItemComponent,
    UiSelectTriggerComponent,
    UiSeparatorComponent,
    UiSheetComponent,
    UiSheetContentComponent,
    UiSheetDescriptionComponent,
    UiSheetFooterComponent,
    UiSheetHeaderComponent,
    UiSheetTitleComponent,
    UiSkeletonComponent,
    UiTableBodyComponent,
    UiTableCellComponent,
    UiTableComponent,
    UiTableEmptyComponent,
    UiTableHeadComponent,
    UiTableHeaderComponent,
    UiTableRowComponent,
    UiToggleGroupComponent,
    UiToggleGroupItemComponent,
    UiTooltipComponent,
    UiTooltipContentComponent,
    UiTooltipProviderComponent,
    UiTooltipTriggerComponent,
  ],
  template: `
    <ui-page>
      <ui-page-header>
        <ui-page-header-heading
          [title]="pageTitle()"
          [description]="totalCount + ' accounts · ' + sorted().length + ' after filters · ' + selected().size + ' selected'"
        />
        <div slot="actions" class="flex items-center gap-2">
          <button ui-button variant="outline" size="sm" (click)="exportCsv()">
            <lucide-icon [img]="Download" class="size-4" aria-hidden="true" />Export CSV
          </button>
          <button ui-button size="sm">
            <lucide-icon [img]="Plus" class="size-4" aria-hidden="true" />Add customer
          </button>
        </div>
      </ui-page-header>

      <ui-page-body>
        <div ui-card class="overflow-hidden">
          <div ui-card-header class="flex flex-col gap-3 space-y-0 border-b px-4">
            <div class="flex flex-wrap items-center gap-2">
              <div class="relative min-w-0 flex-1 md:max-w-xs md:min-w-48">
                <lucide-icon
                  [img]="Search"
                  class="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
                  aria-hidden="true"
                />
                <ui-input
                  [ngModel]="search()"
                  (ngModelChange)="onSearch($event)"
                  placeholder="Search name, email, country…"
                  aria-label="Search customers"
                  class="h-8 pl-7 text-sm"
                />
              </div>

              <!-- Below md the secondary filters live in one "Filters" sheet. -->
              <button
                ui-button
                variant="outline"
                size="sm"
                class="h-8 gap-1.5 text-xs md:hidden"
                (click)="filtersOpen.set(true)"
              >
                <lucide-icon [img]="SlidersHorizontal" class="size-3.5" aria-hidden="true" />Filters
                @if (mobileFilterCount()) {
                  <span ui-badge variant="secondary" class="ml-1 h-4 px-1.5 text-xs tabular-nums">
                    {{ mobileFilterCount() }}
                  </span>
                }
              </button>

              <div class="hidden md:contents">
                <ui-popover>
                  <button ui-button ui-popover-trigger variant="outline" size="sm" class="h-8 gap-1.5 text-xs">
                    <lucide-icon [img]="Funnel" class="size-3.5" />Status
                    @if (statusFilter().size) {
                      <span ui-badge variant="secondary" class="ml-1 h-4 px-1.5 text-xs">{{ statusFilter().size }}</span>
                    }
                  </button>
                  <ui-popover-content align="start" class="w-48 p-1">
                    @for (s of statuses; track s) {
                      <button
                        class="hover:bg-accent focus-visible:ring-ring flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs capitalize focus-visible:ring-2 focus-visible:outline-none"
                        (click)="toggleStatus(s)"
                      >
                        <span class="flex items-center gap-2">
                          <span [class]="'size-2 rounded-full ' + statusDot[s]"></span>
                          {{ s }}
                        </span>
                        @if (statusFilter().has(s)) {
                          <lucide-icon [img]="Check" class="text-muted-foreground size-3" />
                        }
                      </button>
                    }
                    <ui-separator class="my-1" />
                    <button
                      class="text-muted-foreground hover:bg-accent focus-visible:ring-ring w-full rounded px-2 py-1.5 text-left text-xs focus-visible:ring-2 focus-visible:outline-none"
                      (click)="clearStatusFilter()"
                    >
                      Clear
                    </button>
                  </ui-popover-content>
                </ui-popover>

                <ui-popover>
                  <button ui-button ui-popover-trigger variant="outline" size="sm" class="h-8 gap-1.5 text-xs">
                    <lucide-icon [img]="Funnel" class="size-3.5" />Plan
                    @if (planFilter().size) {
                      <span ui-badge variant="secondary" class="ml-1 h-4 px-1.5 text-xs">{{ planFilter().size }}</span>
                    }
                  </button>
                  <ui-popover-content align="start" class="w-44 p-1">
                    @for (p of plans; track p) {
                      <button
                        class="hover:bg-accent focus-visible:ring-ring flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs focus-visible:ring-2 focus-visible:outline-none"
                        (click)="togglePlan(p)"
                      >
                        {{ p }}
                        @if (planFilter().has(p)) {
                          <lucide-icon [img]="Check" class="text-muted-foreground size-3" />
                        }
                      </button>
                    }
                    <ui-separator class="my-1" />
                    <button
                      class="text-muted-foreground hover:bg-accent focus-visible:ring-ring w-full rounded px-2 py-1.5 text-left text-xs focus-visible:ring-2 focus-visible:outline-none"
                      (click)="clearPlanFilter()"
                    >
                      Clear
                    </button>
                  </ui-popover-content>
                </ui-popover>

                <ui-select [value]="dateRange()" (valueChange)="onDateRange($event)">
                  <button ui-select-trigger size="sm" class="h-8 w-[140px] text-xs">
                    <span class="truncate">{{ dateRangeLabel()[dateRange()] }}</span>
                  </button>
                  <ui-select-content>
                    <ui-select-item value="all">All time</ui-select-item>
                    <ui-select-item value="7d">Last 7 days</ui-select-item>
                    <ui-select-item value="30d">Last 30 days</ui-select-item>
                    <ui-select-item value="90d">Last 90 days</ui-select-item>
                    <ui-select-item value="custom">{{ 'dashboard.range.custom' | translate }}</ui-select-item>
                  </ui-select-content>
                </ui-select>

                @if (dateRange() === 'custom') {
                  <ui-popover [open]="customOpen()" (openChange)="customOpen.set($event)">
                    <button ui-button ui-popover-trigger variant="outline" size="sm" class="h-8 gap-1.5 text-xs">
                      <lucide-icon [img]="CalendarIcon" class="size-3.5" />{{
                        customSpan() ?? ('dashboard.range.pickCustom' | translate)
                      }}
                    </button>
                    <ui-popover-content align="start" class="w-auto p-0">
                      <ui-range-calendar [selected]="customCal()" (select)="onCustomSelect($any($event))" />
                    </ui-popover-content>
                  </ui-popover>
                }

                @if (activeFilterCount() > 0) {
                  <button
                    ui-button
                    variant="ghost"
                    size="sm"
                    class="text-muted-foreground h-8 gap-1.5 text-xs"
                    (click)="resetFilters()"
                  >
                    <lucide-icon [img]="RotateCcw" class="size-3" />Reset
                  </button>
                }

                <div class="ml-auto flex items-center gap-2">
                  <ui-toggle-group
                    type="single"
                    size="sm"
                    variant="outline"
                    class="h-8"
                    [value]="density()"
                    (valueChange)="density.set($any($event))"
                  >
                    <ui-toggle-group-item value="compact" class="h-8 px-2 text-xs">Compact</ui-toggle-group-item>
                    <ui-toggle-group-item value="comfortable" class="h-8 px-2 text-xs">Cozy</ui-toggle-group-item>
                  </ui-toggle-group>

                  <ui-popover>
                    <button ui-button ui-popover-trigger variant="outline" size="sm" class="h-8 gap-1.5 text-xs">
                      <lucide-icon [img]="Columns3" class="size-3.5" />Columns
                    </button>
                    <ui-popover-content align="end" class="w-44 p-1">
                      @for (c of columns(); track c.key) {
                        <button
                          class="hover:bg-accent flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs"
                          (click)="toggleColumn(c.key)"
                        >
                          {{ c.label }}
                          @if (isVisible(c.key)) {
                            <lucide-icon [img]="Check" class="text-muted-foreground size-3" />
                          }
                        </button>
                      }
                    </ui-popover-content>
                  </ui-popover>
                </div>
              </div>
            </div>

            <!-- WHY (Rule70): active filters read as removable chips carrying
                 their VALUES (Status: active), not just counts -- the current
                 slice stays visible and each chip clears itself. -->
            @if (statusFilter().size || planFilter().size || search().trim()) {
              <div class="flex flex-wrap items-center gap-1.5">
                @for (s of statusFilter(); track s) {
                  <span ui-badge variant="secondary" class="gap-1 py-0.5 pr-1 text-xs capitalize">
                    {{ 'dashboard.table.chips.status' | translate }}: {{ s }}
                    <button
                      type="button"
                      class="hover:text-foreground focus-visible:ring-ring inline-flex items-center rounded-full p-0.5 focus-visible:ring-2 focus-visible:outline-none"
                      [attr.aria-label]="'dashboard.table.chips.clear' | translate: { label: ('dashboard.table.chips.status' | translate) + ': ' + s }"
                      (click)="toggleStatus(s)"
                    >
                      <lucide-icon [img]="X" class="size-3" aria-hidden="true" />
                    </button>
                  </span>
                }
                @for (p of planFilter(); track p) {
                  <span ui-badge variant="secondary" class="gap-1 py-0.5 pr-1 text-xs">
                    {{ 'dashboard.table.chips.plan' | translate }}: {{ p }}
                    <button
                      type="button"
                      class="hover:text-foreground focus-visible:ring-ring inline-flex items-center rounded-full p-0.5 focus-visible:ring-2 focus-visible:outline-none"
                      [attr.aria-label]="'dashboard.table.chips.clear' | translate: { label: ('dashboard.table.chips.plan' | translate) + ': ' + p }"
                      (click)="togglePlan(p)"
                    >
                      <lucide-icon [img]="X" class="size-3" aria-hidden="true" />
                    </button>
                  </span>
                }
                @if (search().trim()) {
                  <span ui-badge variant="secondary" class="max-w-56 gap-1 py-0.5 pr-1 text-xs">
                    <span class="truncate">{{ 'dashboard.table.chips.search' | translate }}: "{{ search().trim() }}"</span>
                    <button
                      type="button"
                      class="hover:text-foreground focus-visible:ring-ring inline-flex shrink-0 items-center rounded-full p-0.5 focus-visible:ring-2 focus-visible:outline-none"
                      [attr.aria-label]="'dashboard.table.chips.clear' | translate: { label: ('dashboard.table.chips.search' | translate) }"
                      (click)="onSearch('')"
                    >
                      <lucide-icon [img]="X" class="size-3" aria-hidden="true" />
                    </button>
                  </span>
                }
              </div>
            }

            @if (selected().size > 0) {
              <div class="bg-muted/40 -mx-4 -mb-3 flex flex-wrap items-center gap-2 border-t px-4 py-2 text-xs">
                <span class="font-medium">{{ selected().size }} selected</span>
                @if (allOnPageChecked() && !allFilteredChecked() && sorted().length > pageSize()) {
                  <button class="text-primary underline-offset-2 hover:underline" (click)="selectAllFiltered()">
                    Select all {{ sorted().length }} matching
                  </button>
                }
                <div class="ml-auto flex items-center gap-2">
                  <!-- WHY (Rule73): bulk-bar actions sit on the h-8 filter-bar
                       system, not h-7. -->
                  <button ui-button variant="outline" size="sm" class="h-8 text-xs">Email</button>
                  <button ui-button variant="outline" size="sm" class="h-8 text-xs">Change plan</button>
                  <button ui-button variant="outline" size="sm" class="text-destructive h-8 text-xs">Archive</button>
                  <button ui-button variant="ghost" size="sm" class="h-8 text-xs" (click)="clearSelection()">Clear</button>
                </div>
              </div>
            }
          </div>

          <div ui-card-content class="p-0">
            <div class="max-h-[70vh] overflow-auto">
              <ui-table>
                <!-- WHY (Rule28/35): the hairline is the component's border-b,
                     not a shadow utility -- elevation never draws dividers. -->
                <thead ui-table-header class="bg-background sticky top-0 z-10 border-b">
                  <tr ui-table-row>
                    <th ui-table-head class="w-10 pl-4">
                      <ui-checkbox [checked]="headerChecked()" (checkedChange)="togglePage($event === true)" />
                    </th>
                    @for (c of columns(); track c.key) {
                      @if (isVisible(c.key)) {
                        <th
                          ui-table-head
                          scope="col"
                          [attr.aria-sort]="c.sortable ? ariaSort(c.key) : null"
                          [class]="c.alignRight ? 'text-right' : ''"
                        >
                          @if (c.sortable) {
                            <button
                              [class]="
                                'hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1 rounded-sm font-medium focus-visible:ring-2 focus-visible:outline-none ' +
                                (c.alignRight ? 'ml-auto' : '')
                              "
                              (click)="toggleSort(c.key, c.sortable)"
                            >
                              {{ c.label }}<lucide-icon [img]="sortIcon(c.key)" class="size-3" />
                            </button>
                          } @else {
                            <span>{{ c.label }}</span>
                          }
                        </th>
                      }
                    }
                    <th ui-table-head class="w-10"></th>
                  </tr>
                </thead>

                @if (loading()) {
                  <tbody ui-table-body>
                    @for (i of skeletonRows(); track i) {
                      <tr ui-table-row>
                        <td ui-table-cell [class]="'pl-4 ' + cellPad()">
                          <ui-skeleton class="size-4 rounded" />
                        </td>
                        @for (c of visibleColumns(); track c.key) {
                          <td ui-table-cell [class]="cellPad()">
                            <ui-skeleton [class]="'h-3 ' + (c.key === 'name' ? 'w-40' : 'w-16')" />
                          </td>
                        }
                        <td ui-table-cell [class]="cellPad()">
                          <ui-skeleton class="size-4 rounded" />
                        </td>
                      </tr>
                    }
                  </tbody>
                } @else {
                  <tbody ui-table-body>
                    @for (c of paged(); track c.id) {
                      <tr
                        ui-table-row
                        [attr.data-state]="selected().has(c.id) ? 'selected' : null"
                        class="hover:bg-muted/40 cursor-pointer"
                        (click)="openDetail(c)"
                      >
                        <td ui-table-cell [class]="'pl-4 ' + cellPad()" (click)="$event.stopPropagation()">
                          <ui-checkbox [checked]="selected().has(c.id)" (checkedChange)="toggleRow(c.id, $event === true)" />
                        </td>
                        @if (isVisible('name')) {
                          <td ui-table-cell [class]="cellPad()">
                            <div class="font-medium">{{ c.name }}</div>
                            <div class="text-muted-foreground text-xs">{{ c.email }}</div>
                          </td>
                        }
                        @if (isVisible('plan')) {
                          <td ui-table-cell [class]="'text-muted-foreground ' + cellPad()">{{ c.plan }}</td>
                        }
                        @if (isVisible('status')) {
                          <td ui-table-cell [class]="cellPad()">
                            <span ui-badge variant="outline" [class]="'gap-1 px-2 text-xs font-medium capitalize ' + statusTone[c.status]">
                              {{ c.status }}
                            </span>
                          </td>
                        }
                        @if (isVisible('mrr')) {
                          <td ui-table-cell [class]="'text-right tabular-nums ' + cellPad() + (c.mrr === 0 ? ' text-muted-foreground' : '')">
                            {{ formatMoney(c.mrr) }}
                          </td>
                        }
                        @if (isVisible('seats')) {
                          <td ui-table-cell [class]="'text-muted-foreground text-right tabular-nums ' + cellPad()">
                            {{ formatNumber(c.seats) }}
                          </td>
                        }
                        @if (isVisible('country')) {
                          <td ui-table-cell [class]="'text-muted-foreground ' + cellPad()">{{ c.country }}</td>
                        }
                        @if (isVisible('lastSeen')) {
                          <td ui-table-cell [class]="'text-muted-foreground text-xs tabular-nums ' + cellPad()">{{ c.lastSeen }}</td>
                        }
                        @if (isVisible('createdAt')) {
                          <td ui-table-cell [class]="'text-muted-foreground text-xs tabular-nums ' + cellPad()">{{ c.createdAt }}</td>
                        }
                        <td ui-table-cell [class]="cellPad()" (click)="$event.stopPropagation()">
                          <ui-dropdown-menu>
                            <ui-tooltip-provider>
                              <ui-tooltip>
                                <!-- WHY (Rule76/87): row actions are a 32px
                                     trigger with both an accessible name and
                                     a tooltip -- icon-only never goes naked. -->
                                <button
                                  ui-button
                                  ui-tooltip-trigger
                                  ui-dropdown-menu-trigger
                                  variant="ghost"
                                  size="icon"
                                  class="size-8"
                                  [attr.aria-label]="('dashboard.table.rowActions' | translate) + ' — ' + c.name"
                                >
                                  <lucide-icon [img]="MoreHorizontal" class="size-3.5" />
                                </button>
                                <ui-tooltip-content>{{ 'dashboard.table.rowActions' | translate }}</ui-tooltip-content>
                              </ui-tooltip>
                            </ui-tooltip-provider>
                            <ui-dropdown-menu-content align="end">
                              <ui-dropdown-menu-item (click)="openDetail(c)">View details</ui-dropdown-menu-item>
                              <ui-dropdown-menu-item>Edit</ui-dropdown-menu-item>
                              <ui-dropdown-menu-item>Email</ui-dropdown-menu-item>
                              <ui-dropdown-menu-item (click)="copyCustomerId(c)">Copy ID</ui-dropdown-menu-item>
                              <ui-dropdown-menu-separator />
                              <ui-dropdown-menu-item variant="destructive">Archive</ui-dropdown-menu-item>
                            </ui-dropdown-menu-content>
                          </ui-dropdown-menu>
                        </td>
                      </tr>
                    }
                    @if (paged().length === 0) {
                      <tr ui-table-empty [colSpan]="visibleCount()">
                        <div class="flex flex-col items-center gap-2 py-4">
                          <lucide-icon [img]="SlidersHorizontal" class="text-muted-foreground size-5" />
                          <p class="text-sm">No customers match your filters.</p>
                          <button ui-button variant="outline" size="sm" class="h-7 text-xs" (click)="resetFilters()">
                            Reset filters
                          </button>
                        </div>
                      </tr>
                    }
                  </tbody>
                }
              </ui-table>
            </div>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-xs">
            <span class="text-muted-foreground">
              Showing
              <span class="text-foreground tabular-nums"
                >{{ paged().length === 0 ? 0 : page() * pageSize() + 1 }}–{{
                  Math.min((page() + 1) * pageSize(), sorted().length)
                }}</span
              >
              of <span class="text-foreground tabular-nums">{{ sorted().length }}</span>
            </span>
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2">
                <span class="text-muted-foreground">Rows per page</span>
                <ui-select [value]="String(pageSize())" (valueChange)="onPageSize($event)">
                  <button ui-select-trigger size="sm" class="h-7 w-[68px] text-xs">
                    <span>{{ pageSize() }}</span>
                  </button>
                  <ui-select-content>
                    <ui-select-item value="5">5</ui-select-item>
                    <ui-select-item value="10">10</ui-select-item>
                    <ui-select-item value="20">20</ui-select-item>
                    <ui-select-item value="50">50</ui-select-item>
                  </ui-select-content>
                </ui-select>
              </div>
              <span class="text-muted-foreground tabular-nums">Page {{ page() + 1 }} of {{ pageCount() }}</span>
              <div class="flex items-center gap-1">
                <!-- WHY (Rule76/87): pagination triggers are 32px with both
                     aria-labels and tooltips. -->
                <ui-tooltip-provider>
                  <ui-tooltip>
                    <button
                      ui-button
                      ui-tooltip-trigger
                      variant="outline"
                      size="icon"
                      class="size-8"
                      [disabled]="page() === 0"
                      [attr.aria-label]="'dashboard.table.pagination.first' | translate"
                      (click)="page.set(0)"
                    >
                      <lucide-icon [img]="ChevronsLeft" class="size-3.5" />
                    </button>
                    <ui-tooltip-content>{{ 'dashboard.table.pagination.first' | translate }}</ui-tooltip-content>
                  </ui-tooltip>
                  <ui-tooltip>
                    <button
                      ui-button
                      ui-tooltip-trigger
                      variant="outline"
                      size="icon"
                      class="size-8"
                      [disabled]="page() === 0"
                      [attr.aria-label]="'dashboard.table.pagination.prev' | translate"
                      (click)="page.set(page() - 1)"
                    >
                      <lucide-icon [img]="ChevronLeft" class="size-3.5" />
                    </button>
                    <ui-tooltip-content>{{ 'dashboard.table.pagination.prev' | translate }}</ui-tooltip-content>
                  </ui-tooltip>
                  <ui-tooltip>
                    <button
                      ui-button
                      ui-tooltip-trigger
                      variant="outline"
                      size="icon"
                      class="size-8"
                      [disabled]="page() >= pageCount() - 1"
                      [attr.aria-label]="'dashboard.table.pagination.next' | translate"
                      (click)="page.set(page() + 1)"
                    >
                      <lucide-icon [img]="ChevronRight" class="size-3.5" />
                    </button>
                    <ui-tooltip-content>{{ 'dashboard.table.pagination.next' | translate }}</ui-tooltip-content>
                  </ui-tooltip>
                  <ui-tooltip>
                    <button
                      ui-button
                      ui-tooltip-trigger
                      variant="outline"
                      size="icon"
                      class="size-8"
                      [disabled]="page() >= pageCount() - 1"
                      [attr.aria-label]="'dashboard.table.pagination.last' | translate"
                      (click)="page.set(pageCount() - 1)"
                    >
                      <lucide-icon [img]="ChevronsRight" class="size-3.5" />
                    </button>
                    <ui-tooltip-content>{{ 'dashboard.table.pagination.last' | translate }}</ui-tooltip-content>
                  </ui-tooltip>
                </ui-tooltip-provider>
              </div>
            </div>
          </div>
        </div>
      </ui-page-body>

      <ui-sheet [open]="detailOpen()" (openChange)="detailOpen.set($event)">
        <ui-sheet-content class="gap-0 sm:max-w-md">
          @if (detailCustomer(); as dc) {
            <ui-sheet-header class="shrink-0 border-b pr-12">
              <div class="flex items-start gap-3">
                <ui-avatar size="lg" rounded="lg" class="ring-background ring-2 shadow-sm">
                  <ui-avatar-fallback [class]="'text-sm font-semibold ' + avatarTone(dc.name)">
                    {{ initials(dc.name) }}
                  </ui-avatar-fallback>
                </ui-avatar>
                <div class="min-w-0 flex-1 space-y-1">
                  <ui-sheet-title class="truncate text-base leading-tight" [title]="dc.name">{{ dc.name }}</ui-sheet-title>
                  <ui-sheet-description class="flex items-center gap-1 text-xs">
                    <lucide-icon [img]="Mail" class="size-3.5" aria-hidden="true" />{{ dc.email }}
                  </ui-sheet-description>
                  <div class="flex items-center gap-1.5 pt-1">
                    <span ui-badge variant="outline" [class]="'gap-1 px-2 py-0.5 text-xs font-medium capitalize ' + statusTone[dc.status]">
                      <span [class]="'size-1.5 rounded-full ' + statusDot[dc.status]"></span>
                      {{ dc.status }}
                    </span>
                    <span [class]="'rounded-full px-2 py-0.5 text-xs font-medium ' + planChipTone[dc.plan]">{{ dc.plan }}</span>
                    <span class="text-muted-foreground inline-flex items-center gap-1 text-xs">
                      <lucide-icon [img]="MapPin" class="size-3.5" aria-hidden="true" />{{ dc.country }}
                    </span>
                  </div>
                </div>
              </div>
            </ui-sheet-header>
            <div class="min-h-0 flex-1 overflow-y-auto">
              <div class="bg-border grid grid-cols-3 gap-px border-b">
                <div class="bg-background flex flex-col gap-1 px-4 py-3">
                  <span class="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase">
                    <lucide-icon [img]="CreditCard" class="size-3.5" aria-hidden="true" />MRR
                  </span>
                  <span class="text-base font-semibold tabular-nums">{{ formatMoney(dc.mrr) }}</span>
                  @if (dc.mrr > 0) {
                    <span class="text-success inline-flex items-center gap-0.5 text-xs font-medium tabular-nums">
                      <lucide-icon [img]="ArrowUpRight" class="size-3.5" aria-hidden="true" />{{ Math.round((dc.mrr * 12) / 1000) }}k ARR
                    </span>
                  } @else {
                    <span class="text-muted-foreground text-xs">No revenue</span>
                  }
                </div>
                <div class="bg-background flex flex-col gap-1 px-4 py-3">
                  <span class="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase">
                    <lucide-icon [img]="Users" class="size-3.5" aria-hidden="true" />Seats
                  </span>
                  <span class="text-base font-semibold tabular-nums">{{ dc.seats || 0 }}</span>
                  @if (dc.seats) {
                    <span class="text-muted-foreground text-xs tabular-nums">&#36;{{ Math.round(dc.mrr / dc.seats) }}/seat</span>
                  } @else {
                    <span class="text-muted-foreground text-xs">No seats</span>
                  }
                </div>
                <div class="bg-background flex flex-col gap-1 px-4 py-3">
                  <span class="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase">
                    <lucide-icon [img]="Building2" class="size-3.5" aria-hidden="true" />Tier
                  </span>
                  <span class="text-base font-semibold">{{ dc.plan }}</span>
                  <span class="text-muted-foreground text-xs">{{ tierCaption(dc) }}</span>
                </div>
              </div>
              <dl class="divide-border divide-y px-4 text-sm">
                <div class="flex items-center justify-between py-2.5">
                  <dt class="text-muted-foreground text-xs">Customer ID</dt>
                  <dd class="font-mono text-xs">{{ customerIdOf(dc) }}</dd>
                </div>
                <div class="flex items-center justify-between py-2.5">
                  <dt class="text-muted-foreground text-xs">Customer since</dt>
                  <dd class="text-xs tabular-nums">{{ dc.createdAt }}</dd>
                </div>
                <div class="flex items-center justify-between py-2.5">
                  <dt class="text-muted-foreground text-xs">Last seen</dt>
                  <dd class="text-xs tabular-nums">{{ dc.lastSeen }}</dd>
                </div>
                <div class="flex items-center justify-between py-2.5">
                  <dt class="text-muted-foreground text-xs">Country</dt>
                  <dd class="text-xs">{{ dc.country }}</dd>
                </div>
              </dl>
              <div class="border-t px-4 py-4">
                <div class="text-muted-foreground mb-3 inline-flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase">
                  <lucide-icon [img]="Activity" class="size-3.5" aria-hidden="true" />Recent activity
                </div>
                <ol class="relative space-y-3 pl-5">
                  <span class="bg-border absolute top-1 bottom-1 left-[7px] w-px"></span>
                  @for (ev of timelineFor(dc); track $index) {
                    <li class="relative">
                      <span class="bg-background border-border absolute top-0.5 -left-5 inline-flex size-4 items-center justify-center rounded-full border">
                        <lucide-icon [img]="ev.icon" [class]="'size-2.5 ' + ev.tone" />
                      </span>
                      <div class="text-xs leading-tight font-medium">{{ ev.title }}</div>
                      <div class="text-muted-foreground text-xs tabular-nums">{{ ev.meta }}</div>
                    </li>
                  }
                </ol>
              </div>
            </div>
            <ui-sheet-footer class="shrink-0 flex-row items-center border-t">
              <button ui-button size="sm" class="h-8 flex-1 text-xs">Open profile</button>
              <button ui-button variant="outline" size="sm" class="h-8 gap-1.5 text-xs">
                <lucide-icon [img]="Mail" class="size-3.5" />Email
              </button>
              <ui-dropdown-menu>
                <button ui-button ui-dropdown-menu-trigger variant="outline" size="icon" class="size-8">
                  <lucide-icon [img]="MoreHorizontal" class="size-3.5" />
                </button>
                <ui-dropdown-menu-content align="end">
                  <ui-dropdown-menu-item>Edit</ui-dropdown-menu-item>
                  <ui-dropdown-menu-item>Change plan</ui-dropdown-menu-item>
                  <ui-dropdown-menu-item (click)="copyCustomerId(dc)">Copy ID</ui-dropdown-menu-item>
                  <ui-dropdown-menu-separator />
                  <ui-dropdown-menu-item variant="destructive">Archive</ui-dropdown-menu-item>
                </ui-dropdown-menu-content>
              </ui-dropdown-menu>
            </ui-sheet-footer>
          }
        </ui-sheet-content>
      </ui-sheet>

      <!-- Mobile filters: same state as the md+ toolbar controls. -->
      <ui-sheet [open]="filtersOpen()" (openChange)="filtersOpen.set($event)">
        <ui-sheet-content side="bottom" class="max-h-[85dvh] gap-0">
          <ui-sheet-header class="shrink-0 border-b pr-12">
            <ui-sheet-title>Filters</ui-sheet-title>
            <ui-sheet-description>Narrow the list and choose what the table shows.</ui-sheet-description>
          </ui-sheet-header>
          <div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            <section class="space-y-2">
              <h3 class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Status</h3>
              <div class="flex flex-wrap gap-2">
                @for (s of statuses; track s) {
                  <button
                    ui-button
                    [variant]="statusFilter().has(s) ? 'secondary' : 'outline'"
                    size="sm"
                    class="gap-1.5 capitalize"
                    [attr.aria-pressed]="statusFilter().has(s)"
                    (click)="toggleStatus(s)"
                  >
                    <span [class]="'size-2 rounded-full ' + statusDot[s]"></span>
                    {{ s }}
                  </button>
                }
              </div>
            </section>
            <section class="space-y-2">
              <h3 class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Plan</h3>
              <div class="flex flex-wrap gap-2">
                @for (p of plans; track p) {
                  <button
                    ui-button
                    [variant]="planFilter().has(p) ? 'secondary' : 'outline'"
                    size="sm"
                    [attr.aria-pressed]="planFilter().has(p)"
                    (click)="togglePlan(p)"
                  >
                    @if (planFilter().has(p)) {
                      <lucide-icon [img]="Check" class="size-4" aria-hidden="true" />
                    }
                    {{ p }}
                  </button>
                }
              </div>
            </section>
            <section class="space-y-2">
              <h3 class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Last seen</h3>
              <ui-select [value]="dateRange()" (valueChange)="onDateRange($event)">
                <button ui-select-trigger class="w-full" aria-label="Last seen">
                  <span class="truncate">{{ dateRangeLabel()[dateRange()] }}</span>
                </button>
                <ui-select-content>
                  <ui-select-item value="all">All time</ui-select-item>
                  <ui-select-item value="7d">Last 7 days</ui-select-item>
                  <ui-select-item value="30d">Last 30 days</ui-select-item>
                  <ui-select-item value="90d">Last 90 days</ui-select-item>
                  <ui-select-item value="custom">{{ 'dashboard.range.custom' | translate }}</ui-select-item>
                </ui-select-content>
              </ui-select>
              @if (dateRange() === 'custom') {
                <ui-range-calendar class="rounded-md border" [selected]="customCal()" (select)="onCustomSelect($any($event))" />
              }
            </section>
            <section class="space-y-2">
              <h3 class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Density</h3>
              <ui-toggle-group
                type="single"
                size="sm"
                variant="outline"
                [value]="density()"
                (valueChange)="density.set($any($event))"
              >
                <ui-toggle-group-item value="compact" class="px-3">Compact</ui-toggle-group-item>
                <ui-toggle-group-item value="comfortable" class="px-3">Cozy</ui-toggle-group-item>
              </ui-toggle-group>
            </section>
            <section class="space-y-2">
              <h3 class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Columns</h3>
              <div class="flex flex-wrap gap-2">
                @for (c of columns(); track c.key) {
                  <button
                    ui-button
                    [variant]="isVisible(c.key) ? 'secondary' : 'outline'"
                    size="sm"
                    [attr.aria-pressed]="isVisible(c.key)"
                    (click)="toggleColumn(c.key)"
                  >
                    @if (isVisible(c.key)) {
                      <lucide-icon [img]="Check" class="size-4" aria-hidden="true" />
                    }
                    {{ c.label }}
                  </button>
                }
              </div>
            </section>
          </div>
          <ui-sheet-footer class="shrink-0 flex-row items-center border-t">
            <button ui-button variant="outline" class="flex-1" (click)="resetFilters()">
              <lucide-icon [img]="RotateCcw" class="size-4" aria-hidden="true" />Reset
            </button>
            <button ui-button class="flex-1" (click)="filtersOpen.set(false)">Show {{ sorted().length }} results</button>
          </ui-sheet-footer>
        </ui-sheet-content>
      </ui-sheet>
    </ui-page>
  `,
})
export class DashboardDataTableComponent {
  protected readonly Activity = Activity
  protected readonly ArrowDown = ArrowDown
  protected readonly ArrowUp = ArrowUp
  protected readonly ArrowUpDown = ArrowUpDown
  protected readonly ArrowUpRight = ArrowUpRight
  protected readonly Building2 = Building2
  protected readonly CalendarIcon = CalendarIcon
  protected readonly Check = Check
  protected readonly ChevronLeft = ChevronLeft
  protected readonly ChevronRight = ChevronRight
  protected readonly ChevronsLeft = ChevronsLeft
  protected readonly ChevronsRight = ChevronsRight
  protected readonly Columns3 = Columns3
  protected readonly CreditCard = CreditCard
  protected readonly Download = Download
  protected readonly Funnel = Funnel
  protected readonly Mail = Mail
  protected readonly MapPin = MapPin
  protected readonly Math = Math
  protected readonly MoreHorizontal = MoreHorizontal
  protected readonly Plus = Plus
  protected readonly RotateCcw = RotateCcw
  protected readonly Search = Search
  protected readonly SlidersHorizontal = SlidersHorizontal
  protected readonly String = String
  protected readonly UserPlus = UserPlus
  protected readonly Users = Users
  protected readonly X = X

  private readonly i18n = inject(I18nService)
  readonly pageTitle = injectPageTitle()
  readonly columns = computed(() => {
    this.i18n.lang()
    return columnDefs((k) => this.i18n.t(k))
  })
  readonly statuses = STATUSES
  readonly plans = PLANS
  readonly statusTone = statusTone
  readonly planChipTone = PLAN_CHIP_TONE
  readonly statusDot = statusDot
  readonly totalCount = CUSTOMERS.length

  readonly search = signal('')
  readonly statusFilter = signal<Set<Status>>(new Set())
  readonly planFilter = signal<Set<Plan>>(new Set())
  // WHY (Rule72): the default window is 30d, not all-time -- revenue is
  // their job sort and recent data is the working set.
  readonly dateRange = signal<DateRange>('30d')
  readonly sortKey = signal<SortKey>('mrr')
  readonly sortDir = signal<'asc' | 'desc'>('desc')
  readonly page = signal(0)
  readonly pageSize = signal(10)
  readonly selected = signal<Set<string>>(new Set())
  readonly density = signal<Density>('comfortable')
  readonly visibleCols = signal<Set<string>>(new Set(this.columns().filter((c) => c.defaultVisible).map((c) => c.key)))
  readonly loading = signal(true)
  readonly detailOpen = signal(false)
  readonly detailCustomer = signal<Customer | null>(null)
  readonly filtersOpen = signal(false)

  // Custom range via a RangeCalendar-in-Popover. Picking both endpoints
  // flips the filter into 'custom' so the same cutoff chain applies;
  // picking a preset clears the calendar value.
  readonly customCal = signal<CalRange | undefined>(undefined)
  readonly customOpen = signal(false)

  readonly customSpan = computed(() => {
    const v = this.customCal()
    if (!v?.from || !v?.to) return null
    const df = new Intl.DateTimeFormat(this.i18n.lang(), { month: 'short', day: 'numeric', year: 'numeric' })
    return this.i18n.t('dashboard.range.customLabel', { start: df.format(v.from), end: df.format(v.to) })
  })

  readonly dateRangeLabel = computed<Record<DateRange, string>>(() => {
    this.i18n.lang()
    return {
      'all': 'All time',
      '7d': 'Last 7 days',
      '30d': 'Last 30 days',
      '90d': 'Last 90 days',
      'custom': this.customSpan() ?? this.i18n.t('dashboard.range.custom'),
    }
  })

  readonly dateCutoff = computed(() => {
    const r = this.dateRange()
    if (r === 'all') return null
    if (r === 'custom') return isoDay(this.customCal()?.from)
    const days = r === '7d' ? 7 : r === '30d' ? 30 : 90
    const d = new Date('2026-09-29')
    d.setDate(d.getDate() - days)
    return d.toISOString().slice(0, 10)
  })

  // Upper bound only applies to a picked custom range -- presets are
  // open-ended ("last N days up to today").
  readonly dateEnd = computed(() => (this.dateRange() === 'custom' ? isoDay(this.customCal()?.to) : null))

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase()
    const cutoff = this.dateCutoff()
    const end = this.dateEnd()
    return CUSTOMERS.filter((c) => {
      if (this.statusFilter().size && !this.statusFilter().has(c.status)) return false
      if (this.planFilter().size && !this.planFilter().has(c.plan)) return false
      if (cutoff && c.lastSeen < cutoff) return false
      if (end && c.lastSeen > end) return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
      )
    })
  })

  readonly sorted = computed(() => {
    const dir = this.sortDir() === 'asc' ? 1 : -1
    const key = this.sortKey()
    return [...this.filtered()].sort((a, b) => {
      const av = a[key]
      const bv = b[key]
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  })

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.sorted().length / this.pageSize())))
  readonly paged = computed(() =>
    this.sorted().slice(this.page() * this.pageSize(), (this.page() + 1) * this.pageSize()),
  )
  readonly skeletonRows = computed(() => Array.from({ length: this.pageSize() }, (_, i) => i))
  readonly visibleColumns = computed(() => this.columns().filter((c) => this.visibleCols().has(c.key)))

  readonly allOnPageChecked = computed(
    () => this.paged().length > 0 && this.paged().every((c) => this.selected().has(c.id)),
  )
  readonly someOnPageChecked = computed(
    () => this.paged().some((c) => this.selected().has(c.id)) && !this.allOnPageChecked(),
  )
  readonly allFilteredChecked = computed(
    () => this.sorted().length > 0 && this.sorted().every((c) => this.selected().has(c.id)),
  )
  readonly headerChecked = computed<CheckedState>(() =>
    this.allOnPageChecked() ? true : this.someOnPageChecked() ? 'indeterminate' : false,
  )

  readonly activeFilterCount = computed(() => {
    let n = 0
    if (this.search().trim()) n++
    if (this.statusFilter().size) n++
    if (this.planFilter().size) n++
    // The default window is 30d, so only a non-default range counts as a filter.
    if (this.dateRange() !== '30d') n++
    return n
  })
  readonly mobileFilterCount = computed(
    () => this.statusFilter().size + this.planFilter().size + (this.dateRange() !== 'all' ? 1 : 0),
  )

  readonly cellPad = computed(() => (this.density() === 'compact' ? 'py-1.5' : 'py-3'))
  readonly visibleCount = computed(() => this.columns().filter((c) => this.visibleCols().has(c.key)).length + 2)

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      setTimeout(() => this.loading.set(false), 650)
    }
  }

  onSearch(v: string): void {
    this.search.set(v)
    this.page.set(0)
  }

  toggleStatus(s: Status): void {
    this.statusFilter.set(toggleSetValue(this.statusFilter(), s))
    this.page.set(0)
  }

  clearStatusFilter(): void {
    this.statusFilter.set(new Set())
    this.page.set(0)
  }

  togglePlan(p: Plan): void {
    this.planFilter.set(toggleSetValue(this.planFilter(), p))
    this.page.set(0)
  }

  clearPlanFilter(): void {
    this.planFilter.set(new Set())
    this.page.set(0)
  }

  onDateRange(v: string): void {
    this.dateRange.set(v as DateRange)
    if (v !== 'custom') this.customCal.set(undefined)
    this.page.set(0)
  }
  onCustomSelect(v: DayPickerSelected): void {
    const r = v as CalRange | undefined
    this.customCal.set(r)
    if (r?.from && r?.to) {
      this.dateRange.set('custom')
      this.customOpen.set(false)
    }
    this.page.set(0)
  }

  onPageSize(v: string): void {
    this.pageSize.set(Number(v) || 10)
    this.page.set(0)
  }

  toggleSort(key: string, sortable: boolean): void {
    if (!sortable) return
    const k = key as SortKey
    if (this.sortKey() === k) this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc')
    else {
      this.sortKey.set(k)
      this.sortDir.set(k === 'mrr' || k === 'seats' ? 'desc' : 'asc')
    }
    this.page.set(0)
  }

  togglePage(v: boolean): void {
    const next = new Set(this.selected())
    for (const c of this.paged()) {
      if (v) next.add(c.id)
      else next.delete(c.id)
    }
    this.selected.set(next)
  }

  selectAllFiltered(): void {
    this.selected.set(new Set(this.sorted().map((c) => c.id)))
  }

  toggleRow(id: string, v: boolean): void {
    const next = new Set(this.selected())
    if (v) next.add(id)
    else next.delete(id)
    this.selected.set(next)
  }

  clearSelection(): void {
    this.selected.set(new Set())
  }

  // WHY (Rule15): money formatting is centralized in core/utils so the
  // data table, forms billing and locations headcount agree on "$0".
  // Zero renders as $0, muted at the call site -- never an em-dash (Rule80).
  formatMoney(n: number): string {
    return formatMoney(n)
  }

  formatNumber(n: number): string {
    return formatNumber(n)
  }

  sortIcon(key: string): LucideIconData {
    if (this.sortKey() !== key) return ArrowUpDown
    return this.sortDir() === 'asc' ? ArrowUp : ArrowDown
  }

  // Screen readers announce the active sort from aria-sort on the header cell.
  ariaSort(key: string): 'ascending' | 'descending' | 'none' {
    if (this.sortKey() !== key) return 'none'
    return this.sortDir() === 'asc' ? 'ascending' : 'descending'
  }

  isVisible(key: string): boolean {
    return this.visibleCols().has(key)
  }

  toggleColumn(key: string): void {
    this.visibleCols.set(toggleSetValue(this.visibleCols(), key))
  }

  resetFilters(): void {
    this.search.set('')
    this.statusFilter.set(new Set())
    this.planFilter.set(new Set())
    // WHY (Rule72): the default window is 30d, not all-time.
    this.dateRange.set('30d')
    this.customCal.set(undefined)
    this.sortKey.set('mrr')
    this.sortDir.set('desc')
    this.page.set(0)
  }

  openDetail(c: Customer): void {
    this.detailCustomer.set(c)
    this.detailOpen.set(true)
  }

  // WHY (Rule67): the "Copy ID" menu item really copies (clipboard API with a
  // textarea fallback for non-secure contexts) instead of sitting dead.
  async copyText(text: string, label: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      if (typeof document === 'undefined') return
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    toast.success(label)
  }

  customerIdOf(c: Customer): string {
    return `cus_${c.id.padStart(6, '0')}`
  }

  copyCustomerId(c: Customer): void {
    void this.copyText(this.customerIdOf(c), this.i18n.t('dashboard.table.copied'))
  }

  exportCsv(): void {
    if (typeof document === 'undefined') return
    const cols = this.columns().filter((c) => this.visibleCols().has(c.key))
    const header = cols.map((c) => c.label).join(',')
    const rows = this.sorted().map((row) =>
      cols
        .map((c) => {
          const v = row[c.key as keyof Customer]
          const s = String(v).replace(/"/g, '""')
          return /[",\n]/.test(s) ? `"${s}"` : s
        })
        .join(','),
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('')
  }

  avatarTone(s: string): string {
    let h = 0
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
    return AVATAR_TONES[h % AVATAR_TONES.length]!
  }

  tierCaption(c: Customer): string {
    return c.status === 'active'
      ? 'Renews monthly'
      : c.status === 'trial'
        ? 'Trial period'
        : c.status === 'invited'
          ? 'Awaiting accept'
          : 'Cancelled'
  }

  timelineFor(c: Customer): TimelineEvent[] {
    const events: TimelineEvent[] = []
    events.push({ icon: UserPlus, title: 'Account created', meta: c.createdAt, tone: 'text-muted-foreground' })
    if (c.status === 'invited') {
      events.push({ icon: Mail, title: 'Invite email sent', meta: c.lastSeen, tone: 'text-warning' })
    } else if (c.status === 'trial') {
      events.push({ icon: Activity, title: 'Trial started', meta: c.lastSeen, tone: 'text-info' })
    } else if (c.status === 'churned') {
      events.push({ icon: CreditCard, title: 'Subscription ended', meta: c.lastSeen, tone: 'text-destructive' })
    } else {
      events.push({ icon: CreditCard, title: `Renewed at ${this.formatMoney(c.mrr)}/mo`, meta: c.lastSeen, tone: 'text-success' })
      events.push({ icon: Users, title: `${c.seats} seats provisioned`, meta: c.lastSeen, tone: 'text-muted-foreground' })
    }
    return events
  }
}
