"use client"

/**
 * ThumbnailStickerPanel
 *
 * Searchable emoji picker + arrow/circle stickers for the thumbnail. Click to
 * add, drag on the canvas to position; the selected sticker exposes size /
 * rotate / color / delete controls.
 */

import { useMemo, useState } from 'react'
import { Search, Trash2 } from 'lucide-react'
import { useThumbnail } from './ThumbnailProvider'
import { STICKER_EMOJI_ITEMS, STICKER_SHAPES, createSticker } from './thumbnail-constants'

export function ThumbnailStickerPanel() {
  const { config, selectedStickerId, addSticker, patchSticker, removeSticker, reorderSticker } = useThumbnail()
  const selected = config.stickers.find((s) => s.id === selectedStickerId) ?? null
  const [query, setQuery] = useState('')

  const emojis = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return STICKER_EMOJI_ITEMS
    return STICKER_EMOJI_ITEMS.filter((e) => e.keywords.includes(q) || e.char === q)
  }, [query])

  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Stickers</h4>

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
        <div className="grid max-h-28 grid-cols-8 gap-1 overflow-y-auto">
          {emojis.map((emoji) => (
            <button
              key={emoji.char}
              onClick={() => addSticker(createSticker('emoji', emoji.char))}
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
            onClick={() => addSticker(createSticker(shape.type))}
            className="rounded-md border border-zinc-700 bg-zinc-800/70 px-2 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            {shape.label}
          </button>
        ))}
      </div>

      {selected && (
        <div className="space-y-2 rounded-md border border-[#c99850]/30 bg-zinc-900 p-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] capitalize text-zinc-400">Selected {selected.type}</span>
            <button
              onClick={() => removeSticker(selected.id)}
              className="flex items-center gap-1 text-[11px] text-red-300 transition-colors hover:text-red-200"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
          <label className="block text-[11px] text-zinc-500">
            Size
            <input
              type="range"
              min={5}
              max={60}
              value={selected.size}
              onChange={(e) => patchSticker(selected.id, { size: Number(e.target.value) })}
              className="w-full accent-[#c99850]"
            />
          </label>
          <label className="block text-[11px] text-zinc-500">
            Rotate
            <input
              type="range"
              min={-180}
              max={180}
              value={selected.rotation}
              onChange={(e) => patchSticker(selected.id, { rotation: Number(e.target.value) })}
              className="w-full accent-[#c99850]"
            />
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => reorderSticker(selected.id, 'back')}
              className="rounded-md border border-zinc-700 bg-zinc-800/70 px-2 py-1 text-[11px] text-zinc-300 transition-colors hover:bg-zinc-700"
            >
              Send back
            </button>
            <button
              onClick={() => reorderSticker(selected.id, 'forward')}
              className="rounded-md border border-zinc-700 bg-zinc-800/70 px-2 py-1 text-[11px] text-zinc-300 transition-colors hover:bg-zinc-700"
            >
              Bring forward
            </button>
          </div>
          {selected.type !== 'emoji' && selected.type !== 'image' && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500">Color</span>
              <input
                type="color"
                value={selected.color}
                onChange={(e) => patchSticker(selected.id, { color: e.target.value })}
                className="h-7 w-full cursor-pointer rounded-md border border-zinc-700 bg-zinc-900"
                aria-label="Sticker color"
              />
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] leading-snug text-zinc-500">
        Click to add · drag on the canvas · click a sticker to select.
      </p>
    </div>
  )
}
