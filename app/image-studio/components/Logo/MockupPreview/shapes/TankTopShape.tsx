"use client"

/**
 * Tank Top Shape Component
 *
 * SVG rendering of the tank top shape with fabric effects.
 * Supports front and back views.
 */

import type { ShapeRendererProps, MockupView } from '../generic/mockup-types'

export const TANKTOP_PATHS = {
  // Sleeveless body
  body: `M120 120
    L80 140 L80 440
    L320 440 L320 140 L280 120
    L240 120
    C240 150 225 175 200 175
    C175 175 160 150 160 120
    Z`,
  bodyBack: `M120 120
    L80 140 L80 440
    L320 440 L320 140 L280 120
    L240 120
    C240 140 225 155 200 155
    C175 155 160 140 160 120
    Z`,
  // Front view
  collar: 'M150 120 C150 150 170 175 200 175 C230 175 250 150 250 120',
  innerCollar: 'M155 125 C155 148 172 170 200 170 C228 170 245 148 245 125',
  centerFold: 'M200 175 L200 440',
  // Back view
  neckBack: 'M150 120 C150 140 170 155 200 155 C230 155 250 140 250 120',
  backSeam: 'M200 155 L200 440',
  // Armhole curves
  leftArmhole: 'M120 120 Q100 180 80 140',
  rightArmhole: 'M280 120 Q300 180 320 140',
}

export const TANKTOP_VIEWBOX = '-10 115 420 335'

export function TankTopShape({ color, view = 'front', className, style }: ShapeRendererProps) {
  const isDark = color.textColor === 'light'
  const isBack = view === 'back'

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className || ''}`} style={style}>
      <svg
        viewBox={TANKTOP_VIEWBOX}
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="tanktop-fabricSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
        </defs>

        {/* Main body */}
        <path
          d={isBack ? TANKTOP_PATHS.bodyBack : TANKTOP_PATHS.body}
          fill={color.hex}
          stroke={isDark ? '#333' : '#ddd'}
          strokeWidth="1.5"
        />

        {/* Fabric sheen */}
        <path
          d={isBack ? TANKTOP_PATHS.bodyBack : TANKTOP_PATHS.body}
          fill="url(#tanktop-fabricSheen)"
        />

        {isBack ? (
          <>
            <path
              d={TANKTOP_PATHS.neckBack}
              fill="none"
              stroke={isDark ? '#222' : '#ccc'}
              strokeWidth="2"
            />
            <path
              d={TANKTOP_PATHS.backSeam}
              stroke={isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'}
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          </>
        ) : (
          <>
            <path
              d={TANKTOP_PATHS.centerFold}
              stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
              strokeWidth="1"
            />
            <path
              d={TANKTOP_PATHS.collar}
              fill="none"
              stroke={isDark ? '#222' : '#ccc'}
              strokeWidth="2"
            />
            <path
              d={TANKTOP_PATHS.innerCollar}
              fill="none"
              stroke={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)'}
              strokeWidth="1"
            />
          </>
        )}

        {/* Armhole detail */}
        <path
          d={TANKTOP_PATHS.leftArmhole}
          fill="none"
          stroke={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.15)'}
          strokeWidth="1"
        />
        <path
          d={TANKTOP_PATHS.rightArmhole}
          fill="none"
          stroke={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.15)'}
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}

export function drawTankTopToCanvas(
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
  ctx.moveTo(120, 120)
  ctx.lineTo(80, 140)
  ctx.lineTo(80, 440)
  ctx.lineTo(320, 440)
  ctx.lineTo(320, 140)
  ctx.lineTo(280, 120)
  ctx.lineTo(240, 120)
  if (isBack) {
    ctx.bezierCurveTo(240, 140, 225, 155, 200, 155)
    ctx.bezierCurveTo(175, 155, 160, 140, 160, 120)
  } else {
    ctx.bezierCurveTo(240, 150, 225, 175, 200, 175)
    ctx.bezierCurveTo(175, 175, 160, 150, 160, 120)
  }
  ctx.closePath()
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.strokeStyle = isDark ? '#333' : '#ddd'
  ctx.lineWidth = 1.5
  ctx.stroke()

  if (isBack) {
    ctx.beginPath()
    ctx.moveTo(200, 155)
    ctx.lineTo(200, 440)
    ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.stroke()
    ctx.setLineDash([])

    ctx.beginPath()
    ctx.moveTo(150, 120)
    ctx.bezierCurveTo(150, 140, 170, 155, 200, 155)
    ctx.bezierCurveTo(230, 155, 250, 140, 250, 120)
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
    ctx.moveTo(150, 120)
    ctx.bezierCurveTo(150, 150, 170, 175, 200, 175)
    ctx.bezierCurveTo(230, 175, 250, 150, 250, 120)
    ctx.strokeStyle = isDark ? '#222' : '#ccc'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  ctx.restore()
}
