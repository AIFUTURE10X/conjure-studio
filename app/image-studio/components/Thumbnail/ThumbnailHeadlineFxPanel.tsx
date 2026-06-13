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
import { THUMBNAIL_FONTS } from './thumbnail-fonts'
import { railLabel } from './thumbnail-ui'

const DEFAULT_GRADIENT: [string, string] = ['#ffe14d', '#ff5e5e']
const DEFAULT_HIGHLIGHT = { color: '#ff3b30', roundness: 20, opacity: 100 }

export function ThumbnailHeadlineFxPanel() {
  const { config, setHeadline } = useThumbnail()
  const { headline } = config
  const fontId = headline.font ?? 'geist'
  const gradient = headline.gradient ?? null
  const highlight = headline.highlight ?? null

  return (
    <div className="space-y-2.5">
      <div className="space-y-1.5">
        <span className={railLabel}>Font</span>
        <div className="grid grid-cols-3 gap-1.5">
          {THUMBNAIL_FONTS.map((f) => (
            <button
              key={f.id}
              onClick={() => setHeadline({ font: f.id })}
              style={{ fontFamily: f.family }}
              className={`truncate rounded-md border px-1.5 py-1.5 text-sm transition-colors ${
                fontId === f.id ? 'border-[#c99850] bg-[#c99850]/10 text-[#dbb56e]' : 'border-zinc-700 bg-zinc-800/70 text-zinc-200 hover:bg-zinc-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

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
            <RangeRow label="Roundness" value={highlight.roundness} min={0} max={100} suffix="%" onChange={(v) => setHeadline({ highlight: { ...highlight, roundness: v } })} />
            <RangeRow label="Opacity" value={highlight.opacity} min={0} max={100} suffix="%" onChange={(v) => setHeadline({ highlight: { ...highlight, opacity: v } })} />
          </div>
        )}
      </div>
    </div>
  )
}
