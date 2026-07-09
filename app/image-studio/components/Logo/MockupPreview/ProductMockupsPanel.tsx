"use client"

/**
 * ProductMockupsPanel Component
 *
 * Mega menu based product mockup selector with two-header layout.
 * Refactored: UI state extracted to useProductMockupsPanelUI.ts
 * Refactored: SavePresetModal, LoadPresetDropdown, HistoryDropdown extracted
 */

import { forwardRef, useImperativeHandle } from 'react'
import { Wand2, Maximize2, Upload, X, Package, Save } from 'lucide-react'
import { toast } from 'sonner'
import { GenericMockup } from './generic'
import { getParentCategory } from './categories'
import { MockupControls } from './MockupControls'
import { MockupPhotoGenerator } from './MockupPhotoGenerator'
import { AddCustomProductModal } from './AddCustomProductModal'
import { MegaMenu } from './MegaMenu'
import { useProductMockupsState } from './useProductMockupsState'
import { LogoHistoryItem } from '../LogoHistory'
import { LogoUploadButton } from './shared'
import { useProductMockupsPanelUI } from './hooks'
import { SavePresetModal } from './SavePresetModal'
import { LoadPresetDropdown } from './LoadPresetDropdown'
import { HistoryDropdown } from './HistoryDropdown'

interface ProductMockupsPanelProps {
  logoUrl?: string
  brandName?: string
  logoFilter?: React.CSSProperties
  onClose?: () => void
  onLogoUrlChange?: (url: string) => void
  onSaveToHistory?: () => void
}

export interface ProductMockupsPanelRef {
  loadMockupFromHistory: (imageUrl: string) => void
}

export const ProductMockupsPanel = forwardRef<ProductMockupsPanelRef, ProductMockupsPanelProps>(
  function ProductMockupsPanel({ logoUrl, brandName, logoFilter, onClose, onLogoUrlChange, onSaveToHistory }, ref) {
    const state = useProductMockupsState({ brandName, onLogoUrlChange })

    const ui = useProductMockupsPanelUI({
      isExpanded: state.isExpanded,
      setIsExpanded: state.setIsExpanded,
      mockupControls: state.controls
    })

    useImperativeHandle(ref, () => ({
      loadMockupFromHistory: (imageUrl: string) => {
        state.setLoadedLogoUrl(imageUrl)
        toast.success('Mockup loaded from history!')
      }
    }), [state])

    const effectiveLogoUrl = state.loadedLogoUrl || logoUrl

    return (
      <div className="flex flex-col h-full">
        {/* Header 1: Exit + MegaMenu + View Larger + Generate Photos */}
        {!state.isExpanded && (
          <div className="relative flex items-center gap-2 px-4 py-2 border-b border-zinc-800">
            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all shrink-0"
                title="Exit Products"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <MegaMenu
              selectedSubCategoryId={state.selectedSubCategoryId}
              onSelectSubCategory={state.handleSelectSubCategory}
            />

            <HistoryDropdown
              isOpen={ui.showHistoryDropdown}
              onToggle={() => ui.setShowHistoryDropdown(!ui.showHistoryDropdown)}
              onLoadImage={(item: LogoHistoryItem) => {
                state.setLoadedLogoUrl(item.imageUrl)
                ui.setShowHistoryDropdown(false)
                toast.success('Mockup loaded from history!')
              }}
              dropdownRef={ui.historyDropdownRef}
              refreshRef={ui.historyRefreshRef}
            />

            <LogoUploadButton
              onUpload={(dataUrl) => state.setLoadedLogoUrl(dataUrl)}
              label="Import Logo"
            />

            <button
              onClick={() => state.setShowAddProductModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30"
              title="Upload your own product photos"
            >
              <Upload className="w-4 h-4" />
              Upload New Products
            </button>

            <div className="flex-1" />

            <button
              onClick={() => ui.openSavePresetModal(state.getSelectedLabel())}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap text-green-400 hover:text-green-300 hover:bg-green-500/10 border border-green-500/30"
              title="Save current mockup preset for quick reload"
            >
              <Save className="w-4 h-4" />
              Save Preset
            </button>

            <LoadPresetDropdown
              isOpen={ui.showSavedMockupsDropdown}
              onToggle={() => ui.setShowSavedMockupsDropdown(!ui.showSavedMockupsDropdown)}
              savedMockups={state.savedMockups}
              onLoadMockup={(mockup) => {
                state.handleLoadMockup(mockup)
                ui.setShowSavedMockupsDropdown(false)
              }}
              onDeleteMockup={state.handleDeleteSavedMockup}
              onDeleteAll={() => {
                state.savedMockups.forEach(m => state.handleDeleteSavedMockup(m.id))
                ui.setShowSavedMockupsDropdown(false)
              }}
              dropdownRef={ui.dropdownRef}
            />

            <button
              onClick={() => state.setShowPhotoGenerator(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/30"
              title="Generate AI product photos for realistic mockups"
            >
              <Wand2 className="w-4 h-4" />
              Generate Photos
            </button>
          </div>
        )}

        {/* Header 2: Selected Product Label */}
        {!state.isExpanded && (
          <div className="relative flex items-center px-4 py-2 border-b border-zinc-700/50">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-zinc-300">
                Selected: <span className="font-medium text-white">{state.getSelectedLabel()}</span>
              </span>
            </div>

            <button
              onClick={() => state.setIsExpanded(!state.isExpanded)}
              className="absolute left-[47%] -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap text-white hover:text-white hover:bg-zinc-700 bg-zinc-800 border border-zinc-700"
              title={state.isExpanded ? "Collapse mockup view" : "Expand mockup with all settings"}
            >
              <Maximize2 className="w-4 h-4" />
              {state.isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        )}

        {/* Product Mockup Canvas */}
        <div className={state.isExpanded ? 'fixed inset-0 z-50 bg-zinc-950 flex flex-col' : 'flex-1 overflow-auto relative'}>
          {state.isExpanded && (
            <FullscreenHeader
              productLabel={state.getSelectedLabel()}
              onUpload={() => state.setShowAddProductModal(true)}
              onExit={() => state.setIsExpanded(false)}
            />
          )}

          <div className={state.isExpanded ? 'flex-1 min-h-0' : 'h-full'}>
            {state.currentConfig ? (
              <GenericMockup
                config={state.currentConfig}
                logoUrl={effectiveLogoUrl || undefined}
                brandName={brandName || 'Your Brand'}
                onControlsReady={state.handleControlsReady}
                hideControls={!state.isExpanded}
                logoFilter={logoFilter}
                customProductImageUrl={state.currentCustomProduct?.imageUrl}
                externalProcessedLogoUrl={state.processedLogoUrl || undefined}
                onProcessedLogoChange={state.setProcessedLogoUrl}
                savedBrandSettings={state.loadedBrandSettings}
                onLogoImport={(dataUrl) => state.setLoadedLogoUrl(dataUrl)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500">
                Select a product to preview
              </div>
            )}
          </div>
        </div>

        {/* Export Controls Footer */}
        {state.controls && !state.isExpanded && (
          <div className="flex items-center justify-end px-4 py-2 border-t border-zinc-800">
            <MockupControls
              isExporting={state.controls.isExporting}
              showExportMenu={state.controls.showExportMenu}
              onReset={() => {
                state.controls!.handleReset()
                state.clearLoadedMockup()
                state.clearSelection()
              }}
              onToggleExportMenu={() => state.controls!.setShowExportMenu(!state.controls!.showExportMenu)}
              onExportPNG={state.controls.handleExportPNG}
              onExportSVG={state.controls.handleExportSVG}
              onExportPDF={state.controls.handleExportPDF}
              onSaveToHistory={async () => {
                await state.handleSaveToHistory()
                ui.historyRefreshRef.current?.()
                onSaveToHistory?.()
              }}
              isSavingToHistory={state.isSavingToHistory}
            />
          </div>
        )}

        {/* Modals */}
        {state.showPhotoGenerator && (
          <MockupPhotoGenerator onClose={() => state.setShowPhotoGenerator(false)} />
        )}

        {state.showAddProductModal && (
          <AddCustomProductModal
            onClose={() => state.setShowAddProductModal(false)}
            onAdd={state.handleAddCustomProduct}
            defaultCategory={getParentCategory(state.selectedSubCategoryId)?.id || 'tshirts-tops'}
          />
        )}

        <SavePresetModal
          isOpen={ui.showSavePresetModal}
          onClose={() => ui.setShowSavePresetModal(false)}
          presetName={ui.presetName}
          onPresetNameChange={ui.setPresetName}
          inputRef={ui.presetInputRef}
          onSave={(logoUrl, name, thumbnail, brandSettings) => {
            state.handleSaveMockup(logoUrl, name, thumbnail, brandSettings)
          }}
          captureCanvas={state.controls?.captureCanvas}
          getBrandSettings={state.controls?.getBrandSettings}
          effectiveLogoUrl={effectiveLogoUrl || ''}
        />
      </div>
    )
  }
)

// Fullscreen header sub-component
function FullscreenHeader({
  productLabel,
  onUpload,
  onExit
}: {
  productLabel: string
  onUpload: () => void
  onExit: () => void
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 shrink-0 bg-zinc-900 relative">
      <span className="text-base font-semibold text-white">{productLabel}</span>

      <div className="absolute left-1/2 -translate-x-1/2 -ml-6 flex items-center gap-3">
        <button
          onClick={onUpload}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
          title="Upload your own product photos"
        >
          <Upload className="w-4 h-4" />
          Upload New Products
        </button>

        <button
          onClick={onExit}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 hover:text-red-300 transition-colors"
          title="Exit fullscreen (ESC)"
        >
          <X className="w-4 h-4" />
          Exit Fullscreen
        </button>
      </div>

      <div />
    </div>
  )
}
