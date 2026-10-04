// Page label for the h1 + `<title>` — Nuxt's useRouteLabel() + useHead({ title }).
// Defaults to the route's `nav.items.*` label (breadcrumb-labels.ts), so the
// sidebar, breadcrumb, h1 and title never disagree; re-translates on locale
// switch. Pass `label` to override (project name, non-nav page key).
import { Injectable, type Signal, computed, effect, inject, signal } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { ActivatedRoute } from '@angular/router'
import { routeLabel } from '../dashboard/breadcrumb-labels'
import { I18nService } from './i18n.service'

// The current page's label, for the topbar's last breadcrumb (task title on
// a kanban deep link, project name on a project). Keyed by path so a page
// without injectPageTitle never inherits the previous page's label.
@Injectable({ providedIn: 'root' })
export class PageTitleState {
  readonly current = signal<{ path: string, label: string } | null>(null)
}

export function injectPageTitle(label?: () => string | null | undefined): Signal<string> {
  const i18n = inject(I18nService)
  const title = inject(Title)
  const path = '/' + inject(ActivatedRoute).snapshot.pathFromRoot.flatMap(r => r.url.map(s => s.path)).join('/')
  const value = computed(() => {
    i18n.lang()
    return label?.() || routeLabel(path, k => i18n.t(k))
  })
  const state = inject(PageTitleState)
  title.setTitle(value())
  state.current.set({ path, label: value() })
  effect(() => {
    title.setTitle(value())
    state.current.set({ path, label: value() })
  })
  return value
}
