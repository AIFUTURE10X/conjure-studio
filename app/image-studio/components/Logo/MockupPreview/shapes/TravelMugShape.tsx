"use client"

/**
 * Travel Mug Shape Component
 *
 * SVG rendering of a travel/tumbler mug with lid.
 */

import type { ShapeRendererProps, MockupView } from '../generic/mockup-types'

export const TRAVELMUG_VIEWBOX = '60 30 280 400'

export function TravelMugShape({ color, view = 'front', className, style }: ShapeRendererProps) {
  const isDark = color.textColor === 'light'

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className || ''}`} style={style}>
      <svg
        viewBox={TRAVELMUG_VIEWBOX}
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="travelmug-shine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
            <stop offset="30%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="70%" stopColor="rgba(0,0,0,0.05)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
          </linearGradient>
        </defs>

        {/* Lid */}
        <ellipse
          cx="200"
          cy="60"
          rx="70"
          ry="15"
          fill="#333"
          stroke="#222"
          strokeWidth="1"
        />
        <rect
          x="130"
          y="60"
          width="140"
          height="40"
          fill="#333"
        />
        <ellipse
          cx="200"
          cy="100"
          rx="70"
          ry="12"
          fill="#444"
          stroke="#333"
          strokeWidth="1"
        />

        {/* Drink opening */}
        <ellipse
          cx="200"
          cy="55"
          rx="20"
          ry="6"
          fill="#222"
        />

        {/* Main body */}
        <path
          d="M125 100 L135 400 Q200 420 265 400 L275 100"
          fill={color.hex}
          stroke={isDark ? '#333' : '#ddd'}
          strokeWidth="1.5"
        />

        {/* Shine effect */}
        <path
          d="M125 100 L135 400 Q200 420 265 400 L275 100"
          fill="url(#travelmug-shine)"
        />

        {/* Grip band */}
        <path
          d="M128 200 L132 280 Q200 295 268 280 L272 200"
          fill={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.15)'}
          stroke={isDark ? '#222' : '#ccc'}
          strokeWidth="1"
        />

        {/* Texture lines on grip */}
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            d={`M${135 + i * 5} ${210 + i * 2} L${137 + i * 5} ${270 + i * 2}`}
            stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            strokeWidth="1"
          />
        ))}

        {/* Bottom rim */}
        <ellipse
          cx="200"
          cy="400"
          rx="65"
          ry="12"
          fill={isDark ? '#222' : '#ccc'}
        />
      </svg>
    </div>
  )
}

export function drawTravelMugToCanvas(
  ctx: CanvasRenderingContext2D,
  color: { hex: string; textColor: 'light' | 'dark' },
  width: number,
  height: number,
  view: MockupView = 'front'
) {
  const isDark = color.textColor === 'light'

  const scaleX = width / 280
  const scaleY = height / 400

  ctx.save()
  ctx.scale(scaleX, scaleY)
  ctx.translate(-60, -30)

  // Lid
  ctx.fillStyle = '#333'
  ctx.beginPath()
  ctx.ellipse(200, 60, 70, 15, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(130, 60, 140, 40)
  ctx.fillStyle = '#444'
  ctx.beginPath()
  ctx.ellipse(200, 100, 70, 12, 0, 0, Math.PI * 2)
  ctx.fill()

  // Body
  ctx.beginPath()
  ctx.moveTo(125, 100)
  ctx.lineTo(135, 400)
  ctx.quadraticCurveTo(200, 420, 265, 400)
  ctx.lineTo(275, 100)
  ctx.closePath()
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.strokeStyle = isDark ? '#333' : '#ddd'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Grip band
  ctx.beginPath()
  ctx.moveTo(128, 200)
  ctx.lineTo(132, 280)
  ctx.quadraticCurveTo(200, 295, 268, 280)
  ctx.lineTo(272, 200)
  ctx.closePath()
  ctx.fillStyle = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.15)'
  ctx.fill()

  ctx.restore()
}
