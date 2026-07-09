'use client'

import { getPriorityOption } from '../../constants/status-options'
import type { Priority } from '../../constants/types'

interface PriorityBadgeProps {
  priority: Priority
  size?: 'sm' | 'md'
}

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const option = getPriorityOption(priority)

  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1'

  return (
    <span className={`inline-flex items-center rounded-md font-medium ${option.bg} ${option.color} ${sizeClasses}`}>
      {option.label}
    </span>
  )
}
