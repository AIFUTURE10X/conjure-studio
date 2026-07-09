"use client"

/**
 * RailSection
 *
 * Titled group wrapper for the settings rails. Renders a small section header
 * with an optional "Reset" button that restores just that section's fields to
 * their defaults, keeping the rest of the user's settings untouched.
 */

import type { ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'

interface RailSectionProps {
  title: string
  /** When provided, renders a reset-to-defaults button in the section header. */
  onReset?: () => void
  resetTitle?: string
  children: ReactNode
}

export function RailSection({
  title,
  onReset,
  resetTitle = 'Reset this section to defaults',
  children,
}: RailSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          {title}
        </span>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            title={resetTitle}
            className="flex h-6 items-center gap-1 rounded-md px-1.5 text-[10px] font-medium text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-[#dbb56e]"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>
      {children}
    </div>
  )
}
