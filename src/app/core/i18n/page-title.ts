// Page label for the h1 + `<title>` — Nuxt's useRouteLabel() + useHead({ title }).
// Defaults to the route's `nav.items.*` label (breadcrumb-labels.ts), so the
// sidebar, breadcrumb, h1 and title never disagree; re-translates on locale
// switch. Pass `label` to override (project name, non-nav page key).
import { type Signal, computed, effect, inject } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { ActivatedRoute } from '@angular/router'
import { routeLabel } from '../dashboard/breadcrumb-labels'
import { I18nService } from './i18n.service'

export function injectPageTitle(label?: () => string | null | undefined): Signal<string> {
  const i18n = inject(I18nService)
  const title = inject(Title)
  const path = '/' + inject(ActivatedRoute).snapshot.pathFromRoot.flatMap(r => r.url.map(s => s.path)).join('/')
  const value = computed(() => {
    i18n.lang()
    return label?.() || routeLabel(path, k => i18n.t(k))
  })
  title.setTitle(value())
  effect(() => title.setTitle(value()))
  return value
}
