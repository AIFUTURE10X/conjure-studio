/**
 * Logo Prompt Templates
 *
 * Contains all prompt templates and helpers for logo generation.
 * Extracted from route.ts to keep files under 300 lines.
 */

import type { LogoReferenceMode, LogoTextMode } from '@/lib/logo-generation-contract'
import {
  LOGO_RENDER_TREATMENT_VALUES,
  LOGO_TYPE_VALUES,
  LOGO_TYPOGRAPHY_DIRECTION_VALUES,
  LOGO_VISUAL_STYLE_VALUES,
  type LogoRenderTreatment,
  type LogoType,
  type LogoTypographyDirection,
  type LogoVisualStyle,
} from '@/app/image-studio/constants/logo-constants'

// Logo concept styles - the "what" of the logo (design philosophy)
export type LogoConcept = 'minimalist' | 'modern' | 'vintage' | 'playful' | 'elegant' | 'bold'

// Rendering styles - the "how" of the logo (material/effect)
export type RenderStyle = 'flat' | '3d' | '3d-metallic' | '3d-crystal' | '3d-gradient' | 'neon'
export type LogoBackgroundMode = 'presentation' | 'removable' | 'native-transparent'

interface ParsedLogoStyle {
  concept: LogoConcept
  render: RenderStyle
  logoType?: LogoType
  visualStyle?: LogoVisualStyle
  renderTreatment?: LogoRenderTreatment
  typographyDirection?: LogoTypographyDirection
}

// Concept prompts - define the design philosophy
export const CONCEPT_PROMPTS: Record<LogoConcept, string> = {
  minimalist: `MINIMALIST design philosophy:
    - Maximum simplicity: reduce to essential elements only
    - Strategic use of negative space
    - Limited color palette (1-2 colors)
    - Perfect geometric shapes with mathematical precision
    - No unnecessary details or embellishments
    - Inspired by: Apple, Nike, Airbnb logos`,

  modern: `MODERN CONTEMPORARY design philosophy:
    - Sleek, clean lines with perfect proportions
    - Bold confident typography (sans-serif)
    - Strategic use of color for brand recognition
    - Sophisticated and premium appearance
    - Balanced composition with visual harmony
    - Inspired by: Tesla, Uber, Netflix, Stripe logos`,

  vintage: `VINTAGE/RETRO design philosophy:
    - Timeless design that feels established and trustworthy
    - Classic typography with serifs or hand-lettered style
    - Warm, nostalgic feel
    - Badge, emblem, or crest-style composition
    - Inspired by: Harley-Davidson, Jack Daniel's logos`,

  playful: `PLAYFUL/FUN design philosophy:
    - Friendly, approachable character
    - Rounded shapes and soft edges
    - Vibrant, cheerful colors
    - Whimsical or cartoon-like elements
    - Appeals to younger audiences
    - Inspired by: Mailchimp, Slack, Discord logos`,

  elegant: `ELEGANT/LUXURY design philosophy:
    - Refined, sophisticated aesthetics
    - Thin lines and delicate details
    - Premium typography (often serif or custom)
    - Gold, black, white color schemes
    - High-end, exclusive feeling
    - Inspired by: Chanel, Rolex, Louis Vuitton logos`,

  bold: `BOLD/POWERFUL design philosophy:
    - Strong, impactful presence
    - Heavy weights and thick strokes
    - High contrast colors
    - Commanding and authoritative feel
    - Makes a strong statement
    - Inspired by: ESPN, Netflix, Adobe logos`
}

// Rendering style prompts - define the material/effect
export const RENDER_PROMPTS: Record<RenderStyle, string> = {
  flat: `FLAT 2D rendering style:
    - Bold, solid colors with high contrast
    - Clean vector-style with crisp hard edges
    - Simple iconic shapes that are instantly recognizable
    - Works at any size from favicon to billboard
    - Professional corporate quality like Uber, Airbnb logos`,

  '3d': `PROFESSIONAL 3D rendering style:
    - Rich depth and dimensionality with realistic lighting
    - Soft shadows creating floating/elevated effect
    - Glossy finish with subtle specular highlights
    - Professional corporate quality like tech company logos
    - Modern and sophisticated appearance
    - Smooth gradients that transition beautifully
    - Render with studio lighting quality`,

  '3d-metallic': `PREMIUM 3D METALLIC rendering style:
    - Hyper-realistic brushed metal texture (silver, gold, chrome, bronze, or copper)
    - Brilliant reflective surfaces catching dramatic studio lighting
    - Sharp beveled edges with luxurious metallic sheen
    - Subtle environmental reflections showing depth
    - Professional luxury car emblem quality (Mercedes-Benz, BMW, Lamborghini)
    - Premium, expensive, high-end appearance
    - Deep shadows and bright highlights for contrast
    - The metal should look REAL and TOUCHABLE
    - IMPORTANT: Render with photorealistic 3D metal materials, dramatic lighting`,

  '3d-crystal': `PREMIUM 3D CRYSTALLINE/GLASS rendering style:
    - Transparent glass or crystal material with realistic refraction
    - Light bending through surfaces creating caustic effects
    - Faceted surfaces catching and dispersing light beautifully
    - Prismatic rainbow color effects from light dispersion
    - Sharp geometric crystalline forms with depth
    - Diamond-like brilliance, sparkle, and clarity
    - Luxury jewelry quality rendering (Swarovski, Tiffany)
    - Ice-like or gem-like translucent quality
    - IMPORTANT: Render with photorealistic glass/crystal materials, studio lighting`,

  '3d-gradient': `VIBRANT 3D GRADIENT rendering style:
    - Beautiful smooth color gradient transitions (cyan→blue, orange→red, pink→purple)
    - Soft volumetric 3D depth and dimension
    - Glossy finish with soft shadows creating floating effect
    - Contemporary tech startup aesthetic
    - Vibrant, eye-catching color combinations that pop
    - Soft diffused lighting with subtle highlights
    - App icon quality rendering (Instagram, Firefox, Figma style)
    - Colors should flow and blend seamlessly
    - IMPORTANT: Use beautiful vibrant gradient colors with rich 3D depth`,

  neon: `ELECTRIC NEON GLOW rendering style:
    - Brilliant glowing neon tube appearance with realistic gas glow
    - Dramatic light bloom and multiple halo/glow layers
    - Electric, vibrant color palette (hot pink, electric blue, purple, green, cyan)
    - Retro-futuristic cyberpunk aesthetic
    - Multiple glow layers creating depth and atmosphere
    - The glow should illuminate the surrounding area
    - 80s synthwave / cyberpunk / Las Vegas sign inspiration
    - Inspired by: Tron, Blade Runner, Vegas neon signs
    - IMPORTANT: Render with dramatic glowing neon effect on dark background`
}

// Simplified professional logo design principles - focused essentials only
export const UNIVERSAL_LOGO_PRINCIPLES = `
LOGO DESIGN ESSENTIALS:
1. SIMPLICITY: Reduce to essential elements - iconic logos are never complex
2. SCALABILITY: Must look perfect from 16px favicon to billboard size
3. MEMORABILITY: Create a unique, instantly recognizable mark
4. GOLDEN RATIO: Use 1.618 proportions for natural visual harmony
5. LIMIT COLORS: Maximum 2-3 colors for elegance and versatility`

// Background requirements - adapts based on render style
export function getBackgroundRequirements(renderStyle: RenderStyle, backgroundMode: LogoBackgroundMode = 'removable'): string {
  if (backgroundMode === 'native-transparent') {
    return `
CRITICAL - LEGACY TRANSPARENT PNG CLEANUP WORKFLOW:
- Keep the logo as a standalone mark prepared for transparent-background cleanup
- Keep the logo centered with clean empty space around it
- No paper, wall, canvas, gradient, shadow field, scene, mockup, or environment
- Use a plain, uncluttered backdrop with crisp logo edges so local cleanup can remove it cleanly`
  }

  // For neon style, use dark background
  if (renderStyle === 'neon') {
    return `
CRITICAL - BACKGROUND FOR NEON EFFECT:
- Place logo on PURE SOLID BLACK (#000000) background
- The dark background is essential for the neon glow effect
- NO gradients, patterns, textures in background
- Center the logo with equal padding on all sides
- Allow the neon glow to bloom naturally against the dark`
  }

  // For all other styles, use white background for easy extraction
  return `
CRITICAL - BACKGROUND FOR TRANSPARENT PNG EXPORT:
- Place logo on PURE SOLID WHITE (#FFFFFF) background ONLY
- NO gradients, patterns, textures anywhere in background
- NO shadows falling outside the logo bounds
- NO glow effects or halos around the logo
- NO decorative elements, mockups, or context
- Center the logo with equal padding on all sides
- The logo must have clean, well-defined edges for extraction`
}

export function getTextHandlingRequirements(textMode: LogoTextMode): string {
  if (textMode === 'exact-text-overlay') {
    return `
TEXT HANDLING - EXACT TYPOGRAPHY WORKFLOW:
- Do not draw brand names, slogans, letters, numbers, or placeholder words in the AI image
- Create a standalone symbol, icon, monogram-free mark, or emblem shape only
- Keep the composition balanced so exact editable typography can be added afterward with the Real Font Overlay tool
- Avoid tiny text-like marks, fake lettering, watermarks, and signature scribbles`
  }

  return `
TEXT HANDLING:
- If the prompt includes a brand name, include clean, simple, readable lettering
- Keep the icon strong enough to work without the text
- Avoid tiny taglines, extra words, fake watermarks, and illegible decorative lettering`
}

function getUserPromptPriorityRequirements(): string {
  return `
USER PROMPT HAS PRIORITY:
- Treat the typed prompt as the source of truth for requested text, font style, colors, layout, and background
- If the user asks for a white background, use PURE SOLID WHITE (#FFFFFF), not blue, navy, gray, gradients, vignettes, or a presentation scene
- If default style guidance conflicts with the typed prompt, follow the typed prompt`
}

function getReferenceTextHandlingRequirements(textMode: LogoTextMode): string {
  if (textMode === 'exact-text-overlay') {
    return `
TEXT HANDLING WITH REFERENCE:
- Do not draw final editable brand names, slogans, letters, numbers, or placeholder words in the AI image
- Use the reference typography as layout guidance for the Real Font Overlay step: baseline, spacing, alignment, scale, and script/block contrast
- Preserve clean space where the exact editable text should be placed later
- Avoid fake lettering, misspelled words, and text-like marks`
  }

  return `
TEXT HANDLING WITH REFERENCE:
- Render only the requested brand text
- Match the reference font style as closely as the image model allows: letterforms, stroke contrast, terminals, ligatures, kerning, tracking, case, baseline, and spacing
- Do not swap the reference typography for a generic modern sans, dot matrix, metallic, neon, or default app style unless the typed prompt explicitly asks for that change
- Avoid extra words, fake taglines, watermarks, and illegible decorative lettering`
}

function getReferenceBackgroundRequirements(backgroundMode: LogoBackgroundMode): string {
  if (backgroundMode === 'native-transparent') {
    return `
BACKGROUND HANDLING:
- Create a standalone logo prepared for transparent-background cleanup
- Avoid visible scenes, mockups, gradients, floor shadows, wall textures, or decorative backdrops
- Keep the logo edges crisp with clean empty space around the mark
- USER PROMPT HAS PRIORITY for any requested transparent/standalone/logo-only output`
  }

  if (backgroundMode === 'presentation') {
    return `
BACKGROUND HANDLING:
- USER PROMPT HAS PRIORITY: if a background color is requested, use that exact color
- If the user asks for a white background, use PURE SOLID WHITE (#FFFFFF), not blue, navy, gray, gradient, texture, or a dark presentation backdrop
- If no background is requested, use a clean, simple background that supports the reference style without overpowering the logo`
  }

  return `
BACKGROUND HANDLING:
- USER PROMPT HAS PRIORITY: if a background color is requested, use that exact color
- If the user asks for a white background, use PURE SOLID WHITE (#FFFFFF), not blue, navy, gray, gradient, texture, or a dark presentation backdrop
- If no background is requested, use PURE SOLID WHITE (#FFFFFF) for clean background removal
- Keep logo edges crisp and avoid background shadows, glows, halos, or textures that can be mistaken for part of the logo`
}

/**
 * Replicate mode: the attached image outranks the typed style words for color,
 * material, and effects. Style briefs are written by eye and drift (a "gold"
 * description over silver-and-rust art) — when wording and pixels disagree,
 * the pixels win. The typed prompt stays authoritative for the text to letter,
 * the background choice, and explicit change requests.
 */
function getReplicateColorFidelityRequirements(sampledPalette?: string | null): string {
  const paletteBlock = sampledPalette?.trim() ? `\n\n${sampledPalette.trim()}` : ''

  return `
COLOR & FINISH FIDELITY — THE ATTACHED IMAGE IS THE COLOR AUTHORITY:
- Sample the actual colors from the attached reference and reproduce them zone by zone: the highlight tone, the midtone material, the shadow/recess tone, and the color and strength of any glow around the letters
- If the reference mixes tones or metals (e.g. silver-white highlights over bronze with dark rust patina in the recesses), reproduce that exact mix — do NOT unify the lettering into one uniform metal such as all-gold or all-chrome
- Match any glow to the reference: same hue, same softness, same intensity — do not substitute a brighter or warmer golden bloom
- Match weathering: keep rust, patina, tarnish, grain, and texture at the same density and character as the reference
- Add no sparkles, light rays, lens flares, or extra shine the reference does not show
- Style adjectives in the USER REQUEST describe this same reference; wherever the wording and the image disagree about color or finish, FOLLOW THE IMAGE. Deviate only where the request explicitly asks for a change (e.g. "make it blue instead")${paletteBlock}`
}

function getReplicateUserPromptPriorityRequirements(): string {
  return `
USER PROMPT PRIORITY (REPLICATE MODE):
- The typed prompt is the source of truth for the exact text to letter, the layout intent, and the background choice
- The attached image is the source of truth for palette, materials, finish, and effects unless the typed prompt explicitly requests a change`
}

export function buildReferenceLogoPrompt(
  userPrompt: string,
  referenceMode: LogoReferenceMode = 'inspire',
  textMode: LogoTextMode = 'ai-text',
  backgroundMode: LogoBackgroundMode = 'removable',
  sampledPalette?: string | null
): string {
  const isReplicate = referenceMode === 'replicate'
  const modeGuidance = isReplicate
    ? `- Replicate the attached reference as closely as possible
- Copy the reference font/typeface, letter shapes, spacing, proportions, colors, layout, and effects unless the typed prompt requests a specific change`
    : `- Use the attached reference as the primary style guide
- Preserve the reference typography direction, letterform character, stroke weight, spacing, alignment, palette, and composition while applying the typed changes`

  const colorFidelity = isReplicate ? `\n${getReplicateColorFidelityRequirements(sampledPalette)}\n` : ''
  const promptPriority = isReplicate
    ? getReplicateUserPromptPriorityRequirements()
    : getUserPromptPriorityRequirements()

  return `Create a professional logo using the attached reference image.

REFERENCE TYPOGRAPHY PRIORITY:
${modeGuidance}
- The reference image is the authority for typography and layout
- Do not replace the reference font style with the app's default logo style
- Do not add generic 3D metallic, dot matrix, neon, blue background, or dark presentation styling unless explicitly requested
${colorFidelity}
USER REQUEST:
${userPrompt}

${promptPriority}

${getReferenceTextHandlingRequirements(textMode)}

${getReferenceBackgroundRequirements(backgroundMode)}

Generate one clean logo result only. Keep the requested text, reference typography direction, and requested background intact.`
}

const isLogoType = (value: string): value is LogoType => LOGO_TYPE_VALUES.includes(value as LogoType)
const isLogoVisualStyle = (value: string): value is LogoVisualStyle => LOGO_VISUAL_STYLE_VALUES.includes(value as LogoVisualStyle)
const isLogoRenderTreatment = (value: string): value is LogoRenderTreatment => LOGO_RENDER_TREATMENT_VALUES.includes(value as LogoRenderTreatment)
const isLogoTypographyDirection = (value: string): value is LogoTypographyDirection => LOGO_TYPOGRAPHY_DIRECTION_VALUES.includes(value as LogoTypographyDirection)
const isLogoConcept = (value: string): value is LogoConcept => value in CONCEPT_PROMPTS
const isRenderStyle = (value: string): value is RenderStyle => value in RENDER_PROMPTS

const mapVisualStyleToConcept = (visualStyle?: LogoVisualStyle): LogoConcept => {
  if (visualStyle === 'minimal') return 'minimalist'
  if (visualStyle === 'luxury' || visualStyle === 'boutique') return 'elegant'
  if (visualStyle === 'vintage' || visualStyle === 'handcrafted') return 'vintage'
  if (visualStyle === 'corporate' || visualStyle === 'tech') return 'modern'
  return 'modern'
}

const mapRenderTreatmentToRender = (renderTreatment?: LogoRenderTreatment): RenderStyle => {
  if (renderTreatment === 'flat-vector') return 'flat'
  if (renderTreatment === 'soft-3d' || renderTreatment === 'embossed') return '3d'
  if (renderTreatment === 'metallic' || renderTreatment === 'foil') return '3d-metallic'
  if (renderTreatment === 'glass') return '3d-crystal'
  if (renderTreatment === 'neon') return 'neon'
  return 'flat'
}

function formatSelectedLogoStyleGuidance(style: ParsedLogoStyle): string {
  const logoTypeGuidance: Record<LogoType, string> = {
    wordmark: 'Logo type: wordmark. Prioritize distinctive readable lettering as the main brand mark.',
    monogram: 'Logo type: monogram. Build the identity around initials or a compact lettermark.',
    'icon-wordmark': 'Logo type: icon plus wordmark. Balance a standalone symbol with readable brand text.',
    badge: 'Logo type: badge. Use a contained stamp or label composition with controlled hierarchy.',
    emblem: 'Logo type: emblem. Integrate the mark and typography into one unified identity.',
    mascot: 'Logo type: mascot. Use a simplified character identity suitable for a real logo.',
  }
  const visualStyleGuidance: Record<LogoVisualStyle, string> = {
    minimal: 'Visual style: minimal, restrained, uncluttered, and highly scalable.',
    luxury: 'Visual style: luxury, refined, premium, elegant, and spacious.',
    modern: 'Visual style: modern, clean, contemporary, and confident.',
    vintage: 'Visual style: vintage, established, heritage-led, and timeless.',
    boutique: 'Visual style: boutique, warm premium, crafted, personal, and tasteful.',
    corporate: 'Visual style: corporate, trustworthy, professional, and stable.',
    tech: 'Visual style: tech, precise, futuristic, geometric, and polished.',
    handcrafted: 'Visual style: handcrafted, artisanal, human, and carefully imperfect.',
  }
  const renderTreatmentGuidance: Record<LogoRenderTreatment, string> = {
    'flat-vector': 'Render treatment: flat vector with crisp edges, simple fills, and no unnecessary depth.',
    'soft-3d': 'Render treatment: soft 3D with restrained depth and clean highlights.',
    metallic: 'Render treatment: metallic finish such as gold, chrome, bronze, or polished metal.',
    embossed: 'Render treatment: embossed or debossed surface with subtle relief.',
    foil: 'Render treatment: premium foil-stamped shine, restrained and elegant.',
    glass: 'Render treatment: glass or crystal polish, translucent highlights, and clean refraction.',
    neon: 'Render treatment: neon glow, luminous tube-like edges, and controlled bloom.',
  }
  const typographyGuidance: Record<LogoTypographyDirection, string> = {
    'clean-sans': 'Typography direction: clean sans-serif, readable, modern, and balanced.',
    'elegant-serif': 'Typography direction: elegant serif, refined stroke contrast, editorial luxury feel.',
    script: 'Typography direction: script or signature style, flowing but still readable.',
    geometric: 'Typography direction: geometric letterforms with precise spacing and constructed rhythm.',
    'bold-display': 'Typography direction: bold display lettering with strong presence and clear hierarchy.',
    'reference-match': 'Typography direction: match the uploaded/reference typography as closely as possible.',
  }

  return [
    style.logoType ? logoTypeGuidance[style.logoType] : null,
    style.visualStyle ? visualStyleGuidance[style.visualStyle] : null,
    style.renderTreatment ? renderTreatmentGuidance[style.renderTreatment] : null,
    style.typographyDirection ? typographyGuidance[style.typographyDirection] : null,
  ].filter(Boolean).join('\n')
}

// Parse combined style format. Supports both legacy "concept+render" and richer logo settings tokens.
export function parseStyle(style: string): ParsedLogoStyle {
  const tokens = style.split('+').map((token) => token.trim()).filter(Boolean)
  const logoType = tokens.find(isLogoType)
  const visualStyle = tokens.find(isLogoVisualStyle)
  const renderTreatment = tokens.find(isLogoRenderTreatment)
  const typographyDirection = tokens.find(isLogoTypographyDirection)
  const conceptToken = tokens.find(isLogoConcept)
  const renderToken = tokens.find(isRenderStyle)

  if (tokens.length > 1) {
    return {
      concept: conceptToken || mapVisualStyleToConcept(visualStyle),
      render: renderToken || mapRenderTreatmentToRender(renderTreatment),
      logoType,
      visualStyle,
      renderTreatment,
      typographyDirection,
    }
  }

  // Legacy single style - map to new system
  const legacyMap: Record<string, { concept: LogoConcept; render: RenderStyle }> = {
    'minimalist': { concept: 'minimalist', render: 'flat' },
    'flat': { concept: 'modern', render: 'flat' },
    'modern': { concept: 'modern', render: 'flat' },
    'vintage': { concept: 'vintage', render: 'flat' },
    '3d': { concept: 'modern', render: '3d' },
    '3d-metallic': { concept: 'modern', render: '3d-metallic' },
    '3d-crystal': { concept: 'modern', render: '3d-crystal' },
    '3d-gradient': { concept: 'modern', render: '3d-gradient' },
    'neon': { concept: 'modern', render: 'neon' },
  }
  return legacyMap[style] || { concept: 'modern', render: '3d-metallic' }
}

// Simplified prompt for free-form generation (no background constraints)
export function buildFreeFormLogoPrompt(
  userPrompt: string,
  style: string,
  textMode: LogoTextMode = 'ai-text',
  backgroundMode: LogoBackgroundMode = 'presentation'
): string {
  const { concept, render } = parseStyle(style)
  const conceptDescription = CONCEPT_PROMPTS[concept] || CONCEPT_PROMPTS.modern
  const renderDescription = RENDER_PROMPTS[render] || RENDER_PROMPTS['3d-metallic']
  const selectedStyleGuidance = formatSelectedLogoStyleGuidance(parseStyle(style))
  const textRequirements = getTextHandlingRequirements(textMode)
  const userPromptPriority = getUserPromptPriorityRequirements()
  const isNativeTransparent = backgroundMode === 'native-transparent'

  // Determine best background for the style
  const bgInstruction = isNativeTransparent
    ? 'Create a standalone logo prepared for transparent-background cleanup. Do not draw a visible scene, mockup, wall, floor, or decorative backdrop.'
    : render === 'neon'
      ? 'If no user background is requested, place on a dark charcoal or black background to make the glow pop'
      : backgroundMode === 'removable'
        ? 'If no user background is requested, place on a pure solid white (#FFFFFF) background for clean background removal'
        : 'If no user background is requested, place on a simple neutral presentation background'

  const depthInstruction = isNativeTransparent
    ? 'Use internal highlights, bevels, and material texture only inside the logo shapes; no cast shadows, floor shadows, halos, or background lighting.'
    : 'Add realistic shadows, highlights, and depth only when the selected style calls for it'

  const visualStyleInspiration = isNativeTransparent
    ? `- Clean standalone brand asset on transparent canvas
- Rich material effects must stay clipped inside the logo mark and lettering
- No presentation backdrop, vignette, spotlight, wall, paper, mockup, or scene`
    : `- Like logos you'd see for successful tech startups, real estate companies, or premium brands
- Rich 3D effects with realistic lighting and shadows
- Clean, memorable iconography that tells a story
- Professional composition with enough breathing room around the mark`

  return `Create a polished professional logo concept suitable for a real brand identity system:

BRAND/CONCEPT: ${userPrompt}

${userPromptPriority}

DESIGN PHILOSOPHY:
${conceptDescription}

SELECTED LOGO STYLE SETTINGS:
${selectedStyleGuidance || 'Use a modern professional logo style suitable for the prompt.'}

RENDERING STYLE:
${renderDescription}

PROFESSIONAL LOGO REQUIREMENTS:
1. DISTINCTIVE MARK: Create a memorable symbol, icon, badge, or mark that can stand alone
2. PERFECT COMPOSITION: Icon and text should be balanced and work together harmoniously
3. COLOR HARMONY: Use 2-3 complementary colors that create visual impact (gradients are encouraged for 3D styles)
4. DEPTH & DIMENSION: ${depthInstruction}
5. SCALABILITY: Keep the main shape readable from app-icon size to large signage
6. PRODUCTION CLEANLINESS: No extra badges, fake UI, watermarks, signatures, or mockup context

${textRequirements}

VISUAL STYLE INSPIRATION:
${visualStyleInspiration}

BACKGROUND:
${bgInstruction}

Generate one clean logo concept only. Keep it centered, intentional, and ready for transparent-background cleanup or exact typography overlay.`
}

// Original prompt with background constraints (fallback for local BG removal)
export function buildLogoPrompt(
  userPrompt: string,
  style: string,
  textMode: LogoTextMode = 'ai-text',
  backgroundMode: LogoBackgroundMode = 'removable'
): string {
  const { concept, render } = parseStyle(style)
  const conceptDescription = CONCEPT_PROMPTS[concept] || CONCEPT_PROMPTS.modern
  const renderDescription = RENDER_PROMPTS[render] || RENDER_PROMPTS['3d-metallic']
  const selectedStyleGuidance = formatSelectedLogoStyleGuidance(parseStyle(style))
  const backgroundReqs = getBackgroundRequirements(render, backgroundMode)
  const textRequirements = getTextHandlingRequirements(textMode)
  const userPromptPriority = getUserPromptPriorityRequirements()

  // Detect if user is asking for specific logo types
  const lowerPrompt = userPrompt.toLowerCase()
  let logoTypeGuidance = ''

  if (lowerPrompt.includes('mascot') || lowerPrompt.includes('character')) {
    logoTypeGuidance = `
MASCOT/CHARACTER LOGO GUIDANCE:
- Create a friendly, memorable character with personality
- Simplify the character for logo use (not overly detailed)
- Ensure the character works as a standalone icon
- Make expressions clear and appealing`
  } else if (lowerPrompt.includes('wordmark') || lowerPrompt.includes('text') || lowerPrompt.includes('name')) {
    logoTypeGuidance = `
WORDMARK/TYPOGRAPHY LOGO GUIDANCE:
- Focus on custom lettering or distinctive typography
- Create unique letterforms that become the brand mark
- Ensure excellent readability at all sizes
- Consider custom ligatures or letter connections`
  } else if (lowerPrompt.includes('emblem') || lowerPrompt.includes('badge') || lowerPrompt.includes('crest')) {
    logoTypeGuidance = `
EMBLEM/BADGE LOGO GUIDANCE:
- Create a contained, unified badge or crest design
- Include text integrated within the emblem shape
- Add subtle decorative elements that enhance authority
- Design with a timeless, established feeling`
  } else if (lowerPrompt.includes('icon') || lowerPrompt.includes('symbol') || lowerPrompt.includes('mark')) {
    logoTypeGuidance = `
ICON/SYMBOL LOGO GUIDANCE:
- Create a pure symbolic mark without text
- Maximum simplicity - must be recognizable at tiny sizes
- Use meaningful symbolism related to the brand
- Design an iconic shape that becomes synonymous with the brand`
  }

  return `Create a polished professional logo concept suitable for a real brand identity system:

BRAND/CONCEPT: ${userPrompt}

${userPromptPriority}

DESIGN PHILOSOPHY:
${conceptDescription}

SELECTED LOGO STYLE SETTINGS:
${selectedStyleGuidance || 'Use a modern professional logo style suitable for the prompt.'}

RENDERING STYLE:
${renderDescription}

${logoTypeGuidance}

PROFESSIONAL LOGO REQUIREMENTS:
1. ICONIC DESIGN: Create a distinctive, memorable visual that tells the brand story
2. PERFECT COMPOSITION: Balanced proportions using golden ratio principles
3. COLOR HARMONY: Use 2-3 complementary colors that create visual impact
4. DEPTH & DIMENSION: Add realistic shadows, highlights, and depth only when the selected style calls for it
5. SCALABILITY: Keep the main shape readable at small sizes
6. PRODUCTION CLEANLINESS: No extra badges, fake UI, watermarks, signatures, or mockup context

${textRequirements}

${UNIVERSAL_LOGO_PRINCIPLES}

${backgroundReqs}

Generate one clean logo concept only. Keep it centered, well-spaced, and easy to process into a transparent PNG.`
}
