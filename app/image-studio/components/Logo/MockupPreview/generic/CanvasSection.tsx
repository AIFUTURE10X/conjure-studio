"use client"

/**
 * CanvasSection Component
 *
 * The center mockup canvas with product shape, logo, brand text, rulers, and grid.
 * Extracted from GenericMockup.tsx to keep files under 300 lines.
 */

import { RefObject, ComponentType } from 'react'
import { LogoDraggable } from '../LogoDraggable'
import { BrandTextDraggable } from '../BrandTextDraggable'
import { PhotoShape } from '../shapes/PhotoShape'
import { HorizontalRuler, VerticalRuler, PositionIndicators } from '../rulers'
import type { MockupConfig, ShapeRendererProps, ProductColor, MockupView, TextItem, TextEffect, Position } from './mockup-types'

interface CanvasSectionProps {
  config: MockupConfig
  containerRef: RefObject<HTMLDivElement | null>
  containerWidth: number
  containerHeight: number
  // Photo rendering
  usePhotoRendering: boolean
  photoUrl: string | null
  selectedColor: ProductColor
  effectiveProductImageUrl: string | null | undefined
  onCustomProductImageUpload?: (url: string) => void
  onPhotoLoadError: () => void
  // Logo
  effectiveLogoUrl: string | null | undefined
  logoPosition: Position
  logoScale: number
  isDraggingLogo: boolean
  onLogoDragStart: (e: React.MouseEvent | React.TouchEvent) => void
  logoFilter?: React.CSSProperties
  // Brand text
  editableBrandName: string
  brandFont: string
  brandColor: string
  brandPosition: Position
  brandScale: number
  brandWeight: number
  brandEffect: TextEffect
  brandRotation: number
  showBrandName: boolean
  isDraggingBrand: boolean
  draggingTextId: string | null
  onBrandDragStart: (e: React.MouseEvent | React.TouchEvent, textId?: string) => void
  onBrandScaleChange: (scale: number) => void
  // Text items
  textItems: TextItem[]
  selectedTextId: string | null
  onSelectTextId: (id: string | null) => void
  onTextItemClick: (id: string) => void
  onTextItemResize: (id: string, scaleX: number, scaleY: number) => void
  // Canvas controls
  canvasZoom: number
  showGrid: boolean
  showRulers: boolean
  selectedView: MockupView
  ShapeComponent: ComponentType<ShapeRendererProps>
}

export function CanvasSection({
  config,
  containerRef,
  containerWidth,
  containerHeight,
  usePhotoRendering,
  photoUrl,
  selectedColor,
  effectiveProductImageUrl,
  onCustomProductImageUpload,
  onPhotoLoadError,
  effectiveLogoUrl,
  logoPosition,
  logoScale,
  isDraggingLogo,
  onLogoDragStart,
  logoFilter,
  editableBrandName,
  brandFont,
  brandColor,
  brandPosition,
  brandScale,
  brandWeight,
  brandEffect,
  brandRotation,
  showBrandName,
  isDraggingBrand,
  draggingTextId,
  onBrandDragStart,
  onBrandScaleChange,
  textItems,
  selectedTextId,
  onSelectTextId,
  onTextItemClick,
  onTextItemResize,
  canvasZoom,
  showGrid,
  showRulers,
  selectedView,
  ShapeComponent,
}: CanvasSectionProps) {
  return (
    <div className="flex-1 flex items-center justify-center min-w-0">
      <div
        ref={containerRef}
        className="relative overflow-hidden bg-zinc-900"
        style={{
          aspectRatio: config.aspectRatio,
          maxWidth: '1318px',
          maxHeight: '100%',
          width: '100%',
          height: 'auto',
        }}
        onClick={() => onSelectTextId(null)}
      >
        <div
          className="absolute inset-0 transition-transform duration-150"
          style={{
            transform: `scale(${canvasZoom})`,
            transformOrigin: 'center',
          }}
        >
          {usePhotoRendering ? (
            <PhotoShape
              photoUrl={photoUrl!}
              color={selectedColor}
              onError={onPhotoLoadError}
            />
          ) : effectiveProductImageUrl ? (
            <div className="absolute inset-0 bg-zinc-800" />
          ) : (
            <ShapeComponent
              color={selectedColor}
              view={selectedView}
              customImageUrl={effectiveProductImageUrl || undefined}
              onImageUpload={onCustomProductImageUpload}
            />
          )}

          {effectiveLogoUrl && (
            <LogoDraggable
              logoUrl={effectiveLogoUrl}
              position={logoPosition}
              scale={logoScale}
              isDragging={isDraggingLogo}
              isDarkShirt={selectedColor.textColor === 'light'}
              onDragStart={onLogoDragStart}
              logoFilter={logoFilter}
            />
          )}

          <BrandTextDraggable
            text={editableBrandName}
            font={brandFont}
            color={brandColor}
            position={brandPosition}
            scale={brandScale}
            weight={brandWeight}
            effect={brandEffect}
            rotation={brandRotation}
            isDragging={isDraggingBrand}
            isVisible={showBrandName && !selectedTextId}
            onDragStart={onBrandDragStart}
            onResize={(scaleX, scaleY) => onBrandScaleChange((scaleX + scaleY) / 2)}
          />

          {textItems.map(item => (
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
              isDragging={isDraggingBrand && draggingTextId === item.id}
              isVisible={showBrandName}
              isSelected={selectedTextId === item.id}
              onDragStart={onBrandDragStart}
              onClick={() => onTextItemClick(item.id)}
              onResize={(scaleX, scaleY) => onTextItemResize(item.id, scaleX, scaleY)}
            />
          ))}

          {/* Grid overlay */}
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none z-5"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(168, 85, 247, 0.2) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(168, 85, 247, 0.2) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
              }}
            />
          )}

          {/* Print area guide */}
          <div
            className="absolute border border-dashed border-purple-500/30 rounded pointer-events-none opacity-0 hover:opacity-100 transition-opacity"
            style={{
              top: `${config.logoPrintArea.top}%`,
              left: `${config.logoPrintArea.left}%`,
              width: `${config.logoPrintArea.width}%`,
              height: `${config.logoPrintArea.height}%`,
            }}
          />
        </div>

        {/* Position indicators */}
        {showRulers && (isDraggingLogo || isDraggingBrand) && containerWidth > 0 && (
          <PositionIndicators
            containerWidth={containerWidth - 16}
            containerHeight={containerHeight - 16}
            isDraggingLogo={isDraggingLogo}
            logoPosition={logoPosition}
            isDraggingBrand={isDraggingBrand}
            brandPosition={brandPosition}
            draggingTextId={draggingTextId}
            textItemPosition={draggingTextId
              ? textItems.find(t => t.id === draggingTextId)?.position ?? null
              : null
            }
          />
        )}

        {/* Rulers */}
        {showRulers && containerWidth > 0 && (
          <>
            {/* Corner piece */}
            <div
              className="absolute top-0 left-0 z-30"
              style={{
                width: 16,
                height: 16,
                backgroundColor: '#27272a',
                borderRight: '1px solid #3f3f46',
                borderBottom: '1px solid #3f3f46',
              }}
            />
            {/* Horizontal ruler */}
            <div className="absolute top-0 left-4 right-0 z-30 overflow-hidden">
              <HorizontalRuler
                width={containerWidth - 16}
                height={16}
                markerPosition={
                  isDraggingLogo ? logoPosition.x :
                  isDraggingBrand && !draggingTextId ? brandPosition.x :
                  draggingTextId ? textItems.find(t => t.id === draggingTextId)?.position.x ?? null :
                  null
                }
                showMarker={isDraggingLogo || isDraggingBrand}
              />
            </div>
            {/* Vertical ruler */}
            <div className="absolute top-4 left-0 bottom-0 z-30 overflow-hidden">
              <VerticalRuler
                height={containerHeight - 16}
                width={16}
                markerPosition={
                  isDraggingLogo ? logoPosition.y :
                  isDraggingBrand && !draggingTextId ? brandPosition.y :
                  draggingTextId ? textItems.find(t => t.id === draggingTextId)?.position.y ?? null :
                  null
                }
                showMarker={isDraggingLogo || isDraggingBrand}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
