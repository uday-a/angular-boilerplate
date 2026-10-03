// Boilerplate closing CTA: headline + auth-aware primary
// CTA (dashboard when logged in, trial when anonymous) + demo button.
// Port of nuxt-boilerplate/app/components/blocks/Cta01.vue 1:1.
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { AsyncPipe } from '@angular/common'
import { RouterLink } from '@angular/router'
import { ArrowRight, LucideAngularModule } from 'lucide-angular'
import { cn } from '@/app/core/utils/cn'
import { AuthService } from '@/app/core/auth/auth.service'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-cta-01, [ui-cta-01]',
  standalone: true,
  host: { '[attr.class]': '"contents"' },
  imports: [AsyncPipe, RouterLink, LucideAngularModule, UiButtonComponent],
  template: `
    <section
      data-slot="cta-01"
      [class]="rootClass"
    >
      <div class="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">
          Ready to give your team a Monday they'll actually look forward to?
        </h2>
        <p class="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
          Set up takes 12 minutes. Migrate from your current tool with one CSV upload.
        </p>
        <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
          @if (auth.loggedIn$ | async) {
            <a
              ui-button
              routerLink="/dashboard"
              size="lg"
            >
              Go to dashboard
              <lucide-icon [img]="ArrowRight" class="ml-2 size-4" />
            </a>
          } @else {
            <a
              ui-button
              routerLink="/sign-up"
              size="lg"
            >
              Start free trial
              <lucide-icon [img]="ArrowRight" class="ml-2 size-4" />
            </a>
          }
          <button
            ui-button
            size="lg"
            variant="outline"
          >
            Book a demo
          </button>
        </div>
        <p class="text-muted-foreground mt-4 text-xs">14-day free trial · No credit card required · Cancel anytime</p>
      </div>
    </section>
  `,
})
export class UiCta01Component {
  protected readonly ArrowRight = ArrowRight

  protected readonly auth = inject(AuthService)

  @Input('class') className?: string

  get rootClass(): string {
    return cn('bg-background relative overflow-hidden', this.className)
  }
}
