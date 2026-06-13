"use client"

/**
 * useThumbnailExport
 *
 * Export the stage as PNG or size-clamped JPG (YouTube's 2 MB cap), or run the
 * composite through the shared AI upscaler for a crisp 2K/4K download.
 */

import { useCallback, useState, type RefObject } from 'react'
import { toast } from 'sonner'
import {
  canvasToJpegBlob,
  canvasToPngBlob,
  canvasToPngDataUrl,
  captureStageCanvas,
  downloadBlob,
} from './thumbnail-export'
import { type ThumbnailFormat, type UpscaleTarget } from './thumbnail-constants'

export function useThumbnailExport(stageRef: RefObject<HTMLDivElement | null>) {
  const [isExporting, setIsExporting] = useState(false)
  const [isUpscaling, setIsUpscaling] = useState(false)

  const exportImage = useCallback(
    async (format: ThumbnailFormat) => {
      const node = stageRef.current
      if (!node) return
      setIsExporting(true)
      try {
        const canvas = await captureStageCanvas(node)
        if (format === 'jpg') {
          const { blob, quality } = await canvasToJpegBlob(canvas)
          downloadBlob(blob, 'youtube-thumbnail.jpg')
          const mb = (blob.size / (1024 * 1024)).toFixed(2)
          toast.success(`Exported JPG · ${mb} MB${quality < 0.9 ? ` (q${Math.round(quality * 100)})` : ''}`)
        } else {
          const blob = await canvasToPngBlob(canvas)
          downloadBlob(blob, 'youtube-thumbnail.png')
          toast.success('Exported PNG (1280×720)')
        }
      } catch (err) {
        console.error('[Thumbnail] export failed:', err)
        toast.error('Export failed')
      } finally {
        setIsExporting(false)
      }
    },
    [stageRef],
  )

  const upscaleExport = useCallback(
    async (target: UpscaleTarget) => {
      const node = stageRef.current
      if (!node) return
      setIsUpscaling(true)
      try {
        const canvas = await captureStageCanvas(node)
        const form = new FormData()
        form.append('imageBase64', canvasToPngDataUrl(canvas))
        form.append('targetResolution', target)
        form.append('method', 'ai')
        const res = await fetch('/api/upscale-logo', { method: 'POST', body: form })
        const data = (await res.json()) as { image?: string; error?: string }
        if (!res.ok || !data.image) throw new Error(data.error || 'Upscale failed')
        const blob = await (await fetch(data.image)).blob()
        downloadBlob(blob, `youtube-thumbnail-${target}.png`)
        toast.success(`Exported upscaled ${target}`)
      } catch (err) {
        console.error('[Thumbnail] upscale export failed:', err)
        toast.error('Upscale failed — try again')
      } finally {
        setIsUpscaling(false)
      }
    },
    [stageRef],
  )

  return { isExporting, exportImage, isUpscaling, upscaleExport }
}
