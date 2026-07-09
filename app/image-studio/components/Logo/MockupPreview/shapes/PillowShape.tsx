"use client"

/**
 * Pillow Shape Component
 *
 * SVG rendering of a decorative throw pillow.
 */

import type { ShapeRendererProps } from '../generic/mockup-types'

export const PILLOW_VIEWBOX = '0 0 400 400'

export function PillowShape({ color, className, style }: ShapeRendererProps) {
  const isDark = color.textColor === 'light'

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className || ''}`} style={style}>
      <svg
        viewBox={PILLOW_VIEWBOX}
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.35))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="pillow-sheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
          <filter id="pillow-soft">
            <feGaussianBlur stdDeviation="0.5" />
          </filter>
        </defs>

        {/* Pillow body - soft rounded square */}
        <path
          d={`M60 60
            Q60 20 100 20 L300 20 Q340 20 340 60
            L340 300 Q340 340 360 360
            Q340 380 300 380 L100 380 Q60 380 40 360
            Q60 340 60 300
            Z`}
          fill={color.hex}
          stroke={isDark ? '#333' : '#ccc'}
          strokeWidth="2"
        />

        {/* Fabric sheen */}
        <path
          d={`M60 60
            Q60 20 100 20 L300 20 Q340 20 340 60
            L340 300 Q340 340 360 360
            Q340 380 300 380 L100 380 Q60 380 40 360
            Q60 340 60 300
            Z`}
          fill="url(#pillow-sheen)"
        />

        {/* Puffy effect - subtle inner shadow */}
        <ellipse
          cx="200"
          cy="200"
          rx="130"
          ry="130"
          fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}
          strokeWidth="30"
        />

        {/* Corner seam details */}
        <circle cx="55" cy="55" r="8" fill={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'} />
        <circle cx="345" cy="55" r="8" fill={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'} />
        <circle cx="55" cy="345" r="8" fill={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'} />
        <circle cx="345" cy="345" r="8" fill={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'} />

        {/* Edge seam */}
        <path
          d={`M70 70
            Q70 30 105 30 L295 30 Q330 30 330 70
            L330 290 Q330 325 350 350
            Q325 370 290 370 L110 370 Q75 370 50 350
            Q70 325 70 290
            Z`}
          fill="none"
          stroke={isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)'}
          strokeWidth="1"
          strokeDasharray="8 4"
        />
      </svg>
    </div>
  )
}

/**
 * Draw pillow to canvas (for export)
 */
export function drawPillowToCanvas(
  ctx: CanvasRenderingContext2D,
  color: { hex: string; textColor: 'light' | 'dark' },
  width: number,
  height: number
) {
  const isDark = color.textColor === 'light'
  const scaleX = width / 400
  const scaleY = height / 400

  ctx.save()
  ctx.scale(scaleX, scaleY)

  // Pillow body
  ctx.beginPath()
  ctx.moveTo(60, 60)
  ctx.quadraticCurveTo(60, 20, 100, 20)
  ctx.lineTo(300, 20)
  ctx.quadraticCurveTo(340, 20, 340, 60)
  ctx.lineTo(340, 300)
  ctx.quadraticCurveTo(340, 340, 360, 360)
  ctx.quadraticCurveTo(340, 380, 300, 380)
  ctx.lineTo(100, 380)
  ctx.quadraticCurveTo(60, 380, 40, 360)
  ctx.quadraticCurveTo(60, 340, 60, 300)
  ctx.closePath()
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.strokeStyle = isDark ? '#333' : '#ccc'
  ctx.lineWidth = 2
  ctx.stroke()

  // Corner buttons
  ctx.fillStyle = isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'
  ctx.beginPath()
  ctx.arc(55, 55, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(345, 55, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(55, 345, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(345, 345, 8, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}
