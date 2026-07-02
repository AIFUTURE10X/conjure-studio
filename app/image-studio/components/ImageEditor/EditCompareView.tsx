"use client"

/**
 * EditCompareView
 *
 * Before/After review shown after a successful AI edit call. Keep commits
 * the result and starts a fresh mask on the new image; Discard throws the
 * result away and returns to painting with the mask still intact.
 */

import { Check, X } from 'lucide-react'

interface EditCompareViewProps {
  beforeUrl: string
  afterUrl: string
  onKeep: () => void
  onDiscard: () => void
}

export function EditCompareView({ beforeUrl, afterUrl, onKeep, onDiscard }: EditCompareViewProps) {
  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4">
      <div className="grid flex-1 min-h-0 grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex min-h-0 flex-col gap-2">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-zinc-500">Before</p>
          <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
            <img src={beforeUrl} alt="Before edit" className="h-full w-full object-contain" />
          </div>
        </div>
        <div className="flex min-h-0 flex-col gap-2">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-[#dbb56e]">After</p>
          <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-[#c99850]/40 bg-zinc-900">
            <img src={afterUrl} alt="After edit" className="h-full w-full object-contain" />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onDiscard}
          className="flex flex-1 items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-800/70 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
        >
          <X className="h-4 w-4" />
          Discard
        </button>
        <button
          onClick={onKeep}
          className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#c99850] px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#dbb56e]"
        >
          <Check className="h-4 w-4" />
          Keep
        </button>
      </div>
    </div>
  )
}
