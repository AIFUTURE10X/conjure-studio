"use client"

/**
 * Hat/Cap Shape Component
 *
 * SVG rendering of a baseball cap / dad hat with curved brim.
 */

import type { ShapeRendererProps } from '../generic/mockup-types'

export const HAT_VIEWBOX = '0 0 400 300'

export function HatShape({ color, className, style }: ShapeRendererProps) {
  const isDark = color.textColor === 'light'

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className || ''}`} style={style}>
      <svg
        viewBox={HAT_VIEWBOX}
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.4))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="hat-fabricSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
          <linearGradient id="hat-brimShade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.1)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.25)" />
          </linearGradient>
        </defs>

        {/* Cap crown - main dome shape */}
        <path
          d={`M60 160
            C60 80 120 40 200 40
            C280 40 340 80 340 160
            L340 180
            C340 190 330 195 320 195
            L80 195
            C70 195 60 190 60 180
            Z`}
          fill={color.hex}
          stroke={isDark ? '#333' : '#ddd'}
          strokeWidth="1.5"
        />

        {/* Fabric sheen on crown */}
        <path
          d={`M60 160
            C60 80 120 40 200 40
            C280 40 340 80 340 160
            L340 180
            C340 190 330 195 320 195
            L80 195
            C70 195 60 190 60 180
            Z`}
          fill="url(#hat-fabricSheen)"
        />

        {/* Panel seams (6-panel cap style) */}
        <path
          d="M200 40 L200 195"
          stroke={isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'}
          strokeWidth="1"
        />
        <path
          d="M130 55 Q135 120 100 195"
          stroke={isDark ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.08)'}
          strokeWidth="1"
        />
        <path
          d="M270 55 Q265 120 300 195"
          stroke={isDark ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.08)'}
          strokeWidth="1"
        />

        {/* Top button */}
        <circle
          cx="200"
          cy="45"
          r="8"
          fill={color.hex}
          stroke={isDark ? '#222' : '#bbb'}
          strokeWidth="1.5"
        />

        {/* Brim - curved front bill */}
        <path
          d={`M70 195
            Q70 210 90 220
            Q200 260 310 220
            Q330 210 330 195
            L320 195
            Q200 230 80 195
            Z`}
          fill={color.hex}
          stroke={isDark ? '#333' : '#ccc'}
          strokeWidth="1.5"
        />

        {/* Brim underside shadow */}
        <path
          d={`M80 195
            Q200 225 320 195`}
          fill="none"
          stroke={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)'}
          strokeWidth="2"
        />

        {/* Brim edge highlight */}
        <path
          d={`M90 218
            Q200 255 310 218`}
          fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)'}
          strokeWidth="1"
        />

        {/* Brim stitch line */}
        <path
          d={`M95 212
            Q200 245 305 212`}
          fill="none"
          stroke={isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'}
          strokeWidth="0.5"
          strokeDasharray="4 2"
        />

        {/* Sweatband hint */}
        <path
          d="M80 195 L320 195"
          stroke={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.15)'}
          strokeWidth="3"
        />

        {/* Eyelets (ventilation holes) */}
        <circle cx="130" cy="100" r="3" fill={isDark ? '#222' : '#aaa'} />
        <circle cx="270" cy="100" r="3" fill={isDark ? '#222' : '#aaa'} />
      </svg>
    </div>
  )
}

/**
 * Draw hat shape to canvas (for export)
 */
export function drawHatToCanvas(
  ctx: CanvasRenderingContext2D,
  color: { hex: string; textColor: 'light' | 'dark' },
  width: number,
  height: number
) {
  const isDark = color.textColor === 'light'
  const scaleX = width / 400
  const scaleY = height / 300

  ctx.save()
  ctx.scale(scaleX, scaleY)

  // Crown
  ctx.beginPath()
  ctx.moveTo(60, 160)
  ctx.bezierCurveTo(60, 80, 120, 40, 200, 40)
  ctx.bezierCurveTo(280, 40, 340, 80, 340, 160)
  ctx.lineTo(340, 180)
  ctx.bezierCurveTo(340, 190, 330, 195, 320, 195)
  ctx.lineTo(80, 195)
  ctx.bezierCurveTo(70, 195, 60, 190, 60, 180)
  ctx.closePath()
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.strokeStyle = isDark ? '#333' : '#ddd'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Center seam
  ctx.beginPath()
  ctx.moveTo(200, 40)
  ctx.lineTo(200, 195)
  ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'
  ctx.lineWidth = 1
  ctx.stroke()

  // Button
  ctx.beginPath()
  ctx.arc(200, 45, 8, 0, Math.PI * 2)
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.strokeStyle = isDark ? '#222' : '#bbb'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Brim
  ctx.beginPath()
  ctx.moveTo(70, 195)
  ctx.quadraticCurveTo(70, 210, 90, 220)
  ctx.quadraticCurveTo(200, 260, 310, 220)
  ctx.quadraticCurveTo(330, 210, 330, 195)
  ctx.lineTo(320, 195)
  ctx.quadraticCurveTo(200, 230, 80, 195)
  ctx.closePath()
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.strokeStyle = isDark ? '#333' : '#ccc'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.restore()
}
