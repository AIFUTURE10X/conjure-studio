"use client"

/**
 * useThumbnailArrange
 *
 * Layer-arrangement actions: reorder stickers, nudge/align the selected layer
 * (subject / headline / sticker via the shared selection ref), and toggle the
 * subject↔headline z-order. Extracted from ThumbnailProvider to keep it lean.
 */

import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react'
import { SUBJECT_SELECTION_ID, type ThumbnailConfig } from './thumbnail-constants'

const clampPct = (n: number) => Math.min(100, Math.max(0, n))

interface Deps {
  setConfig: Dispatch<SetStateAction<ThumbnailConfig>>
  selectedRef: MutableRefObject<string | null>
}

export function useThumbnailArrange({ setConfig, selectedRef }: Deps) {
  const reorderSticker = useCallback(
    (id: string, dir: 'forward' | 'back') => {
      setConfig((c) => {
        const i = c.stickers.findIndex((s) => s.id === id)
        if (i < 0) return c
        const j = dir === 'forward' ? Math.min(c.stickers.length - 1, i + 1) : Math.max(0, i - 1)
        if (i === j) return c
        const arr = [...c.stickers]
        const [moved] = arr.splice(i, 1)
        arr.splice(j, 0, moved)
        return { ...c, stickers: arr }
      })
    },
    [setConfig],
  )

  // Move whichever layer is selected (subject / headline / sticker).
  const patchSelectedPos = useCallback(
    (mapX: (x: number) => number, mapY: (y: number) => number) => {
      const id = selectedRef.current
      if (!id) return
      setConfig((c) => {
        if (id === SUBJECT_SELECTION_ID) {
          return c.subject ? { ...c, subject: { ...c.subject, x: clampPct(mapX(c.subject.x)), y: clampPct(mapY(c.subject.y)) } } : c
        }
        if (c.headlines.some((h) => h.id === id)) {
          return {
            ...c,
            headlines: c.headlines.map((h) =>
              h.id === id ? { ...h, x: clampPct(mapX(h.x)), y: clampPct(mapY(h.y)) } : h,
            ),
          }
        }
        return { ...c, stickers: c.stickers.map((s) => (s.id === id ? { ...s, x: clampPct(mapX(s.x)), y: clampPct(mapY(s.y)) } : s)) }
      })
    },
    [setConfig, selectedRef],
  )

  const nudgeSelected = useCallback(
    (dx: number, dy: number) => patchSelectedPos((x) => x + dx, (y) => y + dy),
    [patchSelectedPos],
  )

  const alignSelected = useCallback(
    (x: number | null, y: number | null) => patchSelectedPos((cur) => x ?? cur, (cur) => y ?? cur),
    [patchSelectedPos],
  )

  const setSubjectOnTop = useCallback(
    (on: boolean) => setConfig((c) => ({ ...c, subjectOnTop: on })),
    [setConfig],
  )

  return { reorderSticker, nudgeSelected, alignSelected, setSubjectOnTop }
}
