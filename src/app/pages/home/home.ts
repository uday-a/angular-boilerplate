// Marketing landing — mirrors next-boilerplate `app/(marketing)/page.tsx` 1:1:
// Header + Hero/Logos/Features/Bento/Pricing/Testimonials/Faq/Contact/Cta
// sections (each scroll-margined for anchor links) + Footer.
import { Component, OnInit, inject } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { UiHeader01Component } from '@/app/components/blocks/header-01'
import { UiHero01Component } from '@/app/components/blocks/hero-01'
import { UiLogos01Component } from '@/app/components/blocks/logos-01'
import { UiFeatures01Component } from '@/app/components/blocks/features-01'
import { UiBento01Component } from '@/app/components/blocks/bento-01'
import { UiPricing01Component } from '@/app/components/blocks/pricing-01'
import { UiTestimonials01Component } from '@/app/components/blocks/testimonials-01'
import { UiFaq01Component } from '@/app/components/blocks/faq-01'
import { UiContact01Component } from '@/app/components/blocks/contact-01'
import { UiCta01Component } from '@/app/components/blocks/cta-01'
import { UiFooter01Component } from '@/app/components/blocks/footer-01'

@Component({
  selector: 'app-home',
  imports: [
    UiHeader01Component,
    UiHero01Component,
    UiLogos01Component,
    UiFeatures01Component,
    UiBento01Component,
    UiPricing01Component,
    UiTestimonials01Component,
    UiFaq01Component,
    UiContact01Component,
    UiCta01Component,
    UiFooter01Component,
  ],
  template: `
    <div class="bg-background text-foreground min-h-screen">
      <a
        href="#main-content"
        class="bg-background text-foreground ring-ring sr-only z-50 rounded-md text-sm font-medium shadow-md ring-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <ui-header-01 />
      <main
        id="main-content"
        tabindex="-1"
        class="outline-none [&>section]:scroll-mt-20"
      >
        <section id="top">
          <ui-hero-01 />
        </section>
        <section id="logos">
          <ui-logos-01 />
        </section>
        <section id="features">
          <ui-features-01 />
        </section>
        <section id="bento">
          <ui-bento-01 />
        </section>
        <section id="pricing">
          <ui-pricing-01 />
        </section>
        <section id="customers">
          <ui-testimonials-01 />
        </section>
        <section id="faq">
          <ui-faq-01 />
        </section>
        <section id="contact">
          <ui-contact-01 />
        </section>
        <section id="cta">
          <ui-cta-01 />
        </section>
      </main>
      <ui-footer-01 />
    </div>
  `,
})
export class Home implements OnInit {
  private readonly title = inject(Title)

  ngOnInit(): void {
    this.title.setTitle('The workspace your team will actually use')
  }
}
