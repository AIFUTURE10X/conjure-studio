"use client"

/**
 * Realistic T-Shirt Mockup State Hook
 *
 * Manages all state for the RealisticTShirtMockup component.
 * Extracted to keep the main component under 300 lines.
 */

import { useState, useCallback, useEffect } from 'react'
import { TSHIRT_COLORS, type TShirtColor } from './tshirt-assets'
import { buildGoogleFontsUrl } from '@/app/image-studio/constants/real-fonts'
import { type TextEffect, type TextItem, createTextItem } from './text-effects-config'

interface UseRealisticTShirtStateConfig {
  brandName: string
}

export function useRealisticTShirtState({ brandName }: UseRealisticTShirtStateConfig) {
  // T-shirt color
  const [selectedColor, setSelectedColor] = useState<TShirtColor>(TSHIRT_COLORS[0])
  const [showColorPicker, setShowColorPicker] = useState(false)

  // Logo state
  const [logoPosition, setLogoPosition] = useState({ x: 50, y: 35 })
  const [logoScale, setLogoScale] = useState(1)

  // Brand state
  const [showBrandName, setShowBrandName] = useState(true)
  const [editableBrandName, setEditableBrandName] = useState(brandName)
  const [isEditingName, setIsEditingName] = useState(false)
  const [brandPosition, setBrandPosition] = useState({ x: 50, y: 78 })
  const [brandScale, setBrandScale] = useState(1)
  const [brandFont, setBrandFont] = useState<string>('montserrat')
  const [brandColor, setBrandColor] = useState<string>('#ffffff')
  const [brandEffect, setBrandEffect] = useState<TextEffect>('none')
  const [brandRotation, setBrandRotation] = useState(0)
  const [brandWeight, setBrandWeight] = useState(400)
  const [showFontPicker, setShowFontPicker] = useState(false)
  const [showTextColorPicker, setShowTextColorPicker] = useState(false)
  const [showEffectPicker, setShowEffectPicker] = useState(false)

  // Multiple text items state
  const [textItems, setTextItems] = useState<TextItem[]>([])
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null)

  // Lightbox state
  const [showLightbox, setShowLightbox] = useState(false)

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement('link')
    link.href = buildGoogleFontsUrl()
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [])

  // Reset handler
  const handleReset = useCallback(() => {
    setLogoPosition({ x: 50, y: 35 })
    setLogoScale(1)
    setBrandPosition({ x: 50, y: 78 })
    setBrandScale(1)
    setBrandFont('montserrat')
    setBrandColor('#ffffff')
    setBrandEffect('none')
    setBrandRotation(0)
    setBrandWeight(400)
    setTextItems([])
    setSelectedTextId(null)
  }, [])

  // Multiple text handlers
  const handleAddText = useCallback(() => {
    const newItem = createTextItem({
      content: `Text ${textItems.length + 1}`,
      position: { x: 50, y: 65 + (textItems.length * 8) % 30 },
    })
    setTextItems(prev => [...prev, newItem])
    setSelectedTextId(newItem.id)
  }, [textItems.length])

  const handleRemoveText = useCallback((id: string) => {
    setTextItems(prev => prev.filter(item => item.id !== id))
    if (selectedTextId === id) setSelectedTextId(null)
  }, [selectedTextId])

  const handleSelectText = useCallback((id: string) => {
    setSelectedTextId(id)
    const item = textItems.find(t => t.id === id)
    if (item) {
      setEditableBrandName(item.content)
      setBrandFont(item.font)
      setBrandColor(item.color)
      setBrandScale(item.scale)
      setBrandEffect(item.effect)
      setBrandRotation(item.rotation)
      setBrandPosition(item.position)
    }
  }, [textItems])

  const handleUpdateSelectedText = useCallback((updates: Partial<TextItem>) => {
    if (!selectedTextId) return
    setTextItems(prev => prev.map(item =>
      item.id === selectedTextId ? { ...item, ...updates } : item
    ))
  }, [selectedTextId])

  const handleUpdateTextContent = useCallback((id: string, content: string) => {
    setTextItems(prev => prev.map(item =>
      item.id === id ? { ...item, content } : item
    ))
  }, [])

  return {
    // T-shirt color
    selectedColor, setSelectedColor,
    showColorPicker, setShowColorPicker,

    // Logo
    logoPosition, setLogoPosition,
    logoScale, setLogoScale,

    // Brand
    showBrandName, setShowBrandName,
    editableBrandName, setEditableBrandName,
    isEditingName, setIsEditingName,
    brandPosition, setBrandPosition,
    brandScale, setBrandScale,
    brandFont, setBrandFont,
    brandColor, setBrandColor,
    brandEffect, setBrandEffect,
    brandRotation, setBrandRotation,
    brandWeight, setBrandWeight,
    showFontPicker, setShowFontPicker,
    showTextColorPicker, setShowTextColorPicker,
    showEffectPicker, setShowEffectPicker,

    // Multiple text items
    textItems, setTextItems,
    selectedTextId, setSelectedTextId,

    // Lightbox
    showLightbox, setShowLightbox,

    // Handlers
    handleReset,
    handleAddText,
    handleRemoveText,
    handleSelectText,
    handleUpdateSelectedText,
    handleUpdateTextContent,
  }
}
