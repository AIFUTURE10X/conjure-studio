"use client"

/**
 * Tumbler Shape Component
 *
 * SVG rendering of a slim tumbler/bottle with straw hole lid.
 */

import type { ShapeRendererProps, MockupView } from '../generic/mockup-types'

export const TUMBLER_VIEWBOX = '80 20 240 440'

export function TumblerShape({ color, view = 'front', className, style }: ShapeRendererProps) {
  const isDark = color.textColor === 'light'

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className || ''}`} style={style}>
      <svg
        viewBox={TUMBLER_VIEWBOX}
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="tumbler-shine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
            <stop offset="30%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="70%" stopColor="rgba(0,0,0,0.05)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
          </linearGradient>
        </defs>

        {/* Lid */}
        <ellipse
          cx="200"
          cy="50"
          rx="55"
          ry="12"
          fill="#333"
          stroke="#222"
          strokeWidth="1"
        />
        <rect
          x="145"
          y="50"
          width="110"
          height="30"
          fill="#333"
        />
        <ellipse
          cx="200"
          cy="80"
          rx="55"
          ry="10"
          fill="#444"
          stroke="#333"
          strokeWidth="1"
        />

        {/* Straw hole */}
        <ellipse
          cx="200"
          cy="45"
          rx="10"
          ry="4"
          fill="#222"
        />

        {/* Straw */}
        <rect
          x="197"
          y="25"
          width="6"
          height="35"
          fill="#666"
          rx="3"
        />

        {/* Main body - slim tumbler shape */}
        <path
          d="M145 80 L150 420 Q200 435 250 420 L255 80"
          fill={color.hex}
          stroke={isDark ? '#333' : '#ddd'}
          strokeWidth="1.5"
        />

        {/* Shine effect */}
        <path
          d="M145 80 L150 420 Q200 435 250 420 L255 80"
          fill="url(#tumbler-shine)"
        />

        {/* Condensation rings */}
        {[0, 1, 2].map((i) => (
          <ellipse
            key={i}
            cx="200"
            cy={150 + i * 100}
            rx="52 - i * 2"
            ry="6"
            fill="none"
            stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
            strokeWidth="1"
          />
        ))}

        {/* Bottom rim */}
        <ellipse
          cx="200"
          cy="420"
          rx="50"
          ry="10"
          fill={isDark ? '#222' : '#ccc'}
        />

        {/* Bottom rubber base */}
        <ellipse
          cx="200"
          cy="430"
          rx="48"
          ry="8"
          fill="#333"
        />
      </svg>
    </div>
  )
}

export function drawTumblerToCanvas(
  ctx: CanvasRenderingContext2D,
  color: { hex: string; textColor: 'light' | 'dark' },
  width: number,
  height: number,
  view: MockupView = 'front'
) {
  const isDark = color.textColor === 'light'

  const scaleX = width / 240
  const scaleY = height / 440

  ctx.save()
  ctx.scale(scaleX, scaleY)
  ctx.translate(-80, -20)

  // Lid
  ctx.fillStyle = '#333'
  ctx.beginPath()
  ctx.ellipse(200, 50, 55, 12, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(145, 50, 110, 30)
  ctx.fillStyle = '#444'
  ctx.beginPath()
  ctx.ellipse(200, 80, 55, 10, 0, 0, Math.PI * 2)
  ctx.fill()

  // Straw
  ctx.fillStyle = '#666'
  ctx.fillRect(197, 25, 6, 35)

  // Body
  ctx.beginPath()
  ctx.moveTo(145, 80)
  ctx.lineTo(150, 420)
  ctx.quadraticCurveTo(200, 435, 250, 420)
  ctx.lineTo(255, 80)
  ctx.closePath()
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.strokeStyle = isDark ? '#333' : '#ddd'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Bottom
  ctx.fillStyle = '#333'
  ctx.beginPath()
  ctx.ellipse(200, 430, 48, 8, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}
