// UI Kit finder. Ports nuxt-boilerplate's app/pages/dashboard/ui-kit.vue +
// components/ui-kit/{FoundationsPanel,FinderToolbar,CatalogCard,InstallCommand}.vue
// and composables/useUiCatalog.ts: foundations reference, search by name or
// use case, category/status filters synced to the URL (?q=&cat=&status=),
// a result count and one card per component with where the app uses it and
// its install command.
//
// The catalog lists what this repo ships (src/app/components/ui + blocks)
// plus the rest of the Angular registry as "Available". Data comes from
// src/app/core/ui-catalog (regenerate with `npm run catalog:scan`).
// Each installed primitive's card mounts a live demo via @defer (on viewport).
import { ChangeDetectionStrategy, Component, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { TranslatePipe } from '@ngx-translate/core'
import { Check, ChevronDown, Copy, ExternalLink, LucideAngularModule, Search, SearchX, Star } from 'lucide-angular'
import { I18nService, injectPageTitle } from '@/app/core/i18n'
import { routeLabel } from '@/app/core/dashboard/breadcrumb-labels'
import {
  buildCatalog,
  CATALOG_CATEGORIES,
  CATALOG_STATUSES,
  searchCatalog,
  type CatalogCategory,
  type CatalogEntry,
  type CatalogStatus,
  type SnapshotItem,
} from '@/app/core/ui-catalog/catalog'
import { CURATED, CURATED_BLOCKS } from '@/app/core/ui-catalog/curated'
import snapshot from '@/app/core/ui-catalog/registry.snapshot.json'
import usage from '@/app/core/ui-catalog/usage.generated.json'
import { UiBadgeComponent } from '@/app/components/ui/badge/badge.component'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import {
  UiCardActionComponent,
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardFooterComponent,
  UiCardHeaderComponent,
} from '@/app/components/ui/card/card.component'
import {
  UiCollapsibleComponent,
  UiCollapsibleContentComponent,
  UiCollapsibleTriggerComponent,
} from '@/app/components/ui/collapsible/collapsible.component'
import { UiEmptyStateComponent } from '@/app/components/ui/empty-state/empty-state.component'
import { UiInputComponent } from '@/app/components/ui/input/input.component'
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
import { UiToggleGroupComponent, UiToggleGroupItemComponent } from '@/app/components/ui/toggle-group/toggle-group.component'
import { UiSkeletonComponent } from '@/app/components/ui/skeleton/skeleton.component'
import { UiKitDemoComponent } from './ui-kit-demos'
import { UiKitChartsDemoComponent } from './ui-kit-demo-charts'
import { UiKitMapDemoComponent } from './ui-kit-demo-map'

const ENTRIES = buildCatalog({
  snapshot: snapshot.items as SnapshotItem[],
  curated: CURATED,
  curatedBlocks: CURATED_BLOCKS,
  usage,
})

/** i18n key suffix for a category: 'data-display' -> 'dataDisplay'. */
const categoryKey = (c: CatalogCategory | 'all') => c.replace(/-(\w)/g, (_, ch: string) => ch.toUpperCase())

const STATUS_VARIANT = { 'installed': 'success', 'demo-only': 'warning', 'available': 'outline' } as const
const STATUS_KEY = { 'installed': 'installed', 'demo-only': 'demoOnly', 'available': 'available' } as const
const USED_IN_LIMIT = 8

/** Installed primitives with a live demo (ui-kit-demos*.ts). Kept here, not in
 * the demo files, so importing it doesn't pull the deferred chunks in eagerly. */
const DEMO_NAMES = new Set([
  'accordion', 'avatar', 'badge', 'breadcrumb', 'button', 'calendar', 'card', 'charts', 'checkbox', 'collapsible',
  'command', 'context-menu', 'data-list', 'dialog', 'dropdown-menu', 'empty-state', 'file-upload', 'form', 'icon-box',
  'input', 'kpi-grid', 'label', 'leaflet-map', 'overlay-scroll', 'page', 'pin-input', 'popover', 'progress',
  'radio-group', 'range-calendar', 'section-card', 'select', 'separator', 'sheet', 'sidebar', 'skeleton', 'slider',
  'sonner', 'switch', 'table', 'tabs', 'textarea', 'theme-switch', 'toggle', 'toggle-group', 'tooltip', 'tour',
])

interface UsedInLink {
  label: string
  /** Absent for layouts, the app shell and dynamic routes. */
  to?: string
}

// Rendered from the design rules. Swatch classes resolve to the theme's CSS
// variables, so they follow light/dark live.
const COLOR_GROUPS = [
  {
    key: 'neutrals',
    swatches: [
      { token: 'background', class: 'bg-background' },
      { token: 'card', class: 'bg-card' },
      { token: 'muted', class: 'bg-muted' },
      { token: 'accent', class: 'bg-accent' },
      { token: 'border', class: 'bg-border' },
      { token: 'muted-foreground', class: 'bg-muted-foreground' },
      { token: 'foreground', class: 'bg-foreground' },
    ],
  },
  {
    key: 'primary',
    swatches: [
      { token: 'primary', class: 'bg-primary' },
      { token: 'primary-foreground', class: 'bg-primary-foreground' },
      { token: 'ring', class: 'bg-ring' },
    ],
  },
  {
    key: 'status',
    swatches: [
      { token: 'success', class: 'bg-success' },
      { token: 'warning', class: 'bg-warning' },
      { token: 'info', class: 'bg-info' },
      { token: 'destructive', class: 'bg-destructive' },
    ],
  },
  {
    key: 'chart',
    swatches: [
      { token: 'chart-1', class: 'bg-chart-1' },
      { token: 'chart-2', class: 'bg-chart-2' },
      { token: 'chart-3', class: 'bg-chart-3' },
      { token: 'chart-4', class: 'bg-chart-4' },
      { token: 'chart-5', class: 'bg-chart-5' },
    ],
  },
]

const TYPE_ROLES = [
  { key: 'h1', classes: 'text-2xl font-semibold tracking-tight', sample: 'Projects' },
  { key: 'cardTitle', classes: 'text-base font-semibold', sample: 'Monthly revenue' },
  { key: 'body', classes: 'text-sm', sample: 'Invoices are sent on the 1st.' },
  { key: 'meta', classes: 'text-xs text-muted-foreground', sample: 'Updated 2 min ago' },
  { key: 'eyebrow', classes: 'text-xs font-medium uppercase tracking-wider text-muted-foreground', sample: 'Active users' },
  { key: 'metric', classes: 'text-2xl font-semibold tracking-tight tabular-nums', sample: '$84,230' },
]

const GAPS = [
  { key: 'inline', token: 'gap-1.5 / gap-2', bar: 'w-2' },
  { key: 'field', token: 'gap-2', bar: 'w-2' },
  { key: 'card', token: 'gap-4 / space-y-4', bar: 'w-4' },
  { key: 'section', token: 'gap-4 / space-y-4', bar: 'w-6' },
]

const ICON_SIZES = [
  { key: 'xs', token: 'size-3.5' },
  { key: 'sm', token: 'size-4' },
  { key: 'box', token: 'size-5' },
  { key: 'empty', token: 'size-10' },
]

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-ui-kit',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    LucideAngularModule,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardActionComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardFooterComponent,
    UiCardHeaderComponent,
    UiCollapsibleComponent,
    UiCollapsibleContentComponent,
    UiCollapsibleTriggerComponent,
    UiEmptyStateComponent,
    UiInputComponent,
    UiPageBodyComponent,
    UiPageComponent,
    UiPageHeaderComponent,
    UiPageHeaderHeadingComponent,
    UiSelectComponent,
    UiSelectContentComponent,
    UiSelectItemComponent,
    UiSelectTriggerComponent,
    UiSelectValueComponent,
    UiToggleGroupComponent,
    UiToggleGroupItemComponent,
    UiSkeletonComponent,
    UiKitDemoComponent,
    UiKitChartsDemoComponent,
    UiKitMapDemoComponent,
  ],
  template: `
    <ui-page>
      <ui-page-header>
        <ui-page-header-heading [title]="pageTitle()" [description]="'uiKit.description' | translate" />
      </ui-page-header>

      <ui-page-body class="space-y-4">
        <!-- Foundations: collapsed by default; search is the page's main job. -->
        <ui-collapsible #foundations="uiCollapsible">
          <ui-card>
            <button
              ui-collapsible-trigger
              type="button"
              class="hover:bg-muted/50 focus-visible:ring-ring w-full rounded-[inherit] text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <ui-card-header>
                <h2 class="text-base leading-none font-semibold tracking-tight">{{ 'uiKit.foundations.title' | translate }}</h2>
                <ui-card-description>{{ 'uiKit.foundations.description' | translate }}</ui-card-description>
                <ui-card-action class="self-center">
                  <lucide-icon
                    [img]="ChevronDownIcon"
                    [class]="'text-muted-foreground size-4 shrink-0 transition-transform duration-200' + (foundations.isOpen ? ' rotate-180' : '')"
                    aria-hidden="true"
                  />
                </ui-card-action>
              </ui-card-header>
            </button>
            <ui-collapsible-content>
              <ui-card-content class="space-y-4 p-4 pt-0">
                <section class="space-y-2">
                  <h3 class="text-muted-foreground text-xs font-medium tracking-wider uppercase">{{ 'uiKit.foundations.colour' | translate }}</h3>
                  <p class="text-muted-foreground max-w-3xl text-xs">{{ 'uiKit.foundations.colourRule' | translate }}</p>
                  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    @for (group of colorGroups; track group.key) {
                      <div class="space-y-2">
                        <p class="text-xs font-medium">{{ 'uiKit.foundations.' + group.key | translate }}</p>
                        <ul class="flex flex-wrap gap-2">
                          @for (s of group.swatches; track s.token) {
                            <li class="flex w-20 flex-col gap-1">
                              <span [class]="'h-8 w-full rounded-md border ' + s.class" aria-hidden="true"></span>
                              <code class="text-muted-foreground font-mono text-xs">{{ s.token }}</code>
                            </li>
                          }
                        </ul>
                      </div>
                    }
                  </div>
                </section>

                <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <section class="space-y-2">
                    <h3 class="text-muted-foreground text-xs font-medium tracking-wider uppercase">{{ 'uiKit.foundations.type' | translate }}</h3>
                    <ul class="space-y-2">
                      @for (role of typeRoles; track role.key) {
                        <li class="flex items-baseline justify-between gap-2">
                          <span [class]="'truncate ' + role.classes">{{ role.sample }}</span>
                          <span class="text-muted-foreground shrink-0 text-xs">{{ 'uiKit.foundations.roles.' + role.key | translate }}</span>
                        </li>
                      }
                    </ul>
                  </section>
                  <section class="space-y-2">
                    <h3 class="text-muted-foreground text-xs font-medium tracking-wider uppercase">{{ 'uiKit.foundations.spacing' | translate }}</h3>
                    <ul class="space-y-1.5">
                      @for (g of gaps; track g.key) {
                        <li class="flex items-center gap-2 text-xs">
                          <span [class]="'bg-primary h-3 shrink-0 rounded-sm ' + g.bar" aria-hidden="true"></span>
                          <code class="font-mono">{{ g.token }}</code>
                          <span class="text-muted-foreground ml-auto">{{ 'uiKit.foundations.gaps.' + g.key | translate }}</span>
                        </li>
                      }
                    </ul>
                  </section>
                  <section class="space-y-2">
                    <h3 class="text-muted-foreground text-xs font-medium tracking-wider uppercase">{{ 'uiKit.foundations.icons' | translate }}</h3>
                    <ul class="space-y-1.5">
                      @for (i of iconSizes; track i.key) {
                        <li class="flex items-center gap-2 text-xs">
                          <span class="flex w-10 shrink-0 justify-center">
                            <lucide-icon [img]="StarIcon" [class]="i.token" aria-hidden="true" />
                          </span>
                          <code class="font-mono">{{ i.token }}</code>
                          <span class="text-muted-foreground ml-auto">{{ 'uiKit.foundations.iconUses.' + i.key | translate }}</span>
                        </li>
                      }
                    </ul>
                  </section>
                </div>
              </ui-card-content>
            </ui-collapsible-content>
          </ui-card>
        </ui-collapsible>

        <!-- Finder toolbar -->
        <div class="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div class="relative min-w-0 flex-1">
            <lucide-icon
              [img]="SearchIcon"
              class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <ui-input
              type="search"
              class="pl-9"
              [placeholder]="'uiKit.toolbar.searchPlaceholder' | translate"
              [aria-label]="'uiKit.toolbar.searchLabel' | translate"
              [value]="draft()"
              (valueChange)="onDraft($event)"
            />
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <ui-select [value]="category()" (valueChange)="setQuery('cat', $event)">
              <button ui-select-trigger class="w-full sm:w-48" [attr.aria-label]="'uiKit.toolbar.category' | translate">
                <ui-select-value />
              </button>
              <ui-select-content>
                <ui-select-item value="all">{{ 'uiKit.category.all' | translate }}</ui-select-item>
                @for (c of categories; track c) {
                  <ui-select-item [value]="c">{{ 'uiKit.category.' + categoryKey(c) | translate }}</ui-select-item>
                }
              </ui-select-content>
            </ui-select>
            <ui-toggle-group
              type="single"
              variant="outline"
              size="sm"
              [value]="status()"
              [attr.aria-label]="'uiKit.toolbar.status' | translate"
              (valueChange)="$event && setQuery('status', $event)"
            >
              @for (opt of statusOptions; track opt.value) {
                <button ui-toggle-group-item [value]="opt.value" class="px-3 text-xs">{{ 'uiKit.status.' + opt.key | translate }}</button>
              }
            </ui-toggle-group>
            <p class="text-muted-foreground text-xs tabular-nums" aria-live="polite">{{ resultsLabel() }}</p>
          </div>
        </div>

        @if (!results().length) {
          <ui-empty-state
            [icon]="searchXIcon"
            [title]="'uiKit.empty.title' | translate"
            [description]="'uiKit.empty.description' | translate"
            headingTag="h2"
          >
            <ng-template #searchXIcon><lucide-icon [img]="SearchXIcon" /></ng-template>
            <button ui-button variant="outline" size="sm" class="mt-4" (click)="clearFilters()">{{ 'uiKit.empty.clear' | translate }}</button>
          </ui-empty-state>
        } @else {
          <div class="grid items-start gap-4 xl:grid-cols-2">
            @for (entry of results(); track entry.kind + ':' + entry.name) {
              <ui-card [id]="entry.name" class="scroll-mt-20">
                <ui-card-header class="gap-2 space-y-0 p-4 pb-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="text-base leading-none font-semibold tracking-tight">
                      <a
                        [routerLink]="[]"
                        [fragment]="entry.name"
                        queryParamsHandling="preserve"
                        class="focus-visible:ring-ring rounded-sm hover:underline focus-visible:ring-2 focus-visible:outline-none"
                      >{{ entry.title }}</a>
                    </h3>
                    <code class="text-muted-foreground font-mono text-xs">{{ entry.name }}</code>
                    <div class="ml-auto flex items-center gap-1.5">
                      <ui-badge variant="secondary">{{ 'uiKit.category.' + categoryKey(entry.category) | translate }}</ui-badge>
                      <ui-badge [variant]="statusVariant[entry.status]">{{ 'uiKit.status.' + statusKey[entry.status] | translate }}</ui-badge>
                    </div>
                  </div>
                  <ui-card-description class="text-sm">{{ entry.whenToUse ?? entry.description }}</ui-card-description>
                  @if (entry.whenToUse && entry.description) {
                    <p class="text-muted-foreground line-clamp-2 text-xs">{{ entry.description }}</p>
                  }
                </ui-card-header>

                <ui-card-content class="space-y-4 p-4">
                  <!-- Live demo, loaded when the card scrolls into view. Charts
                       and the map get their own defer blocks (= own chunks). -->
                  @if (entry.kind === 'ui' && demoNames.has(entry.name)) {
                    <div class="bg-background min-h-24 rounded-lg border p-4" role="group" [attr.aria-label]="'uiKit.card.demo' | translate">
                      @if (entry.name === 'charts') {
                        @defer (on viewport) {
                          <app-ui-kit-demo-charts />
                        } @placeholder {
                          <div class="space-y-2" [attr.aria-label]="'uiKit.card.loadingDemo' | translate">
                            <ui-skeleton class="h-4 w-1/3" />
                            <ui-skeleton class="h-16 w-full" />
                          </div>
                        }
                      } @else if (entry.name === 'leaflet-map') {
                        @defer (on viewport) {
                          <app-ui-kit-demo-map />
                        } @placeholder {
                          <div class="space-y-2" [attr.aria-label]="'uiKit.card.loadingDemo' | translate">
                            <ui-skeleton class="h-4 w-1/3" />
                            <ui-skeleton class="h-16 w-full" />
                          </div>
                        }
                      } @else {
                        @defer (on viewport) {
                          <app-ui-kit-demo [name]="entry.name" />
                        } @placeholder {
                          <div class="space-y-2" [attr.aria-label]="'uiKit.card.loadingDemo' | translate">
                            <ui-skeleton class="h-4 w-1/3" />
                            <ui-skeleton class="h-16 w-full" />
                          </div>
                        }
                      }
                    </div>
                  }

                  @if (entry.partOf) {
                    <p class="text-muted-foreground text-xs">
                      <a
                        [routerLink]="[]"
                        [fragment]="entry.partOf"
                        queryParamsHandling="preserve"
                        class="text-foreground underline-offset-4 hover:underline"
                      >{{ 'uiKit.card.partOf' | translate }}</a>
                    </p>
                  }

                  @if (entry.status !== 'available') {
                    <div class="space-y-2">
                      <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">{{ 'uiKit.card.usedIn' | translate }}</p>
                      @if (!entry.usedIn.length) {
                        <p class="text-muted-foreground text-xs">{{ 'uiKit.card.notUsed' | translate }}</p>
                      } @else {
                        <ul class="flex flex-wrap gap-1.5">
                          @for (link of visibleUsedIn(entry); track link.label) {
                            <li>
                              @if (link.to) {
                                <a
                                  [routerLink]="link.to"
                                  class="hover:bg-accent focus-visible:ring-ring inline-flex rounded-md border px-2 py-0.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                >{{ link.label }}</a>
                              } @else {
                                <span class="text-muted-foreground inline-flex rounded-md border border-dashed px-2 py-0.5 text-xs">{{ link.label }}</span>
                              }
                            </li>
                          }
                          @if (entry.usedIn.length > usedInLimit && !expanded().has(entry.name)) {
                            <li>
                              <button
                                type="button"
                                class="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex rounded-md px-2 py-0.5 text-xs tabular-nums focus-visible:ring-2 focus-visible:outline-none"
                                (click)="expand(entry.name)"
                              >+{{ entry.usedIn.length - usedInLimit }}</button>
                            </li>
                          }
                        </ul>
                      }
                    </div>
                  }

                  <div class="space-y-2">
                    <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                      {{ (entry.installCmd ? 'uiKit.card.install' : 'uiKit.card.source') | translate }}
                    </p>
                    @if (entry.installCmd; as cmd) {
                      <div class="bg-muted flex items-center gap-2 rounded-md py-1 pr-1 pl-3">
                        <code class="text-muted-foreground min-w-0 flex-1 truncate font-mono text-xs">{{ cmd }}</code>
                        <button
                          ui-button
                          variant="ghost"
                          size="icon-sm"
                          class="shrink-0"
                          [attr.aria-label]="(copied() === cmd ? 'uiKit.card.copied' : 'uiKit.card.copy') | translate"
                          (click)="copy(cmd)"
                        >
                          <lucide-icon
                            [img]="copied() === cmd ? CheckIcon : CopyIcon"
                            [class]="'size-4' + (copied() === cmd ? ' text-success' : '')"
                            aria-hidden="true"
                          />
                        </button>
                        <span class="sr-only" aria-live="polite">{{ copied() === cmd ? ('uiKit.card.copied' | translate) : '' }}</span>
                      </div>
                    } @else {
                      <p class="text-muted-foreground text-xs">
                        @if (entry.kind === 'block') {
                          {{ 'uiKit.card.localBlock' | translate }}
                        }
                        <code class="font-mono">{{ entry.kind === 'ui' ? 'src/app/components/ui/' + entry.name + '/' : 'src/app/components/blocks/' + entry.file }}</code>
                      </p>
                    }
                  </div>
                </ui-card-content>

                @if (entry.docsUrl) {
                  <ui-card-footer class="p-4 pt-0">
                    <a ui-button variant="ghost" size="sm" class="text-muted-foreground -ml-2" [href]="entry.docsUrl" target="_blank" rel="noopener">
                      {{ 'uiKit.card.docs' | translate }}
                      <lucide-icon [img]="ExternalLinkIcon" class="size-4" aria-hidden="true" />
                    </a>
                  </ui-card-footer>
                }
              </ui-card>
            }
          </div>
        }
      </ui-page-body>
    </ui-page>
  `,
})
export class DashboardUiKitComponent {
  protected readonly ChevronDownIcon = ChevronDown
  protected readonly StarIcon = Star
  protected readonly SearchIcon = Search
  protected readonly SearchXIcon = SearchX
  protected readonly CopyIcon = Copy
  protected readonly CheckIcon = Check
  protected readonly ExternalLinkIcon = ExternalLink

  protected readonly colorGroups = COLOR_GROUPS
  protected readonly typeRoles = TYPE_ROLES
  protected readonly gaps = GAPS
  protected readonly iconSizes = ICON_SIZES
  protected readonly categories = CATALOG_CATEGORIES
  protected readonly categoryKey = categoryKey
  protected readonly statusVariant = STATUS_VARIANT
  protected readonly statusKey = STATUS_KEY
  protected readonly usedInLimit = USED_IN_LIMIT
  protected readonly demoNames = DEMO_NAMES
  protected readonly statusOptions: { value: CatalogStatus | 'all', key: string }[] = [
    { value: 'all', key: 'all' },
    { value: 'installed', key: 'installed' },
    { value: 'available', key: 'available' },
    { value: 'demo-only', key: 'demoOnly' },
  ]

  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly i18n = inject(I18nService)
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID))

  readonly pageTitle = injectPageTitle()

  // Filters live in the URL so a search can be shared and survives reload.
  private readonly query = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap })
  readonly q = computed(() => this.query().get('q') ?? '')
  readonly category = computed<CatalogCategory | 'all'>(() => {
    const v = this.query().get('cat') as CatalogCategory | null
    return v && CATALOG_CATEGORIES.includes(v) ? v : 'all'
  })
  readonly status = computed<CatalogStatus | 'all'>(() => {
    const v = this.query().get('status') as CatalogStatus | null
    return v && CATALOG_STATUSES.includes(v) ? v : 'all'
  })

  readonly results = computed(() => searchCatalog(ENTRIES, { q: this.q(), category: this.category(), status: this.status() }))
  readonly resultsLabel = computed(() => {
    this.i18n.lang()
    return this.i18n.tc('uiKit.toolbar.results', this.results().length, { count: this.results().length })
  })

  // Type into a local draft; push to the URL once typing pauses.
  readonly draft = signal(this.q())
  private draftTimer: ReturnType<typeof setTimeout> | undefined

  constructor() {
    // Deep links (#range-calendar) scroll to the card once it has rendered.
    afterNextRender(() => {
      const id = this.route.snapshot.fragment
      if (id) document.getElementById(id)?.scrollIntoView({ block: 'start' })
    })
  }

  readonly expanded = signal<ReadonlySet<string>>(new Set())
  readonly copied = signal<string | null>(null)
  private copiedTimer: ReturnType<typeof setTimeout> | undefined

  private readonly usedInLinks = computed(() => {
    this.i18n.lang()
    const t = (k: string, p?: Record<string, string | number>) => this.i18n.t(k, p)
    const cache = new Map<string, UsedInLink>()
    const link = (key: string): UsedInLink => {
      if (key.startsWith('layout:')) return { label: t('uiKit.card.layout', { name: key.slice(7) }) }
      if (key === 'app:root') return { label: t('uiKit.card.appShell') }
      if (key.includes(':')) return { label: key }
      return { label: key === '/' ? t('uiKit.card.home') : routeLabel(key, t), to: key }
    }
    return (key: string) => {
      if (!cache.has(key)) cache.set(key, link(key))
      return cache.get(key)!
    }
  })

  visibleUsedIn(entry: CatalogEntry): UsedInLink[] {
    const keys = this.expanded().has(entry.name) ? entry.usedIn : entry.usedIn.slice(0, USED_IN_LIMIT)
    const resolve = this.usedInLinks()
    return keys.map(resolve)
  }

  expand(name: string): void {
    this.expanded.update(s => new Set(s).add(name))
  }

  onDraft(value: string): void {
    this.draft.set(value)
    clearTimeout(this.draftTimer)
    this.draftTimer = setTimeout(() => this.setQuery('q', value.trim()), 200)
  }

  setQuery(key: 'q' | 'cat' | 'status', value: string): void {
    const fallback = key === 'q' ? '' : 'all'
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [key]: value && value !== fallback ? value : null },
      queryParamsHandling: 'merge',
      preserveFragment: true,
      replaceUrl: true,
    })
  }

  clearFilters(): void {
    this.draft.set('')
    void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true })
  }

  copy(cmd: string): void {
    if (!this.isBrowser) return
    navigator.clipboard?.writeText(cmd).then(() => {
      this.copied.set(cmd)
      clearTimeout(this.copiedTimer)
      this.copiedTimer = setTimeout(() => this.copied.set(null), 1500)
    }).catch(() => undefined)
  }
}
