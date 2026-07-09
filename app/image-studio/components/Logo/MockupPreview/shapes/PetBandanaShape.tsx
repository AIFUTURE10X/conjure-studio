"use client"

/**
 * Pet Bandana Shape Component
 *
 * SVG rendering of a triangular pet bandana.
 * Single view only (no back).
 */

import type { ShapeRendererProps, MockupView } from '../generic/mockup-types'

export const PETBANDANA_PATHS = {
  // Triangle bandana shape
  body: `M80 100
    L320 100
    L200 350
    Z`,
  // Top fold/seam where it ties
  topFold: 'M80 100 Q200 130 320 100',
  // Decorative stitching
  innerStitch: `M100 120
    L300 120
    L200 320
    Z`,
}

export const PETBANDANA_VIEWBOX = '50 80 300 290'

export function PetBandanaShape({ color, view = 'front', className, style }: ShapeRendererProps) {
  const isDark = color.textColor === 'light'

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className || ''}`} style={style}>
      <svg
        viewBox={PETBANDANA_VIEWBOX}
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="petbandana-fabricSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
          <pattern id="petbandana-fabric" patternUnits="userSpaceOnUse" width="4" height="4">
            <rect width="4" height="4" fill={color.hex} />
            <rect width="2" height="2" fill={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'} />
          </pattern>
        </defs>

        {/* Main bandana */}
        <path
          d={PETBANDANA_PATHS.body}
          fill={color.hex}
          stroke={isDark ? '#333' : '#ddd'}
          strokeWidth="2"
        />

        {/* Fabric texture overlay */}
        <path
          d={PETBANDANA_PATHS.body}
          fill="url(#petbandana-fabricSheen)"
        />

        {/* Top fold detail */}
        <path
          d={PETBANDANA_PATHS.topFold}
          fill="none"
          stroke={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)'}
          strokeWidth="2"
        />

        {/* Inner decorative stitching */}
        <path
          d={PETBANDANA_PATHS.innerStitch}
          fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}
          strokeWidth="1"
          strokeDasharray="6,3"
        />
      </svg>
    </div>
  )
}

export function drawPetBandanaToCanvas(
  ctx: CanvasRenderingContext2D,
  color: { hex: string; textColor: 'light' | 'dark' },
  width: number,
  height: number,
  view: MockupView = 'front'
) {
  const isDark = color.textColor === 'light'

  const scaleX = width / 300
  const scaleY = height / 290

  ctx.save()
  ctx.scale(scaleX, scaleY)
  ctx.translate(-50, -80)

  // Main bandana triangle
  ctx.beginPath()
  ctx.moveTo(80, 100)
  ctx.lineTo(320, 100)
  ctx.lineTo(200, 350)
  ctx.closePath()
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.strokeStyle = isDark ? '#333' : '#ddd'
  ctx.lineWidth = 2
  ctx.stroke()

  // Top fold
  ctx.beginPath()
  ctx.moveTo(80, 100)
  ctx.quadraticCurveTo(200, 130, 320, 100)
  ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)'
  ctx.lineWidth = 2
  ctx.stroke()

  // Inner stitching
  ctx.beginPath()
  ctx.moveTo(100, 120)
  ctx.lineTo(300, 120)
  ctx.lineTo(200, 320)
  ctx.closePath()
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'
  ctx.lineWidth = 1
  ctx.setLineDash([6, 3])
  ctx.stroke()
  ctx.setLineDash([])

  ctx.restore()
}
