// @vitest-environment jsdom
import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { provideRouter, Router } from '@angular/router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Onboarding } from './onboarding'

describe('Onboarding', () => {
  let component: Onboarding
  let router: Router

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    })
    const fixture = TestBed.createComponent(Onboarding)
    component = fixture.componentInstance
    router = TestBed.inject(Router)
    fixture.detectChanges()
  })

  it('starts on step 0 (Profile)', () => {
    expect(component['step']()).toBe(0)
  })

  it('next() advances through steps then finishes to /dashboard', () => {
    const spy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true as never)
    component.next()
    expect(component['step']()).toBe(1)
    component.next()
    expect(component['step']()).toBe(2)
    component.next()
    expect(spy).toHaveBeenCalledWith('/dashboard')
  })

  it('back() never goes below 0', () => {
    component.back()
    expect(component['step']()).toBe(0)
    component.next()
    component.back()
    expect(component['step']()).toBe(0)
  })

  it('skip() goes straight to /dashboard', () => {
    const spy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true as never)
    component.skip()
    expect(spy).toHaveBeenCalledWith('/dashboard')
  })

  it('stepBadgeClass marks past/current/future steps', () => {
    component.next() // step 1
    expect(component.stepBadgeClass(0)).toContain('bg-primary')
    expect(component.stepBadgeClass(1)).toContain('border-foreground')
    expect(component.stepBadgeClass(2)).toContain('text-muted-foreground')
  })
})
