"use client"

/**
 * ChipSelect
 *
 * A dropdown whose options open as a grid of chips (3 per row by default)
 * instead of a vertical list — compact trigger in the rail, fast grid
 * picker on open. Long labels wrap rather than truncate.
 */

import { Fragment, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

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
  const current = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
        className="max-h-[320px] w-[var(--radix-popover-trigger-width)] min-w-56 overflow-y-auto border-zinc-700 bg-zinc-900 p-2"
      >
        <div className={`grid gap-1.5 ${COLS_CLASS[columns]}`}>
          {options.map((option) => {
            const active = option.value === value
            const chip = (
              <button
                type="button"
                onClick={() => { onChange(option.value); setOpen(false) }}
                className={`flex min-h-[2.25rem] w-full items-center justify-center rounded-md border px-2 py-1.5 text-center text-[11px] font-medium leading-tight break-words transition-colors ${
                  active
                    ? 'border-[#c99850]/60 bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                    : 'border-zinc-700 bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            )

            if (!option.thumbnail) {
              return <Fragment key={option.value || '__none__'}>{chip}</Fragment>
            }

            return (
              <Tooltip key={option.value} delayDuration={150}>
                <TooltipTrigger asChild>{chip}</TooltipTrigger>
                <TooltipContent side="left" sideOffset={10} className="border-[#c99850]/40 bg-zinc-900 p-2">
                  <div className="w-40">
                    <img
                      src={option.thumbnail}
                      alt={`${option.label} style example`}
                      className="h-40 w-40 rounded-md border border-[#c99850]/30 object-cover"
                    />
                    <div className="mt-1.5 text-xs font-semibold text-[#c99850]">{option.label}</div>
                    {option.description && (
                      <div className="text-[11px] leading-snug text-zinc-400">{option.description}</div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
