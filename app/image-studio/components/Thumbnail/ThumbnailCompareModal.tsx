"use client"

/**
 * ThumbnailCompareModal
 *
 * A/B side-by-side preview of two saved thumbnails, to judge which reads
 * bolder at a glance before publishing.
 */

import { X } from 'lucide-react'
import { type ThumbnailHistoryItem } from './thumbnail-constants'

export function ThumbnailCompareModal({
  a,
  b,
  onClose,
}: {
  a: ThumbnailHistoryItem
  b: ThumbnailHistoryItem
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="w-full max-w-5xl rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">A/B compare</h3>
          <button onClick={onClose} title="Close" className="text-zinc-400 transition-colors hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { label: 'A', item: a },
            { label: 'B', item: b },
          ].map(({ label, item }) => (
            <div key={label} className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="rounded bg-[#c99850] px-1.5 font-bold text-black">{label}</span>
                <span className="truncate">{item.prompt}</span>
              </div>
              <div className="overflow-hidden rounded-lg border border-zinc-800" style={{ aspectRatio: '16 / 9' }}>
                <img src={item.imageUrl} alt={item.prompt} className="h-full w-full object-cover" />
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 text-center text-[11px] text-zinc-500">
          Which would you click? Favor the bolder, higher-contrast option with a clear focal point.
        </p>
      </div>
    </div>
  )
}
