"use client"

/**
 * Fanny Pack / Belt Bag Shape Component
 *
 * SVG rendering of a fanny pack / waist bag.
 */

import type { ShapeRendererProps, MockupView } from '../generic/mockup-types'

export const FANNYPACK_VIEWBOX = '20 60 360 200'

export function FannyPackShape({ color, view = 'front', className, style }: ShapeRendererProps) {
  const isDark = color.textColor === 'light'

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className || ''}`} style={style}>
      <svg
        viewBox={FANNYPACK_VIEWBOX}
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.4))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="fannypack-shine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="30%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="70%" stopColor="rgba(0,0,0,0.05)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
          </linearGradient>
        </defs>

        {/* Strap - left */}
        <path
          d="M30 150 Q50 145 80 150"
          fill="none"
          stroke={isDark ? '#333' : '#bbb'}
          strokeWidth="16"
          strokeLinecap="round"
        />

        {/* Strap - right */}
        <path
          d="M320 150 Q350 145 370 150"
          fill="none"
          stroke={isDark ? '#333' : '#bbb'}
          strokeWidth="16"
          strokeLinecap="round"
        />

        {/* Main body - rounded rectangle shape */}
        <path
          d="M80 90 Q200 70 320 90 Q340 90 340 120 L335 200 Q200 230 65 200 L60 120 Q60 90 80 90"
          fill={color.hex}
          stroke={isDark ? '#333' : '#ddd'}
          strokeWidth="2"
        />

        {/* Shine effect */}
        <path
          d="M80 90 Q200 70 320 90 Q340 90 340 120 L335 200 Q200 230 65 200 L60 120 Q60 90 80 90"
          fill="url(#fannypack-shine)"
        />

        {/* Front pocket */}
        <path
          d="M110 120 Q200 105 290 120 Q300 120 300 135 L295 185 Q200 200 105 185 L100 135 Q100 120 110 120"
          fill={isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'}
          stroke={isDark ? '#333' : '#ccc'}
          strokeWidth="1"
        />

        {/* Zipper track */}
        <path
          d="M110 120 Q200 105 290 120"
          stroke={isDark ? '#555' : '#999'}
          strokeWidth="4"
          fill="none"
        />

        {/* Zipper pull */}
        <circle cx="200" cy="113" r="5" fill={isDark ? '#666' : '#aaa'} />

        {/* Buckle base - left */}
        <rect
          x="50"
          y="140"
          width="25"
          height="20"
          fill={isDark ? '#444' : '#888'}
          rx="3"
        />

        {/* Buckle base - right */}
        <rect
          x="325"
          y="140"
          width="25"
          height="20"
          fill={isDark ? '#444' : '#888'}
          rx="3"
        />

        {/* Center buckle */}
        <rect
          x="175"
          y="210"
          width="50"
          height="25"
          fill={isDark ? '#333' : '#777'}
          rx="4"
        />
        <rect
          x="185"
          y="215"
          width="30"
          height="15"
          fill={isDark ? '#555' : '#999'}
          rx="2"
        />

        {/* Logo area indicator */}
        <ellipse
          cx="200"
          cy="152"
          rx="50"
          ry="25"
          fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
          strokeWidth="1"
          strokeDasharray="3,3"
        />
      </svg>
    </div>
  )
}

export function drawFannyPackToCanvas(
  ctx: CanvasRenderingContext2D,
  color: { hex: string; textColor: 'light' | 'dark' },
  width: number,
  height: number,
  view: MockupView = 'front'
) {
  const isDark = color.textColor === 'light'

  const scaleX = width / 360
  const scaleY = height / 200

  ctx.save()
  ctx.scale(scaleX, scaleY)
  ctx.translate(-20, -60)

  // Straps
  ctx.strokeStyle = isDark ? '#333' : '#bbb'
  ctx.lineWidth = 16
  ctx.lineCap = 'round'

  ctx.beginPath()
  ctx.moveTo(30, 150)
  ctx.quadraticCurveTo(50, 145, 80, 150)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(320, 150)
  ctx.quadraticCurveTo(350, 145, 370, 150)
  ctx.stroke()

  // Main body
  ctx.beginPath()
  ctx.moveTo(80, 90)
  ctx.quadraticCurveTo(200, 70, 320, 90)
  ctx.quadraticCurveTo(340, 90, 340, 120)
  ctx.lineTo(335, 200)
  ctx.quadraticCurveTo(200, 230, 65, 200)
  ctx.lineTo(60, 120)
  ctx.quadraticCurveTo(60, 90, 80, 90)
  ctx.closePath()
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.strokeStyle = isDark ? '#333' : '#ddd'
  ctx.lineWidth = 2
  ctx.stroke()

  // Front pocket
  ctx.beginPath()
  ctx.moveTo(110, 120)
  ctx.quadraticCurveTo(200, 105, 290, 120)
  ctx.quadraticCurveTo(300, 120, 300, 135)
  ctx.lineTo(295, 185)
  ctx.quadraticCurveTo(200, 200, 105, 185)
  ctx.lineTo(100, 135)
  ctx.quadraticCurveTo(100, 120, 110, 120)
  ctx.closePath()
  ctx.fillStyle = isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'
  ctx.fill()

  // Zipper
  ctx.strokeStyle = isDark ? '#555' : '#999'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(110, 120)
  ctx.quadraticCurveTo(200, 105, 290, 120)
  ctx.stroke()

  // Buckles
  ctx.fillStyle = isDark ? '#444' : '#888'
  ctx.fillRect(50, 140, 25, 20)
  ctx.fillRect(325, 140, 25, 20)

  ctx.restore()
}
