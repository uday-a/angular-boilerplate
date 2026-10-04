// Boilerplate hero: badge + headline + auth-aware CTA (dashboard when logged
// in, trial when anonymous) + floating stat cards + onboarding queue card.
// Port of nuxt-boilerplate/app/components/blocks/Hero01.vue 1:1.
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { AsyncPipe } from '@angular/common'
import { RouterLink } from '@angular/router'
import { ArrowRight, LucideAngularModule, PlayCircle, Sparkles } from 'lucide-angular'
import { cn } from '@/app/core/utils/cn'
import { AuthService } from '@/app/core/auth/auth.service'
import { UiAvatarComponent, UiAvatarFallbackComponent } from '@/app/components/ui/avatar/avatar.component'
import { UiBadgeComponent } from '@/app/components/ui/badge/badge.component'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card/card.component'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-hero-01, [ui-hero-01]',
  standalone: true,
  host: { '[attr.class]': '"contents"' },
  imports: [
    AsyncPipe,
    RouterLink,
    LucideAngularModule,
    UiAvatarComponent,
    UiAvatarFallbackComponent,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
  ],
  template: `
    <section
      data-slot="hero-01"
      [class]="rootClass"
    >
      <div class="relative mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <div class="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div class="space-y-6">
            <span
              ui-badge
              variant="secondary"
              class="gap-1"
            >
              <lucide-icon [img]="Sparkles" class="size-3" />
              New: AI-powered insights
            </span>
            <h1 class="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              The platform your team will actually use.
            </h1>
            <p class="text-muted-foreground max-w-xl text-lg">
              One workspace for everything your team needs. Built on uipkge Angular primitives — fast, accessible, easy to
              customise.
            </p>
            <!-- px-4 = the button's has-[>svg]:px-4, which can't match through the <lucide-icon> wrapper. -->
            <div class="flex flex-wrap items-center gap-3">
              @if (auth.loggedIn$ | async) {
                <a
                  ui-button
                  routerLink="/dashboard"
                  size="lg"
                  class="px-4"
                >
                  Go to dashboard
                  <lucide-icon [img]="ArrowRight" class="ml-2 size-4" />
                </a>
              } @else {
                <a
                  ui-button
                  routerLink="/sign-up"
                  size="lg"
                  class="px-4"
                >
                  Start free trial
                  <lucide-icon [img]="ArrowRight" class="ml-2 size-4" />
                </a>
              }
              <!-- The login page has a one-click demo workspace; send people
                   there rather than to a video that doesn't exist. -->
              <a
                ui-button
                routerLink="/login"
                size="lg"
                variant="outline"
                class="px-4"
              >
                <lucide-icon [img]="PlayCircle" class="size-4" aria-hidden="true" />
                Try the live demo
              </a>
            </div>
            <div class="text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span>★★★★★ 4.9 on G2</span>
              <span>14-day free trial</span>
              <span>No credit card required</span>
            </div>
          </div>

          <div class="relative mx-auto w-full max-w-md lg:mr-0" aria-hidden="true">
            <!-- WHY: flat system -- shadow-sm only. Cards sit on borders, not elevation. -->
            <div
              ui-card
              class="shadow-sm"
            >
              <div ui-card-header>
                <h3 ui-card-title class="text-base">Onboarding queue</h3>
                <p ui-card-description>3 starting Monday</p>
              </div>
              <div
                ui-card-content
                class="space-y-3"
              >
                <div class="flex items-center gap-3">
                  <ui-avatar class="size-8">
                    <ui-avatar-fallback>LW</ui-avatar-fallback>
                  </ui-avatar>
                  <div class="flex-1">
                    <p class="text-sm font-medium">Lena Wei</p>
                    <p class="text-muted-foreground text-xs">Engineering</p>
                  </div>
                  <span ui-badge variant="secondary">Pending</span>
                </div>
                <div class="flex items-center gap-3">
                  <ui-avatar class="size-8">
                    <ui-avatar-fallback>JR</ui-avatar-fallback>
                  </ui-avatar>
                  <div class="flex-1">
                    <p class="text-sm font-medium">Joaquín Reyes</p>
                    <p class="text-muted-foreground text-xs">Engineering</p>
                  </div>
                  <span ui-badge variant="secondary">Pending</span>
                </div>
                <div class="flex items-center gap-3">
                  <ui-avatar class="size-8">
                    <ui-avatar-fallback>PS</ui-avatar-fallback>
                  </ui-avatar>
                  <div class="flex-1">
                    <p class="text-sm font-medium">Priya Shah</p>
                    <p class="text-muted-foreground text-xs">Engineering</p>
                  </div>
                  <span ui-badge variant="secondary">Pending</span>
                </div>
              </div>
            </div>
            <div class="relative -mt-4 hidden grid-cols-2 gap-4 px-4 md:grid">
              <div
                ui-card
                class="rotate-2 shadow-sm"
              >
                <div
                  ui-card-content
                  class="space-y-1 p-4"
                >
                  <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Active users</p>
                  <p class="text-2xl font-semibold tracking-tight tabular-nums">1,284</p>
                  <p class="text-success text-xs">+8.2% MoM</p>
                </div>
              </div>
              <div
                ui-card
                class="-rotate-2 shadow-sm"
              >
                <div
                  ui-card-content
                  class="space-y-1 p-4"
                >
                  <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Uptime</p>
                  <p class="text-2xl font-semibold tracking-tight tabular-nums">100%</p>
                  <p class="text-muted-foreground text-xs">12 cycles, 0 misses</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class UiHero01Component {
  protected readonly ArrowRight = ArrowRight
  protected readonly PlayCircle = PlayCircle
  protected readonly Sparkles = Sparkles

  protected readonly auth = inject(AuthService)

  @Input('class') className?: string

  get rootClass(): string {
    return cn('bg-background relative overflow-hidden', this.className)
  }
}
