"use client"

/**
 * useMaskPainting
 *
 * Owns the paint-mask model for ImageEditModal. Strokes are recorded as
 * vector data (tool + size + points) instead of being baked straight into
 * a canvas, so undo/clear can fully replay history rather than trying to
 * reverse a destination-out composite. redraw() replays the whole stroke
 * list onto whatever canvas the caller passes in — the live overlay while
 * painting, or an offscreen canvas when building the final mask.
 */

import { useCallback, useRef, useState } from 'react'

export type MaskTool = 'brush' | 'eraser'

export interface MaskPoint {
  x: number
  y: number
}

export interface MaskStroke {
  tool: MaskTool
  size: number
  points: MaskPoint[]
}

const BRUSH_COLOR = 'rgba(255,60,60,0.55)'

function drawStroke(ctx: CanvasRenderingContext2D, stroke: MaskStroke, color = BRUSH_COLOR) {
  if (stroke.points.length === 0) return
  ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over'
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = stroke.size

  if (stroke.points.length === 1) {
    // A tap with no drag still paints a dot.
    const [{ x, y }] = stroke.points
    ctx.beginPath()
    ctx.arc(x, y, stroke.size / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  ctx.beginPath()
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
  }
  ctx.stroke()
}

const toBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encode failed'))), 'image/png'),
  )

export function useMaskPainting() {
  const [strokes, setStrokes] = useState<MaskStroke[]>([])
  const activeStroke = useRef<MaskStroke | null>(null)

  const startStroke = useCallback((point: MaskPoint, tool: MaskTool, size: number) => {
    activeStroke.current = { tool, size, points: [point] }
  }, [])

  const extendStroke = useCallback((point: MaskPoint) => {
    activeStroke.current?.points.push(point)
  }, [])

  const endStroke = useCallback(() => {
    const finished = activeStroke.current
    activeStroke.current = null
    if (finished && finished.points.length > 0) {
      setStrokes((prev) => [...prev, finished])
    }
  }, [])

  const undo = useCallback(() => {
    setStrokes((prev) => prev.slice(0, -1))
  }, [])

  const clear = useCallback(() => {
    setStrokes([])
  }, [])

  /** Replays every finished stroke plus whatever is currently being drawn. */
  const redraw = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.save()
    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const stroke of strokes) drawStroke(ctx, stroke)
    if (activeStroke.current) drawStroke(ctx, activeStroke.current)
    ctx.restore()
  }, [strokes])

  /** True when the canvas (assumed already in sync via redraw) has any non-transparent pixel. */
  const hasMask = useCallback((canvas: HTMLCanvasElement): boolean => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return false
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) return true
    }
    return false
  }, [])

  /**
   * Opaque black everywhere, erased to fully transparent under the painted
   * mask. The strokes are replayed opaque rather than punching with the
   * display overlay: its 55%-alpha strokes would leave the edit region only
   * partially transparent, and OpenAI's edits endpoint keys on full
   * transparency to decide where it may repaint.
   */
  const buildMaskBlob = useCallback(
    (overlayCanvas: HTMLCanvasElement, naturalWidth: number, naturalHeight: number): Promise<Blob> => {
      const punch = document.createElement('canvas')
      punch.width = overlayCanvas.width
      punch.height = overlayCanvas.height
      const punchCtx = punch.getContext('2d')!
      for (const stroke of strokes) drawStroke(punchCtx, stroke, '#fff')

      const maskCanvas = document.createElement('canvas')
      maskCanvas.width = naturalWidth
      maskCanvas.height = naturalHeight
      const ctx = maskCanvas.getContext('2d')!
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, naturalWidth, naturalHeight)
      ctx.globalCompositeOperation = 'destination-out'
      ctx.drawImage(punch, 0, 0, naturalWidth, naturalHeight)
      return toBlob(maskCanvas)
    },
    [strokes],
  )

  return {
    strokes,
    hasStrokes: strokes.length > 0,
    startStroke,
    extendStroke,
    endStroke,
    undo,
    clear,
    redraw,
    hasMask,
    buildMaskBlob,
  }
}

export type UseMaskPaintingReturn = ReturnType<typeof useMaskPainting>
