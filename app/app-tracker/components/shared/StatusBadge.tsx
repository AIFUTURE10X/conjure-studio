'use client'

import { getTestStatusOption } from '../../constants/status-options'
import type { TestStatus } from '../../constants/types'

interface StatusBadgeProps {
  status: TestStatus
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const option = getTestStatusOption(status)

  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1'

  return (
    <span className={`inline-flex items-center gap-1 rounded-md font-medium ${option.bg} ${option.color} ${sizeClasses}`}>
      <span>{option.icon}</span>
      <span>{option.label}</span>
    </span>
  )
}
