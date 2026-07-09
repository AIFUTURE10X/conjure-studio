"use client"

/**
 * Wall Art Shape Component
 *
 * SVG rendering of a framed canvas print / poster.
 */

import type { ShapeRendererProps } from '../generic/mockup-types'

export const WALLART_VIEWBOX = '0 0 400 500'

export function WallArtShape({ color, className, style }: ShapeRendererProps) {
  const isDark = color.textColor === 'light'

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className || ''}`} style={style}>
      <svg
        viewBox={WALLART_VIEWBOX}
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.4))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="frame-depth" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
          </linearGradient>
          <linearGradient id="canvas-texture" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.05)" />
          </linearGradient>
        </defs>

        {/* Shadow beneath frame */}
        <rect
          x="28"
          y="28"
          width="350"
          height="450"
          rx="4"
          fill="rgba(0,0,0,0.15)"
        />

        {/* Frame outer edge */}
        <rect
          x="20"
          y="20"
          width="360"
          height="460"
          rx="4"
          fill="#2a2a2a"
          stroke="#1a1a1a"
          strokeWidth="1"
        />

        {/* Frame inner bevel */}
        <rect
          x="25"
          y="25"
          width="350"
          height="450"
          rx="3"
          fill="url(#frame-depth)"
        />

        {/* Mat/border area */}
        <rect
          x="35"
          y="35"
          width="330"
          height="430"
          fill="#f5f5f5"
        />

        {/* Canvas/print area */}
        <rect
          x="50"
          y="50"
          width="300"
          height="400"
          fill={color.hex}
          stroke={isDark ? '#333' : '#ddd'}
          strokeWidth="1"
        />

        {/* Canvas texture overlay */}
        <rect
          x="50"
          y="50"
          width="300"
          height="400"
          fill="url(#canvas-texture)"
        />

        {/* Frame corner accents */}
        <line x1="20" y1="20" x2="35" y2="35" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <line x1="380" y1="20" x2="365" y2="35" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        <line x1="20" y1="480" x2="35" y2="465" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <line x1="380" y1="480" x2="365" y2="465" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />

        {/* Subtle canvas weave hint */}
        <pattern id="canvas-weave" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="transparent" />
          <rect x="0" y="0" width="2" height="2" fill="rgba(0,0,0,0.02)" />
          <rect x="2" y="2" width="2" height="2" fill="rgba(0,0,0,0.02)" />
        </pattern>
        <rect
          x="50"
          y="50"
          width="300"
          height="400"
          fill="url(#canvas-weave)"
        />
      </svg>
    </div>
  )
}

/**
 * Draw wall art to canvas (for export)
 */
export function drawWallArtToCanvas(
  ctx: CanvasRenderingContext2D,
  color: { hex: string; textColor: 'light' | 'dark' },
  width: number,
  height: number
) {
  const isDark = color.textColor === 'light'
  const scaleX = width / 400
  const scaleY = height / 500

  ctx.save()
  ctx.scale(scaleX, scaleY)

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.fillRect(28, 28, 350, 450)

  // Frame
  ctx.fillStyle = '#2a2a2a'
  ctx.fillRect(20, 20, 360, 460)

  // Mat
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(35, 35, 330, 430)

  // Canvas area
  ctx.fillStyle = color.hex
  ctx.fillRect(50, 50, 300, 400)
  ctx.strokeStyle = isDark ? '#333' : '#ddd'
  ctx.lineWidth = 1
  ctx.strokeRect(50, 50, 300, 400)

  ctx.restore()
}
