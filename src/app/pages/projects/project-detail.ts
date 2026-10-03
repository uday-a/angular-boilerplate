// Project detail — mirrors nuxt-boilerplate
// `app/pages/projects/[slug].vue` 1:1: GET /api/projects/:slug → edit
// form → PUT; DELETE → back to the list.
import { Component, PLATFORM_ID, inject, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { ActivatedRoute, Router } from '@angular/router'
import { Title } from '@angular/platform-browser'
import { CircleAlert, Folder, LoaderCircle, LucideAngularModule, Trash2 } from 'lucide-angular'
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
} from '@/app/components/ui/dialog'
import { UiInputComponent } from '@/app/components/ui/input'
import { UiLabelComponent } from '@/app/components/ui/label'
import { UiTextareaComponent } from '@/app/components/ui/textarea'
import { type ApiResponse, apiErrorMessage } from '@/app/core/api/api'
import { I18nService } from '@/app/core/i18n'
import type { Project } from './projects-list'

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
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
    UiInputComponent,
    UiLabelComponent,
    UiTextareaComponent,
  ],
  template: `
    <div class="max-w-3xl space-y-4">
      <header class="space-y-1">
        <div class="flex items-center gap-2">
          <lucide-icon [img]="FolderIcon" class="text-muted-foreground size-4" />
          <h1 class="text-2xl font-semibold tracking-tight">{{ project()?.name ?? slug() }}</h1>
        </div>
        @if (project(); as p) {
          <p class="text-muted-foreground text-sm">
            Project · <code>{{ p.slug }}</code> · created {{ createdDate() }}
          </p>
        }
      </header>

      @if (loadError()) {
        <div
          class="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
        >
          <lucide-icon [img]="AlertIcon" class="size-4" />
          {{ loadError() }}
        </div>
      } @else if (pending()) {
        <div class="text-muted-foreground text-sm">Loading…</div>
      } @else if (project()) {
        <ui-card>
          <ui-card-header>
            <ui-card-title class="text-base">Details</ui-card-title>
            <ui-card-description>Edit the project metadata. Slug is immutable after creation.</ui-card-description>
          </ui-card-header>
          <ui-card-content class="space-y-4">
            <div class="grid gap-2">
              <ui-label htmlFor="p-name">Name</ui-label>
              <ui-input id="p-name" [value]="name()" (valueChange)="name.set($event)" />
            </div>
            <div class="grid gap-2">
              <ui-label htmlFor="p-desc">Description</ui-label>
              <ui-textarea id="p-desc" [rows]="4" [value]="description()" (valueChange)="description.set($event)" />
            </div>
            @if (saveError()) {
              <div class="text-destructive flex items-center gap-2 text-sm">
                <lucide-icon [img]="AlertIcon" class="size-4" />
                {{ saveError() }}
              </div>
            }
            <div class="flex justify-between">
              <button
                ui-button
                variant="ghost"
                [disabled]="deleteState() === 'deleting'"
                class="text-destructive hover:text-destructive"
                (click)="confirmDelete.set(true)"
              >
                <lucide-icon [img]="TrashIcon" class="size-4" />
                Delete project
              </button>
              <button ui-button [disabled]="saveState() === 'saving' || !name()" (click)="save()">
                @if (saveState() === 'saving') {
                  <lucide-icon [img]="LoaderIcon" class="size-4 animate-spin" />
                }
                Save changes
              </button>
            </div>
          </ui-card-content>
        </ui-card>
      }

      <ui-dialog [open]="confirmDelete()" (openChange)="confirmDelete.set($event)">
        <ui-dialog-content class="sm:max-w-md">
          <ui-dialog-header>
            <ui-dialog-title>Delete “{{ project()?.name }}”?</ui-dialog-title>
            <ui-dialog-description>
              The project and its settings are removed for everyone. This can’t be undone.
            </ui-dialog-description>
          </ui-dialog-header>
          <ui-dialog-footer>
            <button ui-button variant="outline" (click)="confirmDelete.set(false)">Cancel</button>
            <button ui-button variant="destructive" (click)="remove()">
              <lucide-icon [img]="TrashIcon" class="size-4" />
              Delete project
            </button>
          </ui-dialog-footer>
        </ui-dialog-content>
      </ui-dialog>
    </div>
  `,
})
export class ProjectDetail {
  private readonly http = inject(HttpClient)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly title = inject(Title)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))

  protected readonly FolderIcon = Folder
  protected readonly AlertIcon = CircleAlert
  protected readonly LoaderIcon = LoaderCircle
  protected readonly TrashIcon = Trash2

  protected readonly slug = signal(String(this.route.snapshot.paramMap.get('slug') ?? ''))
  protected readonly project = signal<Project | null>(null)
  protected readonly pending = signal(true)
  protected readonly loadError = signal<string | null>(null)
  protected readonly createdDate = signal('')

  // Edit form — initialized from server data each time it arrives.
  protected readonly name = signal('')
  protected readonly description = signal('')

  protected readonly saveState = signal<'idle' | 'saving' | 'error'>('idle')
  protected readonly saveError = signal<string | null>(null)
  protected readonly deleteState = signal<'idle' | 'deleting'>('idle')
  // Designed confirm dialog instead of window.confirm().
  protected readonly confirmDelete = signal(false)

  private readonly i18n = inject(I18nService)

  constructor() {
    this.title.setTitle(`${this.slug()} · Projects`)
    if (this.browser) this.load()
  }

  load(): void {
    this.pending.set(true)
    this.loadError.set(null)
    this.http.get<ApiResponse<{ project: Project }>>(`/api/projects/${this.slug()}`, { withCredentials: true }).subscribe({
      next: (res) => {
        this.pending.set(false)
        if (!res.ok) {
          this.loadError.set(res.error.message)
          return
        }
        const p = res.data.project
        this.project.set(p)
        this.name.set(p.name)
        this.description.set(p.description ?? '')
        this.createdDate.set(
          new Date(p.createdAt).toLocaleDateString(this.i18n.locale, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        )
        this.title.setTitle(`${p.name} · Projects`)
      },
      error: (err: unknown) => {
        this.pending.set(false)
        this.loadError.set(apiErrorMessage(err, 'Failed to load project'))
      },
    })
  }

  save(): void {
    const p = this.project()
    if (!this.browser || !p || this.saveState() === 'saving') return
    this.saveState.set('saving')
    this.saveError.set(null)
    this.http
      .put<ApiResponse<{ project: Project }>>(
        `/api/projects/${this.slug()}`,
        { name: this.name(), description: this.description() || null },
        { withCredentials: true },
      )
      .subscribe({
        next: (res) => {
          if (!res.ok) {
            this.saveError.set(res.error.message)
            this.saveState.set('error')
            return
          }
          this.saveState.set('idle')
          this.load()
        },
        error: (err: unknown) => {
          this.saveError.set(apiErrorMessage(err, 'Failed to save'))
          this.saveState.set('error')
        },
      })
  }

  remove(): void {
    const p = this.project()
    if (!this.browser || !p) return
    this.confirmDelete.set(false)
    this.deleteState.set('deleting')
    this.http.delete<ApiResponse<{ deleted: boolean }>>(`/api/projects/${this.slug()}`, { withCredentials: true }).subscribe({
      next: (res) => {
        this.deleteState.set('idle')
        if (res.ok) {
          void this.router.navigate(['/projects'])
        } else {
          this.saveError.set(res.error.message)
        }
      },
      error: (err: unknown) => {
        this.deleteState.set('idle')
        this.saveError.set(apiErrorMessage(err, 'Failed to delete'))
      },
    })
  }
}
