import { describe, expect, it } from 'vitest'
import { cn, formatMoney, formatNumber, safeRedirectPath } from '@/app/core/utils/cn'

describe('cn', () => {
  it('merges tailwind classes, last wins', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('handles falsy and array inputs', () => {
    expect(cn('a', undefined, null, ['c'])).toBe('a c')
  })
})

describe('safeRedirectPath', () => {
  it('accepts internal paths with query strings', () => {
    expect(safeRedirectPath('/dashboard?x=1')).toBe('/dashboard?x=1')
  })

  it('rejects external urls', () => {
    expect(safeRedirectPath('https://evil.com')).toBe('/dashboard')
  })

  it('rejects protocol-relative urls', () => {
    expect(safeRedirectPath('//evil.com')).toBe('/dashboard')
  })

  it('falls back on empty input', () => {
    expect(safeRedirectPath(null)).toBe('/dashboard')
    expect(safeRedirectPath(undefined, '/login')).toBe('/login')
  })
})

describe('formatMoney / formatNumber (Rule15 centralization)', () => {
  it('formats USD with grouping and renders zero as $0 (never an em-dash)', () => {
    expect(formatMoney(4800)).toBe('$4,800')
    expect(formatMoney(0)).toBe('$0')
    expect(formatMoney(115700)).toBe('$115,700')
  })

  it('formats plain counts with grouping', () => {
    expect(formatNumber(1221)).toBe('1,221')
    expect(formatNumber(0)).toBe('0')
  })
})
