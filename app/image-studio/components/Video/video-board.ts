import type { VideoJob } from './useVideoGeneration'

/** Add an archived clip to the working board without duplicating a live card. */
export function addVideoToBoard(current: VideoJob[], clip: VideoJob): VideoJob[] {
  if (current.some((job) => job.jobId === clip.jobId)) return current
  return [clip, ...current]
}
