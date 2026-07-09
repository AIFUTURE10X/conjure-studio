"use client"

/**
 * Backpack Shape Component
 *
 * SVG rendering of a backpack with front pocket.
 * Supports front and back views.
 */

import type { ShapeRendererProps, MockupView } from '../generic/mockup-types'

export const BACKPACK_VIEWBOX = '30 20 340 420'

export function BackpackShape({ color, view = 'front', className, style }: ShapeRendererProps) {
  const isDark = color.textColor === 'light'
  const isBack = view === 'back'

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className || ''}`} style={style}>
      <svg
        viewBox={BACKPACK_VIEWBOX}
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="backpack-shine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="30%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="70%" stopColor="rgba(0,0,0,0.05)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
          </linearGradient>
        </defs>

        {/* Top handle */}
        <path
          d="M170 40 Q200 25 230 40"
          fill="none"
          stroke={isDark ? '#333' : '#bbb'}
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Main body */}
        <path
          d="M80 60 Q60 60 60 100 L70 400 Q200 430 330 400 L340 100 Q340 60 320 60 Z"
          fill={color.hex}
          stroke={isDark ? '#333' : '#ddd'}
          strokeWidth="2"
        />

        {/* Fabric texture/shine */}
        <path
          d="M80 60 Q60 60 60 100 L70 400 Q200 430 330 400 L340 100 Q340 60 320 60 Z"
          fill="url(#backpack-shine)"
        />

        {isBack ? (
          <>
            {/* Back padding */}
            <rect
              x="90"
              y="80"
              width="220"
              height="280"
              fill={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'}
              rx="15"
            />

            {/* Padding lines */}
            {[0, 1, 2, 3].map((i) => (
              <rect
                key={i}
                x="105"
                y={100 + i * 65}
                width="190"
                height="50"
                fill={isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.08)'}
                rx="8"
              />
            ))}

            {/* Shoulder straps */}
            <path
              d="M100 90 Q80 150 85 250 L115 250 Q110 150 120 90"
              fill={color.hex}
              stroke={isDark ? '#222' : '#ccc'}
              strokeWidth="1.5"
            />
            <path
              d="M300 90 Q320 150 315 250 L285 250 Q290 150 280 90"
              fill={color.hex}
              stroke={isDark ? '#222' : '#ccc'}
              strokeWidth="1.5"
            />

            {/* Strap padding */}
            <path
              d="M100 90 Q80 150 85 250 L115 250 Q110 150 120 90"
              fill="url(#backpack-shine)"
            />
            <path
              d="M300 90 Q320 150 315 250 L285 250 Q290 150 280 90"
              fill="url(#backpack-shine)"
            />
          </>
        ) : (
          <>
            {/* Front pocket */}
            <path
              d="M100 200 Q100 170 130 170 L270 170 Q300 170 300 200 L295 350 Q200 380 105 350 Z"
              fill={isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'}
              stroke={isDark ? '#333' : '#ccc'}
              strokeWidth="1.5"
            />

            {/* Pocket zipper */}
            <path
              d="M130 170 L270 170"
              stroke={isDark ? '#555' : '#999'}
              strokeWidth="4"
            />

            {/* Zipper pull */}
            <circle cx="200" cy="170" r="6" fill={isDark ? '#666' : '#aaa'} />

            {/* Side compression straps */}
            <rect
              x="60"
              y="150"
              width="15"
              height="100"
              fill={isDark ? '#333' : '#bbb'}
              rx="3"
            />
            <rect
              x="325"
              y="150"
              width="15"
              height="100"
              fill={isDark ? '#333' : '#bbb'}
              rx="3"
            />

            {/* Strap buckles */}
            <rect x="62" y="180" width="11" height="20" fill={isDark ? '#555' : '#888'} rx="2" />
            <rect x="327" y="180" width="11" height="20" fill={isDark ? '#555' : '#888'} rx="2" />

            {/* Logo area indicator (subtle) */}
            <ellipse
              cx="200"
              cy="110"
              rx="60"
              ry="30"
              fill="none"
              stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          </>
        )}

        {/* Bottom reinforcement */}
        <path
          d="M90 390 Q200 415 310 390"
          fill="none"
          stroke={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)'}
          strokeWidth="8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

export function drawBackpackToCanvas(
  ctx: CanvasRenderingContext2D,
  color: { hex: string; textColor: 'light' | 'dark' },
  width: number,
  height: number,
  view: MockupView = 'front'
) {
  const isDark = color.textColor === 'light'
  const isBack = view === 'back'

  const scaleX = width / 340
  const scaleY = height / 420

  ctx.save()
  ctx.scale(scaleX, scaleY)
  ctx.translate(-30, -20)

  // Handle
  ctx.strokeStyle = isDark ? '#333' : '#bbb'
  ctx.lineWidth = 12
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(170, 40)
  ctx.quadraticCurveTo(200, 25, 230, 40)
  ctx.stroke()

  // Main body
  ctx.beginPath()
  ctx.moveTo(80, 60)
  ctx.quadraticCurveTo(60, 60, 60, 100)
  ctx.lineTo(70, 400)
  ctx.quadraticCurveTo(200, 430, 330, 400)
  ctx.lineTo(340, 100)
  ctx.quadraticCurveTo(340, 60, 320, 60)
  ctx.closePath()
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.strokeStyle = isDark ? '#333' : '#ddd'
  ctx.lineWidth = 2
  ctx.stroke()

  if (!isBack) {
    // Front pocket
    ctx.beginPath()
    ctx.moveTo(100, 200)
    ctx.quadraticCurveTo(100, 170, 130, 170)
    ctx.lineTo(270, 170)
    ctx.quadraticCurveTo(300, 170, 300, 200)
    ctx.lineTo(295, 350)
    ctx.quadraticCurveTo(200, 380, 105, 350)
    ctx.closePath()
    ctx.fillStyle = isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'
    ctx.fill()
    ctx.strokeStyle = isDark ? '#333' : '#ccc'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Zipper
    ctx.strokeStyle = isDark ? '#555' : '#999'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(130, 170)
    ctx.lineTo(270, 170)
    ctx.stroke()
  }

  ctx.restore()
}
