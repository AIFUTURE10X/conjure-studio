"use client"

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Check, Crop, Loader2, RotateCcw, X } from 'lucide-react'
import { GeneratedLogo } from '../../../hooks/useLogoGeneration'
import { transparencyGridStyle } from '../../../constants/logo-constants'
import { toPixelRect, type CropHandle } from './crop-math'
import { useCropRect } from './useCropRect'

interface CropToolModalProps {
  generatedLogo: GeneratedLogo
  onClose: () => void
  onUpdateLogo: (logo: GeneratedLogo) => void
}

const ASPECT_PRESETS: { label: string; value: number | null }[] = [
  { label: 'Free', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:2', value: 3 / 2 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
]

const HANDLES: { handle: CropHandle; className: string; cursor: string; cornerOnly: boolean }[] = [
  { handle: 'nw', className: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2', cursor: 'nwse-resize', cornerOnly: true },
  { handle: 'ne', className: 'top-0 right-0 translate-x-1/2 -translate-y-1/2', cursor: 'nesw-resize', cornerOnly: true },
  { handle: 'se', className: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2', cursor: 'nwse-resize', cornerOnly: true },
  { handle: 'sw', className: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2', cursor: 'nesw-resize', cornerOnly: true },
  { handle: 'n', className: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2', cursor: 'ns-resize', cornerOnly: false },
  { handle: 's', className: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2', cursor: 'ns-resize', cornerOnly: false },
  { handle: 'w', className: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2', cursor: 'ew-resize', cornerOnly: false },
  { handle: 'e', className: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2', cursor: 'ew-resize', cornerOnly: false },
]

function preloadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image failed to load'))
    img.src = url
  })
}

export function CropToolModal({ generatedLogo, onClose, onUpdateLogo }: CropToolModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const [isCropping, setIsCropping] = useState(false)
  const imageAspect = naturalSize ? naturalSize.w / naturalSize.h : null
  const { rect, pixelAspect, applyAspect, reset, startMove, startResize, startDraw, handlePointerMove, endDrag } =
    useCropRect(overlayRef, imageAspect)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const cropWidth = naturalSize ? Math.max(1, Math.round(rect.w * naturalSize.w)) : null
  const cropHeight = naturalSize ? Math.max(1, Math.round(rect.h * naturalSize.h)) : null
  const isFullImage = rect.x === 0 && rect.y === 0 && rect.w === 1 && rect.h === 1

  const handleApply = async () => {
    if (!naturalSize || isCropping) return
    setIsCropping(true)
    try {
      const img = await preloadImage(generatedLogo.url)
      const { sx, sy, sw, sh } = toPixelRect(rect, img.naturalWidth, img.naturalHeight)
      const canvas = document.createElement('canvas')
      canvas.width = sw
      canvas.height = sh
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas unavailable')
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
      onUpdateLogo({ ...generatedLogo, url: canvas.toDataURL('image/png') })
      toast.success(`Logo cropped to ${sw} × ${sh}px`)
      onClose()
    } catch {
      toast.error('Could not crop — the image failed to load')
    } finally {
      setIsCropping(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm">
      {/* Header toolbar */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 bg-zinc-900 border-b border-zinc-800 flex-wrap">
        <div className="flex items-center gap-3">
          <Crop className="w-5 h-5 text-[#dbb56e]" />
          <span className="text-sm font-medium text-white">Crop Tool</span>
          <span className="text-xs text-zinc-500 hidden md:inline">Drag the box or its handles — or drag on empty space to start fresh</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {/* Aspect presets */}
          <div className="flex items-center gap-1 border-r border-zinc-700 pr-4">
            <span className="text-xs text-zinc-400 mr-1">Ratio:</span>
            {ASPECT_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyAspect(preset.value)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  pixelAspect === preset.value
                    ? 'bg-[#c99850] text-black'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {/* Output size readout */}
          <span className="text-xs text-zinc-400 tabular-nums min-w-[90px] text-center">
            {cropWidth && cropHeight ? `${cropWidth} × ${cropHeight}px` : '…'}
          </span>
          <Button
            onClick={reset}
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-zinc-400 hover:text-white hover:bg-zinc-800"
            title="Reset crop to full image"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>
          <Button
            onClick={onClose}
            size="sm"
            variant="ghost"
            className="h-8 px-3 text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Cancel
          </Button>
          <Button
            onClick={() => void handleApply()}
            disabled={!naturalSize || isCropping || isFullImage}
            size="sm"
            className="h-8 px-4 bg-[#c99850] hover:bg-[#b8874a] text-black text-sm font-medium disabled:opacity-50"
          >
            {isCropping ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
            Apply Crop
          </Button>
        </div>
      </div>

      {/* Crop area */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        <div className="relative overflow-hidden shadow-2xl" style={transparencyGridStyle}>
          <img
            src={generatedLogo.url}
            alt="Logo to crop"
            className="max-w-[calc(100vw-96px)] max-h-[calc(100vh-200px)] select-none block"
            draggable={false}
            onLoad={(e) => setNaturalSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          />
          <div
            ref={overlayRef}
            className="absolute inset-0 touch-none cursor-crosshair select-none"
            onPointerDown={startDraw}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {/* Crop rectangle — the huge box-shadow dims everything outside it */}
            <div
              className="absolute border-2 border-[#dbb56e] cursor-move"
              style={{
                left: `${rect.x * 100}%`,
                top: `${rect.y * 100}%`,
                width: `${rect.w * 100}%`,
                height: `${rect.h * 100}%`,
                boxShadow: '0 0 0 100vmax rgba(0, 0, 0, 0.6)',
              }}
              onPointerDown={startMove}
            >
              {/* Rule-of-thirds guides */}
              <div className="absolute inset-0 pointer-events-none opacity-40">
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/60" />
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/60" />
                <div className="absolute top-1/3 left-0 right-0 h-px bg-white/60" />
                <div className="absolute top-2/3 left-0 right-0 h-px bg-white/60" />
              </div>
              {HANDLES.filter((h) => pixelAspect === null || h.cornerOnly).map((h) => (
                <div
                  key={h.handle}
                  className={`absolute w-3 h-3 bg-white border border-zinc-900 rounded-sm ${h.className}`}
                  style={{ cursor: h.cursor }}
                  onPointerDown={startResize(h.handle)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="px-6 py-3 bg-zinc-900 border-t border-zinc-800 text-center">
        <p className="text-xs text-zinc-500">
          Pick a ratio or drag freely to any size — Apply Crop replaces the logo, Cancel keeps it untouched.
        </p>
      </div>
    </div>
  )
}
