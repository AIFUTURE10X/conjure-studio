"use client"

/**
 * T-Shirt Shape Component
 *
 * SVG rendering of the t-shirt shape with fabric effects.
 * Supports front and back views.
 * Used by both the interactive mockup and canvas export.
 */

import type { ShapeRendererProps, MockupView } from '../generic/mockup-types'

/**
 * SVG path definitions for T-shirt shape (for canvas export)
 */
export const TSHIRT_PATHS = {
  // Shared paths (both views) - narrower width
  body: `M90 120
    L50 160 L80 190 L80 440
    L320 440 L320 190 L350 160 L310 120
    L260 120
    C260 145 235 175 200 175
    C165 175 140 145 140 120
    Z`,
  bodyBack: `M90 120
    L50 160 L80 190 L80 440
    L320 440 L320 190 L350 160 L310 120
    L260 120
    C260 135 235 150 200 150
    C165 150 140 135 140 120
    Z`,
  leftSeam: 'M80 190 L90 120',
  rightSeam: 'M320 190 L310 120',
  // Front view only
  collar: 'M130 120 C130 145 160 175 200 175 C240 175 270 145 270 120',
  innerCollar: 'M140 125 C140 145 165 170 200 170 C235 170 260 145 260 125',
  centerFold: 'M200 175 L200 440',
  // Back view only
  neckBack: 'M130 120 C130 135 160 150 200 150 C240 150 270 135 270 120',
  backSeam: 'M200 150 L200 440',
}

/**
 * SVG viewBox for T-shirt
 * Tightly cropped with slightly narrower width for better proportions
 */
export const TSHIRT_VIEWBOX = '-40 115 480 335'

export function TShirtShape({ color, view = 'front', className, style }: ShapeRendererProps) {
  const isDark = color.textColor === 'light'
  const isBack = view === 'back'

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className || ''}`} style={style}>
      <svg
        viewBox={TSHIRT_VIEWBOX}
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Fabric texture gradient */}
        <defs>
          <linearGradient id="tshirt-fabricSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
          <linearGradient id="tshirt-fabricFold" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="30%" stopColor="rgba(0,0,0,0.05)" />
            <stop offset="70%" stopColor="rgba(255,255,255,0.03)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
        </defs>

        {/* T-shirt body */}
        <path
          d={isBack ? TSHIRT_PATHS.bodyBack : TSHIRT_PATHS.body}
          fill={color.hex}
          stroke={isDark ? '#333' : '#ddd'}
          strokeWidth="1.5"
        />

        {/* Fabric sheen overlay */}
        <path
          d={isBack ? TSHIRT_PATHS.bodyBack : TSHIRT_PATHS.body}
          fill="url(#tshirt-fabricSheen)"
        />

        {isBack ? (
          <>
            {/* Back view: neck line */}
            <path
              d={TSHIRT_PATHS.neckBack}
              fill="none"
              stroke={isDark ? '#222' : '#ccc'}
              strokeWidth="2"
            />
            {/* Back view: center seam - matches front styling */}
            <path
              d={TSHIRT_PATHS.backSeam}
              stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
              strokeWidth="1"
            />
          </>
        ) : (
          <>
            {/* Front view: center fold line - subtle */}
            <path
              d={TSHIRT_PATHS.centerFold}
              stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
              strokeWidth="1"
            />
            {/* Front view: collar detail */}
            <path
              d={TSHIRT_PATHS.collar}
              fill="none"
              stroke={isDark ? '#222' : '#ccc'}
              strokeWidth="2"
            />
            {/* Front view: inner collar shadow */}
            <path
              d={TSHIRT_PATHS.innerCollar}
              fill="none"
              stroke={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)'}
              strokeWidth="1"
            />
          </>
        )}

        {/* Sleeve seam lines (both views) */}
        <path
          d={TSHIRT_PATHS.leftSeam}
          stroke={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.15)'}
          strokeWidth="1"
        />
        <path
          d={TSHIRT_PATHS.rightSeam}
          stroke={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.15)'}
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}

/**
 * Draw T-shirt shape to canvas context (for export)
 *
 * ViewBox is '-40 115 480 335' meaning:
 * - minX = -40, minY = 115
 * - width = 480, height = 335
 */
export function drawTShirtToCanvas(
  ctx: CanvasRenderingContext2D,
  color: { hex: string; textColor: 'light' | 'dark' },
  width: number,
  height: number,
  view: MockupView = 'front'
) {
  const isDark = color.textColor === 'light'
  const isBack = view === 'back'

  // ViewBox dimensions from TSHIRT_VIEWBOX = '-40 115 480 335'
  const viewBoxX = -40
  const viewBoxY = 115
  const viewBoxWidth = 480
  const viewBoxHeight = 335

  // Scale from viewBox dimensions to canvas size
  const scaleX = width / viewBoxWidth
  const scaleY = height / viewBoxHeight

  ctx.save()
  ctx.scale(scaleX, scaleY)
  // Translate to account for viewBox origin
  ctx.translate(-viewBoxX, -viewBoxY)

  // Main body (narrower)
  ctx.beginPath()
  ctx.moveTo(90, 120)
  ctx.lineTo(50, 160)
  ctx.lineTo(80, 190)
  ctx.lineTo(80, 440)
  ctx.lineTo(320, 440)
  ctx.lineTo(320, 190)
  ctx.lineTo(350, 160)
  ctx.lineTo(310, 120)
  ctx.lineTo(260, 120)
  if (isBack) {
    // Back view: shallower neck curve
    ctx.bezierCurveTo(260, 135, 235, 150, 200, 150)
    ctx.bezierCurveTo(165, 150, 140, 135, 140, 120)
  } else {
    // Front view: deeper collar
    ctx.bezierCurveTo(260, 145, 235, 175, 200, 175)
    ctx.bezierCurveTo(165, 175, 140, 145, 140, 120)
  }
  ctx.closePath()
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.strokeStyle = isDark ? '#333' : '#ddd'
  ctx.lineWidth = 1.5
  ctx.stroke()

  if (isBack) {
    // Back seam - matches front styling
    ctx.beginPath()
    ctx.moveTo(200, 150)
    ctx.lineTo(200, 440)
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Neck line
    ctx.beginPath()
    ctx.moveTo(130, 120)
    ctx.bezierCurveTo(130, 135, 160, 150, 200, 150)
    ctx.bezierCurveTo(240, 150, 270, 135, 270, 120)
    ctx.strokeStyle = isDark ? '#222' : '#ccc'
    ctx.lineWidth = 2
    ctx.stroke()
  } else {
    // Front center fold - matches back styling
    ctx.beginPath()
    ctx.moveTo(200, 175)
    ctx.lineTo(200, 440)
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Collar
    ctx.beginPath()
    ctx.moveTo(130, 120)
    ctx.bezierCurveTo(130, 145, 160, 175, 200, 175)
    ctx.bezierCurveTo(240, 175, 270, 145, 270, 120)
    ctx.strokeStyle = isDark ? '#222' : '#ccc'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  ctx.restore()
}
