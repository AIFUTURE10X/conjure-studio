import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { apiError, parseJson } from '@/lib/api/http'
import { extractJson } from '@/lib/api/extract-json'
import {
  continuityAssessmentSchema,
  directorBriefSchema,
  llmShotSchema,
  videoConceptSchema,
  type LlmShot,
  type VideoConcept,
} from '@/lib/video/photo-director-schema'
import { gateConcepts } from '@/lib/video/director-assembly'
import { CONCEPTS_PROMPT, STORYBOARD_PROMPT } from '@/lib/video/director-prompts'
import {
  generateOpenAIText,
  isOpenAIAuthError,
  isOpenAIRateLimitError,
} from "@/lib/openai-text-client"

export const runtime = "nodejs"
export const maxDuration = 120

/**
 * POST /api/plan-photo-video — the Photo Director's planning turns. Text-only
 * (photos are never re-sent after analysis); one route, two stages:
 *   - 'concepts':  corrected analysis + brief → 3-5 gated concept cards
 *   - 'storyboard': approved concept → shot list (camera enum + motionCore)
 * The continuity gate and prompt assembly are deterministic code in
 * lib/video/director-assembly.ts — the LLM never sets `disabled` and never
 * writes camera fragments or preservation blocks.
 *
 * Planning is free (no credit guard), matching generate-script/plan-broll.
 */

const analysisSummarySchema = z.string().trim().min(20).max(6000)

const conceptsBodySchema = z.object({
  stage: z.literal('concepts'),
  analysisSummary: analysisSummarySchema,
  continuity: continuityAssessmentSchema,
  brief: directorBriefSchema,
})

const storyboardBodySchema = z.object({
  stage: z.literal('storyboard'),
  analysisSummary: analysisSummarySchema,
  brief: directorBriefSchema,
  concept: videoConceptSchema,
  photoCatalog: z.array(z.object({
    index: z.number().int().min(0),
    label: z.string().max(120),
    isDerivedCrop: z.boolean(),
  })).min(1).max(12),
  constraintSubjects: z.array(z.string().max(200)).max(40),
})

const bodySchema = z.discriminatedUnion('stage', [conceptsBodySchema, storyboardBodySchema])

const conceptsResponseSchema = z.object({ concepts: z.array(videoConceptSchema).min(3).max(5) })
const storyboardResponseSchema = z.object({ shots: z.array(llmShotSchema).min(1).max(5) })

/** Unique, stable concept ids even when the LLM repeats or omits them. */
function snapConcepts(concepts: VideoConcept[]): VideoConcept[] {
  const seen = new Set<string>()
  return concepts.map((concept, index) => {
    let id = concept.id.trim() || `concept-${index + 1}`
    while (seen.has(id)) id = `${id}-${index + 1}`
    seen.add(id)
    return { ...concept, id, disabled: false, disabledReason: undefined }
  })
}

/** Clamp photo indices; end frames only survive on continuous-transition concepts. */
function snapShots(shots: LlmShot[], photoCount: number, allowEndFrame: boolean): LlmShot[] {
  const clampIndex = (index: number) => Math.min(Math.max(index, 0), photoCount - 1)
  return shots.map((shot) => {
    const sourcePhotoIndex = clampIndex(shot.sourcePhotoIndex)
    const rawEnd = shot.endPhotoIndex
    const endPhotoIndex = allowEndFrame && typeof rawEnd === 'number' && clampIndex(rawEnd) !== sourcePhotoIndex
      ? clampIndex(rawEnd)
      : null
    return { ...shot, sourcePhotoIndex, endPhotoIndex }
  })
}

export async function POST(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.helper)
  if (rateLimited) return rateLimited

  const parsed = await parseJson(request, bodySchema)
  if (parsed.response) return parsed.response
  const body = parsed.data

  try {
    if (body.stage === 'concepts') {
      const raw = await generateOpenAIText(
        CONCEPTS_PROMPT(body.analysisSummary, body.continuity, body.brief),
        { maxOutputTokens: 4000 },
      )
      const { concepts } = conceptsResponseSchema.parse(extractJson(raw))
      return NextResponse.json({ concepts: gateConcepts(snapConcepts(concepts), body.continuity) })
    }

    const raw = await generateOpenAIText(
      STORYBOARD_PROMPT(body.analysisSummary, body.brief, body.concept, body.photoCatalog, body.constraintSubjects),
      { maxOutputTokens: 4000 },
    )
    const { shots } = storyboardResponseSchema.parse(extractJson(raw))
    return NextResponse.json({
      shots: snapShots(shots, body.photoCatalog.length, body.concept.structure === 'continuous-transition'),
    })
  } catch (error) {
    console.error("[photo-director] Planning failed:", error)
    if (isOpenAIRateLimitError(error)) {
      return apiError(429, "rate_limited", "The AI is busy — try again in a minute")
    }
    if (isOpenAIAuthError(error)) {
      return apiError(500, "provider_auth", "OpenAI API key is missing or invalid")
    }
    return apiError(500, "plan_failed", "Could not build the plan — try adjusting your answers and retrying")
  }
}
