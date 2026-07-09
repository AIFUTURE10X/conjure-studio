import sharp from 'sharp'

/**
 * Dominant-color extraction for the brand kit: downsample, bucket similar
 * colors, return the top hexes (opaque pixels only).
 */

const SAMPLE_SIZE = 64
const BUCKET = 24 // channel quantization step — groups near-identical shades

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

export async function extractPalette(png: Buffer, maxColors = 6): Promise<string[]> {
  const { data, info } = await sharp(png)
    .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const counts = new Map<string, { count: number; r: number; g: number; b: number }>()
  for (let i = 0; i < data.length; i += info.channels) {
    const alpha = data[i + 3]
    if (alpha < 200) continue // skip transparent/soft-edge pixels

    const r = Math.min(255, Math.round(data[i] / BUCKET) * BUCKET)
    const g = Math.min(255, Math.round(data[i + 1] / BUCKET) * BUCKET)
    const b = Math.min(255, Math.round(data[i + 2] / BUCKET) * BUCKET)
    const key = `${r},${g},${b}`
    const entry = counts.get(key)
    if (entry) entry.count += 1
    else counts.set(key, { count: 1, r, g, b })
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, maxColors)
    .map(({ r, g, b }) => toHex(r, g, b))
}

/** Render the palette as a horizontal swatch strip PNG (hex label under each). */
export async function renderPaletteImage(colors: string[]): Promise<Buffer> {
  const swatch = 160
  const labelBand = 44
  const width = swatch * Math.max(colors.length, 1)
  const height = swatch + labelBand

  const blocks = colors
    .map((color, i) => {
      const x = i * swatch
      return `
        <rect x="${x}" y="0" width="${swatch}" height="${swatch}" fill="${color}" />
        <text x="${x + swatch / 2}" y="${swatch + 28}" text-anchor="middle"
          font-family="monospace" font-size="18" fill="#27272a">${color}</text>`
    })
    .join('')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="#ffffff" />
    ${blocks}
  </svg>`

  return sharp(Buffer.from(svg)).png().toBuffer()
}
