// 404 — Nuxt's error.vue layout (mono status label, h1, copy) with the
// decided buttons: primary "Go home" + outline "Dashboard". Unknown URLs land
// here instead of silently bouncing to the marketing page.
import { Component, RESPONSE_INIT, inject } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { RouterLink } from '@angular/router'
import { UiButtonComponent } from '@/app/components/ui/button'

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, UiButtonComponent],
  template: `
    <div class="bg-background text-foreground min-h-screen">
      <main class="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
        <p class="text-muted-foreground font-mono text-sm tracking-widest">404</p>
        <h1 class="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Page not found</h1>
        <p class="text-muted-foreground mt-3 text-base">The page you were looking for doesn’t exist or was moved.</p>
        <div class="mt-8 flex gap-3">
          <a ui-button routerLink="/">Go home</a>
          <a ui-button variant="outline" routerLink="/dashboard">Dashboard</a>
        </div>
      </main>
    </div>
  `,
})
export class NotFound {
  constructor() {
    inject(Title).setTitle('Page not found')
    // Real 404 status on SSR so crawlers don't index unknown URLs (null in the browser).
    const init = inject(RESPONSE_INIT, { optional: true })
    if (init) init.status = 404
  }
}
