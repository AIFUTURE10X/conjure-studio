/**
 * Mockup Configuration Types
 *
 * Defines the schema for product mockup configurations.
 * Each product (t-shirt, hoodie, mug, etc.) is defined by a config file
 * that implements these interfaces.
 */

import type { ComponentType } from 'react'

// ============ Core Types ============

/**
 * Category identifiers for organizing mockups in the UI
 */
export type MockupCategory = 'apparel' | 'accessories' | 'bags' | 'home' | 'other'

/**
 * Defines a rectangular area as percentages of the container
 * Used for print area constraints during drag operations
 */
export interface PrintArea {
  top: number      // % from top (0-100)
  left: number     // % from left (0-100)
  width: number    // % width (0-100)
  height: number   // % height (0-100)
}

/**
 * Position as percentage coordinates
 */
export interface Position {
  x: number  // % from left (0-100)
  y: number  // % from top (0-100)
}

/**
 * Product color variant (e.g., Black T-shirt, White Hoodie)
 */
export interface ProductColor {
  id: string
  name: string
  hex: string
  textColor: 'light' | 'dark'  // For contrast on brand text
}

// ============ Shape Renderer Types ============

/**
 * View type for front/back switching
 */
export type MockupView = 'front' | 'back'

/**
 * Props passed to shape renderer components (SVG shapes)
 */
export interface ShapeRendererProps {
  color: ProductColor
  /** Current view (front or back) - defaults to 'front' */
  view?: MockupView
  className?: string
  style?: React.CSSProperties
  /** Custom product image URL (for custom-upload shape) */
  customImageUrl?: string
  /** Callback when user uploads a custom product image */
  onImageUpload?: (url: string) => void
}

/**
 * Canvas draw function signature for export
 * Each product provides its own function to draw the shape on canvas
 */
export type DrawShapeFunction = (
  ctx: CanvasRenderingContext2D,
  color: ProductColor,
  width: number,
  height: number,
  view?: MockupView
) => void

// ============ Photo Assets ============

/**
 * Photo-based mockup asset configuration
 * Maps product colors to photo URLs for realistic rendering
 */
export interface PhotoAssets {
  /** Base URL path for photos e.g., '/mockups/tshirt/' */
  baseUrl: string
  /** Maps color IDs to photo filenames e.g., { 'black': 'black.webp' } */
  colorMap: Record<string, string>
  /** Fallback photo if color not found in map */
  fallbackPhoto?: string
}

/**
 * Rendering mode for the mockup
 */
export type RenderMode = 'photo' | 'svg'

// ============ Mockup Configuration ============

/**
 * Optional feature flags for product-specific capabilities
 */
export interface MockupFeatures {
  /** Whether text can be rotated on this product */
  supportsRotation?: boolean
  /** For curved surfaces like mugs - affects logo rendering */
  supportsCurvedPrint?: boolean
  /** For perspective views like phone cases */
  supportsPerspective?: boolean
  /** Available views e.g., ['front', 'back'] for apparel */
  multipleViews?: string[]
  /** Shape variants for stickers: 'circle' | 'square' | 'rounded' | 'custom' */
  shapeVariants?: string[]
}

/**
 * Export configuration for canvas-based PNG/SVG/PDF export
 */
export interface ExportConfig {
  /** Function to draw the product shape on canvas */
  drawShape: DrawShapeFunction
  /** Y offset to crop from top (e.g., 100 to hide empty space above t-shirt) */
  yOffset?: number
  /** Scale multiplier for HiDPI export (default: 2) */
  scale?: number
}

/**
 * Main mockup configuration schema
 * Each product implements this interface in its config file
 */
export interface MockupConfig {
  // ---- Identity ----
  /** Unique identifier e.g., 'tshirt', 'hoodie', 'mug' */
  id: string
  /** Display name e.g., 'T-Shirt', 'Hoodie', 'Coffee Mug' */
  name: string
  /** Category for tab grouping */
  category: MockupCategory
  /** Lucide icon name for tab display */
  icon: string

  // ---- Dimensions ----
  /** Base canvas width in pixels */
  canvasWidth: number
  /** Base canvas height in pixels */
  canvasHeight: number
  /** CSS aspect ratio for container e.g., '4/5', '1/1' */
  aspectRatio: string

  // ---- Print Areas ----
  /** Drag constraint area for logo (percentage-based) */
  logoPrintArea: PrintArea
  /** Drag constraint area for text (percentage-based) */
  textPrintArea: PrintArea

  // ---- Default Positions ----
  /** Initial logo position (percentage-based) */
  defaultLogoPosition: Position
  /** Initial logo scale (1.0 = 100%) */
  defaultLogoScale: number
  /** Initial text position (percentage-based) */
  defaultTextPosition: Position
  /** Initial text scale (1.0 = 100%) */
  defaultTextScale: number

  // ---- Product Variants ----
  /** Available color options for this product */
  colors: ProductColor[]
  /** Default color ID on first render */
  defaultColorId: string

  // ---- Rendering ----
  /** React component that renders the SVG shape */
  shapeComponent: ComponentType<ShapeRendererProps>

  // ---- Export ----
  /** Configuration for canvas-based export */
  exportConfig: ExportConfig

  // ---- Optional Features ----
  /** Feature flags for product-specific capabilities */
  features?: MockupFeatures

  // ---- Photo-Based Rendering (Optional) ----
  /** Photo assets for realistic mockup rendering */
  photoAssets?: PhotoAssets
  /** Render mode: 'photo' uses photoAssets, 'svg' uses shapeComponent */
  renderMode?: RenderMode
}

// ============ Category Definition ============

/**
 * Category definition for the tab navigation
 */
export interface CategoryDefinition {
  id: MockupCategory
  label: string
  icon: string  // Lucide icon name
  mockupIds: string[]
}

// ============ State Types ============

/**
 * Available text effects
 */
export type TextEffect = 'none' | '3d' | 'embossed' | 'floating' | 'debossed' | 'extrude' | 'solid-block'

/**
 * Text item for multiple text support
 */
export interface TextItem {
  id: string
  content: string
  position: Position
  scale: number
  scaleX?: number  // Independent width scale
  scaleY?: number  // Independent height scale
  font: string
  color: string
  effect: TextEffect
  rotation: number
}

/**
 * Complete mockup state (used by GenericMockup component)
 */
export interface MockupState {
  // Product
  selectedColor: ProductColor

  // Logo
  logoPosition: Position
  logoScale: number

  // Brand text
  showBrandName: boolean
  brandName: string
  brandPosition: Position
  brandScale: number
  brandFont: string
  brandColor: string
  brandEffect: TextEffect
  brandRotation: number

  // Multiple text items
  textItems: TextItem[]
  selectedTextId: string | null

  // UI state
  showColorPicker: boolean
  isEditingName: boolean
}

// ============ Brand Settings for Preset Save/Load ============

/**
 * Brand text settings that can be saved with presets
 */
export interface BrandSettings {
  editableBrandName: string
  brandPosition: Position
  brandScale: number
  brandFont: string
  brandColor: string
  brandEffect: TextEffect
  brandRotation: number
  brandWeight: number
  showBrandName: boolean
  textItems: TextItem[]
}

// ============ Export Controls ============

/**
 * Controls exposed by mockup for parent components
 */
export interface MockupExportControls {
  isExporting: boolean
  showExportMenu: boolean
  setShowExportMenu: (show: boolean) => void
  handleReset: () => void
  handleExportPNG: () => Promise<void>
  handleExportSVG: () => Promise<void>
  handleExportPDF: () => Promise<void>
  /** Capture the current mockup as a canvas element */
  captureCanvas: () => Promise<HTMLCanvasElement | null>
  /** Get current brand settings for preset saving */
  getBrandSettings?: () => BrandSettings
  /** Set canvas zoom level (1.0 = 100%) */
  setCanvasZoom?: (zoom: number) => void
}
