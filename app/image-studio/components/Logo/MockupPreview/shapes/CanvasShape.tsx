"use client"

/**
 * Canvas Print Shape Component
 *
 * SVG rendering of a wall canvas print with depth/gallery wrap.
 */

import type { ShapeRendererProps, MockupView } from '../generic/mockup-types'

export const CANVAS_VIEWBOX = '20 20 360 280'

export function CanvasShape({ color, view = 'front', className, style }: ShapeRendererProps) {
  const isDark = color.textColor === 'light'

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className || ''}`} style={style}>
      <svg
        viewBox={CANVAS_VIEWBOX}
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.5))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="canvas-side-shadow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
          <linearGradient id="canvas-bottom-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.1)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
          </linearGradient>
        </defs>

        {/* Canvas depth - right side */}
        <path
          d="M340 50 L360 40 L360 260 L340 270"
          fill={isDark ? '#333' : '#ccc'}
        />
        <path
          d="M340 50 L360 40 L360 260 L340 270"
          fill="url(#canvas-side-shadow)"
        />

        {/* Canvas depth - bottom */}
        <path
          d="M60 270 L340 270 L360 260 L80 260"
          fill={isDark ? '#444' : '#bbb'}
        />
        <path
          d="M60 270 L340 270 L360 260 L80 260"
          fill="url(#canvas-bottom-shadow)"
        />

        {/* Main canvas face */}
        <rect
          x="60"
          y="50"
          width="280"
          height="220"
          fill={color.hex}
          stroke={isDark ? '#222' : '#ddd'}
          strokeWidth="1"
        />

        {/* Canvas texture overlay */}
        <rect
          x="60"
          y="50"
          width="280"
          height="220"
          fill="url(#canvas-texture)"
          opacity="0.1"
        />

        {/* Inner shadow for depth */}
        <rect
          x="60"
          y="50"
          width="280"
          height="220"
          fill="none"
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="3"
        />

        {/* Highlight edge - top */}
        <line
          x1="60"
          y1="50"
          x2="340"
          y2="50"
          stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)'}
          strokeWidth="1"
        />

        {/* Highlight edge - left */}
        <line
          x1="60"
          y1="50"
          x2="60"
          y2="270"
          stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)'}
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}

export function drawCanvasToCanvas(
  ctx: CanvasRenderingContext2D,
  color: { hex: string; textColor: 'light' | 'dark' },
  width: number,
  height: number,
  view: MockupView = 'front'
) {
  const isDark = color.textColor === 'light'

  const scaleX = width / 360
  const scaleY = height / 280

  ctx.save()
  ctx.scale(scaleX, scaleY)
  ctx.translate(-20, -20)

  // Right side depth
  ctx.beginPath()
  ctx.moveTo(340, 50)
  ctx.lineTo(360, 40)
  ctx.lineTo(360, 260)
  ctx.lineTo(340, 270)
  ctx.closePath()
  ctx.fillStyle = isDark ? '#333' : '#ccc'
  ctx.fill()

  // Bottom depth
  ctx.beginPath()
  ctx.moveTo(60, 270)
  ctx.lineTo(340, 270)
  ctx.lineTo(360, 260)
  ctx.lineTo(80, 260)
  ctx.closePath()
  ctx.fillStyle = isDark ? '#444' : '#bbb'
  ctx.fill()

  // Main face
  ctx.fillStyle = color.hex
  ctx.fillRect(60, 50, 280, 220)
  ctx.strokeStyle = isDark ? '#222' : '#ddd'
  ctx.lineWidth = 1
  ctx.strokeRect(60, 50, 280, 220)

  // Inner shadow
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'
  ctx.lineWidth = 3
  ctx.strokeRect(62, 52, 276, 216)

  ctx.restore()
}
