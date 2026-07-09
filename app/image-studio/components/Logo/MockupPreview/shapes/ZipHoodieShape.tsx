"use client"

/**
 * Zip Hoodie Shape Component
 *
 * SVG rendering of a zip-up hoodie with zipper detail.
 * Supports front and back views.
 */

import type { ShapeRendererProps, MockupView } from '../generic/mockup-types'

export const ZIPHOODIE_VIEWBOX = '-20 40 440 420'

export function ZipHoodieShape({ color, view = 'front', className, style }: ShapeRendererProps) {
  const isDark = color.textColor === 'light'
  const isBack = view === 'back'

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className || ''}`} style={style}>
      <svg
        viewBox={ZIPHOODIE_VIEWBOX}
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="ziphoodie-fabricSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
        </defs>

        {/* Hood */}
        <path
          d={isBack
            ? "M120 120 C120 70 160 45 200 45 C240 45 280 70 280 120"
            : "M120 120 C120 60 160 40 200 40 C240 40 280 60 280 120"
          }
          fill={color.hex}
          stroke={isDark ? '#333' : '#ddd'}
          strokeWidth="1.5"
        />

        {/* Main body */}
        <path
          d={isBack
            ? `M80 120 L30 160 L50 280 L50 440 L350 440 L350 280 L370 160 L320 120
               L280 120 C280 100 250 85 200 85 C150 85 120 100 120 120 Z`
            : `M80 120 L30 160 L50 280 L50 440 L350 440 L350 280 L370 160 L320 120
               L280 120 C280 140 250 165 200 165 C150 165 120 140 120 120 Z`
          }
          fill={color.hex}
          stroke={isDark ? '#333' : '#ddd'}
          strokeWidth="1.5"
        />

        {/* Fabric sheen */}
        <path
          d={`M80 120 L30 160 L50 280 L50 440 L350 440 L350 280 L370 160 L320 120
             L280 120 C280 140 250 165 200 165 C150 165 120 140 120 120 Z`}
          fill="url(#ziphoodie-fabricSheen)"
        />

        {isBack ? (
          <>
            {/* Back neck line */}
            <path
              d="M130 120 C130 100 160 85 200 85 C240 85 270 100 270 120"
              fill="none"
              stroke={isDark ? '#222' : '#ccc'}
              strokeWidth="2"
            />
            {/* Back seam */}
            <path
              d="M200 85 L200 440"
              stroke={isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'}
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          </>
        ) : (
          <>
            {/* Hood opening */}
            <path
              d="M140 120 C140 140 165 165 200 165 C235 165 260 140 260 120"
              fill="none"
              stroke={isDark ? '#222' : '#ccc'}
              strokeWidth="2"
            />
            {/* Zipper track */}
            <rect
              x="195"
              y="165"
              width="10"
              height="275"
              fill={isDark ? '#555' : '#aaa'}
              rx="2"
            />
            {/* Zipper teeth */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <rect
                key={i}
                x="196"
                y={175 + i * 20}
                width="8"
                height="3"
                fill={isDark ? '#777' : '#ccc'}
              />
            ))}
            {/* Zipper pull */}
            <rect
              x="193"
              y="170"
              width="14"
              height="20"
              fill={isDark ? '#666' : '#999'}
              rx="2"
            />
          </>
        )}

        {/* Kangaroo pocket */}
        {!isBack && (
          <path
            d="M100 340 Q200 380 300 340 L300 420 Q200 400 100 420 Z"
            fill="none"
            stroke={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)'}
            strokeWidth="1.5"
          />
        )}

        {/* Drawstrings */}
        {!isBack && (
          <>
            <path
              d="M170 165 L160 220"
              stroke={isDark ? '#444' : '#bbb'}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M230 165 L240 220"
              stroke={isDark ? '#444' : '#bbb'}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
    </div>
  )
}

export function drawZipHoodieToCanvas(
  ctx: CanvasRenderingContext2D,
  color: { hex: string; textColor: 'light' | 'dark' },
  width: number,
  height: number,
  view: MockupView = 'front'
) {
  const isDark = color.textColor === 'light'
  const isBack = view === 'back'

  const scaleX = width / 440
  const scaleY = height / 420

  ctx.save()
  ctx.scale(scaleX, scaleY)
  ctx.translate(20, -40)

  // Hood
  ctx.beginPath()
  ctx.moveTo(120, 120)
  if (isBack) {
    ctx.bezierCurveTo(120, 70, 160, 45, 200, 45)
    ctx.bezierCurveTo(240, 45, 280, 70, 280, 120)
  } else {
    ctx.bezierCurveTo(120, 60, 160, 40, 200, 40)
    ctx.bezierCurveTo(240, 40, 280, 60, 280, 120)
  }
  ctx.fillStyle = color.hex
  ctx.fill()

  // Body
  ctx.beginPath()
  ctx.moveTo(80, 120)
  ctx.lineTo(30, 160)
  ctx.lineTo(50, 280)
  ctx.lineTo(50, 440)
  ctx.lineTo(350, 440)
  ctx.lineTo(350, 280)
  ctx.lineTo(370, 160)
  ctx.lineTo(320, 120)
  ctx.lineTo(280, 120)
  if (isBack) {
    ctx.bezierCurveTo(280, 100, 250, 85, 200, 85)
    ctx.bezierCurveTo(150, 85, 120, 100, 120, 120)
  } else {
    ctx.bezierCurveTo(280, 140, 250, 165, 200, 165)
    ctx.bezierCurveTo(150, 165, 120, 140, 120, 120)
  }
  ctx.closePath()
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.strokeStyle = isDark ? '#333' : '#ddd'
  ctx.lineWidth = 1.5
  ctx.stroke()

  if (!isBack) {
    // Zipper
    ctx.fillStyle = isDark ? '#555' : '#aaa'
    ctx.fillRect(195, 165, 10, 275)
  }

  ctx.restore()
}
