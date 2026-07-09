"use client"

/**
 * Realistic T-Shirt Mockup Component
 * Composes sub-components for mockup display, drag, and export
 */

import { useRef, useEffect } from 'react'
import { Maximize2 } from 'lucide-react'
import { TShirtCanvas } from './TShirtCanvas'
import { LogoDraggable } from './LogoDraggable'
import { BrandTextDraggable } from './BrandTextDraggable'
import { LogoSidebar, BrandSidebar } from './MockupSidebars'
import { MockupControls } from './MockupControls'
import { useMockupExport } from './useMockupExport'
import { useTShirtDrag, PRINT_AREA } from './useTShirtDrag'
import { TShirtLightbox } from './TShirtLightbox'
import { useRealisticTShirtState } from './useRealisticTShirtState'

export interface MockupExportControls {
  isExporting: boolean
  showExportMenu: boolean
  setShowExportMenu: (show: boolean) => void
  handleExportPNG: () => Promise<void>
  handleExportSVG: () => Promise<void>
  handleExportPDF: () => Promise<void>
  handleReset: () => void
}

interface RealisticTShirtMockupProps {
  logoUrl: string
  brandName?: string
  onExport?: (format: 'png', dataUrl: string) => void
  onControlsReady?: (controls: MockupExportControls) => void
  hideControls?: boolean
}

export function RealisticTShirtMockup({ logoUrl, brandName = 'Brand', onExport, onControlsReady, hideControls = false }: RealisticTShirtMockupProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)

  // Use extracted state hook
  const s = useRealisticTShirtState({ brandName })

  // Drag hook
  const drag = useTShirtDrag({
    containerRef,
    logoPosition: s.logoPosition, onLogoPositionChange: s.setLogoPosition,
    brandPosition: s.brandPosition, onBrandPositionChange: s.setBrandPosition,
    textItems: s.textItems, onTextItemsChange: s.setTextItems,
    selectedTextId: s.selectedTextId, onSelectedTextIdChange: s.setSelectedTextId,
  })

  // Export hook
  const exp = useMockupExport({
    logoUrl, logoPosition: s.logoPosition, logoScale: s.logoScale, selectedColor: s.selectedColor,
    showBrandName: s.showBrandName, editableBrandName: s.editableBrandName,
    brandFont: s.brandFont, brandColor: s.brandColor, brandPosition: s.brandPosition,
    brandScale: s.brandScale, brandEffect: s.brandEffect, brandRotation: s.brandRotation,
    textItems: s.textItems, onExport,
  })

  // Pass controls to parent if requested
  useEffect(() => {
    if (onControlsReady) {
      onControlsReady({
        isExporting: exp.isExporting, showExportMenu: exp.showExportMenu,
        setShowExportMenu: exp.setShowExportMenu,
        handleExportPNG: exp.handleExportPNG, handleExportSVG: exp.handleExportSVG,
        handleExportPDF: exp.handleExportPDF, handleReset: s.handleReset,
      })
    }
  }, [onControlsReady, exp, s.handleReset])

  return (
    <div>
      <div className="flex">
        {/* Left Sidebar */}
        <LogoSidebar
          selectedColor={s.selectedColor}
          showColorPicker={s.showColorPicker}
          logoScale={s.logoScale}
          onColorSelect={(c) => { s.setSelectedColor(c); s.setShowColorPicker(false) }}
          onToggleColorPicker={() => s.setShowColorPicker(!s.showColorPicker)}
          onScaleIncrease={() => s.setLogoScale(Math.min(2, s.logoScale + 0.1))}
          onScaleDecrease={() => s.setLogoScale(Math.max(0.5, s.logoScale - 0.1))}
        />

        {/* Center: Mockup */}
        <div
          ref={containerRef}
          className="relative flex-1 aspect-square overflow-hidden bg-zinc-900"
          onClick={() => s.setSelectedTextId(null)}
        >
          {/* Expand Button */}
          <button
            onClick={(e) => { e.stopPropagation(); s.setShowLightbox(true) }}
            className="absolute top-2 right-2 z-20 flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-purple-600/90 text-white hover:bg-purple-500 transition-colors shadow-lg"
            title="Expand to fullscreen with zoom"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="text-[10px] font-medium">Zoom</span>
          </button>
          <div className="absolute inset-0" data-mockup-capture>
            <TShirtCanvas color={s.selectedColor} />
            <LogoDraggable
              ref={logoRef}
              logoUrl={logoUrl}
              position={s.logoPosition}
              scale={s.logoScale}
              isDragging={drag.isDragging}
              isDarkShirt={s.selectedColor.textColor === 'light'}
              onDragStart={drag.handleDragStart}
            />
            <BrandTextDraggable
              text={s.editableBrandName}
              font={s.brandFont}
              color={s.brandColor}
              position={s.brandPosition}
              scale={s.brandScale}
              weight={s.brandWeight}
              effect={s.brandEffect}
              rotation={s.brandRotation}
              isDragging={drag.isDraggingBrand}
              isVisible={s.showBrandName && !s.selectedTextId}
              onDragStart={drag.handleBrandDragStart}
              onResize={(scaleX, scaleY) => s.setBrandScale((scaleX + scaleY) / 2)}
            />
            {/* Render multiple text items */}
            {s.textItems.map(item => (
              <BrandTextDraggable
                key={item.id}
                id={item.id}
                text={item.content}
                font={item.font}
                color={item.color}
                position={item.position}
                scale={item.scale}
                scaleX={item.scaleX}
                scaleY={item.scaleY}
                effect={item.effect}
                rotation={item.rotation}
                isDragging={drag.isDraggingBrand && drag.draggingTextId === item.id}
                isVisible={s.showBrandName}
                isSelected={s.selectedTextId === item.id}
                onDragStart={drag.handleBrandDragStart}
                onClick={() => s.handleSelectText(item.id)}
                onResize={(scaleX, scaleY) => {
                  s.setTextItems(prev => prev.map(t =>
                    t.id === item.id ? { ...t, scaleX, scaleY, scale: (scaleX + scaleY) / 2 } : t
                  ))
                }}
              />
            ))}
            <div
              className="absolute border border-dashed border-purple-500/30 rounded pointer-events-none opacity-0 hover:opacity-100 transition-opacity"
              style={{ top: `${PRINT_AREA.top}%`, left: `${PRINT_AREA.left}%`, width: `${PRINT_AREA.width}%`, height: `${PRINT_AREA.height}%` }}
            />
          </div>
        </div>

        {/* Right Sidebar */}
        <BrandSidebar
          showBrandName={s.showBrandName}
          editableBrandName={s.editableBrandName}
          isEditingName={s.isEditingName}
          brandFont={s.brandFont}
          brandColor={s.brandColor}
          brandScale={s.brandScale}
          brandEffect={s.brandEffect}
          brandRotation={s.brandRotation}
          brandWeight={s.brandWeight}
          showFontPicker={s.showFontPicker}
          showTextColorPicker={s.showTextColorPicker}
          showEffectPicker={s.showEffectPicker}
          onToggleBrandName={() => s.setShowBrandName(!s.showBrandName)}
          onEditableBrandNameChange={(v) => { s.setEditableBrandName(v); if (s.selectedTextId) s.handleUpdateSelectedText({ content: v }) }}
          onStartEditingName={() => s.setIsEditingName(true)}
          onStopEditingName={() => s.setIsEditingName(false)}
          onBrandFontChange={(f) => { s.setBrandFont(f); s.setShowFontPicker(false); if (s.selectedTextId) s.handleUpdateSelectedText({ font: f }) }}
          onBrandColorChange={(c) => { s.setBrandColor(c); if (s.selectedTextId) s.handleUpdateSelectedText({ color: c }) }}
          onBrandScaleIncrease={() => { const n = Math.min(8, s.brandScale + 0.1); s.setBrandScale(n); if (s.selectedTextId) s.handleUpdateSelectedText({ scale: n }) }}
          onBrandScaleDecrease={() => { const n = Math.max(0.5, s.brandScale - 0.1); s.setBrandScale(n); if (s.selectedTextId) s.handleUpdateSelectedText({ scale: n }) }}
          onBrandScaleChange={(n) => { const c = Math.max(0.5, Math.min(8, n)); s.setBrandScale(c); if (s.selectedTextId) s.handleUpdateSelectedText({ scale: c }) }}
          onBrandEffectChange={(e) => { s.setBrandEffect(e); s.setShowEffectPicker(false); if (s.selectedTextId) s.handleUpdateSelectedText({ effect: e }) }}
          onBrandRotationChange={(r) => { s.setBrandRotation(r); if (s.selectedTextId) s.handleUpdateSelectedText({ rotation: r }) }}
          onBrandWeightChange={(w) => s.setBrandWeight(w)}
          onToggleFontPicker={() => { s.setShowFontPicker(!s.showFontPicker); s.setShowTextColorPicker(false); s.setShowEffectPicker(false) }}
          onToggleTextColorPicker={() => { s.setShowTextColorPicker(!s.showTextColorPicker); s.setShowFontPicker(false); s.setShowEffectPicker(false) }}
          onToggleEffectPicker={() => { s.setShowEffectPicker(!s.showEffectPicker); s.setShowFontPicker(false); s.setShowTextColorPicker(false) }}
          textItems={s.textItems}
          selectedTextId={s.selectedTextId}
          onAddText={s.handleAddText}
          onRemoveText={s.handleRemoveText}
          onSelectText={s.handleSelectText}
          onUpdateTextContent={s.handleUpdateTextContent}
        />
      </div>

      {/* Bottom Controls */}
      {!hideControls && (
        <>
          <MockupControls
            isExporting={exp.isExporting}
            showExportMenu={exp.showExportMenu}
            onReset={s.handleReset}
            onToggleExportMenu={() => exp.setShowExportMenu(!exp.showExportMenu)}
            onExportPNG={exp.handleExportPNG}
            onExportSVG={exp.handleExportSVG}
            onExportPDF={exp.handleExportPDF}
          />
          <p className="text-[10px] text-zinc-500 text-center">
            Drag logo or brand to reposition | Use sidebar controls to resize
          </p>
        </>
      )}

      {/* Lightbox */}
      <TShirtLightbox
        isOpen={s.showLightbox}
        onClose={() => s.setShowLightbox(false)}
        logoUrl={logoUrl}
        selectedColor={s.selectedColor}
        onColorChange={s.setSelectedColor}
        logoPosition={s.logoPosition}
        onLogoPositionChange={s.setLogoPosition}
        logoScale={s.logoScale}
        onLogoScaleChange={s.setLogoScale}
        showBrandName={s.showBrandName}
        onToggleBrandName={() => s.setShowBrandName(!s.showBrandName)}
        editableBrandName={s.editableBrandName}
        onEditableBrandNameChange={s.setEditableBrandName}
        brandFont={s.brandFont}
        onBrandFontChange={s.setBrandFont}
        brandColor={s.brandColor}
        onBrandColorChange={s.setBrandColor}
        brandPosition={s.brandPosition}
        onBrandPositionChange={s.setBrandPosition}
        brandScale={s.brandScale}
        onBrandScaleChange={s.setBrandScale}
        brandEffect={s.brandEffect}
        onBrandEffectChange={s.setBrandEffect}
        brandRotation={s.brandRotation}
        onBrandRotationChange={s.setBrandRotation}
        brandWeight={s.brandWeight}
        onBrandWeightChange={s.setBrandWeight}
        textItems={s.textItems}
        onTextItemsChange={s.setTextItems}
        selectedTextId={s.selectedTextId}
        onSelectedTextIdChange={s.setSelectedTextId}
      />
    </div>
  )
}
