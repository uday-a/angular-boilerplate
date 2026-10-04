// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { SettingsHub } from '@/app/pages/settings/settings-hub'
import { provideTestI18n, seedI18n } from '../../../../test-utils/i18n'

describe('SettingsHub', () => {
  let fixture: ComponentFixture<SettingsHub>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsHub],
      providers: [provideZonelessChangeDetection(), provideRouter([]), provideTestI18n()],
    }).compileComponents()
    seedI18n()
    fixture = TestBed.createComponent(SettingsHub)
    fixture.detectChanges()
    await fixture.whenStable()
  })

  it('renders all ten section cards', () => {
    const cards = fixture.nativeElement.querySelectorAll('ui-card')
    expect(cards.length).toBe(10)
  })

  it('links each card to its sub-page, in Nuxt order', () => {
    const links = [...fixture.nativeElement.querySelectorAll('a[href]')] as HTMLAnchorElement[]
    expect(links.map(a => a.getAttribute('href'))).toEqual(
      ['general', 'account', 'security', 'api-keys', 'notifications', 'integrations', 'team', 'activity', 'billing', 'limits'].map(s => `/settings/${s}`),
    )
  })

  it('titles cards with the sidebar nav labels and shows metas from the shared mocks', () => {
    const text = fixture.nativeElement.textContent as string
    expect(text).toContain('Activity log')
    expect(text).toContain('8 members · 2 pending')
    // Billing + Limits metas come from usage-mock, so they agree with those pages.
    expect(text).toContain('Pro · renews')
    expect(text).toContain('48% of API calls used')
  })
})
