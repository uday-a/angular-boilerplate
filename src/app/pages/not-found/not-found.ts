// 404 — designed "Page not found" with recovery links. Unknown URLs land
// here instead of silently bouncing to the marketing page, so a mistyped
// deep link is diagnosable rather than confusing.
import { Component, RESPONSE_INIT, inject } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { RouterLink } from '@angular/router'
import { FileQuestion, LucideAngularModule } from 'lucide-angular'
import { UiButtonComponent } from '@/app/components/ui/button'

@Component({
  selector: 'app-not-found',
  imports: [LucideAngularModule, RouterLink, UiButtonComponent],
  template: `
    <div class="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <lucide-icon [img]="NotFoundIcon" class="text-muted-foreground size-10" />
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p class="text-muted-foreground text-sm">The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
      </div>
      <div class="flex items-center gap-2">
        <a ui-button routerLink="/">Go home</a>
        <a ui-button variant="outline" routerLink="/dashboard">Dashboard</a>
      </div>
    </div>
  `,
})
export class NotFound {
  protected readonly NotFoundIcon = FileQuestion

  constructor() {
    inject(Title).setTitle('Page not found')
    // Real 404 status on SSR so crawlers don't index unknown URLs (null in the browser).
    const init = inject(RESPONSE_INIT, { optional: true })
    if (init) init.status = 404
  }
}
