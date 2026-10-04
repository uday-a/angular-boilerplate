// Locations: office directory + customer footprint on a live Leaflet map.
// Ports nuxt-boilerplate's app/pages/dashboard/locations.vue (+ the
// MapControls and OfficePopup blocks, inlined here): filtered KPIs, a
// searchable office list that flies the map, Offices/Customers/Both layers
// with a legend, curved HQ links, and region + customer-city breakdowns.
// Leaflet only loads in the browser (ui-leaflet-map creates the map after
// view init); the office clock is client-only too, so SSR markup matches.
import { Component, DestroyRef, PLATFORM_ID, afterNextRender, computed, effect, inject, signal, untracked, viewChild } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { TranslatePipe } from '@ngx-translate/core'
import type { Marker } from 'leaflet'
import {
  Briefcase,
  Building2,
  CalendarDays,
  Clock,
  Globe2,
  LucideAngularModule,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Search,
  TrendingUp,
  Users,
} from 'lucide-angular'
import { I18nService, injectPageTitle } from '@/app/core/i18n'
import { formatNumber } from '@/app/core/utils/cn'
import { UiBadgeComponent } from '@/app/components/ui/badge'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardHeaderComponent,
} from '@/app/components/ui/card'
import { UiInputComponent } from '@/app/components/ui/input'
import {
  UiPageBodyComponent,
  UiPageComponent,
  UiPageHeaderComponent,
  UiPageHeaderHeadingComponent,
} from '@/app/components/ui/page/page.component'
import {
  UiSelectComponent,
  UiSelectContentComponent,
  UiSelectItemComponent,
  UiSelectTriggerComponent,
  UiSelectValueComponent,
} from '@/app/components/ui/select/select.component'
import { UiToggleGroupComponent, UiToggleGroupItemComponent } from '@/app/components/ui/toggle-group'
import {
  UiLeafletCircleMarkerComponent,
  UiLeafletMapComponent,
  UiLeafletMarkerComponent,
  UiLeafletPolylineComponent,
  UiLeafletPopupComponent,
  UiLeafletTooltipComponent,
} from '@/app/components/ui/leaflet-map'
import { getChartColors, getChartTextColor } from '@/app/components/ui/charts/use-chart-theme'
import { UiEmptyStateComponent } from '@/app/components/ui/empty-state'
import { UiStatTileComponent } from '@/app/components/blocks/stat-tile'
import {
  arcPath,
  customerRadius,
  customerRegions,
  kindBadgeVariant,
  kindDotBg,
  kindDotClass,
  markerSizeClass,
  officeBounds,
  officeLocations,
  timeInZone,
  utcOffsetLabel,
  type OfficeKind,
} from '@/app/core/dashboard/locations'

type RegionKey = 'americas' | 'emea' | 'apac'
type Layer = 'offices' | 'customers' | 'both'

const REGION_OF: Record<string, RegionKey> = {
  'United States': 'americas', 'Canada': 'americas', 'Brazil': 'americas',
  'United Kingdom': 'emea', 'Ireland': 'emea', 'Germany': 'emea',
  'India': 'apac', 'Singapore': 'apac', 'Japan': 'apac', 'Australia': 'apac',
}

const HQ = officeLocations.find(o => o.kind === 'hq')!

export function formatArr(k: number): string {
  return k >= 1000 ? `$${(k / 1000).toFixed(1)}M` : `$${k}k`
}

@Component({
  selector: 'app-dashboard-locations',
  standalone: true,
  imports: [
    TranslatePipe,
    LucideAngularModule,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardHeaderComponent,
    UiEmptyStateComponent,
    UiInputComponent,
    UiLeafletCircleMarkerComponent,
    UiLeafletMapComponent,
    UiLeafletMarkerComponent,
    UiLeafletPolylineComponent,
    UiLeafletPopupComponent,
    UiLeafletTooltipComponent,
    UiPageBodyComponent,
    UiPageComponent,
    UiPageHeaderComponent,
    UiPageHeaderHeadingComponent,
    UiSelectComponent,
    UiSelectContentComponent,
    UiSelectItemComponent,
    UiSelectTriggerComponent,
    UiSelectValueComponent,
    UiStatTileComponent,
    UiToggleGroupComponent,
    UiToggleGroupItemComponent,
  ],
  template: `
    <ui-page>
      <ui-page-header>
        <ui-page-header-heading [title]="pageTitle()" [description]="'dashboard.locations.description' | translate" />
      </ui-page-header>

      <ui-page-body class="space-y-4">
        <!-- Stats row: follows the same filtered list as the map + list. -->
        <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <ui-stat-tile
            [label]="'dashboard.locations.stats.offices' | translate"
            [value]="'' + filtered().length"
            [caption]="'dashboard.locations.stats.officesCaption' | translate: kindCounts()"
            [icon]="BuildingIcon"
            [hasFooter]="!!newestOffice()"
          >
            @if (newestOffice(); as n) {
              <span slot="footer">{{ 'dashboard.locations.stats.newest' | translate: { city: n.city, year: n.opened } }}</span>
            }
          </ui-stat-tile>
          <ui-stat-tile
            [label]="'dashboard.locations.stats.countries' | translate"
            [value]="'' + countryCount()"
            [caption]="'dashboard.locations.stats.countriesCaption' | translate: { n: regions().length }"
            [icon]="GlobeIcon"
            [hasFooter]="true"
          >
            <span slot="footer">{{ 'dashboard.locations.stats.timezones' | translate: { n: timezoneCount() } }}</span>
          </ui-stat-tile>
          <ui-stat-tile
            [label]="'dashboard.locations.stats.headcount' | translate"
            [value]="formatNumber(totalHeadcount())"
            [delta]="'+' + growth() + '%'"
            [caption]="'dashboard.locations.stats.growthCaption' | translate"
            [icon]="UsersIcon"
          />
          <ui-stat-tile
            [label]="'dashboard.locations.stats.openRoles' | translate"
            [value]="'' + openRoles()"
            [caption]="'dashboard.locations.stats.openRolesCaption' | translate: { n: hiringOffices() }"
            [icon]="RolesIcon"
          />
        </div>

        <!-- List + map -->
        <div class="grid gap-4 lg:grid-cols-3">
          <ui-card>
            <ui-card-header>
              <div class="flex flex-col gap-2 sm:flex-row">
                <div class="relative min-w-0 flex-1">
                  <lucide-icon
                    [img]="SearchIcon"
                    class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <ui-input
                    type="search"
                    class="pl-9"
                    [placeholder]="'dashboard.locations.search.placeholder' | translate"
                    [aria-label]="'dashboard.locations.search.placeholder' | translate"
                    [value]="search()"
                    (valueChange)="search.set($event)"
                  />
                </div>
                <ui-select [value]="kindFilter()" (valueChange)="onKind($event)">
                  <button ui-select-trigger class="w-full sm:w-32" [attr.aria-label]="'dashboard.locations.filter.label' | translate">
                    <ui-select-value [placeholder]="'dashboard.locations.filter.label' | translate" />
                  </button>
                  <ui-select-content>
                    <ui-select-item value="all">{{ 'dashboard.locations.filter.all' | translate }}</ui-select-item>
                    <ui-select-item value="hq">{{ 'dashboard.locations.kind.hq' | translate }}</ui-select-item>
                    <ui-select-item value="hub">{{ 'dashboard.locations.kind.hub' | translate }}</ui-select-item>
                    <ui-select-item value="office">{{ 'dashboard.locations.kind.office' | translate }}</ui-select-item>
                  </ui-select-content>
                </ui-select>
              </div>
            </ui-card-header>
            <ui-card-content>
              @if (filtered().length) {
                <ul class="max-h-[456px] space-y-2 overflow-y-auto pr-1">
                  @for (office of filtered(); track office.id) {
                    <li [id]="'location-' + office.id">
                      <button
                        type="button"
                        [attr.aria-pressed]="selectedId() === office.id"
                        [class]="
                          'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors ' +
                          (selectedId() === office.id
                            ? 'border-primary/40 bg-primary/5 ring-primary ring-1'
                            : 'border-border/70 hover:border-border hover:bg-muted/50')
                        "
                        (click)="selectOffice(office.id)"
                      >
                        <span [class]="'block size-2 shrink-0 rounded-full ' + dotBg(office.kind)"></span>
                        <span class="min-w-0 flex-1">
                          <span class="flex items-center gap-1.5">
                            <span class="truncate text-sm font-medium">{{ office.city }}</span>
                            <ui-badge [variant]="badgeVariant(office.kind)">{{ 'dashboard.locations.kind.' + office.kind | translate }}</ui-badge>
                          </span>
                          <span class="text-muted-foreground flex items-center gap-1.5 truncate text-xs">
                            {{ office.country }}
                            @if (localTime(office.timezone); as time) {
                              <span aria-hidden="true">·</span>
                              <lucide-icon [img]="ClockIcon" class="size-3.5 shrink-0" aria-hidden="true" />
                              <span class="tabular-nums">{{ time }}</span>
                            }
                          </span>
                        </span>
                        <!-- Growth sits beside the headcount and roles get their own
                             line, so the city/time column keeps its width. -->
                        <span class="shrink-0 text-right">
                          <span class="flex items-baseline justify-end gap-1.5">
                            <!-- WHY (Rules 37/40): growth pairs color with a shape
                                 so direction never rides on green alone. -->
                            <span class="text-success inline-flex items-center gap-0.5 text-xs tabular-nums">
                              <lucide-icon [img]="TrendingUpIcon" class="size-3" aria-hidden="true" />+{{ office.growth }}%
                            </span>
                            <span class="text-sm font-semibold tabular-nums">{{ formatNumber(office.headcount) }}</span>
                          </span>
                          <span class="text-muted-foreground block text-xs whitespace-nowrap tabular-nums">{{ rolesLabel(office.openRoles) }}</span>
                        </span>
                      </button>
                    </li>
                  }
                </ul>
              } @else {
                <ui-empty-state
                  [icon]="noOfficesIcon"
                  [title]="'dashboard.locations.empty.title' | translate"
                  [description]="'dashboard.locations.empty.description' | translate"
                >
                  <ng-template #noOfficesIcon><lucide-icon [img]="PinIcon" /></ng-template>
                </ui-empty-state>
              }
            </ui-card-content>
          </ui-card>

          <!-- Large map: fills its card (no inner frame) -->
          <ui-card class="relative isolate p-0 lg:col-span-2">
            @if (isBrowser) {
              <ui-leaflet-map
                #map
                variant="muted"
                [center]="[-20, 20]"
                [zoom]="2"
                [minZoom]="1"
                [scrollWheelZoom]="true"
                [navigation]="false"
                class="h-[560px] w-full"
                (created)="fitToOffices(false)"
              >
                <!-- HQ links: thin dashed arcs to every office -->
                @if (showOffices()) {
                  @for (link of hqLinks(); track link.office.id) {
                    <ui-leaflet-polyline
                      [lngLatPath]="link.path"
                      [color]="linkColor"
                      [weight]="1"
                      [opacity]="selectedId() === link.office.id ? 0.9 : 0.35"
                      dashArray="3 5"
                    />
                  }
                }
                <!-- Customer concentration: circle area tracks ARR -->
                @if (showCustomers()) {
                  @for (c of customerRegions; track c.id) {
                    <ui-leaflet-circle-marker
                      [center]="c.lngLat"
                      [radius]="radius(c.arr)"
                      [color]="customerColor"
                      [fillColor]="customerColor"
                      [fillOpacity]="0.25"
                      [weight]="1.5"
                    >
                      <ui-leaflet-tooltip direction="top">
                        <span class="text-xs"><span class="font-medium">{{ c.city }}</span> · {{ accountsLabel(c.accounts) }} · {{ arrLabel(c.arr) }} ARR</span>
                      </ui-leaflet-tooltip>
                    </ui-leaflet-circle-marker>
                  }
                }
                @if (showOffices()) {
                  @for (office of filtered(); track office.id; let i = $index) {
                    <ui-leaflet-marker
                      [lngLat]="office.lngLat"
                      anchor="center"
                      [zIndexOffset]="selectedId() === office.id ? 1000 : 0"
                      [opacity]="selectedId() && selectedId() !== office.id ? 0.55 : 1"
                      (layerClick)="onMarkerClick(office.id)"
                      (ready)="onMarkerReady(office.id, $event)"
                    >
                      <!-- WHY (Rule90/96): 200ms pop-in, and the pulse is gated
                           with motion-safe so reduced-motion gets a static marker. -->
                      <span
                        class="animate-in fade-in-0 zoom-in-50 fill-mode-both relative flex items-center justify-center duration-200"
                        [style.animation-delay]="i * 70 + 'ms'"
                      >
                        @if (office.kind === 'hq' || selectedId() === office.id) {
                          <span [class]="'absolute inset-0 rounded-full opacity-40 motion-safe:animate-ping ' + dotBg(office.kind)" aria-hidden="true"></span>
                        }
                        <span
                          [class]="
                            'outline-background relative block rounded-full ring-4 outline-2 transition-transform duration-200 hover:scale-125 ' +
                            markerSize(office.headcount) + ' ' + kindDot(office.kind) +
                            (selectedId() === office.id ? ' scale-125' : '')
                          "
                        ></span>
                      </span>
                      <ui-leaflet-tooltip direction="top" [offset]="[0, -10]">
                        <span class="text-xs font-medium">{{ office.city }}</span>
                      </ui-leaflet-tooltip>
                      <ui-leaflet-popup [offset]="[0, -10]" [minWidth]="240">
                        <!-- Office popup. Divs, not <p>: Leaflet's stylesheet gives
                             popup paragraphs 17px margins. -->
                        <div class="w-60">
                          <div class="flex items-start justify-between gap-3 pr-5">
                            <div class="min-w-0">
                              <div class="flex items-center gap-1.5">
                                <span [class]="'size-2 shrink-0 rounded-full ' + dotBg(office.kind)" aria-hidden="true"></span>
                                <span class="truncate text-sm font-semibold">{{ office.city }}</span>
                              </div>
                              <div class="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                                <span class="truncate">{{ office.country }}</span>
                                @if (localTime(office.timezone); as time) {
                                  <span aria-hidden="true">·</span>
                                  <lucide-icon [img]="ClockIcon" class="size-3.5 shrink-0" aria-hidden="true" />
                                  <span class="tabular-nums">{{ time }}</span>
                                }
                              </div>
                            </div>
                            <ui-badge [variant]="badgeVariant(office.kind)" class="shrink-0">{{ 'dashboard.locations.kind.' + office.kind | translate }}</ui-badge>
                          </div>
                          <div class="bg-muted/50 mt-3 grid grid-cols-3 divide-x rounded-md border">
                            <div class="px-2 py-1.5">
                              <div class="text-muted-foreground flex items-center gap-1 text-xs">
                                <lucide-icon [img]="UsersIcon" class="size-3.5" aria-hidden="true" />
                                {{ 'dashboard.locations.popup.people' | translate }}
                              </div>
                              <div class="mt-0.5 text-sm font-semibold tabular-nums">{{ office.headcount }}</div>
                              <div class="text-success text-xs tabular-nums">+{{ office.growth }}%</div>
                            </div>
                            <div class="px-2 py-1.5">
                              <div class="text-muted-foreground flex items-center gap-1 text-xs">
                                <lucide-icon [img]="RolesIcon" class="size-3.5" aria-hidden="true" />
                                {{ 'dashboard.locations.popup.roles' | translate }}
                              </div>
                              <div class="mt-0.5 text-sm font-semibold tabular-nums">{{ office.openRoles }}</div>
                              <div class="text-muted-foreground text-xs">{{ 'dashboard.locations.popup.hiring' | translate }}</div>
                            </div>
                            <div class="px-2 py-1.5">
                              <div class="text-muted-foreground flex items-center gap-1 text-xs">
                                <lucide-icon [img]="CalendarIcon" class="size-3.5" aria-hidden="true" />
                                {{ 'dashboard.locations.popup.since' | translate }}
                              </div>
                              <div class="mt-0.5 text-sm font-semibold tabular-nums">{{ office.opened }}</div>
                              <div class="text-muted-foreground text-xs">{{ office.timezone ? offsetLabel(office.timezone) : '' }}</div>
                            </div>
                          </div>
                          <div class="mt-3 flex items-center gap-2">
                            <span class="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                              {{ initials(office.lead) }}
                            </span>
                            <div class="min-w-0 text-xs">
                              <div class="truncate font-medium" [title]="office.lead">{{ office.lead }}</div>
                              <div class="text-muted-foreground">{{ 'dashboard.locations.popup.lead' | translate }}</div>
                            </div>
                          </div>
                        </div>
                      </ui-leaflet-popup>
                    </ui-leaflet-marker>
                  }
                }
              </ui-leaflet-map>
            } @else {
              <div class="bg-muted h-[560px] w-full" aria-hidden="true"></div>
            }

            <!-- Map controls: zoom in / out / reset-to-fit -->
            <div class="bg-card/90 absolute right-3 bottom-3 z-[800] flex flex-col overflow-hidden rounded-md border backdrop-blur-sm">
              <button
                ui-button
                variant="ghost"
                size="icon"
                class="size-8 rounded-none"
                [attr.aria-label]="'dashboard.locations.controls.zoomIn' | translate"
                [title]="'dashboard.locations.controls.zoomIn' | translate"
                (click)="map()?.zoomIn()"
              >
                <lucide-icon [img]="PlusIcon" class="size-4" aria-hidden="true" />
              </button>
              <button
                ui-button
                variant="ghost"
                size="icon"
                class="size-8 rounded-none border-t"
                [attr.aria-label]="'dashboard.locations.controls.zoomOut' | translate"
                [title]="'dashboard.locations.controls.zoomOut' | translate"
                (click)="map()?.zoomOut()"
              >
                <lucide-icon [img]="MinusIcon" class="size-4" aria-hidden="true" />
              </button>
              <button
                ui-button
                variant="ghost"
                size="icon"
                class="size-8 rounded-none border-t"
                [attr.aria-label]="'dashboard.locations.controls.reset' | translate"
                [title]="'dashboard.locations.controls.reset' | translate"
                (click)="resetView()"
              >
                <lucide-icon [img]="ResetIcon" class="size-4" aria-hidden="true" />
              </button>
            </div>

            <!-- WHY (Rule93): the canvas map is invisible to screen readers --
                 this sr-only list carries the same office data as text. -->
            <ul class="sr-only">
              @for (office of offices; track office.id) {
                <li>{{ office.city }}, {{ office.country }} — {{ formatNumber(office.headcount) }} people</li>
              }
            </ul>

            <!-- Layer switch -->
            <div class="absolute top-3 left-3 z-[800]">
              <ui-toggle-group
                type="single"
                variant="outline"
                size="sm"
                class="bg-card/90 backdrop-blur-sm"
                [value]="layer()"
                [attr.aria-label]="'dashboard.locations.layers.label' | translate"
                (valueChange)="$event && layer.set($event)"
              >
                @for (l of layers; track l) {
                  <button ui-toggle-group-item [value]="l" class="px-2.5 text-xs">{{ 'dashboard.locations.layers.' + l | translate }}</button>
                }
              </ui-toggle-group>
            </div>

            <!-- Legend: kind color + "size = headcount" -->
            <div
              class="bg-card/90 text-muted-foreground pointer-events-none absolute bottom-3 left-3 z-[800] flex max-w-[calc(100%-4.5rem)] flex-wrap items-center gap-x-3 gap-y-1 rounded-md border px-2.5 py-1.5 text-xs backdrop-blur-sm"
            >
              @for (kind of kinds; track kind) {
                <span class="flex items-center gap-1.5">
                  <span [class]="'size-2 rounded-full ' + dotBg(kind)"></span>
                  {{ 'dashboard.locations.kind.' + kind | translate }}
                </span>
              }
              <span class="border-l pl-3">{{ 'dashboard.locations.sizeLegend' | translate }}</span>
              @if (showCustomers()) {
                <span class="flex items-center gap-1.5 border-l pl-3">
                  <span class="border-chart-2 bg-chart-2/25 size-2.5 rounded-full border"></span>
                  {{ 'dashboard.locations.layers.customers' | translate }}
                </span>
              }
            </div>
          </ui-card>
        </div>

        <!-- Breakdown: people by region, customers by city -->
        <div class="grid gap-4 lg:grid-cols-2">
          <ui-card>
            <ui-card-header>
              <h2 class="text-base leading-none font-semibold tracking-tight">{{ 'dashboard.locations.regions.title' | translate }}</h2>
              <ui-card-description>{{ 'dashboard.locations.regions.description' | translate }}</ui-card-description>
            </ui-card-header>
            <ui-card-content class="space-y-4">
              @for (r of regions(); track r.key) {
                <div class="space-y-1.5">
                  <div class="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                    <span class="font-medium">{{ 'dashboard.locations.regions.' + r.key | translate }}</span>
                    <span class="text-muted-foreground text-xs tabular-nums">
                      {{ 'dashboard.locations.regions.meta' | translate: { offices: r.offices, roles: r.openRoles } }}
                      · <span class="text-foreground font-medium">{{ r.headcount }}</span> ({{ r.share }}%)
                    </span>
                  </div>
                  <div class="bg-muted h-2 overflow-hidden rounded-full">
                    <div [class]="'h-full rounded-full ' + r.bar" [style.width.%]="r.share"></div>
                  </div>
                </div>
              }
              <div class="text-muted-foreground grid grid-cols-2 gap-3 border-t pt-3 text-xs">
                <div>
                  <div>{{ 'dashboard.locations.regions.largest' | translate }}</div>
                  <div class="text-foreground text-sm font-medium">
                    {{ 'dashboard.locations.regions.' + largestRegion().key | translate }} · {{ largestRegion().share }}%
                  </div>
                </div>
                <div>
                  <div>{{ 'dashboard.locations.regions.hiring' | translate }}</div>
                  <div class="text-foreground text-sm font-medium">
                    {{ 'dashboard.locations.regions.' + hiringRegion().key | translate }} · {{ rolesLabel(hiringRegion().openRoles) }}
                  </div>
                </div>
              </div>
            </ui-card-content>
          </ui-card>
          <ui-card>
            <ui-card-header>
              <h2 class="text-base leading-none font-semibold tracking-tight">{{ 'dashboard.locations.customers.title' | translate }}</h2>
              <ui-card-description>{{ 'dashboard.locations.customers.description' | translate }}</ui-card-description>
            </ui-card-header>
            <ui-card-content>
              <ul class="space-y-2.5">
                @for (c of topCustomers(); track c.id) {
                  <!-- Name column sized to the longest city so names never truncate at desktop. -->
                  <li class="grid grid-cols-[minmax(6rem,max-content)_1fr_auto] items-center gap-3 text-sm">
                    <span class="font-medium whitespace-nowrap">{{ c.city }}</span>
                    <span class="bg-muted h-1.5 overflow-hidden rounded-full">
                      <span class="bg-chart-2 block h-full rounded-full" [style.width.%]="Math.round((c.arr / maxArr()) * 100)"></span>
                    </span>
                    <span class="text-muted-foreground text-xs tabular-nums">
                      <span class="text-foreground font-medium">{{ arrLabel(c.arr) }}</span> · {{ accountsLabel(c.accounts) }}
                    </span>
                  </li>
                }
              </ul>
            </ui-card-content>
          </ui-card>
        </div>
      </ui-page-body>
    </ui-page>
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
  protected readonly ClockIcon = Clock
  protected readonly CalendarIcon = CalendarDays
  protected readonly PlusIcon = Plus
  protected readonly MinusIcon = Minus
  protected readonly ResetIcon = RotateCcw
  protected readonly Math = Math

  private readonly i18n = inject(I18nService)
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID))
  readonly pageTitle = injectPageTitle()

  protected readonly offices = officeLocations
  protected readonly customerRegions = customerRegions
  protected readonly kinds: OfficeKind[] = ['hq', 'hub', 'office']
  protected readonly layers: Layer[] = ['offices', 'customers', 'both']
  // Canvas colors resolve from the theme tokens (browser only; the map is too).
  protected readonly customerColor = this.isBrowser ? (getChartColors()[1] ?? '#0d9488') : '#0d9488'
  protected readonly linkColor = this.isBrowser ? getChartTextColor() : '#71717a'

  readonly search = signal('')
  readonly kindFilter = signal<'all' | OfficeKind>('all')
  readonly layer = signal<Layer>('offices')
  readonly showOffices = computed(() => this.layer() !== 'customers')
  readonly showCustomers = computed(() => this.layer() !== 'offices')
  readonly selectedId = signal<string | null>(null)

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase()
    const kind = this.kindFilter()
    return officeLocations.filter((office) => {
      if (kind !== 'all' && office.kind !== kind) return false
      if (!q) return true
      return office.city.toLowerCase().includes(q) || office.country.toLowerCase().includes(q)
    })
  })
  readonly hqLinks = computed(() =>
    this.filtered().filter(o => o.kind !== 'hq').map(office => ({ office, path: arcPath(HQ.lngLat, office.lngLat) })),
  )

  // WHY (Rule69): the stats follow the same FILTERED list as the map + list --
  // a kind/search slice that leaves the totals on "all offices" lies.
  readonly countryCount = computed(() => new Set(this.filtered().map(o => o.country)).size)
  readonly totalHeadcount = computed(() => this.filtered().reduce((s, o) => s + o.headcount, 0))
  readonly openRoles = computed(() => this.filtered().reduce((s, o) => s + o.openRoles, 0))
  readonly hiringOffices = computed(() => this.filtered().filter(o => o.openRoles > 0).length)
  // Headcount-weighted year-on-year growth across the filtered offices.
  readonly growth = computed(() => {
    const total = this.totalHeadcount()
    return total === 0 ? 0 : Math.round(this.filtered().reduce((s, o) => s + o.growth * o.headcount, 0) / total)
  })
  readonly kindCounts = computed(() => ({
    hq: this.filtered().filter(o => o.kind === 'hq').length,
    hub: this.filtered().filter(o => o.kind === 'hub').length,
    office: this.filtered().filter(o => o.kind === 'office').length,
  }))
  readonly newestOffice = computed(() => [...this.filtered()].sort((a, b) => b.opened - a.opened)[0])
  // Distinct current offsets (London and Dublin share one), not zone names.
  readonly timezoneCount = computed(() => new Set(this.filtered().map(o => (o.timezone ? utcOffsetLabel(o.timezone) : ''))).size)

  readonly regions = computed(() => (['americas', 'emea', 'apac'] as const).map((key, i) => {
    const offices = this.filtered().filter(o => REGION_OF[o.country] === key)
    const headcount = offices.reduce((s, o) => s + o.headcount, 0)
    const total = this.totalHeadcount()
    return {
      key,
      bar: ['bg-chart-1', 'bg-chart-2', 'bg-chart-3'][i]!,
      offices: offices.length,
      headcount,
      openRoles: offices.reduce((s, o) => s + o.openRoles, 0),
      share: total === 0 ? 0 : Math.round((headcount / total) * 100),
    }
  }))
  readonly largestRegion = computed(() => [...this.regions()].sort((a, b) => b.headcount - a.headcount)[0]!)
  // Hiring intensity: open roles relative to current headcount.
  readonly hiringRegion = computed(() =>
    [...this.regions()].sort((a, b) => (b.openRoles / (b.headcount || 1)) - (a.openRoles / (a.headcount || 1)))[0]!,
  )
  readonly topCustomers = computed(() => [...customerRegions].sort((a, b) => b.arr - a.arr).slice(0, 7))
  readonly maxArr = computed(() => this.topCustomers()[0]?.arr ?? 1)

  // Local time per office. Client-only (null during SSR) so hydration
  // matches; ticks once a minute.
  private readonly now = signal<Date | null>(null)

  readonly map = viewChild<UiLeafletMapComponent>('map')
  private readonly markerById = new Map<string, Marker>()

  constructor() {
    const destroyRef = inject(DestroyRef)
    afterNextRender(() => {
      this.now.set(new Date())
      const clock = setInterval(() => this.now.set(new Date()), 60_000)
      destroyRef.onDestroy(() => clearInterval(clock))
    })
    // Re-frame the map whenever the visible offices change.
    effect(() => {
      this.filtered()
      untracked(() => this.fitToOffices())
    })
  }

  onKind(value: string): void {
    if (value) this.kindFilter.set(value as 'all' | OfficeKind)
  }

  // Frame every visible office. fitBounds also snaps to whole zoom levels,
  // which avoids the tile seams fractional zooms leave behind.
  fitToOffices(animate = true): void {
    const bounds = officeBounds(this.filtered())
    if (bounds) this.map()?.fitBounds(bounds, { padding: [48, 48], maxZoom: 5, animate })
  }

  // Reset: clear the selection, close any popup, re-frame every office.
  resetView(): void {
    this.selectedId.set(null)
    this.map()?.getMap()?.closePopup()
    this.fitToOffices()
  }

  onMarkerReady(id: string, marker: Marker): void {
    this.markerById.set(id, marker)
  }

  // List click flies the map and opens the marker's popup.
  selectOffice(id: string): void {
    this.selectedId.set(id)
    const office = officeLocations.find(o => o.id === id)
    const map = this.map()
    if (!office || !map) return
    map.flyTo({ center: office.lngLat, zoom: Math.max(map.getMap()?.getZoom() ?? 4, 4), duration: 700 })
    this.markerById.get(id)?.openPopup()
  }

  onMarkerClick(id: string): void {
    this.selectedId.set(id)
    document.getElementById(`location-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  localTime(tz?: string): string | null {
    const now = this.now()
    return now && tz ? timeInZone(tz, now) : null
  }

  offsetLabel(tz: string): string {
    return utcOffsetLabel(tz)
  }

  rolesLabel(n: number): string {
    this.i18n.lang()
    return this.i18n.tc('dashboard.locations.openRolesShort', n, { n })
  }

  accountsLabel(n: number): string {
    this.i18n.lang()
    return this.i18n.tc('dashboard.locations.accounts', n, { n })
  }

  radius(arr: number): number {
    return customerRadius(arr)
  }

  dotBg(kind: OfficeKind): string {
    return kindDotBg(kind)
  }

  kindDot(kind: OfficeKind): string {
    return kindDotClass(kind)
  }

  markerSize(headcount: number): string {
    return markerSizeClass(headcount)
  }

  badgeVariant(kind: OfficeKind): 'default' | 'secondary' | 'outline' {
    return kindBadgeVariant(kind)
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('')
  }

  formatNumber(n: number): string {
    return formatNumber(n)
  }

  arrLabel(arr: number): string {
    return formatArr(arr)
  }
}
