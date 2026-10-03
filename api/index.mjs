// Vercel serverless entry. Runs the same Express app as `npm start`
// (src/server.ts: /api, /auth, SSR). Static files from
// dist/angular-boilerplate/browser are served by Vercel's CDN first;
// vercel.json rewrites every other path here.
import process from 'node:process'

// Angular SSR only server-renders for allow-listed hosts (unknown hosts
// silently fall back to client-side rendering). Vercel's edge only routes
// this deployment's own domains to this function, so trusting *.vercel.app
// is safe here, and it stays out of angular.json so self-hosting is
// unaffected. Custom domains: add them via the NG_ALLOWED_HOSTS env var.
// Must be set before the bundle loads: AngularNodeAppEngine reads it once.
process.env.NG_ALLOWED_HOSTS = ['*.vercel.app', process.env.NG_ALLOWED_HOSTS].filter(Boolean).join(',')

const { boot, reqHandler } = await import('../dist/angular-boilerplate/server/server.mjs')
boot()

export default reqHandler
