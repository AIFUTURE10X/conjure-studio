/**
 * lib/video/fal-video-client.ts
 * Queue-based fal.ai client for video generation.
 *
 * Video jobs take 30s–minutes, so requests never block on them: submit
 * returns a request id, and the status route polls until the queue reports
 * COMPLETED. Mirrors the FAL_KEY config pattern in lib/fal-bg-removal.ts.
 */

import { fal } from "@fal-ai/client"

function configureFal(): void {
  const apiKey = process.env.FAL_KEY
  if (!apiKey) {
    throw new Error("FAL_KEY environment variable is not set")
  }
  fal.config({ credentials: apiKey })
}

/** Upload a frame image to fal storage; returns a URL fal endpoints accept. */
export async function uploadFrameToFal(file: File): Promise<string> {
  configureFal()
  return await fal.storage.upload(file)
}

/** Submit a video job to the fal queue; returns the request id for polling. */
export async function submitVideoJob(
  endpoint: string,
  input: Record<string, unknown>,
): Promise<string> {
  configureFal()
  const { request_id: requestId } = await fal.queue.submit(endpoint, { input })
  if (!requestId) throw new Error("fal queue submit returned no request id")
  return requestId
}

export type FalQueueStatus = "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED"

/** Current queue status of a video job. Throws if fal reports the job as errored. */
export async function getVideoJobStatus(
  endpoint: string,
  requestId: string,
): Promise<FalQueueStatus> {
  configureFal()
  const status = await fal.queue.status(endpoint, { requestId, logs: false })
  return status.status as FalQueueStatus
}

/**
 * Fetch the finished video URL, tolerating response-shape differences
 * (subscribe/result return { data: { video: { url } } } for video models).
 */
export async function getVideoJobResult(
  endpoint: string,
  requestId: string,
): Promise<{ videoUrl: string; contentType: string }> {
  configureFal()
  const result = await fal.queue.result(endpoint, { requestId })
  const data = (result as { data?: unknown })?.data ?? result

  if (data && typeof data === "object") {
    const video = (data as { video?: unknown }).video
    if (video && typeof video === "object") {
      const url = (video as { url?: unknown }).url
      if (typeof url === "string") {
        const contentType = (video as { content_type?: unknown }).content_type
        return {
          videoUrl: url,
          contentType: typeof contentType === "string" ? contentType : "video/mp4",
        }
      }
    }
    const directUrl = (data as { url?: unknown }).url
    if (typeof directUrl === "string") {
      return { videoUrl: directUrl, contentType: "video/mp4" }
    }
  }

  throw new Error("Could not extract video URL from fal response")
}
