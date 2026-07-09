"use client"

/**
 * Expanded Color Picker - Barrel Export
 *
 * Re-exports from ./ExpandedColorPicker/ for backwards compatibility.
 * The actual components have been split into smaller files.
 *
 * @deprecated Import directly from './ExpandedColorPicker' folder instead
 */

// Re-export component and types for backwards compatibility
export { ExpandedColorPicker } from './ExpandedColorPicker/index'
export type { ColorOption, ColorCategory } from '@/app/image-studio/constants/color-palettes'
export {
  COLOR_CATEGORIES,
  EXPANDED_COLOR_PRESETS,
  GRADIENT_DEFINITIONS
} from '@/app/image-studio/constants/color-palettes'
