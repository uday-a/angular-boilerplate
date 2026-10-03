// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideRouter } from '@angular/router'
import { AdminUsers, userInitials } from '@/app/pages/admin/admin-users'
import { TranslateService, provideTranslateService } from '@ngx-translate/core'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Real en catalog so copy assertions track the shipped admin.* strings.
const en = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../assets/i18n/en.json'), 'utf8'))

const providers = () => [
  provideZonelessChangeDetection(),
  provideRouter([]),
  provideHttpClient(),
  provideHttpClientTesting(),
  provideTranslateService({ fallbackLang: 'en' }),
]

function seedI18n(): void {
  const translate = TestBed.inject(TranslateService)
  translate.setTranslation('en', en)
  translate.use('en')
}

const USERS = [
  { id: 1, login: 'olivia.bennett', name: 'Olivia Bennett', role: 'admin', createdAt: '2025-11-04T09:12:00Z' },
  { id: 5, login: 'emma.collins', name: 'Emma Collins', role: 'user', createdAt: '2026-04-02T08:55:00Z' },
]

describe('userInitials', () => {
  it('initials name or login', () => {
    expect(userInitials('Olivia Bennett')).toBe('OB')
  })
})

describe('AdminUsers', () => {
  let fixture: ComponentFixture<AdminUsers>
  let httpMock: HttpTestingController

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUsers],
      providers: providers(),
    }).compileComponents()
    seedI18n()
    httpMock = TestBed.inject(HttpTestingController)
    fixture = TestBed.createComponent(AdminUsers)
    fixture.detectChanges()
    httpMock.expectOne('/api/admin/users').flush({ ok: true, data: USERS })
    fixture.detectChanges()
    await fixture.whenStable()
  })

  it('renders the user table', () => {
    const text = fixture.nativeElement.textContent as string
    expect(text).toContain('Olivia Bennett')
    expect(text).toContain('Emma Collins')
    expect(text).toContain('2 registered users')
    const badges = Array.from(fixture.nativeElement.querySelectorAll('ui-badge')).map(
      (b) => (b as HTMLElement).textContent?.trim(),
    )
    expect(badges).toContain('Admin')
    expect(badges).toContain('Member')
    expect(badges).not.toContain('User')
    expect(text).toContain('2 of 2')
  })

  // Nuxt filters by Joined date range, inclusive of the whole end day.
  it('filters by the Joined range, end day inclusive', () => {
    const c = fixture.componentInstance as unknown as {
      onRange: (r: { from: Date, to: Date }) => void
      filtered: () => { login: string }[]
      activeFilters: () => number
    }
    c.onRange({ from: new Date(2026, 3, 1), to: new Date(2026, 3, 2) })
    expect(c.filtered().map((u) => u.login)).toEqual(['emma.collins'])
    expect(c.activeFilters()).toBe(1)
  })

  it('shows the admins-only card on 403', async () => {
    await TestBed.resetTestingModule()
    await TestBed.configureTestingModule({
      imports: [AdminUsers],
      providers: providers(),
    }).compileComponents()
    seedI18n()
    const f2 = TestBed.createComponent(AdminUsers)
    f2.detectChanges()
    TestBed.inject(HttpTestingController)
      .expectOne('/api/admin/users')
      .flush({ ok: false, error: { code: 'FORBIDDEN', message: 'Denied' } })
    f2.detectChanges()
    await f2.whenStable()
    const text = f2.nativeElement.textContent as string
    expect(text).toContain('Admins only')
    expect(text).toContain('Required: admin')
  })
})
