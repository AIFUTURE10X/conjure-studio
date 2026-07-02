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
 *
 * A second, independent source can seed the mask: setBaseMask() imports an
 * externally-computed selection (SmartMaskChips' "Select subject" /
 * "Select background") as ImageData at the display canvas's resolution.
 * redraw() paints the base mask first (tinted like a stroke), then replays
 * strokes on top — an eraser stroke over a base-masked area correctly
 * erases the base tint too, since it shares the same composite pipeline.
 */

import { useCallback, useMemo, useRef, useState } from 'react'

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
const BASE_TINT_ALPHA = 140 // ~0.55 * 255, matches BRUSH_COLOR's opacity

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

/** Tinted (brush-colored) copy of an imported mask, for painting onto the live overlay. */
function tintFromMask(mask: ImageData): ImageData {
  const out = new ImageData(mask.width, mask.height)
  for (let i = 0; i < mask.data.length; i += 4) {
    if (mask.data[i + 3] > 0) {
      out.data[i] = 255
      out.data[i + 1] = 60
      out.data[i + 2] = 60
      out.data[i + 3] = BASE_TINT_ALPHA
    }
  }
  return out
}

/** Opaque-white copy of an imported mask, for punching into the final mask blob. */
function opaqueFromMask(mask: ImageData): ImageData {
  const out = new ImageData(mask.width, mask.height)
  for (let i = 0; i < mask.data.length; i += 4) {
    if (mask.data[i + 3] > 0) {
      out.data[i] = 255
      out.data[i + 1] = 255
      out.data[i + 2] = 255
      out.data[i + 3] = 255
    }
  }
  return out
}

function canvasFromImageData(data: ImageData): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = data.width
  canvas.height = data.height
  canvas.getContext('2d')!.putImageData(data, 0, 0)
  return canvas
}

const toBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encode failed'))), 'image/png'),
  )

export function useMaskPainting() {
  const [strokes, setStrokes] = useState<MaskStroke[]>([])
  const [baseMask, setBaseMaskState] = useState<ImageData | null>(null)
  const activeStroke = useRef<MaskStroke | null>(null)

  const setBaseMask = useCallback((imageData: ImageData | null) => {
    setBaseMaskState(imageData)
  }, [])

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
    setBaseMaskState(null)
  }, [])

  const baseTintCanvas = useMemo(() => (baseMask ? canvasFromImageData(tintFromMask(baseMask)) : null), [baseMask])
  const baseOpaqueCanvas = useMemo(() => (baseMask ? canvasFromImageData(opaqueFromMask(baseMask)) : null), [baseMask])

  /** Replays the base mask (if any), every finished stroke, then whatever is currently being drawn. */
  const redraw = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.save()
    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (baseTintCanvas) ctx.drawImage(baseTintCanvas, 0, 0, canvas.width, canvas.height)
    for (const stroke of strokes) drawStroke(ctx, stroke)
    if (activeStroke.current) drawStroke(ctx, activeStroke.current)
    ctx.restore()
  }, [strokes, baseTintCanvas])

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
   * mask. The strokes (and any imported base mask) are replayed opaque
   * rather than punching with the display overlay: its 55%-alpha strokes
   * would leave the edit region only partially transparent, and OpenAI's
   * edits endpoint keys on full transparency to decide where it may repaint.
   */
  const buildMaskBlob = useCallback(
    (overlayCanvas: HTMLCanvasElement, naturalWidth: number, naturalHeight: number): Promise<Blob> => {
      const punch = document.createElement('canvas')
      punch.width = overlayCanvas.width
      punch.height = overlayCanvas.height
      const punchCtx = punch.getContext('2d')!
      if (baseOpaqueCanvas) punchCtx.drawImage(baseOpaqueCanvas, 0, 0, punch.width, punch.height)
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
    [strokes, baseOpaqueCanvas],
  )

  return {
    strokes,
    baseMask,
    setBaseMask,
    hasStrokes: strokes.length > 0,
    hasContent: strokes.length > 0 || baseMask !== null,
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
