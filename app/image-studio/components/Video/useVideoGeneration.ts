"use client"

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getUserId } from '@/lib/user-id'
import { imageUrlToImageFile } from '../../utils/annotation-reference'
import { VIDEO_MODELS, type VideoModelId, type VideoResolution } from '@/lib/video/providers'

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

  return {
    jobs,
    isSubmitting,
    historyLoaded,
    hasPendingJobs: pendingKey.length > 0,
    submitVideo,
    extendVideo,
  }
}
