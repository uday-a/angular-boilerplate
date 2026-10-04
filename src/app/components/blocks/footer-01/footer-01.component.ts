// Boilerplate footer: brand + newsletter form + link columns with real
// destinations only (a boilerplate footer full of href="#" teaches dead
// links — add columns back as the pages exist) + GitHub link.
// Port of next-boilerplate/components/blocks/Footer01.tsx 1:1.
import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Boxes, LucideAngularModule } from 'lucide-angular'
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
      <div class="mx-auto max-w-6xl px-4 py-4">
        <div class="grid gap-4 lg:grid-cols-12">
          <div class="space-y-4 lg:col-span-4">
            <div class="flex items-center gap-2">
              <div class="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
                <lucide-icon [img]="Boxes" class="size-4" aria-hidden="true" />
              </div>
              <span class="text-base font-semibold">Acme</span>
            </div>
            <p class="text-muted-foreground max-w-sm text-sm">
              Projects, billing and permissions for growing teams. Product updates once a month.
            </p>
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
              <p class="text-success text-xs">Thanks — check your inbox to confirm.</p>
            }
          </div>

          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:col-span-8">
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

        <ui-separator class="my-4" />

        <div class="flex flex-wrap items-center justify-between gap-4">
          <p class="text-muted-foreground text-xs">© 2026 Acme. All rights reserved.</p>
          <a
            [href]="repoUrl"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            class="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              class="size-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.4 11.4 0 016 0C17 4.7 18 5 18 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"
              />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  `,
})
export class UiFooter01Component {
  protected readonly Boxes = Boxes
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
