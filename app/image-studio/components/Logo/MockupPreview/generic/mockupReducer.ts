/**
 * Mockup Reducer
 *
 * Pure reducer function for mockup state management.
 * Handles all state updates in a centralized, predictable way.
 */

import type { MockupReducerState, MockupAction } from './mockupReducer.types'
import { createInitialState } from './mockupReducer.utils'

export function mockupReducer(state: MockupReducerState, action: MockupAction): MockupReducerState {
  switch (action.type) {
    // ============ Color Actions ============
    case 'SET_COLOR':
      return { ...state, color: { ...state.color, selected: action.payload }, ui: { ...state.ui, photoLoadFailed: false } }

    case 'SET_SHOW_COLOR_PICKER':
      return { ...state, color: { ...state.color, showPicker: action.payload } }

    case 'TOGGLE_COLOR_PICKER':
      return { ...state, color: { ...state.color, showPicker: !state.color.showPicker } }

    // ============ Logo Actions ============
    case 'SET_LOGO_POSITION':
      return { ...state, logo: { ...state.logo, position: action.payload } }

    case 'SET_LOGO_SCALE':
      return { ...state, logo: { ...state.logo, scale: action.payload } }

    // ============ Brand Actions ============
    case 'SET_SHOW_BRAND_NAME':
      return { ...state, brand: { ...state.brand, show: action.payload } }

    case 'TOGGLE_BRAND_NAME':
      return { ...state, brand: { ...state.brand, show: !state.brand.show } }

    case 'SET_BRAND_NAME':
      return { ...state, brand: { ...state.brand, name: action.payload } }

    case 'SET_BRAND_POSITION':
      return { ...state, brand: { ...state.brand, position: action.payload } }

    case 'SET_BRAND_SCALE':
      return { ...state, brand: { ...state.brand, scale: action.payload } }

    case 'SET_BRAND_FONT':
      return { ...state, brand: { ...state.brand, font: action.payload } }

    case 'SET_BRAND_COLOR':
      return { ...state, brand: { ...state.brand, color: action.payload } }

    case 'SET_BRAND_EFFECT':
      return { ...state, brand: { ...state.brand, effect: action.payload } }

    case 'SET_BRAND_ROTATION':
      return { ...state, brand: { ...state.brand, rotation: action.payload } }

    case 'SET_BRAND_WEIGHT':
      return { ...state, brand: { ...state.brand, weight: action.payload } }

    case 'SET_SHOW_FONT_PICKER':
      return { ...state, brand: { ...state.brand, showFontPicker: action.payload } }

    case 'TOGGLE_FONT_PICKER':
      return { ...state, brand: { ...state.brand, showFontPicker: !state.brand.showFontPicker } }

    case 'RESTORE_BRAND_SETTINGS': {
      // Batched update: restore all brand settings from preset in ONE render
      const settings = action.payload
      return {
        ...state,
        brand: {
          show: settings.showBrandName,
          name: settings.editableBrandName,
          position: settings.brandPosition,
          scale: settings.brandScale,
          font: settings.brandFont,
          color: settings.brandColor,
          effect: settings.brandEffect,
          rotation: settings.brandRotation,
          weight: settings.brandWeight,
          showFontPicker: state.brand.showFontPicker, // Preserve UI state
        },
        textItems: {
          ...state.textItems,
          items: settings.textItems || [],
        },
      }
    }

    // ============ Text Items Actions ============
    case 'SET_TEXT_ITEMS':
      return { ...state, textItems: { ...state.textItems, items: action.payload } }

    case 'ADD_TEXT_ITEM':
      return { ...state, textItems: { ...state.textItems, items: [...state.textItems.items, action.payload] } }

    case 'REMOVE_TEXT_ITEM':
      return {
        ...state,
        textItems: {
          items: state.textItems.items.filter(t => t.id !== action.payload),
          selectedId: state.textItems.selectedId === action.payload ? null : state.textItems.selectedId,
        },
      }

    case 'UPDATE_TEXT_ITEM':
      return {
        ...state,
        textItems: {
          ...state.textItems,
          items: state.textItems.items.map(t =>
            t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
          ),
        },
      }

    case 'SET_SELECTED_TEXT_ID':
      return { ...state, textItems: { ...state.textItems, selectedId: action.payload } }

    case 'SELECT_TEXT_ITEM': {
      // Batched: select text AND populate brand fields in ONE render
      const item = state.textItems.items.find(t => t.id === action.payload)
      if (!item) {
        return { ...state, textItems: { ...state.textItems, selectedId: action.payload } }
      }
      return {
        ...state,
        textItems: { ...state.textItems, selectedId: action.payload },
        brand: {
          ...state.brand,
          name: item.content,
          position: item.position,
          scale: item.scale,
          font: item.font,
          color: item.color,
          effect: item.effect,
          rotation: item.rotation,
        },
      }
    }

    // ============ Background Removal Actions ============
    case 'SET_IS_REMOVING_BG':
      return { ...state, backgroundRemoval: { ...state.backgroundRemoval, isRemoving: action.payload } }

    case 'SET_PROCESSED_LOGO_URL':
      return { ...state, backgroundRemoval: { ...state.backgroundRemoval, processedLogoUrl: action.payload } }

    case 'SET_PROCESSED_PRODUCT_URL':
      return { ...state, backgroundRemoval: { ...state.backgroundRemoval, processedProductUrl: action.payload } }

    // ============ Canvas Actions ============
    case 'SET_VIEW':
      return { ...state, canvas: { ...state.canvas, view: action.payload } }

    case 'SET_ZOOM':
      return { ...state, canvas: { ...state.canvas, zoom: action.payload } }

    case 'SET_SHOW_GRID':
      return { ...state, canvas: { ...state.canvas, showGrid: action.payload } }

    case 'TOGGLE_GRID':
      return { ...state, canvas: { ...state.canvas, showGrid: !state.canvas.showGrid } }

    case 'SET_SHOW_RULERS':
      return { ...state, canvas: { ...state.canvas, showRulers: action.payload } }

    case 'TOGGLE_RULERS':
      return { ...state, canvas: { ...state.canvas, showRulers: !state.canvas.showRulers } }

    // ============ UI Actions ============
    case 'SET_PHOTO_LOAD_FAILED':
      return { ...state, ui: { ...state.ui, photoLoadFailed: action.payload } }

    // ============ Meta Actions ============
    case 'RESET':
      return createInitialState(action.payload.config, action.payload.brandName)

    default:
      return state
  }
}
