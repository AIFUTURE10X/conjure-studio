import { z } from 'zod'
import {
  LOGO_ASPECT_RATIOS,
  LOGO_BACKGROUND_REMOVAL_METHODS,
  LOGO_GENERATION_MODELS,
  LOGO_RESOLUTIONS,
  LOGO_TEXT_MODES,
} from '@/lib/logo-generation-contract'

/**
 * Shared request-validation schemas. Validation wraps INPUTS only — never
 * provider call structures (see WORKING_CONFIG_DO_NOT_MODIFY.md).
 */

/** Client-generated anonymous user id (e.g. "user-1712345-ab12cd34e"). */
export const userIdSchema = z.string().trim().min(1).max(200)

/** Numeric database id arriving as a string query param or JSON value. */
export const numericIdSchema = z.coerce.number().int().positive()

export const promptSchema = z.string().trim().min(1).max(10_000)
export const optionalPromptSchema = z.string().max(10_000).optional()

export const imageModelSchema = z.enum([
  'gemini-3.1-flash-image-preview',
  'gemini-3-pro-image-preview',
  'gemini-2.5-flash-image',
  'gpt-image-2',
])

export const imageSizeSchema = z.enum(['1K', '2K', '4K'])

export const aspectRatioSchema = z.enum(['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9', '5:4', '4:5'])

export const imageCountSchema = z.coerce.number().int().min(1).max(4)

export const seedSchema = z.coerce.number().int().min(0).max(2_147_483_647)

export const urlOrDataUriSchema = z.string().min(1).max(20_000_000).refine(
  (value) => value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:image/'),
  { message: 'Must be an http(s) URL or an image data URI' },
)

export const logoModelSchema = z.enum(LOGO_GENERATION_MODELS)
export const logoResolutionSchema = z.enum(LOGO_RESOLUTIONS)
export const logoAspectRatioSchema = z.enum(LOGO_ASPECT_RATIOS)
export const logoTextModeSchema = z.enum(LOGO_TEXT_MODES)
export const logoBgRemovalSchema = z.enum(LOGO_BACKGROUND_REMOVAL_METHODS)
