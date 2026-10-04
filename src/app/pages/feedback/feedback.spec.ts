 // @vitest-environment jsdom
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import type { Signal, WritableSignal } from '@angular/core'
import { provideRouter } from '@angular/router'
import { Feedback } from '@/app/pages/feedback/feedback'
import { provideTestI18n, seedI18n } from '../../../../test-utils/i18n'

describe('Feedback', () => {
  let fixture: ComponentFixture<Feedback>
  let http: HttpTestingController

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Feedback],
      providers: [provideZonelessChangeDetection(), provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideTestI18n()],
    }).compileComponents()
    seedI18n()
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
      files: Signal<File[]>
      fileError: Signal<string | null>
      onFilesPicked(next: File[]): void
      onSend(): void
    }
  }

  it('renders the form and recent sidebar', () => {
    const text = fixture.nativeElement.textContent as string
    expect(text).toContain('Send us a note')
    expect(text).toContain('Recent from the team')
    expect(fixture.nativeElement.querySelectorAll('ui-radio-group-item').length).toBe(3)
    // Nuxt sample sidebar, labelled as sample data.
    expect(text).toContain('Sample feedback. Your team')
    expect(text).toContain('Chart tooltip flickers when a series crosses zero')
    expect(text).toContain('Screenshots (optional)')
  })

  it('accepts up to 3 images and rejects non-images', () => {
    const c = vm()
    const img = (n: string) => new File(['x'], n, { type: 'image/png' })
    c.onFilesPicked([new File(['x'], 'notes.txt', { type: 'text/plain' })])
    expect(c.files()).toHaveLength(0)
    expect(c.fileError()).toContain('notes.txt is not an image')
    c.onFilesPicked([img('a.png'), img('b.png'), img('c.png'), img('d.png')])
    expect(c.files().map(f => f.name)).toEqual(['a.png', 'b.png', 'c.png'])
    expect(c.fileError()).toContain('up to 3 images')
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
    // Multipart, so attached screenshots travel with the fields.
    const body = req.request.body as FormData
    expect(body).toBeInstanceOf(FormData)
    expect(Object.fromEntries([...body.entries()].filter(([, v]) => typeof v === 'string'))).toEqual({ category: 'bug', subject: 'Broken thing', message: 'Steps to reproduce go here' })
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
