import { VIDEO_MODELS, type VideoModelId, type VideoResolution } from './providers'
import { videoGenerationCost, VIDEO_TOOL_COSTS } from '../credits/cost-map'
import { cameraFragment, type CameraMove } from './camera-moves'
import type {
  ContinuityAssessment,
  CreditEstimate,
  ModelRecommendation,
  PlannedRender,
  PreservationConstraint,
  RenderPhase,
  VideoConcept,
} from './photo-director-schema'

/**
 * Deterministic core of the Photo Director. Everything here is pure and shared
 * by client and server, so prompt assembly, concept gating, model choice, and
 * credit estimates are code — testable by scripts/check-director-assembly.cjs —
 * not LLM behavior. User constraint edits propagate to every shot's prompt
 * automatically because prompts are assembled from the CURRENT constraints at
 * preview/submit time, never stored.
 */

/** Always-on negatives appended to every shot, after the per-constraint lines. */
export const STANDING_NEGATIVES =
  'No morphing, no replacement furniture, no new objects, no people, no camera rotation, no structural changes, and no invented exterior details.'

/**
 * Render the PRESERVE/DO-NOT block from the working constraint set.
 * 'must' constraints come before 'should'; empty input → empty string.
 */
export function buildPreservationBlock(constraints: PreservationConstraint[]): string {
  if (constraints.length === 0) return ''
  const ordered = [...constraints].sort((a, b) => {
    if (a.severity === b.severity) return 0
    return a.severity === 'must' ? -1 : 1
  })
  const preserveLines = ordered.map((c) => `- ${c.subject}: ${c.requirement}`)
  const negativeLines = ordered.map((c) => `- ${c.negativePhrase}`)
  return [
    'Preserve exactly as photographed:',
    ...preserveLines,
    'Never:',
    ...negativeLines,
    STANDING_NEGATIVES,
  ].join('\n')
}

export interface AssembleMotionPromptInput {
  model: VideoModelId
  cameraMove: CameraMove
  motionCore: string
  durationSeconds: number
  mood?: string
  constraints: PreservationConstraint[]
}

/**
 * Full production motion prompt for one shot: model-tuned camera fragment,
 * the LLM's subject/lighting motion, mood, then the preservation block.
 * Throws on a near-empty motionCore so a generic prompt can never ship.
 */
export function assembleMotionPrompt(input: AssembleMotionPromptInput): string {
  const core = input.motionCore.trim()
  if (core.length < 10) {
    throw new Error('motionCore is too short — every shot needs a specific motion description')
  }
  const parts = [cameraFragment(input.model, input.cameraMove), core]
  const mood = input.mood?.trim()
  if (mood) parts.push(`Mood: ${mood}.`)
  parts.push(`Duration ${input.durationSeconds} seconds, slow and restrained pacing throughout.`)
  const block = buildPreservationBlock(input.constraints)
  if (block) parts.push(block)
  return parts.join(' ')
}

/** Snap a shot duration to the model's supported list (nearest option). */
export function snapDurationToModel(model: VideoModelId, durationSeconds: number): number {
  const durations = VIDEO_MODELS[model]?.capabilities.durations
  if (!durations || durations.length === 0) return durationSeconds
  return durations.reduce((best, option) =>
    Math.abs(option - durationSeconds) < Math.abs(best - durationSeconds) ? option : best)
}

/** Snap a resolution exactly the way /api/generate-video does. */
export function snapResolutionToModel(model: VideoModelId, resolution: VideoResolution): VideoResolution {
  const resolutions = VIDEO_MODELS[model]?.capabilities.resolutions
  if (!resolutions || resolutions.length === 0) return resolution
  return resolutions.includes(resolution) ? resolution : resolutions[resolutions.length - 1]
}

/**
 * Credit estimate for a set of planned renders. Durations and resolutions are
 * snapped BEFORE pricing — the same values the client submits — so the number
 * on the button equals the debit (BrollCard precedent).
 */
export function estimateDirectorCredits(
  renders: PlannedRender[],
  options: { includeAssembly: boolean },
): CreditEstimate {
  const perShot = renders.map((render) => ({
    shotId: render.shotId,
    model: render.model,
    credits: videoGenerationCost(
      render.model,
      snapDurationToModel(render.model, render.durationSeconds),
      snapResolutionToModel(render.model, render.resolution),
      render.withAudio,
    ),
  }))
  const assembly = options.includeAssembly ? VIDEO_TOOL_COSTS.filmAssembly : 0
  const total = perShot.reduce((sum, shot) => sum + shot.credits, 0) + assembly
  return { perShot, assembly, total }
}

/**
 * Continuity gate: when a continuous photo-to-photo transition is geometrically
 * unsafe, DISABLE that concept with an explanation instead of merely flagging
 * it — non-technical users pick the pretty option regardless of a warning badge.
 */
export function gateConcepts(concepts: VideoConcept[], continuity: ContinuityAssessment): VideoConcept[] {
  const unsafe = continuity.riskLevel === 'high' || continuity.sameLocationConfidence < 0.6
  if (!unsafe) return concepts
  const why = continuity.riskReasons.length > 0
    ? continuity.riskReasons.join(' ')
    : 'The two photos do not share enough visible geometry for a safe continuous camera move.'
  return concepts.map((concept) =>
    concept.structure === 'continuous-transition'
      ? {
          ...concept,
          disabled: true,
          disabledReason: `A continuous transition between these photos risks distorting the real room. ${why} Separately animated shots are the safe choice here.`,
        }
      : concept,
  )
}

export interface RenderableShot {
  endPhotoId?: string | null
}

/**
 * Draft/final model recommendation. Draft-first is the spine: everything drafts
 * on the cheapest capable model. seedance-fast cannot take an end frame, so
 * transition shots draft on seedance-2 at 480p (still ~4x cheaper than a Veo
 * final). Finals: Veo 3.1 has a dedicated first+last-frame endpoint, making it
 * the transition specialist; everything else finals on Seedance 2.0.
 */
export function recommendRender(shot: RenderableShot, phase: RenderPhase): ModelRecommendation {
  const usesEndFrame = Boolean(shot.endPhotoId)
  if (phase === 'draft') {
    if (usesEndFrame) {
      return {
        model: 'seedance-2',
        resolution: '480p',
        reason: 'Cheapest end-frame-capable model for testing this transition (the draft model cannot take an end frame).',
        usesEndFrame: true,
      }
    }
    return {
      model: 'seedance-fast',
      resolution: '720p',
      reason: 'Cheap, fast draft to judge the motion before spending on a final render.',
      usesEndFrame: false,
    }
  }
  if (usesEndFrame) {
    return {
      model: 'veo-3.1',
      resolution: '1080p',
      reason: 'Veo 3.1 has a dedicated first-to-last-frame mode — the strongest choice for a photo-to-photo transition.',
      usesEndFrame: true,
    }
  }
  return {
    model: 'seedance-2',
    resolution: '1080p',
    reason: 'High-quality final render with audio support at a mid-tier price.',
    usesEndFrame: false,
  }
}
