"use client"

/**
 * ThumbnailEditModal
 *
 * Brush-mask AI inpaint. Paint over an area of the subject/background image,
 * then erase it (fill from surroundings) or replace it from a prompt. Builds a
 * PNG mask at the image's native resolution (painted → transparent = edit) and
 * posts it to /api/thumbnail-edit. Untested in-browser — verify before relying.
 */

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Eraser, Loader2, Wand2, X } from 'lucide-react'
import { toast } from 'sonner'

const MAX_W = 600

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image load failed'))
    img.src = url
  })
}

const toBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/png'))

const chip = (on: boolean) =>
  `flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
    on ? 'border-[#c99850] bg-[#c99850]/10 text-[#dbb56e]' : 'border-zinc-700 bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700'
  }`

interface Dims {
  w: number
  h: number
  nw: number
  nh: number
}

export function ThumbnailEditModal({
  imageUrl,
  onApply,
  onClose,
}: {
  imageUrl: string
  onApply: (url: string) => void
  onClose: () => void
}) {
  const imgRef = useRef<HTMLImageElement | null>(null)
  const displayRef = useRef<HTMLCanvasElement | null>(null)
  const overlayRef = useRef<HTMLCanvasElement | null>(null)
  const painting = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [dims, setDims] = useState<Dims | null>(null)
  const [brush, setBrush] = useState(36)
  const [mode, setMode] = useState<'erase' | 'replace'>('erase')
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const img = await loadImage(imageUrl)
        if (cancelled) return
        imgRef.current = img
        const nw = img.naturalWidth || 1024
        const nh = img.naturalHeight || 576
        const w = Math.min(MAX_W, nw)
        setDims({ w, h: Math.round((w * nh) / nw), nw, nh })
      } catch {
        toast.error('Could not load the image to edit')
        onClose()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [imageUrl, onClose])

  useEffect(() => {
    if (!dims || !imgRef.current) return
    displayRef.current?.getContext('2d')?.drawImage(imgRef.current, 0, 0, dims.w, dims.h)
  }, [dims])

  const pos = (e: ReactPointerEvent) => {
    const rect = overlayRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }
  const paint = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const ctx = overlayRef.current?.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = 'rgba(255,60,60,0.55)'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = brush
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
  const onDown = (e: ReactPointerEvent) => {
    painting.current = true
    const p = pos(e)
    last.current = p
    paint(p, p)
  }
  const onMove = (e: ReactPointerEvent) => {
    if (!painting.current) return
    const p = pos(e)
    if (last.current) paint(last.current, p)
    last.current = p
  }
  const onUp = () => {
    painting.current = false
    last.current = null
  }
  const clearMask = () => {
    if (dims) overlayRef.current?.getContext('2d')?.clearRect(0, 0, dims.w, dims.h)
  }

  const apply = async () => {
    if (!dims || !imgRef.current || !overlayRef.current) return
    const octx = overlayRef.current.getContext('2d')!
    const painted = octx.getImageData(0, 0, dims.w, dims.h).data.some((v, i) => i % 4 === 3 && v > 0)
    if (!painted) {
      toast.error('Paint over the area to edit first')
      return
    }
    setIsLoading(true)
    try {
      const imgCanvas = document.createElement('canvas')
      imgCanvas.width = dims.nw
      imgCanvas.height = dims.nh
      imgCanvas.getContext('2d')!.drawImage(imgRef.current, 0, 0, dims.nw, dims.nh)

      // Mask: opaque black everywhere; painted strokes erased to transparent.
      const maskCanvas = document.createElement('canvas')
      maskCanvas.width = dims.nw
      maskCanvas.height = dims.nh
      const mctx = maskCanvas.getContext('2d')!
      mctx.fillStyle = '#000'
      mctx.fillRect(0, 0, dims.nw, dims.nh)
      mctx.globalCompositeOperation = 'destination-out'
      mctx.drawImage(overlayRef.current, 0, 0, dims.nw, dims.nh)

      const [imageBlob, maskBlob] = await Promise.all([toBlob(imgCanvas), toBlob(maskCanvas)])
      const fd = new FormData()
      fd.append('image', imageBlob, 'image.png')
      fd.append('mask', maskBlob, 'mask.png')
      fd.append('mode', mode)
      if (mode === 'replace') fd.append('prompt', prompt.trim())

      const res = await fetch('/api/thumbnail-edit', { method: 'POST', body: fd })
      const data = (await res.json()) as { image?: string; error?: string }
      if (!res.ok || !data.image) throw new Error(data.error || 'Edit failed')
      onApply(data.image)
      toast.success('Applied AI edit')
      onClose()
    } catch (err) {
      console.error('[Thumbnail] edit failed:', err)
      toast.error(err instanceof Error ? err.message : 'Edit failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">AI edit — paint the area, then {mode === 'erase' ? 'erase' : 'replace'}</h3>
          <button onClick={onClose} title="Close" className="text-zinc-400 transition-colors hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex justify-center">
          {dims ? (
            <div className="relative" style={{ width: dims.w, height: dims.h }}>
              <canvas ref={displayRef} width={dims.w} height={dims.h} className="absolute inset-0 rounded-md border border-zinc-800" />
              <canvas
                ref={overlayRef}
                width={dims.w}
                height={dims.h}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerLeave={onUp}
                className="absolute inset-0 cursor-crosshair touch-none rounded-md"
              />
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
        </div>

        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={() => setMode('erase')} className={chip(mode === 'erase')}>
              <Eraser className="h-3.5 w-3.5" /> Erase
            </button>
            <button onClick={() => setMode('replace')} className={chip(mode === 'replace')}>
              <Wand2 className="h-3.5 w-3.5" /> Replace
            </button>
          </div>
          {mode === 'replace' && (
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what to put there…"
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-[#c99850]/60 focus:outline-none"
            />
          )}
          <label className="block text-[11px] text-zinc-500">
            Brush
            <input type="range" min={8} max={80} value={brush} onChange={(e) => setBrush(Number(e.target.value))} className="w-full accent-[#c99850]" />
          </label>
          <div className="flex gap-1.5">
            <button onClick={clearMask} className="flex-1 rounded-md border border-zinc-700 bg-zinc-800/70 px-3 py-2 text-xs text-zinc-300 transition-colors hover:bg-zinc-700">
              Clear
            </button>
            <button
              onClick={apply}
              disabled={isLoading}
              className="flex flex-[2] items-center justify-center gap-2 rounded-md bg-linear-to-r from-purple-500 to-pink-500 px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
              {isLoading ? 'Working…' : 'Apply AI edit'}
            </button>
          </div>
          <p className="text-[10px] leading-snug text-zinc-500">
            Paint over what you want to {mode === 'erase' ? 'remove' : 'replace'}. Uses credits.
          </p>
        </div>
      </div>
    </div>
  )
}
