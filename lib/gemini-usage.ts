/**
 * Provider-usage hooks for the Gemini image client (issue #50).
 *
 * Kept out of lib/gemini-client.ts so that file stays within its size
 * budget: the client calls beginGeminiAttempt() once per attempt and reports
 * the outcome with one line.
 */

import { elapsedMs, recordProviderUsage } from '@/lib/costs/record'
import type { ProviderUsageUnits } from '@/lib/costs/provider-rates'

/**
 * Token usage from a Gemini response (usageMetadata), split by modality so
 * image output bills at the image rate. Null when absent.
 */
export function parseGeminiUsage(response: unknown, imageSize: string): ProviderUsageUnits | null {
  const meta = (response as { usageMetadata?: Record<string, unknown> } | null)?.usageMetadata
  if (!meta || typeof meta !== 'object') return null
  const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0)
  const byModality = (details: unknown, modality: string) =>
    Array.isArray(details)
      ? details.reduce((sum, d) => sum + (String((d as { modality?: unknown }).modality).toUpperCase() === modality ? num((d as { tokenCount?: unknown }).tokenCount) : 0), 0)
      : 0
  const promptImage = byModality(meta.promptTokensDetails, 'IMAGE')
  const candidateText = byModality(meta.candidatesTokensDetails, 'TEXT')
  const candidateImage = byModality(meta.candidatesTokensDetails, 'IMAGE')
  return {
    text_tokens_in: Math.max(0, num(meta.promptTokenCount) - promptImage),
    image_tokens_in: promptImage,
    text_tokens_out: candidateText,
    // An IMAGE-only response reports its image tokens as candidates tokens.
    image_tokens_out: candidateImage || Math.max(0, num(meta.candidatesTokenCount) - candidateText),
    images_out: 1,
    image_size: imageSize,
  }
}

/** One Gemini attempt: report success with the response, or failure with the error. */
export function beginGeminiAttempt(model: string, isEdit: boolean) {
  const startedAt = Date.now()
  const base = { provider: 'gemini' as const, model, operation: isEdit ? ('image-edit' as const) : ('image-generate' as const) }
  return {
    succeeded(response: unknown, imageSize: string) {
      const usage = parseGeminiUsage(response, imageSize)
      void recordProviderUsage({ ...base, status: 'succeeded', units: usage ?? { images_out: 1, image_size: imageSize }, exact: Boolean(usage), latencyMs: elapsedMs(startedAt) })
    },
    failed(error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      void recordProviderUsage({ ...base, status: 'failed', units: {}, error: message, latencyMs: elapsedMs(startedAt) })
    },
  }
}
