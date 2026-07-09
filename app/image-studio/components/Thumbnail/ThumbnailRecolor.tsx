"use client"

/**
 * ThumbnailRecolor
 *
 * Snap the AI background to a channel's brand colors (reuses /api/recolor-logo).
 * Only the background is recolored — the headline stays an editable overlay.
 */

import { useState } from 'react'
import { Loader2, Palette } from 'lucide-react'
import { useThumbnail } from './ThumbnailProvider'
import { THUMBNAIL_BRAND_COLORS } from './thumbnail-constants'

export function ThumbnailRecolor() {
  const { config, recolorBackground, isRecoloring } = useThumbnail()
  const [picked, setPicked] = useState<string[]>([])

  const hasImage = config.background.kind === 'image' && !!config.background.imageUrl
  if (!hasImage) return null

  const toggle = (name: string) =>
    setPicked((cur) =>
      cur.includes(name) ? cur.filter((n) => n !== name) : cur.length >= 4 ? cur : [...cur, name],
    )

  return (
    <div className="space-y-2 border-t border-[#c99850]/20 pt-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Recolor background to brand</p>
      <div className="grid grid-cols-5 gap-1.5">
        {THUMBNAIL_BRAND_COLORS.map((c) => (
          <button
            key={c.name}
            onClick={() => toggle(c.name)}
            title={c.name}
            aria-pressed={picked.includes(c.name)}
            className={`h-7 rounded-md border-2 transition-transform ${
              picked.includes(c.name) ? 'scale-105 border-[#dbb56e]' : 'border-zinc-700'
            }`}
            style={{ background: c.hex }}
          />
        ))}
      </div>
      <button
        onClick={() => recolorBackground(picked)}
        disabled={isRecoloring || picked.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-[#c99850]/50 bg-[#c99850]/10 px-3 py-2 text-xs font-semibold text-[#dbb56e] transition-colors hover:bg-[#c99850]/20 disabled:opacity-50"
      >
        {isRecoloring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Palette className="h-3.5 w-3.5" />}
        {isRecoloring
          ? 'Recoloring…'
          : picked.length
            ? `Recolor to ${picked.length} color${picked.length > 1 ? 's' : ''}`
            : 'Pick brand colors'}
      </button>
    </div>
  )
}
