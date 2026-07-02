"use client"

/**
 * EditCompareView
 *
 * Before/After review shown after a successful AI edit call, rendered as a
 * wipe compare: the After image sits on top of Before, clipped at a
 * draggable vertical divider so dragging left/right reveals more or less
 * of Before underneath. Press-and-hold anywhere (off the divider) peeks at
 * Before in full for as long as the pointer is down. When the edit
 * returned multiple variants, a thumbnail strip lets the user pick which
 * one is shown as After — Keep commits whichever is selected.
 */

import { useRef } from 'react'
import { Check, X } from 'lucide-react'
import { useWipeCompare } from './useWipeCompare'

interface EditCompareViewProps {
  beforeUrl: string
  afterUrls: string[]
  selectedIndex: number
  onSelectIndex: (index: number) => void
  onKeep: () => void
  onDiscard: () => void
}

export function EditCompareView({
  beforeUrl, afterUrls, selectedIndex, onSelectIndex, onKeep, onDiscard,
}: EditCompareViewProps) {
  const afterUrl = afterUrls[selectedIndex] ?? afterUrls[0]
  const containerRef = useRef<HTMLDivElement>(null)
  const wipe = useWipeCompare(containerRef)
  const revealAt = wipe.isHolding ? 100 : wipe.position

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-3">
      <div className="flex items-center justify-center gap-8 text-xs font-semibold uppercase tracking-wide">
        <span className="text-zinc-500">Before</span>
        <span className="text-[#dbb56e]">After</span>
      </div>

      <div
        ref={containerRef}
        className="relative min-h-[320px] flex-1 touch-none overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 select-none"
        onPointerDown={wipe.onContainerPointerDown}
        onPointerMove={wipe.onContainerPointerMove}
        onPointerUp={wipe.onContainerPointerUp}
        onPointerLeave={wipe.onContainerPointerUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        <img
          src={beforeUrl}
          alt="Before edit"
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
        />
        <img
          src={afterUrl}
          alt="After edit"
          draggable={false}
          style={{ clipPath: `inset(0 0 0 ${revealAt}%)` }}
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
        />

        {!wipe.isHolding && (
          <div
            onPointerDown={wipe.onDividerPointerDown}
            onPointerUp={wipe.onDividerPointerUp}
            title="Drag to compare"
            className="absolute top-0 bottom-0 z-10 flex w-6 -translate-x-1/2 cursor-ew-resize items-center justify-center"
            style={{ left: `${wipe.position}%` }}
          >
            <div className="h-full w-0.5 bg-[#dbb56e]" />
            <div className="absolute h-7 w-7 rounded-full border-2 border-[#dbb56e] bg-zinc-950/90" />
          </div>
        )}
      </div>

      {afterUrls.length > 1 && (
        <div className="flex justify-center gap-2">
          {afterUrls.map((url, i) => (
            <button
              key={url}
              onClick={() => onSelectIndex(i)}
              title={`Show candidate ${i + 1} as After`}
              className={`overflow-hidden rounded-md border-2 transition-colors ${
                i === selectedIndex ? 'border-[#c99850]' : 'border-zinc-700 hover:border-zinc-500'
              }`}
            >
              <img src={url} alt={`Candidate ${i + 1}`} className="h-14 w-14 object-cover" />
            </button>
          ))}
        </div>
      )}

      <p className="text-center text-[11px] text-zinc-500">Drag the divider, or press and hold to peek at Before.</p>

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
