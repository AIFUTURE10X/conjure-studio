"use client"

/**
 * Position Indicators Component
 *
 * Shows crosshair lines when dragging elements (logo, brand text).
 * Displays real-time position labels at the intersection point.
 */

import type { Position } from '../generic/mockup-types'

interface PositionIndicatorsProps {
  /** Container width in pixels */
  containerWidth: number
  /** Container height in pixels */
  containerHeight: number
  /** Whether logo is being dragged */
  isDraggingLogo: boolean
  /** Logo position as percentage (0-100) */
  logoPosition: Position
  /** Whether brand text is being dragged */
  isDraggingBrand: boolean
  /** Brand text position as percentage (0-100) */
  brandPosition: Position
  /** ID of text item being dragged (if any) */
  draggingTextId?: string | null
  /** Position of text item being dragged */
  textItemPosition?: Position | null
}

export function PositionIndicators({
  containerWidth,
  containerHeight,
  isDraggingLogo,
  logoPosition,
  isDraggingBrand,
  brandPosition,
  draggingTextId,
  textItemPosition,
}: PositionIndicatorsProps) {
  // Determine what's being dragged and its position
  let activePosition: Position | null = null
  let color = '#a855f7' // Purple for logo

  if (isDraggingLogo) {
    activePosition = logoPosition
    color = '#a855f7' // Purple for logo
  } else if (isDraggingBrand && !draggingTextId) {
    activePosition = brandPosition
    color = '#22c55e' // Green for brand text
  } else if (isDraggingBrand && draggingTextId && textItemPosition) {
    activePosition = textItemPosition
    color = '#3b82f6' // Blue for text items
  }

  // Don't render if nothing is being dragged
  if (!activePosition) return null

  const x = (activePosition.x / 100) * containerWidth
  const y = (activePosition.y / 100) * containerHeight

  return (
    <div className="absolute top-4 left-4 right-0 bottom-0 pointer-events-none z-20">
      {/* Vertical crosshair line */}
      <div
        className="absolute top-0 bottom-0"
        style={{
          left: x,
          width: 1,
          background: `repeating-linear-gradient(
            to bottom,
            ${color} 0px,
            ${color} 4px,
            transparent 4px,
            transparent 8px
          )`,
        }}
      />

      {/* Horizontal crosshair line */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: y,
          height: 1,
          background: `repeating-linear-gradient(
            to right,
            ${color} 0px,
            ${color} 4px,
            transparent 4px,
            transparent 8px
          )`,
        }}
      />

      {/* Position label at intersection */}
      <div
        className="absolute px-2 py-1 rounded text-xs font-medium"
        style={{
          left: x + 8,
          top: y + 8,
          backgroundColor: color,
          color: '#ffffff',
          whiteSpace: 'nowrap',
        }}
      >
        X: {activePosition.x.toFixed(1)}% | Y: {activePosition.y.toFixed(1)}%
      </div>

      {/* Small dot at intersection */}
      <div
        className="absolute rounded-full"
        style={{
          left: x - 3,
          top: y - 3,
          width: 6,
          height: 6,
          backgroundColor: color,
          boxShadow: `0 0 0 2px rgba(0,0,0,0.3)`,
        }}
      />
    </div>
  )
}
