"use client"

/**
 * Custom Products and Saved Mockups Storage Hook
 * Extracted from useProductMockupsState to reduce file size
 */

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import type { CustomProduct } from './AddCustomProductModal'
import type { BrandSettings } from './generic'

const CUSTOM_PRODUCTS_KEY = 'image-studio-custom-products'
const SAVED_MOCKUPS_KEY = 'image-studio-saved-mockups'
const MAX_SAVED_MOCKUPS = 10

/** Saved mockup configuration for quick reload */
export interface SavedMockup {
  id: string
  name: string
  logoUrl: string
  processedLogoUrl: string | null
  brandName: string
  productId: string
  subCategoryId: string
  timestamp: number
  thumbnail?: string
  brandSettings?: BrandSettings
}

interface UseMockupLocalStorageProps {
  brandName?: string
  selectedMockupId: string
  selectedSubCategoryId: string
  processedLogoUrl: string | null
}

export function useMockupLocalStorage({
  brandName,
  selectedMockupId,
  selectedSubCategoryId,
  processedLogoUrl,
}: UseMockupLocalStorageProps) {
  const [customProducts, setCustomProducts] = useState<CustomProduct[]>([])
  const [savedMockups, setSavedMockups] = useState<SavedMockup[]>([])
  const [loadedLogoUrl, setLoadedLogoUrl] = useState<string | null>(null)
  const [loadedBrandSettings, setLoadedBrandSettings] = useState<BrandSettings | null>(null)

  // Load custom products from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_PRODUCTS_KEY)
      if (saved) setCustomProducts(JSON.parse(saved))
    } catch (e) {
      console.error('Failed to load custom products:', e)
    }
  }, [])

  // Load saved mockups from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_MOCKUPS_KEY)
      if (saved) setSavedMockups(JSON.parse(saved))
    } catch (e) {
      console.error('Failed to load saved mockups:', e)
    }
  }, [])

  // Save custom products to localStorage
  const saveCustomProducts = useCallback((products: CustomProduct[]) => {
    setCustomProducts(products)
    try {
      localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(products))
    } catch (e) {
      console.error('Failed to save custom products:', e)
    }
  }, [])

  // Add a new custom product
  const handleAddCustomProduct = useCallback((product: Omit<CustomProduct, 'id'>) => {
    const newProduct: CustomProduct = { ...product, id: `custom-${Date.now()}` }
    saveCustomProducts([...customProducts, newProduct])
    return newProduct
  }, [customProducts, saveCustomProducts])

  // Remove a custom product
  const handleRemoveCustomProduct = useCallback((productId: string) => {
    const updated = customProducts.filter(p => p.id !== productId)
    saveCustomProducts(updated)
    return selectedMockupId === productId
  }, [customProducts, saveCustomProducts, selectedMockupId])

  // Save a mockup to localStorage
  const handleSaveMockup = useCallback(async (logoUrl: string, name: string, thumbnail?: string, brandSettings?: BrandSettings) => {
    const newMockup: SavedMockup = {
      id: `mockup-${Date.now()}`,
      name: name || `Preset ${savedMockups.length + 1}`,
      logoUrl,
      processedLogoUrl,
      brandName: brandName || 'Brand',
      productId: selectedMockupId,
      subCategoryId: selectedSubCategoryId,
      timestamp: Date.now(),
      thumbnail,
      brandSettings,
    }
    const updated = [newMockup, ...savedMockups].slice(0, MAX_SAVED_MOCKUPS)
    setSavedMockups(updated)
    try {
      localStorage.setItem(SAVED_MOCKUPS_KEY, JSON.stringify(updated))
      toast.success('Mockup saved!')
    } catch (e) {
      console.error('Failed to save mockup:', e)
      toast.error('Failed to save mockup')
    }
  }, [savedMockups, processedLogoUrl, brandName, selectedMockupId, selectedSubCategoryId])

  // Delete a saved mockup
  const handleDeleteSavedMockup = useCallback((mockupId: string) => {
    const updated = savedMockups.filter(m => m.id !== mockupId)
    setSavedMockups(updated)
    try {
      localStorage.setItem(SAVED_MOCKUPS_KEY, JSON.stringify(updated))
    } catch (e) {
      console.error('Failed to delete saved mockup:', e)
    }
  }, [savedMockups])

  // Clear the loaded mockup
  const clearLoadedMockup = useCallback(() => {
    setLoadedLogoUrl(null)
    setLoadedBrandSettings(null)
  }, [])

  return {
    customProducts,
    handleAddCustomProduct,
    handleRemoveCustomProduct,
    savedMockups,
    handleSaveMockup,
    handleDeleteSavedMockup,
    loadedLogoUrl,
    setLoadedLogoUrl,
    loadedBrandSettings,
    setLoadedBrandSettings,
    clearLoadedMockup,
  }
}
