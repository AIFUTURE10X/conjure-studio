"use client"

/**
 * ThumbnailHeadlineFxPanel
 *
 * Headline typography & effects: a curated bold-display font picker, gradient
 * text fill, and a colored highlight box (Canva's "Background" effect — great
 * for lower-third label bars and keyword emphasis).
 */

import { useThumbnail } from './ThumbnailProvider'
import { RangeRow, SwatchRow, ToggleRow } from './ThumbnailControls'

const DEFAULT_GRADIENT: [string, string] = ['#ffe14d', '#ff5e5e']
const DEFAULT_HIGHLIGHT = { color: '#ff3b30', roundness: 20, opacity: 100, width: 50, height: 50 }

/** Gradient text fill + colored highlight box — the "Fill & Highlight" group. */
export function ThumbnailHeadlineFxPanel() {
  const { activeHeadline, setHeadline } = useThumbnail()
  const headline = activeHeadline
  const gradient = headline.gradient ?? null
  const highlight = headline.highlight ?? null

  return (
    <div className="space-y-1.5">
      <div className="space-y-1.5">
        <ToggleRow
          label="Gradient fill"
          active={!!gradient}
          onToggle={() => setHeadline({ gradient: gradient ? null : DEFAULT_GRADIENT })}
        />
        {gradient && (
          <div className="flex gap-1.5">
            {[0, 1].map((i) => (
              <input
                key={i}
                type="color"
                value={gradient[i]}
                onChange={(e) => {
                  const next: [string, string] = [...gradient]
                  next[i] = e.target.value
                  setHeadline({ gradient: next })
                }}
                className="h-7 flex-1 cursor-pointer rounded-md border border-zinc-700 bg-zinc-900"
                aria-label={`Gradient color ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <ToggleRow
          label="Highlight box"
          active={!!highlight}
          onToggle={() => setHeadline({ highlight: highlight ? null : DEFAULT_HIGHLIGHT })}
        />
        {highlight && (
          <div className="space-y-1.5 rounded-md border border-zinc-800 bg-zinc-900/40 p-2">
            <SwatchRow label="Color" value={highlight.color} onChange={(v) => setHeadline({ highlight: { ...highlight, color: v } })} />
            <div className="grid grid-cols-2 gap-2">
              <RangeRow label="Width" value={highlight.width ?? 50} min={0} max={100} suffix="%" onChange={(v) => setHeadline({ highlight: { ...highlight, width: v } })} />
              <RangeRow label="Height" value={highlight.height ?? 50} min={0} max={100} suffix="%" onChange={(v) => setHeadline({ highlight: { ...highlight, height: v } })} />
            </div>
            <RangeRow label="Roundness" value={highlight.roundness} min={0} max={100} suffix="%" onChange={(v) => setHeadline({ highlight: { ...highlight, roundness: v } })} />
            <RangeRow label="Opacity" value={highlight.opacity} min={0} max={100} suffix="%" onChange={(v) => setHeadline({ highlight: { ...highlight, opacity: v } })} />
          </div>
        )}
      </div>
    </div>
  )
}
