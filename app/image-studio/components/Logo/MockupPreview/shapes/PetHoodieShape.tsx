"use client"

/**
 * Pet Hoodie Shape Component
 *
 * SVG rendering of a small pet hoodie.
 * Supports front and back views.
 */

import type { ShapeRendererProps, MockupView } from '../generic/mockup-types'

export const PETHOODIE_PATHS = {
  // Pet-sized hoodie body
  body: `M100 140
    L60 170 L70 220 L70 340
    L330 340 L330 220 L340 170 L300 140
    L260 140
    C260 160 240 175 200 175
    C160 175 140 160 140 140
    Z`,
  bodyBack: `M100 140
    L60 170 L70 220 L70 340
    L330 340 L330 220 L340 170 L300 140
    L260 140
    C260 155 240 165 200 165
    C160 165 140 155 140 140
    Z`,
  // Hood
  hood: `M140 140
    C140 100 160 70 200 70
    C240 70 260 100 260 140`,
  hoodBack: `M140 140
    C140 105 160 80 200 80
    C240 80 260 105 260 140`,
  // Front view collar/hood opening
  hoodOpening: 'M155 140 C155 160 172 175 200 175 C228 175 245 160 245 140',
  // Back view neck
  neckBack: 'M155 140 C155 155 172 165 200 165 C228 165 245 155 245 140',
  // Seams
  centerSeam: 'M200 175 L200 340',
  backSeam: 'M200 165 L200 340',
  // Sleeves
  leftSleeve: 'M70 220 L100 140',
  rightSleeve: 'M330 220 L300 140',
}

export const PETHOODIE_VIEWBOX = '30 50 340 310'

export function PetHoodieShape({ color, view = 'front', className, style }: ShapeRendererProps) {
  const isDark = color.textColor === 'light'
  const isBack = view === 'back'

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className || ''}`} style={style}>
      <svg
        viewBox={PETHOODIE_VIEWBOX}
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="pethoodie-fabricSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
        </defs>

        {/* Hood */}
        <path
          d={isBack ? PETHOODIE_PATHS.hoodBack : PETHOODIE_PATHS.hood}
          fill={color.hex}
          stroke={isDark ? '#333' : '#ddd'}
          strokeWidth="1.5"
        />

        {/* Main body */}
        <path
          d={isBack ? PETHOODIE_PATHS.bodyBack : PETHOODIE_PATHS.body}
          fill={color.hex}
          stroke={isDark ? '#333' : '#ddd'}
          strokeWidth="1.5"
        />

        {/* Fabric sheen */}
        <path
          d={isBack ? PETHOODIE_PATHS.bodyBack : PETHOODIE_PATHS.body}
          fill="url(#pethoodie-fabricSheen)"
        />

        {isBack ? (
          <>
            <path
              d={PETHOODIE_PATHS.neckBack}
              fill="none"
              stroke={isDark ? '#222' : '#ccc'}
              strokeWidth="2"
            />
            <path
              d={PETHOODIE_PATHS.backSeam}
              stroke={isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'}
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            {/* Hood back seam */}
            <path
              d="M200 80 L200 140"
              stroke={isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'}
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          </>
        ) : (
          <>
            <path
              d={PETHOODIE_PATHS.centerSeam}
              stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
              strokeWidth="1"
            />
            <path
              d={PETHOODIE_PATHS.hoodOpening}
              fill="none"
              stroke={isDark ? '#222' : '#ccc'}
              strokeWidth="2"
            />
            {/* Hood fold line */}
            <path
              d="M200 70 L200 140"
              stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
              strokeWidth="1"
            />
          </>
        )}

        {/* Sleeve seams */}
        <path
          d={PETHOODIE_PATHS.leftSleeve}
          stroke={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.15)'}
          strokeWidth="1"
        />
        <path
          d={PETHOODIE_PATHS.rightSleeve}
          stroke={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.15)'}
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}

export function drawPetHoodieToCanvas(
  ctx: CanvasRenderingContext2D,
  color: { hex: string; textColor: 'light' | 'dark' },
  width: number,
  height: number,
  view: MockupView = 'front'
) {
  const isDark = color.textColor === 'light'
  const isBack = view === 'back'

  const scaleX = width / 340
  const scaleY = height / 310

  ctx.save()
  ctx.scale(scaleX, scaleY)
  ctx.translate(-30, -50)

  // Hood
  ctx.beginPath()
  ctx.moveTo(140, 140)
  if (isBack) {
    ctx.bezierCurveTo(140, 105, 160, 80, 200, 80)
    ctx.bezierCurveTo(240, 80, 260, 105, 260, 140)
  } else {
    ctx.bezierCurveTo(140, 100, 160, 70, 200, 70)
    ctx.bezierCurveTo(240, 70, 260, 100, 260, 140)
  }
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.strokeStyle = isDark ? '#333' : '#ddd'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Body
  ctx.beginPath()
  ctx.moveTo(100, 140)
  ctx.lineTo(60, 170)
  ctx.lineTo(70, 220)
  ctx.lineTo(70, 340)
  ctx.lineTo(330, 340)
  ctx.lineTo(330, 220)
  ctx.lineTo(340, 170)
  ctx.lineTo(300, 140)
  ctx.lineTo(260, 140)
  if (isBack) {
    ctx.bezierCurveTo(260, 155, 240, 165, 200, 165)
    ctx.bezierCurveTo(160, 165, 140, 155, 140, 140)
  } else {
    ctx.bezierCurveTo(260, 160, 240, 175, 200, 175)
    ctx.bezierCurveTo(160, 175, 140, 160, 140, 140)
  }
  ctx.closePath()
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.stroke()

  if (isBack) {
    ctx.beginPath()
    ctx.moveTo(200, 165)
    ctx.lineTo(200, 340)
    ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.stroke()
    ctx.setLineDash([])

    ctx.beginPath()
    ctx.moveTo(155, 140)
    ctx.bezierCurveTo(155, 155, 172, 165, 200, 165)
    ctx.bezierCurveTo(228, 165, 245, 155, 245, 140)
    ctx.strokeStyle = isDark ? '#222' : '#ccc'
    ctx.lineWidth = 2
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.moveTo(200, 175)
    ctx.lineTo(200, 340)
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(155, 140)
    ctx.bezierCurveTo(155, 160, 172, 175, 200, 175)
    ctx.bezierCurveTo(228, 175, 245, 160, 245, 140)
    ctx.strokeStyle = isDark ? '#222' : '#ccc'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  ctx.restore()
}
