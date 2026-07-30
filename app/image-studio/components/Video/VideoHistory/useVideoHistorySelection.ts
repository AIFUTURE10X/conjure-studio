import { useCallback, useMemo, useState } from 'react'
import type { VideoJob } from '../useVideoGeneration'

/**
 * Multi-select bookkeeping for the Videos modal, mirroring the interaction in
 * Favorites/FavoritesModal.tsx (checkbox per card, select-all in the header, one
 * confirm for the batch).
 *
 * Pending jobs are deliberately not selectable: the delete endpoint refuses a row
 * that is still generating, so offering it in a batch would guarantee a partial
 * failure the user cannot act on. That matches the per-card control, which is
 * hidden for pending clips too.
 *
 * Selection is keyed by jobId and reset whenever the underlying list is replaced
 * wholesale — a tab switch, a new search, or reopening the modal — so a checkbox
 * can never carry over onto a different set of rows.
 */
export function useVideoHistorySelection(clips: VideoJob[], tab: string, search: string, isOpen: boolean) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  /** Clips the delete endpoint will actually accept. */
  const selectableIds = useMemo(
    () => clips.filter((clip) => clip.status !== 'pending').map((clip) => clip.jobId),
    [clips],
  )

  const clear = useCallback(() => setSelectedIds(new Set()), [])

  /**
   * AC-8: a tab switch, a new search, or reopening the modal each replaces the
   * list underneath, so a surviving selection would point at rows the user can no
   * longer see.
   *
   * Adjusted during render rather than in an effect. This is React's documented
   * shape for resetting state when a prop changes: it re-renders immediately
   * without committing the intermediate state, where an effect would paint the
   * stale selection first and trip react-hooks/set-state-in-effect.
   */
  const listKey = `${tab}|${search}|${isOpen ? 'open' : 'closed'}`
  const [renderedListKey, setRenderedListKey] = useState(listKey)
  if (renderedListKey !== listKey) {
    setRenderedListKey(listKey)
    setSelectedIds(new Set())
  }

  const toggle = useCallback((jobId: number) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(jobId)) next.delete(jobId)
      else next.add(jobId)
      return next
    })
  }, [])

  const isAllSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id))

  const toggleAll = useCallback(() => {
    setSelectedIds((current) => {
      const allSelected = selectableIds.length > 0 && selectableIds.every((id) => current.has(id))
      return allSelected ? new Set() : new Set(selectableIds)
    })
  }, [selectableIds])

  /**
   * Uncheck specific ids — the rows a delete actually removed.
   *
   * Subtractive rather than a wholesale replace: replacing the set meant a single
   * card's delete wiped an unrelated multi-select, and it made two overlapping
   * deletes stomp each other's retry selection. Removing only what went also
   * leaves refused rows checked and ready to retry for free.
   */
  const deselect = useCallback((jobIds: number[]) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      let changed = false
      for (const id of jobIds) changed = next.delete(id) || changed
      return changed ? next : current
    })
  }, [])

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    hasSelectableClips: selectableIds.length > 0,
    isAllSelected,
    toggle,
    toggleAll,
    clear,
    deselect,
  }
}
