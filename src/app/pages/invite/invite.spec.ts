// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { ActivatedRoute, provideRouter } from '@angular/router'
import { of } from 'rxjs'
import { Invite } from '@/app/pages/invite/invite'
import { AuthService } from '@/app/core/auth/auth.service'

describe('Invite', () => {
  let fixture: ComponentFixture<Invite>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Invite],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'tok-test-12345678901234567890123456789012' } } },
        },
        { provide: AuthService, useValue: { user$: of(null), loggedIn: false, fetch: () => of(null) } },
      ],
    }).compileComponents()
    fixture = TestBed.createComponent(Invite)
    fixture.detectChanges()
    TestBed.inject(HttpTestingController)
      .expectOne((req) => req.url.startsWith('/api/team/invites/'))
      .flush({ ok: true, data: { email: 'chloe@acme.com', role: 'editor', valid: true } })
    fixture.detectChanges()
    await fixture.whenStable()
  })

  it('renders the verified invite', () => {
    const text = fixture.nativeElement.textContent as string
    expect(text).toContain('Join the workspace')
    expect(text).toContain('chloe@acme.com')
    expect(text).toContain('editor')
  })

  it('sends anonymous users to sign in', () => {
    expect(fixture.componentInstance.ctaLabel()).toBe('Sign in')
  })
})
