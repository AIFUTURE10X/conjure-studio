"use client"

import { Check, Download, Heart, Loader2, Pencil, Plus, Trash2, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { modelLabel, downloadClip } from '../video-clip-utils'
import type { VideoJob } from '../useVideoGeneration'

interface VideoHistoryCardProps {
  clip: VideoJob
  onToggleFavorite: (clip: VideoJob) => void | Promise<void>
  isSelected: boolean
  onToggleSelect: (jobId: number) => void
  onDelete: (clip: VideoJob) => void | Promise<void>
  /** True while a delete covering this clip is in flight. */
  isDeleting: boolean
  isOnBoard: boolean
  onAddToBoard: (clip: VideoJob) => void
  onEditMetadata: (clip: VideoJob) => void
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">{children}</span>
  )
}

/**
 * Compact archive row. Post-production (Extend / Lip Sync / Enhance / Save
 * Template) deliberately stays on the inline grid — starting a job from a modal
 * would drop the result behind the overlay the user is still looking at.
 */
export function VideoHistoryCard({
  clip, onToggleFavorite, isSelected, onToggleSelect, onDelete, isDeleting, isOnBoard, onAddToBoard, onEditMetadata,
}: VideoHistoryCardProps) {
  const isFailed = clip.status === 'failed'
  const isPending = clip.status === 'pending'
  const canDownload = clip.status === 'completed' && Boolean(clip.videoUrl)
  // The endpoint refuses a row that is still generating (it holds a credit
  // reservation), so neither the checkbox nor the delete control is offered.
  const canDelete = !isPending

  return (
    <div
      className={`flex gap-3 p-3 rounded-lg border transition-colors ${
        isFailed ? 'bg-zinc-900/40 border-zinc-800 opacity-60' : 'bg-zinc-900 border-zinc-800 hover:border-[#c99850]/40'
      } ${isSelected ? 'ring-2 ring-[#c99850]' : ''} ${isDeleting ? 'opacity-50' : ''}`}
    >
      {canDelete && (
        <div className="flex items-start pt-1 shrink-0">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(clip.jobId)}
            disabled={isDeleting}
            aria-label="Select clip"
            className="border-[#c99850] data-[state=checked]:bg-[#c99850] data-[state=checked]:border-[#c99850]"
          />
        </div>
      )}

      <div className="w-40 shrink-0 aspect-video rounded-md overflow-hidden bg-black flex items-center justify-center">
        {canDownload ? (
          <video src={clip.videoUrl ?? undefined} controls preload="metadata" className="w-full h-full object-contain" />
        ) : isPending ? (
          <Loader2 className="w-5 h-5 text-[#dbb56e] animate-spin" />
        ) : (
          <TriangleAlert className="w-5 h-5 text-red-400" />
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {clip.title && <h3 className="text-sm font-semibold text-white line-clamp-1 break-words">{clip.title}</h3>}
        <p className={`${clip.title ? 'text-xs text-zinc-400' : 'text-sm text-white'} line-clamp-2 break-words`}>{clip.prompt}</p>

        <div className="flex flex-wrap gap-1">
          {clip.category && <MetaChip>{clip.category}</MetaChip>}
          {clip.tags?.map((tag) => <MetaChip key={tag}>#{tag}</MetaChip>)}
          <MetaChip>{modelLabel(clip.model)}</MetaChip>
          {clip.durationSeconds != null && <MetaChip>{clip.durationSeconds}s</MetaChip>}
          {clip.resolution && <MetaChip>{clip.resolution}</MetaChip>}
          {clip.aspectRatio && <MetaChip>{clip.aspectRatio}</MetaChip>}
          {isPending && <MetaChip>Generating…</MetaChip>}
        </div>

        {isFailed && clip.error && (
          <p className="text-xs text-red-400 line-clamp-2 break-words">{clip.error}</p>
        )}

        <p className="text-[11px] text-zinc-500 mt-auto">{dateFormatter.format(new Date(clip.timestamp))}</p>
      </div>

      <div className="flex flex-col gap-1 shrink-0">
        {canDownload && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => onEditMetadata(clip)}
                aria-label="Edit title, category, and tags"
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-zinc-500 hover:text-[#dbb56e]"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Edit title, category, and tags</TooltipContent>
          </Tooltip>
        )}

        {canDownload && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => onAddToBoard(clip)}
                aria-label={isOnBoard ? 'View board' : 'Add to board'}
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-[#dbb56e] hover:text-[#f0d49b] border border-[#c99850]/30"
              >
                {isOnBoard
                  ? <Check className="w-3.5 h-3.5 mr-1" />
                  : <Plus className="w-3.5 h-3.5 mr-1" />}
                {isOnBoard ? 'View board' : 'Add to board'}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {isOnBoard ? 'Close the library and return to this clip' : 'Add back to the video board'}
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => void onToggleFavorite(clip)}
              size="sm"
              variant="ghost"
              className={`h-8 w-8 p-0 ${clip.isFavorited ? 'text-[#dbb56e] hover:text-[#c99850]' : 'text-zinc-500 hover:text-white'}`}
            >
              <Heart className="w-4 h-4" fill={clip.isFavorited ? 'currentColor' : 'none'} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {clip.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          </TooltipContent>
        </Tooltip>

        {canDownload && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => void downloadClip(clip.videoUrl as string, clip.jobId)}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-zinc-500 hover:text-white"
              >
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Download MP4</TooltipContent>
          </Tooltip>
        )}

        {canDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => void onDelete(clip)}
                disabled={isDeleting}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-zinc-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Trash2 className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Delete from history</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
