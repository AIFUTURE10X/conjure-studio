"use client"

/**
 * Tote Bag Shape Component
 *
 * SVG rendering of a canvas tote bag with handles.
 */

import type { ShapeRendererProps } from '../generic/mockup-types'

export const TOTE_VIEWBOX = '0 0 350 450'

export function ToteBagShape({ color, className, style }: ShapeRendererProps) {
  const isDark = color.textColor === 'light'

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className || ''}`} style={style}>
      <svg
        viewBox={TOTE_VIEWBOX}
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.35))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="tote-fabric" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.08)" />
          </linearGradient>
        </defs>

        {/* Handles */}
        <path
          d="M95 50 Q95 20 115 20 L135 20 Q155 20 155 50"
          fill="none"
          stroke={color.hex}
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M95 50 Q95 20 115 20 L135 20 Q155 20 155 50"
          fill="none"
          stroke={isDark ? '#333' : '#bbb'}
          strokeWidth="2"
        />

        <path
          d="M195 50 Q195 20 215 20 L235 20 Q255 20 255 50"
          fill="none"
          stroke={color.hex}
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M195 50 Q195 20 215 20 L235 20 Q255 20 255 50"
          fill="none"
          stroke={isDark ? '#333' : '#bbb'}
          strokeWidth="2"
        />

        {/* Bag body */}
        <path
          d={`M40 50
            L30 420
            Q30 435 45 435
            L305 435
            Q320 435 320 420
            L310 50
            Z`}
          fill={color.hex}
          stroke={isDark ? '#333' : '#ccc'}
          strokeWidth="2"
        />

        {/* Fabric texture overlay */}
        <path
          d={`M40 50
            L30 420
            Q30 435 45 435
            L305 435
            Q320 435 320 420
            L310 50
            Z`}
          fill="url(#tote-fabric)"
        />

        {/* Top opening - slight curve */}
        <path
          d="M40 50 Q175 65 310 50"
          fill="none"
          stroke={isDark ? '#222' : '#aaa'}
          strokeWidth="3"
        />

        {/* Inner shadow at top */}
        <path
          d="M50 55 Q175 68 300 55"
          fill="none"
          stroke={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.15)'}
          strokeWidth="4"
        />

        {/* Center fold line */}
        <path
          d="M175 65 L175 430"
          stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
          strokeWidth="1"
        />

        {/* Bottom gusset hint */}
        <path
          d="M50 420 Q175 425 300 420"
          fill="none"
          stroke={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'}
          strokeWidth="1"
        />

        {/* Side seam hints */}
        <path
          d="M55 60 L45 425"
          stroke={isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.08)'}
          strokeWidth="1"
        />
        <path
          d="M295 60 L305 425"
          stroke={isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.08)'}
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}

/**
 * Draw tote bag to canvas (for export)
 */
export function drawToteBagToCanvas(
  ctx: CanvasRenderingContext2D,
  color: { hex: string; textColor: 'light' | 'dark' },
  width: number,
  height: number
) {
  const isDark = color.textColor === 'light'
  const scaleX = width / 350
  const scaleY = height / 450

  ctx.save()
  ctx.scale(scaleX, scaleY)

  // Handles
  ctx.strokeStyle = color.hex
  ctx.lineWidth = 12
  ctx.lineCap = 'round'

  ctx.beginPath()
  ctx.moveTo(95, 50)
  ctx.quadraticCurveTo(95, 20, 115, 20)
  ctx.lineTo(135, 20)
  ctx.quadraticCurveTo(155, 20, 155, 50)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(195, 50)
  ctx.quadraticCurveTo(195, 20, 215, 20)
  ctx.lineTo(235, 20)
  ctx.quadraticCurveTo(255, 20, 255, 50)
  ctx.stroke()

  // Bag body
  ctx.beginPath()
  ctx.moveTo(40, 50)
  ctx.lineTo(30, 420)
  ctx.quadraticCurveTo(30, 435, 45, 435)
  ctx.lineTo(305, 435)
  ctx.quadraticCurveTo(320, 435, 320, 420)
  ctx.lineTo(310, 50)
  ctx.closePath()
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.strokeStyle = isDark ? '#333' : '#ccc'
  ctx.lineWidth = 2
  ctx.stroke()

  // Top opening
  ctx.beginPath()
  ctx.moveTo(40, 50)
  ctx.quadraticCurveTo(175, 65, 310, 50)
  ctx.strokeStyle = isDark ? '#222' : '#aaa'
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.restore()
}
