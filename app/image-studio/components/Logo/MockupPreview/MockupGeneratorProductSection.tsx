"use client"

/**
 * Product section components for MockupPhotoGenerator
 */

import { ChevronDown, ChevronRight } from 'lucide-react'
import { MockupGeneratorColorButton } from './MockupGeneratorColorButton'
import type { ProductConfig, GenerationStatus, HatCategory } from './mockup-generator-constants'

interface ProductSectionProps {
  status: GenerationStatus
  expandedProducts: Record<string, boolean>
  onToggleProduct: (productId: string) => void
  onGenerate: (product: string, color: string) => void
}

const colorCountLabel = (count: number) => `${count} color${count === 1 ? '' : 's'}`

// Collapsible header component
function CollapsibleHeader({
  isExpanded,
  title,
  subtitle,
  onToggle,
  contentId,
}: {
  isExpanded: boolean
  title: string
  subtitle: string
  onToggle: () => void
  contentId: string
}) {
  return (
    <button
      onClick={onToggle}
      aria-expanded={isExpanded}
      aria-controls={contentId}
      className="w-full flex items-center justify-between p-3 hover:bg-zinc-800/80 transition-colors"
    >
      <div className="flex items-center gap-2">
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        )}
        <h3 className="text-sm font-medium text-white capitalize">{title}</h3>
        <span className="text-xs text-zinc-500">{subtitle}</span>
      </div>
    </button>
  )
}

// Clothing product with front/back/side views
export function ClothingProductSection({
  product,
  status,
  expandedProducts,
  onToggleProduct,
  onGenerate,
}: ProductSectionProps & { product: ProductConfig }) {
  const isExpanded = expandedProducts[product.id]
  const frontColors = product.colors
  const backColors = product.colors.map(c => `${c}-back`)
  const sideColors = product.colors.map(c => `${c}-side`)

  return (
    <div className="bg-zinc-800/50 rounded-lg overflow-hidden">
      <CollapsibleHeader
        isExpanded={isExpanded}
        title={product.id.replace('-', ' ')}
        subtitle={`${colorCountLabel(product.colors.length)} · choose a view and color`}
        onToggle={() => onToggleProduct(product.id)}
        contentId={`mockup-product-${product.id}`}
      />
      {isExpanded && (
        <div id={`mockup-product-${product.id}`} className="px-3 pb-3 pt-1 border-t border-zinc-700/50 space-y-3">
          <p className="text-[11px] font-semibold text-purple-300">Step 2 · Choose a view and color</p>
          {/* Front View */}
          <div>
            <h4 className="text-xs font-medium text-zinc-400 mb-2">Front View</h4>
            <div className="flex flex-wrap gap-2">
              {frontColors.map(color => (
                <MockupGeneratorColorButton
                  key={color}
                  productId={product.id}
                  color={color}
                  status={status}
                  onGenerate={onGenerate}
                />
              ))}
            </div>
          </div>
          {/* Back View */}
          <div>
            <h4 className="text-xs font-medium text-zinc-400 mb-2">Back View</h4>
            <div className="flex flex-wrap gap-2">
              {backColors.map(color => (
                <MockupGeneratorColorButton
                  key={color}
                  productId={product.id}
                  color={color}
                  status={status}
                  onGenerate={onGenerate}
                />
              ))}
            </div>
          </div>
          {/* Side View */}
          <div>
            <h4 className="text-xs font-medium text-zinc-400 mb-2">Side View (Sleeve)</h4>
            <div className="flex flex-wrap gap-2">
              {sideColors.map(color => (
                <MockupGeneratorColorButton
                  key={color}
                  productId={product.id}
                  color={color}
                  status={status}
                  onGenerate={onGenerate}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Other product without multiple views
export function OtherProductSection({
  product,
  status,
  expandedProducts,
  onToggleProduct,
  onGenerate,
}: ProductSectionProps & { product: ProductConfig }) {
  const isExpanded = expandedProducts[product.id]

  return (
    <div className="bg-zinc-800/50 rounded-lg overflow-hidden">
      <CollapsibleHeader
        isExpanded={isExpanded}
        title={product.id.replace('-', ' ')}
        subtitle={`${colorCountLabel(product.colors.length)} · choose one to generate`}
        onToggle={() => onToggleProduct(product.id)}
        contentId={`mockup-product-${product.id}`}
      />
      {isExpanded && (
        <div id={`mockup-product-${product.id}`} className="px-3 pb-3 pt-1 border-t border-zinc-700/50">
          <p className="mb-2 text-[11px] font-semibold text-purple-300">Step 2 · Choose a color</p>
          <div className="flex flex-wrap gap-2">
            {product.colors.map(color => (
              <MockupGeneratorColorButton
                key={color}
                productId={product.id}
                color={color}
                status={status}
                onGenerate={onGenerate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Hats category with nested cap and beanie
export function HatsCategorySection({
  category,
  status,
  expandedProducts,
  onToggleProduct,
  onGenerate,
}: ProductSectionProps & { category: HatCategory }) {
  const isExpanded = expandedProducts[category.id]
  const totalPhotos = category.items.reduce((sum, item) => sum + item.colors.length, 0)

  return (
    <div className="bg-zinc-800/50 rounded-lg overflow-hidden">
      <CollapsibleHeader
        isExpanded={isExpanded}
        title={category.name}
        subtitle={`${category.items.length} types · ${totalPhotos} color options`}
        onToggle={() => onToggleProduct(category.id)}
        contentId={`mockup-product-${category.id}`}
      />
      {isExpanded && (
        <div id={`mockup-product-${category.id}`} className="px-3 pb-3 pt-1 border-t border-zinc-700/50">
          <p className="mb-2 text-[11px] font-semibold text-purple-300">Step 2 · Choose a style and color</p>
          {category.items.map(item => {
            const displayName = item.id === 'hat' ? 'Cap' : 'Beanie'
            return (
              <div key={item.id} className="mb-3 last:mb-0">
                <h4 className="text-xs font-medium text-zinc-400 mb-2">{displayName}</h4>
                <div className="flex flex-wrap gap-2">
                  {item.colors.map(color => (
                    <MockupGeneratorColorButton
                      key={color}
                      productId={item.id}
                      color={color}
                      status={status}
                      onGenerate={onGenerate}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
