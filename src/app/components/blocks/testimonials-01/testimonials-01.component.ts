// Interactive customer case study and ROI telemetry workbench with industry filters,
// verified customer metrics, tech stack tags, and autoplay navigation. Port of the Vue/React block 1:1.
import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import {
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LucideAngularModule,
  Pause,
  Play,
  Quote,
  Star,
} from 'lucide-angular'
import { cn } from '@/app/core/utils/cn'
import { UiBadgeComponent } from '@/app/components/ui/badge/badge.component'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import { UiCardComponent } from '@/app/components/ui/card/card.component'

export type TestimonialIndustry = 'saas' | 'healthtech' | 'fintech' | 'devtools'
export type IndustryFilter = 'all' | TestimonialIndustry

export interface CaseStudyMetric {
  label: string
  value: string
  trend: string
}

export interface CaseStudyTestimonial {
  id: string
  name: string
  role: string
  company: string
  industry: TestimonialIndustry
  initials: string
  avatarBg: string
  quote: string
  subquote: string
  rating: number
  verifiedBadge: string
  metrics: CaseStudyMetric[]
  stack: string[]
}

export const caseStudyTestimonials: CaseStudyTestimonial[] = [
  {
    id: '1',
    name: 'Aisha Rahman',
    role: 'VP of People & Operations',
    company: 'Northwind Global Logistics',
    industry: 'saas',
    initials: 'AR',
    avatarBg: 'bg-info/10 text-info border-info/20',
    quote:
      'We replaced four legacy spreadsheets and two disjointed SaaS subscriptions with UIPKGE blocks. Onboarding time dropped from 6 days to under 4 hours.',
    subquote:
      'The unbundled registry architecture gave our engineers total ownership without ever dealing with broken npm updates or rigid vendor locks.',
    rating: 5,
    verifiedBadge: 'Verified Enterprise Customer · 2,400+ Seats',
    metrics: [
      { label: 'Onboarding Velocity', value: '< 4 hours', trend: '-88% time' },
      { label: 'SaaS Tooling Spend', value: '$140k / yr', trend: 'Saved' },
      { label: 'Employee NPS', value: '+74', trend: 'Top Decile' },
    ],
    stack: ['Vue 3.5', 'Tailwind CSS v4', 'PostgreSQL', 'SCIM Okta'],
  },
  {
    id: '2',
    name: 'Marco Vidal',
    role: 'Director of Information Security',
    company: 'Helio Health Systems',
    industry: 'healthtech',
    initials: 'MV',
    avatarBg: 'bg-success/10 text-success border-success/20',
    quote:
      'SOC 2 and HIPAA evidence collection went from a grueling quarterly nightmare to a continuous, automated background audit trail.',
    subquote:
      'Our external auditors completed our Type II examination in record time because every UI state change is cryptographically verifiable.',
    rating: 5,
    verifiedBadge: 'Verified Healthcare Provider · HIPAA Tier 1',
    metrics: [
      { label: 'Audit Prep Duration', value: '1.5 days', trend: 'Down from 3 wks' },
      { label: 'Compliance Adherence', value: '100.0%', trend: '142 Controls' },
      { label: 'Zero Trust Rollout', value: '14 Days', trend: '100% Org' },
    ],
    stack: ['React 19', 'Reka UI Primitives', 'Cloudflare Workers', 'AuditLog API'],
  },
  {
    id: '3',
    name: 'Tomoko Saito',
    role: 'Staff Infrastructure Architect',
    company: 'Pixel & Co Engine Labs',
    industry: 'devtools',
    initials: 'TS',
    avatarBg: 'bg-chart-1/10 text-chart-1 border-chart-1/20',
    quote:
      'My favourite part is how blazing fast it is. Sub-20ms P99 search latencies across 50,000 workforce records without a single loading spinner.',
    subquote:
      'Keyboard shortcuts for every workflow make our engineering managers feel like they are operating a sleek CLI rather than a web dashboard.',
    rating: 5,
    verifiedBadge: 'Verified DevTools Customer · 450+ Devs',
    metrics: [
      { label: 'P99 Edge Latency', value: '18ms', trend: 'Global Edge' },
      { label: 'Daily Hotkey Actions', value: '42k / day', trend: '+310%' },
      { label: 'Memory Footprint', value: '< 12MB', trend: 'Zero bloat' },
    ],
    stack: ['Vue 3.5', 'Vite', 'Turborepo', 'WebAssembly'],
  },
  {
    id: '4',
    name: 'Julian Montgomery',
    role: 'Chief Financial Officer',
    company: 'Vanguard FinTech Matrix',
    industry: 'fintech',
    initials: 'JM',
    avatarBg: 'bg-warning/10 text-warning border-warning/20',
    quote:
      'Multi-currency payroll runs across 34 countries used to require 5 days of manual reconciliation. Now it settles automatically with zero FX fee slippage.',
    subquote:
      'Direct ledger sync and real-time tax calculations give our board instant visibility into gross-to-net runway.',
    rating: 5,
    verifiedBadge: 'Verified FinTech Customer · $800M+ Volume',
    metrics: [
      { label: 'Payroll Settlement', value: 'Instant', trend: 'FedNow / SEPA' },
      { label: 'FX Reconciliation', value: '0.00%', trend: 'Zero error' },
      { label: 'Tax Auto-filing', value: '34 Regs', trend: 'Statutory' },
    ],
    stack: ['React 19', 'Next.js', 'Tailwind v4', 'Stripe Treasury'],
  },
]

const industryOptions: { id: IndustryFilter; label: string }[] = [
  { id: 'all', label: 'All Industries' },
  { id: 'saas', label: 'Enterprise SaaS' },
  { id: 'healthtech', label: 'HealthTech' },
  { id: 'devtools', label: 'Developer DX' },
  { id: 'fintech', label: 'FinTech' },
]

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-testimonials-01, [ui-testimonials-01]',
  standalone: true,
  // React renders the root <section> itself: the host stays out of layout and `class` goes to the root.
  host: { '[attr.class]': '"contents"' },
  imports: [LucideAngularModule, UiBadgeComponent, UiButtonComponent, UiCardComponent],
  template: `
    <section data-slot="testimonials-01" [class]="rootClass">
      <div class="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
        <!-- Section Header -->
        <div class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div class="max-w-2xl space-y-3">
            <div class="inline-flex items-center gap-2">
              <span
                ui-badge
                variant="outline"
                class="border-primary/30 text-primary bg-primary/5 gap-1.5 px-2.5 py-1 font-mono text-xs tracking-wide uppercase"
              >
                <lucide-icon [img]="BadgeCheck" class="size-3.5" />
                Verified Case Studies
              </span>
              <span class="text-muted-foreground font-mono text-xs">Real-World Customer Telemetry</span>
            </div>
            <h2 class="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
              Trusted by the Teams Building the Future.
            </h2>
            <p class="text-muted-foreground text-base leading-relaxed sm:text-lg">
              See how high-growth scaleups and enterprise leaders accelerate engineering velocity and operational
              clarity.
            </p>
          </div>

          <!-- Industry Filter Switcher -->
          <div class="bg-muted/60 border-border flex flex-wrap items-center gap-1.5 rounded-lg border p-1">
            @for (cat of industryOptions; track cat.id) {
              <button
                type="button"
                class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                [class]="filterButtonClass(cat.id)"
                (click)="setIndustry(cat.id)"
              >
                {{ cat.label }}
              </button>
            }
          </div>
        </div>

        <!-- Featured Testimonial Canvas -->
        <div ui-card class="bg-card border-border overflow-hidden shadow-md">
          <div class="grid grid-cols-1 lg:grid-cols-12">
            <!-- Left Main Quote Area (7 cols) -->
            <div class="flex flex-col justify-between space-y-8 p-6 sm:p-10 lg:col-span-7">
              <div class="space-y-6">
                <!-- Rating & Badge -->
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div class="text-warning flex items-center gap-1">
                    @for (s of stars(); track $index) {
                      <lucide-icon [img]="Star" class="fill-warning size-4" />
                    }
                  </div>
                  <span
                    ui-badge
                    variant="outline"
                    class="border-success/20 bg-success/10 text-success gap-1.5 font-mono text-xs"
                  >
                    <lucide-icon [img]="CheckCircle2" class="size-3" />
                    {{ activeTestimonial().verifiedBadge }}
                  </span>
                </div>

                <!-- Quote Content -->
                <div class="relative space-y-3">
                  <lucide-icon [img]="Quote" class="text-primary/20 absolute -top-4 -left-3 -z-10 size-8" />
                  <p class="text-foreground text-xl leading-relaxed font-medium tracking-tight sm:text-2xl">
                    &ldquo;{{ activeTestimonial().quote }}&rdquo;
                  </p>
                  <p class="text-muted-foreground text-sm leading-relaxed">
                    {{ activeTestimonial().subquote }}
                  </p>
                </div>
              </div>

              <!-- Author Info & Controls -->
              <div class="border-border flex flex-col justify-between gap-4 border-t pt-6 sm:flex-row sm:items-center">
                <div class="flex items-center gap-3.5">
                  <div
                    class="flex size-11 items-center justify-center rounded-full border text-sm font-semibold"
                    [class]="activeTestimonial().avatarBg"
                  >
                    {{ activeTestimonial().initials }}
                  </div>
                  <div>
                    <h4 class="text-foreground text-sm font-semibold">{{ activeTestimonial().name }}</h4>
                    <p class="text-muted-foreground text-xs">
                      {{ activeTestimonial().role }} ·
                      <span class="text-foreground font-medium">{{ activeTestimonial().company }}</span>
                    </p>
                  </div>
                </div>

                <!-- Navigation Buttons -->
                <div class="flex items-center gap-2">
                  <button
                    ui-button
                    variant="outline"
                    size="icon"
                    class="size-8 rounded-lg"
                    aria-label="Previous customer story"
                    (click)="prev()"
                  >
                    <lucide-icon [img]="ChevronLeft" class="size-4" />
                  </button>
                  <button
                    ui-button
                    variant="outline"
                    size="icon"
                    class="size-8 rounded-lg"
                    [attr.aria-label]="isAutoPlaying() ? 'Pause rotation' : 'Resume rotation'"
                    (click)="toggleAutoPlay()"
                  >
                    @if (isAutoPlaying()) {
                      <lucide-icon [img]="Pause" class="text-primary size-3.5" />
                    } @else {
                      <lucide-icon [img]="Play" class="size-3.5" />
                    }
                  </button>
                  <button
                    ui-button
                    variant="outline"
                    size="icon"
                    class="size-8 rounded-lg"
                    aria-label="Next customer story"
                    (click)="next()"
                  >
                    <lucide-icon [img]="ChevronRight" class="size-4" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Right Telemetry & Metrics Sidebar (5 cols) -->
            <div
              class="bg-muted/20 border-border flex flex-col justify-between space-y-6 border-t p-6 sm:p-8 lg:col-span-5 lg:border-t-0 lg:border-l"
            >
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-muted-foreground font-mono text-xs tracking-wider uppercase">Impact Telemetry</span>
                  <span class="text-success font-mono text-xs">Production Validated</span>
                </div>

                <!-- Metrics Grid -->
                <div class="space-y-3">
                  @for (m of activeTestimonial().metrics; track m.label) {
                    <div
                      class="border-border bg-card/80 flex items-center justify-between rounded-lg border p-3.5 shadow-xs"
                    >
                      <div>
                        <p class="text-muted-foreground text-xs">{{ m.label }}</p>
                        <p class="text-foreground mt-0.5 text-lg font-semibold tracking-tight">{{ m.value }}</p>
                      </div>
                      <span
                        ui-badge
                        variant="secondary"
                        class="bg-success/10 text-success font-mono text-xs font-semibold"
                      >
                        {{ m.trend }}
                      </span>
                    </div>
                  }
                </div>

                <!-- Stack Tags -->
                <div class="space-y-2 pt-2">
                  <p class="text-muted-foreground font-mono text-xs tracking-wider uppercase">
                    Tech Stack Architecture
                  </p>
                  <div class="flex flex-wrap gap-1.5">
                    @for (tech of activeTestimonial().stack; track $index) {
                      <span ui-badge variant="outline" class="bg-background font-mono text-xs">
                        {{ tech }}
                      </span>
                    }
                  </div>
                </div>
              </div>

              <!-- Story Navigation Dots -->
              <div class="border-border/60 flex items-center justify-between border-t pt-4">
                <div class="flex items-center gap-1.5">
                  @for (t of filteredTestimonials(); track t.id; let i = $index) {
                    <button
                      type="button"
                      [attr.aria-label]="'Jump to testimonial ' + (i + 1)"
                      class="h-1.5 rounded-full transition-colors duration-300"
                      [class]="dotClass(i)"
                      (click)="goTo(i)"
                    ></button>
                  }
                </div>
                <span class="text-muted-foreground font-mono text-xs">
                  {{ activeIndex() + 1 }} of {{ filteredTestimonials().length }} Stories
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class UiTestimonials01Component implements OnInit, OnDestroy {
  protected readonly BadgeCheck = BadgeCheck
  protected readonly CheckCircle2 = CheckCircle2
  protected readonly ChevronLeft = ChevronLeft
  protected readonly ChevronRight = ChevronRight
  protected readonly Pause = Pause
  protected readonly Play = Play
  protected readonly Quote = Quote
  protected readonly Star = Star

  protected readonly industryOptions = industryOptions

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID))

  @Input() set initialIndustry(v: IndustryFilter) {
    this.activeIndustry.set(v ?? 'all')
  }
  @Input() set autoPlay(v: boolean) {
    this.isAutoPlaying.set(v ?? true)
  }
  @Input('class') className?: string

  readonly activeIndex = signal(0)
  readonly activeIndustry = signal<IndustryFilter>('all')
  readonly isAutoPlaying = signal(true)
  private timer: ReturnType<typeof setInterval> | undefined

  readonly filteredTestimonials = computed(() => {
    const industry = this.activeIndustry()
    if (industry === 'all') return caseStudyTestimonials
    return caseStudyTestimonials.filter((t) => t.industry === industry)
  })

  readonly activeTestimonial = computed(() => {
    const list = this.filteredTestimonials()
    return list[this.activeIndex()] ?? list[0]!
  })

  readonly stars = computed(() => Array.from({ length: this.activeTestimonial().rating }, (_, i) => i))

  ngOnInit(): void {
    // Browser-only: a live setInterval keeps the NgZone unstable, which hangs
    // SSR (the server waits for stability before serializing the response).
    if (!this.isBrowser) return
    this.startTimer()
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer)
  }

  get rootClass(): string {
    return cn('bg-background border-border relative w-full overflow-hidden border-y py-16 lg:py-24', this.className)
  }

  filterButtonClass(id: IndustryFilter): string {
    return cn(
      'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
      this.activeIndustry() === id
        ? 'bg-background text-foreground font-semibold shadow-xs'
        : 'text-muted-foreground hover:text-foreground',
    )
  }

  dotClass(i: number): string {
    return cn(
      'h-1.5 rounded-full transition-colors duration-300',
      i === this.activeIndex() ? 'bg-primary w-6' : 'bg-muted-foreground/30 hover:bg-muted-foreground/60 w-2',
    )
  }

  setIndustry(id: IndustryFilter): void {
    this.activeIndustry.set(id)
    this.activeIndex.set(0)
  }

  goTo(i: number): void {
    this.activeIndex.set(i)
  }

  next(): void {
    const len = this.filteredTestimonials().length
    this.activeIndex.update((prev) => (prev + 1) % len)
  }

  prev(): void {
    const len = this.filteredTestimonials().length
    this.activeIndex.update((prev) => (prev - 1 + len) % len)
  }

  toggleAutoPlay(): void {
    const nextVal = !this.isAutoPlaying()
    this.isAutoPlaying.set(nextVal)
    if (nextVal) this.startTimer()
    else if (this.timer) clearInterval(this.timer)
  }

  private startTimer(): void {
    if (this.timer) clearInterval(this.timer)
    if (!this.isAutoPlaying()) return
    this.timer = setInterval(() => this.next(), 6500)
  }
}
