import { VIDEO_MODELS, type VideoModelId } from '@/lib/video/providers'

/** Shared clip presentation helpers, used by both the result card and the history modal. */

const TOOL_MODEL_LABELS: Record<string, string> = {
  'kling-lipsync': 'Kling Lip Sync',
  'seedvr-upscale': 'SeedVR2 Enhance',
  'film-assembly': 'Film Assembly',
}

/** Human label for a clip's model, covering post-production tools as well as generators. */
export function modelLabel(model: string): string {
  return VIDEO_MODELS[model as VideoModelId]?.label ?? TOOL_MODEL_LABELS[model] ?? model
}

/** Download a clip through a blob so the file saves instead of navigating to it. */
export async function downloadClip(videoUrl: string, jobId: number): Promise<void> {
  const response = await fetch(videoUrl)
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `conjure-video-${jobId}.mp4`
  link.click()
  URL.revokeObjectURL(url)
}
