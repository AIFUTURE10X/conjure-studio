/**
 * Generic Mockup Drag Hook
 *
 * Handles logo and text dragging for any mockup type.
 * Print area constraints come from the mockup config.
 */

import { useState, useCallback, useEffect, RefObject } from 'react'
import type { PrintArea, Position, TextItem } from './mockup-types'

interface UseGenericDragProps {
  /** Reference to the mockup container element */
  containerRef: RefObject<HTMLDivElement | null>
  /** Print area constraints for logo (from config) */
  logoPrintArea: PrintArea
  /** Print area constraints for text (from config) */
  textPrintArea: PrintArea
  /** Current logo position */
  logoPosition: Position
  /** Callback when logo position changes */
  onLogoPositionChange: (pos: Position) => void
  /** Current brand text position */
  brandPosition: Position
  /** Callback when brand position changes */
  onBrandPositionChange: (pos: Position) => void
  /** Multiple text items */
  textItems: TextItem[]
  /** Callback when text items change */
  onTextItemsChange: (items: TextItem[]) => void
  /** Currently selected text ID */
  selectedTextId: string | null
  /** Callback when selected text changes */
  onSelectedTextIdChange: (id: string | null) => void
}

interface UseGenericDragReturn {
  /** Whether logo is currently being dragged */
  isDragging: boolean
  /** Whether any brand text is currently being dragged */
  isDraggingBrand: boolean
  /** ID of the text item being dragged (if any) */
  draggingTextId: string | null
  /** Start dragging the logo */
  handleDragStart: (e: React.MouseEvent | React.TouchEvent) => void
  /** Start dragging brand text */
  handleBrandDragStart: (e: React.MouseEvent | React.TouchEvent, textId?: string) => void
}

/**
 * Constrain a position within a print area
 */
function constrainToArea(x: number, y: number, area: PrintArea): Position {
  return {
    x: Math.max(area.left, Math.min(x, area.left + area.width)),
    y: Math.max(area.top, Math.min(y, area.top + area.height)),
  }
}

/**
 * Get client coordinates from mouse or touch event
 */
function getEventCoords(e: MouseEvent | TouchEvent): { clientX: number; clientY: number } {
  if ('touches' in e) {
    return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }
  }
  return { clientX: e.clientX, clientY: e.clientY }
}

/**
 * Convert client coordinates to percentage position within container
 */
function clientToPercent(
  clientX: number,
  clientY: number,
  rect: DOMRect
): Position {
  return {
    x: ((clientX - rect.left) / rect.width) * 100,
    y: ((clientY - rect.top) / rect.height) * 100,
  }
}

export function useGenericDrag({
  containerRef,
  logoPrintArea,
  textPrintArea,
  logoPosition,
  onLogoPositionChange,
  brandPosition,
  onBrandPositionChange,
  textItems,
  onTextItemsChange,
  selectedTextId,
  onSelectedTextIdChange,
}: UseGenericDragProps): UseGenericDragReturn {
  const [isDragging, setIsDragging] = useState(false)
  const [isDraggingBrand, setIsDraggingBrand] = useState(false)
  const [draggingTextId, setDraggingTextId] = useState<string | null>(null)

  // Offset tracking for smooth drag (prevents jump on drag start)
  const [logoDragOffset, setLogoDragOffset] = useState<Position>({ x: 0, y: 0 })
  const [brandDragOffset, setBrandDragOffset] = useState<Position>({ x: 0, y: 0 })

  // ============ Logo Drag Handlers ============

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!containerRef.current) return

    // Capture offset between mouse position and element center for smooth drag
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const rect = containerRef.current.getBoundingClientRect()
    const mousePos = clientToPercent(clientX, clientY, rect)

    // Offset = where user clicked - where element center is
    setLogoDragOffset({
      x: mousePos.x - logoPosition.x,
      y: mousePos.y - logoPosition.y,
    })

    setIsDragging(true)
  }, [containerRef, logoPosition])

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !containerRef.current) return

    const { clientX, clientY } = getEventCoords(e)
    const rect = containerRef.current.getBoundingClientRect()
    const rawPos = clientToPercent(clientX, clientY, rect)

    // Apply offset so element stays at same relative position under cursor
    const adjustedPos = {
      x: rawPos.x - logoDragOffset.x,
      y: rawPos.y - logoDragOffset.y,
    }
    const constrainedPos = constrainToArea(adjustedPos.x, adjustedPos.y, logoPrintArea)

    onLogoPositionChange(constrainedPos)
  }, [isDragging, containerRef, logoPrintArea, logoDragOffset, onLogoPositionChange])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // ============ Brand/Text Drag Handlers ============

  const handleBrandDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, textId?: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!containerRef.current) return

    // Capture offset between mouse position and element center for smooth drag
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const rect = containerRef.current.getBoundingClientRect()
    const mousePos = clientToPercent(clientX, clientY, rect)

    // Get current element position (either specific text item or main brand)
    let elementPos: Position
    if (textId) {
      const textItem = textItems.find(item => item.id === textId)
      elementPos = textItem?.position || brandPosition
    } else {
      elementPos = brandPosition
    }

    // Offset = where user clicked - where element center is
    setBrandDragOffset({
      x: mousePos.x - elementPos.x,
      y: mousePos.y - elementPos.y,
    })

    setIsDraggingBrand(true)
    setDraggingTextId(textId || null)
    if (textId) onSelectedTextIdChange(textId)
  }, [containerRef, brandPosition, textItems, onSelectedTextIdChange])

  const handleBrandDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingBrand || !containerRef.current) return

    const { clientX, clientY } = getEventCoords(e)
    const rect = containerRef.current.getBoundingClientRect()
    const rawPos = clientToPercent(clientX, clientY, rect)

    // Apply offset so element stays at same relative position under cursor
    const adjustedPos = {
      x: rawPos.x - brandDragOffset.x,
      y: rawPos.y - brandDragOffset.y,
    }
    const constrainedPos = constrainToArea(adjustedPos.x, adjustedPos.y, textPrintArea)

    if (draggingTextId) {
      // Dragging a specific text item
      onTextItemsChange(textItems.map(item =>
        item.id === draggingTextId
          ? { ...item, position: constrainedPos }
          : item
      ))
    } else {
      // Dragging the main brand text
      onBrandPositionChange(constrainedPos)
    }
  }, [isDraggingBrand, containerRef, textPrintArea, brandDragOffset, draggingTextId, textItems, onTextItemsChange, onBrandPositionChange])

  const handleBrandDragEnd = useCallback(() => {
    setIsDraggingBrand(false)
    setDraggingTextId(null)
  }, [])

  // ============ Event Listeners ============

  // Logo drag listeners
  useEffect(() => {
    if (!isDragging) return

    window.addEventListener('mousemove', handleDragMove)
    window.addEventListener('mouseup', handleDragEnd)
    window.addEventListener('touchmove', handleDragMove)
    window.addEventListener('touchend', handleDragEnd)

    return () => {
      window.removeEventListener('mousemove', handleDragMove)
      window.removeEventListener('mouseup', handleDragEnd)
      window.removeEventListener('touchmove', handleDragMove)
      window.removeEventListener('touchend', handleDragEnd)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  // Brand text drag listeners
  useEffect(() => {
    if (!isDraggingBrand) return

    window.addEventListener('mousemove', handleBrandDragMove)
    window.addEventListener('mouseup', handleBrandDragEnd)
    window.addEventListener('touchmove', handleBrandDragMove)
    window.addEventListener('touchend', handleBrandDragEnd)

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
