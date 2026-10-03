 // @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Support } from '@/app/pages/support/support'

describe('Support', () => {
  let fixture: ComponentFixture<Support>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Support],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents()
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
    expect(text).toContain('Community Discord')
    expect(text).toContain('Email support')
  })

  it('renders eight FAQ accordion items', () => {
    const items = fixture.nativeElement.querySelectorAll('ui-accordion-item')
    expect(items.length).toBe(8)
  })
})
