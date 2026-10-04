// SEO baseline (Nuxt's @nuxtjs/seo defaults): every page gets
// `<title>` "<Page> | UIPKGE", a canonical link, og:title/description/url/
// type/site_name and twitter:card, built from the site URL (SITE_URL via
// PUBLIC_CONFIG — from the SSR context on the server). Runs on both
// platforms, so crawlers see it in the server HTML.
import { DOCUMENT, Injectable, inject, provideAppInitializer, type EnvironmentProviders, type Provider } from '@angular/core'
import { Meta, type MetaDefinition, Title } from '@angular/platform-browser'
import { NavigationEnd, Router } from '@angular/router'
import { filter } from 'rxjs'
import { PUBLIC_CONFIG } from '../config/public-config'

const SITE_NAME = 'UIPKGE'

// Matches Nuxt's site-name title template: every setTitle("<Page>") renders
// "<Page> | UIPKGE" and mirrors into og:title.
@Injectable()
export class SiteTitle extends Title {
  private readonly meta = inject(Meta)

  override setTitle(title: string) {
    const full = !title || title === SITE_NAME || title.endsWith(` | ${SITE_NAME}`) ? title || SITE_NAME : `${title} | ${SITE_NAME}`
    super.setTitle(full)
    this.meta.updateTag({ property: 'og:title', content: full })
  }
}

// A page's description also becomes og:description.
@Injectable()
export class SiteMeta extends Meta {
  override updateTag(tag: MetaDefinition, selector?: string) {
    if (tag.name === 'description' && tag.content) super.updateTag({ property: 'og:description', content: tag.content })
    return super.updateTag(tag, selector)
  }
}

function startSeo(): void {
  const doc = inject(DOCUMENT)
  const meta = inject(Meta)
  const router = inject(Router)
  const siteUrl = inject(PUBLIC_CONFIG).siteUrl.replace(/\/$/, '')
  // index.html's description is the default; pages may override it after
  // NavigationEnd (ngOnInit), so reset it on every navigation first.
  const defaultDescription = meta.getTag('name="description"')?.content ?? ''
  meta.updateTag({ property: 'og:type', content: 'website' })
  meta.updateTag({ property: 'og:site_name', content: SITE_NAME })
  meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' })

  router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
    const url = siteUrl + (e.urlAfterRedirects.split(/[?#]/)[0] ?? '/')
    meta.updateTag({ name: 'description', content: defaultDescription })
    meta.updateTag({ property: 'og:url', content: url })
    let link = doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = doc.createElement('link')
      link.setAttribute('rel', 'canonical')
      doc.head.appendChild(link)
    }
    link.setAttribute('href', url)
  })
}

export function provideSeo(): (Provider | EnvironmentProviders)[] {
  return [
    { provide: Title, useClass: SiteTitle },
    { provide: Meta, useClass: SiteMeta },
    provideAppInitializer(startSeo),
  ]
}
