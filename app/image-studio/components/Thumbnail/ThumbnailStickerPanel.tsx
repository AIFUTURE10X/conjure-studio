"use client"

/**
 * ThumbnailStickerPanel
 *
 * Emoji + arrow/circle stickers for the thumbnail. Click to add, drag on the
 * canvas to position; the selected sticker exposes size / rotate / color /
 * delete controls.
 */

import { Trash2 } from 'lucide-react'
import { useThumbnail } from './ThumbnailProvider'
import { STICKER_EMOJIS, STICKER_SHAPES, createSticker } from './thumbnail-constants'

export function ThumbnailStickerPanel() {
  const { config, selectedStickerId, addSticker, patchSticker, removeSticker } = useThumbnail()
  const selected = config.stickers.find((s) => s.id === selectedStickerId) ?? null

  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Stickers</h4>

      <div className="grid grid-cols-8 gap-1">
        {STICKER_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => addSticker(createSticker('emoji', emoji))}
            className="flex h-7 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800/70 text-base transition-colors hover:bg-zinc-700"
          >
            {emoji}
          </button>
        ))}
      </div>

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
          {selected.type !== 'emoji' && (
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
