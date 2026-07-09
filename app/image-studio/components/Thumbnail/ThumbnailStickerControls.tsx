"use client"

/**
 * ThumbnailStickerControls
 *
 * The contextual editor for the selected sticker: size / rotate / layer order /
 * blend / color / delete, plus alignment. Shown when a sticker is selected.
 */

import { Trash2 } from 'lucide-react'
import { useThumbnail } from './ThumbnailProvider'
import { BackHeader, SelectRow } from './ThumbnailControls'
import { ThumbnailArrangePanel } from './ThumbnailArrangePanel'
import { BLEND_MODES } from './thumbnail-constants'

export function ThumbnailStickerControls() {
  const { config, selectedStickerId, setSelectedStickerId, patchSticker, removeSticker, reorderSticker } = useThumbnail()
  const selected = config.stickers.find((s) => s.id === selectedStickerId)
  if (!selected) return null

  return (
    <div className="space-y-3">
      <BackHeader title="Sticker" onBack={() => setSelectedStickerId(null)} />

      <div className="space-y-2 rounded-md border border-[#c99850]/30 bg-zinc-900 p-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] capitalize text-zinc-400">{selected.type}</span>
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
        <SelectRow
          label="Blend"
          value={selected.blend ?? 'normal'}
          options={BLEND_MODES}
          onChange={(v) => patchSticker(selected.id, { blend: v })}
        />
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

      <ThumbnailArrangePanel />
    </div>
  )
}
