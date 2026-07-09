"use client"

/**
 * MegaMenuColumn Component
 *
 * Single column in the mega menu representing one main category
 * with its sub-category items.
 */

import { Check } from 'lucide-react'
import type { MegaMenuCategory, SubCategory } from '../categories'

interface MegaMenuColumnProps {
  category: MegaMenuCategory
  selectedSubCategoryId: string
  onSelect: (subCategory: SubCategory) => void
}

export function MegaMenuColumn({ category, selectedSubCategoryId, onSelect }: MegaMenuColumnProps) {
  const IconComponent = category.icon

  return (
    <div className="p-4 border-r border-zinc-800 last:border-r-0">
      {/* Category Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-700/50">
        <IconComponent className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
          {category.label}
        </span>
      </div>

      {/* Sub-category Items */}
      <div className="space-y-1">
        {category.subCategories.map((sub) => {
          const isSelected = sub.id === selectedSubCategoryId

          return (
            <button
              key={sub.id}
              onClick={() => onSelect(sub)}
              className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-left text-sm transition-all ${
                isSelected
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {sub.label}
                {sub.hasFrontBack && (
                  <span className="text-[10px] text-amber-400/80 font-medium">F&B</span>
                )}
              </span>
              {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
