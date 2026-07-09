"use client"

/**
 * useStageDrag
 *
 * Pointer interaction for thumbnail layers. Dragging converts screen movement
 * into percentage coordinates relative to the (scaled) stage, preserving the
 * grab offset and clamping to bounds. Resizing (subject handle) maps the
 * pointer's distance from the layer center to a width percentage.
 */

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Snap targets (percent of stage): edges, thirds, and center. */
const SNAP_TARGETS = [6, 33.333, 50, 66.667, 94]
const SNAP_THRESHOLD = 1.5

function snap(value: number): { value: number; guide: number | null } {
  for (const target of SNAP_TARGETS) {
    if (Math.abs(value - target) <= SNAP_THRESHOLD) return { value: target, guide: target }
  }
  return { value, guide: null }
}

export interface SnapGuides {
  x: number | null
  y: number | null
}

interface DragData {
  pointerX: number
  pointerY: number
  startX: number
  startY: number
  width: number
  height: number
  onMove: (x: number, y: number) => void
}

interface ResizeData {
  /** Stage width in screen px (handles the visual scale transform). */
  stageWidth: number
  /** Layer center X in absolute client px. */
  centerX: number
  min: number
  max: number
  onResize: (scale: number) => void
}

type Mode = 'drag' | 'resize' | null

export function useStageDrag(stageRef: RefObject<HTMLDivElement | null>) {
  const [mode, setMode] = useState<Mode>(null)
  const [guides, setGuides] = useState<SnapGuides>({ x: null, y: null })
  const drag = useRef<DragData | null>(null)
  const resize = useRef<ResizeData | null>(null)

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
      setMode('drag')
    },
    [stageRef],
  )

  const startResize = useCallback(
    (
      e: ReactPointerEvent,
      center: { x: number; y: number },
      onResize: (scale: number) => void,
      bounds: { min: number; max: number } = { min: 15, max: 90 },
    ) => {
      const rect = stageRef.current?.getBoundingClientRect()
      if (!rect) return
      e.preventDefault()
      e.stopPropagation()
      resize.current = {
        stageWidth: rect.width,
        centerX: rect.left + (center.x / 100) * rect.width,
        min: bounds.min,
        max: bounds.max,
        onResize,
      }
      setMode('resize')
    },
    [stageRef],
  )

  useEffect(() => {
    if (!mode) return

    const handleMove = (e: globalThis.PointerEvent) => {
      if (mode === 'drag') {
        const d = drag.current
        if (!d) return
        const dx = ((e.clientX - d.pointerX) / d.width) * 100
        const dy = ((e.clientY - d.pointerY) / d.height) * 100
        let nx = clamp(d.startX + dx, 0, 100)
        let ny = clamp(d.startY + dy, 0, 100)
        // Snap to center / thirds / edges, unless Ctrl/Cmd bypasses it.
        if (e.ctrlKey || e.metaKey) {
          setGuides({ x: null, y: null })
        } else {
          const sx = snap(nx)
          const sy = snap(ny)
          nx = sx.value
          ny = sy.value
          setGuides({ x: sx.guide, y: sy.guide })
        }
        d.onMove(nx, ny)
      } else {
        const r = resize.current
        if (!r) return
        const halfWidth = Math.abs(e.clientX - r.centerX)
        const scale = (2 * halfWidth) / r.stageWidth * 100
        r.onResize(clamp(scale, r.min, r.max))
      }
    }
    const handleUp = () => {
      drag.current = null
      resize.current = null
      setMode(null)
      setGuides({ x: null, y: null })
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [mode])

  return { startDrag, startResize, isDragging: mode === 'drag', isResizing: mode === 'resize', guides }
}
