import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { apiError, parseJson } from '@/lib/api/http'
import { VIDEO_MODELS, VIDEO_MODEL_IDS, type VideoModelId, type VideoResolution } from '@/lib/video/providers'
import {
  generateOpenAIText,
  isOpenAIAuthError,
  isOpenAIRateLimitError,
} from "@/lib/openai-text-client"

/**
 * POST /api/video-prompt-helper — conversational AI helper for video mode.
 * Knows the model registry (capabilities baked into the system prompt) and
 * motion-prompt craft; returns chat text plus optional applyable payloads:
 * a video prompt, a settings patch, and/or a revised Story Mode shot plan.
 */

const historyMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(6000),
})

const bodySchema = z.object({
  message: z.string().trim().min(1).max(6000),
  history: z.array(historyMessageSchema).max(12).default([]),
  context: z.object({
    currentPrompt: z.string().max(4000).default(''),
    hasStartFrame: z.boolean().default(false),
    hasEndFrame: z.boolean().default(false),
    settings: z.object({
      model: z.string(),
      duration: z.number(),
      resolution: z.string(),
      aspectRatio: z.string(),
      generateAudio: z.boolean(),
    }),
    storyPlan: z.unknown().optional(),
  }),
})

const shotSchema = z.object({
  title: z.string().min(1).max(200),
  framePrompt: z.string().min(10).max(2000),
  motionPrompt: z.string().min(5).max(1000),
  durationSeconds: z.number().int().min(4).max(12).catch(5),
})

const responseSchema = z.object({
  message: z.string().min(1),
  videoPrompt: z.string().max(4000).optional(),
  settings: z.object({
    model: z.string().optional(),
    duration: z.number().optional(),
    resolution: z.string().optional(),
    aspectRatio: z.string().optional(),
    generateAudio: z.boolean().optional(),
  }).optional(),
  revisedShots: z.array(shotSchema).min(1).max(10).optional(),
})

function modelKnowledge(): string {
  return VIDEO_MODEL_IDS.map((id) => {
    const m = VIDEO_MODELS[id]
    const c = m.capabilities
    return `- "${id}" (${m.label}, ${m.tier === 'draft' ? 'cheap draft tier' : 'final quality tier'}): ${m.description} Durations: ${c.durations.join('/')}s. Resolutions: ${c.resolutions.join('/')}. Audio: ${c.audio ? 'yes' : 'no'}. End-frame support: ${c.endFrame ? 'yes' : 'no'}.`
  }).join('\n')
}

const SYSTEM_PROMPT = `You are the in-app AI video director for Conjure Studio's video generator. You help the user craft video prompts, pick the right model/settings, write and revise multi-shot story plans, and understand the tools.

AVAILABLE MODELS (use these exact ids in settings suggestions):
${modelKnowledge()}

APP KNOWLEDGE:
- The video generator takes a prompt plus optional start/end frame images. With a start frame, the prompt should describe MOTION (camera + subject movement), not re-describe the scene. Without frames it is text-to-video and the prompt must describe the scene AND the motion.
- End frames only work on models with end-frame support. The Extend button chains clips longer. Lip Sync makes a clip's face speak; Enhance upscales a clip.
- Story Mode turns an idea into a shot plan: each shot has a framePrompt (text-to-image prompt for the shot's first frame) and a motionPrompt (motion only). Character/style descriptors must repeat word-for-word across framePrompts for consistency.

MOTION-PROMPT CRAFT:
- One clear camera move per clip (push-in, orbit, crane, tracking, static...) plus natural subject/environment motion; under ~45 words; concrete and cinematic; no prompt-word salad.

RESPONSE CONTRACT — return STRICT JSON only, no markdown fences:
{
  "message": "your conversational reply (plain text, may use short lines)",
  "videoPrompt": "include ONLY when proposing a ready-to-use prompt for the video prompt box",
  "settings": {"model": "...", "duration": 5, "resolution": "1080p", "aspectRatio": "16:9", "generateAudio": false},
  "revisedShots": [{"title": "...", "framePrompt": "...", "motionPrompt": "...", "durationSeconds": 5}]
}
- "settings" only when recommending changes; include only the fields you want changed.
- "revisedShots" only when the user shared a shot plan and wants it changed — return the COMPLETE revised plan (every shot, not just changed ones), preserving continuity descriptors.
- When the user asks a question, answer in "message" alone. Keep replies tight and useful.`

function extractJson(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) throw new Error('No JSON object in response')
  return JSON.parse(trimmed.slice(start, end + 1))
}

/** Snap a suggested settings patch to what the registry actually supports. */
function sanitizeSettings(patch: z.infer<typeof responseSchema>['settings']) {
  if (!patch) return undefined
  const clean: Record<string, unknown> = {}
  if (patch.model && VIDEO_MODEL_IDS.includes(patch.model as VideoModelId)) clean.model = patch.model
  const model = VIDEO_MODELS[(clean.model as VideoModelId) ?? 'seedance-2']
  if (typeof patch.duration === 'number') {
    clean.duration = model.capabilities.durations.reduce((best, option) =>
      Math.abs(option - patch.duration!) < Math.abs(best - patch.duration!) ? option : best)
  }
  if (patch.resolution && model.capabilities.resolutions.includes(patch.resolution as VideoResolution)) {
    clean.resolution = patch.resolution
  }
  if (patch.aspectRatio) clean.aspectRatio = patch.aspectRatio
  if (typeof patch.generateAudio === 'boolean') clean.generateAudio = patch.generateAudio && model.capabilities.audio
  return Object.keys(clean).length > 0 ? clean : undefined
}

export async function POST(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.helper)
  if (rateLimited) return rateLimited

  const parsed = await parseJson(request, bodySchema)
  if (parsed.response) return parsed.response
  const { message, history, context } = parsed.data

  const contextBlock = [
    `CURRENT VIDEO CONTEXT:`,
    `- Prompt box: ${context.currentPrompt ? `"${context.currentPrompt}"` : '(empty)'}`,
    `- Start frame: ${context.hasStartFrame ? 'set' : 'none'} · End frame: ${context.hasEndFrame ? 'set' : 'none'}`,
    `- Settings: model=${context.settings.model}, ${context.settings.duration}s, ${context.settings.resolution}, aspect=${context.settings.aspectRatio}, audio=${context.settings.generateAudio ? 'on' : 'off'}`,
    ...(context.storyPlan ? [`- Active Story Mode plan (JSON): ${JSON.stringify(context.storyPlan).slice(0, 4000)}`] : []),
  ].join('\n')

  const transcript = history
    .slice(-10)
    .map((m) => `${m.role === 'user' ? 'USER' : 'ASSISTANT'}: ${m.content}`)
    .join('\n')

  const fullPrompt = [
    SYSTEM_PROMPT,
    contextBlock,
    transcript ? `CONVERSATION SO FAR:\n${transcript}` : '',
    `USER: ${message}`,
  ].filter(Boolean).join('\n\n')

  try {
    const raw = await generateOpenAIText(fullPrompt, { maxOutputTokens: 4000 })
    const result = responseSchema.parse(extractJson(raw))
    return NextResponse.json({
      message: result.message,
      videoPrompt: result.videoPrompt,
      settings: sanitizeSettings(result.settings),
      revisedShots: result.revisedShots,
    })
  } catch (error) {
    console.error("[video-helper] Failed:", error)
    if (isOpenAIRateLimitError(error)) {
      return apiError(429, "rate_limited", "The AI is busy — try again in a minute")
    }
    if (isOpenAIAuthError(error)) {
      return apiError(500, "provider_auth", "OpenAI API key is missing or invalid")
    }
    return apiError(500, "helper_failed", "The video helper hit an error — try rephrasing")
  }
}
