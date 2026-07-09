"use client"

/**
 * Pet Bed Shape Component
 *
 * SVG rendering of an oval pet bed.
 * Single view only (no back).
 */

import type { ShapeRendererProps, MockupView } from '../generic/mockup-types'

export const PETBED_PATHS = {
  // Outer oval border/rim
  outerRim: `M50 200
    C50 120 100 80 200 80
    C300 80 350 120 350 200
    C350 280 300 320 200 320
    C100 320 50 280 50 200
    Z`,
  // Inner sleeping area
  innerBed: `M80 200
    C80 140 120 110 200 110
    C280 110 320 140 320 200
    C320 260 280 290 200 290
    C120 290 80 260 80 200
    Z`,
  // Cushion detail
  cushionLines: [
    'M120 200 C120 160 150 140 200 140',
    'M200 140 C250 140 280 160 280 200',
    'M280 200 C280 240 250 260 200 260',
    'M200 260 C150 260 120 240 120 200',
  ],
}

export const PETBED_VIEWBOX = '30 60 340 280'

export function PetBedShape({ color, view = 'front', className, style }: ShapeRendererProps) {
  const isDark = color.textColor === 'light'

  // Derive inner color (slightly different shade)
  const innerColor = isDark
    ? adjustColor(color.hex, 15)  // Lighter for dark colors
    : adjustColor(color.hex, -10)  // Darker for light colors

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className || ''}`} style={style}>
      <svg
        viewBox={PETBED_VIEWBOX}
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="petbed-fabricSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
          </linearGradient>
          <radialGradient id="petbed-cushion" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </radialGradient>
        </defs>

        {/* Outer rim */}
        <ellipse
          cx="200"
          cy="200"
          rx="150"
          ry="120"
          fill={color.hex}
          stroke={isDark ? '#333' : '#ddd'}
          strokeWidth="2"
        />

        {/* Fabric sheen on rim */}
        <ellipse
          cx="200"
          cy="200"
          rx="150"
          ry="120"
          fill="url(#petbed-fabricSheen)"
        />

        {/* Inner bed (cushion area) */}
        <ellipse
          cx="200"
          cy="200"
          rx="120"
          ry="90"
          fill={innerColor}
          stroke={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)'}
          strokeWidth="1.5"
        />

        {/* Cushion gradient */}
        <ellipse
          cx="200"
          cy="200"
          rx="120"
          ry="90"
          fill="url(#petbed-cushion)"
        />

        {/* Quilted/tufted detail lines */}
        <ellipse
          cx="200"
          cy="200"
          rx="80"
          ry="55"
          fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
          strokeWidth="1"
          strokeDasharray="8,4"
        />

        {/* Center tufting */}
        <circle
          cx="200"
          cy="200"
          r="8"
          fill={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'}
        />
      </svg>
    </div>
  )
}

// Helper to adjust color brightness
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, Math.max(0, (num >> 16) + amt))
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt))
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt))
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
}

export function drawPetBedToCanvas(
  ctx: CanvasRenderingContext2D,
  color: { hex: string; textColor: 'light' | 'dark' },
  width: number,
  height: number,
  view: MockupView = 'front'
) {
  const isDark = color.textColor === 'light'
  const innerColor = isDark
    ? adjustColor(color.hex, 15)
    : adjustColor(color.hex, -10)

  const scaleX = width / 340
  const scaleY = height / 280

  ctx.save()
  ctx.scale(scaleX, scaleY)
  ctx.translate(-30, -60)

  // Outer rim
  ctx.beginPath()
  ctx.ellipse(200, 200, 150, 120, 0, 0, Math.PI * 2)
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.strokeStyle = isDark ? '#333' : '#ddd'
  ctx.lineWidth = 2
  ctx.stroke()

  // Inner bed
  ctx.beginPath()
  ctx.ellipse(200, 200, 120, 90, 0, 0, Math.PI * 2)
  ctx.fillStyle = innerColor
  ctx.fill()
  ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Quilted detail
  ctx.beginPath()
  ctx.ellipse(200, 200, 80, 55, 0, 0, Math.PI * 2)
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
  ctx.lineWidth = 1
  ctx.setLineDash([8, 4])
  ctx.stroke()
  ctx.setLineDash([])

  // Center tuft
  ctx.beginPath()
  ctx.arc(200, 200, 8, 0, Math.PI * 2)
  ctx.fillStyle = isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'
  ctx.fill()

  ctx.restore()
}
