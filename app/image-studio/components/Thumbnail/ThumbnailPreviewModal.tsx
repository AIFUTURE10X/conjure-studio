"use client"

/**
 * ThumbnailPreviewModal
 *
 * Shows the captured composite at the small sizes YouTube actually renders, so
 * creators can confirm the headline still reads. Something Canva doesn't offer.
 */

import { X } from 'lucide-react'

const SIZES = [
  { label: 'Search · 360 px', w: 360 },
  { label: 'Mobile · 320 px', w: 320 },
  { label: 'Sidebar · 168 px', w: 168 },
]

export function ThumbnailPreviewModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">How it reads at YouTube sizes</h3>
          <button onClick={onClose} title="Close" className="text-zinc-400 transition-colors hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-end justify-center gap-4">
          {SIZES.map((s) => (
            <div key={s.label} className="space-y-1 text-center">
              <div className="overflow-hidden rounded border border-zinc-800" style={{ width: s.w, aspectRatio: '16 / 9' }}>
                <img src={src} alt={s.label} className="h-full w-full object-cover" />
              </div>
              <p className="text-[10px] text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>

        <p className="mt-3 text-center text-[11px] text-zinc-500">
          If the headline isn’t instantly readable at the smallest size, make it bigger, bolder, or higher-contrast.
        </p>
      </div>
    </div>
  )
}
