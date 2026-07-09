/**
 * Mockup Categories Configuration
 *
 * Defines the mega menu categories and their sub-categories.
 * Used by MegaMenu for the dropdown navigation.
 */

import { Shirt, Coffee, Frame, Sticker, ShoppingBag, Bed, Smartphone, Baby, PawPrint } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ============ Types ============

export interface SubCategory {
  id: string
  label: string
  /** Mockup config IDs that belong to this sub-category */
  mockupIds: string[]
  /** Whether this item has Front & Back views */
  hasFrontBack?: boolean
}

export interface MegaMenuCategory {
  id: string
  label: string
  icon: LucideIcon
  subCategories: SubCategory[]
}

// ============ Mega Menu Categories ============

export const MEGA_MENU_CATEGORIES: MegaMenuCategory[] = [
  // Row 1 (6 categories)
  {
    id: 'tshirts-tops',
    label: 'T-Shirts & Tops',
    icon: Shirt,
    subCategories: [
      { id: 'tshirt', label: 'T-Shirts', mockupIds: ['tshirt'], hasFrontBack: true },
      { id: 'longsleeve', label: 'Long-sleeve tees', mockupIds: ['longsleeve'], hasFrontBack: true },
      { id: 'tanktop', label: 'Tank tops', mockupIds: ['tanktop'], hasFrontBack: true },
    ],
  },
  {
    id: 'hoodies-streetwear',
    label: 'Hoodies & Streetwear',
    icon: Shirt,
    subCategories: [
      { id: 'hoodie', label: 'Pullover hoodies', mockupIds: ['hoodie'], hasFrontBack: true },
      { id: 'ziphoodie', label: 'Zip hoodies', mockupIds: ['ziphoodie'], hasFrontBack: true },
    ],
  },
  {
    id: 'drinkware',
    label: 'Mugs & Drinkware',
    icon: Coffee,
    subCategories: [
      { id: 'mug', label: 'Mugs', mockupIds: ['mug'] },
      { id: 'travelmug', label: 'Travel mugs', mockupIds: ['travelmug'] },
      { id: 'tumbler', label: 'Tumblers & bottles', mockupIds: ['tumbler'] },
    ],
  },
  {
    id: 'wall-art',
    label: 'Wall Art & Decor',
    icon: Frame,
    subCategories: [
      { id: 'poster', label: 'Posters & prints', mockupIds: ['poster', 'wall-art'] },
      { id: 'canvas', label: 'Canvas prints', mockupIds: ['canvas'] },
    ],
  },
  {
    id: 'stickers',
    label: 'Stickers & Decals',
    icon: Sticker,
    subCategories: [
      { id: 'sticker-sheet', label: 'Sticker sheets', mockupIds: ['stickers'] },
      { id: 'stickerpack', label: 'Sticker packs', mockupIds: ['stickerpack'] },
    ],
  },
  {
    id: 'bags',
    label: 'Bags & Accessories',
    icon: ShoppingBag,
    subCategories: [
      { id: 'tote-bag', label: 'Tote bags', mockupIds: ['tote-bag'] },
      { id: 'backpack', label: 'Backpacks', mockupIds: ['backpack'], hasFrontBack: true },
      { id: 'fannypack', label: 'Fanny packs', mockupIds: ['fannypack'] },
    ],
  },
  // Row 2 (4 categories)
  {
    id: 'home-soft',
    label: 'Pillows & Blankets',
    icon: Bed,
    subCategories: [
      { id: 'pillow', label: 'Throw pillows', mockupIds: ['pillow'] },
    ],
  },
  {
    id: 'phone-cases',
    label: 'Phone Cases',
    icon: Smartphone,
    subCategories: [
      { id: 'phone-case', label: 'Phone cases', mockupIds: ['phone-case'] },
    ],
  },
  {
    id: 'kids-baby',
    label: 'Kids & Baby',
    icon: Baby,
    subCategories: [
      { id: 'babybodysuit', label: 'Baby bodysuits', mockupIds: ['babybodysuit'], hasFrontBack: true },
      { id: 'kidstee', label: 'Kids tees & hoodies', mockupIds: ['kidstee'], hasFrontBack: true },
    ],
  },
  {
    id: 'pet-products',
    label: 'Pet Products',
    icon: PawPrint,
    subCategories: [
      { id: 'petbandana', label: 'Pet bandanas', mockupIds: ['petbandana'] },
      { id: 'pethoodie', label: 'Pet hoodies & shirts', mockupIds: ['pethoodie'], hasFrontBack: true },
      { id: 'petbed', label: 'Pet beds & blankets', mockupIds: ['petbed'] },
    ],
  },
]

// ============ Helper Functions ============

/**
 * Get all sub-categories flattened
 */
export function getAllSubCategories(): SubCategory[] {
  return MEGA_MENU_CATEGORIES.flatMap(cat => cat.subCategories)
}

/**
 * Get sub-category by ID
 */
export function getSubCategoryById(id: string): SubCategory | undefined {
  return getAllSubCategories().find(sub => sub.id === id)
}

/**
 * Get parent category for a sub-category ID
 */
export function getParentCategory(subCategoryId: string): MegaMenuCategory | undefined {
  return MEGA_MENU_CATEGORIES.find(cat =>
    cat.subCategories.some(sub => sub.id === subCategoryId)
  )
}

/**
 * Get all mockup IDs across all categories
 */
export function getAllMockupIds(): string[] {
  return getAllSubCategories().flatMap(sub => sub.mockupIds)
}

/**
 * Default selection on first load
 */
export const DEFAULT_SUB_CATEGORY_ID = 'tshirt'
export const DEFAULT_MOCKUP_ID = 'tshirt'

// ============ Legacy Compatibility ============
// Keep old exports for backward compatibility during migration

export type MockupCategory =
  | 'tshirts-tops'
  | 'hoodies-streetwear'
  | 'drinkware'
  | 'wall-art'
  | 'stickers'
  | 'bags'
  | 'home-soft'
  | 'phone-cases'
  | 'kids-baby'
  | 'pet-products'

export interface CategoryDefinition {
  id: string
  label: string
  icon: string
  mockupIds: string[]
}

// Legacy category list for backward compatibility
export const MOCKUP_CATEGORIES: CategoryDefinition[] = MEGA_MENU_CATEGORIES.map(cat => ({
  id: cat.id,
  label: cat.label,
  icon: cat.icon.displayName || 'Shirt',
  mockupIds: cat.subCategories.flatMap(sub => sub.mockupIds),
}))

export function getCategoryById(id: string): CategoryDefinition | undefined {
  return MOCKUP_CATEGORIES.find(cat => cat.id === id)
}

export function getCategoryByMockupId(mockupId: string): CategoryDefinition | undefined {
  return MOCKUP_CATEGORIES.find(cat => cat.mockupIds.includes(mockupId))
}

export const DEFAULT_CATEGORY: MockupCategory = 'tshirts-tops'
