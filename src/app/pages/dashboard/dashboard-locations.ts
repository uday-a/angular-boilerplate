// Locations — office directory + customer footprint. Ports
// nuxt-boilerplate `app/pages/dashboard/locations.vue` via next-boilerplate's
// static-grid port (see its `dashboard/locations/page.tsx`).
//
// TODO: swap the static grid for a Leaflet map wrapper (curved HQ arcs,
// zoom/reset controls, office popups) once an Angular map layer lands —
// the shared `core/dashboard/locations` dataset already carries
// lngLat/bounds/arcs.
import { Component, computed, inject, signal } from '@angular/core'
import { Title } from '@angular/platform-browser'
import {
  Briefcase,
  Building2,
  Globe2,
  LucideAngularModule,
  MapPin,
  Search,
  TrendingUp,
  Users,
} from 'lucide-angular'
import { formatNumber } from '@/app/core/utils/cn'
import { UiBadgeComponent } from '@/app/components/ui/badge'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card'
import { UiInputComponent } from '@/app/components/ui/input'
import {
  UiToggleGroupComponent,
  UiToggleGroupItemComponent,
} from '@/app/components/ui/toggle-group'
import { UiDemoDataBannerComponent } from '@/app/components/blocks/demo-data-banner'
import { UiEmptyStateComponent } from '@/app/components/ui/empty-state'
import { UiStatTileComponent } from '@/app/components/blocks/stat-tile'
import {
  customerRegions,
  kindBadgeVariant,
  kindDotBg,
  officeLocations,
  timeInZone,
  utcOffsetLabel,
  type OfficeKind,
} from '@/app/core/dashboard/locations'

function formatArr(k: number): string {
  return k >= 1000 ? `$${(k / 1000).toFixed(1)}M` : `$${k}k`
}

@Component({
  selector: 'app-dashboard-locations',
  standalone: true,
  imports: [
    LucideAngularModule,
    UiBadgeComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
    UiDemoDataBannerComponent,
    UiEmptyStateComponent,
    UiInputComponent,
    UiStatTileComponent,
    UiToggleGroupComponent,
    UiToggleGroupItemComponent,
  ],
  template: `
    <div class="space-y-4">
      <header class="space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight">Locations</h1>
        <p class="text-muted-foreground text-sm">Every office, hub, and HQ on one live map.</p>
      </header>

      <ui-demo-data-banner />

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ui-stat-tile label="Offices" [value]="officeCountLabel()" [caption]="countryCount() + ' countries'" [icon]="BuildingIcon" />
        <ui-stat-tile label="Headcount" [value]="headcountLabel()" caption="Across filtered offices" [icon]="UsersIcon" />
        <ui-stat-tile label="Open roles" [value]="openRolesLabel()" caption="Hiring now" [icon]="RolesIcon" />
        <ui-stat-tile label="Time zones" [value]="timezoneCountLabel()" caption="Distinct UTC offsets" [icon]="GlobeIcon" />
      </div>

      <div class="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div class="relative min-w-0 flex-1">
          <lucide-icon
            [img]="SearchIcon"
            class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          />
          <ui-input
            [value]="search()"
            (valueChange)="search.set($event)"
            type="search"
            placeholder="Search city or country…"
            aria-label="Search offices"
            class="pl-8"
          />
        </div>
        <ui-toggle-group
          type="single"
          variant="outline"
          size="sm"
          [value]="kindFilter()"
          (valueChange)="onKind($any($event))"
          aria-label="Filter by office kind"
        >
          <ui-toggle-group-item value="all" class="px-3 text-xs">All</ui-toggle-group-item>
          <ui-toggle-group-item value="hq" class="px-3 text-xs">HQ</ui-toggle-group-item>
          <ui-toggle-group-item value="hub" class="px-3 text-xs">Hub</ui-toggle-group-item>
          <ui-toggle-group-item value="office" class="px-3 text-xs">Offices</ui-toggle-group-item>
        </ui-toggle-group>
        <p class="text-muted-foreground text-xs tabular-nums" aria-live="polite">
          {{ filtered().length }} of {{ officeCount }}
        </p>
      </div>

      @if (filtered().length === 0) {
        <ui-card>
          <ui-empty-state
            [icon]="noOfficesIcon"
            title="No matching offices"
            description="Try a broader search or a different kind filter."
            class="px-4"
          >
            <ng-template #noOfficesIcon><lucide-icon [img]="PinIcon" /></ng-template>
          </ui-empty-state>
        </ui-card>
      } @else {
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          @for (office of filtered(); track office.id) {
            <ui-card>
              <ui-card-header class="p-4 pb-0">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                      <span [class]="'size-2 shrink-0 rounded-full ' + dotBg(office.kind)" aria-hidden="true"></span>
                      <ui-card-title class="truncate text-base" [title]="office.city">{{ office.city }}</ui-card-title>
                    </div>
                    <ui-card-description>
                      {{ office.country }}
                      @if (office.timezone) {
                        <span class="tabular-nums">
                          · {{ localTime(office.timezone) }} ({{ offsetLabel(office.timezone) }})
                        </span>
                      }
                    </ui-card-description>
                  </div>
                  <ui-badge [variant]="badgeVariant(office.kind)" class="shrink-0">
                    {{ kindName(office.kind) }}
                  </ui-badge>
                </div>
              </ui-card-header>
              <ui-card-content class="space-y-2 p-4">
                <div class="grid grid-cols-3 gap-2 border-t pt-3">
                  <div>
                    <div class="text-muted-foreground text-xs">People</div>
                    <div class="text-sm font-semibold tabular-nums">{{ formatNumber(office.headcount) }}</div>
                    <!-- WHY (Rules 37/40): growth pairs color with a shape
                         so direction never rides on green alone. -->
                    <div class="text-success inline-flex items-center gap-0.5 text-xs tabular-nums">
                      <lucide-icon [img]="TrendingUpIcon" class="size-3" />+{{ office.growth }}%
                    </div>
                  </div>
                  <div>
                    <div class="text-muted-foreground text-xs">Roles</div>
                    <div class="text-sm font-semibold tabular-nums">{{ office.openRoles }}</div>
                    <div class="text-muted-foreground text-xs">hiring</div>
                  </div>
                  <div>
                    <div class="text-muted-foreground text-xs">Since</div>
                    <div class="text-sm font-semibold tabular-nums">{{ office.opened }}</div>
                    <div class="text-muted-foreground truncate text-xs" [title]="office.lead">{{ office.lead }}</div>
                  </div>
                </div>
              </ui-card-content>
            </ui-card>
          }
        </div>
      }

      <ui-card>
        <ui-card-header class="p-4 pb-0">
          <ui-card-title class="text-base">Where customers concentrate</ui-card-title>
          <ui-card-description>Top regions by ARR across customer accounts.</ui-card-description>
        </ui-card-header>
        <ui-card-content class="space-y-2 p-4">
          @for (r of topCustomers(); track r.id) {
            <div class="flex items-center gap-3 text-sm">
              <span class="w-28 shrink-0 truncate text-xs font-medium" [title]="r.city">{{ r.city }}</span>
              <div class="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                <div class="bg-chart-1 h-full rounded-full" [style.width.%]="Math.round((r.arr / maxArr()) * 100)"></div>
              </div>
              <span class="text-muted-foreground w-20 shrink-0 text-right text-xs tabular-nums">
                {{ arrLabel(r.arr) }} · {{ r.accounts }} accounts
              </span>
            </div>
          }
        </ui-card-content>
      </ui-card>
    </div>
  `,
})
export class DashboardLocations {
  protected readonly BuildingIcon = Building2
  protected readonly UsersIcon = Users
  protected readonly RolesIcon = Briefcase
  protected readonly GlobeIcon = Globe2
  protected readonly SearchIcon = Search
  protected readonly PinIcon = MapPin
  protected readonly TrendingUpIcon = TrendingUp
  protected readonly Math = Math

  protected readonly officeCount = officeLocations.length
  protected readonly search = signal('')
  protected readonly kindFilter = signal<'all' | OfficeKind>('all')

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase()
    return officeLocations.filter((office) => {
      if (this.kindFilter() !== 'all' && office.kind !== this.kindFilter()) return false
      if (!q) return true
      return office.city.toLowerCase().includes(q) || office.country.toLowerCase().includes(q)
    })
  })

  // WHY (Rule69): the stats follow the same FILTERED list as the list --
  // a kind/search slice that leaves the totals on "all offices" lies.
  protected readonly officeCountLabel = computed(() => String(this.filtered().length))
  protected readonly totalHeadcount = computed(() => this.filtered().reduce((s, o) => s + o.headcount, 0))
  protected readonly headcountLabel = computed(() => formatNumber(this.totalHeadcount()))
  protected readonly countryCount = computed(() => new Set(this.filtered().map((o) => o.country)).size)
  protected readonly openRoles = computed(() => this.filtered().reduce((s, o) => s + o.openRoles, 0))
  protected readonly openRolesLabel = computed(() => String(this.filtered().reduce((s, o) => s + o.openRoles, 0)))
  // Distinct current offsets (London and Dublin share one), not zone names.
  protected readonly timezoneCount = computed(
    () => new Set(this.filtered().map((o) => (o.timezone ? utcOffsetLabel(o.timezone) : ''))).size,
  )
  protected readonly timezoneCountLabel = computed(
    () => String(new Set(this.filtered().map((o) => (o.timezone ? utcOffsetLabel(o.timezone) : ''))).size),
  )
  protected readonly topCustomers = computed(() => [...customerRegions].sort((a, b) => b.arr - a.arr).slice(0, 7))
  protected readonly maxArr = computed(() => this.topCustomers()[0]?.arr ?? 1)

  // Rendered once (SSR-safe): office wall-clock times at first paint, like
  // the Next static port. A ticking clock can be added client-side later.
  private readonly now = new Date()

  constructor() {
    inject(Title).setTitle('Locations')
  }

  onKind(value: string): void {
    if (value) this.kindFilter.set(value as 'all' | OfficeKind)
  }

  dotBg(kind: OfficeKind): string {
    return kindDotBg(kind)
  }

  badgeVariant(kind: OfficeKind): 'default' | 'secondary' | 'outline' {
    return kindBadgeVariant(kind)
  }

  kindName(kind: OfficeKind): string {
    const names: Record<OfficeKind, string> = { hq: 'HQ', hub: 'Hub', office: 'Office' }
    return names[kind]
  }

  localTime(timezone: string): string {
    return timeInZone(timezone, this.now)
  }

  offsetLabel(timezone: string): string {
    return utcOffsetLabel(timezone, this.now)
  }

  formatNumber(n: number): string {
    return formatNumber(n)
  }

  arrLabel(arr: number): string {
    return formatArr(arr)
  }
}
