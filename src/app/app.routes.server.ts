import { RenderMode, ServerRoute } from '@angular/ssr'

export const serverRoutes: ServerRoute[] = [
  {
    // No prerendering — every route SSR-renders on demand (the scaffold's
    // "prerender: false"). Feature workers can flip marketing routes to
    // RenderMode.Prerender later.
    path: '**',
    renderMode: RenderMode.Server,
  },
]
