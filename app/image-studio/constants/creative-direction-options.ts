export interface CreativeDirectionOption {
  value: string
  label: string
  promptText: string
}

export interface CreativeDirectionState {
  adType: string
  ctaStyle: string
  informationLayout: string
  adPreset: string
  typographyStyle: string
  fontFill: string
  backgroundScenery: string
  paperEffect: string
  textureStrength: string
  decorativeElements: string[]
  colorPalette: string
}

export type CreativeDirectionKey = keyof Omit<CreativeDirectionState, 'decorativeElements'>

export const DEFAULT_CREATIVE_DIRECTION: CreativeDirectionState = {
  adType: '',
  ctaStyle: '',
  informationLayout: '',
  adPreset: '',
  typographyStyle: '',
  fontFill: '',
  backgroundScenery: '',
  paperEffect: '',
  textureStrength: '',
  decorativeElements: [],
  colorPalette: '',
}

export const AD_TYPE_OPTIONS: CreativeDirectionOption[] = [
  { value: 'product-launch', label: 'Product launch', promptText: 'product launch advertisement' },
  { value: 'limited-time-offer', label: 'Limited-time offer', promptText: 'limited-time promotional offer advertisement' },
  { value: 'event-announcement', label: 'Event announcement', promptText: 'event announcement poster' },
  { value: 'restaurant-menu-special', label: 'Restaurant menu special', promptText: 'restaurant menu special promotion' },
  { value: 'hotel-resort-package', label: 'Hotel / resort package', promptText: 'hotel and resort package advertisement' },
  { value: 'real-estate-listing', label: 'Real estate listing', promptText: 'premium real estate listing advertisement' },
  { value: 'service-promotion', label: 'Service promotion', promptText: 'service promotion advertisement' },
  { value: 'brand-awareness-poster', label: 'Brand awareness poster', promptText: 'brand awareness poster campaign' },
  { value: 'social-media-square-ad', label: 'Social media square ad', promptText: 'social media square advertisement layout' },
  { value: 'story-reel-vertical-ad', label: 'Story / Reel vertical ad', promptText: 'vertical story and reel advertisement layout' },
  { value: 'print-flyer', label: 'Print flyer', promptText: 'print flyer advertisement' },
  { value: 'luxury-invitation', label: 'Luxury invitation', promptText: 'luxury invitation design' },
  { value: 'recruitment-hiring-ad', label: 'Recruitment / hiring ad', promptText: 'recruitment and hiring advertisement' },
  { value: 'course-workshop-promo', label: 'Course / workshop promo', promptText: 'course and workshop promotional ad' },
  { value: 'membership-offer', label: 'Membership offer', promptText: 'membership offer advertisement' },
]

export const CTA_STYLE_OPTIONS: CreativeDirectionOption[] = [
  { value: 'book-now', label: 'Book now', promptText: 'clear book now call-to-action' },
  { value: 'message-us', label: 'Message us', promptText: 'message us call-to-action' },
  { value: 'call-today', label: 'Call today', promptText: 'call today call-to-action' },
  { value: 'reserve-your-spot', label: 'Reserve your spot', promptText: 'reserve your spot call-to-action' },
  { value: 'learn-more', label: 'Learn more', promptText: 'learn more call-to-action' },
  { value: 'visit-website', label: 'Visit website', promptText: 'visit website call-to-action' },
  { value: 'get-quote', label: 'Get quote', promptText: 'get quote call-to-action' },
  { value: 'claim-offer', label: 'Claim offer', promptText: 'claim offer call-to-action' },
  { value: 'join-now', label: 'Join now', promptText: 'join now call-to-action' },
  { value: 'limited-seats', label: 'Limited seats', promptText: 'limited seats urgency callout' },
  { value: 'early-bird', label: 'Early bird', promptText: 'early bird offer callout' },
  { value: 'contact-agent', label: 'Contact agent', promptText: 'contact agent call-to-action' },
]

export const INFORMATION_LAYOUT_OPTIONS: CreativeDirectionOption[] = [
  { value: 'hero-headline-only', label: 'Hero headline only', promptText: 'hero headline focused layout' },
  { value: 'headline-subtitle', label: 'Headline + subtitle', promptText: 'headline and subtitle layout' },
  { value: 'feature-badges', label: 'Feature badges', promptText: 'feature badge information layout' },
  { value: 'price-offer-focused', label: 'Price / offer focused', promptText: 'price and offer focused layout' },
  { value: 'contact-card-footer', label: 'Contact card footer', promptText: 'contact card footer layout' },
  { value: 'event-details-block', label: 'Event details block', promptText: 'event details block layout' },
  { value: 'menu-list-layout', label: 'Menu/list layout', promptText: 'menu list information layout' },
  { value: 'before-after-layout', label: 'Before-and-after layout', promptText: 'before and after comparison layout' },
  { value: 'testimonial-quote-layout', label: 'Testimonial quote layout', promptText: 'testimonial quote layout' },
  { value: 'map-location-focused', label: 'Map/location focused', promptText: 'map and location focused layout' },
]

export const AD_PRESET_OPTIONS: CreativeDirectionOption[] = [
  { value: 'luxury-hotel-escape', label: 'Luxury Hotel Escape', promptText: 'luxury hotel escape campaign style' },
  { value: 'fine-dining-invitation', label: 'Fine Dining Invitation', promptText: 'fine dining invitation campaign style' },
  { value: 'boutique-spa-retreat', label: 'Boutique Spa Retreat', promptText: 'boutique spa retreat campaign style' },
  { value: 'premium-real-estate-showcase', label: 'Premium Real Estate Showcase', promptText: 'premium real estate showcase style' },
  { value: 'coffee-house-editorial', label: 'Coffee House Editorial', promptText: 'coffee house editorial advertisement style' },
  { value: 'wine-bar-heritage-poster', label: 'Wine Bar Heritage Poster', promptText: 'wine bar heritage poster style' },
  { value: 'fitness-club-launch', label: 'Fitness Club Launch', promptText: 'fitness club launch campaign style' },
  { value: 'fashion-boutique-campaign', label: 'Fashion Boutique Campaign', promptText: 'fashion boutique campaign style' },
  { value: 'adventure-tour-brochure', label: 'Adventure Tour Brochure', promptText: 'adventure tour brochure style' },
  { value: 'private-members-club-ad', label: 'Private Members Club Ad', promptText: 'private members club advertisement style' },
  { value: 'luxury-beach-club', label: 'Luxury Beach Club', promptText: 'luxury beach club advertisement style' },
  { value: 'torn-paper-travel-ad', label: 'Torn Paper Travel Ad', promptText: 'torn paper travel advertisement style' },
  { value: 'golden-serif-resort', label: 'Golden Serif Resort', promptText: 'golden serif resort advertisement style' },
  { value: 'vintage-coastal-flyer', label: 'Vintage Coastal Flyer', promptText: 'vintage coastal flyer style' },
  { value: 'passport-collage-promo', label: 'Passport Collage Promo', promptText: 'passport collage promotional advertisement style' },
]

export const TYPOGRAPHY_STYLE_OPTIONS: CreativeDirectionOption[] = [
  { value: 'luxury-serif-headline', label: 'Luxury serif headline', promptText: 'luxury serif headline typography' },
  { value: 'didot-bodoni', label: 'High-contrast Didot/Bodoni', promptText: 'high-contrast Didot and Bodoni inspired typography' },
  { value: 'vintage-engraved-serif', label: 'Vintage engraved serif', promptText: 'vintage engraved serif typography' },
  { value: 'tall-editorial-serif', label: 'Tall editorial serif', promptText: 'tall editorial serif typography' },
  { value: 'condensed-resort-sans', label: 'Condensed resort sans', promptText: 'condensed resort sans typography' },
  { value: 'handwritten-script-accent', label: 'Handwritten script accent', promptText: 'handwritten script accent typography' },
  { value: 'typewriter-small-text', label: 'Typewriter small text', promptText: 'typewriter small text typography' },
  { value: 'passport-stamp-lettering', label: 'Passport stamp lettering', promptText: 'passport stamp lettering' },
  { value: 'art-deco-display', label: 'Art Deco display', promptText: 'Art Deco display typography' },
  { value: 'restaurant-menu-type', label: 'Classic restaurant menu type', promptText: 'classic restaurant menu typography' },
]

export const FONT_FILL_OPTIONS: CreativeDirectionOption[] = [
  { value: 'antique-gold-foil', label: 'Antique gold foil', promptText: 'antique gold foil letter fill' },
  { value: 'burnished-bronze', label: 'Burnished bronze', promptText: 'burnished bronze letter inlay' },
  { value: 'copper-metallic', label: 'Copper metallic', promptText: 'copper metallic letter fill' },
  { value: 'brown-leather-texture', label: 'Brown leather texture', promptText: 'brown leather textured letter fill' },
  { value: 'carved-wood-inlay', label: 'Carved wood inlay', promptText: 'carved wood inlay typography' },
  { value: 'embossed-ink', label: 'Embossed ink', promptText: 'embossed ink lettering' },
  { value: 'debossed-paper', label: 'Debossed paper', promptText: 'debossed paper lettering' },
  { value: 'aged-gold-leaf', label: 'Aged gold leaf', promptText: 'aged gold leaf lettering' },
  { value: 'dark-espresso-fill', label: 'Dark espresso fill', promptText: 'dark espresso letter fill' },
  { value: 'sunlit-orange-gradient', label: 'Sunlit orange gradient', promptText: 'sunlit orange gradient letter fill' },
]

export const BACKGROUND_SCENERY_OPTIONS: CreativeDirectionOption[] = [
  { value: 'torn-parchment-paper', label: 'Torn parchment paper', promptText: 'torn parchment paper background' },
  { value: 'layered-paper-cutout', label: 'Layered paper cutout', promptText: 'layered paper cutout background' },
  { value: 'vintage-travel-map', label: 'Vintage travel map', promptText: 'vintage travel map background' },
  { value: 'passport-stamp-background', label: 'Passport stamp background', promptText: 'passport stamp background' },
  { value: 'sunset-ocean-scene', label: 'Sunset ocean scene', promptText: 'sunset ocean scenery' },
  { value: 'tropical-palm-shadows', label: 'Tropical palm shadows', promptText: 'tropical palm shadow background' },
  { value: 'beach-sand-texture', label: 'Beach sand texture', promptText: 'beach sand texture background' },
  { value: 'topographic-contour-lines', label: 'Topographic contour lines', promptText: 'topographic contour line background' },
  { value: 'aged-postcard-paper', label: 'Aged postcard paper', promptText: 'aged postcard paper background' },
  { value: 'leather-passport-cover', label: 'Leather passport cover', promptText: 'leather passport cover background' },
  { value: 'compass-navigation-elements', label: 'Compass / navigation elements', promptText: 'compass and navigation themed background' },
]

export const PAPER_EFFECT_OPTIONS: CreativeDirectionOption[] = [
  { value: 'torn-paper-edge', label: 'Torn paper edge', promptText: 'torn paper edge effect' },
  { value: 'deckled-handmade-edge', label: 'Deckled handmade edge', promptText: 'deckled handmade paper edge' },
  { value: 'layered-paper-shadow', label: 'Layered paper shadow', promptText: 'layered paper shadow effect' },
  { value: 'burnt-paper-edge', label: 'Burnt paper edge', promptText: 'burnt paper edge effect' },
  { value: 'folded-paper-crease', label: 'Folded paper crease', promptText: 'folded paper crease detail' },
  { value: 'ripped-collage-strip', label: 'Ripped collage strip', promptText: 'ripped collage strip detail' },
  { value: 'cutout-window-reveal', label: 'Cutout window reveal', promptText: 'cutout window reveal effect' },
  { value: 'taped-photo-corners', label: 'Taped photo corners', promptText: 'taped photo corner details' },
  { value: 'stamped-ink-marks', label: 'Stamped ink marks', promptText: 'stamped ink mark details' },
  { value: 'weathered-travel-journal', label: 'Weathered travel journal', promptText: 'weathered travel journal paper treatment' },
]

export const TEXTURE_STRENGTH_OPTIONS: CreativeDirectionOption[] = [
  { value: 'clean', label: 'Clean', promptText: 'clean polished finish' },
  { value: 'light-texture', label: 'Light texture', promptText: 'light tactile texture' },
  { value: 'medium-vintage-texture', label: 'Medium vintage texture', promptText: 'medium vintage texture' },
  { value: 'heavy-distressed-texture', label: 'Heavy distressed texture', promptText: 'heavy distressed texture' },
  { value: 'rough-handmade-paper', label: 'Rough handmade paper', promptText: 'rough handmade paper texture' },
  { value: 'premium-polished-ad', label: 'Premium polished ad', promptText: 'premium polished advertisement finish' },
]

export const DECORATIVE_ELEMENT_OPTIONS: CreativeDirectionOption[] = [
  { value: 'passport-stamp', label: 'Passport stamp', promptText: 'passport stamp decoration' },
  { value: 'compass-rose', label: 'Compass rose', promptText: 'compass rose icon' },
  { value: 'palm-icon', label: 'Palm icon', promptText: 'palm icon detail' },
  { value: 'sun-waves-icon', label: 'Sun and waves icon', promptText: 'sun and waves icon detail' },
  { value: 'map-pin', label: 'Map pin', promptText: 'map pin marker' },
  { value: 'flight-ticket-strip', label: 'Flight ticket strip', promptText: 'flight ticket strip detail' },
  { value: 'postmark-lines', label: 'Postmark lines', promptText: 'postmark line detail' },
  { value: 'hand-drawn-coastline', label: 'Hand-drawn coastline', promptText: 'hand-drawn coastline detail' },
  { value: 'navigation-lines', label: 'Navigation lines', promptText: 'navigation line detail' },
  { value: 'wax-seal', label: 'Wax seal', promptText: 'wax seal detail' },
  { value: 'menu-icon-badges', label: 'Menu icon badges', promptText: 'menu icon badge details' },
  { value: 'contact-card-panel', label: 'Contact card panel', promptText: 'contact card panel detail' },
]

export const COLOR_PALETTE_OPTIONS: CreativeDirectionOption[] = [
  { value: 'parchment-sepia', label: 'Parchment / sepia', promptText: 'parchment and sepia color palette' },
  { value: 'sunset-orange-bronze', label: 'Sunset orange / bronze', promptText: 'sunset orange and bronze color palette' },
  { value: 'black-leather-gold', label: 'Black leather / gold', promptText: 'black leather and gold color palette' },
  { value: 'sand-terracotta', label: 'Sand / terracotta', promptText: 'sand and terracotta color palette' },
  { value: 'coffee-brown-cream', label: 'Coffee brown / cream', promptText: 'coffee brown and cream color palette' },
  { value: 'antique-map-tones', label: 'Antique map tones', promptText: 'antique map tone color palette' },
  { value: 'palm-green-warm-beige', label: 'Palm green / warm beige', promptText: 'palm green and warm beige color palette' },
  { value: 'ocean-blue-copper', label: 'Ocean blue / copper', promptText: 'ocean blue and copper color palette' },
  { value: 'champagne-gold-ivory', label: 'Champagne gold / ivory', promptText: 'champagne gold and ivory color palette' },
]

export const CREATIVE_DIRECTION_SINGLE_GROUPS: Array<{
  key: CreativeDirectionKey
  label: string
  options: CreativeDirectionOption[]
}> = [
  { key: 'adType', label: 'Ad Type', options: AD_TYPE_OPTIONS },
  { key: 'ctaStyle', label: 'CTA Style', options: CTA_STYLE_OPTIONS },
  { key: 'informationLayout', label: 'Information Layout', options: INFORMATION_LAYOUT_OPTIONS },
  { key: 'adPreset', label: 'Ad Preset', options: AD_PRESET_OPTIONS },
  { key: 'typographyStyle', label: 'Typography Style', options: TYPOGRAPHY_STYLE_OPTIONS },
  { key: 'fontFill', label: 'Font Fill / Inlay', options: FONT_FILL_OPTIONS },
  { key: 'backgroundScenery', label: 'Background Scenery', options: BACKGROUND_SCENERY_OPTIONS },
  { key: 'paperEffect', label: 'Paper Effect', options: PAPER_EFFECT_OPTIONS },
  { key: 'textureStrength', label: 'Texture Strength', options: TEXTURE_STRENGTH_OPTIONS },
  { key: 'colorPalette', label: 'Color Palette', options: COLOR_PALETTE_OPTIONS },
]

const OPTION_LOOKUP = new Map<string, CreativeDirectionOption>(
  [
    ...AD_TYPE_OPTIONS,
    ...CTA_STYLE_OPTIONS,
    ...INFORMATION_LAYOUT_OPTIONS,
    ...AD_PRESET_OPTIONS,
    ...TYPOGRAPHY_STYLE_OPTIONS,
    ...FONT_FILL_OPTIONS,
    ...BACKGROUND_SCENERY_OPTIONS,
    ...PAPER_EFFECT_OPTIONS,
    ...TEXTURE_STRENGTH_OPTIONS,
    ...DECORATIVE_ELEMENT_OPTIONS,
    ...COLOR_PALETTE_OPTIONS,
  ].map((option) => [option.value, option]),
)

export function getCreativeDirectionOption(value: string): CreativeDirectionOption | undefined {
  return OPTION_LOOKUP.get(value)
}

export function normalizeCreativeDirection(input: Partial<CreativeDirectionState> | null | undefined): CreativeDirectionState {
  return {
    ...DEFAULT_CREATIVE_DIRECTION,
    ...input,
    decorativeElements: Array.isArray(input?.decorativeElements) ? input.decorativeElements : [],
  }
}

export function hasCreativeDirection(input: Partial<CreativeDirectionState> | null | undefined): boolean {
  const creativeDirection = normalizeCreativeDirection(input)
  return CREATIVE_DIRECTION_SINGLE_GROUPS.some((group) => Boolean(creativeDirection[group.key])) ||
    creativeDirection.decorativeElements.length > 0
}

export function buildCreativeDirectionPrompt(input: Partial<CreativeDirectionState> | null | undefined): string {
  const creativeDirection = normalizeCreativeDirection(input)
  const promptParts = CREATIVE_DIRECTION_SINGLE_GROUPS
    .map((group) => getCreativeDirectionOption(creativeDirection[group.key])?.promptText)
    .filter(Boolean)

  const decorativePromptParts = creativeDirection.decorativeElements
    .map((value) => getCreativeDirectionOption(value)?.promptText)
    .filter(Boolean)

  const allParts = [...promptParts, ...decorativePromptParts]
  if (allParts.length === 0) return ''

  return `Creative direction: ${allParts.join(', ')}.`
}

export function buildCreativeDirectionSummary(input: Partial<CreativeDirectionState> | null | undefined): string {
  const creativeDirection = normalizeCreativeDirection(input)
  const preferredValues = [
    creativeDirection.adType,
    creativeDirection.fontFill,
    creativeDirection.backgroundScenery,
    creativeDirection.adPreset,
    creativeDirection.typographyStyle,
    creativeDirection.paperEffect,
    creativeDirection.colorPalette,
  ]

  const labels = preferredValues
    .map((value) => getCreativeDirectionOption(value)?.label)
    .filter(Boolean)
    .slice(0, 3)

  if (labels.length < 3 && creativeDirection.decorativeElements.length > 0) {
    labels.push(
      ...creativeDirection.decorativeElements
        .map((value) => getCreativeDirectionOption(value)?.label)
        .filter(Boolean)
        .slice(0, 3 - labels.length),
    )
  }

  return labels.length > 0 ? labels.join(' / ') : ''
}
