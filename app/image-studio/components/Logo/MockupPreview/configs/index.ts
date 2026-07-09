/**
 * Mockup Configurations - Barrel Exports
 *
 * Each config file defines a product mockup's properties:
 * colors, print areas, dimensions, and rendering functions.
 */

import { tshirtConfig, TSHIRT_COLORS } from './tshirt.config'
import { hoodieConfig, HOODIE_COLORS } from './hoodie.config'
import { hatConfig, HAT_COLORS } from './hat.config'
import { phoneCaseConfig, PHONE_CASE_COLORS } from './phone-case.config'
import { mugConfig, MUG_COLORS } from './mug.config'
import { toteBagConfig, TOTE_BAG_COLORS } from './tote-bag.config'
import { pillowConfig, PILLOW_COLORS } from './pillow.config'
import { wallArtConfig, WALLART_COLORS } from './wall-art.config'
import { posterConfig, POSTER_COLORS } from './poster.config'
import { stickersConfig, STICKER_COLORS } from './stickers.config'
import { customUploadConfig, CUSTOM_UPLOAD_COLORS } from './custom-upload.config'
// New apparel
import { longsleeveConfig, LONGSLEEVE_COLORS } from './longsleeve.config'
import { tanktopConfig, TANKTOP_COLORS } from './tanktop.config'
// Kids & Baby
import { babybodysuitConfig, BABYBODYSUIT_COLORS } from './babybodysuit.config'
import { kidsteeConfig, KIDSTEE_COLORS } from './kidstee.config'
// Pet Products
import { petbandanaConfig, PETBANDANA_COLORS } from './petbandana.config'
import { pethoodieConfig, PETHOODIE_COLORS } from './pethoodie.config'
import { petbedConfig, PETBED_COLORS } from './petbed.config'
// Additional products
import { ziphoodieConfig, ZIPHOODIE_COLORS } from './ziphoodie.config'
import { travelmugConfig, TRAVELMUG_COLORS } from './travelmug.config'
import { tumblerConfig, TUMBLER_COLORS } from './tumbler.config'
import { canvasConfig, CANVAS_COLORS } from './canvas.config'
import { stickerpackConfig, STICKERPACK_COLORS } from './stickerpack.config'
import { backpackConfig, BACKPACK_COLORS } from './backpack.config'
import { fannypackConfig, FANNYPACK_COLORS } from './fannypack.config'
import type { MockupConfig } from '../generic/mockup-types'

// Re-export individual configs
export { tshirtConfig, TSHIRT_COLORS }
export { hoodieConfig, HOODIE_COLORS }
export { hatConfig, HAT_COLORS }
export { phoneCaseConfig, PHONE_CASE_COLORS }
export { mugConfig, MUG_COLORS }
export { toteBagConfig, TOTE_BAG_COLORS }
export { pillowConfig, PILLOW_COLORS }
export { wallArtConfig, WALLART_COLORS }
export { posterConfig, POSTER_COLORS }
export { stickersConfig, STICKER_COLORS }
export { customUploadConfig, CUSTOM_UPLOAD_COLORS }
// New apparel
export { longsleeveConfig, LONGSLEEVE_COLORS }
export { tanktopConfig, TANKTOP_COLORS }
// Kids & Baby
export { babybodysuitConfig, BABYBODYSUIT_COLORS }
export { kidsteeConfig, KIDSTEE_COLORS }
// Pet Products
export { petbandanaConfig, PETBANDANA_COLORS }
export { pethoodieConfig, PETHOODIE_COLORS }
export { petbedConfig, PETBED_COLORS }
// Additional products
export { ziphoodieConfig, ZIPHOODIE_COLORS }
export { travelmugConfig, TRAVELMUG_COLORS }
export { tumblerConfig, TUMBLER_COLORS }
export { canvasConfig, CANVAS_COLORS }
export { stickerpackConfig, STICKERPACK_COLORS }
export { backpackConfig, BACKPACK_COLORS }
export { fannypackConfig, FANNYPACK_COLORS }

/**
 * Registry of all mockup configurations by ID
 */
export const MOCKUP_CONFIGS: Record<string, MockupConfig> = {
  tshirt: tshirtConfig,
  hoodie: hoodieConfig,
  hat: hatConfig,
  'phone-case': phoneCaseConfig,
  mug: mugConfig,
  'tote-bag': toteBagConfig,
  pillow: pillowConfig,
  'wall-art': wallArtConfig,
  poster: posterConfig,
  stickers: stickersConfig,
  'custom-upload': customUploadConfig,
  // New apparel
  longsleeve: longsleeveConfig,
  tanktop: tanktopConfig,
  // Kids & Baby
  babybodysuit: babybodysuitConfig,
  kidstee: kidsteeConfig,
  // Pet Products
  petbandana: petbandanaConfig,
  pethoodie: pethoodieConfig,
  petbed: petbedConfig,
  // Additional products
  ziphoodie: ziphoodieConfig,
  travelmug: travelmugConfig,
  tumbler: tumblerConfig,
  canvas: canvasConfig,
  stickerpack: stickerpackConfig,
  backpack: backpackConfig,
  fannypack: fannypackConfig,
}

/**
 * Get mockup config by ID
 */
export function getMockupConfig(id: string): MockupConfig | undefined {
  return MOCKUP_CONFIGS[id]
}

/**
 * Get all available mockup IDs
 */
export function getAvailableMockupIds(): string[] {
  return Object.keys(MOCKUP_CONFIGS)
}
