"use client"

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useImageGeneration, type GenerationModel } from '../../../hooks/useImageGeneration'
import { useHelperBridge, type StoryPlanShot } from '../../../context/HelperBridgeProvider'
import type { SubmitVideoOptions } from '../useVideoGeneration'
import type { VideoSettingsValue } from '../../../constants/video-settings-defaults'
import { VIDEO_MODELS } from '@/lib/video/providers'

/**
 * Story Mode state machine: idea → script (editable shots) → start frames
 * (batched image gen) → clips (queued through the normal video pipeline).
 */

export interface StoryShot {
  id: number
  title: string
  framePrompt: string
  motionPrompt: string
  durationSeconds: number
  frameUrl: string | null
  frameStatus: 'none' | 'generating' | 'done' | 'failed'
  videoQueued: boolean
}

interface UseStoryModeOptions {
  settings: VideoSettingsValue
  aspectRatio: string
  selectedModel: GenerationModel
  submitVideo: (options: SubmitVideoOptions) => Promise<boolean>
}

export function useStoryMode({ settings, aspectRatio, selectedModel, submitVideo }: UseStoryModeOptions) {
  const { improveWithHelper, registerStoryPlanApplier } = useHelperBridge()
  const [storyTitle, setStoryTitle] = useState('')
  const [shots, setShots] = useState<StoryShot[]>([])
  const [isWritingScript, setIsWritingScript] = useState(false)
  const [isGeneratingFrames, setIsGeneratingFrames] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  // Standalone engine instance: story frames stay in story state instead of
  // appending to the image-mode grid.
  const { generateImages } = useImageGeneration()

  const writeScript = useCallback(async (idea: string, shotCount: number) => {
    setIsWritingScript(true)
    try {
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, shotCount }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Script generation failed')
      setStoryTitle(data.script.title as string)
      setShots((data.script.shots as Array<Omit<StoryShot, 'id' | 'frameUrl' | 'frameStatus' | 'videoQueued'>>).map((shot, index) => ({
        ...shot,
        id: index + 1,
        frameUrl: null,
        frameStatus: 'none',
        videoQueued: false,
      })))
      toast.success('Shot plan ready — review and edit, then generate frames')
    } catch (error) {
      console.error('[story] Script failed:', error)
      toast.error(error instanceof Error ? error.message : 'Could not write the script')
    } finally {
      setIsWritingScript(false)
    }
  }, [])

  const updateShot = useCallback((id: number, patch: Partial<Pick<StoryShot, 'title' | 'framePrompt' | 'motionPrompt' | 'durationSeconds'>>) => {
    setShots((prev) => prev.map((shot) => (shot.id === id ? { ...shot, ...patch } : shot)))
  }, [])

  const removeShot = useCallback((id: number) => {
    setShots((prev) => prev.filter((shot) => shot.id !== id))
  }, [])

  const frameAspect = aspectRatio === 'auto' ? '16:9' : aspectRatio

  const generateFrameFor = useCallback(async (shot: StoryShot): Promise<void> => {
    setShots((prev) => prev.map((s) => (s.id === shot.id ? { ...s, frameStatus: 'generating' } : s)))
    try {
      const imgs = await generateImages({
        prompt: shot.framePrompt,
        count: 1,
        aspectRatio: frameAspect,
        model: selectedModel,
        imageSize: '1K',
        imageQuality: 'medium',
      })
      const url = imgs?.[0]?.url
      if (!url) throw new Error('No frame returned')
      setShots((prev) => prev.map((s) => (s.id === shot.id ? { ...s, frameUrl: url, frameStatus: 'done' } : s)))
    } catch (error) {
      console.error(`[story] Frame failed for shot ${shot.id}:`, error)
      setShots((prev) => prev.map((s) => (s.id === shot.id ? { ...s, frameStatus: 'failed' } : s)))
    }
  }, [generateImages, frameAspect, selectedModel])

  const generateAllFrames = useCallback(async () => {
    const pending = shots.filter((shot) => shot.frameStatus === 'none' || shot.frameStatus === 'failed')
    if (pending.length === 0) return
    setIsGeneratingFrames(true)
    try {
      await Promise.all(pending.map((shot) => generateFrameFor(shot)))
    } finally {
      setIsGeneratingFrames(false)
    }
  }, [shots, generateFrameFor])

  /** Snap a requested duration to the closest the current model supports. */
  const snapDuration = useCallback((seconds: number) => {
    const durations = VIDEO_MODELS[settings.model].capabilities.durations
    return durations.reduce((best, option) =>
      Math.abs(option - seconds) < Math.abs(best - seconds) ? option : best)
  }, [settings.model])

  const animateAll = useCallback(async () => {
    const ready = shots.filter((shot) => shot.frameUrl && !shot.videoQueued)
    if (ready.length === 0) {
      toast.info('No shots ready — generate frames first')
      return
    }
    setIsAnimating(true)
    try {
      const total = shots.length
      for (const shot of ready) {
        const ok = await submitVideo({
          prompt: `Shot ${shot.id}/${total} — ${shot.title}: ${shot.motionPrompt}`,
          model: settings.model,
          duration: snapDuration(shot.durationSeconds),
          resolution: settings.resolution,
          aspectRatio: frameAspect,
          generateAudio: settings.generateAudio,
          startFrameUrl: shot.frameUrl,
        })
        if (ok) {
          setShots((prev) => prev.map((s) => (s.id === shot.id ? { ...s, videoQueued: true } : s)))
        }
      }
      toast.success(`${ready.length} shot${ready.length === 1 ? '' : 's'} queued — clips appear below as they finish`)
    } finally {
      setIsAnimating(false)
    }
  }, [shots, submitVideo, settings, snapDuration, frameAspect])

  const clearStory = useCallback(() => {
    setStoryTitle('')
    setShots([])
  }, [])

  /**
   * The AI helper can hand back a revised plan. Merge by position: shots
   * whose framePrompt is unchanged keep their generated frame; changed or
   * new shots reset so "Generate frames" fills only what actually changed.
   */
  useEffect(() => {
    registerStoryPlanApplier((revised: StoryPlanShot[]) => {
      setShots((prev) => revised.map((shot, index) => {
        const existing = prev[index]
        const frameStillValid = existing && existing.framePrompt.trim() === shot.framePrompt.trim()
        return {
          ...shot,
          id: index + 1,
          frameUrl: frameStillValid ? existing.frameUrl : null,
          frameStatus: frameStillValid ? existing.frameStatus : 'none',
          videoQueued: frameStillValid ? existing.videoQueued : false,
        }
      }))
    })
    return () => registerStoryPlanApplier(null)
  }, [registerStoryPlanApplier])

  /** Send the current plan to the video helper chat for conversational revision. */
  const refineWithHelper = useCallback(() => {
    if (shots.length === 0) return
    const plan = shots.map(({ title, framePrompt, motionPrompt, durationSeconds }) => ({
      title, framePrompt, motionPrompt, durationSeconds,
    }))
    improveWithHelper(
      `Here is my current Story Mode shot plan titled “${storyTitle}” (JSON):\n${JSON.stringify(plan)}\n\nReview it as a director: tighten weak shots, strengthen continuity and pacing, and return the complete revised plan.`,
    )
    toast.info('Plan sent to the AI helper — chat there to refine it, then press Apply')
  }, [shots, storyTitle, improveWithHelper])

  return {
    storyTitle,
    shots,
    isWritingScript,
    isGeneratingFrames,
    isAnimating,
    writeScript,
    updateShot,
    removeShot,
    generateFrameFor,
    generateAllFrames,
    animateAll,
    clearStory,
    refineWithHelper,
  }
}
