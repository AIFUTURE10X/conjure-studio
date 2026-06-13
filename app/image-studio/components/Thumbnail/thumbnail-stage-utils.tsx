"use client"

/**
 * Stage rendering helpers — the headline text styling and the vector sticker
 * shapes, kept out of the layer components to stay under the file-size limit.
 */

import { type CSSProperties } from 'react'
import { THUMB_HEIGHT, type ThumbnailHeadline, type ThumbnailSticker } from './thumbnail-constants'

export function StickerShape({ sticker }: { sticker: ThumbnailSticker }) {
  const shadow = { filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.45))' } as const
  if (sticker.type === 'arrow') {
    return (
      <svg viewBox="0 0 100 100" className="h-full w-full" style={shadow}>
        <path d="M5,38 L60,38 L60,18 L95,50 L60,82 L60,62 L5,62 Z" fill={sticker.color} />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" style={shadow}>
      <circle cx="50" cy="50" r="42" fill="none" stroke={sticker.color} strokeWidth="9" />
    </svg>
  )
}

export function headlineStyle(headline: ThumbnailHeadline): CSSProperties {
  const fontPx = (headline.size / 100) * THUMB_HEIGHT
  const stroke = Math.max(3, fontPx * 0.07)
  const base: CSSProperties = {
    fontSize: fontPx,
    fontWeight: 900,
    lineHeight: 1.02,
    color: headline.color,
    textTransform: headline.uppercase ? 'uppercase' : 'none',
    letterSpacing: '-0.01em',
    fontFamily: "'Geist', system-ui, sans-serif",
  }
  if (headline.preset === 'pop') {
    return { ...base, WebkitTextStroke: `${stroke}px #000`, textShadow: `${fontPx * 0.05}px ${fontPx * 0.05}px 0 #000` }
  }
  if (headline.preset === 'outline') {
    return { ...base, WebkitTextStroke: `${stroke * 1.3}px #000` }
  }
  if (headline.preset === 'shadow') {
    return { ...base, textShadow: `0 ${fontPx * 0.04}px ${fontPx * 0.08}px rgba(0,0,0,0.75)` }
  }
  // block
  return {
    ...base,
    color: headline.color,
    backgroundColor: '#000',
    padding: `${fontPx * 0.08}px ${fontPx * 0.18}px`,
    borderRadius: fontPx * 0.08,
    boxDecorationBreak: 'clone',
    WebkitBoxDecorationBreak: 'clone',
  }
}
