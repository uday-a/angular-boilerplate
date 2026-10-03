// High-density bento grid featuring an interactive AI query copilot workbench,
// real-time edge network telemetry feed, live latency radar, and SOC 2 compliance
// vault status. Port of the React block 1:1.
import { ChangeDetectionStrategy, Component, DestroyRef, Input, computed, inject, signal } from '@angular/core'
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  Globe2,
  Layers,
  LucideAngularModule,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-angular'
import { cn } from '@/app/core/utils/cn'
import { UiBadgeComponent } from '@/app/components/ui/badge/badge.component'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import { UiCardComponent, UiCardContentComponent } from '@/app/components/ui/card/card.component'
import { UiProgressComponent } from '@/app/components/ui/progress/progress.component'

export type BentoEventFilter = 'all' | 'deploy' | 'security' | 'database'

export interface BentoTelemetryEvent {
  id: number
  type: Exclude<BentoEventFilter, 'all'>
  title: string
  latency: string
  time: string
  status: string
}

const liveTelemetryEvents: BentoTelemetryEvent[] = [
  {
    id: 1,
    type: 'deploy',
    title: 'Edge worker edge-us-east-1 deployed',
    latency: '18ms',
    time: '12s ago',
    status: 'healthy',
  },
  {
    id: 2,
    type: 'database',
    title: 'CDC stream synced 42,800 records',
    latency: '4ms',
    time: '34s ago',
    status: 'healthy',
  },
  {
    id: 3,
    type: 'security',
    title: 'Automated mTLS key rotation complete',
    latency: '120ms',
    time: '1m ago',
    status: 'healthy',
  },
  {
    id: 4,
    type: 'deploy',
    title: 'Static asset bundle cached in 32 edge PoPs',
    latency: '8ms',
    time: '2m ago',
    status: 'healthy',
  },
]

const edgeRegions = [
  { code: 'iad1', name: 'US East (N. Virginia)', status: 'Active', latency: '12ms' },
  { code: 'fra1', name: 'EU Central (Frankfurt)', status: 'Active', latency: '18ms' },
  { code: 'hnd1', name: 'AP East (Tokyo)', status: 'Active', latency: '24ms' },
]

const eventFilters: { id: BentoEventFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'deploy', label: 'Deploy' },
  { id: 'database', label: 'Data' },
  { id: 'security', label: 'Security' },
]

const INITIAL_PROMPT = 'Optimize database indexing for high concurrency tenant reads'
const INITIAL_OUTPUT =
  'Generated compound B-Tree index on `(tenant_id, created_at DESC)` reducing p99 latency from 142ms to 6ms.'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-bento-01, [ui-bento-01]',
  standalone: true,
  // React renders the root <section> itself: the host stays out of layout and `class` goes to the root.
  host: { '[attr.class]': '"contents"' },
  imports: [
    LucideAngularModule,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiProgressComponent,
  ],
  template: `
    <section data-slot="bento-01" [class]="rootClass">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-12 max-w-2xl space-y-3">
          <span ui-badge variant="secondary" class="gap-2 px-3 py-1">
            <lucide-icon [img]="Layers" class="size-3.5" />
            <span>Unified Enterprise Architecture</span>
          </span>
          <h2 class="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything your engineering team needs to move at velocity
          </h2>
          <p class="text-muted-foreground text-base sm:text-lg">
            Engineered for extreme performance, continuous security governance, and multi-cloud resilience from day one.
          </p>
        </div>

        <!-- Bento Grid (High Density) -->
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <!-- Tile 1: AI Code & Query Optimization Copilot (Span 2 cols on desktop) -->
          <div
            ui-card
            class="border-border bg-card hover:border-foreground/20 relative overflow-hidden shadow-xs transition-colors duration-200 md:col-span-2"
          >
            <div ui-card-content class="flex h-full flex-col justify-between space-y-6 p-6 sm:p-8">
              <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                  <div class="bg-muted text-foreground flex size-10 items-center justify-center rounded-lg">
                    <lucide-icon [img]="Bot" class="size-5" />
                  </div>
                  <div>
                    <h3 class="text-foreground text-lg font-semibold tracking-tight sm:text-xl">
                      Autonomous AI Query & Performance Copilot
                    </h3>
                    <p class="text-muted-foreground text-xs">
                      Analyzes production query patterns in real-time and recommends zero-downtime optimizations.
                    </p>
                  </div>
                </div>
                <span
                  ui-badge
                  variant="secondary"
                  class="font-mono text-xs"
                >
                  LLM Grounded · v4.8
                </span>
              </div>

              <!-- Interactive Mini Workbench -->
              <div class="border-border bg-muted/30 space-y-4 rounded-xl border p-4 sm:p-5">
                <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span class="text-muted-foreground font-mono">Input Prompt Context:</span>
                  <span class="text-success inline-flex items-center gap-1 font-medium">
                    <lucide-icon [img]="CheckCircle2" class="size-3.5" />
                    <span>AST Validated</span>
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="relative flex-1">
                    <input
                      type="text"
                      [value]="aiPromptInput()"
                      (input)="aiPromptInput.set($any($event.target).value)"
                      class="border-border bg-card text-foreground focus:border-primary w-full rounded-md border px-3 py-2 font-mono text-xs focus:outline-hidden"
                    />
                  </div>
                  <button
                    ui-button
                    size="sm"
                    class="h-9 gap-1.5 text-xs font-medium"
                    [disabled]="isSimulatingPrompt()"
                    (click)="runAiOptimization()"
                  >
                    <lucide-icon [img]="Zap" class="size-3.5 fill-current" />
                    <span>{{ isSimulatingPrompt() ? 'Running...' : 'Optimize' }}</span>
                  </button>
                </div>

                <!-- AI Result Output -->
                <div
                  class="border-border/80 bg-card text-foreground space-y-2 rounded-lg border p-3.5 font-mono text-xs"
                >
                  <div class="text-muted-foreground flex items-center justify-between text-xs">
                    <span class="flex items-center gap-1.5">
                      <lucide-icon [img]="Terminal" class="text-foreground size-3" />
                      <span>Optimization Plan Output</span>
                    </span>
                    <span class="text-success font-semibold">98.4% Efficiency Gain</span>
                  </div>
                  <p class="text-foreground leading-relaxed">{{ aiDraftOutput() }}</p>
                </div>
              </div>

              <div class="border-border grid grid-cols-3 gap-4 border-t pt-2 text-center text-xs">
                <div>
                  <p class="text-foreground font-mono text-base font-semibold">0.4ms</p>
                  <p class="text-muted-foreground">Inference Overhead</p>
                </div>
                <div>
                  <p class="text-foreground font-mono text-base font-semibold">99.8%</p>
                  <p class="text-muted-foreground">Syntactic Accuracy</p>
                </div>
                <div>
                  <p class="text-foreground font-mono text-base font-semibold">3.4M</p>
                  <p class="text-muted-foreground">Queries Analyzed</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Tile 2: Global Edge Network & Latency Radar -->
          <div
            ui-card
            class="border-border bg-card hover:border-foreground/20 relative overflow-hidden shadow-xs transition-colors duration-200"
          >
            <div ui-card-content class="flex h-full flex-col justify-between space-y-6 p-6">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="bg-muted text-foreground flex size-10 items-center justify-center rounded-lg">
                    <lucide-icon [img]="Globe2" class="size-5" />
                  </div>
                  <span
                    class="bg-success/10 text-success border-success/20 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-xs font-semibold"
                  >
                    <span class="bg-success size-1.5 rounded-full"></span>
                    <span>32 Edge PoPs</span>
                  </span>
                </div>
                <div>
                  <h3 class="text-foreground text-lg font-semibold tracking-tight">Global Edge Mesh</h3>
                  <p class="text-muted-foreground text-xs">
                    Sub-20ms p99 execution worldwide with automatic zero-downtime failover routing.
                  </p>
                </div>
              </div>

              <!-- Edge Regions List -->
              <div class="border-border bg-muted/20 space-y-2.5 rounded-lg border p-3">
                @for (region of regions; track region.code) {
                  <div class="border-border/50 flex items-center justify-between border-b py-1 text-xs last:border-0">
                    <div class="flex items-center gap-2">
                      <span class="text-foreground font-mono text-xs font-semibold uppercase">{{ region.code }}</span>
                      <span class="text-muted-foreground max-w-[120px] truncate">{{ region.name }}</span>
                    </div>
                    <span class="text-foreground font-mono text-xs font-semibold">{{ region.latency }}</span>
                  </div>
                }
              </div>

              <div class="space-y-2">
                <div class="text-muted-foreground flex justify-between font-mono text-xs">
                  <span>Global Route SLA</span>
                  <span class="text-foreground font-semibold">99.995%</span>
                </div>
                <ui-progress [value]="99.9" class="h-1.5" aria-label="Global route SLA" />
              </div>
            </div>
          </div>

          <!-- Tile 3: Live Telemetry Event Stream (Span 2 cols on lg) -->
          <div
            ui-card
            class="border-border bg-card hover:border-foreground/20 relative overflow-hidden shadow-xs transition-colors duration-200 lg:col-span-2"
          >
            <div ui-card-content class="flex h-full flex-col justify-between space-y-6 p-6 sm:p-8">
              <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                  <div class="bg-muted text-foreground flex size-10 items-center justify-center rounded-lg">
                    <lucide-icon [img]="Activity" class="size-5" />
                  </div>
                  <div>
                    <h3 class="text-foreground text-lg font-semibold tracking-tight">Real-Time Event Stream</h3>
                    <p class="text-muted-foreground text-xs">
                      Deterministic audit feed capturing deployments, schema migrations, and security operations.
                    </p>
                  </div>
                </div>

                <!-- Filter Tabs -->
                <div class="border-border bg-muted/40 flex items-center gap-1 rounded-lg border p-1">
                  @for (filter of filters; track filter.id) {
                    <button type="button" [class]="filterClass(filter.id)" (click)="activeEventFilter.set(filter.id)">
                      {{ filter.label }}
                    </button>
                  }
                </div>
              </div>

              <!-- Event Feed Table -->
              <div class="divide-border border-border bg-muted/20 divide-y rounded-xl border">
                @for (ev of filteredEvents(); track ev.id) {
                  <div
                    class="hover:bg-muted/40 flex flex-wrap items-center justify-between gap-3 p-3.5 text-xs transition-colors"
                  >
                    <div class="flex items-center gap-2.5">
                      <span class="bg-success size-2 rounded-full"></span>
                      <span class="text-foreground font-medium">{{ ev.title }}</span>
                    </div>
                    <div class="text-muted-foreground flex items-center gap-3 font-mono">
                      <span class="bg-muted text-foreground rounded px-1.5 py-0.5">{{ ev.latency }}</span>
                      <span>{{ ev.time }}</span>
                    </div>
                  </div>
                }
              </div>

              <div
                class="text-muted-foreground border-border flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-xs"
              >
                <span class="flex items-center gap-1.5">
                  <lucide-icon [img]="ShieldCheck" class="text-success size-4" />
                  <span>Zero message loss guaranteed via Raft consensus</span>
                </span>
                <span class="font-mono">Throughput: ~14,200 ev/sec</span>
              </div>
            </div>
          </div>

          <!-- Tile 4: Enterprise Security & Compliance Vault -->
          <div
            ui-card
            class="border-border bg-card hover:border-foreground/20 relative overflow-hidden shadow-xs transition-colors duration-200"
          >
            <div ui-card-content class="flex h-full flex-col justify-between space-y-6 p-6">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="bg-muted text-foreground flex size-10 items-center justify-center rounded-lg">
                    <lucide-icon [img]="ShieldCheck" class="size-5" />
                  </div>
                  <span ui-badge variant="outline" class="font-mono text-xs">SOC 2 Type II</span>
                </div>
                <div>
                  <h3 class="text-foreground text-lg font-semibold tracking-tight">Compliance & Vault</h3>
                  <p class="text-muted-foreground text-xs">
                    Continuous cryptographic verification, automated KMS key rotation, and granular RBAC.
                  </p>
                </div>
              </div>

              <div class="border-border bg-muted/20 space-y-3 rounded-lg border p-3.5 text-xs">
                <div class="flex items-center justify-between">
                  <span class="text-muted-foreground">AES-256 GCM at rest</span>
                  <span class="text-success flex items-center gap-1 font-semibold">
                    <lucide-icon [img]="CheckCircle2" class="size-3.5" /> Enforced
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-muted-foreground">mTLS v1.3 in transit</span>
                  <span class="text-success flex items-center gap-1 font-semibold">
                    <lucide-icon [img]="CheckCircle2" class="size-3.5" /> Enforced
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-muted-foreground">SCIM v2 Directory Sync</span>
                  <span class="text-foreground font-semibold">Active</span>
                </div>
              </div>

              <button ui-button variant="outline" class="h-9 w-full gap-1.5 text-xs font-semibold">
                <span>View Trust Center</span>
                <lucide-icon [img]="ArrowRight" class="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class UiBento01Component {
  protected readonly Activity = Activity
  protected readonly ArrowRight = ArrowRight
  protected readonly Bot = Bot
  protected readonly CheckCircle2 = CheckCircle2
  protected readonly Globe2 = Globe2
  protected readonly Layers = Layers
  protected readonly ShieldCheck = ShieldCheck
  protected readonly Terminal = Terminal
  protected readonly Zap = Zap

  protected readonly filters = eventFilters
  protected readonly regions = edgeRegions

  @Input('class') className?: string

  readonly activeEventFilter = signal<BentoEventFilter>('all')
  readonly isSimulatingPrompt = signal(false)
  readonly aiPromptInput = signal(INITIAL_PROMPT)
  readonly aiDraftOutput = signal(INITIAL_OUTPUT)

  private timer: ReturnType<typeof setTimeout> | undefined

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer))
  }

  readonly filteredEvents = computed(() => {
    const filter = this.activeEventFilter()
    if (filter === 'all') return liveTelemetryEvents
    return liveTelemetryEvents.filter((e) => e.type === filter)
  })

  get rootClass(): string {
    return cn('bg-background w-full py-16 sm:py-24', this.className)
  }

  filterClass(filter: BentoEventFilter): string {
    return cn(
      'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
      this.activeEventFilter() === filter
        ? 'bg-card text-foreground font-semibold shadow-2xs'
        : 'text-muted-foreground hover:text-foreground',
    )
  }

  runAiOptimization(): void {
    this.isSimulatingPrompt.set(true)
    this.aiDraftOutput.set('Analyzing query AST and cache hit rates...')
    clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.aiDraftOutput.set('Applied index pushdown & partitioned query plan. Estimated cache hit rate: 98.4%.')
      this.isSimulatingPrompt.set(false)
    }, 900)
  }
}
