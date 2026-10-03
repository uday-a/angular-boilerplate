// Interactive architecture knowledge base and FAQ section with real-time keyword search,
// category topic filtering, and helpfulness voting. Port of the React block 1:1.
import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core'
import {
  ExternalLink,
  FileQuestion,
  HelpCircle,
  LucideAngularModule,
  Mail,
  MessageSquare,
  Search,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-angular'
import { cn } from '@/app/core/utils/cn'
import {
  UiAccordionComponent,
  UiAccordionContentComponent,
  UiAccordionItemComponent,
  UiAccordionTriggerComponent,
} from '@/app/components/ui/accordion/accordion.component'
import { UiBadgeComponent } from '@/app/components/ui/badge/badge.component'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import { UiCardComponent } from '@/app/components/ui/card/card.component'
import { UiInputComponent } from '@/app/components/ui/input/input.component'

type FaqCategory = 'ownership' | 'security' | 'architecture' | 'pricing'

interface FaqItem {
  id: string
  question: string
  answer: string
  category: FaqCategory
  tags: string[]
  helpfulCount: number
}

const faqs: FaqItem[] = [
  {
    id: 'ownership',
    question: 'Do I actually own the component code after running the add command?',
    answer:
      'Yes, 100%. UIPKGE follows the unbundled registry architecture pioneered by shadcn. When you run `npx uipkge-ng add`, the raw TypeScript, component, and variant files are copied directly into your repository. You are never bound to semver release cycles or rigid third-party package internals.',
    category: 'ownership',
    tags: ['Ownership', 'Zero Lock-in', 'MIT License'],
    helpfulCount: 342,
  },
  {
    id: 'security',
    question: 'How do you ensure zero supply-chain security risks without npm packages?',
    answer:
      'Every registry manifest and code payload is statically generated and cryptographically verifiable. Because source files live in your project tree, your static analysis tools (SonarQube, Snyk, ESLint, TypeScript compiler) inspect every single line of code during your existing CI pipeline with zero runtime black boxes.',
    category: 'security',
    tags: ['SOC 2', 'Zero Black Box', 'Static Audit'],
    helpfulCount: 289,
  },
  {
    id: 'architecture',
    question: 'How does dual-framework parity work between Vue 3 and React 19?',
    answer:
      'Both Vue and React registry trees are built against canonical shared Tailwind v4 design tokens and CVA variants in `packages/shared/`. Vue components leverage Reka UI primitives, while React components leverage Radix UI primitives, ensuring identical DOM contracts, keyboard navigation, and accessibility semantics.',
    category: 'architecture',
    tags: ['Vue 3.5', 'React 19', 'Tailwind v4', 'Reka UI'],
    helpfulCount: 215,
  },
  {
    id: 'migration',
    question: 'Can we integrate these blocks into an existing Tailwind v4 or Angular project?',
    answer:
      'Absolutely. You only need to run `npx uipkge-ng add init` to configure the baseline `@theme` tokens and `cn()` utility in your `styles.css`. From there, individual blocks and primitives can be added incrementally without rewriting your existing styles.',
    category: 'architecture',
    tags: ['Angular', 'Tailwind v4', 'Vite', 'Next.js'],
    helpfulCount: 198,
  },
  {
    id: 'pricing',
    question: 'What is the pricing model for commercial applications and vertical SaaS?',
    answer:
      'The UIPKGE registry is 100% open source under the permissive MIT license. You can use all primitives and blocks in personal projects, commercial SaaS products, and internal client applications with zero licensing fees or seat royalties.',
    category: 'pricing',
    tags: ['MIT License', 'Commercial Use', 'Free Forever'],
    helpfulCount: 456,
  },
  {
    id: 'updates',
    question: 'How do we pull updates or improvements to components we already copied?',
    answer:
      'Because you own the code, you can inspect diffs using Git. If you want to re-pull the newest upstream implementation of a component or block, simply run `npx shadcn-vue add <name> --overwrite` and review the git diff in your IDE before committing.',
    category: 'ownership',
    tags: ['Git Diff', 'Custom Overwrites', 'Upgrades'],
    helpfulCount: 167,
  },
]

type VoteDir = 'up' | 'down'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-faq-01, [ui-faq-01]',
  standalone: true,
  // React renders the root <section> itself: the host stays out of layout and `class` goes to the root.
  host: { '[attr.class]': '"contents"' },
  imports: [
    LucideAngularModule,
    UiAccordionComponent,
    UiAccordionContentComponent,
    UiAccordionItemComponent,
    UiAccordionTriggerComponent,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    UiInputComponent,
  ],
  template: `
    <section data-slot="faq-01" [class]="rootClass">
      <div class="mx-auto max-w-5xl space-y-12 px-4 sm:px-6 lg:px-8">
        <!-- Section Header -->
        <div class="mx-auto max-w-2xl space-y-4 text-center">
          <div class="inline-flex items-center gap-2">
            <span
              ui-badge
              variant="outline"
              class="border-primary/30 text-primary bg-primary/5 gap-1.5 px-2.5 py-1 font-mono text-xs tracking-wide uppercase"
            >
              <lucide-icon [img]="HelpCircle" class="size-3.5" />
              Knowledge Base
            </span>
            <span class="text-muted-foreground font-mono text-xs">Architecture & Licensing</span>
          </div>
          <h2 class="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            Frequently Answered Architecture Questions.
          </h2>
          <p class="text-muted-foreground text-base leading-relaxed sm:text-lg">
            Everything you need to know about component ownership, security verification, and dual-framework
            integration.
          </p>
        </div>

        <!-- Search and Filter Bar -->
        <div
          class="bg-card border-border flex flex-col items-center justify-between gap-4 rounded-xl border p-3 shadow-xs sm:flex-row"
        >
          <div class="relative w-full sm:w-80">
            <lucide-icon
              [img]="Search"
              class="text-muted-foreground pointer-events-none absolute top-2.5 left-3 size-4"
            />
            <ui-input
              [value]="searchQuery()"
              (valueChange)="searchQuery.set($event)"
              placeholder="Search questions or keywords..."
              class="h-9 pl-9 font-sans text-xs"
            />
          </div>

          <div class="flex w-full flex-wrap items-center gap-1.5 sm:w-auto">
            @for (cat of categories; track cat.id) {
              <button type="button" [class]="catClass(cat.id)" (click)="setCategory(cat.id)">
                {{ cat.label }}
              </button>
            }
          </div>
        </div>

        <!-- FAQ Accordion List -->
        <div class="space-y-4">
          @if (filteredFaqs().length === 0) {
            <div class="space-y-3 py-12 text-center">
              <lucide-icon [img]="FileQuestion" class="text-muted-foreground mx-auto size-10" />
              <p class="text-foreground text-sm font-medium">No matching questions found</p>
              <p class="text-muted-foreground text-xs">Try adjusting your search query or topic filter.</p>
            </div>
          } @else {
            <ui-accordion type="multiple" class="w-full space-y-3">
              @for (item of filteredFaqs(); track item.id) {
                <ui-accordion-item
                  [value]="item.id"
                  class="border-border bg-card/60 data-[state=open]:bg-card data-[state=open]:border-primary/40 rounded-xl border px-5 transition-colors data-[state=open]:shadow-xs"
                >
                  <button ui-accordion-trigger class="py-4 text-left hover:no-underline">
                    <div class="flex items-center gap-3 pr-4">
                      <span class="text-foreground text-sm font-semibold tracking-tight sm:text-base">
                        {{ item.question }}
                      </span>
                    </div>
                  </button>
                  <ui-accordion-content
                    class="text-muted-foreground border-border/50 space-y-4 border-t pt-1 pb-5 text-xs leading-relaxed sm:text-sm"
                  >
                    <p>{{ item.answer }}</p>
                    <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div class="flex flex-wrap items-center gap-1.5">
                        @for (tag of item.tags; track tag) {
                          <span ui-badge variant="secondary" class="font-mono text-xs">{{ tag }}</span>
                        }
                      </div>
                      <div class="text-muted-foreground flex items-center gap-2 text-xs">
                        <span>Helpful?</span>
                        <div class="flex items-center gap-1">
                          <button
                            type="button"
                            [class]="voteClass(item.id, 'up')"
                            (click)="vote(item.id, 'up')"
                            aria-label="Mark as helpful"
                          >
                            <lucide-icon [img]="ThumbsUp" class="size-3.5" />
                            <span>{{ helpfulDisplay(item) }}</span>
                          </button>
                          <button
                            type="button"
                            [class]="voteClass(item.id, 'down')"
                            (click)="vote(item.id, 'down')"
                            aria-label="Mark as not helpful"
                          >
                            <lucide-icon [img]="ThumbsDown" class="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </ui-accordion-content>
                </ui-accordion-item>
              }
            </ui-accordion>
          }
        </div>

        <!-- Support & Helpdesk CTA Box -->
        <div
          ui-card
          class="bg-muted/30 border-border flex flex-col items-center justify-between gap-4 rounded-xl p-6 sm:flex-row"
        >
          <div class="flex items-center gap-3.5 text-left">
            <div
              class="bg-primary/10 text-primary border-primary/20 flex size-10 shrink-0 items-center justify-center rounded-lg border"
            >
              <lucide-icon [img]="MessageSquare" class="size-5" />
            </div>
            <div>
              <h4 class="text-foreground text-sm font-semibold">Have an edge-case or enterprise question?</h4>
              <p class="text-muted-foreground mt-0.5 text-xs">
                Join our Discord community or open an architecture RFC on GitHub.
              </p>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-2.5">
            <a
              ui-button
              variant="outline"
              size="sm"
              class="h-8 gap-1.5 text-xs"
              href="https://github.com/uday-a/uipkge-registry/issues"
              target="_blank"
              rel="noreferrer"
            >
              <lucide-icon [img]="ExternalLink" class="size-3.5" />
              Open GitHub RFC
            </a>
            <a ui-button size="sm" class="h-8 gap-1.5 text-xs" href="mailto:hello@uipkge.dev">
              <lucide-icon [img]="Mail" class="size-3.5" />
              Contact Architecture Team
            </a>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class UiFaq01Component {
  protected readonly ExternalLink = ExternalLink
  protected readonly FileQuestion = FileQuestion
  protected readonly HelpCircle = HelpCircle
  protected readonly Mail = Mail
  protected readonly MessageSquare = MessageSquare
  protected readonly Search = Search
  protected readonly ThumbsDown = ThumbsDown
  protected readonly ThumbsUp = ThumbsUp

  protected readonly categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'ownership', label: 'Ownership' },
    { id: 'security', label: 'Security' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'pricing', label: 'Licensing' },
  ] as const

  @Input('class') className?: string
  @Input() set initialCategory(v: 'all' | FaqCategory) {
    this.activeCategory.set(v ?? 'all')
  }

  readonly searchQuery = signal('')
  readonly activeCategory = signal<'all' | FaqCategory>('all')
  readonly votedMap = signal<Record<string, VoteDir>>({})

  readonly filteredFaqs = computed(() => {
    const q = this.searchQuery().toLowerCase().trim()
    return faqs.filter((item) => {
      const matchesCategory = this.activeCategory() === 'all' || item.category === this.activeCategory()
      const matchesSearch =
        q === '' ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      return matchesCategory && matchesSearch
    })
  })

  get rootClass(): string {
    return cn('bg-background border-border relative w-full border-y py-16 lg:py-24', this.className)
  }

  setCategory(id: 'all' | FaqCategory): void {
    this.activeCategory.set(id)
  }

  catClass(id: 'all' | FaqCategory): string {
    return cn(
      'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
      this.activeCategory() === id
        ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
    )
  }

  vote(id: string, dir: VoteDir): void {
    this.votedMap.update((prev) => {
      const next = { ...prev }
      if (next[id] === dir) delete next[id]
      else next[id] = dir
      return next
    })
  }

  helpfulDisplay(item: FaqItem): number {
    return item.helpfulCount + (this.votedMap()[item.id] === 'up' ? 1 : 0)
  }

  voteClass(id: string, dir: VoteDir): string {
    return cn(
      'hover:bg-muted inline-flex items-center gap-1 rounded p-1 text-xs transition-colors',
      this.votedMap()[id] === dir && (dir === 'up' ? 'text-success font-semibold' : 'text-destructive font-semibold'),
    )
  }
}
