import { useCallback } from 'react'
import { toast } from 'sonner'
import { getUserId } from '@/lib/user-id'
import type { LipSyncPayload } from './LipSyncDialog'
import type { VideoJob } from './useVideoGeneration'

/**
 * Post-production jobs that take a finished clip and make another one: lip sync,
 * upscale, and multi-clip film assembly.
 *
 * Split out of useVideoGeneration, which owns generation and polling — these
 * three only need somewhere to register the pending job they create, so they take
 * `addPendingJob` rather than reaching into state they do not own. Keeping them
 * here holds both files under the 300-line limit in app/image-studio/CLAUDE.md.
 */

export interface AssembleFilmOptions {
  narration?: { text: string; engine: 'elevenlabs' | 'kling'; voiceId: string }
  musicStyleId?: string
}

type AddPendingJob = (jobId: number, prompt: string, model: string, sourceJob: VideoJob) => void

export function useVideoPostProduction(addPendingJob: AddPendingJob) {
  const submitLipSync = useCallback(async (job: VideoJob, payload: LipSyncPayload): Promise<boolean> => {
    if (!job.videoUrl) return false
    try {
      const formData = new FormData()
      formData.append('userId', getUserId())
      formData.append('videoUrl', job.videoUrl)
      formData.append('mode', payload.mode)
      if (payload.mode === 'text') {
        formData.append('text', payload.text)
        formData.append('voiceId', payload.voiceId)
        formData.append('voiceLanguage', payload.voiceLanguage)
      } else {
        formData.append('audio', payload.audioFile)
      }
      const response = await fetch('/api/lipsync', { method: 'POST', body: formData })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || `Lip sync failed (${response.status})`)
      addPendingJob(data.jobId as number, payload.mode === 'text' ? `Lip sync: “${payload.text}”` : 'Lip sync (uploaded audio)', 'kling-lipsync', job)
      toast.success('Lip sync started — this can take a few minutes')
      return true
    } catch (error) {
      console.error('[video] Lip sync failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start lip sync')
      return false
    }
  }, [addPendingJob])

  const submitEnhance = useCallback(async (job: VideoJob, targetResolution: '1080p' | '1440p' | '2160p'): Promise<boolean> => {
    if (!job.videoUrl) return false
    try {
      const response = await fetch('/api/enhance-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: getUserId(), videoUrl: job.videoUrl, targetResolution }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || `Enhance failed (${response.status})`)
      addPendingJob(data.jobId as number, `Enhanced (upscaled to ${targetResolution})`, 'seedvr-upscale', job)
      toast.success('Enhance started — this can take a few minutes')
      return true
    } catch (error) {
      console.error('[video] Enhance failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start enhance')
      return false
    }
  }, [addPendingJob])

  const submitAssembleFilm = useCallback(async (
    selectedJobs: VideoJob[],
    options: AssembleFilmOptions,
  ): Promise<boolean> => {
    const clips = selectedJobs
      .filter((job) => job.videoUrl)
      .map((job) => ({ url: job.videoUrl as string, durationSeconds: job.durationSeconds ?? 5 }))
    if (clips.length < 2) {
      toast.error('Pick at least two finished clips')
      return false
    }
    try {
      const response = await fetch('/api/assemble-film', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getUserId(),
          clips,
          narration: options.narration,
          music: options.musicStyleId ? { styleId: options.musicStyleId } : undefined,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || `Film assembly failed (${response.status})`)
      const label = `Film: ${clips.length} clips` +
        (options.narration ? ' · narrated' : '') +
        (options.musicStyleId && options.musicStyleId !== 'none' ? ' · music' : '')
      addPendingJob(data.jobId as number, label, 'film-assembly', selectedJobs[0])
      toast.success('Assembling your film — narration and music are being generated')
      return true
    } catch (error) {
      console.error('[video] Film assembly failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to assemble film')
      return false
    }
  }, [addPendingJob])

  return { submitLipSync, submitEnhance, submitAssembleFilm }
}
