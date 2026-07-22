"use client"

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { SubmitVideoOptions } from '../useVideoGeneration'
import type { VideoSettingsValue } from '../../../constants/video-settings-defaults'
import { VIDEO_MODELS, type VideoModelId, type VideoResolution } from '@/lib/video/providers'

/**
 * Script → B-roll state machine: transcript → AI "motivated moments" (editable
 * beats) → silent cutaway clips queued through the normal video pipeline.
 *
 * Simpler than Story Mode — no start-frame step. Clips go straight to
 * text-to-video on the cheapest model so a big fan-out can't rack up Veo-tier
 * cost by accident, and stay silent so they sit under a voiceover.
 */

export interface BrollBeat {
  id: number
  /** Verbatim transcript line this cutaway covers (for editor placement). */
  sourcePhrase: string
  keyword: string
  videoPrompt: string
  durationSeconds: number
  videoQueued: boolean
}

/** B-roll is definitionally quick, cheap cutaway drafts. */
export const BROLL_MODEL: VideoModelId = 'seedance-fast'

interface UseBrollPlanOptions {
  settings: VideoSettingsValue
  aspectRatio: string
  submitVideo: (options: SubmitVideoOptions) => Promise<boolean>
}

export function useBrollPlan({ settings, aspectRatio, submitVideo }: UseBrollPlanOptions) {
  const [beats, setBeats] = useState<BrollBeat[]>([])
  const [isPlanning, setIsPlanning] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  /** Snap a requested duration to the closest the B-roll model supports. */
  const snapDuration = useCallback((seconds: number) => {
    const durations = VIDEO_MODELS[BROLL_MODEL].capabilities.durations
    return durations.reduce((best, option) =>
      Math.abs(option - seconds) < Math.abs(best - seconds) ? option : best)
  }, [])

  const planBroll = useCallback(async (transcript: string, beatCount: number) => {
    setIsPlanning(true)
    try {
      const response = await fetch('/api/plan-broll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, beatCount }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'B-roll planning failed')
      // Snap AI durations to model-supported values up front so the duration
      // dropdown always has a matching option and the credit estimate equals
      // the eventual debit.
      setBeats((data.plan.beats as Array<Omit<BrollBeat, 'id' | 'videoQueued'>>).map((beat, index) => ({
        ...beat,
        durationSeconds: snapDuration(beat.durationSeconds),
        id: index + 1,
        videoQueued: false,
      })))
      toast.success('B-roll plan ready — review the moments, then generate clips')
    } catch (error) {
      console.error('[broll] Plan failed:', error)
      toast.error(error instanceof Error ? error.message : 'Could not plan B-roll')
    } finally {
      setIsPlanning(false)
    }
  }, [snapDuration])

  const updateBeat = useCallback((id: number, patch: Partial<Pick<BrollBeat, 'keyword' | 'videoPrompt' | 'durationSeconds'>>) => {
    setBeats((prev) => prev.map((beat) => (beat.id === id ? { ...beat, ...patch } : beat)))
  }, [])

  const removeBeat = useCallback((id: number) => {
    setBeats((prev) => prev.filter((beat) => beat.id !== id))
  }, [])

  const clearPlan = useCallback(() => setBeats([]), [])

  // Seedance Fast maxes at 1080p; cap so the credit guard can't charge the 4K
  // multiplier for a resolution the route will snap down anyway.
  const resolution: VideoResolution = settings.resolution === '4k' ? '1080p' : settings.resolution

  const generateAllClips = useCallback(async () => {
    const ready = beats.filter((beat) => !beat.videoQueued)
    if (ready.length === 0) {
      toast.info('All beats are already queued')
      return
    }
    setIsGenerating(true)
    try {
      let queued = 0
      for (const beat of ready) {
        const ok = await submitVideo({
          prompt: beat.videoPrompt,
          model: BROLL_MODEL,
          duration: snapDuration(beat.durationSeconds),
          resolution,
          aspectRatio,
          generateAudio: false,
        })
        if (ok) {
          queued += 1
          setBeats((prev) => prev.map((b) => (b.id === beat.id ? { ...b, videoQueued: true } : b)))
        }
      }
      // Failed submits already raised their own error toasts in submitVideo.
      if (queued === ready.length) {
        toast.success(`${queued} B-roll clip${queued === 1 ? '' : 's'} queued — they appear in the Videos list below`)
      } else if (queued > 0) {
        toast.info(`${queued} of ${ready.length} clips queued — the rest stay editable above, so fix and retry`)
      }
    } finally {
      setIsGenerating(false)
    }
  }, [beats, submitVideo, snapDuration, resolution, aspectRatio])

  return {
    beats,
    isPlanning,
    isGenerating,
    planBroll,
    updateBeat,
    removeBeat,
    clearPlan,
    generateAllClips,
  }
}
