// robots.txt + sitemap.xml (Nuxt's @nuxtjs/seo equivalents), built from
// SITE_URL. The sitemap lists public routes only — authenticated surfaces
// (dashboard, settings, projects, admin, onboarding, invite, feedback,
// support) and /mfa stay out.
import { Router } from 'express'
import { env } from '../utils/env'

export const PUBLIC_ROUTES = ['/', '/pricing', '/login', '/sign-up', '/forgot-password', '/terms', '/privacy'] as const

const siteUrl = () => env.SITE_URL.replace(/\/$/, '')

export function robotsTxt(): string {
  return `User-agent: *\nDisallow:\n\nSitemap: ${siteUrl()}/sitemap.xml\n`
}

export function sitemapXml(): string {
  const urls = PUBLIC_ROUTES.map(path => `  <url>\n    <loc>${siteUrl()}${path}</loc>\n  </url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export const seoRouter = Router()

seoRouter.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(robotsTxt())
})

seoRouter.get('/sitemap.xml', (_req, res) => {
  res.type('application/xml').send(sitemapXml())
})
