"use client"

/**
 * Long-Sleeve Shirt Shape Component
 *
 * SVG rendering of the long-sleeve shirt shape with fabric effects.
 * Supports front and back views.
 */

import type { ShapeRendererProps, MockupView } from '../generic/mockup-types'

export const LONGSLEEVE_PATHS = {
  // Body with longer sleeves
  body: `M70 120
    L20 150 L30 300 L80 290 L80 440
    L320 440 L320 290 L370 300 L380 150 L330 120
    L260 120
    C260 145 235 175 200 175
    C165 175 140 145 140 120
    Z`,
  bodyBack: `M70 120
    L20 150 L30 300 L80 290 L80 440
    L320 440 L320 290 L370 300 L380 150 L330 120
    L260 120
    C260 135 235 150 200 150
    C165 150 140 135 140 120
    Z`,
  // Cuffs
  leftCuff: 'M25 290 L35 310 L85 295 L75 280',
  rightCuff: 'M375 290 L365 310 L315 295 L325 280',
  // Front view
  collar: 'M130 120 C130 145 160 175 200 175 C240 175 270 145 270 120',
  innerCollar: 'M140 125 C140 145 165 170 200 170 C235 170 260 145 260 125',
  centerFold: 'M200 175 L200 440',
  // Back view
  neckBack: 'M130 120 C130 135 160 150 200 150 C240 150 270 135 270 120',
  backSeam: 'M200 150 L200 440',
  // Sleeve seams
  leftSleeveSeam: 'M80 290 L70 120',
  rightSleeveSeam: 'M320 290 L330 120',
}

export const LONGSLEEVE_VIEWBOX = '-40 115 480 335'

export function LongSleeveShape({ color, view = 'front', className, style }: ShapeRendererProps) {
  const isDark = color.textColor === 'light'
  const isBack = view === 'back'

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className || ''}`} style={style}>
      <svg
        viewBox={LONGSLEEVE_VIEWBOX}
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="longsleeve-fabricSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
        </defs>

        {/* Main body */}
        <path
          d={isBack ? LONGSLEEVE_PATHS.bodyBack : LONGSLEEVE_PATHS.body}
          fill={color.hex}
          stroke={isDark ? '#333' : '#ddd'}
          strokeWidth="1.5"
        />

        {/* Fabric sheen */}
        <path
          d={isBack ? LONGSLEEVE_PATHS.bodyBack : LONGSLEEVE_PATHS.body}
          fill="url(#longsleeve-fabricSheen)"
        />

        {/* Cuffs */}
        <path
          d={LONGSLEEVE_PATHS.leftCuff}
          fill={color.hex}
          stroke={isDark ? '#222' : '#ccc'}
          strokeWidth="1.5"
        />
        <path
          d={LONGSLEEVE_PATHS.rightCuff}
          fill={color.hex}
          stroke={isDark ? '#222' : '#ccc'}
          strokeWidth="1.5"
        />

        {isBack ? (
          <>
            <path
              d={LONGSLEEVE_PATHS.neckBack}
              fill="none"
              stroke={isDark ? '#222' : '#ccc'}
              strokeWidth="2"
            />
            <path
              d={LONGSLEEVE_PATHS.backSeam}
              stroke={isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'}
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          </>
        ) : (
          <>
            <path
              d={LONGSLEEVE_PATHS.centerFold}
              stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
              strokeWidth="1"
            />
            <path
              d={LONGSLEEVE_PATHS.collar}
              fill="none"
              stroke={isDark ? '#222' : '#ccc'}
              strokeWidth="2"
            />
            <path
              d={LONGSLEEVE_PATHS.innerCollar}
              fill="none"
              stroke={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)'}
              strokeWidth="1"
            />
          </>
        )}

        {/* Sleeve seams */}
        <path
          d={LONGSLEEVE_PATHS.leftSleeveSeam}
          stroke={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.15)'}
          strokeWidth="1"
        />
        <path
          d={LONGSLEEVE_PATHS.rightSleeveSeam}
          stroke={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.15)'}
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}

export function drawLongSleeveToCanvas(
  ctx: CanvasRenderingContext2D,
  color: { hex: string; textColor: 'light' | 'dark' },
  width: number,
  height: number,
  view: MockupView = 'front'
) {
  const isDark = color.textColor === 'light'
  const isBack = view === 'back'

  const scaleX = width / 400
  const scaleY = height / 360

  ctx.save()
  ctx.scale(scaleX, scaleY)
  ctx.translate(0, -100)

  // Main body
  ctx.beginPath()
  ctx.moveTo(70, 120)
  ctx.lineTo(20, 150)
  ctx.lineTo(30, 300)
  ctx.lineTo(80, 290)
  ctx.lineTo(80, 440)
  ctx.lineTo(320, 440)
  ctx.lineTo(320, 290)
  ctx.lineTo(370, 300)
  ctx.lineTo(380, 150)
  ctx.lineTo(330, 120)
  ctx.lineTo(260, 120)
  if (isBack) {
    ctx.bezierCurveTo(260, 135, 235, 150, 200, 150)
    ctx.bezierCurveTo(165, 150, 140, 135, 140, 120)
  } else {
    ctx.bezierCurveTo(260, 145, 235, 175, 200, 175)
    ctx.bezierCurveTo(165, 175, 140, 145, 140, 120)
  }
  ctx.closePath()
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.strokeStyle = isDark ? '#333' : '#ddd'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Cuffs
  ctx.beginPath()
  ctx.moveTo(25, 290)
  ctx.lineTo(35, 310)
  ctx.lineTo(85, 295)
  ctx.lineTo(75, 280)
  ctx.closePath()
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.strokeStyle = isDark ? '#222' : '#ccc'
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(375, 290)
  ctx.lineTo(365, 310)
  ctx.lineTo(315, 295)
  ctx.lineTo(325, 280)
  ctx.closePath()
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.stroke()

  if (isBack) {
    ctx.beginPath()
    ctx.moveTo(200, 150)
    ctx.lineTo(200, 440)
    ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.stroke()
    ctx.setLineDash([])

    ctx.beginPath()
    ctx.moveTo(130, 120)
    ctx.bezierCurveTo(130, 135, 160, 150, 200, 150)
    ctx.bezierCurveTo(240, 150, 270, 135, 270, 120)
    ctx.strokeStyle = isDark ? '#222' : '#ccc'
    ctx.lineWidth = 2
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.moveTo(200, 175)
    ctx.lineTo(200, 440)
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 1
    ctx.stroke()

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
