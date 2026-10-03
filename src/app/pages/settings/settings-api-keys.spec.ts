// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideRouter } from '@angular/router'
import { SettingsApiKeys, scopeBadges } from '@/app/pages/settings/settings-api-keys'
import { I18nService } from '@/app/core/i18n'

const KEYS = [
  { id: 1, name: 'CI deploy', prefix: 'uipk_live_abc', scopes: 'read write', lastUsedAt: null, expiresAt: null, revokedAt: null, createdAt: '2026-09-01T10:00:00Z' },
]

describe('scopeBadges', () => {
  it('splits scope strings', () => {
    expect(scopeBadges('read write')).toEqual(['read', 'write'])
    expect(scopeBadges('')).toEqual([])
  })
})

describe('SettingsApiKeys', () => {
  let fixture: ComponentFixture<SettingsApiKeys>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsApiKeys],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: I18nService, useValue: { locale: 'en' } },
      ],
    }).compileComponents()
    fixture = TestBed.createComponent(SettingsApiKeys)
    fixture.detectChanges()
    TestBed.inject(HttpTestingController).expectOne('/api/keys').flush({ ok: true, data: { keys: KEYS } })
    fixture.detectChanges()
    await fixture.whenStable()
  })

  it('renders the key table', () => {
    const text = fixture.nativeElement.textContent as string
    expect(text).toContain('CI deploy')
    expect(text).toContain('uipk_live_abc')
  })

  it('uses column headers and heading landmarks', () => {
    const heads = Array.from(fixture.nativeElement.querySelectorAll('thead th')) as HTMLTableCellElement[]
    expect(heads.length).toBeGreaterThan(0)
    for (const th of heads) expect(th.getAttribute('scope')).toBe('col')
    const headings = Array.from(fixture.nativeElement.querySelectorAll('h2')).map((h) => (h as HTMLElement).textContent?.trim())
    expect(headings).toContain('Create a key')
    expect(headings).toContain('Your keys')
  })

  it('returns focus to the revoke trigger after Esc closes the dialog', async () => {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]
    const revoke = buttons.find((b) => b.getAttribute('aria-label') === 'Revoke key CI deploy')
    revoke?.focus()
    revoke?.click()
    fixture.detectChanges()
    await fixture.whenStable()
    expect(fixture.componentInstance.revokeTarget()?.name).toBe('CI deploy')
    // Focus moved into the dialog (Radix openAutoFocus behaviour).
    expect(fixture.nativeElement.contains(document.activeElement)).toBe(false)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    fixture.detectChanges()
    await fixture.whenStable()
    expect(fixture.componentInstance.revokeTarget()).toBeNull()
    // The dialog primitive returns focus to the opener on close.
    expect(document.activeElement).toBe(revoke)
  })

  it('opens the revoke dialog instead of window.confirm', async () => {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]
    const revoke = buttons.find((b) => b.getAttribute('aria-label') === 'Revoke key CI deploy')
    revoke?.click()
    fixture.detectChanges()
    await fixture.whenStable()
    expect(fixture.componentInstance.revokeTarget()?.name).toBe('CI deploy')
    // Dialog content renders in a body portal, not under the fixture root.
    expect(document.body.textContent).toContain('Revoke “CI deploy”?')
  })
})
