"use client"

/**
 * SettingField
 *
 * Labeled field wrapper for the settings rail. When the pending AI
 * suggestion touches this field, it shows an amber highlight ring and a
 * "current → suggested" diff chip.
 */

import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'

interface SettingFieldProps {
  label: string
  /** Present when the pending suggestion proposes a new value for this field. */
  suggestion?: { current: string; suggested: string } | null
  children: ReactNode
}

export function SettingField({ label, suggestion, children }: SettingFieldProps) {
  return (
    <div
      className={`rounded-lg p-2 -m-2 transition-colors ${
        suggestion ? 'ring-1 ring-amber-500/60 bg-amber-500/5' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label className="text-xs font-medium text-zinc-400">{label}</label>
        {suggestion && (
          <Badge
            variant="outline"
            className="border-amber-500/50 bg-amber-500/10 text-amber-300 text-[10px] gap-1 px-1.5 py-0 font-normal"
          >
            <span className="line-through opacity-60">{suggestion.current || 'none'}</span>
            <ArrowRight className="w-2.5 h-2.5" />
            <span>{suggestion.suggested}</span>
          </Badge>
        )}
      </div>
      {children}
    </div>
  )
}
