"use client"

/**
 * useTitleStyles - filter/search/selection state for the Title Styles gallery.
 */

import { useCallback, useMemo, useState } from 'react'
import { loadGoogleFont } from '@/lib/font-loader'
import {
  TITLE_STYLE_PRESETS,
  TITLE_STYLE_APPROACHES,
  getTitleStyleCounts,
  type TitleStyleCategory,
  type TitleStyleMedium,
  type TitleStylePreset,
} from '../../../constants/title-logo-presets'

export function useTitleStyles() {
  const [search, setSearch] = useState('')
  const [medium, setMedium] = useState<TitleStyleMedium | null>(null)
  const [category, setCategory] = useState<TitleStyleCategory | null>(null)
  const [selected, setSelected] = useState<TitleStylePreset | null>(null)

  const counts = useMemo(() => getTitleStyleCounts(), [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return TITLE_STYLE_PRESETS.filter((preset) => {
      if (medium && preset.medium !== medium) return false
      if (category && preset.category !== category) return false
      if (!query) return true

      // Search the source title, the signature element and the traits — the
      // three things someone actually remembers a look by.
      return (
        preset.sourceTitle.toLowerCase().includes(query) ||
        preset.signatureElement.toLowerCase().includes(query) ||
        preset.categoryLabel.toLowerCase().includes(query) ||
        preset.traits.some((trait) => trait.toLowerCase().includes(query))
      )
    })
  }, [search, medium, category])

  /**
   * Selecting a style also warms its base font so the exact-text overlay
   * preview renders in the right face rather than falling back to sans.
   */
  const selectStyle = useCallback((preset: TitleStylePreset | null) => {
    setSelected(preset)
    if (preset) {
      void loadGoogleFont(preset.fontStartingPoint)
    }
  }, [])

  const resetFilters = useCallback(() => {
    setSearch('')
    setMedium(null)
    setCategory(null)
  }, [])

  return {
    approaches: TITLE_STYLE_APPROACHES,
    counts,
    filtered,
    totalCount: TITLE_STYLE_PRESETS.length,

    search,
    setSearch,
    medium,
    setMedium,
    category,
    setCategory,
    resetFilters,

    selected,
    selectStyle,
  }
}
