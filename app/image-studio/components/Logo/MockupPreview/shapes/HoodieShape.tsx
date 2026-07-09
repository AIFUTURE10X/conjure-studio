"use client"

/**
 * Hoodie Shape Component
 *
 * SVG rendering of a hoodie with hood, kangaroo pocket, and drawstrings.
 * Supports front and back views.
 * Canvas export extracted to hoodie-canvas.ts
 */

import type { ShapeRendererProps } from '../generic/mockup-types'

// Re-export canvas drawing function for backward compatibility
export { drawHoodieToCanvas } from './hoodie-canvas'

export const HOODIE_VIEWBOX = '0 80 400 400'

/**
 * SVG path definitions for Hoodie shape
 */
export const HOODIE_PATHS = {
  // Body - front view with deep neckline
  body: `M60 130
    L20 180 L50 220 L50 460
    L350 460 L350 220 L380 180 L340 130
    L280 130
    C280 160 245 185 200 185
    C155 185 120 160 120 130
    Z`,
  // Body - back view with shallower neck
  bodyBack: `M60 130
    L20 180 L50 220 L50 460
    L350 460 L350 220 L380 180 L340 130
    L280 130
    C280 145 245 155 200 155
    C155 155 120 145 120 130
    Z`,
  // Front neckline
  neckline: 'M120 130 C120 160 155 185 200 185 C245 185 280 160 280 130',
  // Back neckline (shallower)
  necklineBack: 'M120 130 C120 145 155 155 200 155 C245 155 280 145 280 130',
  // Front center seam
  centerSeam: 'M200 185 L200 460',
  // Back center seam (from shallower neckline)
  backSeam: 'M200 155 L200 460',
  // Kangaroo pocket
  pocket: `M100 340
    Q100 370 130 370
    L270 370
    Q300 370 300 340
    L300 320
    Q300 300 270 300
    L130 300
    Q100 300 100 320
    Z`,
  pocketDivider: 'M200 300 L200 370',
  // Drawstrings
  leftDrawstring: 'M170 185 L165 240',
  rightDrawstring: 'M230 185 L235 240',
  // Sleeve seams
  leftSleeve: 'M50 220 L60 130',
  rightSleeve: 'M350 220 L340 130',
  // Cuff ribbing
  leftCuff: 'M50 455 L50 460 L100 460',
  rightCuff: 'M350 455 L350 460 L300 460',
}

export function HoodieShape({ color, view = 'front', className, style }: ShapeRendererProps) {
  const isDark = color.textColor === 'light'
  const isBack = view === 'back'

  return (
    <div className={`absolute inset-0 flex items-start justify-center ${className || ''}`} style={style}>
      <svg
        viewBox={HOODIE_VIEWBOX}
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}
        preserveAspectRatio="xMidYMin meet"
      >
        <defs>
          <linearGradient id="hoodie-fabricSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.08)" />
          </linearGradient>
        </defs>

        {/* Hood - behind the body */}
        <ellipse
          cx="200"
          cy="95"
          rx="85"
          ry="45"
          fill={color.hex}
          stroke={isDark ? '#222' : '#ccc'}
          strokeWidth="1.5"
        />

        {/* Main body with sleeves */}
        <path
          d={isBack ? HOODIE_PATHS.bodyBack : HOODIE_PATHS.body}
          fill={color.hex}
          stroke={isDark ? '#333' : '#ddd'}
          strokeWidth="1.5"
        />

        {/* Fabric sheen overlay */}
        <path
          d={isBack ? HOODIE_PATHS.bodyBack : HOODIE_PATHS.body}
          fill="url(#hoodie-fabricSheen)"
        />

        {/* Hood inner shadow (front only - back shows hood exterior) */}
        {!isBack && (
          <ellipse
            cx="200"
            cy="100"
            rx="70"
            ry="35"
            fill="none"
            stroke={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.15)'}
            strokeWidth="1"
          />
        )}

        {isBack ? (
          <>
            {/* Back view: neckline */}
            <path
              d={HOODIE_PATHS.necklineBack}
              fill="none"
              stroke={isDark ? '#222' : '#bbb'}
              strokeWidth="2"
            />
            {/* Back view: center seam (dashed) */}
            <path
              d={HOODIE_PATHS.backSeam}
              stroke={isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'}
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            {/* Hood center seam on back */}
            <path
              d="M200 95 L200 155"
              stroke={isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'}
              strokeWidth="1"
              strokeDasharray="3,3"
            />
          </>
        ) : (
          <>
            {/* Front view: neckline opening */}
            <path
              d={HOODIE_PATHS.neckline}
              fill="none"
              stroke={isDark ? '#222' : '#bbb'}
              strokeWidth="2"
            />
            {/* Front view: center zipper/seam line */}
            <path
              d={HOODIE_PATHS.centerSeam}
              stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
              strokeWidth="1"
            />
            {/* Kangaroo pocket (front only) */}
            <path
              d={HOODIE_PATHS.pocket}
              fill="none"
              stroke={isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.15)'}
              strokeWidth="1.5"
            />
            {/* Pocket center divider */}
            <path
              d={HOODIE_PATHS.pocketDivider}
              stroke={isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'}
              strokeWidth="1"
            />
            {/* Drawstrings (front only) */}
            <path
              d={HOODIE_PATHS.leftDrawstring}
              stroke={isDark ? '#444' : '#aaa'}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d={HOODIE_PATHS.rightDrawstring}
              stroke={isDark ? '#444' : '#aaa'}
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Drawstring tips */}
            <circle cx="165" cy="245" r="4" fill={isDark ? '#333' : '#999'} />
            <circle cx="235" cy="245" r="4" fill={isDark ? '#333' : '#999'} />
          </>
        )}

        {/* Sleeve seam lines (both views) */}
        <path
          d={HOODIE_PATHS.leftSleeve}
          stroke={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'}
          strokeWidth="1"
        />
        <path
          d={HOODIE_PATHS.rightSleeve}
          stroke={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'}
          strokeWidth="1"
        />

        {/* Cuff ribbing hint (both views) */}
        <path
          d={HOODIE_PATHS.leftCuff}
          stroke={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'}
          strokeWidth="1"
        />
        <path
          d={HOODIE_PATHS.rightCuff}
          stroke={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'}
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}
