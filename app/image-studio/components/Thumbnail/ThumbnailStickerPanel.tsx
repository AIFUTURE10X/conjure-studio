"use client"

/**
 * ThumbnailStickerPanel
 *
 * The "Add sticker" entry in the Scene view: a dropdown with a searchable emoji
 * picker plus arrow/circle shapes. Click to add (it gets selected, swapping the
 * rail to the sticker editor); drag on the canvas to position.
 */

import { useMemo, useState } from 'react'
import { ChevronDown, Plus, Search } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useThumbnail } from './ThumbnailProvider'
import { STICKER_EMOJI_ITEMS, STICKER_SHAPES, createSticker } from './thumbnail-constants'

export function ThumbnailStickerPanel() {
  const { addSticker } = useThumbnail()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const emojis = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return STICKER_EMOJI_ITEMS
    return STICKER_EMOJI_ITEMS.filter((e) => e.keywords.includes(q) || e.char === q)
  }, [query])

  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Stickers</h4>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            aria-label="Add sticker"
            className="flex w-full items-center justify-between gap-2 rounded-md border border-zinc-700 bg-zinc-800/70 px-3 py-2 text-left text-sm text-zinc-200 transition-colors hover:bg-zinc-700"
          >
            <span className="flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add sticker
            </span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) min-w-64 space-y-2 border-zinc-700 bg-zinc-900 p-2"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search emoji (fire, money, win…)"
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 py-1.5 pl-7 pr-2 text-[11px] text-zinc-100 placeholder:text-zinc-600 focus:border-[#c99850]/60 focus:outline-none"
            />
          </div>

          {emojis.length > 0 ? (
            <div className="grid max-h-40 grid-cols-8 gap-1 overflow-y-auto">
              {emojis.map((emoji) => (
                <button
                  key={emoji.char}
                  onClick={() => {
                    addSticker(createSticker('emoji', emoji.char))
                    setOpen(false)
                  }}
                  title={emoji.keywords}
                  className="flex h-7 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800/70 text-base transition-colors hover:bg-zinc-700"
                >
                  {emoji.char}
                </button>
              ))}
            </div>
          ) : (
            <p className="py-2 text-center text-[10px] text-zinc-600">No emoji matches “{query}”.</p>
          )}

          <div className="grid grid-cols-2 gap-1.5">
            {STICKER_SHAPES.map((shape) => (
              <button
                key={shape.type}
                onClick={() => {
                  addSticker(createSticker(shape.type))
                  setOpen(false)
                }}
                className="rounded-md border border-zinc-700 bg-zinc-800/70 px-2 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
              >
                {shape.label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <p className="text-[10px] leading-snug text-zinc-500">Click to add · drag on the canvas to position.</p>
    </div>
  )
}
