// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { UiThemeCustomizerComponent } from '@/app/components/blocks/theme-customizer/theme-customizer.component'
import { COLOR_THEMES } from '@/app/core/theme/color-themes'
import { ColorThemeService } from '@/app/core/theme/color-theme.service'

describe('UiThemeCustomizerComponent', () => {
  let fixture: ComponentFixture<UiThemeCustomizerComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiThemeCustomizerComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents()
    fixture = TestBed.createComponent(UiThemeCustomizerComponent)
    fixture.detectChanges()
    await fixture.whenStable()
  })

  it('renders the customize trigger', () => {
    const trigger = fixture.nativeElement.querySelector('button[aria-label="Customize theme"]')
    expect(trigger).toBeTruthy()
  })

  it('applies a preset through the color theme service', () => {
    const color = TestBed.inject(ColorThemeService)
    color.setColorTheme('blue')
    expect(color.colorTheme()).toBe('blue')
    expect(document.documentElement.getAttribute('data-color-theme')).toBe('blue')
    color.reset()
    expect(document.documentElement.getAttribute('data-color-theme')).toBeNull()
  })

  it('exposes every preset id', () => {
    expect(COLOR_THEMES.length).toBe(13)
    expect(new Set(COLOR_THEMES.map((t) => t.id))).toContain('emerald')
  })
})
