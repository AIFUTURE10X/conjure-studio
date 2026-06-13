"use client"

/**
 * ThumbnailFontPicker
 *
 * Headline font selector rendered as a dropdown that opens a grid of font
 * options, each previewed in its own typeface. Replaces the always-open button
 * grid so the (growing) font list stays compact in the rail. Selection lives in
 * the shared headline config via the provider.
 */

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useThumbnail } from './ThumbnailProvider'
import { THUMBNAIL_FONTS } from './thumbnail-fonts'
import { railLabel } from './thumbnail-ui'

export function ThumbnailFontPicker() {
  const { config, setHeadline } = useThumbnail()
  const [open, setOpen] = useState(false)
  const fontId = config.headline.font ?? 'geist'
  const current = THUMBNAIL_FONTS.find((f) => f.id === fontId) ?? THUMBNAIL_FONTS[0]

  return (
    <div className="space-y-1.5">
      <span className={railLabel}>Font</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            aria-label="Font"
            className="flex w-full items-center justify-between gap-2 rounded-md border border-zinc-700 bg-zinc-800/70 px-3 py-2 text-left transition-colors hover:bg-zinc-700"
          >
            <span className="truncate text-sm text-zinc-100" style={{ fontFamily: current.family }}>
              {current.label}
            </span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="max-h-72 w-(--radix-popover-trigger-width) min-w-56 overflow-y-auto border-zinc-700 bg-zinc-900 p-2"
        >
          <div className="grid grid-cols-2 gap-1.5">
            {THUMBNAIL_FONTS.map((f) => {
              const active = f.id === fontId
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    setHeadline({ font: f.id })
                    setOpen(false)
                  }}
                  title={f.label}
                  style={{ fontFamily: f.family }}
                  className={`truncate rounded-md border px-2 py-2 text-sm transition-colors ${
                    active
                      ? 'border-[#c99850] bg-[#c99850]/10 text-[#dbb56e]'
                      : 'border-zinc-700 bg-zinc-800/70 text-zinc-200 hover:bg-zinc-700'
                  }`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
