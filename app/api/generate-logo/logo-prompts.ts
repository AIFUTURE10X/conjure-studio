/**
 * Logo Prompt Templates
 *
 * Contains all prompt templates and helpers for logo generation.
 * Extracted from route.ts to keep files under 300 lines.
 */

import type { LogoTextMode } from '@/lib/logo-generation-contract'

// Logo concept styles - the "what" of the logo (design philosophy)
export type LogoConcept = 'minimalist' | 'modern' | 'vintage' | 'playful' | 'elegant' | 'bold'

// Rendering styles - the "how" of the logo (material/effect)
export type RenderStyle = 'flat' | '3d' | '3d-metallic' | '3d-crystal' | '3d-gradient' | 'neon'

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
export function getBackgroundRequirements(renderStyle: RenderStyle): string {
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

// Parse combined style format: "concept+render" (e.g., "modern+3d-metallic")
export function parseStyle(style: string): { concept: LogoConcept; render: RenderStyle } {
  if (style.includes('+')) {
    const [conceptPart, renderPart] = style.split('+')
    return {
      concept: (conceptPart as LogoConcept) || 'modern',
      render: (renderPart as RenderStyle) || '3d-metallic'
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
export function buildFreeFormLogoPrompt(userPrompt: string, style: string, textMode: LogoTextMode = 'ai-text'): string {
  const { concept, render } = parseStyle(style)
  const conceptDescription = CONCEPT_PROMPTS[concept] || CONCEPT_PROMPTS.modern
  const renderDescription = RENDER_PROMPTS[render] || RENDER_PROMPTS['3d-metallic']
  const textRequirements = getTextHandlingRequirements(textMode)

  // Determine best background for the style
  const bgInstruction = render === 'neon'
    ? 'Place on a dark charcoal or black background to make the glow pop'
    : 'Place on a subtle dark gradient background (dark blue-gray to black) for premium presentation'

  return `Create a polished professional logo concept suitable for a real brand identity system:

BRAND/CONCEPT: ${userPrompt}

DESIGN PHILOSOPHY:
${conceptDescription}

RENDERING STYLE:
${renderDescription}

PROFESSIONAL LOGO REQUIREMENTS:
1. DISTINCTIVE MARK: Create a memorable symbol, icon, badge, or mark that can stand alone
2. PERFECT COMPOSITION: Icon and text should be balanced and work together harmoniously
3. COLOR HARMONY: Use 2-3 complementary colors that create visual impact (gradients are encouraged for 3D styles)
4. DEPTH & DIMENSION: Add realistic shadows, highlights, and depth only when the selected style calls for it
5. SCALABILITY: Keep the main shape readable from app-icon size to large signage
6. PRODUCTION CLEANLINESS: No extra badges, fake UI, watermarks, signatures, or mockup context

${textRequirements}

VISUAL STYLE INSPIRATION:
- Like logos you'd see for successful tech startups, real estate companies, or premium brands
- Rich 3D effects with realistic lighting and shadows
- Clean, memorable iconography that tells a story
- Professional composition with enough breathing room around the mark

BACKGROUND:
${bgInstruction}

Generate one clean logo concept only. Keep it centered, intentional, and ready for transparent-background cleanup or exact typography overlay.`
}

// Original prompt with background constraints (fallback for local BG removal)
export function buildLogoPrompt(userPrompt: string, style: string, textMode: LogoTextMode = 'ai-text'): string {
  const { concept, render } = parseStyle(style)
  const conceptDescription = CONCEPT_PROMPTS[concept] || CONCEPT_PROMPTS.modern
  const renderDescription = RENDER_PROMPTS[render] || RENDER_PROMPTS['3d-metallic']
  const backgroundReqs = getBackgroundRequirements(render)
  const textRequirements = getTextHandlingRequirements(textMode)

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

DESIGN PHILOSOPHY:
${conceptDescription}

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
