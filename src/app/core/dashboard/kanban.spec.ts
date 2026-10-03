import { describe, expect, it } from 'vitest'
import {
  findTaskById,
  formatDueDate,
  getAssigneeKey,
  getDueStatus,
  getInitials,
  getTaskColumn,
} from './kanban'
import { createInitialColumns } from './kanban-data'

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
  it('seeds five columns with parent/child links intact', () => {
    const columns = createInitialColumns()
    expect(columns.map((c) => c.id)).toEqual(['backlog', 'todo', 'in-progress', 'in-review', 'done'])
    const task = findTaskById(columns, 'HR-101')
    expect(task?.subtaskIds).toEqual(['HR-115', 'HR-116', 'HR-117'])
    expect(getTaskColumn(columns, 'HR-101')?.id).toBe('backlog')
    expect(findTaskById(columns, 'HR-115')?.parentId).toBe('HR-101')
    expect(findTaskById(columns, 'nope')).toBeUndefined()
  })
})
