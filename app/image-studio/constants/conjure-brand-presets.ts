/**
 * Conjure Studio brand presets
 *
 * One-click logo recipes tuned for the Conjure Studio brand. Each preset
 * carries a ready-to-tweak prompt plus the full set of generator chips
 * (logo type, visual style, render treatment, typography, text mode,
 * aspect ratio, resolution, background removal) so the user doesn't have
 * to set them by hand. Applied via LogoCanvas → ConjureBrandPresets.
 */

import type {
  LogoRenderTreatment,
  LogoResolution,
  LogoType,
  LogoTypographyDirection,
  LogoVisualStyle,
} from './logo-constants'
import type {
  BgRemovalMethod,
  LogoAspectRatio,
  LogoTextMode,
} from '@/lib/logo-generation-contract'

export interface ConjureBrandPreset {
  id: string
  /** Short display name. */
  name: string
  /** One-line descriptor shown under the name. */
  tagline: string
  /** Emoji glyph for the button. */
  icon: string
  /** Ready-to-generate prompt (already tweakable in the dock). */
  prompt: string
  negativePrompt: string
  /** Generator chips applied verbatim. */
  logoType: LogoType
  visualStyle: LogoVisualStyle
  renderTreatment: LogoRenderTreatment
  typography: LogoTypographyDirection
  textMode: LogoTextMode
  aspectRatio: LogoAspectRatio
  resolution: LogoResolution
  bgRemovalMethod: BgRemovalMethod
  /** Compact chip labels for the button (display only). */
  chips: string[]
}

const SHARED_NEGATIVE =
  'no clutter, no busy background, no photorealistic scene, no extra symbols, ' +
  'no watermark, no stock-photo look, no muddy colors, no low contrast'

export const CONJURE_BRAND_PRESETS: ConjureBrandPreset[] = [
  {
    id: 'conjuring-c-monogram',
    name: 'Conjuring "C"',
    tagline: 'Sleek metallic monogram · hero mark',
    icon: '✦',
    prompt:
      'Icon monogram logo for "Conjure Studio", a premium AI image-generation studio. ' +
      'Form a single bold letter "C" out of a smooth ribbon of light that dissolves into ' +
      'fine sparkling particles where the C opens — as if an image is being conjured into ' +
      'existence. Centered, perfectly balanced, generous negative space, strong silhouette ' +
      'that reads at tiny sizes. Polished gold-to-amber gradient (#c99850 to #dbb56e) with a ' +
      'subtle metallic sheen on a deep near-black background. Clever, modern, distinctive, ' +
      'premium and brand-ready, flat enough to scale to an app icon. Crisp edges.',
    negativePrompt: SHARED_NEGATIVE,
    logoType: 'monogram',
    visualStyle: 'tech',
    renderTreatment: 'metallic',
    typography: 'geometric',
    textMode: 'ai-text',
    aspectRatio: '1:1',
    resolution: '4K',
    bgRemovalMethod: 'fal',
    chips: ['Monogram', 'Tech', 'Metallic', '1:1', '4K'],
  },
  {
    id: 'aperture-spark',
    name: 'Aperture Spark',
    tagline: 'Icon + wordmark · modern brand lockup',
    icon: '◈',
    prompt:
      'Modern icon-plus-wordmark logo for "Conjure Studio", an AI image-generation creative ' +
      'studio. Design a clean abstract symbol that fuses a camera-aperture iris with a ' +
      'four-point magic spark at its center — uniting image generation with the idea of ' +
      'conjuring. Pair the symbol with a refined, confident "Conjure Studio" wordmark. ' +
      'Warm gold-to-amber palette (#c99850 to #dbb56e) on deep charcoal, elegant spacing and ' +
      'balanced proportions. Premium, intelligent, tech-forward, instantly recognizable, ' +
      'scalable and brand-ready. Crisp vector finish.',
    negativePrompt: SHARED_NEGATIVE,
    logoType: 'icon-wordmark',
    visualStyle: 'modern',
    renderTreatment: 'flat-vector',
    typography: 'geometric',
    textMode: 'exact-text-overlay',
    aspectRatio: '3:2',
    resolution: '4K',
    bgRemovalMethod: 'fal',
    chips: ['Icon + Wordmark', 'Modern', 'Flat Vector', '3:2', '4K'],
  },
  {
    id: 'enchanted-emblem',
    name: 'Enchanted Emblem',
    tagline: 'Luxury foil emblem · premium identity',
    icon: '❖',
    prompt:
      'Luxury emblem logo for "Conjure Studio", a high-end AI image-generation studio. ' +
      'Build a refined circular emblem around a central abstract mark: the glowing tip of a ' +
      'magic wand releasing a spark that blooms into a small image frame — the moment an idea ' +
      'becomes a visual. Integrate the words "Conjure Studio" elegantly within the emblem\'s ' +
      'containment ring. Opulent gold and amber tones (#c99850 to #dbb56e) with a soft foil ' +
      'shine on a deep black background, exquisite balance and symmetry. Sophisticated, ' +
      'timeless, magical, premium, brand-ready and scalable. Clean precise linework.',
    negativePrompt: SHARED_NEGATIVE,
    logoType: 'emblem',
    visualStyle: 'luxury',
    renderTreatment: 'foil',
    typography: 'elegant-serif',
    textMode: 'exact-text-overlay',
    aspectRatio: '1:1',
    resolution: '4K',
    bgRemovalMethod: 'fal',
    chips: ['Emblem', 'Luxury', 'Foil', '1:1', '4K'],
  },
]
