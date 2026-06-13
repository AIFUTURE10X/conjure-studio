"use client"

/**
 * ThumbnailBackgroundFxPanel
 *
 * Photo adjustments + a darken scrim for an image background, plus a one-click
 * "darken & blur" preset — the #1 legibility trick for headlines over a photo.
 */

import { Moon } from 'lucide-react'
import { useThumbnail } from './ThumbnailProvider'
import { AdjustControls, RangeRow } from './ThumbnailControls'
import { DEFAULT_ADJUST } from './thumbnail-constants'
import { railButton, railLabel } from './thumbnail-ui'

export function ThumbnailBackgroundFxPanel() {
  const { config, setBackground, patchBackgroundAdjust } = useThumbnail()
  const { background } = config
  if (background.kind !== 'image' || !background.imageUrl) return null

  const adjust = { ...DEFAULT_ADJUST, ...background.adjust }
  const scrim = background.scrim ?? 0

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
    </div>
  )
}
