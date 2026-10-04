// Boilerplate header: brand mark left, anchor links centre on desktop,
// auth-aware CTAs right (dashboard when logged in, sign-in + trial when
// anonymous). Below md collapses into a hamburger opening a right-side sheet.
// Port of nuxt-boilerplate/app/components/blocks/Header01.vue 1:1 —
// routerLink replaces NuxtLink, AuthService.loggedIn$ replaces useUserSession.
import { ChangeDetectionStrategy, Component, Input, inject, signal } from '@angular/core'
import { AsyncPipe } from '@angular/common'
import { RouterLink } from '@angular/router'
import { Boxes, LucideAngularModule, Menu, X } from 'lucide-angular'
import { cn } from '@/app/core/utils/cn'
import { AuthService } from '@/app/core/auth/auth.service'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import {
  UiSheetComponent,
  UiSheetContentComponent,
} from '@/app/components/ui/sheet/sheet.component'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-header-01, [ui-header-01]',
  standalone: true,
  host: { '[attr.class]': '"contents"' },
  imports: [AsyncPipe, RouterLink, LucideAngularModule, UiButtonComponent, UiSheetComponent, UiSheetContentComponent],
  template: `
    <header
      data-slot="header-01"
      [class]="rootClass"
    >
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a
          routerLink="/"
          class="flex items-center gap-2"
        >
          <div class="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
            <lucide-icon [img]="Boxes" class="size-4" />
          </div>
          <span class="text-base font-semibold">Acme</span>
        </a>

        <nav
          class="hidden items-center gap-6 md:flex"
          aria-label="Primary"
        >
          <a
            href="#features"
            class="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >Features</a
          >
          <a
            href="#pricing"
            class="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >Pricing</a
          >
          <a
            href="#customers"
            class="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >Customers</a
          >
          <a
            href="#docs"
            class="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >Docs</a
          >
          <a
            href="#blog"
            class="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >Blog</a
          >
        </nav>

        <div class="hidden items-center gap-2 md:flex">
          @if (auth.loggedIn$ | async) {
            <a
              ui-button
              routerLink="/dashboard"
              size="sm"
              >Go to dashboard</a
            >
          } @else {
            <a
              ui-button
              routerLink="/login"
              variant="ghost"
              size="sm"
              >Sign in</a
            >
            <a
              ui-button
              routerLink="/sign-up"
              size="sm"
              >Start free trial</a
            >
          }
        </div>

        <div
          ui-sheet
          [open]="mobileOpen()"
          (openChange)="mobileOpen.set($event)"
        >
          <button
            ui-button
            variant="ghost"
            size="icon"
            class="md:hidden"
            aria-label="Open menu"
            (click)="mobileOpen.set(true)"
          >
            <lucide-icon [img]="Menu" class="size-5" />
          </button>
          <div
            ui-sheet-content
            side="right"
            class="w-72"
          >
            <div class="flex h-full flex-col">
              <div class="flex items-center justify-between border-b px-4 py-3">
                <div class="flex items-center gap-2">
                  <div class="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
                    <lucide-icon [img]="Boxes" class="size-3.5" />
                  </div>
                  <span class="text-sm font-semibold">Acme</span>
                </div>
                <button
                  ui-button
                  variant="ghost"
                  size="icon"
                  class="size-8"
                  aria-label="Close menu"
                  (click)="mobileOpen.set(false)"
                >
                  <lucide-icon [img]="X" class="size-4" />
                </button>
              </div>
              <nav
                class="flex flex-1 flex-col gap-1 p-4"
                aria-label="Mobile"
              >
                <a
                  href="#features"
                  class="hover:bg-muted rounded-md px-3 py-2 text-sm transition-colors"
                  (click)="mobileOpen.set(false)"
                  >Features</a
                >
                <a
                  href="#pricing"
                  class="hover:bg-muted rounded-md px-3 py-2 text-sm transition-colors"
                  (click)="mobileOpen.set(false)"
                  >Pricing</a
                >
                <a
                  href="#customers"
                  class="hover:bg-muted rounded-md px-3 py-2 text-sm transition-colors"
                  (click)="mobileOpen.set(false)"
                  >Customers</a
                >
                <a
                  href="#docs"
                  class="hover:bg-muted rounded-md px-3 py-2 text-sm transition-colors"
                  (click)="mobileOpen.set(false)"
                  >Docs</a
                >
                <a
                  href="#blog"
                  class="hover:bg-muted rounded-md px-3 py-2 text-sm transition-colors"
                  (click)="mobileOpen.set(false)"
                  >Blog</a
                >
              </nav>
              <div class="flex flex-col gap-2 border-t p-4">
                @if (auth.loggedIn$ | async) {
                  <a
                    ui-button
                    routerLink="/dashboard"
                    class="w-full"
                    (click)="mobileOpen.set(false)"
                    >Go to dashboard</a
                  >
                } @else {
                  <a
                    ui-button
                    routerLink="/login"
                    variant="outline"
                    class="w-full"
                    (click)="mobileOpen.set(false)"
                    >Sign in</a
                  >
                  <a
                    ui-button
                    routerLink="/sign-up"
                    class="w-full"
                    (click)="mobileOpen.set(false)"
                    >Start free trial</a
                  >
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  `,
})
export class UiHeader01Component {
  protected readonly Boxes = Boxes
  protected readonly Menu = Menu
  protected readonly X = X

  protected readonly auth = inject(AuthService)

  @Input('class') className?: string

  readonly mobileOpen = signal(false)

  get rootClass(): string {
    return cn(
      'bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur',
      this.className,
    )
  }
}
