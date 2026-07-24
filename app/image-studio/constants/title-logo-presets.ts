/**
 * Title Logo Presets - adapts the curated movie/TV title-logo library into the
 * preset shape the Logo panel already speaks.
 *
 * The library (lib/logo-templates/great-title-logos.ts) is a set of recreation
 * briefs: each entry describes WHY a title treatment looks the way it does
 * (letterforms, finish, effects, composition) plus a Google Font to build from.
 * Here we turn each brief into a prompt template carrying {{BRAND_NAME}}, so a
 * user gets the *aesthetic* applied to their own brand rather than a copy of
 * the original title.
 *
 * These deliberately do NOT extend PresetCategory / LOGO_PRESETS — the Quick
 * Presets grid stays exactly as it is, and this library gets its own gallery.
 */

import {
  TITLE_LOGOS,
  LOGO_DESIGN_APPROACHES,
  type TitleLogo,
  type LogoDesignApproach,
} from '@/lib/logo-templates/great-title-logos'
import type { LogoConcept, RenderStyle } from './logo-constants'

export type TitleStyleCategory =
  | 'ornate-fantasy'
  | 'decorative-ornamental'
  | 'art-deco-period'
  | 'custom-script'
  | 'scifi-tech'
  | 'horror-distressed'
  | 'emblem-motif'
  | 'metallic-3d'
  | 'hand-drawn'

export type TitleStyleMedium = 'movie' | 'tv'

export interface TitleStylePreset {
  id: string
  /** The source title, shown as attribution on the card */
  sourceTitle: string
  year: number
  medium: TitleStyleMedium
  category: TitleStyleCategory
  categoryLabel: LogoDesignApproach
  /** The one thing that makes the treatment iconic */
  signatureElement: string
  /** Prompt with a {{BRAND_NAME}} placeholder */
  promptTemplate: string
  negativePrompt: string
  concept: LogoConcept
  renderStyles: RenderStyle[]
  /** Google Font to load as a base for the exact-text overlay preview */
  fontStartingPoint: string
  traits: string[]
  /** Transparent ClearLogo PNG on the TMDB CDN */
  artworkUrl: string
  /** TMDB title page */
  referenceUrl: string
  /** Dark-inked artwork needs a light backdrop to be legible in the grid */
  needsLightBackdrop: boolean
  /**
   * The look depends on atmosphere (glow, neon, aura) that only exists against
   * a dark backdrop. Applying such a style should keep the generated background
   * — the default removable-background pipeline explicitly forbids glows/halos
   * and then background removal cuts off whatever survives.
   */
  needsBackdrop: boolean
}

interface ApproachMeta {
  id: TitleStyleCategory
  label: LogoDesignApproach
  shortLabel: string
  icon: string
  color: string
  concept: LogoConcept
  renderStyles: RenderStyle[]
}

/**
 * Each of the 9 design families, with the concept + render styles that get the
 * generator closest to that family before the prompt text takes over.
 */
export const TITLE_STYLE_APPROACHES: ApproachMeta[] = [
  {
    id: 'ornate-fantasy',
    label: 'Ornate / Fantasy Serif',
    shortLabel: 'Fantasy',
    icon: '⚔️',
    color: '#d4af37',
    concept: 'elegant',
    renderStyles: ['3d-metallic'],
  },
  {
    id: 'decorative-ornamental',
    label: 'Decorative & Ornamental',
    shortLabel: 'Ornamental',
    icon: '❦',
    color: '#c084fc',
    concept: 'elegant',
    renderStyles: ['flat', '3d'],
  },
  {
    id: 'art-deco-period',
    label: 'Art Deco / Period',
    shortLabel: 'Art Deco',
    icon: '◈',
    color: '#eab308',
    concept: 'vintage',
    renderStyles: ['flat', '3d-metallic'],
  },
  {
    id: 'custom-script',
    label: 'Custom Script',
    shortLabel: 'Script',
    icon: '✒️',
    color: '#f472b6',
    concept: 'elegant',
    renderStyles: ['flat'],
  },
  {
    id: 'scifi-tech',
    label: 'Sci-Fi / Tech',
    shortLabel: 'Sci-Fi',
    icon: '⬢',
    color: '#22d3ee',
    concept: 'modern',
    renderStyles: ['neon', '3d-gradient'],
  },
  {
    id: 'horror-distressed',
    label: 'Horror / Distressed',
    shortLabel: 'Horror',
    icon: '🩸',
    color: '#ef4444',
    concept: 'bold',
    renderStyles: ['flat', '3d'],
  },
  {
    id: 'emblem-motif',
    label: 'Emblem / Motif',
    shortLabel: 'Emblem',
    icon: '⬟',
    color: '#38bdf8',
    concept: 'bold',
    renderStyles: ['flat', '3d-metallic'],
  },
  {
    id: 'metallic-3d',
    label: 'Metallic / 3D Effect',
    shortLabel: 'Metallic',
    icon: '⬡',
    color: '#a1a1aa',
    concept: 'bold',
    renderStyles: ['3d-metallic', '3d-crystal'],
  },
  {
    id: 'hand-drawn',
    label: 'Hand-Drawn / Cartoon',
    shortLabel: 'Hand-Drawn',
    icon: '✏️',
    color: '#facc15',
    concept: 'playful',
    renderStyles: ['flat'],
  },
]

const APPROACH_BY_LABEL = new Map<LogoDesignApproach, ApproachMeta>(
  TITLE_STYLE_APPROACHES.map((a) => [a.label, a])
)

/** Guards against the model drifting back toward the source title it learned the style from. */
const BASE_NEGATIVE =
  'movie poster, film still, existing franchise artwork, extra words, tagline, credits block, watermark, misspelled lettering'

/**
 * Looks that only read correctly with their atmosphere intact. Deliberately
 * conservative — sparkle or metallic shine alone works fine on transparency;
 * ambient light bleeding into the background does not.
 */
const ATMOSPHERE_PATTERN =
  /\bglow(?:ing)?\b|\bneon\b(?!\s+colou?rs?\b)|\bluminous\b|\baura\b|\bbacklit\b|\bhalo\b/i

function detectNeedsBackdrop(logo: TitleLogo): boolean {
  const haystack = [logo.promptSnippet, logo.designBreakdown, ...logo.traits].join(' ')
  return ATMOSPHERE_PATTERN.test(haystack)
}

/**
 * Appended to the prompt when the user keeps the backdrop. Counters the
 * removable-background guidance ("white background, no glows or halos") that
 * otherwise suppresses the atmosphere before bg removal even runs.
 */
export const TITLE_STYLE_BACKDROP_PROMPT =
  'Render on a deep black background with the glow and atmosphere radiating softly into it — the dark backdrop is part of the design, do not isolate the lettering on white.'

/**
 * Build a prompt that transfers the treatment onto the user's brand name.
 * The closing clause keeps the model on {{BRAND_NAME}} rather than reproducing
 * the title the brief was derived from.
 */
function buildPromptTemplate(logo: TitleLogo): string {
  return [
    `"{{BRAND_NAME}}" wordmark logo — ${logo.promptSnippet}.`,
    logo.designBreakdown,
    `Set the words "{{BRAND_NAME}}" in this exact treatment. Original lettering only — do not reproduce any existing title, franchise wordmark, or poster artwork.`,
  ].join(' ')
}

function toPreset(logo: TitleLogo): TitleStylePreset {
  const approach = APPROACH_BY_LABEL.get(logo.designApproach)

  if (!approach) {
    throw new Error(
      `title-logo-presets: unmapped designApproach "${logo.designApproach}" on "${logo.id}". ` +
        `Add it to TITLE_STYLE_APPROACHES.`
    )
  }

  const needsBackdrop = detectNeedsBackdrop(logo)

  return {
    id: logo.id,
    sourceTitle: logo.title,
    year: logo.year,
    medium: logo.type,
    category: approach.id,
    categoryLabel: approach.label,
    signatureElement: logo.signatureElement,
    promptTemplate: buildPromptTemplate(logo),
    negativePrompt: BASE_NEGATIVE,
    concept: approach.concept,
    renderStyles: approach.renderStyles,
    fontStartingPoint: logo.fontStartingPoint,
    traits: logo.traits,
    artworkUrl: logo.logoUrl,
    referenceUrl: logo.referenceUrl,
    needsLightBackdrop: logo.darkLogo,
    needsBackdrop,
  }
}

export const TITLE_STYLE_PRESETS: TitleStylePreset[] = TITLE_LOGOS.map(toPreset)

/** Fails loudly at module load if the library grows an approach we haven't mapped. */
if (LOGO_DESIGN_APPROACHES.length !== TITLE_STYLE_APPROACHES.length) {
  console.warn(
    `title-logo-presets: library has ${LOGO_DESIGN_APPROACHES.length} design approaches ` +
      `but ${TITLE_STYLE_APPROACHES.length} are mapped here.`
  )
}

export function applyTitleStyleTemplate(preset: TitleStylePreset, brandName: string): string {
  return preset.promptTemplate.replace(/\{\{BRAND_NAME\}\}/g, brandName.trim())
}

export function findTitleStyle(id: string): TitleStylePreset | undefined {
  return TITLE_STYLE_PRESETS.find((p) => p.id === id)
}

export function getTitleStyleApproach(id: TitleStyleCategory): ApproachMeta | undefined {
  return TITLE_STYLE_APPROACHES.find((a) => a.id === id)
}

/** Counts per approach, for the filter chips. */
export function getTitleStyleCounts(): Record<TitleStyleCategory, number> {
  return TITLE_STYLE_PRESETS.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1
    return acc
  }, {} as Record<TitleStyleCategory, number>)
}
