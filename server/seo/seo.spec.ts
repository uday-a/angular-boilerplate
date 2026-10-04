import { describe, expect, it } from 'vitest'
import { robotsTxt, sitemapXml } from './index'

describe('seo routes', () => {
  it('robots.txt allows crawling and points at the sitemap', () => {
    expect(robotsTxt()).toMatch(/^User-agent: \*\nDisallow:\n/)
    expect(robotsTxt()).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/)
  })

  // Authenticated pages must never be advertised to crawlers.
  it('sitemap lists public routes only', () => {
    const xml = sitemapXml()
    for (const path of ['/pricing', '/terms', '/privacy', '/login']) expect(xml).toContain(`${path}</loc>`)
    for (const path of ['/dashboard', '/settings', '/feedback', '/support', '/mfa', '/admin']) expect(xml).not.toContain(path)
  })
})
