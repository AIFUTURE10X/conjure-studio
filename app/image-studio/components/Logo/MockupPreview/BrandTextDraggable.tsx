"use client"

/**
 * Draggable Brand Text Component
 * Handles brand name positioning, display, effects, rotation, and resizing on the mockup
 * Includes visible drag handle for repositioning and corner handles for resizing
 */

import { useCallback } from 'react'
import { GripVertical } from 'lucide-react'
import { REAL_FONTS } from '@/app/image-studio/constants/real-fonts'
import { getTextEffectStyle, type TextEffect } from './text-effects-config'

interface BrandTextDraggableProps {
  text: string
  font: string
  color: string
  position: { x: number; y: number }
  scale: number
  scaleX?: number  // Independent width scale
  scaleY?: number  // Independent height scale
  weight?: number
  effect?: TextEffect
  rotation?: number
  isDragging: boolean
  isVisible: boolean
  isSelected?: boolean
  id?: string
  onDragStart: (e: React.MouseEvent | React.TouchEvent, id?: string) => void
  onResize?: (scaleX: number, scaleY: number) => void
  onClick?: () => void
}

export function BrandTextDraggable({
  text,
  font,
  color,
  position,
  scale,
  scaleX,
  scaleY,
  weight = 400,
  effect = 'none',
  rotation = 0,
  isDragging,
  isVisible,
  isSelected = false,
  id,
  onDragStart,
  onResize,
  onClick,
}: BrandTextDraggableProps) {
  // Use scaleX/scaleY if provided, otherwise fall back to uniform scale
  const effectiveScaleX = scaleX ?? scale
  const effectiveScaleY = scaleY ?? scale

  const handleResizeStart = useCallback((corner: string) => (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    const startX = e.clientX
    const startY = e.clientY
    const startScaleX = effectiveScaleX
    const startScaleY = effectiveScaleY

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY

      let newScaleX = startScaleX
      let newScaleY = startScaleY

      // Adjust scale based on which corner is being dragged
      if (corner.includes('right')) {
        newScaleX = Math.max(0.5, Math.min(8, startScaleX + deltaX * 0.01))
      }
      if (corner.includes('left')) {
        newScaleX = Math.max(0.5, Math.min(8, startScaleX - deltaX * 0.01))
      }
      if (corner.includes('bottom')) {
        newScaleY = Math.max(0.5, Math.min(8, startScaleY + deltaY * 0.01))
      }
      if (corner.includes('top')) {
        newScaleY = Math.max(0.5, Math.min(8, startScaleY - deltaY * 0.01))
      }

      onResize?.(newScaleX, newScaleY)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [effectiveScaleX, effectiveScaleY, onResize])

  if (!isVisible || !text) return null

  const effectStyle = getTextEffectStyle(effect, color)

  // Handle styles for resize corners
  const handleBaseClass = "absolute w-2 h-2 bg-white border-2 border-purple-500 rounded-sm z-30 opacity-0 group-hover:opacity-100 transition-opacity"
  const handleSelectedClass = isSelected ? "!opacity-100" : ""

  return (
    <div
      data-draggable="text"
      className={`absolute cursor-move transition-transform select-none group ${isDragging ? 'opacity-90' : ''} ${isSelected ? 'ring-2 ring-purple-500 ring-offset-1 ring-offset-transparent rounded' : ''}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) scaleX(${effectiveScaleX}) scaleY(${effectiveScaleY}) rotate(${rotation}deg)`,
        zIndex: isSelected ? 20 : 10,
      }}
      onMouseDown={(e) => onDragStart(e, id)}
      onTouchStart={(e) => onDragStart(e, id)}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
    >
      {/* Drag Handle - visible on hover or when selected */}
      <div
        className={`absolute -left-5 top-1/2 -translate-y-1/2 p-0.5 rounded bg-purple-500/80 text-white transition-opacity ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'
        }`}
        style={{ transform: `scaleX(${1/effectiveScaleX}) scaleY(${1/effectiveScaleY})` }}
      >
        <GripVertical className="w-3 h-3" />
      </div>

      {/* Corner Resize Handles */}
      {onResize && (
        <>
          {/* Top-Left */}
          <div
            className={`${handleBaseClass} ${handleSelectedClass} -top-1 -left-1 cursor-nwse-resize`}
            style={{ transform: `scaleX(${1/effectiveScaleX}) scaleY(${1/effectiveScaleY})` }}
            onMouseDown={handleResizeStart('top-left')}
          />
          {/* Top-Right */}
          <div
            className={`${handleBaseClass} ${handleSelectedClass} -top-1 -right-1 cursor-nesw-resize`}
            style={{ transform: `scaleX(${1/effectiveScaleX}) scaleY(${1/effectiveScaleY})` }}
            onMouseDown={handleResizeStart('top-right')}
          />
          {/* Bottom-Left */}
          <div
            className={`${handleBaseClass} ${handleSelectedClass} -bottom-1 -left-1 cursor-nesw-resize`}
            style={{ transform: `scaleX(${1/effectiveScaleX}) scaleY(${1/effectiveScaleY})` }}
            onMouseDown={handleResizeStart('bottom-left')}
          />
          {/* Bottom-Right */}
          <div
            className={`${handleBaseClass} ${handleSelectedClass} -bottom-1 -right-1 cursor-nwse-resize`}
            style={{ transform: `scaleX(${1/effectiveScaleX}) scaleY(${1/effectiveScaleY})` }}
            onMouseDown={handleResizeStart('bottom-right')}
          />
        </>
      )}

      <span
        className="text-[10px] tracking-[0.2em] uppercase whitespace-nowrap px-1"
        style={{
          fontFamily: REAL_FONTS[font]?.family || 'sans-serif',
          fontWeight: weight,
          color: color,
          ...effectStyle,
        }}
      >
        {text}
      </span>
    </div>
  )
}
