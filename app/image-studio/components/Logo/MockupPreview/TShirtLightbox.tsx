"use client"

/**
 * T-Shirt Lightbox Component
 * Full-screen view with zoom/pan and all sidebar settings
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react'
import { type TShirtColor } from './tshirt-assets'
import { TShirtCanvas } from './TShirtCanvas'
import { LogoDraggable } from './LogoDraggable'
import { BrandTextDraggable } from './BrandTextDraggable'
import { LogoSidebar, BrandSidebar } from './MockupSidebars'
import { useTShirtDrag } from './useTShirtDrag'
import { type TextEffect, type TextItem } from './text-effects-config'

interface TShirtLightboxProps {
  isOpen: boolean
  onClose: () => void
  logoUrl: string
  selectedColor: TShirtColor
  onColorChange: (color: TShirtColor) => void
  logoPosition: { x: number; y: number }
  onLogoPositionChange: (pos: { x: number; y: number }) => void
  logoScale: number
  onLogoScaleChange: (scale: number) => void
  showBrandName: boolean
  onToggleBrandName: () => void
  editableBrandName: string
  onEditableBrandNameChange: (value: string) => void
  brandFont: string
  onBrandFontChange: (font: string) => void
  brandColor: string
  onBrandColorChange: (color: string) => void
  brandPosition: { x: number; y: number }
  onBrandPositionChange: (pos: { x: number; y: number }) => void
  brandScale: number
  onBrandScaleChange: (scale: number) => void
  brandEffect: TextEffect
  onBrandEffectChange: (effect: TextEffect) => void
  brandRotation: number
  onBrandRotationChange: (rotation: number) => void
  brandWeight?: number
  onBrandWeightChange?: (weight: number) => void
  textItems: TextItem[]
  onTextItemsChange: (items: TextItem[]) => void
  selectedTextId: string | null
  onSelectedTextIdChange: (id: string | null) => void
}

export function TShirtLightbox({
  isOpen, onClose, logoUrl,
  selectedColor, onColorChange,
  logoPosition, onLogoPositionChange,
  logoScale, onLogoScaleChange,
  showBrandName, onToggleBrandName,
  editableBrandName, onEditableBrandNameChange,
  brandFont, onBrandFontChange,
  brandColor, onBrandColorChange,
  brandPosition, onBrandPositionChange,
  brandScale, onBrandScaleChange,
  brandEffect, onBrandEffectChange,
  brandRotation, onBrandRotationChange,
  brandWeight = 400, onBrandWeightChange,
  textItems, onTextItemsChange,
  selectedTextId, onSelectedTextIdChange,
}: TShirtLightboxProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)

  const [zoomLevel, setZoomLevel] = useState(1)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showFontPicker, setShowFontPicker] = useState(false)
  const [showTextColorPicker, setShowTextColorPicker] = useState(false)
  const [showEffectPicker, setShowEffectPicker] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)

  // Pan state
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 })

  const { isDragging, isDraggingBrand, draggingTextId, handleDragStart, handleBrandDragStart } = useTShirtDrag({
    containerRef,
    logoPosition, onLogoPositionChange,
    brandPosition, onBrandPositionChange,
    textItems, onTextItemsChange,
    selectedTextId, onSelectedTextIdChange,
  })

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === '+' || e.key === '=') setZoomLevel(z => Math.min(3, z + 0.25))
      if (e.key === '-') setZoomLevel(z => Math.max(0.5, z - 0.25))
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Pan handlers for mouse drag on scroll container
  const handlePanStart = useCallback((e: React.MouseEvent) => {
    // Only pan if clicking on the background, not on logo/text
    if ((e.target as HTMLElement).closest('[data-draggable]')) return
    if (!scrollContainerRef.current) return

    setIsPanning(true)
    setPanStart({ x: e.clientX, y: e.clientY })
    setScrollStart({
      x: scrollContainerRef.current.scrollLeft,
      y: scrollContainerRef.current.scrollTop,
    })
    e.preventDefault()
  }, [])

  const handlePanMove = useCallback((e: MouseEvent) => {
    if (!isPanning || !scrollContainerRef.current) return

    const dx = e.clientX - panStart.x
    const dy = e.clientY - panStart.y

    scrollContainerRef.current.scrollLeft = scrollStart.x - dx
    scrollContainerRef.current.scrollTop = scrollStart.y - dy
  }, [isPanning, panStart, scrollStart])

  const handlePanEnd = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Pan event listeners
  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handlePanMove)
      window.addEventListener('mouseup', handlePanEnd)
    }
    return () => {
      window.removeEventListener('mousemove', handlePanMove)
      window.removeEventListener('mouseup', handlePanEnd)
    }
  }, [isPanning, handlePanMove, handlePanEnd])

  // Text item handlers
  const handleAddText = useCallback(() => {
    const newItem: TextItem = {
      id: `text-${Date.now()}`,
      content: `Text ${textItems.length + 1}`,
      font: 'montserrat', color: '#ffffff',
      position: { x: 50, y: 65 + (textItems.length * 8) % 30 },
      scale: 1, effect: 'none', rotation: 0,
    }
    onTextItemsChange([...textItems, newItem])
    onSelectedTextIdChange(newItem.id)
  }, [textItems, onTextItemsChange, onSelectedTextIdChange])

  const handleRemoveText = useCallback((id: string) => {
    onTextItemsChange(textItems.filter(item => item.id !== id))
    if (selectedTextId === id) onSelectedTextIdChange(null)
  }, [textItems, selectedTextId, onTextItemsChange, onSelectedTextIdChange])

  const handleSelectText = useCallback((id: string) => {
    onSelectedTextIdChange(id)
    const item = textItems.find(t => t.id === id)
    if (item) {
      onEditableBrandNameChange(item.content)
      onBrandFontChange(item.font)
      onBrandColorChange(item.color)
      onBrandScaleChange(item.scale)
      onBrandEffectChange(item.effect)
      onBrandRotationChange(item.rotation)
      onBrandPositionChange(item.position)
    }
  }, [textItems, onSelectedTextIdChange, onEditableBrandNameChange, onBrandFontChange, onBrandColorChange, onBrandScaleChange, onBrandEffectChange, onBrandRotationChange, onBrandPositionChange])

  const handleUpdateSelectedText = useCallback((updates: Partial<TextItem>) => {
    if (!selectedTextId) return
    onTextItemsChange(textItems.map(item =>
      item.id === selectedTextId ? { ...item, ...updates } : item
    ))
  }, [selectedTextId, textItems, onTextItemsChange])

  const handleUpdateTextContent = useCallback((id: string, content: string) => {
    onTextItemsChange(textItems.map(item => item.id === id ? { ...item, content } : item))
  }, [textItems, onTextItemsChange])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <button onClick={onClose} className="absolute top-4 right-4 z-10 p-3 rounded-full bg-zinc-800/80 text-white hover:bg-zinc-700 transition-colors" title="Close (Esc)">
        <X className="w-6 h-6" />
      </button>

      <div className="flex h-[90vh] max-w-[95vw] gap-2">
        {/* Left Sidebar */}
        <div className="bg-zinc-900/80 rounded-xl border border-zinc-700/50 overflow-hidden">
          <LogoSidebar
            selectedColor={selectedColor} showColorPicker={showColorPicker} logoScale={logoScale}
            onColorSelect={(c) => { onColorChange(c); setShowColorPicker(false) }}
            onToggleColorPicker={() => setShowColorPicker(!showColorPicker)}
            onScaleIncrease={() => onLogoScaleChange(Math.min(2, logoScale + 0.1))}
            onScaleDecrease={() => onLogoScaleChange(Math.max(0.5, logoScale - 0.1))}
          />
        </div>

        {/* Center: Mockup */}
        <div className="flex flex-col items-center gap-4">
          <div
            ref={scrollContainerRef}
            className={`relative overflow-auto bg-zinc-900 rounded-xl border border-zinc-700/50 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'} [&::-webkit-scrollbar]:hidden`}
            style={{ maxHeight: 'calc(90vh - 80px)', maxWidth: '60vw', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onMouseDown={handlePanStart}
          >
            <div ref={containerRef} className="relative aspect-square overflow-hidden"
              style={{ width: `${500 * zoomLevel}px`, height: `${500 * zoomLevel}px`, transition: 'width 0.2s, height 0.2s' }}
              onClick={() => onSelectedTextIdChange(null)}>
              <div className="absolute inset-0">
                <TShirtCanvas color={selectedColor} />
                <LogoDraggable ref={logoRef} logoUrl={logoUrl} position={logoPosition} scale={logoScale}
                  isDragging={isDragging} isDarkShirt={selectedColor.textColor === 'light'} onDragStart={handleDragStart} />
                <BrandTextDraggable text={editableBrandName} font={brandFont} color={brandColor} position={brandPosition}
                  scale={brandScale} weight={brandWeight} effect={brandEffect} rotation={brandRotation}
                  isDragging={isDraggingBrand && !draggingTextId} isVisible={showBrandName && !selectedTextId} onDragStart={handleBrandDragStart}
                  onResize={(scaleX, scaleY) => onBrandScaleChange((scaleX + scaleY) / 2)} />
                {textItems.map(item => (
                  <BrandTextDraggable key={item.id} id={item.id} text={item.content} font={item.font} color={item.color}
                    position={item.position} scale={item.scale} scaleX={item.scaleX} scaleY={item.scaleY} effect={item.effect} rotation={item.rotation}
                    isDragging={isDraggingBrand && draggingTextId === item.id} isVisible={showBrandName}
                    isSelected={selectedTextId === item.id} onDragStart={handleBrandDragStart} onClick={() => handleSelectText(item.id)}
                    onResize={(scaleX, scaleY) => onTextItemsChange(textItems.map(t => t.id === item.id ? { ...t, scaleX, scaleY, scale: (scaleX + scaleY) / 2 } : t))} />
                ))}
              </div>
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-4 bg-zinc-800/60 rounded-full px-4 py-2">
            <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))} disabled={zoomLevel <= 0.5}
              className="p-2 rounded-full bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-50" title="Zoom out (-)">
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-sm text-zinc-400 min-w-[50px] text-center">{Math.round(zoomLevel * 100)}%</span>
            <button onClick={() => setZoomLevel(z => Math.min(3, z + 0.25))} disabled={zoomLevel >= 3}
              className="p-2 rounded-full bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-50" title="Zoom in (+)">
              <ZoomIn className="w-5 h-5" />
            </button>
            <button onClick={() => setZoomLevel(1)} className="p-2 rounded-full bg-zinc-700 text-zinc-400 hover:text-white transition-colors" title="Reset zoom">
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-zinc-500 text-center flex items-center justify-center gap-2">
            <Move className="w-3 h-3" /> Drag to pan | Drag logo/text to move | +/- zoom | Esc close
          </p>
        </div>

        {/* Right Sidebar */}
        <div className="bg-zinc-900/80 rounded-xl border border-zinc-700/50 overflow-hidden">
          <BrandSidebar
            showBrandName={showBrandName} editableBrandName={editableBrandName} isEditingName={isEditingName}
            brandFont={brandFont} brandColor={brandColor} brandScale={brandScale} brandEffect={brandEffect} brandRotation={brandRotation} brandWeight={brandWeight}
            showFontPicker={showFontPicker} showTextColorPicker={showTextColorPicker} showEffectPicker={showEffectPicker}
            onToggleBrandName={onToggleBrandName}
            onEditableBrandNameChange={(v) => { onEditableBrandNameChange(v); if (selectedTextId) handleUpdateSelectedText({ content: v }) }}
            onStartEditingName={() => setIsEditingName(true)} onStopEditingName={() => setIsEditingName(false)}
            onBrandFontChange={(f) => { onBrandFontChange(f); setShowFontPicker(false); if (selectedTextId) handleUpdateSelectedText({ font: f }) }}
            onBrandColorChange={(c) => { onBrandColorChange(c); if (selectedTextId) handleUpdateSelectedText({ color: c }) }}
            onBrandScaleIncrease={() => { const s = Math.min(8, brandScale + 0.1); onBrandScaleChange(s); if (selectedTextId) handleUpdateSelectedText({ scale: s }) }}
            onBrandScaleDecrease={() => { const s = Math.max(0.5, brandScale - 0.1); onBrandScaleChange(s); if (selectedTextId) handleUpdateSelectedText({ scale: s }) }}
            onBrandScaleChange={(scale) => { const s = Math.max(0.5, Math.min(8, scale)); onBrandScaleChange(s); if (selectedTextId) handleUpdateSelectedText({ scale: s }) }}
            onBrandEffectChange={(e) => { onBrandEffectChange(e); setShowEffectPicker(false); if (selectedTextId) handleUpdateSelectedText({ effect: e }) }}
            onBrandRotationChange={(r) => { onBrandRotationChange(r); if (selectedTextId) handleUpdateSelectedText({ rotation: r }) }}
            onBrandWeightChange={onBrandWeightChange}
            onToggleFontPicker={() => { setShowFontPicker(!showFontPicker); setShowTextColorPicker(false); setShowEffectPicker(false) }}
            onToggleTextColorPicker={() => { setShowTextColorPicker(!showTextColorPicker); setShowFontPicker(false); setShowEffectPicker(false) }}
            onToggleEffectPicker={() => { setShowEffectPicker(!showEffectPicker); setShowFontPicker(false); setShowTextColorPicker(false) }}
            textItems={textItems} selectedTextId={selectedTextId}
            onAddText={handleAddText} onRemoveText={handleRemoveText} onSelectText={handleSelectText} onUpdateTextContent={handleUpdateTextContent}
          />
        </div>
      </div>
    </div>
  )
}
