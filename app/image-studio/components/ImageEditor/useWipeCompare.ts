"use client"

/**
 * useWipeCompare
 *
 * Drag state for EditCompareView's before/after wipe: `position` (0-100)
 * is the divider's horizontal percentage, clipping the After image so
 * Before shows through to its left. Pressing anywhere in the container
 * that isn't the divider itself is a "hold to peek" gesture — it reports
 * `isHolding` so the caller can clip the After image away entirely for as
 * long as the pointer stays down, without moving the saved divider
 * position.
 *
 * Takes the container ref as a parameter (owned by the caller) rather than
 * creating and returning one — spreading a ref inside a plain object
 * return value defeats the react-hooks lint's ref-safety analysis for
 * every other property on that object.
 */

import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'

export interface UseWipeCompareReturn {
  position: number
  isHolding: boolean
  onDividerPointerDown: (e: ReactPointerEvent) => void
  onDividerPointerUp: (e: ReactPointerEvent) => void
  onContainerPointerDown: () => void
  onContainerPointerMove: (e: ReactPointerEvent) => void
  onContainerPointerUp: () => void
}

const DEFAULT_POSITION = 50

export function useWipeCompare(
  containerRef: RefObject<HTMLDivElement | null>,
  initialPosition: number = DEFAULT_POSITION,
): UseWipeCompareReturn {
  const [position, setPosition] = useState(initialPosition)
  const [isHolding, setIsHolding] = useState(false)
  const draggingRef = useRef(false)

  const updateFromClientX = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return
    const pct = ((clientX - rect.left) / rect.width) * 100
    setPosition(Math.min(100, Math.max(0, pct)))
  }, [containerRef])

  const onDividerPointerDown = useCallback((e: ReactPointerEvent) => {
    e.stopPropagation()
    draggingRef.current = true
    // Without capture, a fast drag past the container's edge stops
    // delivering pointermove events (the pointer is no longer over any
    // listening element), so the divider "drops" the drag instead of
    // reaching 0%/100%.
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onDividerPointerUp = useCallback((e: ReactPointerEvent) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }, [])

  const onContainerPointerDown = useCallback(() => {
    setIsHolding(true)
  }, [])

  const onContainerPointerMove = useCallback((e: ReactPointerEvent) => {
    if (draggingRef.current) updateFromClientX(e.clientX)
  }, [updateFromClientX])

  const onContainerPointerUp = useCallback(() => {
    draggingRef.current = false
    setIsHolding(false)
  }, [])

  return {
    position,
    isHolding,
    onDividerPointerDown,
    onDividerPointerUp,
    onContainerPointerDown,
    onContainerPointerMove,
    onContainerPointerUp,
  }
}
