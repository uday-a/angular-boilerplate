// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { UiStatTileComponent } from '@/app/components/blocks/stat-tile/stat-tile.component'

describe('UiStatTileComponent', () => {
  let fixture: ComponentFixture<UiStatTileComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiStatTileComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents()
    fixture = TestBed.createComponent(UiStatTileComponent)
    fixture.componentRef.setInput('label', 'Headcount')
    fixture.componentRef.setInput('value', '1,221')
    fixture.componentRef.setInput('delta', '+14%')
    fixture.componentRef.setInput('caption', 'Across all offices')
    fixture.detectChanges()
    await fixture.whenStable()
  })

  it('renders label, value, delta and caption', () => {
    const text = fixture.nativeElement.textContent as string
    expect(text).toContain('Headcount')
    expect(text).toContain('1,221')
    expect(text).toContain('+14%')
    expect(text).toContain('Across all offices')
  })

  it('tones positive deltas as success', () => {
    const delta = fixture.nativeElement.querySelector('.text-success')
    expect(delta?.textContent).toContain('+14%')
  })

  it('tones negative deltas as destructive', () => {
    fixture.componentRef.setInput('deltaTone', 'negative')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.text-destructive')).toBeTruthy()
    expect(fixture.nativeElement.querySelector('.text-success')).toBeNull()
  })
})
