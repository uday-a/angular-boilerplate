// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { UiUsageBarComponent } from '@/app/components/blocks/usage-bar/usage-bar.component'

describe('UiUsageBarComponent', () => {
  let fixture: ComponentFixture<UiUsageBarComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiUsageBarComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents()
    fixture = TestBed.createComponent(UiUsageBarComponent)
  })

  it('computes pct and exposes it as aria-valuenow', () => {
    fixture.componentInstance.label = 'API calls'
    fixture.componentInstance.used = 482300
    fixture.componentInstance.limit = 1000000
    fixture.detectChanges()
    const bar = fixture.nativeElement.querySelector('[role="progressbar"]')
    expect(bar?.getAttribute('aria-valuenow')).toBe('48')
    expect(bar?.getAttribute('aria-label')).toBe('API calls')
  })

  it('uses the warning tone at 70%+ and destructive at 90%+', () => {
    const c = fixture.componentInstance
    c.used = 80
    c.limit = 100
    expect(c.barClass).toContain('bg-warning')
    c.used = 95
    expect(c.barClass).toContain('bg-destructive')
    c.used = 10
    expect(c.barClass).toContain('bg-primary')
  })

  it('guards division by zero', () => {
    fixture.componentInstance.used = 5
    fixture.componentInstance.limit = 0
    expect(fixture.componentInstance.pct).toBe(0)
  })
})
