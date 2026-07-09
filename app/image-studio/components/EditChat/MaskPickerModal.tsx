"use client"

/**
 * MaskPickerModal
 *
 * Standalone mask-painting modal for the edit chat: paint an area on the
 * current working image, then attach it to the next chat message as a
 * PendingMask. Reuses Phase 1's MaskCanvas + useMaskPainting so brush
 * behavior matches the full AI Edit modal; unlike that modal, this one only
 * selects an area and never calls the edit API itself.
 */

import { useRef, useState } from 'react'
import { Eraser, Paintbrush, Undo2, X } from 'lucide-react'
import { toast } from 'sonner'
import { MaskCanvas, type MaskCanvasHandle } from '../ImageEditor/MaskCanvas'
import { SmartMaskChips } from '../ImageEditor/SmartMaskChips'
import { useMaskPainting, type MaskTool } from '../ImageEditor/useMaskPainting'
import type { PendingMask } from '../../context/EditChatProvider'

interface MaskPickerModalProps {
  imageUrl: string
  onAttach: (mask: PendingMask) => void
  onClose: () => void
}

const PREVIEW_WIDTH = 96

const chipClass = (on: boolean) =>
  `flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
    on ? 'border-[#c99850] bg-[#c99850]/10 text-[#dbb56e]' : 'border-zinc-700 bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700'
  }`

export function MaskPickerModal({ imageUrl, onAttach, onClose }: MaskPickerModalProps) {
  const [tool, setTool] = useState<MaskTool>('brush')
  const [brushSize, setBrushSize] = useState(36)
  const maskCanvasRef = useRef<MaskCanvasHandle>(null)
  const mask = useMaskPainting()

  const handleAttach = async () => {
    const overlayCanvas = maskCanvasRef.current?.getOverlayCanvas()
    const dims = maskCanvasRef.current?.getDims()
    if (!overlayCanvas || !dims) return

    if (!mask.hasMask(overlayCanvas)) {
      toast.error('Paint over an area first')
      return
    }

    const blob = await mask.buildMaskBlob(overlayCanvas, dims.nw, dims.nh)

    const previewCanvas = document.createElement('canvas')
    const previewHeight = Math.round((overlayCanvas.height / overlayCanvas.width) * PREVIEW_WIDTH)
    previewCanvas.width = PREVIEW_WIDTH
    previewCanvas.height = previewHeight
    previewCanvas.getContext('2d')?.drawImage(overlayCanvas, 0, 0, PREVIEW_WIDTH, previewHeight)

    onAttach({
      blob,
      previewUrl: previewCanvas.toDataURL('image/png'),
      paintedWidth: dims.nw,
      paintedHeight: dims.nh,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="flex w-full h-[92vh] w-[92vw] max-w-[1400px] flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-white">Paint the area to change</h2>
          <button
            onClick={onClose}
            title="Close"
            aria-label="Close mask picker"
            className="text-zinc-400 transition-colors hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto p-5">
          <div className="flex flex-1 min-h-0 items-center justify-center overflow-hidden">
            <MaskCanvas
              ref={maskCanvasRef}
              imageUrl={imageUrl}
              tool={tool}
              brushSize={brushSize}
              onStartStroke={mask.startStroke}
              onExtendStroke={mask.extendStroke}
              onEndStroke={mask.endStroke}
              redraw={mask.redraw}
              onClose={onClose}
              reservedPx={280}
              maxWidthPx={1200}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1.5">
              <button onClick={() => setTool('brush')} className={chipClass(tool === 'brush')} title="Paint the mask">
                <Paintbrush className="h-3.5 w-3.5" /> Brush
              </button>
              <button onClick={() => setTool('eraser')} className={chipClass(tool === 'eraser')} title="Erase part of the mask">
                <Eraser className="h-3.5 w-3.5" /> Eraser
              </button>
            </div>

            <SmartMaskChips
              imageUrl={imageUrl}
              getDisplayDims={() => maskCanvasRef.current?.getDims() ?? null}
              onMaskReady={mask.setBaseMask}
            />

            <label className="flex min-w-[160px] flex-1 items-center gap-2 text-[11px] text-zinc-500">
              Brush size
              <input
                type="range"
                min={8}
                max={80}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full accent-[#c99850]"
                aria-label="Brush size"
              />
            </label>

            <button
              onClick={mask.undo}
              disabled={!mask.hasStrokes}
              title="Undo last stroke"
              className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/70 px-3 py-2 text-xs text-zinc-300 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Undo2 className="h-3.5 w-3.5" /> Undo
            </button>
            <button
              onClick={mask.clear}
              disabled={!mask.hasContent}
              title="Clear the mask"
              className="rounded-md border border-zinc-700 bg-zinc-800/70 px-3 py-2 text-xs text-zinc-300 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-md border border-zinc-700 bg-zinc-800/70 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleAttach()}
              className="flex-1 rounded-md bg-[#c99850] px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#dbb56e]"
            >
              Attach area
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
