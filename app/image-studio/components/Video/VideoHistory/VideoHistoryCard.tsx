"use client"

import { Download, Heart, Loader2, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { modelLabel, downloadClip } from '../video-clip-utils'
import type { VideoJob } from '../useVideoGeneration'

interface VideoHistoryCardProps {
  clip: VideoJob
  onToggleFavorite: (clip: VideoJob) => void | Promise<void>
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
export function VideoHistoryCard({ clip, onToggleFavorite }: VideoHistoryCardProps) {
  const isFailed = clip.status === 'failed'
  const isPending = clip.status === 'pending'
  const canDownload = clip.status === 'completed' && Boolean(clip.videoUrl)

  return (
    <div
      className={`flex gap-3 p-3 rounded-lg border transition-colors ${
        isFailed ? 'bg-zinc-900/40 border-zinc-800 opacity-60' : 'bg-zinc-900 border-zinc-800 hover:border-[#c99850]/40'
      }`}
    >
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
        <p className="text-sm text-white line-clamp-2 break-words">{clip.prompt}</p>

        <div className="flex flex-wrap gap-1">
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
      </div>
    </div>
  )
}
