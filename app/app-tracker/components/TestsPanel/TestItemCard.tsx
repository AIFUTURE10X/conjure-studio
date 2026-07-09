'use client'

import { Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TestItem, TestStatus } from '../../constants/types'
import { StatusBadge, PriorityBadge, PlatformTags } from '../shared'
import { TEST_STATUS_OPTIONS } from '../../constants/status-options'

interface TestItemCardProps {
  testItem: TestItem
  onStatusChange: (status: TestStatus) => void
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

export function TestItemCard({
  testItem,
  onStatusChange,
  onView,
  onEdit,
  onDelete,
}: TestItemCardProps) {
  // Card border color based on status
  const borderClass = testItem.status === 'not_tested'
    ? 'border-l-orange-500 border-l-4 border-zinc-700'
    : testItem.status === 'failed'
    ? 'border-l-red-500 border-l-4 border-zinc-700'
    : 'border-zinc-700'

  return (
    <div className={`group bg-zinc-800/50 border rounded-lg p-4 hover:border-zinc-600 transition-colors ${borderClass}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h4 className="font-medium text-white flex-1">{testItem.title}</h4>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={onView}
            className="h-7 w-7 text-zinc-400 hover:text-white"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-7 w-7 text-zinc-400 hover:text-white"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-7 w-7 text-zinc-400 hover:text-red-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Status buttons row */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {TEST_STATUS_OPTIONS.map(option => (
          <button
            key={option.value}
            onClick={() => onStatusChange(option.value)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              testItem.status === option.value
                ? `${option.bg} ${option.color} ring-1 ring-current`
                : 'bg-zinc-700/50 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>{option.icon}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between gap-2">
        <PlatformTags platforms={testItem.platforms} size="sm" />
        <PriorityBadge priority={testItem.priority} size="sm" />
      </div>
    </div>
  )
}
