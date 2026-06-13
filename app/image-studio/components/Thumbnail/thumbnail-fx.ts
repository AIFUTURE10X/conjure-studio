/**
 * Thumbnail FX — pure CSS-filter builders for the photo adjustments and the
 * subject "pop" effects (drop shadow / outline / glow). Kept out of the
 * constants file so that stays data + types.
 */

import {
  DEFAULT_ADJUST,
  DEFAULT_SUBJECT_FX,
  type ImageAdjust,
  type SubjectFx,
  type ThumbnailBackground,
  type ThumbnailSubject,
} from './thumbnail-constants'

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const r = parseInt(full.slice(0, 2), 16) || 0
  const g = parseInt(full.slice(2, 4), 16) || 0
  const b = parseInt(full.slice(4, 6), 16) || 0
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`
}

export function adjustToFilter(a: ImageAdjust = DEFAULT_ADJUST): string {
  const parts: string[] = []
  if (a.brightness !== 100) parts.push(`brightness(${a.brightness}%)`)
  if (a.contrast !== 100) parts.push(`contrast(${a.contrast}%)`)
  if (a.saturation !== 100) parts.push(`saturate(${a.saturation}%)`)
  if (a.blur > 0) parts.push(`blur(${a.blur}px)`)
  return parts.join(' ')
}

export function subjectFxToFilter(fx: SubjectFx = DEFAULT_SUBJECT_FX): string {
  const parts: string[] = []
  if (fx.outline && fx.outlineWidth > 0) {
    const w = fx.outlineWidth
    const d = Math.round(w * 0.7)
    const offsets: [number, number][] = [
      [w, 0], [-w, 0], [0, w], [0, -w], [d, d], [d, -d], [-d, d], [-d, -d],
    ]
    for (const [dx, dy] of offsets) parts.push(`drop-shadow(${dx}px ${dy}px 0 ${fx.outlineColor})`)
  }
  if (fx.glow && fx.glowSize > 0) {
    parts.push(`drop-shadow(0 0 ${fx.glowSize}px ${fx.glowColor})`)
    parts.push(`drop-shadow(0 0 ${Math.round(fx.glowSize / 2)}px ${fx.glowColor})`)
  }
  if (fx.shadow) {
    const rad = (fx.shadowAngle * Math.PI) / 180
    const dx = Math.round(Math.cos(rad) * fx.shadowOffset)
    const dy = Math.round(Math.sin(rad) * fx.shadowOffset)
    parts.push(`drop-shadow(${dx}px ${dy}px ${fx.shadowBlur}px ${hexToRgba(fx.shadowColor, fx.shadowOpacity / 100)})`)
  }
  return parts.join(' ')
}

export function subjectImageFilter(subject: ThumbnailSubject): string {
  const filter = [adjustToFilter(subject.adjust ?? DEFAULT_ADJUST), subjectFxToFilter(subject.fx ?? DEFAULT_SUBJECT_FX)]
    .filter(Boolean)
    .join(' ')
  return filter || 'none'
}

export function backgroundImageFilter(bg: ThumbnailBackground): string {
  return adjustToFilter(bg.adjust ?? DEFAULT_ADJUST) || 'none'
}
