"use client"

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  recordShotJob,
  setDirectorStep,
  updateDirectorShot,
  useDirectorProject,
} from './useDirectorProject'
import { constraintsForShot, orderedShots, plannedRenderFor } from './render-plan'
import { aspectForPurpose } from '../../../constants/photo-director'
import { assembleMotionPrompt } from '@/lib/video/director-assembly'
import { CALMER_MOVE } from '@/lib/video/camera-moves'
import type { RenderPhase, StoryboardShot } from '@/lib/video/photo-director-schema'
import type { SubmitVideoOptions } from '../useVideoGeneration'

interface UseDirectorGenerationOptions {
  submitVideo: (options: SubmitVideoOptions) => Promise<number | null>
}

/**
 * Turns the approved storyboard into clips through the existing video
 * pipeline. Sequential submits (parallel would burst the generation rate
 * limit — the B-roll precedent), `Shot N/M —` prompt prefixes so the
 * Assemble Film dialog auto-preselects, and exact shot↔job linking via the
 * returned jobId. Draft-first: this hook is only ever called from the
 * preflight's "Approve and generate" or the per-shot review controls.
 */
export function useDirectorGeneration({ submitVideo }: UseDirectorGenerationOptions) {
  const project = useDirectorProject()
  const [isGenerating, setIsGenerating] = useState(false)

  const submitShot = useCallback(async (
    shot: StoryboardShot,
    index: number,
    total: number,
    phase: RenderPhase,
  ): Promise<number | null> => {
    if (!project?.brief) return null
    const render = plannedRenderFor(project, shot, phase)
    const source = project.photos.find((photo) => photo.id === shot.sourcePhotoId)
    if (!source?.dataUrl) {
      toast.error(`Shot ${index + 1}: its source photo is missing — re-attach it in the Photos step`)
      return null
    }
    const end = shot.endPhotoId ? project.photos.find((photo) => photo.id === shot.endPhotoId) : null

    let prompt: string
    try {
      prompt = assembleMotionPrompt({
        model: render.model,
        cameraMove: shot.cameraMove,
        motionCore: shot.motionCore,
        durationSeconds: render.durationSeconds,
        mood: shot.mood,
        constraints: constraintsForShot(project, shot),
      })
    } catch {
      toast.error(`Shot ${index + 1}: write a longer motion description first`)
      return null
    }

    const jobId = await submitVideo({
      prompt: `Shot ${index + 1}/${total} — ${shot.title}: ${prompt}`,
      model: render.model,
      duration: render.durationSeconds,
      resolution: render.resolution,
      aspectRatio: aspectForPurpose(project.brief.purpose),
      generateAudio: render.withAudio,
      startFrameUrl: source.dataUrl,
      endFrameUrl: end?.dataUrl || null,
    })
    if (jobId !== null) recordShotJob(shot.id, jobId, phase)
    return jobId
  }, [project, submitVideo])

  /** The preflight's "Approve and generate": one draft per shot without one. */
  const generateDrafts = useCallback(async (): Promise<void> => {
    if (!project) return
    const shots = orderedShots(project)
    setIsGenerating(true)
    setDirectorStep('generate')
    try {
      let started = 0
      for (const [index, shot] of shots.entries()) {
        const existing = project.shotJobs[shot.id]?.draftJobIds ?? []
        if (existing.length > 0) continue
        const jobId = await submitShot(shot, index, shots.length, 'draft')
        if (jobId !== null) started += 1
      }
      if (started > 0) toast.success(`${started} draft clip${started === 1 ? '' : 's'} queued`)
    } finally {
      setIsGenerating(false)
    }
  }, [project, submitShot])

  /** Re-run one shot's draft; optionally calm the camera move first. */
  const regenerateShot = useCallback(async (shotId: string, options?: { reduceMovement?: boolean }): Promise<void> => {
    if (!project) return
    const shots = orderedShots(project)
    const index = shots.findIndex((shot) => shot.id === shotId)
    if (index === -1) return
    let shot = shots[index]
    if (options?.reduceMovement) {
      const calmer = CALMER_MOVE[shot.cameraMove]
      updateDirectorShot(shotId, { cameraMove: calmer })
      shot = { ...shot, cameraMove: calmer }
    }
    setIsGenerating(true)
    try {
      await submitShot(shot, index, shots.length, 'draft')
    } finally {
      setIsGenerating(false)
    }
  }, [project, submitShot])

  /** Per-shot final upgrade — its own explicit spend, after draft approval. */
  const generateFinal = useCallback(async (shotId: string): Promise<void> => {
    if (!project) return
    const shots = orderedShots(project)
    const index = shots.findIndex((shot) => shot.id === shotId)
    if (index === -1) return
    setIsGenerating(true)
    try {
      await submitShot(shots[index], index, shots.length, 'final')
    } finally {
      setIsGenerating(false)
    }
  }, [project, submitShot])

  return { generateDrafts, regenerateShot, generateFinal, isGenerating }
}
