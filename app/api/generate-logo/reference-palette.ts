/**
 * Reference Palette Sampler
 *
 * Measures the actual colors of a reference logo image so the generation
 * prompt can state them as ground truth. Image models follow explicit color
 * words far more reliably than "copy the reference colors" — and when a
 * style description drifts from the artwork (e.g. a brief that says "gold"
 * over silver-and-rust art), the sampled values keep the render honest.
 *
 * Works on transparent ClearLogo PNGs (alpha separates letters from halo)
 * and on flat/opaque uploads (background estimated from the border ring).
 * Returns null whenever there isn't enough signal — callers treat that as
 * "no palette section" and the prompt falls back to qualitative guidance.
 */

import sharp from 'sharp'

interface Rgb {
  r: number
  g: number
  b: number
}

interface Hsl {
  h: number
  s: number
  l: number
}

const SAMPLE_EDGE = 96
const OPAQUE_ALPHA = 200
const GLOW_ALPHA_MIN = 25
const GLOW_ALPHA_MAX = 170
const MIN_SUBJECT_PIXELS = 60

const luminance = ({ r, g, b }: Rgb): number => 0.2126 * r + 0.7152 * g + 0.0722 * b

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min

  if (d === 0) return { h: 0, s: 0, l }

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60
  else if (max === gn) h = ((bn - rn) / d + 2) * 60
  else h = ((rn - gn) / d + 4) * 60

  return { h, s, l }
}

const toHex = ({ r, g, b }: Rgb): string =>
  `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()}`

function hueWord(h: number): string {
  if (h < 15) return 'red'
  if (h < 35) return 'orange'
  if (h < 50) return 'amber'
  if (h < 65) return 'yellow'
  if (h < 95) return 'olive'
  if (h < 150) return 'green'
  if (h < 190) return 'teal'
  if (h < 250) return 'blue'
  if (h < 290) return 'violet'
  if (h < 330) return 'magenta'
  return 'red'
}

/** Human color name tuned for logo metals: bone, silver, bronze, rust, gold. */
function nameColor({ h, s, l }: Hsl): string {
  if (l >= 0.93 && s <= 0.35) return 'white'
  if (l >= 0.82) {
    if (s <= 0.12) return 'silvery white'
    if (h >= 30 && h < 70) return 'pale bone white'
    if (h >= 70 && h < 160) return 'pale sage'
    return `pale ${hueWord(h)}`
  }
  if (l <= 0.07) return 'near black'
  if (l <= 0.18) {
    if (s <= 0.15) return 'charcoal'
    return h >= 15 && h < 50 ? 'near-black rusty brown' : `very dark ${hueWord(h)}`
  }
  if (s <= 0.09) return l >= 0.55 ? 'aged silver gray' : 'slate gray'

  // Warm metal band: browns, bronzes, parchments, golds. "Gold" is reserved
  // for saturated tones — desaturated pales must not reintroduce the word
  // gold into a prompt whose whole job may be steering away from it.
  if (h >= 15 && h < 50) {
    if (l < 0.28) return 'dark rusty brown'
    if (l < 0.45) return s >= 0.5 ? 'rust brown' : 'tarnished bronze'
    if (l < 0.62) return s >= 0.55 ? 'copper gold' : 'antique bronze'
    if (s < 0.45) return l >= 0.75 ? 'pale bone parchment' : 'muted parchment khaki'
    return 'champagne gold'
  }
  if (h >= 50 && h < 65) return l >= 0.6 ? 'bright gold' : 'olive gold'

  const base = hueWord(h)
  if (l < 0.3) return `dark ${base}`
  if (s < 0.35) return `muted ${base}`
  if (l > 0.7) return `light ${base}`
  return base
}

const describeColor = (rgb: Rgb): string => `${nameColor(rgbToHsl(rgb))} (${toHex(rgb)})`

const averageColor = (pixels: Rgb[]): Rgb => {
  const sum = pixels.reduce(
    (acc, p) => ({ r: acc.r + p.r, g: acc.g + p.g, b: acc.b + p.b }),
    { r: 0, g: 0, b: 0 }
  )
  const n = pixels.length
  return { r: sum.r / n, g: sum.g / n, b: sum.b / n }
}

const colorDistance = (a: Rgb, b: Rgb): number =>
  Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2)

function hueDifference(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/**
 * The lettering "mixes tones" when highlight and body read as different
 * materials (silver highlights over bronze, hue shift into rust) rather than
 * one metal shaded light-to-dark. Drives an explicit do-not-unify line.
 */
function isMultiTone(highlight: Rgb, midtone: Rgb, shadow: Rgb): boolean {
  const hi = rgbToHsl(highlight)
  const mid = rgbToHsl(midtone)
  const sh = rgbToHsl(shadow)

  const desaturatedHighlightOverColor =
    hi.s < 0.35 && hi.l > 0.72 && (mid.s > 0.3 || sh.s > 0.3)
  const hueShift =
    (hi.s >= 0.15 && mid.s >= 0.15 && hueDifference(hi.h, mid.h) > 24) ||
    (mid.s >= 0.15 && sh.s >= 0.15 && hueDifference(mid.h, sh.h) > 24)

  return desaturatedHighlightOverColor || hueShift
}

interface RawImage {
  data: Buffer
  width: number
  height: number
}

function collectPixels(image: RawImage) {
  const { data, width, height } = image
  const opaque: Rgb[] = []
  const glow: { rgb: Rgb; a: number }[] = []
  const border: Rgb[] = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const rgb = { r: data[i], g: data[i + 1], b: data[i + 2] }
      const a = data[i + 3]
      if (a >= OPAQUE_ALPHA) {
        opaque.push(rgb)
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) border.push(rgb)
      } else if (a >= GLOW_ALPHA_MIN && a < GLOW_ALPHA_MAX) {
        glow.push({ rgb, a })
      }
    }
  }

  return { opaque, glow, border, total: width * height }
}

export async function sampleReferencePalette(referenceBase64: string): Promise<string | null> {
  try {
    const buffer = Buffer.from(referenceBase64, 'base64')
    const { data, info } = await sharp(buffer)
      .ensureAlpha()
      .resize(SAMPLE_EDGE, SAMPLE_EDGE, { fit: 'inside', withoutEnlargement: true })
      .raw()
      .toBuffer({ resolveWithObject: true })

    const { opaque, glow, border, total } = collectPixels({
      data,
      width: info.width,
      height: info.height,
    })

    // Opaque uploads (screenshots, JPEGs): no alpha to lean on, so estimate
    // the backdrop from the border ring and keep only pixels that differ.
    const isFlatImage = total - opaque.length < total * 0.02
    let subject = opaque
    if (isFlatImage && border.length > 0) {
      const background = averageColor(border)
      subject = opaque.filter((p) => colorDistance(p, background) > 60)
    }

    if (subject.length < MIN_SUBJECT_PIXELS) return null

    const byLuminance = [...subject].sort((a, b) => luminance(a) - luminance(b))
    const n = byLuminance.length
    const slice = (from: number, to: number) =>
      byLuminance.slice(Math.floor(n * from), Math.max(Math.floor(n * to), Math.floor(n * from) + 1))

    const shadowAvg = averageColor(slice(0, 0.15))
    const midtoneAvg = averageColor(slice(0.35, 0.75))
    const highlightAvg = averageColor(slice(0.88, 1))

    const lines = [
      'SAMPLED REFERENCE PALETTE (measured from the attached image — ground truth for color):',
      `- Letter highlights: ${describeColor(highlightAvg)}`,
      `- Letter midtones: ${describeColor(midtoneAvg)}`,
      `- Letter shadows/recesses: ${describeColor(shadowAvg)}`,
    ]

    // On transparent art the semi-transparent ring IS the glow/halo.
    if (!isFlatImage && glow.length >= Math.max(30, total * 0.01)) {
      const weighted = glow.reduce(
        (acc, { rgb, a }) => ({
          r: acc.r + rgb.r * a,
          g: acc.g + rgb.g * a,
          b: acc.b + rgb.b * a,
          w: acc.w + a,
        }),
        { r: 0, g: 0, b: 0, w: 0 }
      )
      const glowColor = { r: weighted.r / weighted.w, g: weighted.g / weighted.w, b: weighted.b / weighted.w }
      const meanAlpha = weighted.w / glow.length
      const strength = meanAlpha < 70 ? 'faint' : meanAlpha < 130 ? 'soft' : 'strong'
      lines.push(
        `- Outer glow around the letters: ${strength} ${describeColor(glowColor)} — keep this exact hue and keep it ${strength}`
      )
    }

    if (isMultiTone(highlightAvg, midtoneAvg, shadowAvg)) {
      lines.push(
        '- The lettering mixes distinct tones (different materials, not one shaded metal) — reproduce the mix zone by zone; do not average it into a single metal color'
      )
    }

    lines.push('Use these exact measured tones. Do not repaint the lettering in a different single metal tone.')
    return lines.join('\n')
  } catch (error) {
    console.warn('[Logo API] Reference palette sampling failed (continuing without it):', error)
    return null
  }
}
