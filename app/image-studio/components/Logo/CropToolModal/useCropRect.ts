"use client"

import { useCallback, useRef, useState, type RefObject } from 'react'
import {
  FULL_RECT,
  centeredAspectRect,
  drawRect,
  moveRect,
  resizeRectFree,
  resizeRectLocked,
  toFractionAspect,
  type CropHandle,
  type CropRect,
} from './crop-math'

type DragState =
  | { kind: 'move'; offX: number; offY: number }
  | { kind: 'resize'; handle: CropHandle }
  | { kind: 'draw'; originX: number; originY: number }

/**
 * Pointer interaction state for the crop overlay. The rect lives in image
 * fractions; `boundsRef` must point at the element the image fills exactly.
 */
export function useCropRect(boundsRef: RefObject<HTMLElement | null>, imageAspect: number | null) {
  const [rect, setRect] = useState<CropRect>(FULL_RECT)
  const [pixelAspect, setPixelAspect] = useState<number | null>(null)
  const dragRef = useRef<DragState | null>(null)

  const fracAspect = pixelAspect !== null && imageAspect ? toFractionAspect(pixelAspect, imageAspect) : null

  const toFraction = useCallback(
    (event: React.PointerEvent) => {
      const bounds = boundsRef.current?.getBoundingClientRect()
      if (!bounds || bounds.width === 0 || bounds.height === 0) return null
      return {
        x: (event.clientX - bounds.left) / bounds.width,
        y: (event.clientY - bounds.top) / bounds.height,
      }
    },
    [boundsRef]
  )

  const capture = useCallback(
    (event: React.PointerEvent) => {
      try {
        boundsRef.current?.setPointerCapture?.(event.pointerId)
      } catch {
        // Capture is a nicety (keeps the drag alive outside the overlay); a
        // stale pointer id must not abort the drag itself.
      }
    },
    [boundsRef]
  )

  const startMove = useCallback(
    (event: React.PointerEvent) => {
      const point = toFraction(event)
      if (!point) return
      event.stopPropagation()
      capture(event)
      dragRef.current = { kind: 'move', offX: point.x - rect.x, offY: point.y - rect.y }
    },
    [rect, toFraction, capture]
  )

  const startResize = useCallback(
    (handle: CropHandle) => (event: React.PointerEvent) => {
      event.stopPropagation()
      capture(event)
      dragRef.current = { kind: 'resize', handle }
    },
    [capture]
  )

  const startDraw = useCallback(
    (event: React.PointerEvent) => {
      const point = toFraction(event)
      if (!point) return
      capture(event)
      dragRef.current = { kind: 'draw', originX: point.x, originY: point.y }
    },
    [toFraction, capture]
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      const drag = dragRef.current
      const point = drag && toFraction(event)
      if (!drag || !point) return
      if (drag.kind === 'move') {
        setRect((current) => moveRect(current, point.x - drag.offX, point.y - drag.offY))
        return
      }
      if (drag.kind === 'draw') {
        setRect(drawRect(drag.originX, drag.originY, point.x, point.y, fracAspect))
        return
      }
      setRect((current) =>
        fracAspect !== null && drag.handle.length === 2
          ? resizeRectLocked(current, drag.handle as 'nw' | 'ne' | 'se' | 'sw', point.x, point.y, fracAspect)
          : resizeRectFree(current, drag.handle, point.x, point.y)
      )
    },
    [fracAspect, toFraction]
  )

  const endDrag = useCallback(() => {
    dragRef.current = null
  }, [])

  /** Select an aspect preset (pixel w/h, or null for free) and refit the rect. */
  const applyAspect = useCallback(
    (aspect: number | null) => {
      setPixelAspect(aspect)
      if (aspect !== null && imageAspect) {
        setRect(centeredAspectRect(toFractionAspect(aspect, imageAspect)))
      }
    },
    [imageAspect]
  )

  const reset = useCallback(() => {
    setRect(FULL_RECT)
    setPixelAspect(null)
  }, [])

  return { rect, pixelAspect, applyAspect, reset, startMove, startResize, startDraw, handlePointerMove, endDrag }
}
