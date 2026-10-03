// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { UiDemoDataBannerComponent } from '@/app/components/blocks/demo-data-banner/demo-data-banner.component'

describe('UiDemoDataBannerComponent', () => {
  let fixture: ComponentFixture<UiDemoDataBannerComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiDemoDataBannerComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents()
    fixture = TestBed.createComponent(UiDemoDataBannerComponent)
    fixture.detectChanges()
    await fixture.whenStable()
  })

  it('renders the default sample-data message as a note', () => {
    const banner = fixture.nativeElement.querySelector('[role="note"]')
    expect(banner?.textContent).toContain('Sample data')
  })

  it('renders a custom message', () => {
    fixture.componentRef.setInput('message', 'Custom note.')
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Custom note.')
  })
})
