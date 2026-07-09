"use client"

/**
 * MockupPhotoGenerator Component
 *
 * Admin UI for generating AI product photos for realistic mockups.
 * Generates photos and saves them to public/mockups folder.
 */

import { Loader2, X, RefreshCw } from 'lucide-react'
import { useMockupGeneration } from './useMockupGeneration'
import { ClothingProductSection, OtherProductSection, HatsCategorySection } from './MockupGeneratorProductSection'
import { CLOTHING_WITH_VIEWS, HATS_CATEGORY, OTHER_PRODUCTS } from './mockup-generator-constants'

interface MockupPhotoGeneratorProps {
  onClose?: () => void
}

export function MockupPhotoGenerator({ onClose }: MockupPhotoGeneratorProps) {
  const {
    status,
    isGeneratingAll,
    expandedProducts,
    toggleProduct,
    generatePhoto,
    generateAll,
  } = useMockupGeneration()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Generate Mockup Photos</h2>
            <p className="text-xs text-zinc-400">AI-generate product photos for realistic mockups</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={generateAll}
              disabled={isGeneratingAll}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 text-white text-sm rounded-lg transition-colors"
            >
              {isGeneratingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Generate All
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Product Grid */}
        <div className="overflow-y-auto max-h-[65vh] p-4">
          {/* Clothing Section */}
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3 font-semibold">
              Clothing (Front / Back / Side Views)
            </h3>
            <div className="space-y-3">
              {CLOTHING_WITH_VIEWS.map(product => (
                <ClothingProductSection
                  key={product.id}
                  product={product}
                  status={status}
                  isGeneratingAll={isGeneratingAll}
                  expandedProducts={expandedProducts}
                  onToggleProduct={toggleProduct}
                  onGenerate={generatePhoto}
                />
              ))}
            </div>
          </div>

          {/* Hats Section */}
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3 font-semibold">
              Hats (Caps & Beanies)
            </h3>
            <div className="space-y-3">
              <HatsCategorySection
                category={HATS_CATEGORY}
                status={status}
                isGeneratingAll={isGeneratingAll}
                expandedProducts={expandedProducts}
                onToggleProduct={toggleProduct}
                onGenerate={generatePhoto}
              />
            </div>
          </div>

          {/* Other Products Section */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3 font-semibold">
              Other Products
            </h3>
            <div className="space-y-3">
              {OTHER_PRODUCTS.map(product => (
                <OtherProductSection
                  key={product.id}
                  product={product}
                  status={status}
                  isGeneratingAll={isGeneratingAll}
                  expandedProducts={expandedProducts}
                  onToggleProduct={toggleProduct}
                  onGenerate={generatePhoto}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-500">
            Photos are saved to <code className="text-zinc-400">public/mockups/</code>.
            After generating, set <code className="text-zinc-400">renderMode: 'photo'</code> in configs.
          </p>
        </div>
      </div>
    </div>
  )
}
