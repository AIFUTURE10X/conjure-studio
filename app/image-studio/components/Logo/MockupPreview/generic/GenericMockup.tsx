"use client"

/**
 * Generic Mockup Component
 *
 * Config-driven mockup that works with any product type.
 * State, drag/drop, and export are handled by extracted hooks.
 * Canvas section extracted to CanvasSection.tsx.
 */

import { useRef, useEffect, useMemo, ComponentType, useCallback, useState } from 'react'
import { buildGoogleFontsUrl } from '@/app/image-studio/constants/real-fonts'
import { LogoSidebar, BrandSidebar } from '../shared'
import { MockupControls } from '../MockupControls'
import { useGenericDrag } from './useGenericDrag'
import { useGenericExport } from './useGenericExport'
import { useGenericMockupState } from './useGenericMockupState'
import { useTextItemHandlers } from './useTextItemHandlers'
import { useBackgroundRemoval } from './useBackgroundRemoval'
import { CanvasSection } from './CanvasSection'
import type { MockupConfig, MockupExportControls, ShapeRendererProps, BrandSettings } from './mockup-types'

interface GenericMockupProps {
  config: MockupConfig
  logoUrl?: string
  brandName?: string
  onExport?: (format: 'png', dataUrl: string) => void
  onControlsReady?: (controls: MockupExportControls) => void
  hideControls?: boolean
  logoFilter?: React.CSSProperties
  customProductImageUrl?: string
  onCustomProductImageUpload?: (url: string) => void
  externalProcessedLogoUrl?: string
  onProcessedLogoChange?: (url: string | null) => void
  savedBrandSettings?: BrandSettings | null
  onLogoImport?: (dataUrl: string) => void
}

export function GenericMockup({
  config,
  logoUrl,
  brandName = 'Brand',
  onExport,
  onControlsReady,
  hideControls = false,
  logoFilter,
  customProductImageUrl,
  onCustomProductImageUpload,
  externalProcessedLogoUrl,
  onProcessedLogoChange,
  savedBrandSettings,
  onLogoImport,
}: GenericMockupProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  // Track container size for rulers
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // State management hook
  const state = useGenericMockupState({
    config, brandName, externalProcessedLogoUrl, logoUrl, customProductImageUrl, onProcessedLogoChange, savedBrandSettings,
  })

  // Text item handlers
  const textHandlers = useTextItemHandlers({
    textItems: state.textItems, setTextItems: state.setTextItems,
    selectedTextId: state.selectedTextId, setSelectedTextId: state.setSelectedTextId,
    setEditableBrandName: state.setEditableBrandName, setBrandFont: state.setBrandFont,
    setBrandColor: state.setBrandColor, setBrandScale: state.setBrandScale,
    setBrandEffect: state.setBrandEffect, setBrandRotation: state.setBrandRotation,
    setBrandPosition: state.setBrandPosition,
  })

  // Background removal handler
  const { handleRemoveBackground } = useBackgroundRemoval({
    effectiveLogoUrl: state.effectiveLogoUrl, effectiveProductImageUrl: state.effectiveProductImageUrl,
    isRemovingBg: state.isRemovingBg, setIsRemovingBg: state.setIsRemovingBg,
    setProcessedLogoUrl: state.setProcessedLogoUrl, setProcessedProductUrl: state.setProcessedProductUrl,
    onProcessedLogoChangeRef: state.onProcessedLogoChangeRef,
  })

  // Shape component from config
  const ShapeComponent = config.shapeComponent as ComponentType<ShapeRendererProps>

  // Photo URL computation
  const photoUrl = useMemo(() => {
    if (!config.photoAssets) return null
    const colorPhoto = config.photoAssets.colorMap[state.selectedColor.id]
    const photo = colorPhoto || config.photoAssets.fallbackPhoto
    if (!photo) return null
    return `${config.photoAssets.baseUrl}${photo}`
  }, [config.photoAssets, state.selectedColor.id])

  const usePhotoRendering = Boolean(config.renderMode === 'photo' && photoUrl && !state.photoLoadFailed)

  // Drag hook
  const drag = useGenericDrag({
    containerRef, logoPrintArea: config.logoPrintArea, textPrintArea: config.textPrintArea,
    logoPosition: state.logoPosition, onLogoPositionChange: state.setLogoPosition,
    brandPosition: state.brandPosition, onBrandPositionChange: state.setBrandPosition,
    textItems: state.textItems, onTextItemsChange: state.setTextItems,
    selectedTextId: state.selectedTextId, onSelectedTextIdChange: state.setSelectedTextId,
  })

  // Export hook
  const exportState = useGenericExport({
    mockupConfig: config, containerRef, logoUrl: state.effectiveLogoUrl,
    logoPosition: state.logoPosition, logoScale: state.logoScale, selectedColor: state.selectedColor,
    showBrandName: state.showBrandName, brandName: state.editableBrandName,
    brandFont: state.brandFont, brandColor: state.brandColor, brandPosition: state.brandPosition,
    brandScale: state.brandScale, brandEffect: state.brandEffect, brandRotation: state.brandRotation,
    textItems: state.textItems, onExport, photoUrl: usePhotoRendering ? photoUrl : null,
    view: state.selectedView,
  })

  const captureCanvasRef = useRef(exportState.captureCanvas)
  captureCanvasRef.current = exportState.captureCanvas

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement('link')
    link.href = buildGoogleFontsUrl()
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [])

  const captureCanvasWrapper = useCallback(async () => captureCanvasRef.current(), [])

  // Pass controls to parent
  useEffect(() => {
    if (onControlsReady) {
      onControlsReady({
        isExporting: exportState.isExporting, showExportMenu: exportState.showExportMenu,
        setShowExportMenu: exportState.setShowExportMenu, handleReset: state.handleReset,
        handleExportPNG: exportState.handleExportPNG, handleExportSVG: exportState.handleExportSVG,
        handleExportPDF: exportState.handleExportPDF, captureCanvas: captureCanvasWrapper,
        getBrandSettings: state.getBrandSettings, setCanvasZoom: state.setCanvasZoom,
      })
    }
  }, [onControlsReady, exportState.isExporting, exportState.showExportMenu, state.handleReset, state.getBrandSettings, state.setCanvasZoom, captureCanvasWrapper])

  return (
    <div className="h-full flex flex-col overflow-x-hidden">
      <div className="flex flex-1 min-h-0 overflow-x-hidden overflow-y-auto">
        {/* Left Sidebar */}
        <div className="overflow-y-auto shrink-0">
          <LogoSidebar
            productLabel={config.name} colors={config.colors} selectedColor={state.selectedColor}
            showColorPicker={state.showColorPicker} logoScale={state.logoScale}
            onColorSelect={(c) => { state.setSelectedColor(c); state.setShowColorPicker(false) }}
            onToggleColorPicker={() => state.setShowColorPicker(!state.showColorPicker)}
            onScaleIncrease={() => state.setLogoScale(Math.min(2, state.logoScale + 0.1))}
            onScaleDecrease={() => state.setLogoScale(Math.max(0.5, state.logoScale - 0.1))}
            onLogoScaleChange={state.setLogoScale} onRemoveBackground={handleRemoveBackground}
            isRemovingBackground={state.isRemovingBg}
            hasLogo={!!state.effectiveLogoUrl || !!state.effectiveProductImageUrl}
            hasMultipleViews={state.hasMultipleViews} selectedView={state.selectedView}
            onViewChange={state.setSelectedView} canvasZoom={state.canvasZoom}
            onCanvasZoomChange={state.setCanvasZoom} defaultLogoScale={config.defaultLogoScale}
            onImportLogo={onLogoImport} showGrid={state.showGrid}
            onToggleGrid={() => state.setShowGrid(!state.showGrid)}
            showRulers={state.showRulers} onToggleRulers={() => state.setShowRulers(!state.showRulers)}
          />
        </div>

        {/* Center: Mockup Canvas */}
        <CanvasSection
          config={config}
          containerRef={containerRef}
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
          usePhotoRendering={usePhotoRendering}
          photoUrl={photoUrl}
          selectedColor={state.selectedColor}
          effectiveProductImageUrl={state.effectiveProductImageUrl}
          onCustomProductImageUpload={onCustomProductImageUpload}
          onPhotoLoadError={() => state.setPhotoLoadFailed(true)}
          effectiveLogoUrl={state.effectiveLogoUrl}
          logoPosition={state.logoPosition}
          logoScale={state.logoScale}
          isDraggingLogo={drag.isDragging}
          onLogoDragStart={drag.handleDragStart}
          logoFilter={logoFilter}
          editableBrandName={state.editableBrandName}
          brandFont={state.brandFont}
          brandColor={state.brandColor}
          brandPosition={state.brandPosition}
          brandScale={state.brandScale}
          brandWeight={state.brandWeight}
          brandEffect={state.brandEffect}
          brandRotation={state.brandRotation}
          showBrandName={state.showBrandName}
          isDraggingBrand={drag.isDraggingBrand}
          draggingTextId={drag.draggingTextId}
          onBrandDragStart={drag.handleBrandDragStart}
          onBrandScaleChange={state.setBrandScale}
          textItems={state.textItems}
          selectedTextId={state.selectedTextId}
          onSelectTextId={state.setSelectedTextId}
          onTextItemClick={textHandlers.handleSelectText}
          onTextItemResize={(id, scaleX, scaleY) => {
            state.setTextItems(prev => prev.map(t =>
              t.id === id ? { ...t, scaleX, scaleY, scale: (scaleX + scaleY) / 2 } : t
            ))
          }}
          canvasZoom={state.canvasZoom}
          showGrid={state.showGrid}
          showRulers={state.showRulers}
          selectedView={state.selectedView}
          ShapeComponent={ShapeComponent}
        />

        {/* Right Sidebar */}
        <div className="overflow-y-auto overflow-x-hidden shrink-0">
          <BrandSidebar
            showBrandName={state.showBrandName} editableBrandName={state.editableBrandName}
            brandFont={state.brandFont} brandColor={state.brandColor} brandScale={state.brandScale}
            brandEffect={state.brandEffect} brandRotation={state.brandRotation}
            brandWeight={state.brandWeight} showFontPicker={state.showFontPicker}
            onToggleBrandName={() => state.setShowBrandName(!state.showBrandName)}
            onEditableBrandNameChange={(v) => {
              state.setEditableBrandName(v)
              if (state.selectedTextId) textHandlers.handleUpdateSelectedText({ content: v })
            }}
            onBrandFontChange={(f) => {
              state.setBrandFont(f); state.setShowFontPicker(false)
              if (state.selectedTextId) textHandlers.handleUpdateSelectedText({ font: f })
            }}
            onBrandColorChange={(c) => {
              state.setBrandColor(c)
              if (state.selectedTextId) textHandlers.handleUpdateSelectedText({ color: c })
            }}
            onBrandScaleIncrease={() => {
              const newScale = Math.min(8, state.brandScale + 0.1)
              state.setBrandScale(newScale)
              if (state.selectedTextId) textHandlers.handleUpdateSelectedText({ scale: newScale })
            }}
            onBrandScaleDecrease={() => {
              const newScale = Math.max(0.5, state.brandScale - 0.1)
              state.setBrandScale(newScale)
              if (state.selectedTextId) textHandlers.handleUpdateSelectedText({ scale: newScale })
            }}
            onBrandScaleChange={(s) => {
              const clamped = Math.max(0.5, Math.min(8, s))
              state.setBrandScale(clamped)
              if (state.selectedTextId) textHandlers.handleUpdateSelectedText({ scale: clamped })
            }}
            onBrandEffectChange={(e) => {
              state.setBrandEffect(e)
              if (state.selectedTextId) textHandlers.handleUpdateSelectedText({ effect: e })
            }}
            onBrandRotationChange={(r) => {
              state.setBrandRotation(r)
              if (state.selectedTextId) textHandlers.handleUpdateSelectedText({ rotation: r })
            }}
            onBrandWeightChange={state.setBrandWeight}
            onToggleFontPicker={() => state.setShowFontPicker(!state.showFontPicker)}
            textItems={state.textItems} selectedTextId={state.selectedTextId}
            onAddText={textHandlers.handleAddText} onRemoveText={textHandlers.handleRemoveText}
            onSelectText={textHandlers.handleSelectText} onUpdateTextContent={textHandlers.handleUpdateTextContent}
          />
        </div>
      </div>

      {/* Bottom Controls */}
      {!hideControls && (
        <>
          <MockupControls
            isExporting={exportState.isExporting} showExportMenu={exportState.showExportMenu}
            onReset={state.handleReset}
            onToggleExportMenu={() => exportState.setShowExportMenu(!exportState.showExportMenu)}
            onExportPNG={exportState.handleExportPNG} onExportSVG={exportState.handleExportSVG}
            onExportPDF={exportState.handleExportPDF}
            showChangeButton={!!customProductImageUrl && !!onCustomProductImageUpload}
            onChangeProductImage={onCustomProductImageUpload}
          />
          <p className="text-[10px] text-zinc-500 text-center">
            Drag logo or brand to reposition | Use sidebar controls to resize
          </p>
        </>
      )}
    </div>
  )
}
