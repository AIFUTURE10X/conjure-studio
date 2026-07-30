import { useCallback, useEffect, useRef, useState } from 'react'
import { getUserId } from '@/lib/user-id'
import { VIDEO_HISTORY_PAGE_SIZE } from '@/lib/video/history-query'
import type { VideoJob } from '../useVideoGeneration'

/**
 * Paged, searchable access to /api/video-history for the Videos modal.
 *
 * Deliberately separate from useVideoGeneration's `jobs`: that array is the
 * working set behind the inline grid, while this browses the whole archive.
 * Filtering runs on the server so a favorite (or a match) sitting past the first
 * page still surfaces.
 */

export type VideoHistoryTab = 'all' | 'favorites'

interface FetchOptions {
  tab: VideoHistoryTab
  search: string
  offset: number
}

export function useVideoHistoryBrowser(isOpen: boolean) {
  const [tab, setTab] = useState<VideoHistoryTab>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [clips, setClips] = useState<VideoJob[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Guards against a slow first page overwriting a newer tab/search result.
  const requestSeq = useRef(0)
  // Bumped only when the list is REPLACED wholesale. Distinct from requestSeq,
  // which counts every fetch: `loadMore` appends without disturbing the rows a
  // pending revert may be targeting, so it must not invalidate that revert.
  const listGeneration = useRef(0)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchPage = useCallback(async ({ tab: activeTab, search: term, offset }: FetchOptions) => {
    const seq = ++requestSeq.current
    if (offset === 0) setIsLoading(true)
    else setIsLoadingMore(true)
    setError(null)

    const params = new URLSearchParams({
      userId: getUserId(),
      limit: String(VIDEO_HISTORY_PAGE_SIZE),
      offset: String(offset),
    })
    if (term) params.set('search', term)
    if (activeTab === 'favorites') params.set('favoritesOnly', 'true')

    try {
      const response = await fetch(`/api/video-history?${params.toString()}`)
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Failed to load video history')
      if (seq !== requestSeq.current) return

      const videos = Array.isArray(data?.videos) ? (data.videos as VideoJob[]) : []
      if (offset === 0) listGeneration.current += 1
      setClips((current) => (offset === 0 ? videos : [...current, ...videos]))
      setHasMore(Boolean(data?.hasMore))
    } catch (fetchError) {
      if (seq !== requestSeq.current) return
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load video history')
      // A failed first page has nothing to show. A failed later page keeps both
      // the loaded clips and `hasMore`, so the modal can offer a working Retry —
      // clearing hasMore here would make loadMore's guard reject that retry.
      if (offset === 0) {
        listGeneration.current += 1
        setClips([])
        setHasMore(false)
      }
    } finally {
      if (seq === requestSeq.current) {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    }
  }, [])

  // Refetch from the top whenever the modal opens or the tab/search changes, so
  // stars toggled on the inline grid are reflected without a page reload.
  useEffect(() => {
    if (!isOpen) return
    void fetchPage({ tab, search: debouncedSearch, offset: 0 })
  }, [isOpen, tab, debouncedSearch, fetchPage])

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore) return
    void fetchPage({ tab, search: debouncedSearch, offset: clips.length })
  }, [clips.length, debouncedSearch, fetchPage, hasMore, isLoading, isLoadingMore, tab])

  /**
   * Reflect a favorite change locally. On the Favorites tab an unstarred clip is
   * dropped, since it no longer belongs to the list being viewed.
   */
  const applyFavorite = useCallback((jobId: number, isFavorited: boolean) => {
    setClips((current) => {
      const next = current.map((clip) => (clip.jobId === jobId ? { ...clip, isFavorited } : clip))
      return tab === 'favorites' && !isFavorited ? next.filter((clip) => clip.jobId !== jobId) : next
    })
  }, [tab])

  /**
   * Undo an `applyFavorite` the server rejected. A clip still in the list gets
   * only its favorite flag put back — replacing the whole row would stomp
   * anything fresher the list has since learned. One that was dropped from the
   * Favorites tab is re-inserted where it sat, so a failed write doesn't
   * silently reorder the list.
   */
  const restoreClip = useCallback((clip: VideoJob, index: number) => {
    setClips((current) => {
      if (current.some((item) => item.jobId === clip.jobId)) {
        return current.map((item) => (
          item.jobId === clip.jobId ? { ...item, isFavorited: clip.isFavorited } : item
        ))
      }
      const next = [...current]
      next.splice(Math.max(0, Math.min(index, next.length)), 0, clip)
      return next
    })
  }, [])

  /**
   * Identifies the current list. A revert captured against an older list must be
   * dropped rather than applied: once a real fetch has landed, the server's data
   * is authoritative and re-inserting a stale row would fight it.
   */
  const getListGeneration = useCallback(() => listGeneration.current, [])

  /**
   * Drop rows the server confirmed deleted. Only confirmed ids are passed in, so
   * this never removes a clip the database still holds.
   *
   * Deliberately returns nothing: the remaining count cannot be read out of the
   * updater, which React may run after this returns (and twice under StrictMode).
   * The caller already holds `clips` and computes that itself.
   */
  const removeClips = useCallback((jobIds: number[]) => {
    const goneIds = new Set(jobIds)
    setClips((current) => current.filter((clip) => !goneIds.has(clip.jobId)))
  }, [])

  /**
   * Refetch the first page. Used after a delete empties the visible list while
   * the archive still holds more: offset paging stays consistent (both sides
   * shrank), but an empty screen with unfetched rows behind it would read as
   * "you have no videos", which is a lie.
   */
  const refresh = useCallback(() => {
    void fetchPage({ tab, search: debouncedSearch, offset: 0 })
  }, [debouncedSearch, fetchPage, tab])

  return {
    tab,
    setTab,
    search,
    setSearch,
    clips,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    applyFavorite,
    restoreClip,
    removeClips,
    refresh,
    getListGeneration,
    isSearching: debouncedSearch.length > 0,
  }
}
