/**
 * Mockup Reducer Utilities
 *
 * Helper functions for creating initial state and common operations.
 */

import type { MockupConfig, ProductColor } from './mockup-types'
import type { MockupReducerState } from './mockupReducer.types'

/**
 * Creates the initial reducer state from a mockup config.
 * Used by useReducer's initializer and RESET action.
 */
export function createInitialState(
  config: MockupConfig,
  brandName: string,
  defaultColor?: ProductColor
): MockupReducerState {
  const selectedColor = defaultColor ||
    config.colors.find(c => c.id === config.defaultColorId) ||
    config.colors[0]

  return {
    color: {
      selected: selectedColor,
      showPicker: false,
    },
    logo: {
      position: config.defaultLogoPosition,
      scale: config.defaultLogoScale,
    },
    brand: {
      show: true,
      name: brandName,
      position: config.defaultTextPosition,
      scale: config.defaultTextScale,
      font: 'montserrat',
      color: '#ffffff',
      effect: 'none',
      rotation: 0,
      weight: 400,
      showFontPicker: false,
    },
    textItems: {
      items: [],
      selectedId: null,
    },
    backgroundRemoval: {
      isRemoving: false,
      processedLogoUrl: null,
      processedProductUrl: null,
    },
    canvas: {
      view: 'front',
      zoom: 1.0,
      showGrid: false,
      showRulers: false,
    },
    ui: {
      photoLoadFailed: false,
    },
  }
}
