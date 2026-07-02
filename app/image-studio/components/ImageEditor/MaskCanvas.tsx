"use client"

/**
 * MaskCanvas
 *
 * Stacked canvases for AI Edit: a display canvas with the source image
 * drawn onto it, and a transparent overlay canvas that captures pointer
 * input and shows the live paint mask. Exposes the loaded image and the
 * overlay canvas via ref so the parent can build natural-resolution blobs
 * without duplicating the image-loading logic.
 */

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { MaskPoint, MaskTool } from './useMaskPainting'

const MAX_DISPLAY_WIDTH = 860
const MAX_DISPLAY_HEIGHT_RATIO = 0.6

export interface MaskDims {
  w: number
  h: number
  nw: number
  nh: number
}

export interface MaskCanvasHandle {
  getImage: () => HTMLImageElement | null
  getOverlayCanvas: () => HTMLCanvasElement | null
  getDims: () => MaskDims | null
}

interface MaskCanvasProps {
  imageUrl: string
  tool: MaskTool
  brushSize: number
  onStartStroke: (point: MaskPoint, tool: MaskTool, size: number) => void
  onExtendStroke: (point: MaskPoint) => void
  onEndStroke: () => void
  redraw: (canvas: HTMLCanvasElement) => void
  onClose: () => void
  /**
   * Vertical pixels the host modal's chrome (header, toolbar, padding)
   * occupies inside its 92vh shell. When set, the canvas sizes itself to the
   * space that actually remains, so tall images can't overlap the controls.
   */
  reservedPx?: number
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image load failed'))
    img.src = url
  })
}

export const MaskCanvas = forwardRef<MaskCanvasHandle, MaskCanvasProps>(function MaskCanvas(
  { imageUrl, tool, brushSize, onStartStroke, onExtendStroke, onEndStroke, redraw, onClose, reservedPx },
  ref,
) {
  const imgRef = useRef<HTMLImageElement | null>(null)
  const displayRef = useRef<HTMLCanvasElement | null>(null)
  const overlayRef = useRef<HTMLCanvasElement | null>(null)
  const painting = useRef(false)
  const [dims, setDims] = useState<MaskDims | null>(null)

  useImperativeHandle(ref, () => ({
    getImage: () => imgRef.current,
    getOverlayCanvas: () => overlayRef.current,
    getDims: () => dims,
  }), [dims])

  useEffect(() => {
    let cancelled = false
    setDims(null)
    ;(async () => {
      try {
        const img = await loadImage(imageUrl)
        if (cancelled) return
        imgRef.current = img
        const nw = img.naturalWidth || 1024
        const nh = img.naturalHeight || 1024
        const maxHeight =
          reservedPx != null
            ? Math.max(240, window.innerHeight * 0.92 - reservedPx)
            : window.innerHeight * MAX_DISPLAY_HEIGHT_RATIO
        const scale = Math.min(1, MAX_DISPLAY_WIDTH / nw, maxHeight / nh)
        setDims({ w: Math.round(nw * scale), h: Math.round(nh * scale), nw, nh })
      } catch {
        toast.error('Could not load the image to edit')
        onClose()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [imageUrl, onClose, reservedPx])

  useEffect(() => {
    if (!dims || !imgRef.current) return
    displayRef.current?.getContext('2d')?.drawImage(imgRef.current, 0, 0, dims.w, dims.h)
  }, [dims])

  useEffect(() => {
    if (!overlayRef.current) return
    redraw(overlayRef.current)
  }, [redraw, dims])

  const pointFromEvent = (e: ReactPointerEvent<HTMLCanvasElement>): MaskPoint => {
    const rect = overlayRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    painting.current = true
    onStartStroke(pointFromEvent(e), tool, brushSize)
    if (overlayRef.current) redraw(overlayRef.current)
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!painting.current) return
    onExtendStroke(pointFromEvent(e))
    if (overlayRef.current) redraw(overlayRef.current)
  }

  const handlePointerUp = () => {
    if (!painting.current) return
    painting.current = false
    onEndStroke()
  }

  if (!dims) {
    return (
      <div className="flex h-64 items-center justify-center text-zinc-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative touch-none" style={{ width: dims.w, height: dims.h }}>
      <canvas
        ref={displayRef}
        width={dims.w}
        height={dims.h}
        className="absolute inset-0 rounded-md border border-zinc-800"
      />
      <canvas
        ref={overlayRef}
        width={dims.w}
        height={dims.h}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="absolute inset-0 touch-none cursor-crosshair rounded-md"
      />
    </div>
  )
})
