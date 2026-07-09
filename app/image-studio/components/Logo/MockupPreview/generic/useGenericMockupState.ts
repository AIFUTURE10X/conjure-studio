"use client"

/**
 * Generic Mockup State Hook
 *
 * Manages all state for the GenericMockup component using useReducer.
 * Provides batched updates and memoized setters for performance.
 */

import { useReducer, useEffect, useRef, useCallback, useMemo } from 'react'
import type { MockupConfig, ProductColor, Position, TextEffect, TextItem, MockupView, BrandSettings } from './mockup-types'
import { mockupReducer } from './mockupReducer'
import { createInitialState } from './mockupReducer.utils'

export interface UseGenericMockupStateConfig {
  config: MockupConfig
  brandName: string
  externalProcessedLogoUrl?: string
  logoUrl?: string
  customProductImageUrl?: string
  onProcessedLogoChange?: (url: string | null) => void
  savedBrandSettings?: BrandSettings | null
}

export function useGenericMockupState({
  config,
  brandName,
  externalProcessedLogoUrl,
  logoUrl,
  customProductImageUrl,
  onProcessedLogoChange,
  savedBrandSettings,
}: UseGenericMockupStateConfig) {
  // Single reducer for all state
  const [state, dispatch] = useReducer(
    mockupReducer,
    { config, brandName },
    ({ config, brandName }) => createInitialState(config, brandName)
  )

  // Ref for callback to avoid stale closure
  const onProcessedLogoChangeRef = useRef(onProcessedLogoChange)
  onProcessedLogoChangeRef.current = onProcessedLogoChange

  // ============ Memoized Setters (dispatch wrappers) ============

  // Color setters
  const setSelectedColor = useCallback((color: ProductColor) => {
    dispatch({ type: 'SET_COLOR', payload: color })
  }, [])

  const setShowColorPicker = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_COLOR_PICKER', payload: show })
  }, [])

  // Logo setters
  const setLogoPosition = useCallback((pos: Position) => {
    dispatch({ type: 'SET_LOGO_POSITION', payload: pos })
  }, [])

  const setLogoScale = useCallback((scale: number) => {
    dispatch({ type: 'SET_LOGO_SCALE', payload: scale })
  }, [])

  // Brand setters
  const setShowBrandName = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_BRAND_NAME', payload: show })
  }, [])

  const setEditableBrandName = useCallback((name: string) => {
    dispatch({ type: 'SET_BRAND_NAME', payload: name })
  }, [])

  const setBrandPosition = useCallback((pos: Position) => {
    dispatch({ type: 'SET_BRAND_POSITION', payload: pos })
  }, [])

  const setBrandScale = useCallback((scale: number) => {
    dispatch({ type: 'SET_BRAND_SCALE', payload: scale })
  }, [])

  const setBrandFont = useCallback((font: string) => {
    dispatch({ type: 'SET_BRAND_FONT', payload: font })
  }, [])

  const setBrandColor = useCallback((color: string) => {
    dispatch({ type: 'SET_BRAND_COLOR', payload: color })
  }, [])

  const setBrandEffect = useCallback((effect: TextEffect) => {
    dispatch({ type: 'SET_BRAND_EFFECT', payload: effect })
  }, [])

  const setBrandRotation = useCallback((rotation: number) => {
    dispatch({ type: 'SET_BRAND_ROTATION', payload: rotation })
  }, [])

  const setBrandWeight = useCallback((weight: number) => {
    dispatch({ type: 'SET_BRAND_WEIGHT', payload: weight })
  }, [])

  const setShowFontPicker = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_FONT_PICKER', payload: show })
  }, [])

  // Text items setters
  const setTextItems = useCallback((items: TextItem[] | ((prev: TextItem[]) => TextItem[])) => {
    if (typeof items === 'function') {
      // For functional updates, we need current state
      dispatch({ type: 'SET_TEXT_ITEMS', payload: items(state.textItems.items) })
    } else {
      dispatch({ type: 'SET_TEXT_ITEMS', payload: items })
    }
  }, [state.textItems.items])

  const setSelectedTextId = useCallback((id: string | null) => {
    dispatch({ type: 'SET_SELECTED_TEXT_ID', payload: id })
  }, [])

  // Background removal setters
  const setIsRemovingBg = useCallback((isRemoving: boolean) => {
    dispatch({ type: 'SET_IS_REMOVING_BG', payload: isRemoving })
  }, [])

  const setProcessedLogoUrl = useCallback((url: string | null) => {
    dispatch({ type: 'SET_PROCESSED_LOGO_URL', payload: url })
  }, [])

  const setProcessedProductUrl = useCallback((url: string | null) => {
    dispatch({ type: 'SET_PROCESSED_PRODUCT_URL', payload: url })
  }, [])

  // Canvas setters
  const setSelectedView = useCallback((view: MockupView) => {
    dispatch({ type: 'SET_VIEW', payload: view })
  }, [])

  const setCanvasZoom = useCallback((zoom: number) => {
    dispatch({ type: 'SET_ZOOM', payload: zoom })
  }, [])

  const setShowGrid = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_GRID', payload: show })
  }, [])

  const setShowRulers = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_RULERS', payload: show })
  }, [])

  // UI setters
  const setPhotoLoadFailed = useCallback((failed: boolean) => {
    dispatch({ type: 'SET_PHOTO_LOAD_FAILED', payload: failed })
  }, [])

  // ============ Effects ============

  // Reset processed logo when original logo changes
  useEffect(() => {
    if (!externalProcessedLogoUrl) {
      dispatch({ type: 'SET_PROCESSED_LOGO_URL', payload: null })
    }
  }, [logoUrl, externalProcessedLogoUrl])

  // Reset processed product when original product changes
  useEffect(() => {
    dispatch({ type: 'SET_PROCESSED_PRODUCT_URL', payload: null })
  }, [customProductImageUrl])

  // Restore brand settings from preset (batched update)
  useEffect(() => {
    if (savedBrandSettings) {
      console.log('[useGenericMockupState] Restoring brand settings from preset:', savedBrandSettings)
      dispatch({ type: 'RESTORE_BRAND_SETTINGS', payload: savedBrandSettings })
    }
  }, [savedBrandSettings])

  // ============ Computed Values ============

  const hasMultipleViews = (config.features?.multipleViews?.length ?? 0) > 1

  // Effective logo URL: external > local processed > original
  const effectiveLogoUrl = externalProcessedLogoUrl || state.backgroundRemoval.processedLogoUrl || logoUrl

  // Effective product URL: processed > original
  const effectiveProductImageUrl = state.backgroundRemoval.processedProductUrl || customProductImageUrl

  // Debug logging
  console.log('[useGenericMockupState] effectiveLogoUrl computed:', {
    hasExternal: !!externalProcessedLogoUrl,
    hasLocal: !!state.backgroundRemoval.processedLogoUrl,
    hasOriginal: !!logoUrl,
    using: externalProcessedLogoUrl ? 'EXTERNAL' : state.backgroundRemoval.processedLogoUrl ? 'LOCAL' : logoUrl ? 'ORIGINAL' : 'NONE',
  })

  // ============ Handlers ============

  const handleReset = useCallback(() => {
    console.log('[GenericMockup] Reset triggered')
    dispatch({ type: 'RESET', payload: { config, brandName } })
  }, [config, brandName])

  const getBrandSettings = useCallback((): BrandSettings => ({
    editableBrandName: state.brand.name,
    brandPosition: state.brand.position,
    brandScale: state.brand.scale,
    brandFont: state.brand.font,
    brandColor: state.brand.color,
    brandEffect: state.brand.effect,
    brandRotation: state.brand.rotation,
    brandWeight: state.brand.weight,
    showBrandName: state.brand.show,
    textItems: state.textItems.items,
  }), [state.brand, state.textItems.items])

  // ============ Return Interface (backward compatible) ============

  return {
    // Color state
    selectedColor: state.color.selected,
    setSelectedColor,
    showColorPicker: state.color.showPicker,
    setShowColorPicker,

    // Logo state
    logoPosition: state.logo.position,
    setLogoPosition,
    logoScale: state.logo.scale,
    setLogoScale,

    // Brand text state
    showBrandName: state.brand.show,
    setShowBrandName,
    editableBrandName: state.brand.name,
    setEditableBrandName,
    brandPosition: state.brand.position,
    setBrandPosition,
    brandScale: state.brand.scale,
    setBrandScale,
    brandFont: state.brand.font,
    setBrandFont,
    brandColor: state.brand.color,
    setBrandColor,
    brandEffect: state.brand.effect,
    setBrandEffect,
    brandRotation: state.brand.rotation,
    setBrandRotation,
    brandWeight: state.brand.weight,
    setBrandWeight,
    showFontPicker: state.brand.showFontPicker,
    setShowFontPicker,

    // Text items
    textItems: state.textItems.items,
    setTextItems,
    selectedTextId: state.textItems.selectedId,
    setSelectedTextId,

    // Background removal
    isRemovingBg: state.backgroundRemoval.isRemoving,
    setIsRemovingBg,
    processedLogoUrl: state.backgroundRemoval.processedLogoUrl,
    setProcessedLogoUrl,
    processedProductUrl: state.backgroundRemoval.processedProductUrl,
    setProcessedProductUrl,

    // View state
    selectedView: state.canvas.view,
    setSelectedView,
    hasMultipleViews,

    // Canvas zoom
    canvasZoom: state.canvas.zoom,
    setCanvasZoom,

    // Grid overlay
    showGrid: state.canvas.showGrid,
    setShowGrid,

    // Rulers
    showRulers: state.canvas.showRulers,
    setShowRulers,

    // Photo state
    photoLoadFailed: state.ui.photoLoadFailed,
    setPhotoLoadFailed,

    // Computed values
    effectiveLogoUrl,
    effectiveProductImageUrl,

    // Refs
    onProcessedLogoChangeRef,

    // Handlers
    handleReset,
    getBrandSettings,
  }
}
