"use client"

/**
 * ChipSelect
 *
 * A dropdown whose options open as a grid of chips (3 per row by default)
 * instead of a vertical list — compact trigger in the rail, fast grid
 * picker on open. Long labels wrap rather than truncate.
 *
 * Options with a `thumbnail` (e.g. art-style examples) show a square preview
 * card pinned to the left edge of the dropdown box on hover.
 */

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface ChipOption {
  value: string
  label: string
  /** Optional square preview shown on hover (e.g. art-style examples). */
  thumbnail?: string
  /** Optional one-line description shown under the preview. */
  description?: string
}

interface ChipSelectProps {
  options: readonly ChipOption[]
  value: string
  onChange: (value: string) => void
  columns?: 2 | 3
  placeholder?: string
}

const COLS_CLASS = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
} as const

export function ChipSelect({ options, value, onChange, columns = 3, placeholder = 'Select' }: ChipSelectProps) {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<ChipOption | null>(null)
  const current = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) setPreview(null) }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-8 w-full items-center justify-between gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 text-xs text-zinc-200 transition-colors hover:border-zinc-600"
        >
          <span className="truncate">{current?.label ?? placeholder}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="relative w-[var(--radix-popover-trigger-width)] min-w-56 border-zinc-700 bg-zinc-900 p-2"
      >
        {/* Hover preview, pinned just left of the dropdown box */}
        {preview?.thumbnail && (
          <div className="absolute right-full top-1/2 z-50 mr-3 w-44 -translate-y-1/2 rounded-lg border border-[#c99850]/40 bg-zinc-900 p-2 shadow-xl">
            <img
              src={preview.thumbnail}
              alt={`${preview.label} style example`}
              className="aspect-square w-full rounded-md border border-[#c99850]/30 object-cover"
            />
            <div className="mt-1.5 text-xs font-semibold text-[#c99850]">{preview.label}</div>
            {preview.description && (
              <div className="text-[11px] leading-snug text-zinc-400">{preview.description}</div>
            )}
          </div>
        )}

        <div className="max-h-[300px] overflow-y-auto" onMouseLeave={() => setPreview(null)}>
          <div className={`grid gap-1.5 ${COLS_CLASS[columns]}`}>
            {options.map((option) => {
              const active = option.value === value
              return (
                <button
                  key={option.value || '__none__'}
                  type="button"
                  onMouseEnter={() => setPreview(option.thumbnail ? option : null)}
                  onClick={() => { onChange(option.value); setOpen(false); setPreview(null) }}
                  className={`flex min-h-[2.25rem] items-center justify-center rounded-md border px-2 py-1.5 text-center text-[11px] font-medium leading-tight break-words transition-colors ${
                    active
                      ? 'border-[#c99850]/60 bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                      : 'border-zinc-700 bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
