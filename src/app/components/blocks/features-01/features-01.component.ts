// Interactive enterprise product feature workbench with live module simulations,
// dynamic directory filters, real-time payroll calculations, continuous SOC 2
// compliance verification, and a TypeScript API code viewer. Port of the React block 1:1.
import { ChangeDetectionStrategy, Component, DestroyRef, Input, computed, inject, signal } from '@angular/core'
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  Globe,
  Layers,
  LucideAngularModule,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  Wallet,
  type LucideIconData,
} from 'lucide-angular'
import { cn } from '@/app/core/utils/cn'
import { UiBadgeComponent } from '@/app/components/ui/badge/badge.component'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardFooterComponent,
  UiCardHeaderComponent,
} from '@/app/components/ui/card/card.component'
import { UiInputComponent } from '@/app/components/ui/input/input.component'
import { UiSeparatorComponent } from '@/app/components/ui/separator/separator.component'

export type FeatureCategory = 'core' | 'dx' | 'security' | 'ai'
export type FeatureFilter = 'all' | FeatureCategory
export type PreviewType = 'directory' | 'payroll' | 'performance' | 'compliance' | 'api' | 'copilot'

export interface FeatureModule {
  id: string
  title: string
  category: FeatureCategory
  badge: string
  description: string
  icon: LucideIconData
  metrics: { label: string; value: string; trend: string }[]
  previewType: PreviewType
}

const features: FeatureModule[] = [
  {
    id: 'directory',
    title: 'Global Employee Directory',
    category: 'core',
    badge: 'Real-time Sync',
    description:
      'Single source of truth for global teams, reporting hierarchies, custom attributes, and automated SCIM provisioning.',
    icon: Users,
    metrics: [
      { label: 'Sync Latency', value: '<12ms', trend: 'P99 Edge' },
      { label: 'SCIM Connectors', value: '24+', trend: 'Okta/Google' },
      { label: 'Export Formats', value: 'JSON/CSV', trend: 'Bi-directional' },
    ],
    previewType: 'directory',
  },
  {
    id: 'payroll',
    title: 'Multi-Currency Global Payroll',
    category: 'core',
    badge: 'Automated Tax',
    description:
      'Instant payroll calculation across 140+ countries with automated localized tax withholding, statutory benefits, and direct FX routing.',
    icon: Wallet,
    metrics: [
      { label: 'Supported Currencies', value: '140+', trend: 'Live FX' },
      { label: 'Settlement Time', value: 'Instant', trend: 'SEPA/FedNow' },
      { label: 'Tax Accuracy', value: '100%', trend: 'Statutory Verified' },
    ],
    previewType: 'payroll',
  },
  {
    id: 'performance',
    title: 'OKR & Continuous Reviews',
    category: 'dx',
    badge: '360 Calibration',
    description:
      'Transparent objective tracking, real-time 1:1 syncs, and peer review cycles tied directly to engineering and business milestones.',
    icon: BarChart3,
    metrics: [
      { label: 'Cycle Completion', value: '98.4%', trend: '+14% vs avg' },
      { label: 'Review Latency', value: '2.1 days', trend: '-40% faster' },
      { label: 'Goal Alignment', value: '94%', trend: 'Company-wide' },
    ],
    previewType: 'performance',
  },
  {
    id: 'compliance',
    title: 'SOC 2 & Continuous Compliance',
    category: 'security',
    badge: 'Zero Trust',
    description:
      'Continuous automated evidence collection across AWS, GCP, Cloudflare, and GitHub with automated auditor-ready export bundles.',
    icon: ShieldCheck,
    metrics: [
      { label: 'Continuous Tests', value: '142 / 142', trend: '100% Pass' },
      { label: 'Evidence Collection', value: 'Automated', trend: 'Every 5m' },
      { label: 'Standards', value: 'SOC2 / HIPAA', trend: 'ISO 27001' },
    ],
    previewType: 'compliance',
  },
  {
    id: 'api',
    title: 'REST & GraphQL Developer APIs',
    category: 'dx',
    badge: 'Type-Safe SDKs',
    description:
      'Fully typed OpenAPI 3.1 & TypeScript SDKs with sub-millisecond edge response times, webhooks, and granular scoped API keys.',
    icon: Code2,
    metrics: [
      { label: 'API Median Latency', value: '18ms', trend: 'Global Edge' },
      { label: 'Webhook Delivery', value: '99.98%', trend: 'Automatic Retry' },
      { label: 'Rate Limit', value: '10k req/s', trend: 'Configurable' },
    ],
    previewType: 'api',
  },
  {
    id: 'copilot',
    title: 'Autonomous People Ops Copilot',
    category: 'ai',
    badge: 'Agentic AI',
    description:
      'Natural language queries over workforce data, intelligent anomaly detection in compensation bands, and automated policy drafts.',
    icon: Bot,
    metrics: [
      { label: 'Inference Speed', value: '94 tps', trend: 'Claude 3.5' },
      { label: 'Accuracy Score', value: '99.6%', trend: 'RAG Grounded' },
      { label: 'Task Automation', value: '78%', trend: 'Self-serve' },
    ],
    previewType: 'copilot',
  },
]

const categories: { id: FeatureFilter; label: string }[] = [
  { id: 'all', label: 'All Modules' },
  { id: 'core', label: 'Core Platform' },
  { id: 'dx', label: 'Developer DX' },
  { id: 'security', label: 'Security' },
  { id: 'ai', label: 'Agentic AI' },
]

interface Employee {
  id: string
  name: string
  role: string
  team: string
  status: string
  location: string
}

const employees: Employee[] = [
  {
    id: '1',
    name: 'Sophia Chen',
    role: 'Staff Design Engineer',
    team: 'Design Systems',
    status: 'Active',
    location: 'San Francisco, CA',
  },
  {
    id: '2',
    name: 'Marcus Vance',
    role: 'Principal Distributed Systems',
    team: 'Core Infrastructure',
    status: 'Active',
    location: 'London, UK',
  },
  {
    id: '3',
    name: 'Elena Rostova',
    role: 'Lead Security Architect',
    team: 'SecOps',
    status: 'In Review',
    location: 'Berlin, DE',
  },
  {
    id: '4',
    name: 'Devon Taylor',
    role: 'Head of Product',
    team: 'Enterprise Suite',
    status: 'Active',
    location: 'New York, NY',
  },
]

const teamOptions = ['All Roles', 'Design Systems', 'Core Infrastructure', 'SecOps', 'Enterprise Suite']

const complianceControls = [
  { name: 'TLS 1.3 Strict Transport Security', framework: 'SOC 2 / ISO 27001', passed: true, score: '100%' },
  { name: 'Continuous Automated Evidence Sync', framework: 'HIPAA Security Rule', passed: true, score: '99.8%' },
  { name: 'Hardware Security Keys MFA Enforced', framework: 'Zero Trust Baseline', passed: true, score: '100%' },
  { name: 'Automated Ephemeral DB Credential TTL', framework: 'SOC 2 CC6.1', passed: true, score: '99.4%' },
]

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-features-01, [ui-features-01]',
  standalone: true,
  // React renders the root <section> itself: the host stays out of layout and `class` goes to the root.
  host: { '[attr.class]': '"contents"' },
  imports: [
    LucideAngularModule,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardFooterComponent,
    UiCardHeaderComponent,
    UiInputComponent,
    UiSeparatorComponent,
  ],
  template: `
    <section data-slot="features-01" [class]="rootClass">
      <div class="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
        <!-- Section Header -->
        <div class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div class="max-w-2xl space-y-3">
            <div class="inline-flex items-center gap-2">
              <span
                ui-badge
                variant="secondary"
                class="gap-1.5 px-2.5 py-1 font-mono text-xs tracking-wide uppercase"
              >
                <lucide-icon [img]="Layers" class="size-3.5" />
                Unified Architecture
              </span>
              <span class="text-muted-foreground font-mono text-xs">v4.2 Enterprise Release</span>
            </div>
            <h2 class="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
              Engineered for High-Velocity Teams.
            </h2>
            <p class="text-muted-foreground text-base leading-relaxed sm:text-lg">
              Six modular, composable building blocks that directly interconnect without third-party glue code.
            </p>
          </div>

          <!-- Category Filters -->
          <div class="bg-muted/60 border-border flex flex-wrap items-center gap-1.5 rounded-lg border p-1">
            @for (cat of allCategories; track cat.id) {
              <button type="button" [class]="filterButtonClass(cat.id)" (click)="setActiveCategory(cat.id)">
                {{ cat.label }}
              </button>
            }
          </div>
        </div>

        <!-- Main Interactive Workbench Layout -->
        <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <!-- Feature Cards Navigation (5 Cols) -->
          <div class="space-y-3 lg:col-span-5">
            @for (item of filteredFeatures(); track item.id) {
              <div [class]="featureCardClass(item.id)" (click)="selectFeature(item.id)">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <div [class]="featureIconClass(item.id)">
                      <lucide-icon [img]="item.icon" class="size-4.5" />
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <h3 class="text-foreground text-sm font-semibold tracking-tight">{{ item.title }}</h3>
                        <span ui-badge variant="secondary" class="px-1.5 py-0 text-xs font-normal">
                          {{ item.badge }}
                        </span>
                      </div>
                      <p class="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                        {{ item.description }}
                      </p>
                    </div>
                  </div>
                  <lucide-icon [img]="ChevronRight" [class]="chevronClass(item.id)" />
                </div>

                <!-- Key metrics row in card -->
                @if (selectedFeatureId() === item.id) {
                  <div class="border-border/60 mt-4 grid grid-cols-3 gap-2 border-t pt-3">
                    @for (m of item.metrics; track m.label) {
                      <div class="space-y-0.5">
                        <p class="text-muted-foreground font-mono text-xs tracking-wider uppercase">{{ m.label }}</p>
                        <div class="flex items-baseline gap-1">
                          <span class="text-foreground text-xs font-semibold">{{ m.value }}</span>
                          <span class="text-success font-mono text-xs">{{ m.trend }}</span>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>

          <!-- Live Interactive Simulation Canvas (7 Cols) -->
          <div class="lg:col-span-7">
            <div ui-card class="bg-card border-border sticky top-6 overflow-hidden shadow-sm">
              <!-- Workbench Header Bar -->
              <div
                ui-card-header
                class="border-border bg-muted/20 flex-row items-center justify-between space-y-0 border-b px-5 py-3.5"
              >
                <div class="flex items-center gap-2.5">
                  <div class="bg-success flex size-2 rounded-full"></div>
                  <span class="text-muted-foreground font-mono text-xs tracking-wider uppercase"
                    >Interactive Simulation</span
                  >
                  <ui-separator orientation="vertical" class="h-3.5" />
                  <span class="text-foreground text-xs font-semibold">{{ activeFeature().title }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    ui-button
                    variant="outline"
                    size="sm"
                    class="h-7 gap-1.5 px-2.5 font-mono text-xs"
                    (click)="copySnippet()"
                  >
                    @if (copied()) {
                      <lucide-icon [img]="Check" class="text-success size-3" />
                    } @else {
                      <lucide-icon [img]="Copy" class="size-3" />
                    }
                    <span>{{ copied() ? 'Copied' : 'Schema JSON' }}</span>
                  </button>
                </div>
              </div>

              <div ui-card-content class="space-y-6 p-6">
                <!-- Simulation 1: Global Employee Directory -->
                @if (activeFeature().previewType === 'directory') {
                  <div class="space-y-4">
                    <div class="flex flex-col items-center justify-between gap-3 sm:flex-row">
                      <div class="relative w-full sm:w-64">
                        <lucide-icon [img]="Search" class="text-muted-foreground absolute top-2.5 left-2.5 size-3.5" />
                        <ui-input
                          [value]="searchQuery()"
                          (valueChange)="searchQuery.set($event)"
                          placeholder="Search 1,420 employees..."
                          class="h-8 pl-8 font-sans text-xs"
                        />
                      </div>
                      <div class="flex items-center gap-2 self-end sm:self-auto">
                        <span class="text-muted-foreground font-mono text-xs">Filter Team:</span>
                        <select
                          [value]="selectedTeam()"
                          (change)="selectedTeam.set($any($event.target).value)"
                          class="border-input bg-background text-foreground focus:ring-ring h-8 rounded-md border px-2 py-1 text-xs focus:ring-1 focus:outline-none"
                        >
                          @for (team of allTeams; track team) {
                            <option [value]="team">
                              {{ team === 'All Roles' ? 'All Teams' : team }}
                            </option>
                          }
                        </select>
                      </div>
                    </div>

                    <div class="border-border divide-border bg-background divide-y overflow-hidden rounded-lg border">
                      @for (emp of filteredEmployees(); track emp.id) {
                        <div class="hover:bg-muted/40 flex items-center justify-between p-3 text-xs transition-colors">
                          <div class="flex items-center gap-3">
                            <div
                              class="bg-muted text-muted-foreground border-border flex size-8 items-center justify-center rounded-full border text-xs font-semibold"
                            >
                              {{ initials(emp.name) }}
                            </div>
                            <div>
                              <p class="text-foreground font-medium">{{ emp.name }}</p>
                              <p class="text-muted-foreground text-xs">{{ emp.role }} · {{ emp.team }}</p>
                            </div>
                          </div>
                          <div class="flex items-center gap-3">
                            <span class="text-muted-foreground hidden font-mono text-xs sm:inline-block">{{
                              emp.location
                            }}</span>
                            <span
                              ui-badge
                              variant="outline"
                              class="border-success/20 bg-success/10 text-success font-mono text-xs"
                            >
                              {{ emp.status }}
                            </span>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- Simulation 2: Multi-Currency Global Payroll -->
                @if (activeFeature().previewType === 'payroll') {
                  <div class="space-y-5">
                    <div class="grid grid-cols-3 gap-3">
                      <div class="border-border bg-muted/20 rounded-lg border p-3">
                        <p class="text-muted-foreground font-mono text-xs">Gross Run</p>
                        <p class="text-foreground mt-1 text-lg font-semibold tabular-nums">\${{ grossAmount().toLocaleString() }}</p>
                      </div>
                      <div class="border-border bg-muted/20 rounded-lg border p-3">
                        <p class="text-muted-foreground font-mono text-xs">Statutory Taxes</p>
                        <p class="text-destructive mt-1 text-lg font-semibold tabular-nums">
                          -\${{ Math.round(estimatedDeductions()).toLocaleString() }}
                        </p>
                      </div>
                      <div class="border-border border-success/20 bg-success/10 rounded-lg border p-3">
                        <p class="text-success font-mono text-xs">Net Settlement</p>
                        <p class="text-success mt-1 text-lg font-semibold tabular-nums">
                          \${{ Math.round(netPayout()).toLocaleString() }}
                        </p>
                      </div>
                    </div>

                    <div class="space-y-2">
                      <div class="flex justify-between text-xs">
                        <span class="text-muted-foreground">Adjust Headcount (Employees: {{ headcount() }})</span>
                        <span class="text-foreground font-mono">\${{ avgPerEmployee() }}/mo avg</span>
                      </div>
                      <input
                        [value]="headcount()"
                        (input)="headcount.set($any($event.target).valueAsNumber || $any($event.target).value)"
                        type="range"
                        min="10"
                        max="150"
                        class="bg-muted accent-primary h-1.5 w-full cursor-pointer appearance-none rounded-lg"
                      />
                    </div>

                    <div
                      class="border-border bg-background flex items-center justify-between rounded-lg border p-3 text-xs"
                    >
                      <div class="flex items-center gap-2">
                        <lucide-icon [img]="Globe" class="text-foreground size-4" />
                        <span>Cross-border SEPA & FedNow Instant Payout Batch: Ready</span>
                      </div>
                      <span ui-badge variant="secondary" class="font-mono text-xs">Zero-FX Spread</span>
                    </div>
                  </div>
                }

                <!-- Simulation 3: SOC 2 & Compliance -->
                @if (activeFeature().previewType === 'compliance') {
                  <div class="space-y-4">
                    <div class="flex items-center justify-between text-xs">
                      <span class="text-foreground font-semibold"
                        >Continuous Automated Compliance Check (142 Controls)</span
                      >
                      <span
                        ui-badge
                        variant="outline"
                        class="border-success/20 bg-success/10 text-success font-mono text-xs"
                      >
                        Audit Grade A+
                      </span>
                    </div>

                    <div class="space-y-2.5">
                      @for (ctrl of allControls; track ctrl.name) {
                        <div
                          class="border-border bg-background flex items-center justify-between rounded-lg border p-3 text-xs"
                        >
                          <div class="flex items-center gap-2.5">
                            <lucide-icon [img]="CheckCircle2" class="text-success size-4 shrink-0" />
                            <div>
                              <p class="text-foreground font-medium">{{ ctrl.name }}</p>
                              <p class="text-muted-foreground font-mono text-xs">{{ ctrl.framework }}</p>
                            </div>
                          </div>
                          <span class="text-success font-mono text-xs font-semibold">{{ ctrl.score }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- Simulation 4: Developer APIs & SDKs -->
                @if (activeFeature().previewType === 'api') {
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <span class="text-muted-foreground font-mono text-xs"
                        >curl --request POST https://api.uipkge.dev/v1/workforce</span
                      >
                      <span ui-badge variant="secondary" class="font-mono text-xs">TypeScript SDK</span>
                    </div>
                    <div
                      class="overflow-x-auto rounded-lg border border-border bg-muted p-4 font-mono text-xs leading-relaxed text-foreground"
                    >
                      <span class="text-muted-foreground">// Initialize client with zero-latency edge caching</span
                      ><br />
                      <span class="text-chart-1">import</span> &#123;
                      <span class="text-chart-2">UipkgeClient</span> &#125; <span class="text-chart-1">from</span>
                      <span class="text-success">'&#64;uipkge/sdk'</span><br /><br />
                      <span class="text-chart-1">const</span> client = <span class="text-chart-1">new</span>
                      <span class="text-chart-2">UipkgeClient</span>(&#123; apiKey: process.env.<span class="text-info"
                        >UIPKGE_KEY</span
                      >
                      &#125;)<br /><br />
                      <span class="text-chart-1">const</span> &#123; data &#125; =
                      <span class="text-chart-1">await</span> client.directory.<span class="text-info"
                        >syncOrgChart</span
                      >(&#123;<br />
                      &nbsp;&nbsp;autoProvision: <span class="text-success">true</span>,<br />
                      &nbsp;&nbsp;enforceMfa: <span class="text-success">true</span>,<br />
                      &nbsp;&nbsp;scimSyncInterval: <span class="text-warning">300</span>,<br />
                      &#125;)
                    </div>
                  </div>
                }

                <!-- Simulation 5: AI Copilot & Agentic Ops (also covers performance) -->
                @if (activeFeature().previewType === 'copilot' || activeFeature().previewType === 'performance') {
                  <div class="space-y-4">
                    <div class="space-y-2">
                      <label class="text-foreground text-xs font-medium">Natural Language Workforce Assistant</label>
                      <div class="flex gap-2">
                        <ui-input
                          [value]="copilotPrompt()"
                          (valueChange)="copilotPrompt.set($event)"
                          class="h-9 text-xs"
                          placeholder="Ask copilot to run calculations or compliance checks..."
                        />
                        <button
                          ui-button
                          size="sm"
                          class="h-9 shrink-0 gap-1.5 px-4 text-xs font-semibold"
                          [disabled]="copilotExecuting()"
                          (click)="triggerCopilot()"
                        >
                          @if (copilotExecuting()) {
                            <lucide-icon [img]="RefreshCw" class="size-3.5 animate-spin" />
                          } @else {
                            <lucide-icon [img]="Bot" class="size-3.5" />
                          }
                          Run
                        </button>
                      </div>
                    </div>

                    <div class="border-border bg-muted/20 space-y-2 rounded-lg border p-4">
                      <div class="flex items-center justify-between text-xs">
                        <span class="text-muted-foreground font-mono text-xs">Copilot Real-time Synthesis</span>
                        <span ui-badge variant="outline" class="font-mono text-xs">Claude 3.5 Sonnet</span>
                      </div>
                      <p
                        class="text-foreground bg-background border-border rounded-md border p-3 font-mono text-xs leading-relaxed"
                      >
                        {{ copilotOutput() }}
                      </p>
                    </div>
                  </div>
                }
              </div>

              <div
                ui-card-footer
                class="border-border bg-muted/10 flex items-center justify-between border-t px-5 py-3 text-xs"
              >
                <span class="text-muted-foreground font-mono">Architecture SLA: 99.99% Multi-region Active-Active</span>
                <button ui-button variant="link" size="sm" class="text-primary h-auto gap-1 p-0 text-xs">
                  Explore Full Documentation
                  <lucide-icon [img]="ArrowRight" class="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class UiFeatures01Component {
  protected readonly cn = cn
  protected readonly ArrowRight = ArrowRight
  protected readonly Bot = Bot
  protected readonly Check = Check
  protected readonly CheckCircle2 = CheckCircle2
  protected readonly ChevronRight = ChevronRight
  protected readonly Copy = Copy
  protected readonly Globe = Globe
  protected readonly Layers = Layers
  protected readonly Math = Math
  protected readonly RefreshCw = RefreshCw
  protected readonly Search = Search

  protected readonly allCategories = categories
  protected readonly allTeams = teamOptions
  protected readonly allControls = complianceControls

  @Input() set initialCategory(v: FeatureFilter) {
    if (v === 'all' || categories.some((c) => c.id === v)) this.activeCategory.set(v)
  }
  @Input() set initialFeature(v: string) {
    if (features.some((f) => f.id === v)) this.selectedFeatureId.set(v)
  }
  @Input('class') className?: string

  readonly activeCategory = signal<FeatureFilter>('all')
  readonly selectedFeatureId = signal('directory')
  readonly copied = signal(false)
  private copyTimer: ReturnType<typeof setTimeout> | undefined

  // Directory simulation state
  readonly searchQuery = signal('')
  readonly selectedTeam = signal('All Roles')

  // Payroll simulation state
  readonly grossAmount = signal(184000)
  readonly payrollTaxRate = signal(18.5)
  readonly headcount = signal(42)

  // Copilot simulation state
  readonly copilotPrompt = signal(
    'Generate quarterly SOC2 compliance audit report with automated PR proof attachments.',
  )
  readonly copilotExecuting = signal(false)
  readonly copilotOutput = signal(
    'Audit summary generated. 14 evidence logs compiled across 4 AWS & Cloudflare regions. Zero critical findings.',
  )
  private copilotTimer: ReturnType<typeof setTimeout> | undefined

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.copyTimer)
      clearTimeout(this.copilotTimer)
    })
  }

  readonly filteredFeatures = computed(() => {
    const cat = this.activeCategory()
    if (cat === 'all') return features
    return features.filter((f) => f.category === cat)
  })

  readonly activeFeature = computed(() => features.find((f) => f.id === this.selectedFeatureId()) ?? features[0]!)

  readonly filteredEmployees = computed(() => {
    const q = this.searchQuery().toLowerCase()
    const team = this.selectedTeam()
    return employees.filter((emp) => {
      const matchQuery = emp.name.toLowerCase().includes(q) || emp.role.toLowerCase().includes(q)
      const matchRole = team === 'All Roles' || emp.team === team
      return matchQuery && matchRole
    })
  })

  readonly estimatedDeductions = computed(() => this.grossAmount() * (this.payrollTaxRate() / 100))
  readonly netPayout = computed(() => this.grossAmount() - this.estimatedDeductions())
  readonly avgPerEmployee = computed(() => (this.grossAmount() / this.headcount()).toFixed(0))

  get rootClass(): string {
    return cn('bg-background border-border relative w-full border-y py-16 lg:py-24', this.className)
  }

  filterButtonClass(id: FeatureFilter): string {
    return cn(
      'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
      this.activeCategory() === id
        ? 'bg-background text-foreground font-semibold shadow-xs'
        : 'text-muted-foreground hover:text-foreground',
    )
  }

  featureCardClass(id: string): string {
    return cn(
      'group cursor-pointer rounded-xl border p-4 transition-colors duration-150',
      this.selectedFeatureId() === id
        ? 'bg-card border-primary/40 ring-primary/20 shadow-xs ring-1'
        : 'bg-card/40 border-border hover:bg-card/80 hover:border-border/80',
    )
  }

  featureIconClass(id: string): string {
    return cn(
      'flex size-9 items-center justify-center rounded-lg border transition-colors',
      this.selectedFeatureId() === id
        ? 'bg-primary text-primary-foreground border-primary'
        : 'bg-muted text-muted-foreground border-border group-hover:text-foreground',
    )
  }

  chevronClass(id: string): string {
    return cn(
      'text-muted-foreground size-4 shrink-0 transition-transform',
      this.selectedFeatureId() === id ? 'text-primary translate-x-0.5' : 'group-hover:translate-x-0.5',
    )
  }

  setActiveCategory(cat: FeatureFilter): void {
    this.activeCategory.set(cat)
  }

  selectFeature(id: string): void {
    this.selectedFeatureId.set(id)
  }

  initials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
  }

  async copySnippet(): Promise<void> {
    try {
      await navigator.clipboard.writeText(JSON.stringify(this.activeFeature(), null, 2))
      this.copied.set(true)
      clearTimeout(this.copyTimer)
      this.copyTimer = setTimeout(() => this.copied.set(false), 2000)
    } catch {
      // Clipboard unavailable (e.g. insecure context): leave the label unchanged.
    }
  }

  triggerCopilot(): void {
    this.copilotExecuting.set(true)
    this.copilotOutput.set('Analyzing real-time event bus and compiling cryptographically signed evidence bundle...')
    clearTimeout(this.copilotTimer)
    this.copilotTimer = setTimeout(() => {
      this.copilotOutput.set(
        '✓ SOC 2 Type II bundle validated. 142 controls verified at 100% adherence. Ready for auditor download.',
      )
      this.copilotExecuting.set(false)
    }, 900)
  }
}
