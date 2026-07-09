/**
 * lib/font-loader.ts
 * Google Fonts dynamic loading for canvas text rendering
 */

// Curated fonts ideal for logos
export const LOGO_FONTS = [
  // Display / Impact
  { name: 'Bebas Neue', category: 'display', weight: '400' },
  { name: 'Anton', category: 'display', weight: '400' },
  { name: 'Oswald', category: 'display', weight: '400;700' },

  // Modern Sans-Serif
  { name: 'Montserrat', category: 'sans-serif', weight: '400;700;900' },
  { name: 'Poppins', category: 'sans-serif', weight: '400;600;700' },
  { name: 'Inter', category: 'sans-serif', weight: '400;600;700' },
  { name: 'Raleway', category: 'sans-serif', weight: '400;700' },

  // Elegant Serif
  { name: 'Playfair Display', category: 'serif', weight: '400;700' },
  { name: 'Merriweather', category: 'serif', weight: '400;700' },
  { name: 'Lora', category: 'serif', weight: '400;700' },

  // Script / Decorative
  { name: 'Pacifico', category: 'script', weight: '400' },
  { name: 'Dancing Script', category: 'script', weight: '400;700' },
  { name: 'Great Vibes', category: 'script', weight: '400' },

  // Tech / Modern
  { name: 'Orbitron', category: 'tech', weight: '400;700' },
  { name: 'Rajdhani', category: 'tech', weight: '400;700' },
] as const

export type LogoFontName = typeof LOGO_FONTS[number]['name']

// Track loaded fonts
const loadedFonts = new Set<string>()
const loadingFonts = new Map<string, Promise<boolean>>()

/**
 * Load a Google Font dynamically
 */
export async function loadGoogleFont(fontFamily: string): Promise<boolean> {
  // Already loaded
  if (loadedFonts.has(fontFamily)) {
    return true
  }

  // Currently loading - return existing promise
  if (loadingFonts.has(fontFamily)) {
    return loadingFonts.get(fontFamily)!
  }

  // Start loading
  const loadPromise = (async () => {
    try {
      // Find font config
      const fontConfig = LOGO_FONTS.find(f => f.name === fontFamily)
      const weights = fontConfig?.weight || '400;700'

      // Build Google Fonts URL
      const encodedFamily = encodeURIComponent(fontFamily)
      const fontUrl = `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${weights}&display=swap`

      // Create and append link element
      const link = document.createElement('link')
      link.href = fontUrl
      link.rel = 'stylesheet'
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)

      // Wait for fonts API to confirm load
      await document.fonts.ready

      // Verify the font is actually loaded by checking with specific size
      const fontLoaded = await document.fonts.load(`400 16px "${fontFamily}"`)
        .then(() => document.fonts.check(`16px "${fontFamily}"`))
        .catch(() => false)

      if (fontLoaded) {
        loadedFonts.add(fontFamily)
        console.log(`[FontLoader] Loaded: ${fontFamily}`)
        return true
      }

      console.warn(`[FontLoader] Failed to verify: ${fontFamily}`)
      return false
    } catch (error) {
      console.error(`[FontLoader] Error loading ${fontFamily}:`, error)
      return false
    } finally {
      loadingFonts.delete(fontFamily)
    }
  })()

  loadingFonts.set(fontFamily, loadPromise)
  return loadPromise
}

/**
 * Preload multiple fonts
 */
export async function preloadFonts(fontFamilies: string[]): Promise<void> {
  await Promise.all(fontFamilies.map(loadGoogleFont))
}

/**
 * Preload all logo fonts
 */
export async function preloadAllLogoFonts(): Promise<void> {
  await preloadFonts(LOGO_FONTS.map(f => f.name))
}

/**
 * Check if a font is ready for use
 */
export function isFontLoaded(fontFamily: string): boolean {
  return loadedFonts.has(fontFamily)
}

/**
 * Wait for a specific font to be ready before rendering
 */
export async function waitForFont(fontFamily: string, fontSize: number = 16): Promise<void> {
  await loadGoogleFont(fontFamily)
  // Extra verification for canvas rendering
  await document.fonts.load(`${fontSize}px "${fontFamily}"`)
}

/**
 * Get fonts grouped by category
 */
export function getFontsByCategory() {
  const categories: Record<string, typeof LOGO_FONTS[number][]> = {}

  for (const font of LOGO_FONTS) {
    if (!categories[font.category]) {
      categories[font.category] = []
    }
    categories[font.category].push(font)
  }

  return categories
}
