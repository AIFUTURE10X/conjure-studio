"use client"

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Download, Heart, ListPlus, Loader2, Mic, TriangleAlert, Wand2 } from 'lucide-react'
import { ExtendVideoDialog } from './ExtendVideoDialog'
import { LipSyncDialog, type LipSyncPayload } from './LipSyncDialog'
import { VIDEO_MODELS, type VideoModelId } from '@/lib/video/providers'
import type { VideoJob } from './useVideoGeneration'

interface VideoResultCardProps {
  job: VideoJob
  onExtend?: (job: VideoJob, extensionPrompt: string, lastFrameDataUrl?: string) => Promise<boolean>
  onToggleFavorite?: (job: VideoJob) => void
  onLipSync?: (job: VideoJob, payload: LipSyncPayload) => Promise<boolean>
  onEnhance?: (job: VideoJob, targetResolution: '1080p' | '1440p' | '2160p') => Promise<boolean>
}

const TOOL_MODEL_LABELS: Record<string, string> = {
  'kling-lipsync': 'Kling Lip Sync',
  'seedvr-upscale': 'SeedVR2 Enhance',
}

function modelLabel(model: string): string {
  return VIDEO_MODELS[model as VideoModelId]?.label ?? TOOL_MODEL_LABELS[model] ?? model
}

export function VideoResultCard({ job, onExtend, onToggleFavorite, onLipSync, onEnhance }: VideoResultCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showExtend, setShowExtend] = useState(false)
  const [showLipSync, setShowLipSync] = useState(false)
  const [showEnhanceMenu, setShowEnhanceMenu] = useState(false)
  const model = VIDEO_MODELS[job.model as VideoModelId]
  const isNativeExtend = model?.extendMode === 'native'

  const handleDownload = async () => {
    if (!job.videoUrl) return
    const response = await fetch(job.videoUrl)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `conjure-video-${job.jobId}.mp4`
    link.click()
    URL.revokeObjectURL(url)
  }

  /** Seek to the end and capture the final frame (needs crossOrigin on the video). */
  const captureLastFrame = (): Promise<string> => new Promise((resolve, reject) => {
    const video = videoRef.current
    if (!video || !video.videoWidth) {
      reject(new Error('Video not loaded yet — press play once, then try again'))
      return
    }
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked)
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d')!.drawImage(video, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } catch (error) {
        reject(new Error('Could not read video frame (cross-origin block)'))
      }
    }
    video.addEventListener('seeked', onSeeked)
    video.currentTime = Math.max(0, (video.duration || 0) - 0.05)
  })

  const handleExtendConfirm = async (extensionPrompt: string) => {
    if (!onExtend) return
    try {
      if (isNativeExtend) {
        await onExtend(job, extensionPrompt)
      } else {
        const frame = await captureLastFrame()
        await onExtend(job, extensionPrompt, frame)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to extend video')
    }
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
      {job.status === 'completed' && job.videoUrl && (
        <video
          ref={videoRef}
          src={job.videoUrl}
          controls
          playsInline
          preload="metadata"
          crossOrigin="anonymous"
          poster={job.startImageUrl ?? undefined}
          className="w-full max-h-[420px] bg-black"
        />
      )}

      {job.status === 'pending' && (
        <div className="relative">
          {job.startImageUrl ? (
            <img src={job.startImageUrl} alt="Start frame" className="w-full max-h-[420px] object-contain bg-black opacity-40" />
          ) : (
            <div className="h-40 bg-black" />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-[#dbb56e] animate-spin" />
            <p className="text-xs text-zinc-300">Generating video… this can take a few minutes</p>
          </div>
        </div>
      )}

      {job.status === 'failed' && (
        <div className="p-4 flex items-start gap-2 bg-red-900/20">
          <TriangleAlert className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-red-300 font-medium">Video generation failed</p>
            <p className="text-xs text-red-400/80 mt-0.5">{job.error || 'Unknown error'} — any charged credits were refunded.</p>
          </div>
        </div>
      )}

      <div className="p-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-zinc-300 truncate" title={job.prompt}>{job.prompt}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            {modelLabel(job.model)}
            {job.durationSeconds ? ` · ${job.durationSeconds}s` : ''} · {new Date(job.timestamp).toLocaleString()}
          </p>
        </div>
        {job.status === 'completed' && job.videoUrl && (
          <div className="flex gap-2 shrink-0">
            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(job)}
                title={job.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
                  job.isFavorited
                    ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                    : 'bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-zinc-700'
                }`}
              >
                <Heart className="w-3.5 h-3.5" fill={job.isFavorited ? 'currentColor' : 'none'} />
              </button>
            )}
            {onLipSync && (
              <Button
                onClick={() => setShowLipSync(true)}
                size="sm"
                className="bg-zinc-800 text-[#dbb56e] hover:bg-zinc-700 px-2"
                title="Lip Sync — make the person in this clip speak (typed text or uploaded audio)"
              >
                <Mic className="w-3 h-3" />
              </Button>
            )}
            {onEnhance && (
              <div className="relative">
                <Button
                  onClick={() => setShowEnhanceMenu(!showEnhanceMenu)}
                  size="sm"
                  className="bg-zinc-800 text-[#dbb56e] hover:bg-zinc-700 px-2"
                  title="Enhance — AI-upscale this clip (SeedVR2)"
                >
                  <Wand2 className="w-3 h-3" />
                </Button>
                {showEnhanceMenu && (
                  <div className="absolute bottom-full right-0 mb-1 w-36 rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl z-40 p-1 space-y-0.5">
                    {(['1080p', '1440p', '2160p'] as const).map((res) => (
                      <button
                        key={res}
                        onClick={() => { setShowEnhanceMenu(false); void onEnhance(job, res) }}
                        className="w-full text-left px-2 py-1.5 rounded-md text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
                      >
                        Upscale to {res === '2160p' ? '4K' : res}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {onExtend && model && (
              <Button
                onClick={() => setShowExtend(true)}
                size="sm"
                className="bg-zinc-800 text-[#dbb56e] hover:bg-zinc-700"
                title={isNativeExtend
                  ? 'Append ~7s to this clip (same file) — repeat up to ~2 minutes'
                  : 'Continue from the last frame as a new part'}
              >
                <ListPlus className="w-3 h-3 mr-1" />
                Extend
              </Button>
            )}
            <Button
              onClick={handleDownload}
              size="sm"
              className="bg-[#c99850] text-black hover:bg-[#dbb56e]"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          </div>
        )}
      </div>

      <ExtendVideoDialog
        isOpen={showExtend}
        onOpenChange={setShowExtend}
        isNativeExtend={isNativeExtend}
        modelLabel={modelLabel(job.model)}
        onConfirm={handleExtendConfirm}
      />

      {onLipSync && (
        <LipSyncDialog
          isOpen={showLipSync}
          onOpenChange={setShowLipSync}
          onConfirm={async (payload) => { await onLipSync(job, payload) }}
        />
      )}
    </div>
  )
}
