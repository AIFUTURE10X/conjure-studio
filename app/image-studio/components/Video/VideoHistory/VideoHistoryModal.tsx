"use client"

import { Clapperboard, Heart, Loader2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { VideoHistoryCard } from './VideoHistoryCard'
import { useVideoHistoryBrowser, type VideoHistoryTab } from './useVideoHistoryBrowser'
import type { VideoJob } from '../useVideoGeneration'

interface VideoHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  /** Persists the star and mirrors it into the inline grid's job list. */
  onSetFavorite: (jobId: number, isFavorited: boolean) => void
}

const TABS: Array<{ id: VideoHistoryTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'favorites', label: 'Favorites' },
]

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

export function VideoHistoryModal({ isOpen, onClose, onSetFavorite }: VideoHistoryModalProps) {
  const {
    tab, setTab, search, setSearch, clips, hasMore,
    isLoading, isLoadingMore, error, loadMore, applyFavorite, isSearching,
  } = useVideoHistoryBrowser(isOpen)

  if (!isOpen) return null

  const handleToggleFavorite = (clip: VideoJob) => {
    const next = !clip.isFavorited
    applyFavorite(clip.jobId, next)
    onSetFavorite(clip.jobId, next)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <Card className="bg-zinc-900 border-[#c99850]/30 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between gap-4 p-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-white">Videos</h2>
            <p className="text-xs text-zinc-400">Every clip you have generated</p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
            {TABS.map((option) => (
              <button
                key={option.id}
                onClick={() => setTab(option.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  tab === option.id
                    ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <Button onClick={onClose} size="sm" variant="ghost" className="text-zinc-400 hover:text-white" title="Close">
            <X className="w-4 h-4" />
          </Button>
        </div>

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
                <VideoHistoryCard key={clip.jobId} clip={clip} onToggleFavorite={handleToggleFavorite} />
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
