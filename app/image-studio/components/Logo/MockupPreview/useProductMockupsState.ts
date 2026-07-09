"use client"

/**
 * Product Mockups Panel State Hook
 *
 * Manages custom products, selection state, and save-to-history logic.
 */

import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { getMockupConfig, customUploadConfig } from './configs'
import { getSubCategoryById, DEFAULT_SUB_CATEGORY_ID, DEFAULT_MOCKUP_ID } from './categories'
import type { MockupExportControls } from './generic'
import { getUserId } from '../LogoHistory/useLogoHistoryData'
import { useMockupLocalStorage, type SavedMockup } from './useMockupLocalStorage'

// Re-export SavedMockup for consumers
export type { SavedMockup }

interface UseProductMockupsStateProps {
  brandName?: string
  onLogoUrlChange?: (url: string) => void
}

export function useProductMockupsState({ brandName, onLogoUrlChange }: UseProductMockupsStateProps) {
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>(DEFAULT_SUB_CATEGORY_ID)
  const [selectedMockupId, setSelectedMockupId] = useState<string>(DEFAULT_MOCKUP_ID)
  const [controls, setControls] = useState<MockupExportControls | null>(null)
  const [showPhotoGenerator, setShowPhotoGenerator] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [isSavingToHistory, setIsSavingToHistory] = useState(false)
  const [processedLogoUrl, setProcessedLogoUrlInternal] = useState<string | null>(null)

  // Ref for callback to avoid stale closures
  const onLogoUrlChangeRef = useRef(onLogoUrlChange)
  onLogoUrlChangeRef.current = onLogoUrlChange

  // Wrapper that updates state AND notifies parent
  const setProcessedLogoUrl = useCallback((url: string | null) => {
    setProcessedLogoUrlInternal(url)
    if (url && onLogoUrlChangeRef.current) {
      onLogoUrlChangeRef.current(url)
    }
  }, [])

  // Use extracted localStorage hook
  const localStorage = useMockupLocalStorage({
    brandName,
    selectedMockupId,
    selectedSubCategoryId,
    processedLogoUrl,
  })

  // Add custom product with selection update
  const handleAddCustomProduct = useCallback((product: Parameters<typeof localStorage.handleAddCustomProduct>[0]) => {
    const newProduct = localStorage.handleAddCustomProduct(product)
    setSelectedSubCategoryId(newProduct.id)
    setSelectedMockupId(newProduct.id)
  }, [localStorage])

  // Remove custom product with selection reset
  const handleRemoveCustomProduct = useCallback((productId: string) => {
    const shouldReset = localStorage.handleRemoveCustomProduct(productId)
    if (shouldReset) {
      setSelectedSubCategoryId(DEFAULT_SUB_CATEGORY_ID)
      setSelectedMockupId(DEFAULT_MOCKUP_ID)
    }
  }, [localStorage])

  // Load a saved mockup
  const handleLoadMockup = useCallback((mockup: SavedMockup) => {
    setSelectedSubCategoryId(mockup.subCategoryId)
    setSelectedMockupId(mockup.productId)
    localStorage.setLoadedLogoUrl(mockup.logoUrl)
    setProcessedLogoUrlInternal(mockup.processedLogoUrl)
    localStorage.setLoadedBrandSettings(mockup.brandSettings || null)
    if (mockup.processedLogoUrl && onLogoUrlChangeRef.current) {
      onLogoUrlChangeRef.current(mockup.processedLogoUrl)
    }
    toast.success('Mockup loaded!')
  }, [localStorage])

  // Clear the loaded mockup
  const clearLoadedMockup = useCallback(() => {
    localStorage.clearLoadedMockup()
    setProcessedLogoUrlInternal(null)
  }, [localStorage])

  // Clear selection entirely
  const clearSelection = useCallback(() => {
    setSelectedMockupId('')
    setSelectedSubCategoryId('')
  }, [])

  // Get product config (handles both built-in and custom)
  const getProductConfig = useCallback((mockupId: string) => {
    const builtIn = getMockupConfig(mockupId)
    if (builtIn) return builtIn
    const custom = localStorage.customProducts.find(p => p.id === mockupId)
    if (custom) return { ...customUploadConfig, id: custom.id, name: custom.name }
    return undefined
  }, [localStorage.customProducts])

  const currentConfig = getProductConfig(selectedMockupId)
  const currentCustomProduct = localStorage.customProducts.find(p => p.id === selectedMockupId)

  // Handle sub-category selection
  const handleSelectSubCategory = useCallback((subCategoryId: string, mockupId: string) => {
    setSelectedSubCategoryId(subCategoryId)
    setSelectedMockupId(mockupId)
  }, [])

  // Get selected label
  const getSelectedLabel = useCallback(() => {
    const subCategory = getSubCategoryById(selectedSubCategoryId)
    if (subCategory) return subCategory.label + (subCategory.hasFrontBack ? ' (Front & Back)' : '')
    const custom = localStorage.customProducts.find(p => p.id === selectedMockupId)
    if (custom) return custom.name
    return 'Select Product'
  }, [selectedSubCategoryId, selectedMockupId, localStorage.customProducts])

  // Handle controls ready
  const handleControlsReady = useCallback((newControls: MockupExportControls) => {
    setControls(newControls)
  }, [])

  // Save mockup to history
  const handleSaveToHistory = useCallback(async () => {
    if (!controls || isSavingToHistory) return
    setIsSavingToHistory(true)
    try {
      const canvas = await controls.captureCanvas()
      if (!canvas) { toast.error('Failed to capture mockup'); return }

      const dataUrl = canvas.toDataURL('image/png')
      const productName = currentConfig?.name || 'Product'

      const response = await fetch('/api/logo-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getUserId(),
          imageUrl: dataUrl,
          prompt: `${productName} mockup - ${brandName || 'Brand'}`,
          style: 'mockup',
          config: { mockupType: selectedMockupId, subCategory: selectedSubCategoryId, productName, brandName: brandName || 'Brand' },
        }),
      })

      const data = await response.json()
      if (data.historyItem) toast.success('Saved to history!')
      else toast.error('Failed to save to history')
    } catch (error) {
      console.error('Failed to save mockup to history:', error)
      toast.error('Failed to save to history')
    } finally {
      setIsSavingToHistory(false)
    }
  }, [controls, isSavingToHistory, currentConfig, brandName, selectedMockupId, selectedSubCategoryId])

  return {
    selectedSubCategoryId,
    selectedMockupId,
    handleSelectSubCategory,
    getSelectedLabel,
    controls,
    handleControlsReady,
    showPhotoGenerator,
    setShowPhotoGenerator,
    isExpanded,
    setIsExpanded,
    showAddProductModal,
    setShowAddProductModal,
    customProducts: localStorage.customProducts,
    handleAddCustomProduct,
    handleRemoveCustomProduct,
    currentCustomProduct,
    currentConfig,
    getProductConfig,
    isSavingToHistory,
    handleSaveToHistory,
    processedLogoUrl,
    setProcessedLogoUrl,
    savedMockups: localStorage.savedMockups,
    handleSaveMockup: localStorage.handleSaveMockup,
    handleLoadMockup,
    handleDeleteSavedMockup: localStorage.handleDeleteSavedMockup,
    loadedLogoUrl: localStorage.loadedLogoUrl,
    setLoadedLogoUrl: localStorage.setLoadedLogoUrl,
    loadedBrandSettings: localStorage.loadedBrandSettings,
    clearLoadedMockup,
    clearSelection,
  }
}
