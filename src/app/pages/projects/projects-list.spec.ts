 // @vitest-environment jsdom
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import type { WritableSignal } from '@angular/core'
import { ProjectsList, slugifyProjectName } from '@/app/pages/projects/projects-list'

describe('slugifyProjectName', () => {
  it('derives kebab-case slugs', () => {
    expect(slugifyProjectName('My New Project')).toBe('my-new-project')
    expect(slugifyProjectName('  Hello, World!  ')).toBe('hello-world')
  })

  it('trims dashes and caps length', () => {
    expect(slugifyProjectName('--a--')).toBe('a')
    expect(slugifyProjectName('x'.repeat(100)).length).toBe(64)
  })
})

describe('ProjectsList', () => {
  let fixture: ComponentFixture<ProjectsList>
  let http: HttpTestingController

  const DEMO = [
    { id: 1, slug: 'design-engineering', name: 'Design Engineering', description: 'FE platform', ownerId: 0, createdAt: '2026-01-12', updatedAt: '2026-04-30' },
    { id: 2, slug: 'travel', name: 'Travel', description: null, ownerId: 0, createdAt: '2026-03-19', updatedAt: '2026-05-15' },
  ]

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsList],
      providers: [provideZonelessChangeDetection(), provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents()
    http = TestBed.inject(HttpTestingController)
    fixture = TestBed.createComponent(ProjectsList)
    fixture.detectChanges()
  })

  afterEach(() => http.verify())

  function flushList() {
    http.expectOne('/api/projects').flush({ ok: true, data: { projects: DEMO } })
    fixture.detectChanges()
  }

  it('loads and renders project cards', async () => {
    flushList()
    await fixture.whenStable()
    const text = fixture.nativeElement.textContent as string
    expect(text).toContain('Design Engineering')
    expect(text).toContain('Travel')
    const links = [...fixture.nativeElement.querySelectorAll('a[href]')] as HTMLAnchorElement[]
    expect(links.map((a) => a.getAttribute('href'))).toContain('/projects/design-engineering')
  })

  it('shows an empty state when there are no projects', async () => {
    http.expectOne('/api/projects').flush({ ok: true, data: { projects: [] } })
    fixture.detectChanges()
    await fixture.whenStable()
    expect(fixture.nativeElement.textContent).toContain('No projects yet')
  })

  it('surfaces envelope errors', async () => {
    http.expectOne('/api/projects').flush({ ok: false, error: { code: 'FORBIDDEN', message: 'Denied' } })
    fixture.detectChanges()
    await fixture.whenStable()
    expect(fixture.nativeElement.textContent).toContain('Denied')
  })

  it('auto-derives the slug from the name until the slug is touched', () => {
    flushList()
    const c = fixture.componentInstance as unknown as {
      onNameInput(v: string): void
      onSlugInput(v: string): void
      slug: WritableSignal<string>
    }
    c.onNameInput('My Cool Thing')
    expect(c.slug()).toBe('my-cool-thing')
    c.onSlugInput('custom')
    c.onNameInput('Something Else')
    expect(c.slug()).toBe('custom')
  })

  it('creates a project, closes the dialog, and reloads', async () => {
    flushList()
    const c = fixture.componentInstance as unknown as {
      name: WritableSignal<string>
      slug: WritableSignal<string>
      description: WritableSignal<string>
      open: WritableSignal<boolean>
      createProject(): void
    }
    c.open.set(true)
    c.name.set('New Thing')
    c.slug.set('new-thing')
    c.description.set('desc')
    c.createProject()

    const post = http.expectOne('/api/projects')
    expect(post.request.method).toBe('POST')
    expect(post.request.withCredentials).toBe(true)
    expect(post.request.body).toEqual({ slug: 'new-thing', name: 'New Thing', description: 'desc' })
    post.flush({ ok: true, data: { project: { ...DEMO[0], slug: 'new-thing', name: 'New Thing' } } })

    // Reload after create.
    http.expectOne('/api/projects').flush({ ok: true, data: { projects: DEMO } })
    fixture.detectChanges()
    await fixture.whenStable()
    expect(c.open()).toBe(false)
    expect(c.name()).toBe('')
  })
})
