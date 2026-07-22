"use client"

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useImageGeneration, type GenerationModel } from '../../../hooks/useImageGeneration'
import type { SubmitVideoOptions } from '../useVideoGeneration'
import type { VideoSettingsValue } from '../../../constants/video-settings-defaults'
import { VIDEO_MODELS, type VideoModelId, type VideoResolution } from '@/lib/video/providers'

/**
 * Script → B-roll state machine: transcript → AI "motivated moments" (editable
 * beats) → silent cutaway clips queued through the normal video pipeline.
 *
 * Each beat runs in one of two modes. "quick" goes straight to text-to-video on
 * the cheapest model so a big fan-out can't rack up Veo-tier cost by accident.
 * "hero" is opt-in: generate an art-directed keyframe first (Story Mode's image
 * path), then animate that still as the clip's start frame. Both stay silent so
 * they sit under a voiceover, and both stay on Seedance Fast.
 */

export type BrollMode = 'quick' | 'hero'

export interface BrollBeat {
  id: number
  /** Verbatim transcript line this cutaway covers (for editor placement). */
  sourcePhrase: string
  keyword: string
  videoPrompt: string
  durationSeconds: number
  videoQueued: boolean
  /** quick = direct text-to-video; hero = image-first (keyframe → animate). */
  mode: BrollMode
  /** Hero keyframe URL, once generated. */
  frameUrl: string | null
  frameStatus: 'none' | 'generating' | 'done' | 'failed'
}

/** B-roll is definitionally quick, cheap cutaway drafts. */
export const BROLL_MODEL: VideoModelId = 'seedance-fast'

interface UseBrollPlanOptions {
  settings: VideoSettingsValue
  aspectRatio: string
  selectedModel: GenerationModel
  submitVideo: (options: SubmitVideoOptions) => Promise<boolean>
}

export function useBrollPlan({ settings, aspectRatio, selectedModel, submitVideo }: UseBrollPlanOptions) {
  const [beats, setBeats] = useState<BrollBeat[]>([])
  const [isPlanning, setIsPlanning] = useState(false)
  const [isFraming, setIsFraming] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  // Standalone engine instance: hero keyframes stay in beat state instead of
  // appending to the image-mode grid (same rationale as Story Mode).
  const { generateImages } = useImageGeneration()

  const frameAspect = aspectRatio === 'auto' ? '16:9' : aspectRatio

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
      // the eventual debit. Beats default to quick mode (client-side only —
      // the planner route doesn't know about modes or frames).
      type PlannedBeat = Omit<BrollBeat, 'id' | 'videoQueued' | 'mode' | 'frameUrl' | 'frameStatus'>
      setBeats((data.plan.beats as PlannedBeat[]).map((beat, index) => ({
        ...beat,
        durationSeconds: snapDuration(beat.durationSeconds),
        id: index + 1,
        videoQueued: false,
        mode: 'quick' as BrollMode,
        frameUrl: null,
        frameStatus: 'none' as const,
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

  /** Flip a beat between quick and hero; drop a stale frame when going back to quick. */
  const setBeatMode = useCallback((id: number, mode: BrollMode) => {
    setBeats((prev) => prev.map((beat) => (beat.id === id
      ? { ...beat, mode, ...(mode === 'quick' ? { frameUrl: null, frameStatus: 'none' as const } : {}) }
      : beat)))
  }, [])

  const removeBeat = useCallback((id: number) => {
    setBeats((prev) => prev.filter((beat) => beat.id !== id))
  }, [])

  const clearPlan = useCallback(() => setBeats([]), [])

  /** Generate the hero keyframe for one beat (reuses the image studio engine). */
  const generateFrameFor = useCallback(async (beat: BrollBeat): Promise<void> => {
    setBeats((prev) => prev.map((b) => (b.id === beat.id ? { ...b, frameStatus: 'generating' } : b)))
    try {
      const imgs = await generateImages({
        prompt: beat.videoPrompt,
        count: 1,
        aspectRatio: frameAspect,
        model: selectedModel,
        imageSize: '1K',
        imageQuality: 'medium',
      })
      const url = imgs?.[0]?.url
      if (!url) throw new Error('No frame returned')
      setBeats((prev) => prev.map((b) => (b.id === beat.id ? { ...b, frameUrl: url, frameStatus: 'done' } : b)))
    } catch (error) {
      console.error(`[broll] Frame failed for beat ${beat.id}:`, error)
      setBeats((prev) => prev.map((b) => (b.id === beat.id ? { ...b, frameStatus: 'failed' } : b)))
    }
  }, [generateImages, frameAspect, selectedModel])

  /** Generate frames for every hero beat that still needs one (skips in-flight). */
  const generateAllFrames = useCallback(async () => {
    const need = beats.filter((beat) =>
      beat.mode === 'hero' && (beat.frameStatus === 'none' || beat.frameStatus === 'failed'))
    if (need.length === 0) {
      toast.info('All hero beats already have a frame')
      return
    }
    setIsFraming(true)
    try {
      // Sequential (like clip generation): a 12–16 frame batch fired in parallel
      // would burst past the image route's 10-per-minute limit and 429 the tail.
      for (const beat of need) await generateFrameFor(beat)
    } finally {
      setIsFraming(false)
    }
  }, [beats, generateFrameFor])

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
        // A hero beat with no frame is skipped, not silently sent to text-to-video —
        // so mode always matches what the user sees.
        if (beat.mode === 'hero' && !beat.frameUrl) continue
        const ok = await submitVideo({
          prompt: beat.videoPrompt,
          model: BROLL_MODEL,
          duration: snapDuration(beat.durationSeconds),
          resolution,
          aspectRatio,
          generateAudio: false,
          startFrameUrl: beat.mode === 'hero' ? beat.frameUrl : undefined,
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
    isFraming,
    isGenerating,
    planBroll,
    updateBeat,
    setBeatMode,
    removeBeat,
    clearPlan,
    generateFrameFor,
    generateAllFrames,
    generateAllClips,
  }
}
