"use client"

/**
 * Logo Sidebar Component
 *
 * Left sidebar with product color picker and logo scale controls.
 * Generic version that accepts colors from mockup config.
 */

import { useState } from 'react'
import { Eraser, Loader2, FlipHorizontal, Grid3X3, Ruler, ChevronDown } from 'lucide-react'
import type { ProductColor, MockupView } from '../generic/mockup-types'
import { ZoomControls } from './ZoomControls'
import { LogoUploadButton } from './LogoUploadButton'

interface LogoSidebarProps {
  /** Current product label (e.g., "T-Shirt", "Hoodie") */
  productLabel: string
  /** Available colors for this product */
  colors: ProductColor[]
  /** Currently selected color */
  selectedColor: ProductColor
  /** Whether to show extended color picker */
  showColorPicker: boolean
  /** Current logo scale (1.0 = 100%) */
  logoScale: number
  /** Called when a color is selected */
  onColorSelect: (color: ProductColor) => void
  /** Called to toggle extended color picker */
  onToggleColorPicker: () => void
  /** Called to increase logo scale */
  onScaleIncrease: () => void
  /** Called to decrease logo scale */
  onScaleDecrease: () => void
  /** Called with specific logo scale value */
  onLogoScaleChange?: (scale: number) => void
  /** Called to remove background from logo */
  onRemoveBackground?: () => void
  /** Current canvas zoom level */
  canvasZoom?: number
  /** Called when canvas zoom changes */
  onCanvasZoomChange?: (zoom: number) => void
  /** Default logo scale for reset */
  defaultLogoScale?: number
  /** Whether background removal is in progress */
  isRemovingBackground?: boolean
  /** Whether a logo is present */
  hasLogo?: boolean
  /** Whether this product supports multiple views (front/back) */
  hasMultipleViews?: boolean
  /** Currently selected view */
  selectedView?: MockupView
  /** Called when view changes */
  onViewChange?: (view: MockupView) => void
  /** Called when a logo is imported from file */
  onImportLogo?: (dataUrl: string) => void
  /** Whether grid overlay is visible */
  showGrid?: boolean
  /** Called to toggle grid overlay */
  onToggleGrid?: () => void
  /** Whether rulers with position indicators are visible */
  showRulers?: boolean
  /** Called to toggle rulers */
  onToggleRulers?: () => void
}

export function LogoSidebar({
  productLabel,
  colors,
  selectedColor,
  showColorPicker,
  logoScale,
  onColorSelect,
  onToggleColorPicker,
  onScaleIncrease,
  onScaleDecrease,
  onLogoScaleChange,
  onRemoveBackground,
  isRemovingBackground,
  hasLogo,
  hasMultipleViews,
  selectedView = 'front',
  onViewChange,
  canvasZoom = 1.0,
  onCanvasZoomChange,
  defaultLogoScale = 1.0,
  onImportLogo,
  showGrid = false,
  onToggleGrid,
  showRulers = false,
  onToggleRulers,
}: LogoSidebarProps) {
  // Collapsible section states
  const [colorOpen, setColorOpen] = useState(true)
  const [gridRulersOpen, setGridRulersOpen] = useState(false)

  // Show first 12 colors by default
  const visibleColors = showColorPicker ? colors : colors.slice(0, 12)
  const hasMoreColors = colors.length > 12

  return (
    <div className="flex flex-col gap-3 w-40 shrink-0 p-3 items-center justify-start max-h-[720px] overflow-y-auto scrollbar-hide">
      <div className="text-[11px] text-zinc-200 font-medium uppercase tracking-wider text-center w-full py-1 bg-zinc-800/50 rounded-md border border-zinc-700/50">
        Logo Settings
      </div>

      {/* Product Color - Collapsible */}
      <div className="w-full">
        <button
          onClick={() => setColorOpen(!colorOpen)}
          className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700/50 transition-all"
        >
          <span className="text-zinc-200 font-normal">{productLabel} Color</span>
          <div className="flex items-center gap-1.5">
            <div
              className="w-4 h-4 rounded border border-zinc-600"
              style={{ backgroundColor: selectedColor.hex }}
            />
            <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${colorOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {colorOpen && (
          <div className="mt-2 space-y-2">
            <div className="grid grid-cols-4 gap-1.5">
              {visibleColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => onColorSelect(color)}
                  className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-110 ${
                    selectedColor.id === color.id
                      ? 'border-purple-500 scale-105 shadow-lg shadow-purple-500/30'
                      : 'border-zinc-700 hover:border-zinc-500'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
            {hasMoreColors && (
              <button
                onClick={onToggleColorPicker}
                className="w-full text-[9px] text-zinc-500 hover:text-zinc-300 font-extralight py-1"
              >
                {showColorPicker ? 'Show less' : `+${colors.length - 12} more colors`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* View Toggle (Front/Back) */}
      {hasMultipleViews && onViewChange && (
        <div className="w-full space-y-2">
          <div className="text-[10px] text-zinc-300 font-normal uppercase flex items-center gap-1">
            <FlipHorizontal className="w-3 h-3" />
            View
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onViewChange('front')}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-extralight transition-all ${
                selectedView === 'front'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                  : 'text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700/50'
              }`}
            >
              Front
            </button>
            <button
              onClick={() => onViewChange('back')}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-extralight transition-all ${
                selectedView === 'back'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                  : 'text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700/50'
              }`}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Grid & Rulers - Collapsible */}
      {(onToggleGrid || onToggleRulers) && (
        <div className="w-full">
          <button
            onClick={() => setGridRulersOpen(!gridRulersOpen)}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700/50 transition-all"
          >
            <span className="text-zinc-200 font-normal flex items-center gap-1.5">
              <Grid3X3 className="w-3 h-3" />
              Grid & Rulers
            </span>
            <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${gridRulersOpen ? 'rotate-180' : ''}`} />
          </button>
          {gridRulersOpen && (
            <div className="mt-2 space-y-2">
              {/* Grid Toggle */}
              {onToggleGrid && (
                <button
                  onClick={onToggleGrid}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-extralight transition-all ${
                    showGrid
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                      : 'text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700/50'
                  }`}
                >
                  <Grid3X3 className="w-3 h-3" />
                  {showGrid ? 'Hide Grid' : 'Show Grid'}
                </button>
              )}
              {/* Rulers Toggle */}
              {onToggleRulers && (
                <button
                  onClick={onToggleRulers}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-extralight transition-all ${
                    showRulers
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                      : 'text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700/50'
                  }`}
                >
                  <Ruler className="w-3 h-3" />
                  {showRulers ? 'Hide Rulers' : 'Show Rulers'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Zoom Controls */}
      {onCanvasZoomChange && onLogoScaleChange && (
        <div className="w-full">
          <ZoomControls
            canvasZoom={canvasZoom}
            onCanvasZoomChange={onCanvasZoomChange}
            logoScale={logoScale}
            onLogoScaleChange={onLogoScaleChange}
            defaultLogoScale={defaultLogoScale}
          />
        </div>
      )}

      {/* Remove Background Button */}
      {onRemoveBackground && (
        <div className="w-full">
          <button
            onClick={onRemoveBackground}
            disabled={!hasLogo || isRemovingBackground}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-extralight transition-all bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Remove logo background"
          >
            {isRemovingBackground ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Removing...</span>
              </>
            ) : (
              <>
                <Eraser className="w-3.5 h-3.5" />
                <span>Remove BG</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Import Logo Button */}
      {onImportLogo && (
        <LogoUploadButton
          onUpload={onImportLogo}
          label="Import Logo"
          compact
        />
      )}
    </div>
  )
}
