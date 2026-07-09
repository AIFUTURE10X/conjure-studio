"use client"

/**
 * Sticker Pack Shape Component
 *
 * SVG rendering of a sticker sheet with multiple sticker shapes.
 */

import type { ShapeRendererProps, MockupView } from '../generic/mockup-types'

export const STICKERPACK_VIEWBOX = '0 0 320 400'

export function StickerPackShape({ color, view = 'front', className, style }: ShapeRendererProps) {
  const isDark = color.textColor === 'light'

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className || ''}`} style={style}>
      <svg
        viewBox={STICKERPACK_VIEWBOX}
        className="w-full h-full drop-shadow-xl"
        style={{ filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.3))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="sticker-gloss" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Backing sheet */}
        <rect
          x="20"
          y="20"
          width="280"
          height="360"
          fill={color.hex}
          stroke={isDark ? '#333' : '#ddd'}
          strokeWidth="2"
          rx="8"
        />

        {/* Grid pattern on backing */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={`h${i}`}
            x1="20"
            y1={90 + i * 70}
            x2="300"
            y2={90 + i * 70}
            stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            strokeWidth="0.5"
            strokeDasharray="5,5"
          />
        ))}
        {[0, 1, 2].map((i) => (
          <line
            key={`v${i}`}
            x1={110 + i * 100}
            y1="20"
            x2={110 + i * 100}
            y2="380"
            stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            strokeWidth="0.5"
            strokeDasharray="5,5"
          />
        ))}

        {/* Sticker 1 - Circle */}
        <circle
          cx="75"
          cy="75"
          r="35"
          fill="white"
          stroke="#e5e5e5"
          strokeWidth="1"
        />
        <circle cx="75" cy="75" r="35" fill="url(#sticker-gloss)" />

        {/* Sticker 2 - Rounded square */}
        <rect
          x="130"
          y="40"
          width="70"
          height="70"
          fill="white"
          stroke="#e5e5e5"
          strokeWidth="1"
          rx="10"
        />
        <rect x="130" y="40" width="70" height="70" fill="url(#sticker-gloss)" rx="10" />

        {/* Sticker 3 - Star shape */}
        <path
          d="M260 45 L270 75 L300 75 L275 95 L285 125 L260 105 L235 125 L245 95 L220 75 L250 75 Z"
          fill="white"
          stroke="#e5e5e5"
          strokeWidth="1"
        />
        <path d="M260 45 L270 75 L300 75 L275 95 L285 125 L260 105 L235 125 L245 95 L220 75 L250 75 Z" fill="url(#sticker-gloss)" />

        {/* Sticker 4 - Oval */}
        <ellipse
          cx="75"
          cy="175"
          rx="45"
          ry="30"
          fill="white"
          stroke="#e5e5e5"
          strokeWidth="1"
        />
        <ellipse cx="75" cy="175" rx="45" ry="30" fill="url(#sticker-gloss)" />

        {/* Sticker 5 - Large rectangle */}
        <rect
          x="140"
          y="140"
          width="140"
          height="70"
          fill="white"
          stroke="#e5e5e5"
          strokeWidth="1"
          rx="8"
        />
        <rect x="140" y="140" width="140" height="70" fill="url(#sticker-gloss)" rx="8" />

        {/* Sticker 6 - Heart shape */}
        <path
          d="M75 250 C50 225 30 260 75 300 C120 260 100 225 75 250"
          fill="white"
          stroke="#e5e5e5"
          strokeWidth="1"
        />
        <path d="M75 250 C50 225 30 260 75 300 C120 260 100 225 75 250" fill="url(#sticker-gloss)" />

        {/* Sticker 7 - Rounded rectangle */}
        <rect
          x="140"
          y="235"
          width="140"
          height="55"
          fill="white"
          stroke="#e5e5e5"
          strokeWidth="1"
          rx="25"
        />
        <rect x="140" y="235" width="140" height="55" fill="url(#sticker-gloss)" rx="25" />

        {/* Sticker 8 - Badge */}
        <circle
          cx="75"
          cy="350"
          r="30"
          fill="white"
          stroke="#e5e5e5"
          strokeWidth="1"
        />
        <circle cx="75" cy="350" r="30" fill="url(#sticker-gloss)" />

        {/* Sticker 9 - Rectangle */}
        <rect
          x="140"
          y="315"
          width="140"
          height="55"
          fill="white"
          stroke="#e5e5e5"
          strokeWidth="1"
          rx="6"
        />
        <rect x="140" y="315" width="140" height="55" fill="url(#sticker-gloss)" rx="6" />

        {/* Sheet edge highlight */}
        <rect
          x="20"
          y="20"
          width="280"
          height="360"
          fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
          strokeWidth="1"
          rx="8"
        />
      </svg>
    </div>
  )
}

export function drawStickerPackToCanvas(
  ctx: CanvasRenderingContext2D,
  color: { hex: string; textColor: 'light' | 'dark' },
  width: number,
  height: number,
  view: MockupView = 'front'
) {
  const isDark = color.textColor === 'light'

  const scaleX = width / 320
  const scaleY = height / 400

  ctx.save()
  ctx.scale(scaleX, scaleY)

  // Backing sheet
  ctx.fillStyle = color.hex
  ctx.beginPath()
  ctx.roundRect(20, 20, 280, 360, 8)
  ctx.fill()
  ctx.strokeStyle = isDark ? '#333' : '#ddd'
  ctx.lineWidth = 2
  ctx.stroke()

  // Sticker backgrounds (simplified for canvas)
  ctx.fillStyle = 'white'
  ctx.strokeStyle = '#e5e5e5'
  ctx.lineWidth = 1

  // Circle sticker
  ctx.beginPath()
  ctx.arc(75, 75, 35, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Square sticker
  ctx.beginPath()
  ctx.roundRect(130, 40, 70, 70, 10)
  ctx.fill()
  ctx.stroke()

  // Large rectangle
  ctx.beginPath()
  ctx.roundRect(140, 140, 140, 70, 8)
  ctx.fill()
  ctx.stroke()

  // Oval sticker
  ctx.beginPath()
  ctx.ellipse(75, 175, 45, 30, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Bottom stickers
  ctx.beginPath()
  ctx.roundRect(140, 235, 140, 55, 25)
  ctx.fill()
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(75, 350, 30, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.beginPath()
  ctx.roundRect(140, 315, 140, 55, 6)
  ctx.fill()
  ctx.stroke()

  ctx.restore()
}
