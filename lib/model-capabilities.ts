/**
 * lib/model-capabilities.ts
 *
 * Single source of truth for what a generation model can actually honor, so the
 * UI never offers a control the backend silently drops.
 *
 * Seed is the motivating case: OpenAI's images API exposes no seed parameter, so
 * both `generateLogoBaseImage` and the image route call `generateOpenAIImage`
 * without one. Only the Gemini path threads `seed` through. A seed control shown
 * for an OpenAI model is therefore inert, and previously the image studio showed
 * exactly that with no indication.
 */

/** Models routed through OpenAI's images API rather than the Gemini client. */
const OPENAI_IMAGE_MODELS = ['gpt-image-2'] as const

/**
 * Whether `model` honors a caller-supplied seed.
 *
 * Returns false for OpenAI image models — their API has no seed parameter, so a
 * locked seed changes nothing about the result.
 */
export function modelSupportsSeed(model: string | null | undefined): boolean {
  if (!model) return true
  return !(OPENAI_IMAGE_MODELS as readonly string[]).includes(model)
}

/** Why the seed control is inert, for UI copy. Null when seed is supported. */
export function seedUnsupportedReason(model: string | null | undefined): string | null {
  return modelSupportsSeed(model) ? null : 'Seed is unavailable for ChatGPT Images 2.0'
}
