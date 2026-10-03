// Boilerplate footer: brand + newsletter form + link columns with real
// destinations only (a boilerplate footer full of href="#" teaches dead
// links — add columns back as the pages exist) + GitHub link.
// Port of nuxt-boilerplate/app/components/blocks/Footer01.vue.
import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Boxes, Github, LucideAngularModule } from 'lucide-angular'
import { cn } from '@/app/core/utils/cn'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import { UiInputComponent } from '@/app/components/ui/input/input.component'
import { UiSeparatorComponent } from '@/app/components/ui/separator/separator.component'

const REPO_URL = 'https://github.com/uday-a/angular-boilerplate'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-footer-01, [ui-footer-01]',
  standalone: true,
  host: { '[attr.class]': '"contents"' },
  imports: [RouterLink, LucideAngularModule, UiButtonComponent, UiInputComponent, UiSeparatorComponent],
  template: `
    <footer
      data-slot="footer-01"
      [class]="rootClass"
    >
      <div class="mx-auto max-w-6xl px-6 py-16">
        <div class="grid gap-10 lg:grid-cols-12">
          <div class="space-y-4 lg:col-span-4">
            <div class="flex items-center gap-2">
              <div class="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
                <lucide-icon [img]="Boxes" class="size-4" />
              </div>
              <span class="text-base font-semibold">Acme</span>
            </div>
            <p class="text-muted-foreground max-w-sm text-sm">Built on shadcn-vue. Get product updates monthly.</p>
            <form
              class="flex max-w-sm gap-2"
              (submit)="subscribe($event)"
            >
              <ui-input
                [value]="newsletter()"
                (valueChange)="newsletter.set($event)"
                type="email"
                placeholder="you@company.com"
                required
                class="flex-1"
              />
              <button
                ui-button
                type="submit"
              >
                Subscribe
              </button>
            </form>
            @if (subscribed()) {
              <p class="text-xs text-[var(--success)]">Thanks — check your inbox to confirm.</p>
            }
          </div>

          <div class="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:col-span-8">
            <div class="space-y-3">
              <h3 class="text-sm font-semibold">Product</h3>
              <ul class="space-y-2">
                <li>
                  <a
                    routerLink="/"
                    fragment="features"
                    class="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >Features</a
                  >
                </li>
                <li>
                  <a
                    routerLink="/pricing"
                    class="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >Pricing</a
                  >
                </li>
                <li>
                  <a
                    routerLink="/login"
                    class="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >Sign in</a
                  >
                </li>
              </ul>
            </div>
            <div class="space-y-3">
              <h3 class="text-sm font-semibold">Resources</h3>
              <ul class="space-y-2">
                <li>
                  <a
                    [href]="repoUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >Documentation</a
                  >
                </li>
                <li>
                  <a
                    routerLink="/support"
                    class="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >Help center</a
                  >
                </li>
                <li>
                  <a
                    routerLink="/feedback"
                    class="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >Feedback</a
                  >
                </li>
              </ul>
            </div>
            <div class="space-y-3">
              <h3 class="text-sm font-semibold">Legal</h3>
              <ul class="space-y-2">
                <li>
                  <a
                    routerLink="/terms"
                    class="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >Terms</a
                  >
                </li>
                <li>
                  <a
                    routerLink="/privacy"
                    class="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >Privacy</a
                  >
                </li>
              </ul>
            </div>
          </div>
        </div>

        <ui-separator class="my-10" />

        <div class="flex flex-wrap items-center justify-between gap-4">
          <p class="text-muted-foreground text-xs">© 2026 UIPKGE. All rights reserved.</p>
          <a
            [href]="repoUrl"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            class="text-muted-foreground hover:text-foreground transition-colors"
          >
            <lucide-icon [img]="Github" class="size-4" />
          </a>
        </div>
      </div>
    </footer>
  `,
})
export class UiFooter01Component {
  protected readonly Boxes = Boxes
  protected readonly Github = Github
  protected readonly repoUrl = REPO_URL

  @Input('class') className?: string

  readonly newsletter = signal('')
  readonly subscribed = signal(false)

  get rootClass(): string {
    return cn('bg-background border-t', this.className)
  }

  subscribe(event: Event): void {
    event.preventDefault()
    if (!this.newsletter()) return
    this.subscribed.set(true)
    this.newsletter.set('')
  }
}
