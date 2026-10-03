import { describe, expect, it } from 'vitest'
import {
  arcPath,
  customerRadius,
  customerRegions,
  kindBadgeVariant,
  kindDotBg,
  kindDotClass,
  markerSizeClass,
  officeBounds,
  officeLocations,
  timeInZone,
  utcOffsetLabel,
} from '@/app/core/dashboard/locations'

describe('locations lib', () => {
  it('ships 12 offices summing to the dashboard headcount total', () => {
    expect(officeLocations.length).toBe(12)
    expect(officeLocations.reduce((s, o) => s + o.headcount, 0)).toBe(1221)
  })

  it('maps office kinds to badge variants and dot classes', () => {
    expect(kindBadgeVariant('hq')).toBe('default')
    expect(kindBadgeVariant('hub')).toBe('secondary')
    expect(kindBadgeVariant('office')).toBe('outline')
    expect(kindDotClass('hq')).toContain('bg-primary')
    expect(kindDotBg('hub')).toBe('bg-chart-1')
  })

  it('bounds every office in [lng, lat] order', () => {
    const bounds = officeBounds(officeLocations)
    expect(bounds?.[0][0]).toBeLessThan(bounds?.[1][0] ?? 0)
    expect(officeBounds([])).toBeNull()
  })

  it('draws north-bowing HQ arcs with the requested segment count', () => {
    const path = arcPath([-122.4194, 37.7749], [13.405, 52.52])
    expect(path.length).toBe(33)
    expect(path[0]).toEqual([-122.4194, 37.7749])
  })

  it('scales customer circles by ARR and markers by headcount', () => {
    expect(customerRadius(3120)).toBeGreaterThan(customerRadius(310))
    expect(markerSizeClass(312)).toBe('size-5')
    expect(markerSizeClass(39)).toBe('size-3')
    expect(customerRegions.length).toBeGreaterThan(0)
  })

  it('labels IANA offsets with DST-aware Intl output', () => {
    const winter = new Date('2026-01-15T12:00:00Z')
    const summer = new Date('2026-07-15T12:00:00Z')
    // London is UTC+0 in winter, UTC+1 in summer — fixed offsets can't do this.
    expect(utcOffsetLabel('Europe/London', winter)).toBe('UTC+0')
    expect(utcOffsetLabel('Europe/London', summer)).toBe('UTC+1')
    expect(timeInZone('Asia/Tokyo', winter)).toMatch(/^\d{2}:\d{2}$/)
  })
})
