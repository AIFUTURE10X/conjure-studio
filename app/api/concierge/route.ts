import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { apiError, parseJson } from '@/lib/api/http'
import { VIDEO_MODELS, VIDEO_MODEL_IDS, type VideoModelId, type VideoResolution } from '@/lib/video/providers'
import { videoGenerationCost } from '@/lib/credits/cost-map'
import {
  generateOpenAIText,
  isOpenAIAuthError,
  isOpenAIRateLimitError,
} from "@/lib/openai-text-client"

/**
 * POST /api/concierge — the Studio Concierge planner. Takes a freeform
 * "what do you want to make?" conversation and returns either one clarifying
 * question or a complete studio setup plan (mode, model, settings, prompts,
 * checklist steps). The plan shape mirrors constants/concierge-tree.ts so the
 * client applies AI plans through the exact same path as static ones.
 */

const historyMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(4000),
})

const bodySchema = z.object({
  message: z.string().trim().min(1).max(4000),
  history: z.array(historyMessageSchema).max(12).default([]),
})

const stepSchema = z.object({
  key: z.string().min(1).max(40),
  label: z.string().min(1).max(160),
  auto: z.enum(['mode', 'image-generated', 'start-frame', 'clip-completed']).optional(),
})

const planSchema = z.object({
  title: z.string().min(1).max(60),
  mode: z.enum(['image', 'video', 'logo']),
  video: z.object({
    model: z.string(),
    duration: z.number(),
    resolution: z.string(),
    aspectRatio: z.string(),
    generateAudio: z.boolean(),
  }).optional(),
  videoPrompt: z.string().max(2000).optional(),
  imagePrompt: z.string().max(2000).optional(),
  imageAspectRatio: z.string().max(10).optional(),
  why: z.string().min(1).max(300),
  draftFirst: z.boolean().optional(),
  steps: z.array(stepSchema).min(2).max(6),
})

const responseSchema = z.object({
  message: z.string().min(1),
  // Models often emit "plan": null when just asking a question — accept both.
  plan: planSchema.nullish(),
})

function modelKnowledge(): string {
  return VIDEO_MODEL_IDS.map((id) => {
    const m = VIDEO_MODELS[id]
    const c = m.capabilities
    const silent = videoGenerationCost(id, 5, '1080p', false)
    const withAudio = c.audio ? ` (${videoGenerationCost(id, 5, '1080p', true)} with audio)` : ''
    return `- "${id}" (${m.label}, ${m.tier === 'draft' ? 'cheap draft tier' : 'final tier'}): ${m.description} Durations: ${c.durations.join('/')}s. Resolutions: ${c.resolutions.join('/')}. Audio: ${c.audio ? 'yes' : 'no'}. End frames: ${c.endFrame ? 'yes' : 'no'}. A 5s 1080p clip ≈ ${silent} credits${withAudio}; 4K doubles cost.`
  }).join('\n')
}

const SYSTEM_PROMPT = `You are the Studio Concierge for Conjure Studio, an AI image + video creation app. The user tells you what they want to make in their own words; you design the complete studio setup for them.

AVAILABLE VIDEO MODELS (use these exact ids):
${modelKnowledge()}

APP KNOWLEDGE:
- Modes: "image" (generate images), "video" (generate clips), "logo" (logo maker). Video clips can start from a generated/uploaded image (start frame), optionally morph toward an end frame, or be pure text-to-video.
- On any generated image, "Animate" sets it as the video start frame; "End Frame" sets it as the end frame. Good start/end pairs share the scene and change ONE thing (lights off→on, product closed→open, logo scattered→assembled).
- With a start frame the video prompt should describe MOTION ONLY (one camera move + one subject action, under ~45 words). Without frames it must describe scene AND motion.
- Story Mode (top of the video panel) turns one idea into a multi-shot script, generates every frame and clip. Assemble Film stitches 2+ finished clips with AI narration and music. Extend lengthens a finished clip; Lip Sync makes a face speak.
- Image generation costs 1-4 credits per image. Drafting motion ideas on seedance-fast before re-running on a final model saves a lot of credits.

YOUR JOB:
1. If the request is clear enough to act on, return a PLAN immediately with smart defaults. Do NOT interrogate.
2. Ask a clarifying question ONLY when a critical fork is genuinely unknown (e.g. do they already have an image; single clip vs multi-scene film). Maximum ONE question before planning — after the user answers once, you MUST plan.
3. Pick the model by job: kling-3 for cinematic motion from an image, veo-3.1 for talking people / dialogue / best text-to-video realism, seedance-2 for product work and best quality-per-credit (and 4K), seedance-fast only as the cheap draft tier.
4. Write the actual prompts for the user: "videoPrompt" (motion-only if the plan uses a start frame, scene+motion if text-to-video) and/or "imagePrompt" when the plan starts by generating an image. Make them concrete and tailored to what the user described — this is the "super smart" part.
5. Choose aspect ratio from intent: 9:16 for TikTok/Reels/Shorts, 16:9 for YouTube/web, 1:1 for feeds. Set imageAspectRatio to match the video aspect when an image feeds the video.

RESPONSE CONTRACT — return STRICT JSON only, no markdown fences:
{
  "message": "short conversational reply (1-3 sentences, plain text)",
  "plan": {
    "title": "3-5 word plan name",
    "mode": "image" | "video" | "logo",
    "video": {"model": "kling-3", "duration": 5, "resolution": "1080p", "aspectRatio": "16:9", "generateAudio": true},
    "videoPrompt": "ready-to-use prompt for the video box",
    "imagePrompt": "ready-to-use prompt for the image box (only when the plan starts in image mode)",
    "imageAspectRatio": "16:9",
    "why": "one sentence on why this model/setup",
    "draftFirst": true,
    "steps": [{"key": "kebab-slug", "label": "what the user does", "auto": "image-generated"}]
  }
}
- Omit "plan" entirely when asking your one clarifying question.
- "mode" is where the user STARTS: "image" when they need to generate the image first, "video" when they go straight to the video panel.
- Include "video" whenever the end product is a video, even if mode is "image".
- steps: 3-5 short imperative steps in order. Set "auto" ONLY where it fits: "image-generated" on a generate-the-image step, "start-frame" on an Animate/upload-start-frame step, "clip-completed" on the final generate-the-video step. Omit "auto" for manual steps (writing prompts, reviewing, assembling).
- "draftFirst": true when recommending a cheap seedance-fast test before the final model.`

function extractJson(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) throw new Error('No JSON object in response')
  return JSON.parse(trimmed.slice(start, end + 1))
}

/** Snap AI-suggested video settings to what the registry actually supports. */
function sanitizeVideo(video: z.infer<typeof planSchema>['video']) {
  if (!video) return undefined
  const model: VideoModelId = VIDEO_MODEL_IDS.includes(video.model as VideoModelId)
    ? (video.model as VideoModelId)
    : 'seedance-2'
  const caps = VIDEO_MODELS[model].capabilities
  const duration = caps.durations.reduce((best, option) =>
    Math.abs(option - video.duration) < Math.abs(best - video.duration) ? option : best)
  const resolution = caps.resolutions.includes(video.resolution as VideoResolution)
    ? (video.resolution as VideoResolution)
    : caps.resolutions[caps.resolutions.length - 1]
  return {
    model,
    duration,
    resolution,
    aspectRatio: video.aspectRatio || 'auto',
    generateAudio: video.generateAudio && caps.audio,
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.helper)
  if (rateLimited) return rateLimited

  const parsed = await parseJson(request, bodySchema)
  if (parsed.response) return parsed.response
  const { message, history } = parsed.data

  const transcript = history
    .slice(-10)
    .map((m) => `${m.role === 'user' ? 'USER' : 'ASSISTANT'}: ${m.content}`)
    .join('\n')

  const fullPrompt = [
    SYSTEM_PROMPT,
    transcript ? `CONVERSATION SO FAR:\n${transcript}` : '',
    `USER: ${message}`,
  ].filter(Boolean).join('\n\n')

  try {
    const raw = await generateOpenAIText(fullPrompt, { maxOutputTokens: 3000 })
    const result = responseSchema.parse(extractJson(raw))
    const plan = result.plan
      ? { ...result.plan, video: sanitizeVideo(result.plan.video) }
      : undefined
    return NextResponse.json({ message: result.message, plan })
  } catch (error) {
    console.error("[concierge] Failed:", error)
    if (isOpenAIRateLimitError(error)) {
      return apiError(429, "rate_limited", "The AI is busy — try again in a minute")
    }
    if (isOpenAIAuthError(error)) {
      return apiError(500, "provider_auth", "OpenAI API key is missing or invalid")
    }
    return apiError(500, "concierge_failed", "The concierge hit an error — try rephrasing")
  }
}
