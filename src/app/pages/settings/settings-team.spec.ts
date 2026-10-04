// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideRouter } from '@angular/router'
import { SettingsTeam, memberInitials } from '@/app/pages/settings/settings-team'
import { of } from 'rxjs'
import { AuthService } from '@/app/core/auth/auth.service'
import { provideTestI18n, seedI18n } from '../../../../test-utils/i18n'

const MEMBERS = [
  { id: 1, name: 'Olivia Bennett', email: 'olivia@acme.com', role: 'admin', createdAt: '2025-11-04T09:12:00Z' },
]

const INVITES = [
  { id: 101, email: 'chloe@acme.com', role: 'editor', expiresAt: '2026-10-05T10:00:00Z', createdAt: '2026-09-28T10:00:00Z' },
]

describe('memberInitials', () => {
  it('initials a full name', () => {
    expect(memberInitials('Olivia Bennett')).toBe('OB')
  })
})

describe('SettingsTeam', () => {
  let fixture: ComponentFixture<SettingsTeam>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsTeam],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestI18n(),
        // Admins see the invite button and the pending-invites card.
        { provide: AuthService, useValue: { user$: of({ role: 'admin' }) } },
      ],
    }).compileComponents()
    seedI18n()
    fixture = TestBed.createComponent(SettingsTeam)
    fixture.detectChanges()
    const httpMock = TestBed.inject(HttpTestingController)
    httpMock.expectOne('/api/team/members').flush({ ok: true, data: { members: MEMBERS } })
    httpMock.expectOne('/api/team/invites').flush({ ok: true, data: { invites: INVITES } })
    fixture.detectChanges()
    await fixture.whenStable()
  })

  it('renders members and pending invites from the API', () => {
    const text = fixture.nativeElement.textContent as string
    expect(text).toContain('Olivia Bennett')
    expect(text).toContain('chloe@acme.com')
    expect(text).toContain('1 members · 1 pending invites')
    expect(text).toContain('Admin')
    expect(text).toContain('Status')
    expect(text).toContain('1 of 1')
  })

  it('labels roles Member / Editor / Admin, never the raw role id', () => {
    const text = fixture.nativeElement.textContent as string
    expect(text).toContain('Invited as Editor · Expires')
    expect(text).not.toContain('Invited as editor')
  })

  it('filters members by role and counts what is shown', async () => {
    ;(fixture.componentInstance as unknown as { onRole: (r: string) => void }).onRole('editor')
    fixture.detectChanges()
    await fixture.whenStable()
    const text = fixture.nativeElement.textContent as string
    expect(text).toContain('0 of 1')
    expect(text).not.toContain('Olivia Bennett')
  })

  it('rejects a malformed email before the round-trip', async () => {
    fixture.componentInstance.dialogOpen.set(true)
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.componentInstance.inviteEmail.set('not-an-email')
    fixture.componentInstance.sendInvite()
    fixture.detectChanges()
    await fixture.whenStable()
    expect(fixture.componentInstance.submitState()).toBe('error')
    // The invite form renders in a body portal, not under the fixture root.
    expect(document.body.textContent).toContain('valid email')
  })
})
