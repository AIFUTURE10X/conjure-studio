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
  /** False until the probe resolves; the UI shows a neutral state meanwhile. */
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
  // Ref mirror of isExporting: two clicks inside one React commit would both
  // read the STATE as false and start twin encodes racing over abortRef.
  const exportingRef = useRef(false)
  const lastPercentRef = useRef(-1)

  useEffect(() => {
    if (!isActive || support.probed) return
    let cancelled = false
    void (async () => {
      const { probeExportSupport } = await import('./spin-export-engine')
      const result = await probeExportSupport()
      if (cancelled) return
      // A null probe (the engine could not even be asked — e.g. a lazy chunk
      // failed to load) is NOT "this browser has no encoders". Leaving probed
      // false lets the next open retry instead of locking the panel into
      // "cannot encode video" for the rest of the page session.
      setSupport(result ? { ...result, probed: true } : { mp4: false, webm: false, probed: false })
    })().catch(() => {
      if (!cancelled) setSupport({ mp4: false, webm: false, probed: false })
    })
    return () => { cancelled = true }
  }, [isActive, support.probed])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const runExport = useCallback(async (request: SpinExportRequest, prompt: string) => {
    if (exportingRef.current) return
    exportingRef.current = true

    const controller = new AbortController()
    abortRef.current = controller
    setIsExporting(true)
    setProgress(0)
    setError(null)
    lastPercentRef.current = -1

    try {
      const { exportSpinVideo, ExportCancelledError } = await import('./spin-export-engine')
      try {
        const result = await exportSpinVideo(request, (fraction) => {
          // One state update per visible percent, not per frame: a 600-frame
          // encode would otherwise re-render the modal subtree 600 times for a
          // bar that only ever displays whole percents.
          const percent = Math.round(fraction * 100)
          if (percent === lastPercentRef.current) return
          lastPercentRef.current = percent
          setProgress(fraction)
        }, controller.signal)
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
      exportingRef.current = false
      setIsExporting(false)
      setProgress(0)
    }
  }, [])

  /**
   * Abort an in-flight export if the panel closes underneath it — and, via the
   * cleanup, if the whole subtree unmounts mid-encode (e.g. navigating away
   * from the logo panel), which would otherwise keep rendering frames and
   * holding a WebGL context until the encode ran to completion.
   */
  useEffect(() => {
    if (!isActive) abortRef.current?.abort()
    return () => { abortRef.current?.abort() }
  }, [isActive])

  /** Forget a failure reason once the user changes the settings it applied to. */
  const clearError = useCallback(() => { setError(null) }, [])

  const canExport = useCallback((format: ExportFormat) => (
    !support.probed ? false : format === 'mp4' ? support.mp4 : support.webm
  ), [support])

  return { support, isExporting, progress, error, runExport, cancel, canExport, clearError }
}
