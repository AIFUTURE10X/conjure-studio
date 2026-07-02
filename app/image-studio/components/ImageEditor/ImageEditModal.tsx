"use client"

/**
 * ImageEditModal
 *
 * Near-fullscreen AI Edit modal for generated images: paint a mask, erase
 * or replace the painted area via /api/edit-image (optionally requesting
 * 1-3 variants), then compare before vs after with a wipe-compare view.
 * Keeping a result feeds it back to the caller; strokes are intentionally
 * NOT cleared on Keep or Discard so the user can immediately re-apply or
 * refine the same painted area (the Clear button remains available).
 */

import { useCallback, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { MaskCanvas, type MaskCanvasHandle } from './MaskCanvas'
import { EditToolbar, type EditMode } from './EditToolbar'
import { EditCompareView } from './EditCompareView'
import { useMaskPainting, type MaskTool } from './useMaskPainting'
import { editResponseUrls, parseEditResponse, prepareImageForEdit } from './upload-prep'

export interface ImageEditModalProps {
  imageUrl: string
  onApply: (url: string, editPrompt: string) => void
  onClose: () => void
}

type Phase = 'paint' | 'compare'

export function ImageEditModal({ imageUrl, onApply, onClose }: ImageEditModalProps) {
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl)
  const [phase, setPhase] = useState<Phase>('paint')
  const [resultUrls, setResultUrls] = useState<string[]>([])
  const [selectedResultIndex, setSelectedResultIndex] = useState(0)
  const [tool, setTool] = useState<MaskTool>('brush')
  const [brushSize, setBrushSize] = useState(36)
  const [mode, setMode] = useState<EditMode>('erase')
  const [prompt, setPrompt] = useState('')
  const [variants, setVariants] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [appliedPrompt, setAppliedPrompt] = useState('')

  const maskCanvasRef = useRef<MaskCanvasHandle>(null)
  const mask = useMaskPainting()

  const handleApply = useCallback(async () => {
    const overlayCanvas = maskCanvasRef.current?.getOverlayCanvas()
    const image = maskCanvasRef.current?.getImage()
    const dims = maskCanvasRef.current?.getDims()
    if (!overlayCanvas || !image || !dims) return

    if (!mask.hasMask(overlayCanvas)) {
      toast.error('Paint over the area to edit first')
      return
    }
    const trimmedPrompt = prompt.trim()
    if (mode === 'replace' && !trimmedPrompt) {
      toast.error('Describe what to put in the painted area')
      return
    }

    setIsLoading(true)
    try {
      // Downscale/re-encode to fit Vercel's request-body cap; the mask must
      // be built at the same pixel size as the uploaded image.
      const prepared = await prepareImageForEdit(image)
      const maskBlob = await mask.buildMaskBlob(overlayCanvas, prepared.width, prepared.height)

      const formData = new FormData()
      formData.append('image', prepared.blob, prepared.fileName)
      formData.append('mask', maskBlob, 'mask.png')
      formData.append('mode', mode)
      if (mode === 'replace') formData.append('prompt', trimmedPrompt)
      formData.append('variants', String(variants))

      const response = await fetch('/api/edit-image', { method: 'POST', body: formData })
      const data = await parseEditResponse(response)
      const urls = editResponseUrls(data)
      if (!response.ok || urls.length === 0) throw new Error(data.error || 'Edit failed')

      setAppliedPrompt(mode === 'replace' ? trimmedPrompt : '')
      setResultUrls(urls)
      setSelectedResultIndex(0)
      setPhase('compare')
    } catch (error) {
      console.error('[ImageEdit] edit failed:', error)
      toast.error(error instanceof Error ? error.message : 'Edit failed')
    } finally {
      setIsLoading(false)
    }
  }, [mask, mode, prompt, variants])

  const handleKeep = useCallback(() => {
    const selectedUrl = resultUrls[selectedResultIndex]
    if (!selectedUrl) return
    onApply(selectedUrl, appliedPrompt)
    setCurrentImageUrl(selectedUrl)
    setResultUrls([])
    setPrompt('')
    setPhase('paint')
  }, [resultUrls, selectedResultIndex, appliedPrompt, onApply])

  const handleDiscard = useCallback(() => {
    setResultUrls([])
    setPhase('paint')
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="flex w-full max-w-5xl max-h-[92vh] flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-white">AI Edit</h2>
          <button onClick={onClose} title="Close" className="text-zinc-400 transition-colors hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto p-5">
          {phase === 'paint' ? (
            <>
              <div className="flex flex-1 min-h-0 items-center justify-center">
                <MaskCanvas
                  ref={maskCanvasRef}
                  imageUrl={currentImageUrl}
                  tool={tool}
                  brushSize={brushSize}
                  onStartStroke={mask.startStroke}
                  onExtendStroke={mask.extendStroke}
                  onEndStroke={mask.endStroke}
                  redraw={mask.redraw}
                  onClose={onClose}
                />
              </div>
              <EditToolbar
                tool={tool}
                onToolChange={setTool}
                brushSize={brushSize}
                onBrushSizeChange={setBrushSize}
                canUndo={mask.hasContent}
                onUndo={mask.undo}
                onClear={mask.clear}
                mode={mode}
                onModeChange={setMode}
                prompt={prompt}
                onPromptChange={setPrompt}
                variants={variants}
                onVariantsChange={setVariants}
                isLoading={isLoading}
                onApply={handleApply}
                imageUrl={currentImageUrl}
                getDisplayDims={() => maskCanvasRef.current?.getDims() ?? null}
                onMaskReady={mask.setBaseMask}
              />
            </>
          ) : (
            resultUrls.length > 0 && (
              <EditCompareView
                beforeUrl={currentImageUrl}
                afterUrls={resultUrls}
                selectedIndex={selectedResultIndex}
                onSelectIndex={setSelectedResultIndex}
                onKeep={handleKeep}
                onDiscard={handleDiscard}
              />
            )
          )}
        </div>
      </div>
    </div>
  )
}
