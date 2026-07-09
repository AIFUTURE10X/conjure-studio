/**
 * Mockup Shapes - Barrel Exports
 *
 * Each shape component renders the product SVG and provides
 * a canvas draw function for export.
 */

// Photo-based shape (for realistic mockups)
export { PhotoShape, drawPhotoToCanvas } from './PhotoShape'

// SVG shapes (fallback / legacy)
export { TShirtShape, TSHIRT_PATHS, TSHIRT_VIEWBOX, drawTShirtToCanvas } from './TShirtShape'
export { HoodieShape, HOODIE_VIEWBOX, drawHoodieToCanvas } from './HoodieShape'
export { HatShape, HAT_VIEWBOX, drawHatToCanvas } from './HatShape'
export { PhoneCaseShape, PHONE_VIEWBOX, drawPhoneCaseToCanvas } from './PhoneCaseShape'
export { MugShape, MUG_VIEWBOX, drawMugToCanvas } from './MugShape'
export { ToteBagShape, TOTE_VIEWBOX, drawToteBagToCanvas } from './ToteBagShape'
export { PillowShape, PILLOW_VIEWBOX, drawPillowToCanvas } from './PillowShape'
export { WallArtShape, WALLART_VIEWBOX, drawWallArtToCanvas } from './WallArtShape'
export { StickerShape, STICKER_VIEWBOX, drawStickerToCanvas } from './StickerShape'
