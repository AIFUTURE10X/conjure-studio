"use client"

/**
 * useStageDrag
 *
 * Pointer dragging for thumbnail layers. Converts screen movement into
 * percentage coordinates relative to the (scaled) stage element, preserving
 * the grab offset, and clamps to the stage bounds.
 */

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

interface DragState {
  pointerX: number
  pointerY: number
  startX: number
  startY: number
  width: number
  height: number
  onMove: (x: number, y: number) => void
}

export function useStageDrag(stageRef: RefObject<HTMLDivElement | null>) {
  const [isDragging, setIsDragging] = useState(false)
  const drag = useRef<DragState | null>(null)

  const startDrag = useCallback(
    (e: ReactPointerEvent, pos: { x: number; y: number }, onMove: (x: number, y: number) => void) => {
      const rect = stageRef.current?.getBoundingClientRect()
      if (!rect) return
      e.preventDefault()
      e.stopPropagation()
      drag.current = {
        pointerX: e.clientX,
        pointerY: e.clientY,
        startX: pos.x,
        startY: pos.y,
        width: rect.width,
        height: rect.height,
        onMove,
      }
      setIsDragging(true)
    },
    [stageRef],
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMove = (e: globalThis.PointerEvent) => {
      const d = drag.current
      if (!d) return
      const dx = ((e.clientX - d.pointerX) / d.width) * 100
      const dy = ((e.clientY - d.pointerY) / d.height) * 100
      d.onMove(clamp(d.startX + dx, 0, 100), clamp(d.startY + dy, 0, 100))
    }
    const handleUp = () => {
      drag.current = null
      setIsDragging(false)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [isDragging])

  return { startDrag, isDragging }
}
