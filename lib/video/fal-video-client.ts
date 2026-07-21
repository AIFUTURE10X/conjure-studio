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

/**
 * fal's ApiError puts the real reason in body.detail and leaves message as
 * the bare HTTP status text — so an exhausted account surfaced to users as
 * just "Forbidden". Unwrap the detail so callers report something actionable.
 */
function falErrorMessage(error: unknown): string {
  const status = (error as { status?: number })?.status
  const detail = (error as { body?: { detail?: unknown } })?.body?.detail

  let text: string
  if (typeof detail === "string") {
    text = detail
  } else if (Array.isArray(detail)) {
    // 422 validation errors arrive as [{ loc, msg, type }, ...]
    text = detail
      .map((item) => (item && typeof item === "object" && "msg" in item
        ? String((item as { msg: unknown }).msg)
        : String(item)))
      .join("; ")
  } else {
    text = error instanceof Error ? error.message : String(error)
  }

  if (status === 403 && /exhausted balance|user is locked/i.test(text)) {
    return "The video provider (fal.ai) is out of credit — top up at fal.ai/dashboard/billing, then try again."
  }
  return text
}

/** Run a fal call, replacing its opaque error with the underlying reason. */
async function withFalErrors<T>(endpoint: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (error) {
    console.error(`[fal] ${endpoint} failed:`, error)
    throw new Error(falErrorMessage(error))
  }
}

/** Upload a frame image to fal storage; returns a URL fal endpoints accept. */
export async function uploadFrameToFal(file: File): Promise<string> {
  configureFal()
  return await withFalErrors('storage.upload', () => fal.storage.upload(file))
}

/** Submit a video job to the fal queue; returns the request id for polling. */
export async function submitVideoJob(
  endpoint: string,
  input: Record<string, unknown>,
): Promise<string> {
  configureFal()
  const { request_id: requestId } = await withFalErrors(endpoint, () => fal.queue.submit(endpoint, { input }))
  if (!requestId) throw new Error("fal queue submit returned no request id")
  return requestId
}

/**
 * Run a fast fal endpoint synchronously (TTS, music, ffmpeg merge) and
 * return its result data. Used by multi-step pipelines like film assembly
 * where intermediate outputs feed the next call.
 */
export async function runFalDirect(
  endpoint: string,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  configureFal()
  const result = await withFalErrors(endpoint, () => fal.subscribe(endpoint, { input, logs: false }))
  const data = (result as { data?: unknown })?.data ?? result
  if (!data || typeof data !== "object") {
    throw new Error(`fal ${endpoint} returned no data`)
  }
  return data as Record<string, unknown>
}

/** Pull a media URL out of the varying fal output shapes ({video:{url}}, {audio:{url}}, {url}, {video_url}). */
export function extractMediaUrl(data: Record<string, unknown>): string {
  for (const key of ["video", "audio", "image"]) {
    const media = data[key]
    if (media && typeof media === "object") {
      const url = (media as { url?: unknown }).url
      if (typeof url === "string") return url
    }
  }
  if (typeof data.url === "string") return data.url
  if (typeof data.video_url === "string") return data.video_url
  if (typeof data.audio_url === "string") return data.audio_url
  throw new Error("Could not extract a media URL from the fal response")
}

/**
 * Ask the fal queue to cancel a submitted job. fal only guarantees
 * cancellation while the job is still IN_QUEUE; an IN_PROGRESS render may
 * finish anyway, so callers should treat success here as "stop billing the
 * user", not "the GPU stopped".
 */
export async function cancelVideoJob(endpoint: string, requestId: string): Promise<void> {
  configureFal()
  await withFalErrors(endpoint, () => fal.queue.cancel(endpoint, { requestId }))
}

export type FalQueueStatus = "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED"

/** Current queue status of a video job. Throws if fal reports the job as errored. */
export async function getVideoJobStatus(
  endpoint: string,
  requestId: string,
): Promise<FalQueueStatus> {
  configureFal()
  const status = await withFalErrors(endpoint, () => fal.queue.status(endpoint, { requestId, logs: false }))
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
  const result = await withFalErrors(endpoint, () => fal.queue.result(endpoint, { requestId }))
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
    // ffmpeg compose returns { video_url } instead of a File object.
    const composeUrl = (data as { video_url?: unknown }).video_url
    if (typeof composeUrl === "string") {
      return { videoUrl: composeUrl, contentType: "video/mp4" }
    }
  }

  throw new Error("Could not extract video URL from fal response")
}
