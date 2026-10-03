// Headless month-grid + drag/shift range-select primitives.
// Domain-agnostic: knows nothing about events — just dates, the 42-cell grid,
// and a normalized [start, end] range driven by mouse / shift-click.
// Angular port of nuxt-boilerplate's useMonthGrid (Vue refs → signals).
// Window mouseup listeners are NOT attached here (SSR-safe by construction) —
// pages wire `(window:mouseup)` / `(window:mouseleave)` to `endDrag()` via host bindings.
import { computed, signal, type Signal, type WritableSignal } from '@angular/core'

export type DateKey = string // YYYY-MM-DD

export interface UseMonthGridOptions {
  initialDate?: Date | DateKey
  weekStartsOn?: 0 | 1 // 0 = Sunday (default), 1 = Monday
}

export function isoDate(d: Date): DateKey {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function dateFromKey(k: DateKey): Date {
  return new Date(k + 'T00:00:00')
}

export function dayDiff(a: DateKey, b: DateKey): number {
  return Math.round((dateFromKey(b).getTime() - dateFromKey(a).getTime()) / 86400000)
}

export interface MonthGridDay {
  date: Date
  key: DateKey
  inMonth: boolean
}

export interface MonthGrid {
  today: Date
  todayKey: DateKey
  cursor: WritableSignal<Date>
  monthLabel: Signal<string>
  gridDays: Signal<MonthGridDay[]>
  weekdays: Signal<string[]>
  rangeAnchor: WritableSignal<DateKey>
  rangeStart: WritableSignal<DateKey>
  rangeEnd: WritableSignal<DateKey>
  rangeBounds: Signal<{ lo: DateKey, hi: DateKey }>
  rangeDayCount: Signal<number>
  isRange: Signal<boolean>
  isDragging: WritableSignal<boolean>
  inRange: (key: DateKey) => boolean
  prevMonth: () => void
  nextMonth: () => void
  goToToday: () => void
  selectDay: (key: DateKey) => void
  selectWeekOf: (key: DateKey) => void
  clearRange: () => void
  onCellMouseDown: (key: DateKey, ev: MouseEvent) => void
  onCellMouseEnter: (key: DateKey) => void
  endDrag: () => void
}

export function createMonthGrid(options: UseMonthGridOptions = {}): MonthGrid {
  const weekStartsOn = options.weekStartsOn ?? 0
  const init = options.initialDate
    ? (typeof options.initialDate === 'string' ? dateFromKey(options.initialDate) : options.initialDate)
    : new Date()

  // "today" is frozen to the moment the grid is created — predictable for tests / SSR.
  const today = new Date(init.getFullYear(), init.getMonth(), init.getDate())
  const todayKey = isoDate(today)

  const cursor = signal(new Date(init.getFullYear(), init.getMonth(), 1))

  // Range state
  const rangeAnchor = signal<DateKey>(todayKey) // mousedown / shift-click origin
  const rangeStart = signal<DateKey>(todayKey)
  const rangeEnd = signal<DateKey>(todayKey)
  const isDragging = signal(false)

  const monthLabel = computed(() =>
    cursor().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  )

  const gridDays = computed(() => {
    const cur = cursor()
    const first = new Date(cur.getFullYear(), cur.getMonth(), 1)
    const offset = (first.getDay() - weekStartsOn + 7) % 7
    const start = new Date(first)
    start.setDate(first.getDate() - offset)
    const days: MonthGridDay[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      days.push({
        date: d,
        key: isoDate(d),
        inMonth: d.getMonth() === cur.getMonth(),
      })
    }
    return days
  })

  // Weekday labels in display order
  const weekdays = computed(() => {
    const base = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return [...base.slice(weekStartsOn), ...base.slice(0, weekStartsOn)]
  })

  const rangeBounds = computed(() => {
    const a = rangeStart()
    const b = rangeEnd()
    return a <= b ? { lo: a, hi: b } : { lo: b, hi: a }
  })

  const rangeDayCount = computed(() => dayDiff(rangeBounds().lo, rangeBounds().hi) + 1)
  const isRange = computed(() => rangeBounds().lo !== rangeBounds().hi)

  function inRange(key: DateKey): boolean {
    const { lo, hi } = rangeBounds()
    return key >= lo && key <= hi
  }

  function prevMonth(): void {
    const cur = cursor()
    cursor.set(new Date(cur.getFullYear(), cur.getMonth() - 1, 1))
  }
  function nextMonth(): void {
    const cur = cursor()
    cursor.set(new Date(cur.getFullYear(), cur.getMonth() + 1, 1))
  }
  function goToToday(): void {
    cursor.set(new Date(today.getFullYear(), today.getMonth(), 1))
    rangeAnchor.set(todayKey)
    rangeStart.set(todayKey)
    rangeEnd.set(todayKey)
  }
  function selectDay(key: DateKey): void {
    rangeAnchor.set(key)
    rangeStart.set(key)
    rangeEnd.set(key)
  }
  function selectWeekOf(key: DateKey): void {
    const d = dateFromKey(key)
    const dow = (d.getDay() - weekStartsOn + 7) % 7
    const wkStart = new Date(d); wkStart.setDate(d.getDate() - dow)
    const wkEnd = new Date(wkStart); wkEnd.setDate(wkStart.getDate() + 6)
    rangeAnchor.set(isoDate(wkStart))
    rangeStart.set(isoDate(wkStart))
    rangeEnd.set(isoDate(wkEnd))
  }
  function clearRange(): void {
    rangeAnchor.set(todayKey)
    rangeStart.set(todayKey)
    rangeEnd.set(todayKey)
  }

  function onCellMouseDown(key: DateKey, ev: MouseEvent): void {
    if (ev.button !== 0) return // ignore right-click — context menus handle it
    if (ev.shiftKey) {
      rangeEnd.set(key)
      return
    }
    rangeAnchor.set(key)
    rangeStart.set(key)
    rangeEnd.set(key)
    isDragging.set(true)
  }
  function onCellMouseEnter(key: DateKey): void {
    if (!isDragging()) return
    rangeEnd.set(key)
    rangeStart.set(rangeAnchor())
  }
  function endDrag(): void {
    if (isDragging()) isDragging.set(false)
  }

  return {
    today,
    todayKey,
    cursor,
    monthLabel,
    gridDays,
    weekdays,
    rangeAnchor,
    rangeStart,
    rangeEnd,
    rangeBounds,
    rangeDayCount,
    isRange,
    isDragging,
    inRange,
    prevMonth,
    nextMonth,
    goToToday,
    selectDay,
    selectWeekOf,
    clearRange,
    onCellMouseDown,
    onCellMouseEnter,
    endDrag,
  }
}
