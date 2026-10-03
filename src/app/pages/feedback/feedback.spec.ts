 // @vitest-environment jsdom
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import type { Signal, WritableSignal } from '@angular/core'
import { Feedback } from '@/app/pages/feedback/feedback'

describe('Feedback', () => {
  let fixture: ComponentFixture<Feedback>
  let http: HttpTestingController

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Feedback],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents()
    http = TestBed.inject(HttpTestingController)
    fixture = TestBed.createComponent(Feedback)
    fixture.detectChanges()
    await fixture.whenStable()
  })

  afterEach(() => http.verify())

  function vm() {
    return fixture.componentInstance as unknown as {
      category: WritableSignal<'idea' | 'bug' | 'praise'>
      subject: WritableSignal<string>
      message: WritableSignal<string>
      canSend: Signal<boolean>
      onSend(): void
    }
  }

  it('renders the form and recent sidebar', () => {
    const text = fixture.nativeElement.textContent as string
    expect(text).toContain('Send us a note')
    expect(text).toContain('Recent from the team')
    expect(fixture.nativeElement.querySelectorAll('ui-radio-group-item').length).toBe(3)
  })

  it('gates send on subject/message length', () => {
    const c = vm()
    expect(c.canSend()).toBe(false)
    c.subject.set('abc')
    c.message.set('too short')
    expect(c.canSend()).toBe(false)
    c.message.set('long enough details here')
    expect(c.canSend()).toBe(true)
  })

  it('posts the payload and shows the delivered banner', async () => {
    const c = vm()
    c.category.set('bug')
    c.subject.set('Broken thing')
    c.message.set('Steps to reproduce go here')
    c.onSend()

    const req = http.expectOne('/api/feedback')
    expect(req.request.method).toBe('POST')
    expect(req.request.withCredentials).toBe(true)
    expect(req.request.body).toEqual({ category: 'bug', subject: 'Broken thing', message: 'Steps to reproduce go here' })
    req.flush({ ok: true, data: { delivered: true, id: 'abc' } })
    fixture.detectChanges()
    await fixture.whenStable()

    expect(fixture.nativeElement.textContent).toContain('Thanks — we got it.')
    expect(c.subject()).toBe('')
    expect(c.message()).toBe('')
  })

  it('surfaces envelope errors', async () => {
    const c = vm()
    c.subject.set('Broken thing')
    c.message.set('Steps to reproduce go here')
    c.onSend()
    http.expectOne('/api/feedback').flush({ ok: false, error: { code: 'VALIDATION_FAILED', message: 'Too short' } })
    fixture.detectChanges()
    await fixture.whenStable()
    expect(fixture.nativeElement.textContent).toContain('Too short')
  })
})
