"use client"

/**
 * Letter Color Picker - Barrel Export
 *
 * Re-exports from ./LetterColorPicker/ for backwards compatibility.
 * The actual components have been split into smaller files.
 *
 * @deprecated Import directly from './LetterColorPicker' folder instead
 */

// Re-export component and types for backwards compatibility
export { LetterColorPicker } from './LetterColorPicker/index'
export type { ColorOption, LetterColorConfig } from '@/app/image-studio/constants/color-palettes'
export { LETTER_COLOR_PALETTE } from '@/app/image-studio/constants/color-palettes'
