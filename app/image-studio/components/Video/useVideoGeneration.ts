"use client"

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getUserId } from '@/lib/user-id'
import { logPromptUse } from '@/lib/prompt-log'
import { imageUrlToImageFile } from '../../utils/annotation-reference'
import { VIDEO_MODELS, type VideoModelId, type VideoResolution } from '@/lib/video/providers'
import { VIDEO_COMPLETED_EVENT } from '../../constants/concierge-tree'

/**
 * Video job state: submit to /api/generate-video, poll the status route
 * until each pending job completes, and hydrate recent jobs from
 * /api/video-history on mount so a refresh resumes pending polling.
 */

export interface VideoJob {
  jobId: number
  status: 'pending' | 'completed' | 'failed'
  prompt: string
  model: string
  videoUrl: string | null
  error: string | null
  startImageUrl: string | null
  timestamp: number
  // Clip settings, kept so Extend can reuse them.
  durationSeconds: number | null
  resolution: string | null
  aspectRatio: string | null
  hasAudio: boolean
  isFavorited?: boolean
}

export interface SubmitVideoOptions {
  prompt: string
  model: VideoModelId
  duration: number
  resolution: VideoResolution
  aspectRatio: string
  generateAudio: boolean
  startFrameUrl?: string | null
  endFrameUrl?: string | null
  /** Native extension (Veo): existing clip URL to append to. */
  extendVideoUrl?: string | null
}

const POLL_INTERVAL_MS = 5000

export function useVideoGeneration() {
  const [jobs, setJobs] = useState<VideoJob[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  // Hydrate recent jobs once; pending rows resume polling automatically.
  useEffect(() => {
    let cancelled = false
    fetch(`/api/video-history?userId=${encodeURIComponent(getUserId())}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !Array.isArray(data?.videos)) return
        setJobs(data.videos as VideoJob[])
      })
      .catch((error) => console.error('[video] History load failed:', error))
      .finally(() => { if (!cancelled) setHistoryLoaded(true) })
    return () => { cancelled = true }
  }, [])

  const pendingKey = jobs.filter((job) => job.status === 'pending').map((job) => job.jobId).join(',')

  useEffect(() => {
    if (!pendingKey) return
    const pendingIds = pendingKey.split(',').map(Number)
    let cancelled = false

    const tick = async () => {
      for (const jobId of pendingIds) {
        try {
          const response = await fetch(
            `/api/generate-video/status?jobId=${jobId}&userId=${encodeURIComponent(getUserId())}`,
          )
          if (!response.ok || cancelled) continue
          const data = await response.json()
          if (data.status === 'pending' || !data.status) continue

          setJobs((current) => current.map((job) => (
            job.jobId === jobId
              ? { ...job, status: data.status, videoUrl: data.videoUrl ?? null, error: data.error ?? null }
              : job
          )))
          if (data.status === 'completed') {
            toast.success('Video ready')
            window.dispatchEvent(new CustomEvent(VIDEO_COMPLETED_EVENT))
          } else {
            toast.error(data.error || 'Video generation failed')
          }
        } catch (error) {
          console.error(`[video] Poll failed for job ${jobId}:`, error)
        }
      }
    }

    const interval = setInterval(tick, POLL_INTERVAL_MS)
    return () => { cancelled = true; clearInterval(interval) }
  }, [pendingKey])

  const submitVideo = useCallback(async (options: SubmitVideoOptions): Promise<boolean> => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('userId', getUserId())
      formData.append('prompt', options.prompt)
      formData.append('model', options.model)
      formData.append('duration', options.duration.toString())
      formData.append('resolution', options.resolution)
      formData.append('aspectRatio', options.aspectRatio)
      formData.append('generateAudio', options.generateAudio ? 'true' : 'false')

      if (options.extendVideoUrl) {
        formData.append('extendVideoUrl', options.extendVideoUrl)
      } else if (options.startFrameUrl) {
        formData.append('startFrame', await imageUrlToImageFile(options.startFrameUrl, `video-start-${Date.now()}.png`))
        if (options.endFrameUrl) {
          formData.append('endFrame', await imageUrlToImageFile(options.endFrameUrl, `video-end-${Date.now()}.png`))
        }
      }

      const response = await fetch('/api/generate-video', { method: 'POST', body: formData })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || `Failed to start video (${response.status})`)
      }

      setJobs((current) => [
        {
          jobId: data.jobId as number,
          status: 'pending',
          prompt: options.prompt,
          model: options.model,
          videoUrl: null,
          error: null,
          startImageUrl: options.startFrameUrl ?? null,
          timestamp: Date.now(),
          durationSeconds: options.duration,
          resolution: options.resolution,
          aspectRatio: options.aspectRatio,
          hasAudio: options.generateAudio,
        },
        ...current,
      ])
      toast.success('Video generation started — this can take a few minutes')
      logPromptUse(options.prompt, 'video')
      return true
    } catch (error) {
      console.error('[video] Submit failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start video')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  /**
   * Make a finished clip longer. Veo appends to the same file via its native
   * extend endpoint (~+7s per pass); other models continue as a new clip
   * whose start frame is the source clip's captured last frame.
   */
  const extendVideo = useCallback(async (
    job: VideoJob,
    extensionPrompt: string,
    lastFrameDataUrl?: string,
  ): Promise<boolean> => {
    const model = VIDEO_MODELS[job.model as VideoModelId]
    if (!model || !job.videoUrl) {
      toast.error('This clip cannot be extended')
      return false
    }

    const resolution = (job.resolution as VideoResolution) || '1080p'
    const shared = {
      prompt: extensionPrompt,
      model: model.id,
      resolution,
      aspectRatio: job.aspectRatio || 'auto',
      generateAudio: job.hasAudio,
    }

    if (model.extendMode === 'native') {
      return submitVideo({ ...shared, duration: 7, extendVideoUrl: job.videoUrl })
    }

    if (!lastFrameDataUrl) {
      toast.error('Could not capture the last frame of this clip')
      return false
    }
    return submitVideo({ ...shared, duration: job.durationSeconds || 5, startFrameUrl: lastFrameDataUrl })
  }, [submitVideo])

  /** Prepend a pending post-production job (lipsync/enhance) returned by its API. */
  const addPendingJob = useCallback((jobId: number, prompt: string, model: string, sourceJob: VideoJob) => {
    setJobs((current) => [
      {
        jobId,
        status: 'pending' as const,
        prompt,
        model,
        videoUrl: null,
        error: null,
        startImageUrl: sourceJob.startImageUrl,
        timestamp: Date.now(),
        durationSeconds: sourceJob.durationSeconds,
        resolution: sourceJob.resolution,
        aspectRatio: sourceJob.aspectRatio,
        hasAudio: model === 'kling-lipsync' ? true : sourceJob.hasAudio,
      },
      ...current,
    ])
  }, [])

  const submitLipSync = useCallback(async (
    job: VideoJob,
    payload: { mode: 'text'; text: string; voiceId: string; voiceLanguage: 'en' | 'zh' } | { mode: 'audio'; audioFile: File },
  ): Promise<boolean> => {
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
    options: {
      narration?: { text: string; engine: 'elevenlabs' | 'kling'; voiceId: string }
      musicStyleId?: string
    },
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

  const cancelJob = useCallback(async (job: VideoJob): Promise<boolean> => {
    try {
      const response = await fetch('/api/generate-video/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: getUserId(), jobId: job.jobId }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        // 409 too_late: the clip finished — leave it pending so the next poll lands it.
        throw new Error(data?.error?.message || data?.error || `Cancel failed (${response.status})`)
      }
      setJobs((current) => current.map((item) => (
        item.jobId === job.jobId
          ? { ...item, status: 'failed' as const, error: 'Canceled — credits refunded' }
          : item
      )))
      toast.success('Generation canceled — credits refunded')
      return true
    } catch (error) {
      console.error(`[video] Cancel failed for job ${job.jobId}:`, error)
      toast.error(error instanceof Error ? error.message : 'Could not cancel the job')
      return false
    }
  }, [])

  const toggleFavorite = useCallback((job: VideoJob) => {
    const next = !job.isFavorited
    setJobs((current) => current.map((item) => (
      item.jobId === job.jobId ? { ...item, isFavorited: next } : item
    )))
    void fetch('/api/video-history', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: getUserId(), jobId: job.jobId, isFavorited: next }),
    }).catch((error) => console.error('[video] Favorite toggle failed:', error))
  }, [])

  return {
    jobs,
    isSubmitting,
    historyLoaded,
    hasPendingJobs: pendingKey.length > 0,
    submitVideo,
    extendVideo,
    cancelJob,
    toggleFavorite,
    submitLipSync,
    submitEnhance,
    submitAssembleFilm,
  }
}
