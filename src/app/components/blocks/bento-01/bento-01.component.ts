// Boilerplate bento: eyebrow + headline over a 4-column / 2-row grid — one
// large AI-reviews card with a draft-quality meter, a wide activity card and
// two stat cards. Port of next-boilerplate/components/blocks/Bento01.tsx 1:1.
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { Activity, Clock, LucideAngularModule, ShieldCheck, Sparkles } from 'lucide-angular'
import { cn } from '@/app/core/utils/cn'
import { UiBadgeComponent } from '@/app/components/ui/badge/badge.component'
import { UiCardComponent, UiCardContentComponent } from '@/app/components/ui/card/card.component'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-bento-01, [ui-bento-01]',
  standalone: true,
  host: { '[attr.class]': '"contents"' },
  imports: [LucideAngularModule, UiBadgeComponent, UiCardComponent, UiCardContentComponent],
  template: `
    <section
      data-slot="bento-01"
      [class]="rootClass"
    >
      <div class="mx-auto max-w-6xl px-6 py-24">
        <div class="mb-12 max-w-2xl space-y-3">
          <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Built for scale</p>
          <h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">A workspace your team grows into, not out of.</h2>
          <p class="text-muted-foreground text-lg">
            Four surfaces that work end-to-end. Replace any one without touching the rest.
          </p>
        </div>

        <div class="grid gap-4 lg:grid-cols-4 lg:grid-rows-2">
          <div
            ui-card
            class="lg:col-span-2 lg:row-span-2"
          >
            <div
              ui-card-content
              class="flex h-full flex-col gap-6 p-8"
            >
              <div class="flex items-center gap-3">
                <div class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                  <lucide-icon [img]="Sparkles" class="size-5" />
                </div>
                <span ui-badge variant="secondary">New</span>
              </div>
              <div class="space-y-3">
                <h3 class="text-2xl font-semibold tracking-tight">AI-assisted reviews</h3>
                <p class="text-muted-foreground">
                  Draft 360 feedback in seconds. The assistant reads your goals, your 1:1 notes and your peer reviews,
                  then writes a first pass you can edit. Every suggestion cites the source so nothing comes out of
                  nowhere.
                </p>
              </div>

              <div class="bg-muted/30 mt-auto rounded-lg border p-5">
                <div class="text-muted-foreground flex items-center justify-between text-xs">
                  <span>Draft quality</span>
                  <span class="tabular-nums">92 / 100</span>
                </div>
                <div class="bg-muted mt-3 h-2 overflow-hidden rounded-full">
                  <div class="bg-primary h-full w-[92%] rounded-full"></div>
                </div>
                <div class="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                  <div>
                    <p class="text-foreground text-base tabular-nums">12</p>
                    <p class="text-muted-foreground">Goals</p>
                  </div>
                  <div>
                    <p class="text-foreground text-base tabular-nums">34</p>
                    <p class="text-muted-foreground">1:1 notes</p>
                  </div>
                  <div>
                    <p class="text-foreground text-base tabular-nums">8</p>
                    <p class="text-muted-foreground">Peers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            ui-card
            class="lg:col-span-2 lg:row-span-1"
          >
            <div
              ui-card-content
              class="flex h-full items-start gap-5 p-6"
            >
              <div class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                <lucide-icon [img]="Activity" class="size-5" />
              </div>
              <div class="space-y-2">
                <h3 class="text-lg font-semibold tracking-tight">Real-time activity</h3>
                <p class="text-muted-foreground text-sm">
                  Every event — hire, promotion, time-off, payroll run — streams into a single timeline you can filter by
                  team, person or module.
                </p>
              </div>
            </div>
          </div>

          <div ui-card>
            <div
              ui-card-content
              class="flex h-full flex-col justify-between gap-4 p-6"
            >
              <div class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                <lucide-icon [img]="Clock" class="size-5" />
              </div>
              <div>
                <p class="text-3xl font-semibold tracking-tight">12 min</p>
                <p class="text-muted-foreground mt-1 text-sm">Average setup time</p>
              </div>
            </div>
          </div>

          <div ui-card>
            <div
              ui-card-content
              class="flex h-full flex-col justify-between gap-4 p-6"
            >
              <div class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                <lucide-icon [img]="ShieldCheck" class="size-5" />
              </div>
              <div>
                <p class="text-sm font-semibold tracking-tight">SOC 2 · ISO 27001 · GDPR</p>
                <p class="text-muted-foreground mt-1 text-sm">Encrypted at rest, audited quarterly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class UiBento01Component {
  protected readonly Activity = Activity
  protected readonly Clock = Clock
  protected readonly ShieldCheck = ShieldCheck
  protected readonly Sparkles = Sparkles

  @Input('class') className?: string

  get rootClass(): string {
    return cn('bg-background', this.className)
  }
}
