"use client"

/**
 * MockupPhotoGenerator Component
 *
 * Customer-facing UI for generating one AI product photo at a time.
 */

import { Download, Loader2, X } from 'lucide-react'
import { useMockupGeneration } from './useMockupGeneration'
import { ClothingProductSection, OtherProductSection, HatsCategorySection } from './MockupGeneratorProductSection'
import { CLOTHING_WITH_VIEWS, HATS_CATEGORY, OTHER_PRODUCTS } from './mockup-generator-constants'

interface MockupPhotoGeneratorProps {
  onClose?: () => void
}

export function MockupPhotoGenerator({ onClose }: MockupPhotoGeneratorProps) {
  const {
    status,
    lastResult,
    expandedProducts,
    toggleProduct,
    generatePhoto,
  } = useMockupGeneration()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Create a Product Photo</h2>
            <p className="text-xs text-zinc-400">Choose one product and color. Each photo usually takes 30–90 seconds.</p>
          </div>
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Close product photo generator"
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Product Grid */}
        <div className="overflow-y-auto max-h-[65vh] p-4">
          <p className="mb-3 text-xs font-semibold text-zinc-300">Step 1 · Choose a product</p>

          {lastResult && (
            <div
              role={lastResult.status === 'error' ? 'alert' : 'status'}
              className={`sticky top-0 z-10 mb-4 rounded-lg border p-3 shadow-lg ${
                lastResult.status === 'error'
                  ? 'border-red-500/40 bg-red-950'
                  : lastResult.status === 'success'
                    ? 'border-green-500/40 bg-green-950'
                    : 'border-purple-500/40 bg-purple-950'
              }`}
            >
              <div className="flex items-center gap-2">
                {lastResult.status === 'generating' && <Loader2 className="h-4 w-4 animate-spin text-purple-300" />}
                <p className="text-xs font-medium text-zinc-200">{lastResult.message}</p>
              </div>
              {lastResult.status === 'success' && lastResult.imageUrl && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={lastResult.imageUrl}
                    alt={`${lastResult.color} ${lastResult.product} product photo`}
                    className="h-24 w-24 rounded-lg border border-zinc-700 bg-zinc-950 object-contain"
                  />
                  <a
                    href={lastResult.imageUrl}
                    download={`${lastResult.product}-${lastResult.color}-product-photo.png`}
                    className="flex items-center gap-1.5 rounded-md bg-green-500/20 px-3 py-2 text-xs font-semibold text-green-300 transition-colors hover:bg-green-500/30"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download photo
                  </a>
                </div>
              )}
            </div>
          )}

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
            Step 2 · Choose a color inside the product row. Your finished photo stays at the top and remains available to download.
          </p>
        </div>
      </div>
    </div>
  )
}
