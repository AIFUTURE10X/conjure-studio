"use client"

/**
 * Phone Case Shape Component
 *
 * SVG rendering of a smartphone case with rounded corners and camera cutout.
 */

import type { ShapeRendererProps } from '../generic/mockup-types'

export const PHONE_VIEWBOX = '0 0 250 500'

export function PhoneCaseShape({ color, className, style }: ShapeRendererProps) {
  const isDark = color.textColor === 'light'

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className || ''}`} style={style}>
      <svg
        viewBox={PHONE_VIEWBOX}
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 15px 35px rgba(0,0,0,0.5))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="phone-sheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
          <linearGradient id="phone-edge" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.3)" />
            <stop offset="50%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
          </linearGradient>
        </defs>

        {/* Phone case body */}
        <rect
          x="20"
          y="20"
          width="210"
          height="460"
          rx="35"
          ry="35"
          fill={color.hex}
          stroke={isDark ? '#222' : '#ccc'}
          strokeWidth="2"
        />

        {/* Sheen overlay */}
        <rect
          x="20"
          y="20"
          width="210"
          height="460"
          rx="35"
          ry="35"
          fill="url(#phone-sheen)"
        />

        {/* Edge shadow for 3D effect */}
        <rect
          x="20"
          y="20"
          width="210"
          height="460"
          rx="35"
          ry="35"
          fill="none"
          stroke="url(#phone-edge)"
          strokeWidth="4"
        />

        {/* Camera module area */}
        <rect
          x="130"
          y="40"
          width="80"
          height="100"
          rx="15"
          ry="15"
          fill={isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)'}
          stroke={isDark ? '#111' : '#aaa'}
          strokeWidth="1"
        />

        {/* Camera lenses */}
        <circle
          cx="155"
          cy="70"
          r="15"
          fill="#111"
          stroke={isDark ? '#333' : '#666'}
          strokeWidth="2"
        />
        <circle cx="155" cy="70" r="8" fill="#1a1a1a" />
        <circle cx="152" cy="67" r="2" fill="rgba(255,255,255,0.3)" />

        <circle
          cx="185"
          cy="70"
          r="15"
          fill="#111"
          stroke={isDark ? '#333' : '#666'}
          strokeWidth="2"
        />
        <circle cx="185" cy="70" r="8" fill="#1a1a1a" />
        <circle cx="182" cy="67" r="2" fill="rgba(255,255,255,0.3)" />

        <circle
          cx="155"
          cy="110"
          r="12"
          fill="#111"
          stroke={isDark ? '#333' : '#666'}
          strokeWidth="2"
        />
        <circle cx="155" cy="110" r="6" fill="#1a1a1a" />

        {/* Flash */}
        <circle cx="185" cy="105" r="5" fill="#fef9c3" stroke="#fde047" strokeWidth="1" />

        {/* Side button hints */}
        <rect
          x="228"
          y="120"
          width="4"
          height="40"
          rx="2"
          fill={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
        />
        <rect
          x="228"
          y="180"
          width="4"
          height="60"
          rx="2"
          fill={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
        />

        {/* Left button */}
        <rect
          x="18"
          y="140"
          width="4"
          height="30"
          rx="2"
          fill={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
        />
      </svg>
    </div>
  )
}

/**
 * Draw phone case to canvas (for export)
 */
export function drawPhoneCaseToCanvas(
  ctx: CanvasRenderingContext2D,
  color: { hex: string; textColor: 'light' | 'dark' },
  width: number,
  height: number
) {
  const isDark = color.textColor === 'light'
  const scaleX = width / 250
  const scaleY = height / 500

  ctx.save()
  ctx.scale(scaleX, scaleY)

  // Main body
  ctx.beginPath()
  ctx.roundRect(20, 20, 210, 460, 35)
  ctx.fillStyle = color.hex
  ctx.fill()
  ctx.strokeStyle = isDark ? '#222' : '#ccc'
  ctx.lineWidth = 2
  ctx.stroke()

  // Camera module
  ctx.beginPath()
  ctx.roundRect(130, 40, 80, 100, 15)
  ctx.fillStyle = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)'
  ctx.fill()

  // Camera lenses
  ctx.beginPath()
  ctx.arc(155, 70, 15, 0, Math.PI * 2)
  ctx.fillStyle = '#111'
  ctx.fill()

  ctx.beginPath()
  ctx.arc(185, 70, 15, 0, Math.PI * 2)
  ctx.fillStyle = '#111'
  ctx.fill()

  ctx.beginPath()
  ctx.arc(155, 110, 12, 0, Math.PI * 2)
  ctx.fillStyle = '#111'
  ctx.fill()

  ctx.restore()
}
