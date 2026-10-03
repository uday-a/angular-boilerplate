// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { TranslateService, provideTranslateService } from '@ngx-translate/core'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { AdminRoles } from '@/app/pages/admin/admin-roles'

const en = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../assets/i18n/en.json'), 'utf8'))

describe('AdminRoles', () => {
  let fixture: ComponentFixture<AdminRoles>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminRoles],
      providers: [provideZonelessChangeDetection(), provideRouter([]), provideTranslateService({ fallbackLang: 'en' })],
    }).compileComponents()
    const translate = TestBed.inject(TranslateService)
    translate.setTranslation('en', en)
    translate.use('en')
    fixture = TestBed.createComponent(AdminRoles)
    fixture.detectChanges()
    await fixture.whenStable()
  })

  it('renders role summaries and the permission matrix', () => {
    const text = fixture.nativeElement.textContent as string
    expect(text).toContain('Owner')
    expect(text).toContain('View projects')
    expect(text).toContain('Delete projects')
    // Plural via admin.roles.members ("1 member", never "1 members").
    expect(text).toContain('1 member')
    expect(text).not.toMatch(/\b1 members/)
  })

  it('gives every permission checkbox an accessible name', () => {
    const boxes = Array.from(
      fixture.nativeElement.querySelectorAll('button[role="checkbox"]'),
    ) as HTMLButtonElement[]
    expect(boxes.length).toBeGreaterThan(100)
    for (const box of boxes) {
      expect(box.getAttribute('aria-label')).toMatch(/.+ — .+|^All .+ permissions for .+$/)
    }
    const labels = boxes.map((box) => box.getAttribute('aria-label') ?? '')
    expect(labels).toContain('Edit projects — Admin')
  })

  it('tracks unsaved changes until save or discard', () => {
    expect(fixture.componentInstance.changeCount()).toBe(0)
    // Viewer starts without projects.create — granting it is one change.
    expect(fixture.componentInstance.has('viewer', 'projects.create')).toBe(false)
    fixture.componentInstance.toggle('viewer', 'projects.create', true)
    fixture.detectChanges()
    expect(fixture.componentInstance.changeCount()).toBe(1)
    fixture.componentInstance.discard()
    expect(fixture.componentInstance.changeCount()).toBe(0)
    fixture.componentInstance.toggle('viewer', 'projects.create', true)
    fixture.componentInstance.save()
    expect(fixture.componentInstance.changeCount()).toBe(0)
  })
})
