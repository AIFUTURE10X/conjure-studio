"use client"

/**
 * ThumbnailBackgroundFxPanel
 *
 * Photo adjustments + a darken scrim for an image background, plus a one-click
 * "darken & blur" preset — the #1 legibility trick for headlines over a photo.
 */

import { Moon } from 'lucide-react'
import { useThumbnail } from './ThumbnailProvider'
import { AdjustControls, RangeRow, SwatchRow, ToggleRow } from './ThumbnailControls'
import { DEFAULT_ADJUST } from './thumbnail-constants'
import { railButton, railLabel } from './thumbnail-ui'

const DEFAULT_DUOTONE = { shadow: '#1e1b4b', highlight: '#fbbf24' }

export function ThumbnailBackgroundFxPanel() {
  const { config, setBackground, patchBackgroundAdjust } = useThumbnail()
  const { background } = config
  if (background.kind !== 'image' || !background.imageUrl) return null

  const adjust = { ...DEFAULT_ADJUST, ...background.adjust }
  const scrim = background.scrim ?? 0
  const duotone = background.duotone ?? null

  const darkenAndBlur = () => {
    setBackground({ scrim: 45 })
    patchBackgroundAdjust({ blur: 5, brightness: 90 })
  }

  return (
    <div className="space-y-2">
      <h4 className={railLabel}>Background adjust</h4>

      <button onClick={darkenAndBlur} className={`${railButton} w-full`}>
        <Moon className="h-3.5 w-3.5" /> Darken &amp; blur (for text)
      </button>

      <RangeRow label="Darken" value={scrim} min={0} max={80} suffix="%" onChange={(v) => setBackground({ scrim: v })} />
      <AdjustControls adjust={adjust} onChange={patchBackgroundAdjust} />

      <ToggleRow
        label="Duotone"
        active={!!duotone}
        onToggle={() => setBackground({ duotone: duotone ? null : DEFAULT_DUOTONE })}
      />
      {duotone && (
        <div className="space-y-1.5 rounded-md border border-zinc-800 bg-zinc-900/40 p-2">
          <SwatchRow label="Shadow" value={duotone.shadow} onChange={(v) => setBackground({ duotone: { ...duotone, shadow: v } })} />
          <SwatchRow label="Highlight" value={duotone.highlight} onChange={(v) => setBackground({ duotone: { ...duotone, highlight: v } })} />
        </div>
      )}
    </div>
  )
}
