// Pricing — mirrors nuxt-boilerplate `app/pages/pricing.vue` 1:1: header,
// centred heading, the shared Pricing01 block (plans live in one place),
// FAQ, footer. Subscribe bounces anonymous users to /login?next=/pricing,
// else POSTs /api/billing/checkout and follows Polar's hosted URL.
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { Router } from '@angular/router'
import { Meta, Title } from '@angular/platform-browser'
import { AuthService } from '@/app/core/auth/auth.service'
import { UiHeader01Component } from '@/app/components/blocks/header-01'
import {
  UiPricing01Component,
  type Pricing01SubscribeEvent,
} from '@/app/components/blocks/pricing-01'
import { UiFaq01Component } from '@/app/components/blocks/faq-01'
import { UiFooter01Component } from '@/app/components/blocks/footer-01'

interface CheckoutEnvelope {
  ok: boolean
  data?: { url: string }
  error?: { message: string }
}

@Component({
  selector: 'app-pricing',
  imports: [UiHeader01Component, UiPricing01Component, UiFaq01Component, UiFooter01Component],
  template: `
    <div class="bg-background text-foreground min-h-screen">
      <ui-header-01 />
      <main>
        <div class="mx-auto max-w-6xl px-6 py-16">
          <header class="mx-auto max-w-2xl text-center">
            <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Pricing</h1>
            <p class="text-muted-foreground mt-3 text-base">Start free. Upgrade when you outgrow it.</p>
          </header>
        </div>
        <!-- Reuse the landing pricing block so plans live in one place. -->
        <section>
          <ui-pricing-01
            (subscribe)="onSubscribe($event)"
            (contactSales)="onContactSales()"
          />
        </section>
        <section><ui-faq-01 /></section>
      </main>
      <ui-footer-01 />
    </div>
  `,
})
export class Pricing implements OnInit {
  private readonly auth = inject(AuthService)
  private readonly http = inject(HttpClient)
  private readonly router = inject(Router)
  private readonly title = inject(Title)
  private readonly meta = inject(Meta)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))

  ngOnInit(): void {
    this.title.setTitle('Pricing')
    this.meta.updateTag({ name: 'description', content: 'Simple, transparent pricing for teams of every size.' })
  }

  onSubscribe(event: Pricing01SubscribeEvent): void {
    if (!this.browser) return
    // Not signed in? Bounce to /login with a return URL — the user
    // lands back on /pricing after auth and can click the plan again.
    if (!this.auth.loggedIn) {
      void this.router.navigate(['/login'], { queryParams: { next: '/pricing' } })
      return
    }
    this.http.post<CheckoutEnvelope>('/api/billing/checkout', { plan: event.plan }).subscribe({
      next: (res) => {
        if (res.ok && res.data) {
          // Polar's hosted checkout — full-page redirect.
          window.location.href = res.data.url
        } else {
          alert(res.error?.message ?? 'Checkout failed')
        }
      },
      error: (err: { error?: { error?: { message?: string } } }) => {
        alert(err.error?.error?.message ?? 'Checkout failed')
      },
    })
  }

  onContactSales(): void {
    if (!this.browser) return
    window.location.href = 'mailto:sales@example.com?subject=Enterprise%20plan%20inquiry'
  }
}
