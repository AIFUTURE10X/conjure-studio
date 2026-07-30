import { useCallback, type Dispatch, type SetStateAction } from 'react'
import { toast } from 'sonner'
import { getUserId } from '@/lib/user-id'
import type { VideoJob } from './useVideoGeneration'

/**
 * Row deletion for video clips, shared by the history modal and the inline grid.
 *
 * Split out of useVideoGeneration for the same reason as useVideoFavorites: that
 * hook owns generation and polling, and both files stay under the 300-line limit
 * in app/image-studio/CLAUDE.md.
 *
 * Deletes are NOT optimistic. A row the server still holds must stay on screen —
 * the endpoint refuses another user's clip and any still-pending job, so an
 * optimistic drop would silently disagree with the database until the next fetch.
 * The caller updates its own list only for the ids reported deleted here, and the
 * `jobs` array behind the inline grid is reconciled in the same pass so the two
 * surfaces cannot disagree about whether a clip exists.
 *
 * Only the history row is removed; the underlying MP4 in Blob storage is left in
 * place, which is a separate retention concern.
 */

/** Outcome of a delete batch: what actually went, and what the server kept. */
export interface DeleteResult {
  deleted: number[]
  failed: number[]
}

async function deleteRow(jobId: number): Promise<void> {
  const params = new URLSearchParams({ id: String(jobId), userId: getUserId() })
  const response = await fetch(`/api/video-history?${params.toString()}`, { method: 'DELETE' })
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.error || 'Could not delete clip')
  }
}

export function useVideoDelete(setJobs: Dispatch<SetStateAction<VideoJob[]>>) {
  /**
   * Delete one or more clips, newest-first order preserved.
   *
   * Requests are sequential rather than parallel: the batch reuses the
   * single-item endpoint, and a burst of concurrent deletes against the same
   * connection buys nothing but a noisier failure mode. A mid-batch failure does
   * not abort the rest — each clip is independent, so stopping early would leave
   * the user guessing which ones went.
   */
  const deleteClips = useCallback(async (jobIds: number[]): Promise<DeleteResult> => {
    const deleted: number[] = []
    const failed: number[] = []
    let lastError: string | null = null

    for (const jobId of jobIds) {
      try {
        await deleteRow(jobId)
        deleted.push(jobId)
      } catch (error) {
        failed.push(jobId)
        lastError = error instanceof Error ? error.message : 'Could not delete clip'
        console.error('[video] History delete failed:', error)
      }
    }

    // Reconcile the inline grid in one pass rather than per row, so a batch does
    // not repaint the list once per clip.
    if (deleted.length > 0) {
      const goneIds = new Set(deleted)
      setJobs((current) => current.filter((job) => !goneIds.has(job.jobId)))
    }

    if (failed.length > 0) {
      // One summary rather than N toasts: a failed batch of ten should not bury
      // the screen. The count is what the user needs to know; the reason is the
      // same for every row in practice (pending, or already gone).
      const summary = jobIds.length === 1
        ? (lastError ?? 'Could not delete clip')
        : `Deleted ${deleted.length} of ${jobIds.length} clips — ${failed.length} could not be removed.`
      toast.error(summary)
    } else if (deleted.length > 1) {
      toast.success(`Deleted ${deleted.length} clips`)
    }

    return { deleted, failed }
  }, [setJobs])

  const deleteClip = useCallback(async (jobId: number): Promise<boolean> => {
    const { deleted } = await deleteClips([jobId])
    return deleted.length === 1
  }, [deleteClips])

  return { deleteClip, deleteClips }
}
