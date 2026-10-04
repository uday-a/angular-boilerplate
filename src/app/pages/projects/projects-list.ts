// Projects list — mirrors nuxt-boilerplate `app/pages/projects/index.vue`
// 1:1: GET /api/projects → cards; create Dialog → POST /api/projects.
//
// Fishing out of scope: pagination (the endpoint returns the full owned
// list, ordered by creation).
import { Component, PLATFORM_ID, inject, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { RouterLink } from '@angular/router'
import { TranslatePipe } from '@ngx-translate/core'
import { CircleAlert, CircleDot, FolderPlus, LoaderCircle, LucideAngularModule, Plus } from 'lucide-angular'
import { UiDemoDataBannerComponent } from '@/app/components/blocks/demo-data-banner'
import { UiAvatarComponent, UiAvatarFallbackComponent } from '@/app/components/ui/avatar'
import { UiBadgeComponent, type BadgeVariant } from '@/app/components/ui/badge'
import { UiButtonComponent } from '@/app/components/ui/button'
import {
  UiCardActionComponent,
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardFooterComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card'
import {
  UiDialogComponent,
  UiDialogContentComponent,
  UiDialogDescriptionComponent,
  UiDialogFooterComponent,
  UiDialogHeaderComponent,
  UiDialogTitleComponent,
  UiDialogTriggerComponent,
} from '@/app/components/ui/dialog'
import { UiEmptyStateComponent } from '@/app/components/ui/empty-state'
import { UiInputComponent } from '@/app/components/ui/input'
import { UiLabelComponent } from '@/app/components/ui/label'
import { UiPageBodyComponent, UiPageComponent, UiPageHeaderComponent, UiPageHeaderHeadingComponent } from '@/app/components/ui/page'
import { UiSkeletonComponent } from '@/app/components/ui/skeleton'
import { UiTextareaComponent } from '@/app/components/ui/textarea'
import { type ApiResponse, apiErrorMessage } from '@/app/core/api/api'
import { I18nService, injectPageTitle } from '@/app/core/i18n'

export interface Project {
  id: number
  slug: string
  name: string
  description: string | null
  ownerId: number
  createdAt: string
  updatedAt: string
}

// Auto-derives a kebab-case slug from the project name — the same
// transform nuxt applies in its name watcher.
export function slugifyProjectName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

// Members, status and open-task counts aren't in the projects API yet, so
// each card gets deterministic sample values keyed by project id. Swap this
// for real fields once the API returns them.
const SAMPLE_MEMBERS = ['Emma Clarke', 'James Porter', 'Olivia Brooks', 'Daniel Hughes', 'Sophie Turner', 'Liam Foster']
const SAMPLE_STATUS: { label: string, variant: BadgeVariant }[] = [
  { label: 'On track', variant: 'success' },
  { label: 'At risk', variant: 'warning' },
  { label: 'On hold', variant: 'secondary' },
]

export function sampleMeta(id: number) {
  const memberCount = 2 + (id % 4)
  const members = Array.from({ length: memberCount }, (_, i) => SAMPLE_MEMBERS[(id + i) % SAMPLE_MEMBERS.length]!)
  return {
    members,
    status: SAMPLE_STATUS[id % SAMPLE_STATUS.length]!,
    openTasks: 3 + ((id * 7) % 18),
  }
}

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    LucideAngularModule,
    UiAvatarComponent,
    UiAvatarFallbackComponent,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardActionComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardFooterComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
    UiDemoDataBannerComponent,
    UiDialogComponent,
    UiDialogContentComponent,
    UiDialogDescriptionComponent,
    UiDialogFooterComponent,
    UiDialogHeaderComponent,
    UiDialogTitleComponent,
    UiDialogTriggerComponent,
    UiEmptyStateComponent,
    UiInputComponent,
    UiLabelComponent,
    UiPageBodyComponent,
    UiPageComponent,
    UiPageHeaderComponent,
    UiPageHeaderHeadingComponent,
    UiSkeletonComponent,
    UiTextareaComponent,
  ],
  template: `
    <ui-page>
      <ui-page-header>
        <ui-page-header-heading [title]="pageTitle()" description="Group related work, the people on it and what's still open." />
        <div slot="actions">
          <ui-dialog [open]="open()" (openChange)="open.set($event)">
            <button ui-button ui-dialog-trigger size="sm">
              <lucide-icon [img]="PlusIcon" class="size-4" aria-hidden="true" />
              New project
            </button>
            <ui-dialog-content>
              <ui-dialog-header>
                <ui-dialog-title>New project</ui-dialog-title>
                <ui-dialog-description>Group related work and the people working on it.</ui-dialog-description>
              </ui-dialog-header>
              <div class="space-y-4 py-1">
                <div class="grid gap-2">
                  <ui-label htmlFor="np-name">Name</ui-label>
                  <ui-input id="np-name" placeholder="My new project" [value]="name()" (valueChange)="onNameInput($event)" />
                </div>
                <div class="grid gap-2">
                  <ui-label htmlFor="np-slug">URL name</ui-label>
                  <ui-input id="np-slug" placeholder="my-new-project" [value]="slug()" (valueChange)="onSlugInput($event)" />
                  <p class="text-muted-foreground text-xs">Used in the project URL. Lowercase letters, numbers and hyphens.</p>
                </div>
                <div class="grid gap-2">
                  <ui-label htmlFor="np-desc">Description (optional)</ui-label>
                  <ui-textarea id="np-desc" [rows]="3" [value]="description()" (valueChange)="description.set($event)" />
                </div>
                @if (submitError()) {
                  <div class="text-destructive flex items-center gap-2 text-sm">
                    <lucide-icon [img]="AlertIcon" class="size-4 shrink-0" aria-hidden="true" />
                    {{ submitError() }}
                  </div>
                }
              </div>
              <ui-dialog-footer>
                <button ui-button variant="outline" [disabled]="submitState() === 'submitting'" (click)="open.set(false)">
                  Cancel
                </button>
                <button ui-button [disabled]="submitState() === 'submitting' || !name() || !slug()" (click)="createProject()">
                  @if (submitState() === 'submitting') {
                    <lucide-icon [img]="LoaderIcon" class="size-4 animate-spin" />
                  }
                  Create
                </button>
              </ui-dialog-footer>
            </ui-dialog-content>
          </ui-dialog>
        </div>
      </ui-page-header>

      <ui-page-body class="space-y-4">
        @if (fetchError()) {
          <ui-empty-state
            [icon]="errorIcon"
            role="alert"
            title="Couldn't load projects"
            description="Something went wrong on our side. Try again in a moment."
          >
            <ng-template #errorIcon><lucide-icon [img]="AlertIcon" /></ng-template>
            <button ui-button size="sm" variant="outline" class="mt-4" (click)="load()">Retry</button>
          </ui-empty-state>
        } @else if (pending()) {
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            @for (n of [1, 2, 3]; track n) {
              <ui-skeleton class="h-52 rounded-xl" />
            }
          </div>
        } @else if (!projects().length) {
          <ui-empty-state
            [icon]="emptyIcon"
            [title]="'projects.empty.title' | translate"
            [description]="'projects.empty.description' | translate"
          >
            <ng-template #emptyIcon><lucide-icon [img]="FolderPlusIcon" /></ng-template>
            <button ui-button size="sm" class="mt-4" (click)="open.set(true)">
              <lucide-icon [img]="PlusIcon" class="size-4" aria-hidden="true" />
              {{ 'projects.empty.action' | translate }}
            </button>
          </ui-empty-state>
        } @else {
          <ui-demo-data-banner message="Members, status and open tasks are sample values." />
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @for (p of projects(); track p.id) {
              @let meta = sampleMeta(p.id);
              <a
                [routerLink]="['/projects', p.slug]"
                class="group focus-visible:ring-ring/50 rounded-xl outline-none focus-visible:ring-[3px]"
              >
                <ui-card class="group-hover:border-primary/40 flex h-full flex-col transition-colors">
                  <ui-card-header>
                    <h3 ui-card-title class="text-base">{{ p.name }}</h3>
                    <ui-card-description class="line-clamp-2">{{ p.description || 'No description yet.' }}</ui-card-description>
                    <ui-card-action>
                      <span ui-badge [variant]="meta.status.variant">{{ meta.status.label }}</span>
                    </ui-card-action>
                  </ui-card-header>
                  <ui-card-content class="mt-auto">
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex -space-x-2">
                        @for (member of meta.members; track member) {
                          <ui-avatar class="ring-card size-8 ring-2" [attr.title]="member">
                            <ui-avatar-fallback class="bg-muted text-muted-foreground text-xs">{{ initials(member) }}</ui-avatar-fallback>
                          </ui-avatar>
                        }
                      </div>
                      <span class="text-muted-foreground inline-flex items-center gap-1.5 text-xs tabular-nums">
                        <lucide-icon [img]="DotIcon" class="size-3.5" aria-hidden="true" />
                        {{ meta.openTasks }} open
                      </span>
                    </div>
                  </ui-card-content>
                  <ui-card-footer class="text-muted-foreground border-t pt-4 text-xs">
                    <span>Updated <time [attr.datetime]="iso(p.updatedAt)">{{ timeAgo(p.updatedAt) }}</time></span>
                  </ui-card-footer>
                </ui-card>
              </a>
            }

            <button
              type="button"
              class="text-muted-foreground hover:border-primary/40 hover:text-foreground focus-visible:ring-ring/50 flex min-h-52 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-sm transition-colors outline-none focus-visible:ring-[3px]"
              (click)="open.set(true)"
            >
              <lucide-icon [img]="FolderPlusIcon" class="size-5" aria-hidden="true" />
              New project
            </button>
          </div>
        }
      </ui-page-body>
    </ui-page>
  `,
})
export class ProjectsList {
  private readonly http = inject(HttpClient)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly i18n = inject(I18nService)
  protected readonly pageTitle = injectPageTitle()

  protected readonly PlusIcon = Plus
  protected readonly FolderPlusIcon = FolderPlus
  protected readonly DotIcon = CircleDot
  protected readonly LoaderIcon = LoaderCircle
  protected readonly AlertIcon = CircleAlert
  protected readonly sampleMeta = sampleMeta

  protected readonly projects = signal<Project[]>([])
  protected readonly pending = signal(true)
  // Boolean in the UI: the raw error message never reaches the page.
  protected readonly fetchError = signal(false)

  // Create-project dialog state.
  protected readonly open = signal(false)
  protected readonly name = signal('')
  protected readonly slug = signal('')
  protected readonly description = signal('')
  protected readonly slugTouched = signal(false)
  protected readonly submitState = signal<'idle' | 'submitting' | 'error'>('idle')
  protected readonly submitError = signal<string | null>(null)

  constructor() {
    // Relative URLs have no base href during SSR — fetch from the browser only.
    if (this.browser) this.load()
  }

  initials(name: string): string {
    return name.split(' ').map(part => part[0]).join('')
  }

  iso(value: string): string {
    return new Date(value).toISOString()
  }

  timeAgo(value: string): string {
    const diffMs = new Date(value).getTime() - Date.now()
    const rtf = new Intl.RelativeTimeFormat(this.i18n.lang(), { numeric: 'auto' })
    const days = Math.round(diffMs / 86400000)
    if (Math.abs(days) < 1) return rtf.format(Math.round(diffMs / 3600000), 'hour')
    if (Math.abs(days) < 30) return rtf.format(days, 'day')
    return rtf.format(Math.round(days / 30), 'month')
  }

  load(): void {
    this.pending.set(true)
    this.fetchError.set(false)
    this.http.get<ApiResponse<{ projects: Project[] }>>('/api/projects', { withCredentials: true }).subscribe({
      next: (res) => {
        this.pending.set(false)
        if (res.ok) this.projects.set(res.data.projects)
        else this.fetchError.set(true)
      },
      error: () => {
        this.pending.set(false)
        this.fetchError.set(true)
      },
    })
  }

  // Auto-derives the slug from the name until the user edits the slug
  // field themselves (nuxt: name watcher + slugTouched flag).
  onNameInput(next: string): void {
    this.name.set(next)
    if (this.slugTouched()) return
    this.slug.set(slugifyProjectName(next))
  }

  onSlugInput(next: string): void {
    this.slug.set(next)
    this.slugTouched.set(true)
  }

  createProject(): void {
    if (!this.browser || this.submitState() === 'submitting') return
    this.submitState.set('submitting')
    this.submitError.set(null)
    const description = this.description().trim()
    this.http
      .post<ApiResponse<{ project: Project }>>(
        '/api/projects',
        { slug: this.slug(), name: this.name(), description: description || undefined },
        { withCredentials: true },
      )
      .subscribe({
        next: (res) => {
          if (!res.ok) {
            this.submitError.set(res.error.message)
            this.submitState.set('error')
            return
          }
          this.name.set('')
          this.slug.set('')
          this.description.set('')
          this.slugTouched.set(false)
          this.submitState.set('idle')
          this.open.set(false)
          this.load()
        },
        error: (err: unknown) => {
          this.submitError.set(apiErrorMessage(err, 'Failed to create project'))
          this.submitState.set('error')
        },
      })
  }
}
