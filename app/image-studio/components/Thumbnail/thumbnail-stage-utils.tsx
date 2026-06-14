"use client"

/**
 * Stage rendering helpers — the headline text styling and the vector sticker
 * shapes, kept out of the layer components to stay under the file-size limit.
 */

import { type CSSProperties } from 'react'
import { THUMB_HEIGHT, type ThumbnailHeadline, type ThumbnailSticker } from './thumbnail-constants'
import { hexToRgba } from './thumbnail-fx'
import { fontFamilyFor } from './thumbnail-fonts'

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
  // strokeWidth 0–100 scales the auto weight (50 ≈ the original fontPx * 0.07).
  const stroke = Math.max(0, fontPx * ((headline.strokeWidth ?? 50) / 50) * 0.07)
  const base: CSSProperties = {
    fontSize: fontPx,
    fontWeight: 900,
    lineHeight: 1.02,
    color: headline.color,
    textTransform: headline.uppercase ? 'uppercase' : 'none',
    letterSpacing: `${(headline.letterSpacing ?? -1) / 100}em`,
    // noWrap keeps everything on one line; otherwise honor manual line breaks
    // (Enter in the text box) while still auto-wrapping at the wrap width.
    whiteSpace: headline.noWrap ? 'nowrap' : 'pre-line',
    // content-box so the wrap width (maxWidth) constrains the text, while the
    // highlight/block padding extends the box outward (lets Width actually grow it).
    boxSizing: 'content-box',
    fontFamily: fontFamilyFor(headline.font),
  }

  let style: CSSProperties
  if (headline.preset === 'pop') {
    style = { ...base, WebkitTextStroke: `${stroke}px #000`, textShadow: `${fontPx * 0.05}px ${fontPx * 0.05}px 0 #000` }
  } else if (headline.preset === 'outline') {
    style = { ...base, WebkitTextStroke: `${stroke * 1.3}px #000` }
  } else if (headline.preset === 'shadow') {
    style = { ...base, textShadow: `0 ${fontPx * 0.04}px ${fontPx * 0.08}px rgba(0,0,0,0.75)` }
  } else {
    // block
    style = {
      ...base,
      backgroundColor: '#000',
      padding: `${fontPx * 0.08}px ${fontPx * 0.18}px`,
      borderRadius: fontPx * 0.08,
      boxDecorationBreak: 'clone',
      WebkitBoxDecorationBreak: 'clone',
    }
  }

  // Gradient text fill — skipped when a highlight box is active (both use `background`).
  if (headline.gradient && !headline.highlight) {
    style = {
      ...style,
      backgroundImage: `linear-gradient(135deg, ${headline.gradient[0]}, ${headline.gradient[1]})`,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
    }
  }

  // Colored highlight box (Canva "Background" effect) — wins over the block preset.
  if (headline.highlight) {
    const h = headline.highlight
    // 50 ≈ the original padding; higher = bigger box. Width = horizontal, height = vertical.
    const padX = (h.width ?? 50) / 50
    const padY = (h.height ?? 50) / 50
    style = {
      ...style,
      color: headline.color,
      backgroundImage: undefined,
      backgroundColor: hexToRgba(h.color, h.opacity / 100),
      padding: `${fontPx * 0.08 * padY}px ${fontPx * 0.2 * padX}px`,
      borderRadius: (h.roundness / 100) * fontPx * 0.5,
      boxDecorationBreak: 'clone',
      WebkitBoxDecorationBreak: 'clone',
    }
  }

  return style
}
