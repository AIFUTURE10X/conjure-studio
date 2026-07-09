"use client"

/**
 * Kids T-Shirt Shape Component
 *
 * SVG rendering of a smaller kids t-shirt shape.
 * Supports front and back views.
 */

import type { ShapeRendererProps, MockupView } from '../generic/mockup-types'

export const KIDSTEE_PATHS = {
  // Smaller, proportioned for kids
  body: `M100 120
    L60 155 L85 185 L85 400
    L315 400 L315 185 L340 155 L300 120
    L255 120
    C255 142 235 165 200 165
    C165 165 145 142 145 120
    Z`,
  bodyBack: `M100 120
    L60 155 L85 185 L85 400
    L315 400 L315 185 L340 155 L300 120
    L255 120
    C255 135 235 148 200 148
    C165 148 145 135 145 120
    Z`,
  // Front view
  collar: 'M138 120 C138 142 163 165 200 165 C237 165 262 142 262 120',
  innerCollar: 'M145 124 C145 142 167 160 200 160 C233 160 255 142 255 124',
  centerFold: 'M200 165 L200 400',
  // Back view
  neckBack: 'M138 120 C138 135 163 148 200 148 C237 148 262 135 262 120',
  backSeam: 'M200 148 L200 400',
  // Sleeve seams
  leftSleeveSeam: 'M85 185 L100 120',
  rightSleeveSeam: 'M315 185 L300 120',
}

export const KIDSTEE_VIEWBOX = '20 115 360 295'

export function KidsTeeShape({ color, view = 'front', className, style }: ShapeRendererProps) {
  const isDark = color.textColor === 'light'
  const isBack = view === 'back'

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className || ''}`} style={style}>
      <svg
        viewBox={KIDSTEE_VIEWBOX}
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="kidstee-fabricSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
        </defs>

        {/* Main body */}
        <path
          d={isBack ? KIDSTEE_PATHS.bodyBack : KIDSTEE_PATHS.body}
          fill={color.hex}
          stroke={isDark ? '#333' : '#ddd'}
          strokeWidth="1.5"
        />

        {/* Fabric sheen */}
        <path
          d={isBack ? KIDSTEE_PATHS.bodyBack : KIDSTEE_PATHS.body}
          fill="url(#kidstee-fabricSheen)"
        />

        {isBack ? (
          <>
            <path
              d={KIDSTEE_PATHS.neckBack}
              fill="none"
              stroke={isDark ? '#222' : '#ccc'}
              strokeWidth="2"
            />
            <path
              d={KIDSTEE_PATHS.backSeam}
              stroke={isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'}
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          </>
        ) : (
          <>
            <path
              d={KIDSTEE_PATHS.centerFold}
              stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
              strokeWidth="1"
            />
            <path
              d={KIDSTEE_PATHS.collar}
              fill="none"
              stroke={isDark ? '#222' : '#ccc'}
              strokeWidth="2"
            />
            <path
              d={KIDSTEE_PATHS.innerCollar}
              fill="none"
              stroke={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)'}
              strokeWidth="1"
            />
          </>
        )}

        {/* Sleeve seams */}
        <path
          d={KIDSTEE_PATHS.leftSleeveSeam}
          stroke={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.15)'}
          strokeWidth="1"
        />
        <path
          d={KIDSTEE_PATHS.rightSleeveSeam}
          stroke={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.15)'}
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}

export function drawKidsTeeToCanvas(
  ctx: CanvasRenderingContext2D,
  color: { hex: string; textColor: 'light' | 'dark' },
  width: number,
  height: number,
  view: MockupView = 'front'
) {
  const isDark = color.textColor === 'light'
  const isBack = view === 'back'

  const scaleX = width / 360
  const scaleY = height / 295

  ctx.save()
  ctx.scale(scaleX, scaleY)
  ctx.translate(-20, -115)

  // Main body
  ctx.beginPath()
  ctx.moveTo(100, 120)
  ctx.lineTo(60, 155)
  ctx.lineTo(85, 185)
  ctx.lineTo(85, 400)
  ctx.lineTo(315, 400)
  ctx.lineTo(315, 185)
  ctx.lineTo(340, 155)
  ctx.lineTo(300, 120)
  ctx.lineTo(255, 120)
  if (isBack) {
    ctx.bezierCurveTo(255, 135, 235, 148, 200, 148)
    ctx.bezierCurveTo(165, 148, 145, 135, 145, 120)
  } else {
    ctx.bezierCurveTo(255, 142, 235, 165, 200, 165)
    ctx.bezierCurveTo(165, 165, 145, 142, 145, 120)
  }
  ctx.closePath()
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.strokeStyle = isDark ? '#333' : '#ddd'
  ctx.lineWidth = 1.5
  ctx.stroke()

  if (isBack) {
    ctx.beginPath()
    ctx.moveTo(200, 148)
    ctx.lineTo(200, 400)
    ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.stroke()
    ctx.setLineDash([])

    ctx.beginPath()
    ctx.moveTo(138, 120)
    ctx.bezierCurveTo(138, 135, 163, 148, 200, 148)
    ctx.bezierCurveTo(237, 148, 262, 135, 262, 120)
    ctx.strokeStyle = isDark ? '#222' : '#ccc'
    ctx.lineWidth = 2
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.moveTo(200, 165)
    ctx.lineTo(200, 400)
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(138, 120)
    ctx.bezierCurveTo(138, 142, 163, 165, 200, 165)
    ctx.bezierCurveTo(237, 165, 262, 142, 262, 120)
    ctx.strokeStyle = isDark ? '#222' : '#ccc'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  ctx.restore()
}
