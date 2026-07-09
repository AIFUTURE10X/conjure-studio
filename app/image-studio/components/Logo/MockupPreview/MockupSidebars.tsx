"use client"

/**
 * Mockup Sidebar Components - Barrel Export
 *
 * Re-exports from ./sidebars/ for backwards compatibility.
 * The actual components have been split into smaller files under ./sidebars/
 *
 * @deprecated Import directly from './sidebars' instead
 */

// Re-export components for backwards compatibility
export { LogoSidebar } from './sidebars/LogoSidebar'
export { BrandSidebar } from './sidebars/BrandSidebar'

// Re-export types needed by consumers
export type { TextEffect, TextItem } from './text-effects-config'
