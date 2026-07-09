"use client"

/**
 * MegaMenu Component
 *
 * Dropdown mega menu for product category selection.
 * Shows 10 main categories with sub-category items in a grid layout.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Package, Check } from 'lucide-react'
import { MEGA_MENU_CATEGORIES, type SubCategory } from '../categories'
import { MegaMenuColumn } from './MegaMenuColumn'

interface MegaMenuProps {
  /** Currently selected sub-category ID */
  selectedSubCategoryId: string
  /** Callback when user selects a sub-category */
  onSelectSubCategory: (subCategoryId: string, mockupId: string) => void
}

export function MegaMenu({ selectedSubCategoryId, onSelectSubCategory }: MegaMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen])

  // Handle sub-category selection
  const handleSelect = useCallback((subCategory: SubCategory) => {
    const mockupId = subCategory.mockupIds[0] || subCategory.id
    onSelectSubCategory(subCategory.id, mockupId)
    setIsOpen(false)
  }, [onSelectSubCategory])

  // Get selected sub-category label for display
  const getSelectedLabel = () => {
    for (const category of MEGA_MENU_CATEGORIES) {
      const sub = category.subCategories.find(s => s.id === selectedSubCategoryId)
      if (sub) {
        return sub.label + (sub.hasFrontBack ? ' (Front & Back)' : '')
      }
    }
    return 'Select Product'
  }

  // Split categories into two rows (6 + 4)
  const topRowCategories = MEGA_MENU_CATEGORIES.slice(0, 6)
  const bottomRowCategories = MEGA_MENU_CATEGORIES.slice(6)

  return (
    <div ref={menuRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          isOpen
            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
            : 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700'
        }`}
      >
        <Package className="w-4 h-4" />
        Products
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden min-w-[900px]" style={{ backgroundColor: '#555555' }}>
          {/* Top Row - 6 Categories */}
          <div className="grid grid-cols-6 gap-0 border-b border-zinc-800">
            {topRowCategories.map((category) => (
              <MegaMenuColumn
                key={category.id}
                category={category}
                selectedSubCategoryId={selectedSubCategoryId}
                onSelect={handleSelect}
              />
            ))}
          </div>

          {/* Bottom Row - 4 Categories */}
          <div className="grid grid-cols-6 gap-0">
            {bottomRowCategories.map((category) => (
              <MegaMenuColumn
                key={category.id}
                category={category}
                selectedSubCategoryId={selectedSubCategoryId}
                onSelect={handleSelect}
              />
            ))}
            {/* Empty cells to fill grid */}
            <div className="col-span-2" />
          </div>
        </div>
      )}
    </div>
  )
}
