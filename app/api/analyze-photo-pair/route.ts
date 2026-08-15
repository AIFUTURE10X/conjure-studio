import { type NextRequest, NextResponse } from "next/server"
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { apiError, parseFormData } from '@/lib/api/http'
import { extractJson } from '@/lib/api/extract-json'
import { multiPhotoAnalysisSchema, type MultiPhotoAnalysis } from '@/lib/video/photo-director-schema'
import { ANALYZE_PHOTOS_PROMPT } from '@/lib/video/director-prompts'
import {
  generateOpenAIMultiVisionText,
  isOpenAIAuthError,
  isOpenAIRateLimitError,
} from "@/lib/openai-text-client"

export const runtime = "nodejs"
export const maxDuration = 120

/**
 * POST /api/analyze-photo-pair — the Photo Director's joint analysis. Takes
 * 2-6 photos as multipart Files (never data URLs in JSON — payload trap) and
 * returns a zod-validated MultiPhotoAnalysis with observed/inferred/suggested
 * tiers, a continuity verdict, and a preservation constraint list.
 *
 * Planning is free (no credit guard) — consistent with generate-script and
 * plan-broll; only clip generation spends credits.
 */

const MIN_PHOTOS = 2
const MAX_PHOTOS = 6
const MAX_PHOTO_BYTES = 8 * 1024 * 1024

/** Clamp photo index references and repair degenerate open/close picks. */
function snapAnalysis(analysis: MultiPhotoAnalysis, photoCount: number): MultiPhotoAnalysis {
  const clampIndex = (index: number) => Math.min(Math.max(index, 0), photoCount - 1)
  const clampObservation = <T extends { photoIndices: number[] }>(item: T): T => ({
    ...item,
    photoIndices: [...new Set(item.photoIndices.map(clampIndex))],
  })
  const opening = clampIndex(analysis.bestOpeningPhotoIndex)
  let closing = clampIndex(analysis.bestClosingPhotoIndex)
  if (closing === opening && photoCount > 1) {
    closing = opening === photoCount - 1 ? 0 : photoCount - 1
  }
  return {
    ...analysis,
    observed: analysis.observed.map(clampObservation),
    inferred: analysis.inferred.map(clampObservation),
    bestOpeningPhotoIndex: opening,
    bestClosingPhotoIndex: closing,
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.helper)
  if (rateLimited) return rateLimited

  const parsedForm = await parseFormData(request)
  if (parsedForm.response) return parsedForm.response

  const files = parsedForm.data.getAll('photos').filter((entry): entry is File => entry instanceof File)
  if (files.length < MIN_PHOTOS || files.length > MAX_PHOTOS) {
    return apiError(400, 'invalid_request', `Send between ${MIN_PHOTOS} and ${MAX_PHOTOS} photos`)
  }
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      return apiError(400, 'invalid_request', `"${file.name}" is not an image`)
    }
    if (file.size === 0 || file.size > MAX_PHOTO_BYTES) {
      return apiError(400, 'invalid_request', `"${file.name}" is empty or over ${Math.round(MAX_PHOTO_BYTES / 1024 / 1024)}MB`)
    }
  }

  try {
    const images = await Promise.all(files.map(async (file) => ({
      base64: Buffer.from(await file.arrayBuffer()).toString('base64'),
      mimeType: file.type,
    })))

    const raw = await generateOpenAIMultiVisionText({
      prompt: ANALYZE_PHOTOS_PROMPT(files.length),
      images,
      options: { maxOutputTokens: 5000 },
    })

    const analysis = snapAnalysis(multiPhotoAnalysisSchema.parse(extractJson(raw)), files.length)
    return NextResponse.json({ analysis })
  } catch (error) {
    console.error("[photo-director] Analysis failed:", error)
    if (isOpenAIRateLimitError(error)) {
      return apiError(429, "rate_limited", "The AI is busy — try again in a minute")
    }
    if (isOpenAIAuthError(error)) {
      return apiError(500, "provider_auth", "OpenAI API key is missing or invalid")
    }
    return apiError(500, "analysis_failed", "Could not analyze the photos together — try clearer, well-lit photos")
  }
}
