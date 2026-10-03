// Projects list — mirrors nuxt-boilerplate `app/pages/projects/index.vue`
// 1:1: GET /api/projects → cards; create Dialog → POST /api/projects.
//
// Fishing out of scope: pagination (the endpoint returns the full owned
// list, ordered by creation).
import { Component, PLATFORM_ID, inject, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { RouterLink } from '@angular/router'
import { Title } from '@angular/platform-browser'
import { CircleAlert, Folder, LoaderCircle, LucideAngularModule, Plus } from 'lucide-angular'
import { UiButtonComponent } from '@/app/components/ui/button'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
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
import { UiInputComponent } from '@/app/components/ui/input'
import { UiLabelComponent } from '@/app/components/ui/label'
import { UiTextareaComponent } from '@/app/components/ui/textarea'
import { type ApiResponse, apiErrorMessage } from '@/app/core/api/api'

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

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    UiButtonComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
    UiDialogComponent,
    UiDialogContentComponent,
    UiDialogDescriptionComponent,
    UiDialogFooterComponent,
    UiDialogHeaderComponent,
    UiDialogTitleComponent,
    UiDialogTriggerComponent,
    UiInputComponent,
    UiLabelComponent,
    UiTextareaComponent,
  ],
  template: `
    <div class="space-y-4">
      <header class="flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-1">
          <h1 class="text-2xl font-semibold tracking-tight">Projects</h1>
          <p class="text-muted-foreground text-sm">Workspaces grouping related work, members, and assets.</p>
        </div>
        <ui-dialog [open]="open()" (openChange)="open.set($event)">
          <button ui-button ui-dialog-trigger size="sm">
            <lucide-icon [img]="PlusIcon" class="size-4" />
            New project
          </button>
          <ui-dialog-content>
            <ui-dialog-header>
              <ui-dialog-title>New project</ui-dialog-title>
              <ui-dialog-description>Slug becomes part of the URL: /projects/&lt;slug&gt;.</ui-dialog-description>
            </ui-dialog-header>
            <div class="space-y-3">
              <div class="grid gap-2">
                <ui-label htmlFor="np-name">Name</ui-label>
                <ui-input id="np-name" placeholder="My new project" [value]="name()" (valueChange)="onNameInput($event)" />
              </div>
              <div class="grid gap-2">
                <ui-label htmlFor="np-slug">Slug</ui-label>
                <ui-input id="np-slug" placeholder="my-new-project" [value]="slug()" (valueChange)="onSlugInput($event)" />
                <p class="text-muted-foreground text-xs">Lowercase letters, numbers, hyphens. Must be unique.</p>
              </div>
              <div class="grid gap-2">
                <ui-label htmlFor="np-desc">Description (optional)</ui-label>
                <ui-textarea id="np-desc" [rows]="3" [value]="description()" (valueChange)="description.set($event)" />
              </div>
              @if (submitError()) {
                <div class="text-destructive flex items-center gap-2 text-sm">
                  <lucide-icon [img]="AlertIcon" class="size-4" />
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
      </header>

      @if (fetchError()) {
        <div
          class="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
        >
          <lucide-icon [img]="AlertIcon" class="size-4" />
          {{ fetchError() }}
        </div>
      } @else if (pending()) {
        <div class="text-muted-foreground text-sm">Loading projects…</div>
      } @else if (!projects().length) {
        <div class="text-muted-foreground text-sm">No projects yet. Create one to get started.</div>
      } @else {
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (p of projects(); track p.id) {
            <a [routerLink]="['/projects', p.slug]" class="group">
              <ui-card class="h-full transition-colors group-hover:border-foreground/20">
                <ui-card-header>
                  <div class="flex items-center gap-2">
                    <lucide-icon [img]="FolderIcon" class="text-muted-foreground size-4" />
                    <ui-card-title class="text-base">{{ p.name }}</ui-card-title>
                  </div>
                  <ui-card-description>{{ p.description ?? '—' }}</ui-card-description>
                </ui-card-header>
                <ui-card-content>
                  <span class="text-muted-foreground text-xs">Open project →</span>
                </ui-card-content>
              </ui-card>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class ProjectsList {
  private readonly http = inject(HttpClient)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))

  protected readonly PlusIcon = Plus
  protected readonly FolderIcon = Folder
  protected readonly LoaderIcon = LoaderCircle
  protected readonly AlertIcon = CircleAlert

  protected readonly projects = signal<Project[]>([])
  protected readonly pending = signal(true)
  protected readonly fetchError = signal<string | null>(null)

  // Create-project dialog state.
  protected readonly open = signal(false)
  protected readonly name = signal('')
  protected readonly slug = signal('')
  protected readonly description = signal('')
  protected readonly slugTouched = signal(false)
  protected readonly submitState = signal<'idle' | 'submitting' | 'error'>('idle')
  protected readonly submitError = signal<string | null>(null)

  constructor() {
    inject(Title).setTitle('Projects')
    // Relative URLs have no base href during SSR — fetch from the browser only.
    if (this.browser) this.load()
  }

  load(): void {
    this.pending.set(true)
    this.fetchError.set(null)
    this.http.get<ApiResponse<{ projects: Project[] }>>('/api/projects', { withCredentials: true }).subscribe({
      next: (res) => {
        this.pending.set(false)
        if (res.ok) {
          this.projects.set(res.data.projects)
        } else {
          this.fetchError.set(res.error.message)
        }
      },
      error: (err: unknown) => {
        this.pending.set(false)
        this.fetchError.set(apiErrorMessage(err, 'Failed to load projects'))
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
