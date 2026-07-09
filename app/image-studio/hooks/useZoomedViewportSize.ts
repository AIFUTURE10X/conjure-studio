"use client"

/**
 * Window size expressed in the zoom-compensated coordinate space of the
 * document (interface zoom is CSS `zoom` on <html> — see lib/ui-zoom.ts),
 * returned as explicit CSS pixel values for a full-window layout.
 *
 * Why not `calc(100dvh / var(--ui-zoom))`? In a browser tab that resolves
 * correctly, but the installed app's webview (WebView2) can resolve viewport
 * units against a stale window size on its first layout pass and never
 * re-resolve them, leaving the studio cramped into the top of the window
 * until something forces a full style recalc. `window.innerWidth/innerHeight`
 * are always current, so explicit pixels measured from them are correct on
 * every surface — and re-measuring on resize/zoom-change/post-load settle
 * self-corrects even a bad first paint.
 */

import { useEffect, useState } from 'react'
import { UI_ZOOM_EVENT, readAppliedUiZoom } from '@/lib/ui-zoom'

export interface ZoomedViewportSize {
  width: string
  height: string
}

// Pre-measure fallback (also SSR-safe); matches the measured value everywhere
// viewport units resolve correctly, so switching to pixels never causes a jump.
const FALLBACK: ZoomedViewportSize = {
  width: 'calc(100vw / var(--ui-zoom, 1))',
  height: 'calc(100dvh / var(--ui-zoom, 1))',
}

const measure = (): ZoomedViewportSize => {
  if (typeof window === 'undefined') return FALLBACK
  const zoom = readAppliedUiZoom()
  return {
    width: `${window.innerWidth / zoom}px`,
    height: `${window.innerHeight / zoom}px`,
  }
}

export function useZoomedViewportSize(): ZoomedViewportSize {
  const [size, setSize] = useState<ZoomedViewportSize>(measure)

  useEffect(() => {
    const update = () => {
      const next = measure()
      setSize((prev) =>
        prev.width === next.width && prev.height === next.height ? prev : next,
      )
    }

    update()
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)
    window.addEventListener(UI_ZOOM_EVENT, update)

    // The installed app's window can still be settling to its real size just
    // after first paint; a few delayed re-measures make sure the shell can't
    // stay stuck at a stale size even if no resize event reaches the page.
    const raf = window.requestAnimationFrame(update)
    const timers = [250, 1000].map((ms) => window.setTimeout(update, ms))

    return () => {
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
      window.removeEventListener(UI_ZOOM_EVENT, update)
      window.cancelAnimationFrame(raf)
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  return size
}
