import { useCallback, useRef, type Dispatch, type SetStateAction } from 'react'
import { toast } from 'sonner'
import { getUserId } from '@/lib/user-id'
import type { VideoJob } from './useVideoGeneration'

/**
 * Favorite writes for video clips, shared by the inline grid and the history modal.
 *
 * Split out of useVideoGeneration, which owns generation and polling — this is a
 * separate concern with its own bookkeeping, and keeping it here holds both files
 * under the 300-line limit in app/image-studio/CLAUDE.md.
 *
 * Both surfaces write through here so their hearts cannot disagree. The caller
 * owns the job list; this hook only needs to update it, so it takes `setJobs`
 * rather than reading state it does not own.
 */

/** Outcome of a favorite write: whether it landed, and what the row now holds. */
export interface FavoriteWriteResult {
  ok: boolean
  isFavorited: boolean
}

export function useVideoFavorites(setJobs: Dispatch<SetStateAction<VideoJob[]>>) {
  /** In-flight favorite write per clip, so repeat clicks serialize behind it. */
  const favoriteRuns = useRef<Map<number, Promise<FavoriteWriteResult>>>(new Map())
  /** Newest requested state for a clip whose write hasn't finished yet. */
  const favoriteQueue = useRef<Map<number, boolean>>(new Map())
  /**
   * What the user last asked for, for clips with a write still settling.
   *
   * Rendered props lag a click by a render, so two clicks in the same tick both
   * read the pre-click value and ask for the same thing — a double-click lands
   * as one toggle. This covers that gap, and only that gap: entries are dropped
   * once the write settles, by which point the optimistic update has painted and
   * the rendered value is authoritative again. Keeping them longer would let a
   * stale local guess outlive a change made in another tab or session, turning
   * the next click into a silent no-op.
   */
  const favoriteIntent = useRef<Map<number, boolean>>(new Map())

  /**
   * Drive one clip's writes to completion, newest intent last.
   *
   * Writes are serialized rather than fired in parallel because the UPDATE has
   * no ordering guard — two in-flight requests would let the earlier click win
   * in the database while both reported success. After each write it picks up
   * whatever the user asked for meanwhile, so a burst of clicks costs at most
   * two requests and settles on the last one.
   */
  const runFavoriteWrites = useCallback(async (jobId: number, desired: boolean): Promise<FavoriteWriteResult> => {
    // What the row is believed to hold: the toggle's starting point, then each
    // value confirmed written. A failure reverts to this, not to the caller's
    // guess, so an earlier successful write in the same burst is not undone.
    let persisted = !desired
    let target = desired

    try {
      for (;;) {
        const response = await fetch('/api/video-history', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: getUserId(), jobId, isFavorited: target }),
        })
        if (!response.ok) {
          const data = await response.json().catch(() => null)
          throw new Error(data?.error || 'Could not update favorite')
        }
        persisted = target

        const queued = favoriteQueue.current.get(jobId)
        favoriteQueue.current.delete(jobId)
        if (queued === undefined || queued === persisted) {
          return { ok: true, isFavorited: persisted }
        }
        target = queued
      }
    } catch (error) {
      favoriteQueue.current.delete(jobId)
      // Settle every surface on what the row actually holds — the last value
      // confirmed written, which may be mid-burst rather than the start of it.
      setJobs((current) => current.map((item) => (
        item.jobId === jobId ? { ...item, isFavorited: persisted } : item
      )))
      toast.error(error instanceof Error ? error.message : 'Could not update favorite')
      console.error('[video] Favorite toggle failed:', error)
      return { ok: false, isFavorited: persisted }
    } finally {
      favoriteRuns.current.delete(jobId)
      // The optimistic update has painted by now, so the rendered value is the
      // authority again — and a fresh GET may legitimately contradict this guess.
      favoriteIntent.current.delete(jobId)
    }
  }, [setJobs])

  /**
   * Persist a clip's favorite state and mirror it into the job list.
   *
   * The history modal browses rows the caller may never have loaded, so the local
   * update is a no-op map rather than a lookup — a clip that isn't on screen just
   * gets persisted.
   *
   * The update is optimistic but not blind: a rejected write reverts the heart
   * here and reports the value the row actually holds, so the caller can settle
   * its own copy rather than leaving the UI claiming a star the database refused.
   */
  const setFavorite = useCallback((jobId: number, isFavorited: boolean): Promise<FavoriteWriteResult> => {
    favoriteIntent.current.set(jobId, isFavorited)
    setJobs((current) => current.map((item) => (
      item.jobId === jobId ? { ...item, isFavorited } : item
    )))

    // A write for this clip is already running: hand it the newer intent instead
    // of dropping the click, and return that run so every caller in the burst
    // learns the same settled outcome.
    const running = favoriteRuns.current.get(jobId)
    if (running) {
      favoriteQueue.current.set(jobId, isFavorited)
      return running
    }

    const run = runFavoriteWrites(jobId, isFavorited)
    favoriteRuns.current.set(jobId, run)
    return run
  }, [runFavoriteWrites, setJobs])

  /**
   * What a click on this clip's heart should ask for.
   *
   * Prefers the intent of a click whose write is still settling over `rendered`,
   * which is a paint behind. Falls back to `rendered` once nothing is pending —
   * and for archive rows the modal browses that were never in `jobs`.
   */
  const resolveNextFavorite = useCallback((jobId: number, rendered: boolean) => (
    !(favoriteIntent.current.get(jobId) ?? rendered)
  ), [])

  const toggleFavorite = useCallback((job: VideoJob) => {
    void setFavorite(job.jobId, resolveNextFavorite(job.jobId, Boolean(job.isFavorited)))
  }, [resolveNextFavorite, setFavorite])

  return { setFavorite, toggleFavorite, resolveNextFavorite }
}
