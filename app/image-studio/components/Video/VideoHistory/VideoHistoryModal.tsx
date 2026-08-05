"use client"

import { useRef, useState } from 'react'
import { Clapperboard, Heart, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { VideoHistoryCard } from './VideoHistoryCard'
import { VideoHistoryHeader } from './VideoHistoryHeader'
import { useVideoHistoryBrowser, type VideoHistoryTab } from './useVideoHistoryBrowser'
import { useVideoHistorySelection } from './useVideoHistorySelection'
import type { FavoriteWriteResult } from '../useVideoFavorites'
import type { DeleteResult } from '../useVideoDelete'
import type { VideoJob } from '../useVideoGeneration'

interface VideoHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  /**
   * Persists the star and mirrors it into the inline grid's job list.
   * Resolves false when the write was rejected, so the modal can undo its own copy.
   */
  onSetFavorite: (jobId: number, isFavorited: boolean) => Promise<FavoriteWriteResult>
  /** Next value a click should request, ahead of the rendered prop. */
  resolveNextFavorite: (jobId: number, rendered: boolean) => boolean
  /**
   * Deletes rows and reconciles the inline grid. Reports which ids actually went,
   * so the modal drops only those and leaves anything the server kept on screen.
   */
  onDeleteClips: (jobIds: number[]) => Promise<DeleteResult>
  /** Job ids already rendered on the working video board. */
  boardJobIds: ReadonlySet<number>
  /** Restores an archived clip to the working board without changing history. */
  onAddToBoard: (clip: VideoJob) => void
}

/** Trimmed prompt for a confirm dialog, so the user sees what they are deleting. */
function clipLabel(clip: VideoJob): string {
  const prompt = clip.prompt.trim()
  if (!prompt) return `clip #${clip.jobId}`
  return prompt.length > 80 ? `${prompt.slice(0, 80)}…` : prompt
}

/** Empty-state copy differs per cause so a filtered view never reads as "you have nothing". */
function EmptyState({ tab, isSearching }: { tab: VideoHistoryTab; isSearching: boolean }) {
  if (isSearching) {
    return (
      <>
        <Search className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
        <p className="text-zinc-400">No clips match that search</p>
        <p className="text-xs text-zinc-500 mt-1">Try a different word from the prompt.</p>
      </>
    )
  }
  if (tab === 'favorites') {
    return (
      <>
        <Heart className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
        <p className="text-zinc-400">No favorites yet</p>
        <p className="text-xs text-zinc-500 mt-1">Tap the heart on a clip to keep it here.</p>
      </>
    )
  }
  return (
    <>
      <Clapperboard className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
      <p className="text-zinc-400">No videos yet</p>
      <p className="text-xs text-zinc-500 mt-1">Generated clips are archived here automatically.</p>
    </>
  )
}

export function VideoHistoryModal({
  isOpen, onClose, onSetFavorite, resolveNextFavorite, onDeleteClips, boardJobIds, onAddToBoard,
}: VideoHistoryModalProps) {
  // Every click in a burst awaits the same settled write, so without this only
  // the newest one may undo itself — otherwise two reverts stack and land on the
  // state before the first click rather than before the last.
  const toggleTokens = useRef<Map<number, number>>(new Map())

  const {
    tab, setTab, search, setSearch, clips, hasMore,
    isLoading, isLoadingMore, error, loadMore, applyFavorite, restoreClip,
    removeClips, refresh, getListGeneration, isSearching,
  } = useVideoHistoryBrowser(isOpen)

  const selection = useVideoHistorySelection(clips, tab, search, isOpen)
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())

  /**
   * Delete a batch and reconcile the list.
   *
   * Only ids the server confirmed are dropped, so a refused row (AC-5) stays
   * visible with its error surfaced by the delete hook. When the visible list
   * empties while the archive still holds rows, the first page is refetched
   * rather than leaving a false "no videos" empty state behind.
   */
  const runDelete = async (jobIds: number[]) => {
    if (jobIds.length === 0) return
    // Merged, not replaced: replacing the set let a second delete clear the
    // first's marks, re-enabling a row whose DELETE was still outstanding.
    setDeletingIds((current) => new Set([...current, ...jobIds]))
    try {
      const { deleted } = await onDeleteClips(jobIds)
      if (deleted.length > 0) {
        // removeClips reports the remaining count itself — deriving it from this
        // closure's `clips` miscounts as soon as two deletes overlap, which would
        // skip the refetch and leave a false "no videos" empty state.
        const remaining = removeClips(deleted)
        // Refused rows stay checked and ready to retry; only what went is unchecked.
        selection.deselect(deleted)
        if (remaining === 0 && hasMore) refresh()
      }
    } finally {
      // Clear only this batch, so a concurrent one keeps its own rows marked.
      setDeletingIds((current) => {
        const next = new Set(current)
        for (const id of jobIds) next.delete(id)
        return next
      })
    }
  }

  const handleDeleteClip = async (clip: VideoJob) => {
    if (!confirm(`Delete this clip?\n\n"${clipLabel(clip)}"\n\nThis cannot be undone.`)) return
    await runDelete([clip.jobId])
  }

  const handleDeleteSelected = async () => {
    const ids = [...selection.selectedIds]
    if (ids.length === 0) return
    const noun = ids.length === 1 ? 'clip' : 'clips'
    if (!confirm(`Delete ${ids.length} selected ${noun}?\n\nThis cannot be undone.`)) return
    await runDelete(ids)
  }

  if (!isOpen) return null

  const handleToggleFavorite = async (clip: VideoJob) => {
    // Remember where it sat: on the Favorites tab an unstar removes it outright,
    // so a rejected write has to put it back rather than just re-flag it.
    const index = clips.findIndex((item) => item.jobId === clip.jobId)
    const generation = getListGeneration()
    const token = (toggleTokens.current.get(clip.jobId) ?? 0) + 1
    toggleTokens.current.set(clip.jobId, token)

    // Not `!clip.isFavorited`: the prop is a render behind, so a second click in
    // the same tick would re-request the first click's value instead of undoing it.
    const next = resolveNextFavorite(clip.jobId, Boolean(clip.isFavorited))
    applyFavorite(clip.jobId, next)

    const result = await onSetFavorite(clip.jobId, next)
    if (result.ok) return
    // Only the newest click reconciles, and only if the list underneath is still
    // the one it acted on — a tab switch, search or reopen replaces it with
    // server truth, which this would fight.
    if (toggleTokens.current.get(clip.jobId) !== token) return
    if (getListGeneration() !== generation) return

    // Settle on what the row actually holds rather than this click's snapshot:
    // mid-burst, an earlier write in the same sequence may have landed.
    if (result.isFavorited) restoreClip({ ...clip, isFavorited: true }, index)
    else applyFavorite(clip.jobId, false)
  }

  const handleAddToBoard = (clip: VideoJob) => {
    onAddToBoard(clip)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <Card className="bg-zinc-900 border-[#c99850]/30 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <VideoHistoryHeader
          tab={tab}
          onTabChange={setTab}
          selectedCount={selection.selectedCount}
          hasSelectableClips={selection.hasSelectableClips}
          isAllSelected={selection.isAllSelected}
          onToggleAll={selection.toggleAll}
          onDeleteSelected={() => void handleDeleteSelected()}
          isDeleting={deletingIds.size > 0}
          onClose={onClose}
        />

        <div className="p-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search prompts…"
              className="pl-9 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* Clips already on screen survive a failed page fetch — losing them
              would strand the user with no list and no way to retry. Only a
              failed FIRST page (nothing loaded) takes over the whole panel. */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#dbb56e] animate-spin" />
            </div>
          )}

          {!isLoading && clips.length > 0 && (
            <div className="flex flex-col gap-3">
              {clips.map((clip) => (
                <VideoHistoryCard
                  key={clip.jobId}
                  clip={clip}
                  onToggleFavorite={handleToggleFavorite}
                  isSelected={selection.selectedIds.has(clip.jobId)}
                  onToggleSelect={selection.toggle}
                  onDelete={handleDeleteClip}
                  isDeleting={deletingIds.has(clip.jobId)}
                  isOnBoard={boardJobIds.has(clip.jobId)}
                  onAddToBoard={handleAddToBoard}
                />
              ))}
            </div>
          )}

          {!isLoading && clips.length === 0 && (
            <div className="text-center py-12">
              {error ? <p className="text-red-400 text-sm">{error}</p> : <EmptyState tab={tab} isSearching={isSearching} />}
            </div>
          )}

          {!isLoading && (error && clips.length > 0 ? (
            <div className="flex flex-col items-center gap-2 pt-4">
              <p className="text-red-400 text-xs">{error}</p>
              <Button
                onClick={loadMore}
                disabled={isLoadingMore}
                size="sm"
                variant="ghost"
                className="text-zinc-300 hover:text-white border border-zinc-800 disabled:opacity-50"
              >
                {isLoadingMore ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Retry
              </Button>
            </div>
          ) : hasMore ? (
            <div className="flex justify-center pt-4">
              <Button
                onClick={loadMore}
                disabled={isLoadingMore}
                size="sm"
                variant="ghost"
                className="text-zinc-300 hover:text-white border border-zinc-800 disabled:opacity-50"
              >
                {isLoadingMore ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Load more
              </Button>
            </div>
          ) : null)}
        </div>
      </Card>
    </div>
  )
}
