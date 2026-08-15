import { z } from 'zod'
import type { VideoModelId, VideoResolution } from './providers'
import { CAMERA_MOVES, type CameraMove } from './camera-moves'

/** Normalize LLM phrasing ("Push In", "push_in") onto the strict vocabulary. */
export const cameraMoveSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toLowerCase().replace(/[\s_]+/g, '-') : value),
  z.enum(CAMERA_MOVES),
)

/**
 * Risk tiers as LLMs actually emit them ("very low", "Low-Medium") snapped to
 * the strict enum; unrecognizable values land on the cautious middle.
 */
const riskTierSchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value
  const lowered = value.toLowerCase()
  if (lowered.includes('high')) return 'high'
  if (lowered.includes('med')) return 'medium'
  if (lowered.includes('low')) return 'low'
  return value
}, z.enum(['low', 'medium', 'high']).catch('medium'))

/**
 * Photo Director types — zod-first so the confidence tiers, camera vocabulary,
 * and preservation constraints are ENFORCED at the API boundary, not hoped for
 * in a prompt. Routes .parse() with these; the client imports the inferred
 * types. No React, no side effects.
 */

// ---------------------------------------------------------------------------
// Photos (client-side references; photos travel to the server as Files)
// ---------------------------------------------------------------------------

export const photoReferenceSchema = z.object({
  id: z.string(),
  /** Full-resolution data URL. May be '' after a quota-constrained reload. */
  dataUrl: z.string(),
  /** Small (≤384px) thumbnail data URL — always persisted. */
  thumbUrl: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** User label, e.g. "bed side". */
  label: z.string().max(80).optional(),
  isDerivedCrop: z.boolean().default(false),
  sourcePhotoId: z.string().optional(),
  cropRect: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }).optional(),
})

export type PhotoReference = z.infer<typeof photoReferenceSchema>

// ---------------------------------------------------------------------------
// Joint analysis (observed / inferred / suggested tiers)
// ---------------------------------------------------------------------------

export const observationSchema = z.object({
  id: z.string(),
  /** Short claim, e.g. "king bed with white linens". */
  label: z.string().min(1).max(160),
  detail: z.string().max(500).catch(''),
  /** 0-based indices of the photos this claim is visible in. */
  photoIndices: z.array(z.number().int().min(0)).min(1),
  confidence: z.number().min(0).max(1).catch(0.5),
})

export type ObservedFeature = z.infer<typeof observationSchema>

export const preservationConstraintSchema = z.object({
  id: z.string(),
  /** What must stay true, e.g. "floor-to-ceiling window, right wall". */
  subject: z.string().min(1).max(160),
  requirement: z.string().min(1).max(400),
  /** Ready-to-append negative, e.g. "do not add extra windows". */
  negativePhrase: z.string().min(1).max(300),
  severity: z.enum(['must', 'should']).catch('must'),
  source: z.enum(['ai', 'user']).default('ai'),
})

export type PreservationConstraint = z.infer<typeof preservationConstraintSchema>

export const continuityAssessmentSchema = z.object({
  sameLocationConfidence: z.number().min(0).max(1),
  viewpointRelation: z.enum(['same-view', 'adjacent-angles', 'opposite-angles', 'different-rooms', 'unclear']).catch('unclear'),
  /** ids of observed features shared between photos. */
  sharedObjectIds: z.array(z.string()).catch([]),
  riskLevel: riskTierSchema,
  riskReasons: z.array(z.string().max(400)).catch([]),
  recommendSeparateShots: z.boolean(),
})

export type ContinuityAssessment = z.infer<typeof continuityAssessmentSchema>

export const multiPhotoAnalysisSchema = z.object({
  /** Directly visible facts — the only tier the UI renders as fact. */
  observed: z.array(observationSchema).min(1),
  /** Probable but not directly visible — rendered as "likely, confirm?". */
  inferred: z.array(observationSchema).catch([]),
  /** Creative ideas, clearly hypothetical. */
  suggested: z.array(z.object({ id: z.string(), idea: z.string().max(400) })).catch([]),
  continuity: continuityAssessmentSchema,
  bestOpeningPhotoIndex: z.number().int().min(0),
  bestClosingPhotoIndex: z.number().int().min(0),
  framingRationale: z.string().max(600).catch(''),
  preservation: z.array(preservationConstraintSchema).min(1),
})

export type MultiPhotoAnalysis = z.infer<typeof multiPhotoAnalysisSchema>

// ---------------------------------------------------------------------------
// Brief (plain-language Q&A answers — a client form, validated on the server)
// ---------------------------------------------------------------------------

export const conceptStructureSchema = z.enum(['continuous-transition', 'two-shot', 'multi-shot-reel', 'single-shot'])
export type ConceptStructure = z.infer<typeof conceptStructureSchema>

export const directorBriefSchema = z.object({
  purpose: z.enum(['reel', 'tiktok', 'fb-ad', 'listing', 'hero', 'other']),
  goal: z.enum(['showcase-room', 'highlight-view', 'luxury-atmosphere', 'drive-bookings', 'explain-features', 'quick-tour', 'calm-lifestyle']),
  durationBucket: z.enum(['6-8', '10-15', '20-30']),
  mood: z.enum(['peaceful-morning', 'warm-welcoming', 'premium-boutique', 'romantic', 'bright-practical', 'cinematic', 'ai-choose']),
  structure: z.union([conceptStructureSchema, z.literal('ai-recommend')]),
  toggles: z.object({
    titleText: z.boolean(),
    captions: z.boolean(),
    cta: z.boolean(),
    music: z.boolean(),
    ambient: z.boolean(),
    logo: z.boolean(),
    specWatermark: z.boolean(),
  }),
  hotelName: z.string().max(120).default(''),
  location: z.string().max(120).default(''),
  message: z.string().max(240).default(''),
  ctaText: z.string().max(120).default(''),
})

export type DirectorBrief = z.infer<typeof directorBriefSchema>

// ---------------------------------------------------------------------------
// Concepts
// ---------------------------------------------------------------------------

export const conceptArchetypeSchema = z.enum(['room-reveal', 'two-shot-luxury', 'view-highlight', 'listing', 'morning-atmosphere'])
export type ConceptArchetype = z.infer<typeof conceptArchetypeSchema>

export const videoConceptSchema = z.object({
  id: z.string(),
  archetype: conceptArchetypeSchema,
  title: z.string().min(1).max(100),
  summary: z.string().min(1).max(500),
  structure: conceptStructureSchema,
  durationSeconds: z.number().int().min(6).max(30),
  shotCount: z.number().int().min(1).max(5),
  platformFit: z.array(z.string().max(60)).catch([]),
  cameraMoves: z.array(cameraMoveSchema).catch([]),
  fidelityRisk: riskTierSchema,
  rationale: z.string().min(1).max(500),
  /** Set ONLY by the deterministic gateConcepts() — never by the LLM. */
  disabled: z.boolean().default(false),
  disabledReason: z.string().optional(),
})

export type VideoConcept = z.infer<typeof videoConceptSchema>

// ---------------------------------------------------------------------------
// Storyboard
// ---------------------------------------------------------------------------

/** Shot as the LLM returns it — photo INDICES; the client remaps to ids. */
export const llmShotSchema = z.object({
  title: z.string().min(1).max(100),
  sourcePhotoIndex: z.number().int().min(0),
  endPhotoIndex: z.number().int().min(0).nullish(),
  cameraMove: cameraMoveSchema,
  /**
   * Subject/lighting/mood motion ONLY — no camera language, no preservation
   * rules. The system appends those deterministically.
   */
  motionCore: z.string().min(10).max(700),
  durationSeconds: z.number().int().min(4).max(8).catch(6),
  mood: z.string().max(160).catch(''),
})

export type LlmShot = z.infer<typeof llmShotSchema>

export const storyboardShotSchema = z.object({
  id: z.string(),
  order: z.number().int().min(0),
  title: z.string().min(1).max(100),
  sourcePhotoId: z.string(),
  /** Present ⇒ first/last-frame transition shot (endFrame-capable models only). */
  endPhotoId: z.string().nullish(),
  cameraMove: cameraMoveSchema,
  motionCore: z.string().min(10).max(700),
  durationSeconds: z.number().int().min(4).max(8),
  mood: z.string().max(160).catch(''),
  /** PreservationConstraint ids this shot must specifically honor (all `must` constraints always apply). */
  mustPreserveIds: z.array(z.string()).catch([]),
  locked: z.boolean().default(false),
})

export type StoryboardShot = z.infer<typeof storyboardShotSchema>

// ---------------------------------------------------------------------------
// Rendering / review (client-only plain TS)
// ---------------------------------------------------------------------------

export type RenderPhase = 'draft' | 'final'

export interface ModelRecommendation {
  model: VideoModelId
  resolution: VideoResolution
  reason: string
  usesEndFrame: boolean
}

export interface PlannedRender {
  shotId: string
  model: VideoModelId
  durationSeconds: number
  resolution: VideoResolution
  withAudio: boolean
}

export interface CreditEstimate {
  perShot: { shotId: string; model: VideoModelId; credits: number }[]
  assembly: number
  total: number
}

export type ClipReviewStatus = 'none' | 'approved' | 'rejected'

export interface ClipReview {
  status: ClipReviewStatus
  /** Review checklist keys → checked. */
  checklist: Record<string, boolean>
  note?: string
}

export interface ShotJobs {
  draftJobIds: number[]
  finalJobIds: number[]
  review: ClipReview
}

// ---------------------------------------------------------------------------
// Project (the persisted wizard state)
// ---------------------------------------------------------------------------

export type DirectorStep =
  | 'upload'
  | 'analysis'
  | 'brief'
  | 'concepts'
  | 'storyboard'
  | 'preflight'
  | 'generate'
  | 'done'

export interface DirectorProject {
  version: 1
  id: string
  createdAt: number
  step: DirectorStep
  photos: PhotoReference[]
  analysis: MultiPhotoAnalysis | null
  /** Observed items the user removed as wrong. */
  correctedObservedIds: string[]
  confirmedInferredIds: string[]
  rejectedInferredIds: string[]
  /** Free-text correction, e.g. "the balcony faces a temple — never change it". */
  correctionNote: string
  /** Working preservation set (AI + user additions, post-correction). */
  constraints: PreservationConstraint[]
  brief: DirectorBrief | null
  concepts: VideoConcept[] | null
  selectedConceptId: string | null
  storyboard: StoryboardShot[]
  /** Per-shot final-upgrade choices layered over recommendRender. */
  renderOverrides: Record<string, Partial<PlannedRender>>
  shotJobs: Record<string, ShotJobs>
  assembledJobId: number | null
}

export type { CameraMove }
