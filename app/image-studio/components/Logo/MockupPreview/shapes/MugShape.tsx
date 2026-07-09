"use client"

/**
 * Mug Shape Component
 *
 * SVG rendering of a coffee mug with handle.
 */

import type { ShapeRendererProps } from '../generic/mockup-types'

export const MUG_VIEWBOX = '0 0 400 350'

export function MugShape({ color, className, style }: ShapeRendererProps) {
  const isDark = color.textColor === 'light'

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className || ''}`} style={style}>
      <svg
        viewBox={MUG_VIEWBOX}
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.4))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="mug-sheen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
            <stop offset="30%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="70%" stopColor="rgba(0,0,0,0.05)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
          </linearGradient>
          <linearGradient id="mug-rim" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
        </defs>

        {/* Mug body - cylinder shape */}
        <path
          d={`M70 60
            L70 280
            Q70 310 100 310
            L240 310
            Q270 310 270 280
            L270 60
            Z`}
          fill={color.hex}
          stroke={isDark ? '#333' : '#ccc'}
          strokeWidth="2"
        />

        {/* Sheen overlay */}
        <path
          d={`M70 60
            L70 280
            Q70 310 100 310
            L240 310
            Q270 310 270 280
            L270 60
            Z`}
          fill="url(#mug-sheen)"
        />

        {/* Top rim - ellipse */}
        <ellipse
          cx="170"
          cy="60"
          rx="100"
          ry="25"
          fill={color.hex}
          stroke={isDark ? '#333' : '#ccc'}
          strokeWidth="2"
        />

        {/* Inner rim shadow */}
        <ellipse
          cx="170"
          cy="60"
          rx="90"
          ry="20"
          fill={isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)'}
        />

        {/* Handle */}
        <path
          d={`M270 100
            Q350 100 350 185
            Q350 270 270 270`}
          fill="none"
          stroke={color.hex}
          strokeWidth="25"
          strokeLinecap="round"
        />

        {/* Handle outline */}
        <path
          d={`M270 100
            Q350 100 350 185
            Q350 270 270 270`}
          fill="none"
          stroke={isDark ? '#333' : '#ccc'}
          strokeWidth="2"
        />

        {/* Handle inner edge */}
        <path
          d={`M270 115
            Q335 115 335 185
            Q335 255 270 255`}
          fill="none"
          stroke={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'}
          strokeWidth="1"
        />

        {/* Coffee liquid (subtle hint at top) */}
        <ellipse
          cx="170"
          cy="65"
          rx="80"
          ry="15"
          fill="#3d2817"
          opacity="0.3"
        />

        {/* Rim highlight */}
        <ellipse
          cx="170"
          cy="58"
          rx="100"
          ry="22"
          fill="none"
          stroke="url(#mug-rim)"
          strokeWidth="3"
        />

        {/* Bottom shadow hint */}
        <ellipse
          cx="170"
          cy="310"
          rx="85"
          ry="8"
          fill="rgba(0,0,0,0.2)"
        />
      </svg>
    </div>
  )
}

/**
 * Draw mug to canvas (for export)
 */
export function drawMugToCanvas(
  ctx: CanvasRenderingContext2D,
  color: { hex: string; textColor: 'light' | 'dark' },
  width: number,
  height: number
) {
  const isDark = color.textColor === 'light'
  const scaleX = width / 400
  const scaleY = height / 350

  ctx.save()
  ctx.scale(scaleX, scaleY)

  // Body
  ctx.beginPath()
  ctx.moveTo(70, 60)
  ctx.lineTo(70, 280)
  ctx.quadraticCurveTo(70, 310, 100, 310)
  ctx.lineTo(240, 310)
  ctx.quadraticCurveTo(270, 310, 270, 280)
  ctx.lineTo(270, 60)
  ctx.closePath()
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.strokeStyle = isDark ? '#333' : '#ccc'
  ctx.lineWidth = 2
  ctx.stroke()

  // Top rim
  ctx.beginPath()
  ctx.ellipse(170, 60, 100, 25, 0, 0, Math.PI * 2)
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.stroke()

  // Inner rim
  ctx.beginPath()
  ctx.ellipse(170, 60, 90, 20, 0, 0, Math.PI * 2)
  ctx.fillStyle = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)'
  ctx.fill()

  // Handle
  ctx.beginPath()
  ctx.moveTo(270, 100)
  ctx.quadraticCurveTo(350, 100, 350, 185)
  ctx.quadraticCurveTo(350, 270, 270, 270)
  ctx.strokeStyle = color.hex
  ctx.lineWidth = 25
  ctx.lineCap = 'round'
  ctx.stroke()

  // Handle outline
  ctx.strokeStyle = isDark ? '#333' : '#ccc'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.restore()
}
