// Vercel serverless entry. Runs the same Express app as `npm start`
// (src/server.ts: /api, /auth, SSR). Static files from
// dist/angular-boilerplate/browser are served by Vercel's CDN first;
// vercel.json rewrites every other path here. Its buildCommand deletes
// browser/index.csr.html, otherwise the CDN serves that client-only shell
// for `/` and the home page never reaches SSR (the server bundle embeds its
// own copy for CSR fallback).
import process from 'node:process'

// Angular SSR only server-renders for allow-listed hosts (unknown hosts
// silently fall back to client-side rendering). Vercel's edge only routes
// this deployment's own domains to this function, so trusting *.vercel.app
// is safe here, and it stays out of angular.json so self-hosting is
// unaffected. Custom domains: add them via the NG_ALLOWED_HOSTS env var.
// Must be set before the bundle loads: AngularNodeAppEngine reads it once.
process.env.NG_ALLOWED_HOSTS = ['*.vercel.app', process.env.NG_ALLOWED_HOSTS].filter(Boolean).join(',')

// Any X-Forwarded-* header Angular isn't told to trust makes it fall back to
// client-side rendering (default trust: host + proto only). Vercel's edge
// sets — and overwrites client-sent — host, proto, port and for on every
// request, so trust exactly those.
process.env.NG_TRUST_PROXY_HEADERS ??= 'x-forwarded-host,x-forwarded-proto,x-forwarded-port,x-forwarded-for'

const { boot, reqHandler } = await import('../dist/angular-boilerplate/server/server.mjs')
boot()

export default reqHandler
