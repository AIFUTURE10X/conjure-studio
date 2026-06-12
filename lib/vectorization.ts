/**
 * lib/vectorization.ts
 * PNG to SVG vectorization using @neplex/vectorizer
 */

import sharp from 'sharp'

// Dynamic import to avoid Turbopack ESM issues
let vectorizerModule: any = null
async function getVectorizer() {
  if (!vectorizerModule) {
    vectorizerModule = await import('@neplex/vectorizer')
  }
  return vectorizerModule
}

export type VectorizationMode = 'auto' | 'color' | 'monochrome'

export interface VectorizationOptions {
  mode?: VectorizationMode
  colorCount?: number
  filterSpeckle?: number
  pathPrecision?: number
}

/**
 * Detect if image is primarily monochrome or color
 */
async function detectImageType(imageBuffer: Buffer): Promise<'color' | 'monochrome'> {
  try {
    const { data } = await sharp(imageBuffer)
      .resize(100, 100, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true })

    const pixels = new Uint8ClampedArray(data)
    let colorVariance = 0
    let sampleCount = 0

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      const a = pixels[i + 3]

      // Skip transparent pixels
      if (a < 128) continue

      // Calculate color variance (difference between RGB channels)
      const maxC = Math.max(r, g, b)
      const minC = Math.min(r, g, b)
      colorVariance += (maxC - minC)
      sampleCount++
    }

    if (sampleCount === 0) return 'color'

    const avgVariance = colorVariance / sampleCount
    console.log('[Vectorize] Color variance:', avgVariance)

    // Low variance = monochrome (grayscale or single color)
    return avgVariance < 25 ? 'monochrome' : 'color'
  } catch (error) {
    console.error('[Vectorize] Detection error:', error)
    return 'color' // Default to color on error
  }
}

/**
 * Preprocess image with Sharp for optimal vectorization
 */
async function preprocessImage(
  imageBuffer: Buffer,
  mode: 'color' | 'monochrome'
): Promise<Buffer> {
  let pipeline = sharp(imageBuffer).ensureAlpha()

  // For monochrome, increase contrast for cleaner edges
  if (mode === 'monochrome') {
    pipeline = pipeline
      .normalize() // Stretch histogram for better contrast
  }

  // Output as PNG for consistent input
  return pipeline.png().toBuffer()
}

/**
 * Convert a PNG logo to SVG vector format
 *
 * @param imageBuffer - PNG image buffer (can be base64 string or Buffer)
 * @param options - Vectorization options
 * @returns SVG string
 */
export async function vectorizeLogo(
  imageBuffer: Buffer | string,
  options: VectorizationOptions = {}
): Promise<string> {
  const {
    mode = 'auto',
    colorCount = 16,
    filterSpeckle = 4,
    pathPrecision = 5,
  } = options

  // Convert base64 string to buffer if needed
  const buffer = typeof imageBuffer === 'string'
    ? Buffer.from(imageBuffer, 'base64')
    : imageBuffer

  // Auto-detect mode if needed
  const effectiveMode: 'color' | 'monochrome' = mode === 'auto'
    ? await detectImageType(buffer)
    : mode as 'color' | 'monochrome'

  console.log('[Vectorize] Using mode:', effectiveMode)

  // Preprocess with Sharp
  const processedBuffer = await preprocessImage(buffer, effectiveMode)

  // Calculate color precision from colorCount
  // colorPrecision is 1-8, representing 2^n colors
  const colorPrecision = Math.min(8, Math.max(1, Math.ceil(Math.log2(colorCount))))

  console.log('[Vectorize] Settings:', {
    colorPrecision,
    filterSpeckle,
    pathPrecision,
    colorCount,
  })

  // Vectorize using @neplex/vectorizer (dynamic import)
  const { vectorize, ColorMode, Hierarchical, PathSimplifyMode } = await getVectorizer()
  const svg = await vectorize(processedBuffer, {
    colorMode: effectiveMode === 'monochrome' ? ColorMode.Binary : ColorMode.Color,
    colorPrecision,
    filterSpeckle,
    spliceThreshold: 45,
    cornerThreshold: 60,
    hierarchical: Hierarchical.Stacked,
    mode: PathSimplifyMode.Spline,
    layerDifference: effectiveMode === 'monochrome' ? 10 : 5,
    lengthThreshold: 5,
    maxIterations: 2,
    pathPrecision,
  })

  console.log('[Vectorize] SVG generated, length:', svg.length)

  return svg
}

/**
 * Get recommended settings based on logo type
 */
export function getRecommendedSettings(logoType: 'flat' | 'gradient' | 'detailed' | 'text'): VectorizationOptions {
  switch (logoType) {
    case 'flat':
      return { colorCount: 8, filterSpeckle: 4, pathPrecision: 4 }
    case 'gradient':
      return { colorCount: 24, filterSpeckle: 2, pathPrecision: 6 }
    case 'detailed':
      return { colorCount: 32, filterSpeckle: 1, pathPrecision: 6 }
    case 'text':
      return { colorCount: 4, filterSpeckle: 2, pathPrecision: 5, mode: 'monochrome' }
    default:
      return { colorCount: 16, filterSpeckle: 4, pathPrecision: 5 }
  }
}

/**
 * Remove background paths from SVG
 * The vectorizer typically creates a large rectangle path for the background.
 * This function identifies and removes that path to preserve transparency.
 */
export function removeBackgroundFromSvg(svgString: string): string {
  // Extract viewBox dimensions
  const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/)
  if (!viewBoxMatch) {
    console.log('[Vectorize] No viewBox found, returning SVG as-is')
    return svgString
  }

  const viewBoxParts = viewBoxMatch[1].split(/\s+/).map(Number)
  const [, , svgWidth, svgHeight] = viewBoxParts

  // Find all path elements
  const pathRegex = /<path[^>]*d="([^"]*)"[^>]*(?:fill="([^"]*)")?[^>]*\/>/g
  const paths: { full: string; d: string; fill: string; index: number }[] = []
  let match

  while ((match = pathRegex.exec(svgString)) !== null) {
    // Extract fill from the path tag (may be before or after d attribute)
    const fillMatch = match[0].match(/fill="([^"]*)"/)
    paths.push({
      full: match[0],
      d: match[1],
      fill: fillMatch ? fillMatch[1] : '',
      index: match.index
    })
  }

  if (paths.length === 0) {
    console.log('[Vectorize] No paths found')
    return svgString
  }

  // Analyze the first path (usually the background)
  // Background paths typically: start at 0,0 and cover full dimensions
  const firstPath = paths[0]
  const pathD = firstPath.d

  // Check if this looks like a background rectangle
  // Common patterns: M0 0h{width}v{height}H0z or M0 0L{width} 0L{width} {height}L0 {height}z
  const isLikelyBackground = isBackgroundPath(pathD, svgWidth, svgHeight)

  if (isLikelyBackground) {
    console.log('[Vectorize] Removing background path with fill:', firstPath.fill)
    // Remove the first path (background)
    return svgString.replace(firstPath.full, '')
  }

  // Alternative: check if any path has white/near-white fill and covers most of the area
  for (const path of paths) {
    if (isWhiteFill(path.fill) && isBackgroundPath(path.d, svgWidth, svgHeight)) {
      console.log('[Vectorize] Removing white background path')
      return svgString.replace(path.full, '')
    }
  }

  console.log('[Vectorize] No background path detected')
  return svgString
}

/**
 * Check if a path appears to be a background rectangle
 */
function isBackgroundPath(pathD: string, svgWidth: number, svgHeight: number): boolean {
  // Parse path commands - looking for rectangle patterns
  // Pattern 1: M0 0h{w}v{h}H0z (horizontal/vertical lines)
  // Pattern 2: M0 0L{w} 0L{w} {h}L0 {h}z (line commands)
  // Pattern 3: M0,0 H{w} V{h} H0 Z

  // Normalize path: remove commas, extra spaces
  const normalized = pathD.replace(/,/g, ' ').replace(/\s+/g, ' ').trim()

  // Check for rectangle starting at origin
  const startsAtOrigin = /^M\s*0\s+0/i.test(normalized)
  if (!startsAtOrigin) return false

  // Extract all numbers from the path
  const numbers = normalized.match(/-?\d+\.?\d*/g)?.map(Number) || []

  // Check if the path dimensions roughly match SVG dimensions (within 5%)
  const tolerance = 0.05
  const hasWidth = numbers.some(n => Math.abs(n - svgWidth) / svgWidth < tolerance)
  const hasHeight = numbers.some(n => Math.abs(n - svgHeight) / svgHeight < tolerance)

  // A background rectangle should contain both width and height dimensions
  return hasWidth && hasHeight
}

/**
 * Check if a fill color is white or near-white
 */
function isWhiteFill(fill: string): boolean {
  if (!fill) return false

  // Check common white values
  if (fill === '#fff' || fill === '#ffffff' || fill === 'white') return true
  if (fill === 'rgb(255,255,255)' || fill === 'rgb(255, 255, 255)') return true

  // Check hex colors close to white
  const hexMatch = fill.match(/^#([0-9a-f]{6})$/i)
  if (hexMatch) {
    const r = parseInt(hexMatch[1].slice(0, 2), 16)
    const g = parseInt(hexMatch[1].slice(2, 4), 16)
    const b = parseInt(hexMatch[1].slice(4, 6), 16)
    // Near-white: all channels > 240
    return r > 240 && g > 240 && b > 240
  }

  return false
}
