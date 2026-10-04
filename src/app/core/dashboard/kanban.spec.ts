import { describe, expect, it } from 'vitest'
import {
  findTaskById,
  formatDueDate,
  getAssigneeKey,
  getDueStatus,
  getInitials,
  getTaskColumn,
} from './kanban'
import { createInitialColumns, daysFromToday } from './kanban-data'
import { buildNewTasks, filterColumns, moveTaskTo } from '@/app/components/blocks/kanban-task-board'

describe('kanban helpers', () => {
  it('derives initials', () => {
    expect(getInitials('Alice Chen')).toBe('AC')
    expect(getInitials('Bob')).toBe('B')
  })

  it('classifies due status', () => {
    expect(getDueStatus(undefined)).toBeNull()
    expect(getDueStatus('2000-01-01')).toBe('overdue')
    expect(getDueStatus('2999-01-01')).toBe('normal')
  })

  it('formats due dates', () => {
    expect(formatDueDate('2026-03-15')).toBe('Mar 15')
  })

  it('resolves assignee keys with fallback', () => {
    expect(getAssigneeKey('Alice Chen')).toBe('alice')
    expect(getAssigneeKey('Nobody Here')).toBe('alice')
  })
})

describe('kanban-data', () => {
  it('seeds five columns with parent/child links intact (Nuxt APP-1xx board)', () => {
    const columns = createInitialColumns()
    expect(columns.map((c) => c.id)).toEqual(['backlog', 'todo', 'in-progress', 'in-review', 'done'])
    const task = findTaskById(columns, 'APP-101')
    expect(task?.subtaskIds).toEqual(['APP-115', 'APP-116', 'APP-117'])
    expect(getTaskColumn(columns, 'APP-101')?.id).toBe('backlog')
    expect(findTaskById(columns, 'APP-115')?.parentId).toBe('APP-101')
    expect(findTaskById(columns, 'nope')).toBeUndefined()
  })

  it('anchors due dates to today so overdue / due-soon states never go stale', () => {
    const columns = createInitialColumns()
    expect(findTaskById(columns, 'APP-105')?.dueDate).toBe(daysFromToday(-9))
    expect(getDueStatus(findTaskById(columns, 'APP-105')?.dueDate)).toBe('overdue')
    expect(getDueStatus(findTaskById(columns, 'APP-109')?.dueDate)).toBe('soon')
    expect(getDueStatus(findTaskById(columns, 'APP-101')?.dueDate)).toBe('normal')
  })
})

describe('kanban board logic', () => {
  it('filters by search (title or id), priority and assignee', () => {
    const columns = createInitialColumns()
    const count = (cols: ReturnType<typeof createInitialColumns>) => cols.reduce((n, c) => n + c.tasks.length, 0)
    expect(count(filterColumns(columns, { search: 'app-105', priority: null, assignee: null }))).toBe(1)
    expect(count(filterColumns(columns, { search: '', priority: 'urgent', assignee: null }))).toBe(2)
    const eva = filterColumns(columns, { search: '', priority: null, assignee: 'Eva Johnson' })
    expect(eva.flatMap(c => c.tasks).every(t => t.assignee.name === 'Eva Johnson')).toBe(true)
  })

  it('moves a task between columns and within a column without losing it', () => {
    const columns = createInitialColumns()
    const moved = moveTaskTo(columns, 'APP-102', 'done')
    expect(getTaskColumn(moved, 'APP-102')?.id).toBe('done')
    expect(moved.at(-1)?.tasks.at(-1)?.id).toBe('APP-102')
    // Reorder: drop APP-103 before APP-101 (index 0) in its own column.
    const reordered = moveTaskTo(columns, 'APP-103', 'backlog', 0)
    expect(reordered[0]?.tasks[0]?.id).toBe('APP-103')
    expect(reordered[0]?.tasks.length).toBe(columns[0]?.tasks.length)
    // Unknown task: no-op.
    expect(moveTaskTo(columns, 'nope', 'done')).toBe(columns)
  })

  it('creates a task with the next free id and links its subtasks', () => {
    const tasks = buildNewTasks(createInitialColumns(), {
      title: ' New thing ', description: '', priority: 'high', assigneeKey: 'bob', tagKeys: ['bug'], subtasks: ['a', 'b'],
    })
    expect(tasks.map(t => t.id)).toEqual(['APP-127', 'APP-128', 'APP-129'])
    expect(tasks[0]?.title).toBe('New thing')
    expect(tasks[0]?.subtaskIds).toEqual(['APP-128', 'APP-129'])
    expect(tasks[1]?.parentId).toBe('APP-127')
  })
})
