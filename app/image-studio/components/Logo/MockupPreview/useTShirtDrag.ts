/**
 * T-Shirt Drag Hook
 * Handles logo and brand text dragging logic for the mockup
 */

import { useState, useCallback, useEffect, RefObject } from 'react'
import { type TextItem } from './text-effects-config'

// Print area constraints (percentage of container)
export const PRINT_AREA = { top: 18, left: 25, width: 50, height: 45 }
export const BRAND_PRINT_AREA = { top: 10, left: 10, width: 80, height: 80 }

interface UseTShirtDragProps {
  containerRef: RefObject<HTMLDivElement | null>
  logoPosition: { x: number; y: number }
  onLogoPositionChange: (pos: { x: number; y: number }) => void
  brandPosition: { x: number; y: number }
  onBrandPositionChange: (pos: { x: number; y: number }) => void
  textItems: TextItem[]
  onTextItemsChange: (items: TextItem[]) => void
  selectedTextId: string | null
  onSelectedTextIdChange: (id: string | null) => void
}

export function useTShirtDrag({
  containerRef,
  logoPosition,
  onLogoPositionChange,
  brandPosition,
  onBrandPositionChange,
  textItems,
  onTextItemsChange,
  selectedTextId,
  onSelectedTextIdChange,
}: UseTShirtDragProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isDraggingBrand, setIsDraggingBrand] = useState(false)
  const [draggingTextId, setDraggingTextId] = useState<string | null>(null)

  // ============ Logo Drag Handlers ============
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !containerRef.current) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const rect = containerRef.current.getBoundingClientRect()
    let newX = ((clientX - rect.left) / rect.width) * 100
    let newY = ((clientY - rect.top) / rect.height) * 100
    newX = Math.max(PRINT_AREA.left, Math.min(newX, PRINT_AREA.left + PRINT_AREA.width))
    newY = Math.max(PRINT_AREA.top, Math.min(newY, PRINT_AREA.top + PRINT_AREA.height))
    onLogoPositionChange({ x: newX, y: newY })
  }, [isDragging, containerRef, onLogoPositionChange])

  const handleDragEnd = useCallback(() => { setIsDragging(false) }, [])

  // ============ Brand Drag Handlers ============
  const handleBrandDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, textId?: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingBrand(true)
    setDraggingTextId(textId || null)
    if (textId) onSelectedTextIdChange(textId)
  }, [onSelectedTextIdChange])

  const handleBrandDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingBrand || !containerRef.current) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const rect = containerRef.current.getBoundingClientRect()
    let newX = ((clientX - rect.left) / rect.width) * 100
    let newY = ((clientY - rect.top) / rect.height) * 100
    newX = Math.max(BRAND_PRINT_AREA.left, Math.min(newX, BRAND_PRINT_AREA.left + BRAND_PRINT_AREA.width))
    newY = Math.max(BRAND_PRINT_AREA.top, Math.min(newY, BRAND_PRINT_AREA.top + BRAND_PRINT_AREA.height))

    if (draggingTextId) {
      onTextItemsChange(textItems.map(item =>
        item.id === draggingTextId ? { ...item, position: { x: newX, y: newY } } : item
      ))
    } else {
      onBrandPositionChange({ x: newX, y: newY })
    }
  }, [isDraggingBrand, containerRef, draggingTextId, textItems, onTextItemsChange, onBrandPositionChange])

  const handleBrandDragEnd = useCallback(() => {
    setIsDraggingBrand(false)
    setDraggingTextId(null)
  }, [])

  // Drag listeners for logo
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove)
      window.addEventListener('mouseup', handleDragEnd)
      window.addEventListener('touchmove', handleDragMove)
      window.addEventListener('touchend', handleDragEnd)
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove)
      window.removeEventListener('mouseup', handleDragEnd)
      window.removeEventListener('touchmove', handleDragMove)
      window.removeEventListener('touchend', handleDragEnd)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  // Drag listeners for brand text
  useEffect(() => {
    if (isDraggingBrand) {
      window.addEventListener('mousemove', handleBrandDragMove)
      window.addEventListener('mouseup', handleBrandDragEnd)
      window.addEventListener('touchmove', handleBrandDragMove)
      window.addEventListener('touchend', handleBrandDragEnd)
    }
    return () => {
      window.removeEventListener('mousemove', handleBrandDragMove)
      window.removeEventListener('mouseup', handleBrandDragEnd)
      window.removeEventListener('touchmove', handleBrandDragMove)
      window.removeEventListener('touchend', handleBrandDragEnd)
    }
  }, [isDraggingBrand, handleBrandDragMove, handleBrandDragEnd])

  return {
    isDragging,
    isDraggingBrand,
    draggingTextId,
    handleDragStart,
    handleBrandDragStart,
  }
}
