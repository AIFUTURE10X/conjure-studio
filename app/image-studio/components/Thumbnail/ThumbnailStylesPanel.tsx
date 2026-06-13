"use client"

/**
 * ThumbnailStylesPanel
 *
 * One-click "Styles" (palette + font + text treatment) and a Shuffle button
 * that randomizes the look — instant variations to pair with A/B compare
 * (Canva's Styles + Shuffle).
 */

import { Shuffle } from 'lucide-react'
import { useThumbnail } from './ThumbnailProvider'
import {
  SHUFFLE_FONTS,
  SHUFFLE_GRADIENTS,
  SHUFFLE_HEADLINE_COLORS,
  SHUFFLE_PRESETS,
  THUMBNAIL_STYLES,
  type ThumbnailStyle,
} from './thumbnail-constants'
import { railButton, railLabel } from './thumbnail-ui'

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

export function ThumbnailStylesPanel() {
  const { setHeadline, setBackground } = useThumbnail()

  const applyStyle = (style: ThumbnailStyle) => {
    setBackground({ gradient: style.gradient })
    setHeadline({ color: style.color, preset: style.preset, font: style.font })
  }

  const shuffle = () => {
    setBackground({ gradient: pick(SHUFFLE_GRADIENTS) })
    setHeadline({ color: pick(SHUFFLE_HEADLINE_COLORS), preset: pick(SHUFFLE_PRESETS), font: pick(SHUFFLE_FONTS) })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className={railLabel}>Styles</h4>
        <button
          onClick={shuffle}
          className="flex items-center gap-1 text-[10px] font-semibold text-[#dbb56e] transition-colors hover:text-[#e9c789]"
        >
          <Shuffle className="h-3 w-3" /> Shuffle
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {THUMBNAIL_STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => applyStyle(s)}
            title={`${s.label} style`}
            className={`${railButton} h-9 border-transparent text-white`}
            style={{ background: `linear-gradient(135deg, ${s.gradient[0]}, ${s.gradient[1]})` }}
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-zinc-600">Sets a palette + font + text style. Shuffle for instant variants.</p>
    </div>
  )
}
