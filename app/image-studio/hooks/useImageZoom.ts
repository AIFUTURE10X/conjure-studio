"use client"

/**
 * useImageZoom
 *
 * Reusable zoom + pan behavior for the full-screen image/logo viewers.
 * Provides button controls, scroll-wheel zoom (toward the cursor),
 * double-click toggle, drag-to-pan while zoomed, and +/-/0 keyboard
 * shortcuts. State auto-resets to fit when the viewer closes or the target
 * image changes (via `resetKey`).
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react'

const MIN_ZOOM = 1
const MAX_ZOOM = 5
const ZOOM_STEP = 0.25
const DOUBLE_CLICK_ZOOM = 2

interface Point {
  x: number
  y: number
}

interface View {
  zoom: number
  offset: Point
}

interface UseImageZoomOptions {
  /** When false (viewer closed) the zoom/pan state resets to fit. */
  isActive: boolean
  /** Re-fit whenever this value changes — e.g. the current image index. */
  resetKey?: unknown
}

export interface ZoomControlState {
  zoom: number
  canZoomIn: boolean
  canZoomOut: boolean
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
}

const FIT: View = { zoom: 1, offset: { x: 0, y: 0 } }

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

/**
 * Zoom `prev` to an absolute level, keeping `center` (px relative to the
 * container centre) fixed under the cursor when provided.
 */
function applyZoom(prev: View, target: number, center?: Point): View {
  const next = clamp(target, MIN_ZOOM, MAX_ZOOM)
  if (next === prev.zoom) return prev
  if (next <= MIN_ZOOM) return { zoom: next, offset: { x: 0, y: 0 } }
  if (!center) return { zoom: next, offset: prev.offset }

  const ratio = next / prev.zoom
  return {
    zoom: next,
    offset: {
      x: center.x - (center.x - prev.offset.x) * ratio,
      y: center.y - (center.y - prev.offset.y) * ratio,
    },
  }
}

export function useImageZoom({ isActive, resetKey }: UseImageZoomOptions) {
  const [view, setView] = useState<View>(FIT)
  const [isPanning, setIsPanning] = useState(false)
  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  // Refit when the viewer closes or the target image changes. Adjusting state
  // during render (instead of in an effect) avoids a cascading re-render.
  const [lastReset, setLastReset] = useState({ active: isActive, key: resetKey })
  if (lastReset.active !== isActive || lastReset.key !== resetKey) {
    setLastReset({ active: isActive, key: resetKey })
    setView(FIT)
    setIsPanning(false)
  }

  // Mirror the latest view so pointer handlers read it without stale closures
  // (written in an effect / read in handlers — never touched during render).
  const viewRef = useRef(view)
  useEffect(() => {
    viewRef.current = view
  }, [view])

  const dragRef = useRef<{ startX: number; startY: number; origin: Point } | null>(null)

  const centerFromEvent = useCallback(
    (clientX: number, clientY: number): Point | undefined => {
      if (!container) return undefined
      const rect = container.getBoundingClientRect()
      return {
        x: clientX - rect.left - rect.width / 2,
        y: clientY - rect.top - rect.height / 2,
      }
    },
    [container],
  )

  // Button/keyboard zoom keeps the container centre fixed, so the pan offset
  // scales proportionally and converges back to centred on zoom-out (rather
  // than holding a stale offset that pins the image to the bottom edge).
  const zoomIn = useCallback(() => setView((p) => applyZoom(p, p.zoom + ZOOM_STEP, { x: 0, y: 0 })), [])
  const zoomOut = useCallback(() => setView((p) => applyZoom(p, p.zoom - ZOOM_STEP, { x: 0, y: 0 })), [])
  const reset = useCallback(() => {
    dragRef.current = null
    setView(FIT)
    setIsPanning(false)
  }, [])

  // Wheel-to-zoom (non-passive so the page doesn't scroll underneath).
  useEffect(() => {
    if (!container || !isActive) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const factor = Math.exp(-e.deltaY * 0.0015)
      const center = centerFromEvent(e.clientX, e.clientY)
      setView((p) => applyZoom(p, p.zoom * factor, center))
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [container, isActive, centerFromEvent])

  // Keyboard: +/- to zoom, 0 to reset (only while active).
  useEffect(() => {
    if (!isActive) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        zoomIn()
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        zoomOut()
      } else if (e.key === '0') {
        e.preventDefault()
        reset()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isActive, zoomIn, zoomOut, reset])

  // Drag-to-pan while zoomed in.
  useEffect(() => {
    if (!isPanning) return

    const handleMove = (e: MouseEvent) => {
      const drag = dragRef.current
      if (!drag) return
      setView((p) => ({
        zoom: p.zoom,
        offset: {
          x: drag.origin.x + (e.clientX - drag.startX),
          y: drag.origin.y + (e.clientY - drag.startY),
        },
      }))
    }
    const handleUp = () => {
      dragRef.current = null
      setIsPanning(false)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [isPanning])

  const onMouseDown = useCallback((e: ReactMouseEvent) => {
    if (viewRef.current.zoom <= MIN_ZOOM) return
    e.preventDefault()
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origin: viewRef.current.offset,
    }
    setIsPanning(true)
  }, [])

  const onDoubleClick = useCallback(
    (e: ReactMouseEvent) => {
      const center = centerFromEvent(e.clientX, e.clientY)
      setView((p) =>
        applyZoom(p, p.zoom > MIN_ZOOM ? MIN_ZOOM : DOUBLE_CLICK_ZOOM, center),
      )
    },
    [centerFromEvent],
  )

  const isZoomed = view.zoom > MIN_ZOOM

  return {
    containerRef: setContainer,
    isZoomed,
    isPanning,
    transform: `translate3d(${view.offset.x}px, ${view.offset.y}px, 0) scale(${view.zoom})`,
    transition: isPanning ? 'none' : 'transform 0.15s ease-out',
    cursor: isZoomed ? (isPanning ? 'grabbing' : 'grab') : 'auto',
    onMouseDown,
    onDoubleClick,
    controls: {
      zoom: view.zoom,
      canZoomIn: view.zoom < MAX_ZOOM,
      canZoomOut: view.zoom > MIN_ZOOM,
      zoomIn,
      zoomOut,
      reset,
    } satisfies ZoomControlState,
  }
}
