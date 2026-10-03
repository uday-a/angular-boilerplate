import { describe, expect, it } from 'vitest'
import {
  createMonthGrid,
  dateFromKey,
  dayDiff,
  isoDate,
} from './month-grid'

describe('month-grid helpers', () => {
  it('round-trips iso dates', () => {
    expect(isoDate(new Date(2026, 4, 16))).toBe('2026-05-16')
    expect(dateFromKey('2026-05-16').getDate()).toBe(16)
    expect(dayDiff('2026-05-16', '2026-05-18')).toBe(2)
  })
})

describe('createMonthGrid', () => {
  it('builds a 42-cell grid for the cursor month', () => {
    const grid = createMonthGrid({ initialDate: '2026-05-16' })
    expect(grid.gridDays()).toHaveLength(42)
    expect(grid.monthLabel()).toBe('May 2026')
    expect(grid.gridDays().filter((d) => d.inMonth)).toHaveLength(31)
  })

  it('orders weekdays from Sunday by default', () => {
    const grid = createMonthGrid({ initialDate: '2026-05-16' })
    expect(grid.weekdays()).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
  })

  it('selects a single day and clears back to today', () => {
    const grid = createMonthGrid({ initialDate: '2026-05-16' })
    grid.selectDay('2026-05-20')
    expect(grid.rangeBounds()).toEqual({ lo: '2026-05-20', hi: '2026-05-20' })
    expect(grid.isRange()).toBe(false)
    expect(grid.inRange('2026-05-20')).toBe(true)
    expect(grid.inRange('2026-05-21')).toBe(false)
    grid.clearRange()
    expect(grid.rangeBounds()).toEqual({ lo: grid.todayKey, hi: grid.todayKey })
  })

  it('normalizes reversed drag ranges', () => {
    const grid = createMonthGrid({ initialDate: '2026-05-16' })
    grid.rangeStart.set('2026-05-20')
    grid.rangeEnd.set('2026-05-18')
    expect(grid.rangeBounds()).toEqual({ lo: '2026-05-18', hi: '2026-05-20' })
    expect(grid.rangeDayCount()).toBe(3)
    expect(grid.isRange()).toBe(true)
  })

  it('selects the full week containing a day', () => {
    const grid = createMonthGrid({ initialDate: '2026-05-16' })
    grid.selectWeekOf('2026-05-20') // Wednesday
    expect(grid.rangeBounds()).toEqual({ lo: '2026-05-17', hi: '2026-05-23' })
    expect(grid.rangeDayCount()).toBe(7)
  })

  it('navigates months and returns to today', () => {
    const grid = createMonthGrid({ initialDate: '2026-05-16' })
    grid.nextMonth()
    expect(grid.monthLabel()).toBe('June 2026')
    grid.prevMonth()
    grid.prevMonth()
    expect(grid.monthLabel()).toBe('April 2026')
    grid.goToToday()
    expect(grid.monthLabel()).toBe('May 2026')
  })

  it('ignores right-click drags', () => {
    const grid = createMonthGrid({ initialDate: '2026-05-16' })
    grid.onCellMouseDown('2026-05-20', { button: 2, shiftKey: false } as MouseEvent)
    expect(grid.isDragging()).toBe(false)
    expect(grid.rangeStart()).toBe(grid.todayKey)
  })

  it('extends the range on shift-click', () => {
    const grid = createMonthGrid({ initialDate: '2026-05-16' })
    grid.selectDay('2026-05-18')
    grid.onCellMouseDown('2026-05-20', { button: 0, shiftKey: true } as MouseEvent)
    expect(grid.rangeBounds()).toEqual({ lo: '2026-05-18', hi: '2026-05-20' })
  })
})
