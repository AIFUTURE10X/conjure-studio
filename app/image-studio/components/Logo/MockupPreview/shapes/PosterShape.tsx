"use client"

/**
 * Poster Shape Component
 *
 * SVG rendering of an unframed poster/print with subtle paper curl.
 */

import type { ShapeRendererProps, MockupView } from '../generic/mockup-types'

export const POSTER_VIEWBOX = '0 0 360 480'

export function PosterShape({ color, view = 'front', className, style }: ShapeRendererProps) {
  const isDark = color.textColor === 'light'

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className || ''}`} style={style}>
      <svg
        viewBox={POSTER_VIEWBOX}
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.35))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Paper curl shadow gradient */}
          <linearGradient id="poster-curl-shadow" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.15)" />
            <stop offset="10%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>

          {/* Paper texture gradient */}
          <linearGradient id="poster-paper-sheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.05)" />
          </linearGradient>

          {/* Edge highlight */}
          <linearGradient id="poster-edge" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="5%" stopColor="rgba(255,255,255,0)" />
            <stop offset="95%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
        </defs>

        {/* Shadow beneath poster */}
        <rect
          x="25"
          y="25"
          width="320"
          height="440"
          rx="2"
          fill="rgba(0,0,0,0.12)"
        />

        {/* Main poster */}
        <rect
          x="20"
          y="20"
          width="320"
          height="440"
          rx="2"
          fill={color.hex}
          stroke={isDark ? '#333' : '#e5e5e5'}
          strokeWidth="1"
        />

        {/* Paper sheen overlay */}
        <rect
          x="20"
          y="20"
          width="320"
          height="440"
          rx="2"
          fill="url(#poster-paper-sheen)"
        />

        {/* Edge highlight */}
        <rect
          x="20"
          y="20"
          width="320"
          height="440"
          rx="2"
          fill="url(#poster-edge)"
        />

        {/* Bottom curl shadow */}
        <rect
          x="20"
          y="380"
          width="320"
          height="80"
          fill="url(#poster-curl-shadow)"
        />

        {/* Subtle corner curl bottom-right */}
        <path
          d="M325 445 Q335 450 340 460 L340 460 Q330 455 320 455 Z"
          fill="rgba(0,0,0,0.08)"
        />

        {/* Paper edge thickness hint - bottom */}
        <line
          x1="20"
          y1="460"
          x2="340"
          y2="460"
          stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
          strokeWidth="1"
        />

        {/* Paper edge thickness hint - right */}
        <line
          x1="340"
          y1="20"
          x2="340"
          y2="460"
          stroke={isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.05)'}
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}

export function drawPosterToCanvas(
  ctx: CanvasRenderingContext2D,
  color: { hex: string; textColor: 'light' | 'dark' },
  width: number,
  height: number,
  view: MockupView = 'front'
) {
  const isDark = color.textColor === 'light'

  const scaleX = width / 360
  const scaleY = height / 480

  ctx.save()
  ctx.scale(scaleX, scaleY)

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.12)'
  ctx.beginPath()
  ctx.roundRect(25, 25, 320, 440, 2)
  ctx.fill()

  // Main poster
  ctx.fillStyle = color.hex
  ctx.beginPath()
  ctx.roundRect(20, 20, 320, 440, 2)
  ctx.fill()

  // Border
  ctx.strokeStyle = isDark ? '#333' : '#e5e5e5'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.restore()
}
