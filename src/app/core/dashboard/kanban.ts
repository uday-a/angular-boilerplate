// Kanban types + helpers. Port of nuxt-boilerplate's useKanban (icons mapped
// to lucide-angular; old names kept where the alias still exists).
import {
  ArrowDown,
  ArrowUp,
  CircleAlert,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Minus,
  type LucideIconData,
} from 'lucide-angular'

export interface CommentItem {
  id: string
  author: string
  authorColor: string
  text: string
  time: string
}

export interface FileItem {
  id: string
  name: string
  size: string
  type: 'pdf' | 'spreadsheet' | 'image' | 'other'
}

export interface KanbanTask {
  id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee: { name: string, color: string }
  tags: { label: string, color: string }[]
  dueDate?: string
  parentId?: string
  subtaskIds: string[]
  commentItems: CommentItem[]
  fileItems: FileItem[]
}

export interface KanbanColumn {
  id: string
  title: string
  color: string
  dotColor: string
  tasks: KanbanTask[]
}

export const priorityConfig: Record<KanbanTask['priority'], { icon: LucideIconData, class: string, label: string, bg: string }> = {
  urgent: { icon: CircleAlert, class: 'text-destructive', label: 'Urgent', bg: 'bg-destructive' },
  high: { icon: ArrowUp, class: 'text-warning', label: 'High', bg: 'bg-warning' },
  medium: { icon: Minus, class: 'text-info', label: 'Medium', bg: 'bg-info' },
  low: { icon: ArrowDown, class: 'text-muted-foreground', label: 'Low', bg: 'bg-muted-foreground' },
}

export const assignees = {
  alice: { name: 'Alice Chen', color: 'bg-muted text-muted-foreground' },
  bob: { name: 'Bob Martinez', color: 'bg-muted text-muted-foreground' },
  carol: { name: 'Carol White', color: 'bg-muted text-muted-foreground' },
  david: { name: 'David Kim', color: 'bg-muted text-muted-foreground' },
  eva: { name: 'Eva Johnson', color: 'bg-muted text-muted-foreground' },
  frank: { name: 'Frank Lee', color: 'bg-muted text-muted-foreground' },
}

export const tagPresets = {
  onboarding: { label: 'Onboarding', color: 'bg-chart-1/15 text-foreground ring-chart-1/30' },
  compliance: { label: 'Compliance', color: 'bg-chart-3/15 text-foreground ring-chart-3/30' },
  recruitment: {
    label: 'Recruitment',
    color: 'bg-chart-4/15 text-foreground ring-chart-4/30',
  },
  payroll: { label: 'Payroll', color: 'bg-chart-2/15 text-foreground ring-chart-2/30' },
  training: { label: 'Training', color: 'bg-chart-5/15 text-foreground ring-chart-5/30' },
  benefits: { label: 'Benefits', color: 'bg-muted text-muted-foreground ring-border' },
  policy: { label: 'Policy', color: 'bg-muted text-muted-foreground ring-border' },
}

export const fileIconMap: Record<string, LucideIconData> = {
  pdf: FileText,
  spreadsheet: FileSpreadsheet,
  image: FileImage,
  other: File,
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

export function getDueStatus(dueDate?: string): 'overdue' | 'soon' | 'normal' | null {
  if (!dueDate) return null
  const now = new Date()
  const due = new Date(dueDate + 'T00:00:00')
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 3) return 'soon'
  return 'normal'
}

export function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function getAssigneeKey(name: string): keyof typeof assignees {
  for (const [key, val] of Object.entries(assignees)) {
    if (val.name === name) return key as keyof typeof assignees
  }
  return 'alice'
}

export function findTaskById(columns: KanbanColumn[], taskId: string): KanbanTask | undefined {
  for (const col of columns) {
    const task = col.tasks.find(t => t.id === taskId)
    if (task) return task
  }
  return undefined
}

export function getTaskColumn(columns: KanbanColumn[], taskId: string): KanbanColumn | undefined {
  return columns.find(col => col.tasks.some(t => t.id === taskId))
}
