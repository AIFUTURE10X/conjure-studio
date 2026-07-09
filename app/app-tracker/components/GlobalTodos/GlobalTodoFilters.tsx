'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { GlobalTodoFilters as FilterType, GlobalTodoCategory, Priority, TaskStatus } from '../../constants/types'
import { GLOBAL_TODO_CATEGORIES } from '../../constants/global-todo-defaults'
import { PRIORITY_OPTIONS } from '../../constants/status-options'

interface GlobalTodoFiltersProps {
  filters: FilterType
  onFiltersChange: (filters: FilterType) => void
  onReset: () => void
}

const STATUS_OPTIONS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

export function GlobalTodoFilters({
  filters,
  onFiltersChange,
  onReset,
}: GlobalTodoFiltersProps) {
  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.category !== 'all' ||
    filters.search !== ''

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          value={filters.search}
          onChange={e => onFiltersChange({ ...filters, search: e.target.value })}
          placeholder="Search todos..."
          className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
        />
      </div>

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={e => onFiltersChange({ ...filters, status: e.target.value as TaskStatus | 'all' })}
        className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-white focus:outline-none focus:border-[#c99850]"
      >
        {STATUS_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Priority filter */}
      <select
        value={filters.priority}
        onChange={e => onFiltersChange({ ...filters, priority: e.target.value as Priority | 'all' })}
        className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-white focus:outline-none focus:border-[#c99850]"
      >
        <option value="all">All Priority</option>
        {PRIORITY_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Category filter */}
      <select
        value={filters.category}
        onChange={e => onFiltersChange({ ...filters, category: e.target.value as GlobalTodoCategory | 'all' })}
        className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-white focus:outline-none focus:border-[#c99850]"
      >
        <option value="all">All Categories</option>
        {GLOBAL_TODO_CATEGORIES.map(cat => (
          <option key={cat.key} value={cat.key}>
            {cat.icon} {cat.label}
          </option>
        ))}
      </select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="flex items-center gap-1 px-2 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
          Clear
        </button>
      )}
    </div>
  )
}
