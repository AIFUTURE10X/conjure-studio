'use client'

import { getPlatformOption } from '../../constants/status-options'
import type { Platform } from '../../constants/types'

interface PlatformTagsProps {
  platforms: Platform[]
  size?: 'sm' | 'md'
}

export function PlatformTags({ platforms, size = 'md' }: PlatformTagsProps) {
  if (platforms.length === 0) return null

  const sizeClasses = size === 'sm' ? 'text-xs px-1 py-0.5' : 'text-sm px-1.5 py-0.5'

  return (
    <div className="flex gap-1 flex-wrap">
      {platforms.map(platform => {
        const option = getPlatformOption(platform)
        if (!option) return null
        return (
          <span
            key={platform}
            className={`inline-flex items-center gap-0.5 rounded bg-zinc-700 text-zinc-300 ${sizeClasses}`}
          >
            <span>{option.icon}</span>
            <span>{option.label}</span>
          </span>
        )
      })}
    </div>
  )
}
