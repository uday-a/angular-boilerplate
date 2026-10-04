// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { UiLocaleSwitcherComponent } from '@/app/components/blocks/locale-switcher/locale-switcher.component'
import { I18nService } from '@/app/core/i18n/i18n.service'
import { provideTestI18n, seedI18n } from '../../../../../test-utils/i18n'

describe('UiLocaleSwitcherComponent', () => {
  let fixture: ComponentFixture<UiLocaleSwitcherComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiLocaleSwitcherComponent],
      providers: [provideZonelessChangeDetection(), provideTestI18n()],
    }).compileComponents()
    seedI18n()
    fixture = TestBed.createComponent(UiLocaleSwitcherComponent)
    fixture.detectChanges()
    await fixture.whenStable()
  })

  it('renders the language trigger with the current locale', () => {
    const trigger = fixture.nativeElement.querySelector('button[aria-label="Language"]')
    expect(trigger).toBeTruthy()
    expect(trigger.textContent).toContain('English')
  })

  it('switches locale through the i18n service', () => {
    const i18n = TestBed.inject(I18nService)
    i18n.setLocale('es')
    fixture.detectChanges()
    const trigger = fixture.nativeElement.querySelector('button[aria-label="Language"]')
    expect(trigger.textContent).toContain('Español')
    i18n.setLocale('en')
  })
})
