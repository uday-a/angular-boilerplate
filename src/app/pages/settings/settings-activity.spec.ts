// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideRouter } from '@angular/router'
import { SettingsActivity } from '@/app/pages/settings/settings-activity'
import { I18nService } from '@/app/core/i18n'

const ITEMS = [
  { id: 1, userId: 1, action: 'team.invite', entity: 'invite', entityId: '9', metadata: null, createdAt: '2026-09-28T10:00:00Z', actorEmail: 'a@acme.com' },
  { id: 2, userId: 1, action: 'auth.login', entity: null, entityId: null, metadata: null, createdAt: '2026-09-27T10:00:00Z', actorEmail: null },
]

describe('SettingsActivity', () => {
  let fixture: ComponentFixture<SettingsActivity>
  let httpMock: HttpTestingController

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsActivity],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: I18nService, useValue: { locale: 'en' } },
      ],
    }).compileComponents()
    httpMock = TestBed.inject(HttpTestingController)
    fixture = TestBed.createComponent(SettingsActivity)
    fixture.detectChanges()
    TestBed.inject(HttpTestingController).expectOne('/api/activity').flush({ ok: true, data: { items: ITEMS, total: 2 } })
    fixture.detectChanges()
    await fixture.whenStable()
  })

  it('renders the audit rows', () => {
    const text = fixture.nativeElement.textContent as string
    expect(text).toContain('team.invite')
    expect(text).toContain('auth.login')
    expect(text).toContain('Deleted user')
  })

  it('filters by entity client-side and clears', () => {
    fixture.componentInstance.entityQuery.set('invite')
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).not.toContain('auth.login')
    fixture.componentInstance.clearFilters()
    const req = httpMock.expectOne('/api/activity')
    expect(req.request.params.has('action')).toBe(false)
    req.flush({ ok: true, data: { items: ITEMS, total: 2 } })
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('auth.login')
  })
})
