'use client'

import { Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TestItem, TestStatus } from '../../constants/types'
import { TEST_STATUS_OPTIONS } from '../../constants/status-options'

interface TestItemRowProps {
  testItem: TestItem
  onStatusChange: (status: TestStatus) => void
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

const PRIORITY_COLORS = {
  low: 'text-zinc-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
}

const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Med',
  high: 'High',
}

export function TestItemRow({
  testItem,
  onStatusChange,
  onView,
  onEdit,
  onDelete,
}: TestItemRowProps) {
  // Row left border color based on status
  const borderClass = testItem.status === 'not_tested'
    ? 'border-l-orange-500'
    : testItem.status === 'failed'
    ? 'border-l-red-500'
    : testItem.status === 'passed'
    ? 'border-l-green-500'
    : 'border-l-blue-500'

  return (
    <div
      className={`group relative flex items-center px-2 py-1 border-l-2 ${borderClass} bg-zinc-800/30 hover:bg-zinc-800/60 transition-colors`}
    >
      {/* Title - expands to fill space */}
      <div className="flex-1 min-w-0 mr-1">
        <span className="text-sm text-zinc-200 truncate block">{testItem.title}</span>
      </div>

      {/* Status buttons + Priority - grouped together tightly */}
      <div className="flex items-center shrink-0">
        {TEST_STATUS_OPTIONS.map(option => (
          <button
            key={option.value}
            onClick={() => onStatusChange(option.value)}
            title={option.label}
            className={`px-1 py-0.5 rounded text-[10px] font-medium transition-colors ${
              testItem.status === option.value
                ? `${option.bg} ${option.color} ring-1 ring-current`
                : 'bg-zinc-700/50 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {option.icon}
          </button>
        ))}
        <span className={`text-[10px] font-medium w-7 text-right ml-0.5 ${PRIORITY_COLORS[testItem.priority]}`}>
          {PRIORITY_LABELS[testItem.priority]}
        </span>
      </div>

      {/* Actions - absolute positioned overlay on hover */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800/90 rounded px-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onView}
          className="h-6 w-6 text-zinc-500 hover:text-white"
          title="View"
        >
          <Eye className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="h-6 w-6 text-zinc-500 hover:text-white"
          title="Edit"
        >
          <Pencil className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-6 w-6 text-zinc-500 hover:text-red-400"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}
