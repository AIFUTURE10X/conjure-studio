/**
 * Mockup Reducer Types
 *
 * Defines state shape and action types for the mockup useReducer pattern.
 * State is grouped by concern for better organization and batched updates.
 */

import type { ProductColor, Position, TextEffect, TextItem, MockupView, BrandSettings, MockupConfig } from './mockup-types'

// ============ Grouped State Shape ============

export interface ColorState {
  selected: ProductColor
  showPicker: boolean
}

export interface LogoState {
  position: Position
  scale: number
}

export interface BrandState {
  show: boolean
  name: string
  position: Position
  scale: number
  font: string
  color: string
  effect: TextEffect
  rotation: number
  weight: number
  showFontPicker: boolean
}

export interface TextItemsState {
  items: TextItem[]
  selectedId: string | null
}

export interface BackgroundRemovalState {
  isRemoving: boolean
  processedLogoUrl: string | null
  processedProductUrl: string | null
}

export interface CanvasState {
  view: MockupView
  zoom: number
  showGrid: boolean
  showRulers: boolean
}

export interface UIState {
  photoLoadFailed: boolean
}

/** Complete reducer state - grouped by concern */
export interface MockupReducerState {
  color: ColorState
  logo: LogoState
  brand: BrandState
  textItems: TextItemsState
  backgroundRemoval: BackgroundRemovalState
  canvas: CanvasState
  ui: UIState
}

// ============ Action Types ============

// Color Actions
export type ColorAction =
  | { type: 'SET_COLOR'; payload: ProductColor }
  | { type: 'SET_SHOW_COLOR_PICKER'; payload: boolean }
  | { type: 'TOGGLE_COLOR_PICKER' }

// Logo Actions
export type LogoAction =
  | { type: 'SET_LOGO_POSITION'; payload: Position }
  | { type: 'SET_LOGO_SCALE'; payload: number }

// Brand Actions
export type BrandAction =
  | { type: 'SET_SHOW_BRAND_NAME'; payload: boolean }
  | { type: 'TOGGLE_BRAND_NAME' }
  | { type: 'SET_BRAND_NAME'; payload: string }
  | { type: 'SET_BRAND_POSITION'; payload: Position }
  | { type: 'SET_BRAND_SCALE'; payload: number }
  | { type: 'SET_BRAND_FONT'; payload: string }
  | { type: 'SET_BRAND_COLOR'; payload: string }
  | { type: 'SET_BRAND_EFFECT'; payload: TextEffect }
  | { type: 'SET_BRAND_ROTATION'; payload: number }
  | { type: 'SET_BRAND_WEIGHT'; payload: number }
  | { type: 'SET_SHOW_FONT_PICKER'; payload: boolean }
  | { type: 'TOGGLE_FONT_PICKER' }
  | { type: 'RESTORE_BRAND_SETTINGS'; payload: BrandSettings }

// Text Items Actions
export type TextItemsAction =
  | { type: 'SET_TEXT_ITEMS'; payload: TextItem[] }
  | { type: 'ADD_TEXT_ITEM'; payload: TextItem }
  | { type: 'REMOVE_TEXT_ITEM'; payload: string }
  | { type: 'UPDATE_TEXT_ITEM'; payload: { id: string; updates: Partial<TextItem> } }
  | { type: 'SET_SELECTED_TEXT_ID'; payload: string | null }
  | { type: 'SELECT_TEXT_ITEM'; payload: string } // Batched: select + populate brand fields

// Background Removal Actions
export type BackgroundRemovalAction =
  | { type: 'SET_IS_REMOVING_BG'; payload: boolean }
  | { type: 'SET_PROCESSED_LOGO_URL'; payload: string | null }
  | { type: 'SET_PROCESSED_PRODUCT_URL'; payload: string | null }

// Canvas Actions
export type CanvasAction =
  | { type: 'SET_VIEW'; payload: MockupView }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_SHOW_GRID'; payload: boolean }
  | { type: 'TOGGLE_GRID' }
  | { type: 'SET_SHOW_RULERS'; payload: boolean }
  | { type: 'TOGGLE_RULERS' }

// UI Actions
export type UIAction =
  | { type: 'SET_PHOTO_LOAD_FAILED'; payload: boolean }

// Meta Actions (batch operations)
export type MetaAction =
  | { type: 'RESET'; payload: { config: MockupConfig; brandName: string } }

// Union of all actions
export type MockupAction =
  | ColorAction
  | LogoAction
  | BrandAction
  | TextItemsAction
  | BackgroundRemovalAction
  | CanvasAction
  | UIAction
  | MetaAction
