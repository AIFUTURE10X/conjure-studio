"use client"

/**
 * Baby Bodysuit (Onesie) Shape Component
 *
 * SVG rendering of the baby bodysuit shape with fabric effects.
 * Supports front and back views.
 */

import type { ShapeRendererProps, MockupView } from '../generic/mockup-types'

export const BABYBODYSUIT_PATHS = {
  // Onesie body with snap crotch
  body: `M130 100
    L70 130 L90 180 L90 280
    L120 320 L130 380 L160 400 L200 410 L240 400 L270 380 L280 320
    L310 280 L310 180 L330 130 L270 100
    L240 100
    C240 125 225 145 200 145
    C175 145 160 125 160 100
    Z`,
  bodyBack: `M130 100
    L70 130 L90 180 L90 280
    L120 320 L130 380 L160 400 L200 410 L240 400 L270 380 L280 320
    L310 280 L310 180 L330 130 L270 100
    L240 100
    C240 115 225 130 200 130
    C175 130 160 115 160 100
    Z`,
  // Snap buttons at crotch
  snapLeft: 'M145 395 A5 5 0 1 1 145 385 A5 5 0 1 1 145 395',
  snapCenter: 'M200 405 A5 5 0 1 1 200 395 A5 5 0 1 1 200 405',
  snapRight: 'M255 395 A5 5 0 1 1 255 385 A5 5 0 1 1 255 395',
  // Front view
  collar: 'M155 100 C155 125 172 145 200 145 C228 145 245 125 245 100',
  innerCollar: 'M158 103 C158 122 174 140 200 140 C226 140 242 122 242 103',
  centerFold: 'M200 145 L200 380',
  // Back view
  neckBack: 'M155 100 C155 115 172 130 200 130 C228 130 245 115 245 100',
  backSeam: 'M200 130 L200 380',
  // Sleeve seams
  leftSleeveSeam: 'M90 180 L130 100',
  rightSleeveSeam: 'M310 180 L270 100',
}

export const BABYBODYSUIT_VIEWBOX = '30 90 340 340'

export function BabyBodysuitShape({ color, view = 'front', className, style }: ShapeRendererProps) {
  const isDark = color.textColor === 'light'
  const isBack = view === 'back'

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className || ''}`} style={style}>
      <svg
        viewBox={BABYBODYSUIT_VIEWBOX}
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="babybodysuit-fabricSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
        </defs>

        {/* Main body */}
        <path
          d={isBack ? BABYBODYSUIT_PATHS.bodyBack : BABYBODYSUIT_PATHS.body}
          fill={color.hex}
          stroke={isDark ? '#333' : '#ddd'}
          strokeWidth="1.5"
        />

        {/* Fabric sheen */}
        <path
          d={isBack ? BABYBODYSUIT_PATHS.bodyBack : BABYBODYSUIT_PATHS.body}
          fill="url(#babybodysuit-fabricSheen)"
        />

        {/* Snap buttons */}
        <circle cx="155" cy="390" r="5" fill={isDark ? '#444' : '#ccc'} stroke={isDark ? '#222' : '#999'} strokeWidth="1" />
        <circle cx="200" cy="400" r="5" fill={isDark ? '#444' : '#ccc'} stroke={isDark ? '#222' : '#999'} strokeWidth="1" />
        <circle cx="245" cy="390" r="5" fill={isDark ? '#444' : '#ccc'} stroke={isDark ? '#222' : '#999'} strokeWidth="1" />

        {isBack ? (
          <>
            <path
              d={BABYBODYSUIT_PATHS.neckBack}
              fill="none"
              stroke={isDark ? '#222' : '#ccc'}
              strokeWidth="2"
            />
            <path
              d={BABYBODYSUIT_PATHS.backSeam}
              stroke={isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'}
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          </>
        ) : (
          <>
            <path
              d={BABYBODYSUIT_PATHS.centerFold}
              stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
              strokeWidth="1"
            />
            <path
              d={BABYBODYSUIT_PATHS.collar}
              fill="none"
              stroke={isDark ? '#222' : '#ccc'}
              strokeWidth="2"
            />
            <path
              d={BABYBODYSUIT_PATHS.innerCollar}
              fill="none"
              stroke={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)'}
              strokeWidth="1"
            />
          </>
        )}

        {/* Sleeve seams */}
        <path
          d={BABYBODYSUIT_PATHS.leftSleeveSeam}
          stroke={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.15)'}
          strokeWidth="1"
        />
        <path
          d={BABYBODYSUIT_PATHS.rightSleeveSeam}
          stroke={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.15)'}
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}

export function drawBabyBodysuitToCanvas(
  ctx: CanvasRenderingContext2D,
  color: { hex: string; textColor: 'light' | 'dark' },
  width: number,
  height: number,
  view: MockupView = 'front'
) {
  const isDark = color.textColor === 'light'
  const isBack = view === 'back'

  const scaleX = width / 340
  const scaleY = height / 340

  ctx.save()
  ctx.scale(scaleX, scaleY)
  ctx.translate(-30, -90)

  // Main body
  ctx.beginPath()
  ctx.moveTo(130, 100)
  ctx.lineTo(70, 130)
  ctx.lineTo(90, 180)
  ctx.lineTo(90, 280)
  ctx.lineTo(120, 320)
  ctx.lineTo(130, 380)
  ctx.lineTo(160, 400)
  ctx.lineTo(200, 410)
  ctx.lineTo(240, 400)
  ctx.lineTo(270, 380)
  ctx.lineTo(280, 320)
  ctx.lineTo(310, 280)
  ctx.lineTo(310, 180)
  ctx.lineTo(330, 130)
  ctx.lineTo(270, 100)
  ctx.lineTo(240, 100)
  if (isBack) {
    ctx.bezierCurveTo(240, 115, 225, 130, 200, 130)
    ctx.bezierCurveTo(175, 130, 160, 115, 160, 100)
  } else {
    ctx.bezierCurveTo(240, 125, 225, 145, 200, 145)
    ctx.bezierCurveTo(175, 145, 160, 125, 160, 100)
  }
  ctx.closePath()
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.strokeStyle = isDark ? '#333' : '#ddd'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Snap buttons
  const snapColor = isDark ? '#444' : '#ccc'
  const snapStroke = isDark ? '#222' : '#999'
  ;[{ x: 155, y: 390 }, { x: 200, y: 400 }, { x: 245, y: 390 }].forEach(({ x, y }) => {
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fillStyle = snapColor
    ctx.fill()
    ctx.strokeStyle = snapStroke
    ctx.lineWidth = 1
    ctx.stroke()
  })

  if (isBack) {
    ctx.beginPath()
    ctx.moveTo(200, 130)
    ctx.lineTo(200, 380)
    ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.stroke()
    ctx.setLineDash([])

    ctx.beginPath()
    ctx.moveTo(155, 100)
    ctx.bezierCurveTo(155, 115, 172, 130, 200, 130)
    ctx.bezierCurveTo(228, 130, 245, 115, 245, 100)
    ctx.strokeStyle = isDark ? '#222' : '#ccc'
    ctx.lineWidth = 2
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.moveTo(200, 145)
    ctx.lineTo(200, 380)
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(155, 100)
    ctx.bezierCurveTo(155, 125, 172, 145, 200, 145)
    ctx.bezierCurveTo(228, 145, 245, 125, 245, 100)
    ctx.strokeStyle = isDark ? '#222' : '#ccc'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  ctx.restore()
}
