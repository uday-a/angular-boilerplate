 // @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { Support } from '@/app/pages/support/support'
import { provideTestI18n, seedI18n } from '../../../../test-utils/i18n'

describe('Support', () => {
  let fixture: ComponentFixture<Support>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Support],
      providers: [provideZonelessChangeDetection(), provideRouter([]), provideTestI18n()],
    }).compileComponents()
    seedI18n()
    fixture = TestBed.createComponent(Support)
    fixture.detectChanges()
    await fixture.whenStable()
  })

  it('renders the status banner', () => {
    expect(fixture.nativeElement.textContent).toContain('All systems operational')
  })

  it('renders three channel cards', () => {
    const text = fixture.nativeElement.textContent as string
    expect(text).toContain('Documentation')
    expect(text).toContain('Community')
    expect(text).toContain('Email support')
    // Nuxt dropped the Discord channel and the LLM-product copy.
    expect(text).not.toContain('Discord')
    expect(text).not.toContain('Explorer')
  })

  it('renders eight FAQ accordion items', () => {
    const items = fixture.nativeElement.querySelectorAll('ui-accordion-item')
    expect(items.length).toBe(8)
  })
})
