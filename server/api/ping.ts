// Example: PUBLIC API route — no auth check, no session read. Ported from
// nuxt-boilerplate/server/api/ping.get.ts. Copy this shape for any endpoint
// that should be reachable by anonymous visitors (health checks, marketing
// page lookups, sitemap data, etc.).
//
// Try it:
//   curl http://localhost:4201/api/ping
//   → 200 { "ok": true, "data": { "status": "ok", "service": "...", "timestamp": "..." } }
import { apiHandler } from '../utils/response'

export const pingHandler = apiHandler(async () => {
  return {
    status: 'ok',
    service: 'angular-boilerplate',
    timestamp: new Date().toISOString(),
  }
})
