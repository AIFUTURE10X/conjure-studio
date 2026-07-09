"use client"

/**
 * Sticker Shape Component
 *
 * SVG rendering of die-cut stickers in various shapes (circle, rounded square).
 */

import type { ShapeRendererProps } from '../generic/mockup-types'

export const STICKER_VIEWBOX = '0 0 300 300'

export function StickerShape({ color, className, style }: ShapeRendererProps) {
  const isDark = color.textColor === 'light'

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className || ''}`} style={style}>
      <svg
        viewBox={STICKER_VIEWBOX}
        className="w-full h-full drop-shadow-xl"
        style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.25))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="sticker-sheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.05)" />
          </linearGradient>
          <filter id="sticker-bevel">
            <feDropShadow dx="0" dy="1" stdDeviation="0" floodColor="rgba(255,255,255,0.3)" />
          </filter>
        </defs>

        {/* Sticker background - rounded square (die-cut style) */}
        <rect
          x="25"
          y="25"
          width="250"
          height="250"
          rx="40"
          ry="40"
          fill={color.hex}
          stroke={isDark ? '#333' : '#ddd'}
          strokeWidth="2"
        />

        {/* Glossy sheen overlay */}
        <rect
          x="25"
          y="25"
          width="250"
          height="250"
          rx="40"
          ry="40"
          fill="url(#sticker-sheen)"
        />

        {/* White border/bleed area (common for stickers) */}
        <rect
          x="35"
          y="35"
          width="230"
          height="230"
          rx="32"
          ry="32"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* Subtle peel corner effect */}
        <path
          d="M255 55 Q265 45 275 45 L275 65 Q265 65 255 55"
          fill="rgba(0,0,0,0.08)"
        />

        {/* Light reflection (glossy effect) */}
        <ellipse
          cx="100"
          cy="80"
          rx="50"
          ry="25"
          fill="rgba(255,255,255,0.15)"
          transform="rotate(-15 100 80)"
        />
      </svg>
    </div>
  )
}

/**
 * Draw sticker to canvas (for export)
 */
export function drawStickerToCanvas(
  ctx: CanvasRenderingContext2D,
  color: { hex: string; textColor: 'light' | 'dark' },
  width: number,
  height: number
) {
  const isDark = color.textColor === 'light'
  const scaleX = width / 300
  const scaleY = height / 300

  ctx.save()
  ctx.scale(scaleX, scaleY)

  // Main sticker body
  ctx.beginPath()
  ctx.roundRect(25, 25, 250, 250, 40)
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.strokeStyle = isDark ? '#333' : '#ddd'
  ctx.lineWidth = 2
  ctx.stroke()

  // Sheen gradient
  const gradient = ctx.createLinearGradient(0, 0, 300, 300)
  gradient.addColorStop(0, 'rgba(255,255,255,0.2)')
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.05)')
  gradient.addColorStop(1, 'rgba(0,0,0,0.03)')
  ctx.fillStyle = gradient
  ctx.fill()

  ctx.restore()
}
