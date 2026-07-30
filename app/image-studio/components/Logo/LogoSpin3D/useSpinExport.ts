import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { exportFilename, type ExportFormat } from './spin-export-math'
import type { SpinExportRequest } from './spin-export-engine'

/**
 * Runs a spin export and reports progress, without blocking the preview.
 *
 * The engine (and with it three plus the muxer) is imported lazily on first use,
 * so opening the panel does not pay for the encoder — only exporting does.
 *
 * Codec support is probed once up front rather than discovered when an encode
 * fails: finding out that H.264 is unavailable after rendering 300 frames is the
 * worst possible moment to be told.
 */

export interface ExportSupport {
  mp4: boolean
  webm: boolean
  /** Null until the probe resolves; the UI shows a neutral state meanwhile. */
  probed: boolean
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  // Deferred so the click is dispatched before the URL is torn down.
  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 100)
}

export function useSpinExport(isActive: boolean) {
  const [support, setSupport] = useState<ExportSupport>({ mp4: false, webm: false, probed: false })
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!isActive || support.probed) return
    let cancelled = false
    void (async () => {
      const { probeExportSupport } = await import('./spin-export-engine')
      const result = await probeExportSupport()
      if (!cancelled) setSupport({ ...result, probed: true })
    })().catch(() => {
      if (!cancelled) setSupport({ mp4: false, webm: false, probed: true })
    })
    return () => { cancelled = true }
  }, [isActive, support.probed])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const runExport = useCallback(async (request: SpinExportRequest, prompt: string) => {
    if (isExporting) return

    const controller = new AbortController()
    abortRef.current = controller
    setIsExporting(true)
    setProgress(0)
    setError(null)

    try {
      const { exportSpinVideo, ExportCancelledError } = await import('./spin-export-engine')
      try {
        const result = await exportSpinVideo(request, setProgress, controller.signal)
        download(result.blob, exportFilename(prompt, request.format))
        toast.success(`Exported ${result.frameCount} frames (${result.durationSeconds.toFixed(1)}s)`)
      } catch (exportError) {
        // A cancel is a deliberate user action, not a failure to report as one.
        if (exportError instanceof ExportCancelledError) return
        throw exportError
      }
    } catch (exportError) {
      const message = exportError instanceof Error ? exportError.message : 'Export failed'
      setError(message)
      toast.error(message)
      console.error('[logo-3d] Export failed:', exportError)
    } finally {
      // Always cleared, so a failed or cancelled export cannot leave the controls
      // permanently disabled.
      abortRef.current = null
      setIsExporting(false)
      setProgress(0)
    }
  }, [isExporting])

  /** Abort an in-flight export if the panel closes underneath it. */
  useEffect(() => {
    if (!isActive) abortRef.current?.abort()
  }, [isActive])

  const canExport = useCallback((format: ExportFormat) => (
    !support.probed ? false : format === 'mp4' ? support.mp4 : support.webm
  ), [support])

  return { support, isExporting, progress, error, runExport, cancel, canExport }
}
