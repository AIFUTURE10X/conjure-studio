"use client"

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Scissors } from 'lucide-react'
import { createDerivedCrop, type CropFraction } from './derived-crops'
import type { PhotoReference } from '@/lib/video/photo-director-schema'

interface CropDialogProps {
  open: boolean
  /** Source candidates (non-crop photos). */
  photos: PhotoReference[]
  onClose: () => void
  onCropped: (crop: PhotoReference) => void
}

/**
 * Drag a rectangle over a photo to cut a real close-up — used as an extra
 * start frame for detail shots (safer than asking the model to zoom).
 */
export function CropDialog({ open, photos, onClose, onCropped }: CropDialogProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [rect, setRect] = useState<CropFraction | null>(null)
  const [label, setLabel] = useState('')
  const [isCutting, setIsCutting] = useState(false)
  const [sourceId, setSourceId] = useState<string | null>(null)
  const photo = photos.find((item) => item.id === sourceId) ?? photos[0] ?? null

  const toFraction = (event: React.PointerEvent) => {
    const bounds = imgRef.current?.getBoundingClientRect()
    if (!bounds) return null
    return {
      x: Math.min(Math.max((event.clientX - bounds.left) / bounds.width, 0), 1),
      y: Math.min(Math.max((event.clientY - bounds.top) / bounds.height, 0), 1),
    }
  }

  const handlePointerDown = (event: React.PointerEvent) => {
    const point = toFraction(event)
    if (!point) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragStart(point)
    setRect(null)
  }

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!dragStart) return
    const point = toFraction(event)
    if (!point) return
    setRect({
      x: Math.min(dragStart.x, point.x),
      y: Math.min(dragStart.y, point.y),
      w: Math.abs(point.x - dragStart.x),
      h: Math.abs(point.y - dragStart.y),
    })
  }

  const handleCut = async () => {
    if (!photo || !rect || rect.w < 0.05 || rect.h < 0.05) return
    setIsCutting(true)
    try {
      const crop = await createDerivedCrop(photo, rect, label.trim() || 'close-up detail')
      onCropped(crop)
      setRect(null)
      setLabel('')
      onClose()
      toast.success('Close-up added to your photos')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not cut the crop')
    } finally {
      setIsCutting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm text-white">Cut a close-up detail</DialogTitle>
        </DialogHeader>
        {photo && (
          <div className="space-y-2">
            <p className="text-[11px] text-zinc-500">Drag a box around the detail — the balcony, the artwork, the view…</p>
            {photos.length > 1 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-zinc-500">Cut from:</span>
                {photos.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => { setSourceId(item.id); setRect(null) }}
                    className={`rounded border ${photo.id === item.id ? 'border-[#dbb56e]' : 'border-zinc-800'}`}
                    title={`Cut from Photo ${index + 1}`}
                  >
                    <img src={item.thumbUrl} alt={`Photo ${index + 1}`} className="h-8 rounded object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div
              className="relative select-none touch-none cursor-crosshair"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={() => setDragStart(null)}
            >
              <img ref={imgRef} src={photo.dataUrl} alt={photo.label || 'Photo'} className="w-full rounded-md pointer-events-none" draggable={false} />
              {rect && (
                <div
                  className="absolute border-2 border-[#dbb56e] bg-[#dbb56e]/10 pointer-events-none"
                  style={{
                    left: `${rect.x * 100}%`,
                    top: `${rect.y * 100}%`,
                    width: `${rect.w * 100}%`,
                    height: `${rect.h * 100}%`,
                  }}
                />
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder='Name it — e.g. "balcony view"'
                aria-label="Crop label"
                className="h-8 bg-zinc-950 border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600"
              />
              <Button
                onClick={() => void handleCut()}
                disabled={!rect || rect.w < 0.05 || rect.h < 0.05 || isCutting}
                size="sm"
                className="h-8 font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850] disabled:opacity-50"
              >
                {isCutting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Scissors className="w-3.5 h-3.5 mr-1.5" />}
                Cut close-up
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
