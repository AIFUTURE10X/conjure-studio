import { NextRequest, NextResponse } from "next/server"
import {
  generateOpenAIText,
  hasOpenAITextApiKey,
  isOpenAIAuthError,
  isOpenAIRateLimitError,
  OpenAIServiceError,
} from "@/lib/openai-text-client"

/**
 * Generate 3 distinct logo direction variations from a brand brief.
 *
 * Additive to the protected AI-helper subsystem: this is a standalone
 * endpoint that returns structured variations the client can apply via the
 * existing applyLogoSettingsPatch path. Model tier is env-overridable so a
 * "better model" can be selected without code changes.
 */

export const runtime = "nodejs"

// Allowed generator values — kept in sync with the logo settings rail.
// applyLogoSettingsPatch re-validates client-side, so this is belt-and-braces.
const LOGO_TYPES = ["wordmark", "monogram", "icon-wordmark", "badge", "emblem", "mascot"]
const VISUAL_STYLES = ["minimal", "luxury", "modern", "vintage", "boutique", "corporate", "tech", "handcrafted"]
const RENDER_TREATMENTS = ["flat-vector", "soft-3d", "metallic", "embossed", "foil", "glass", "neon"]
const TYPOGRAPHY = ["clean-sans", "elegant-serif", "script", "geometric", "bold-display", "reference-match"]
const TEXT_MODES = ["ai-text", "exact-text-overlay"]
const ASPECT_RATIOS = ["1:1", "4:3", "3:2", "16:9", "3:4", "9:16"]
const RESOLUTIONS = ["1K", "2K", "4K"]

function resolveModel(tier: unknown): string {
  // Defaults verified against the account's model list. Override per-tier via
  // env without a code change (e.g. set HQ to gpt-5.5-pro for max reasoning).
  // .trim() guards against stray spaces in env values (e.g. "gpt-5.4 ").
  if (tier === "hq") return (process.env.OPENAI_TEXT_MODEL_HQ || "gpt-5.5").trim()
  return (process.env.OPENAI_TEXT_MODEL_FAST || process.env.OPENAI_TEXT_MODEL || "gpt-5.4-mini").trim()
}

const pick = (value: unknown, allowed: string[]): string | undefined =>
  typeof value === "string" && allowed.includes(value) ? value : undefined

function buildPrompt(brief: string): string {
  return [
    "You are a senior brand designer. Produce EXACTLY 3 distinct logo direction",
    "variations for the brief below. Each must be a meaningfully different creative",
    "direction (vary the logo type, visual style, and render treatment so the user",
    "has real choices — not three near-identical options).",
    "",
    `BRIEF: ${brief}`,
    "",
    "Return ONLY valid minified JSON (no markdown, no commentary) of the shape:",
    '{"variations":[{',
    '"label": "short 2-4 word name for this direction",',
    '"rationale": "one short sentence on why this direction works",',
    '"prompt": "a complete, production-grade logo generation prompt (3-5 sentences). Name the brand, describe the mark, palette, mood, and that it is scalable/brand-ready. No camera/photo language.",',
    '"negativePrompt": "things to avoid",',
    `"logoType": one of ${JSON.stringify(LOGO_TYPES)},`,
    `"logoVisualStyle": one of ${JSON.stringify(VISUAL_STYLES)},`,
    `"logoRenderTreatment": one of ${JSON.stringify(RENDER_TREATMENTS)},`,
    `"logoTypographyDirection": one of ${JSON.stringify(TYPOGRAPHY)},`,
    `"textMode": one of ${JSON.stringify(TEXT_MODES)} (use "exact-text-overlay" when the brand name must be spelled correctly),`,
    `"aspectRatio": one of ${JSON.stringify(ASPECT_RATIOS)} (prefer "1:1" for icon/emblem marks),`,
    `"resolution": one of ${JSON.stringify(RESOLUTIONS)} (prefer "4K")`,
    "}]}",
    "",
    "Exactly 3 items in the variations array. Use only the allowed enum values verbatim.",
  ].join("\n")
}

function extractJson(text: string): unknown {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in model output")
  }
  return JSON.parse(text.slice(start, end + 1))
}

interface NormalizedVariation {
  id: string
  label: string
  rationale: string
  prompt: string
  negativePrompt?: string
  logoType?: string
  logoVisualStyle?: string
  logoRenderTreatment?: string
  logoTypographyDirection?: string
  textMode?: string
  aspectRatio?: string
  resolution?: string
}

function normalize(raw: unknown): NormalizedVariation[] {
  const list = Array.isArray((raw as { variations?: unknown })?.variations)
    ? (raw as { variations: unknown[] }).variations
    : []

  return list
    .filter((v): v is Record<string, unknown> => Boolean(v) && typeof v === "object")
    .map((v, i): NormalizedVariation | null => {
      const prompt = typeof v.prompt === "string" ? v.prompt.trim() : ""
      if (!prompt) return null
      return {
        id: `var-${Date.now()}-${i}`,
        label: typeof v.label === "string" && v.label.trim() ? v.label.trim() : `Variation ${i + 1}`,
        rationale: typeof v.rationale === "string" ? v.rationale.trim() : "",
        prompt,
        negativePrompt: typeof v.negativePrompt === "string" ? v.negativePrompt.trim() : undefined,
        logoType: pick(v.logoType, LOGO_TYPES),
        logoVisualStyle: pick(v.logoVisualStyle, VISUAL_STYLES),
        logoRenderTreatment: pick(v.logoRenderTreatment, RENDER_TREATMENTS),
        logoTypographyDirection: pick(v.logoTypographyDirection, TYPOGRAPHY),
        textMode: pick(v.textMode, TEXT_MODES),
        aspectRatio: pick(v.aspectRatio, ASPECT_RATIOS),
        resolution: pick(v.resolution, RESOLUTIONS),
      }
    })
    .filter((v): v is NormalizedVariation => v !== null)
    .slice(0, 3)
}

export async function POST(request: NextRequest) {
  if (!hasOpenAITextApiKey()) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 })
  }

  let body: { brief?: unknown; model?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const brief = typeof body.brief === "string" ? body.brief.trim() : ""
  if (!brief) {
    return NextResponse.json({ error: "A brand/logo brief is required." }, { status: 400 })
  }

  const model = resolveModel(body.model)

  try {
    const text = await generateOpenAIText(buildPrompt(brief), { model, maxOutputTokens: 4000 })
    const variations = normalize(extractJson(text))

    if (variations.length === 0) {
      return NextResponse.json({ error: "The model did not return usable variations. Try again." }, { status: 502 })
    }

    return NextResponse.json({ variations, model })
  } catch (error) {
    if (error instanceof OpenAIServiceError && isOpenAIAuthError(error)) {
      return NextResponse.json({ error: "OpenAI authentication failed — check OPENAI_API_KEY." }, { status: 401 })
    }
    if (isOpenAIRateLimitError(error)) {
      return NextResponse.json({ error: "Rate limited by OpenAI. Wait a moment and retry." }, { status: 429 })
    }
    const message = error instanceof Error ? error.message : "Failed to generate variations."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
