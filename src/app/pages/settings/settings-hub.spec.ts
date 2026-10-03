 // @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { SettingsHub } from '@/app/pages/settings/settings-hub'

describe('SettingsHub', () => {
  let fixture: ComponentFixture<SettingsHub>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsHub],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents()
    fixture = TestBed.createComponent(SettingsHub)
    fixture.detectChanges()
    await fixture.whenStable()
  })

  it('renders all ten section cards', () => {
    const cards = fixture.nativeElement.querySelectorAll('ui-card')
    expect(cards.length).toBe(10)
  })

  it('links each card to its sub-page', () => {
    const links = [...fixture.nativeElement.querySelectorAll('a[href]')] as HTMLAnchorElement[]
    const hrefs = links.map((a) => a.getAttribute('href'))
    for (const slug of ['general', 'account', 'security', 'api-keys', 'notifications', 'integrations', 'team', 'activity', 'billing', 'limits']) {
      expect(hrefs).toContain(`/settings/${slug}`)
    }
  })

  it('shows section titles and metas', () => {
    const text = fixture.nativeElement.textContent as string
    expect(text).toContain('General')
    expect(text).toContain('Billing')
    expect(text).toContain('Limits')
    expect(text).toContain('8 members')
  })
})
