/**
 * Logo Preview Panel Color Presets
 *
 * Color presets using CSS filters for logo color shifting.
 * Optimized for metallic/multi-colored logos.
 *
 * Uses hue-rotate, saturate, brightness, and contrast to achieve
 * better results on logos with silver/metallic surfaces.
 */

// Extended color preset with additional filter options
export interface ColorPreset {
  name: string
  hue: number
  saturate: number
  brightness?: number
  contrast?: number
  label: string
  color: string
}

// Color presets for metallic logos
// Only includes presets that work well with CSS filters on 3D/metallic logos.
// Hue values are rotations, not absolutes: they assume the warm/gold source the
// logo generator produces by default (~45deg), so a 115deg shift lands on green.
export const COLOR_PRESETS: ColorPreset[] = [
  // Original (no changes)
  { name: 'Original', hue: 0, saturate: 100, label: 'Original', color: '#a855f7' },

  // Black - desaturated and darkened
  { name: 'Black', hue: 0, saturate: 0, brightness: 30, contrast: 120, label: 'Black', color: '#1a1a1a' },

  // Metallic variants - use brightness/contrast instead of heavy hue
  { name: 'Silver', hue: 0, saturate: 15, brightness: 110, contrast: 95, label: 'Silver', color: '#94a3b8' },
  { name: 'Warm Gray', hue: 30, saturate: 25, brightness: 95, label: 'Warm Gray', color: '#78716c' },
  { name: 'Cool Gray', hue: 220, saturate: 20, brightness: 100, label: 'Cool Gray', color: '#64748b' },

  // Warm metals - small rotations off the gold source, carried by saturation
  { name: 'Copper', hue: 344, saturate: 145, brightness: 92, label: 'Copper', color: '#b87333' },
  { name: 'Rose Gold', hue: 306, saturate: 90, brightness: 105, label: 'Rose Gold', color: '#b76e79' },
  { name: 'Bronze', hue: 350, saturate: 130, brightness: 78, contrast: 110, label: 'Bronze', color: '#8c6239' },

  // Jewel tones - full rotations for a clearly different colorway
  { name: 'Crimson', hue: 315, saturate: 190, brightness: 95, label: 'Crimson', color: '#b91c1c' },
  { name: 'Emerald', hue: 115, saturate: 150, brightness: 95, label: 'Emerald', color: '#10b981' },
  { name: 'Sapphire', hue: 176, saturate: 200, brightness: 100, label: 'Sapphire', color: '#2563eb' },
  { name: 'Amethyst', hue: 213, saturate: 160, brightness: 105, label: 'Amethyst', color: '#8b5cf6' },
]

// Export the type for use in other components
export type LogoFilterStyle = React.CSSProperties

/**
 * Generate CSS filter string from preset
 * Now supports brightness and contrast for better metallic results
 */
export function getFilterStyle(preset: ColorPreset): LogoFilterStyle {
  // Original - no filter
  if (preset.hue === 0 && preset.saturate === 100 && !preset.brightness && !preset.contrast) {
    return {}
  }

  const filters: string[] = []

  if (preset.hue !== 0) {
    filters.push(`hue-rotate(${preset.hue}deg)`)
  }
  if (preset.saturate !== 100) {
    filters.push(`saturate(${preset.saturate}%)`)
  }
  if (preset.brightness && preset.brightness !== 100) {
    filters.push(`brightness(${preset.brightness}%)`)
  }
  if (preset.contrast && preset.contrast !== 100) {
    filters.push(`contrast(${preset.contrast}%)`)
  }

  return {
    filter: filters.join(' '),
  }
}
