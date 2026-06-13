"use client"

/**
 * useThumbnailHistory
 *
 * Save finished thumbnails to (and load them from) the shared studio history
 * tables, reusing /api/logo-history with style='thumbnail'. The composite PNG
 * is the gallery preview; the full editable config is stored alongside it so a
 * saved thumbnail can be reopened and edited.
 */

import { useCallback, useEffect, useState, type MutableRefObject, type RefObject } from 'react'
import { toast } from 'sonner'
import { getUserId } from '@/lib/user-id'
import { canvasToPngDataUrl, captureStageCanvas } from './thumbnail-export'
import {
  THUMBNAIL_HISTORY_STYLE,
  type ThumbnailConfig,
  type ThumbnailHistoryItem,
} from './thumbnail-constants'

interface RawHistoryItem {
  id: string
  imageUrl: string
  prompt: string
  style?: string
  config?: { thumbnailConfig?: ThumbnailConfig } | null
  timestamp: number
}

/** Load this device's saved thumbnails from the shared history table. */
async function fetchThumbnailHistory(): Promise<ThumbnailHistoryItem[]> {
  const userId = getUserId()
  const res = await fetch(`/api/logo-history?userId=${encodeURIComponent(userId)}`)
  if (!res.ok) return []
  const data = (await res.json()) as { history?: RawHistoryItem[] }
  return (data.history || [])
    .filter((i) => i.style === THUMBNAIL_HISTORY_STYLE)
    .map((i) => ({
      id: i.id,
      imageUrl: i.imageUrl,
      prompt: i.prompt,
      timestamp: i.timestamp,
      config: i.config?.thumbnailConfig,
    }))
}

export function useThumbnailHistory(
  stageRef: RefObject<HTMLDivElement | null>,
  configRef: MutableRefObject<ThumbnailConfig>,
) {
  const [history, setHistory] = useState<ThumbnailHistoryItem[]>([])
  const [isSavingHistory, setIsSavingHistory] = useState(false)

  const refreshHistory = useCallback(async () => {
    try {
      setHistory(await fetchThumbnailHistory())
    } catch (err) {
      console.error('[Thumbnail] history load failed:', err)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const items = await fetchThumbnailHistory()
        if (!cancelled) setHistory(items)
      } catch (err) {
        console.error('[Thumbnail] history load failed:', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const saveThumbnail = useCallback(async () => {
    const node = stageRef.current
    if (!node) return
    setIsSavingHistory(true)
    try {
      const canvas = await captureStageCanvas(node)
      const dataUrl = canvasToPngDataUrl(canvas)
      const config = configRef.current
      const prompt = (config.headline.text || 'YouTube thumbnail').slice(0, 200)
      const res = await fetch('/api/logo-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getUserId(),
          imageUrl: dataUrl,
          prompt,
          style: THUMBNAIL_HISTORY_STYLE,
          config: { wasThumbnail: true, thumbnailConfig: config },
        }),
      })
      const data = (await res.json()) as { historyItem?: RawHistoryItem; error?: string }
      if (!res.ok || !data.historyItem) throw new Error(data.error || 'Save failed')
      const saved = data.historyItem
      setHistory((cur) => [
        { id: saved.id, imageUrl: saved.imageUrl, prompt: saved.prompt, timestamp: saved.timestamp, config },
        ...cur,
      ])
      toast.success('Saved to history')
    } catch (err) {
      console.error('[Thumbnail] history save failed:', err)
      toast.error('Could not save — the thumbnail may be too large')
    } finally {
      setIsSavingHistory(false)
    }
  }, [stageRef, configRef])

  const deleteThumbnail = useCallback(async (id: string) => {
    setHistory((cur) => cur.filter((i) => i.id !== id))
    try {
      const userId = getUserId()
      await fetch(
        `/api/logo-history?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(userId)}`,
        { method: 'DELETE' },
      )
    } catch (err) {
      console.error('[Thumbnail] history delete failed:', err)
    }
  }, [])

  return { history, isSavingHistory, saveThumbnail, deleteThumbnail, refreshHistory }
}
