"use client"

/**
 * ThumbnailTemplatePicker
 *
 * Layout-template selector as a compact dropdown (replaces the always-open
 * button grid). Applies a template's position / preset / background via the
 * provider; `config.templateId` marks the active row.
 */

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useThumbnail } from './ThumbnailProvider'
import { THUMBNAIL_TEMPLATES } from './thumbnail-constants'
import { railLabel } from './thumbnail-ui'

export function ThumbnailTemplatePicker() {
  const { config, applyTemplate } = useThumbnail()
  const [open, setOpen] = useState(false)
  const current = THUMBNAIL_TEMPLATES.find((t) => t.id === config.templateId)

  return (
    <div className="space-y-2">
      <h4 className={railLabel}>Template</h4>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            aria-label="Template"
            className="flex w-full items-center justify-between gap-2 rounded-md border border-zinc-700 bg-zinc-800/70 px-3 py-2 text-left text-sm text-zinc-200 transition-colors hover:bg-zinc-700"
          >
            <span className="truncate">{current?.label ?? 'Choose template'}</span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="max-h-72 w-(--radix-popover-trigger-width) min-w-56 space-y-1 overflow-y-auto border-zinc-700 bg-zinc-900 p-1.5"
        >
          {THUMBNAIL_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                applyTemplate(t.id)
                setOpen(false)
              }}
              className={`block w-full truncate rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                config.templateId === t.id ? 'bg-[#c99850]/15 text-[#dbb56e]' : 'text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  )
}
