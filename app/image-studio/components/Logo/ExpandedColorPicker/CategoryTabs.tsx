"use client"

/**
 * Category Tabs Component
 * Tab navigation for color categories
 */

import { COLOR_CATEGORIES, type ColorCategory } from '@/app/image-studio/constants/color-palettes'

interface CategoryTabsProps {
  activeCategory: ColorCategory
  onCategoryChange: (category: ColorCategory) => void
}

export function CategoryTabs({
  activeCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {COLOR_CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onCategoryChange(cat.id)}
          className={`px-2 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
            activeCategory === cat.id
              ? 'bg-purple-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          <span>{cat.icon}</span>
          <span>{cat.label}</span>
        </button>
      ))}
    </div>
  )
}
