/**
 * Pure geometry/material/motion parameters for the 3D logo spin.
 *
 * Deliberately import-free so `scripts/check-logo-3d-extrude.cjs` can transpile
 * and EXECUTE it headlessly — the scene itself needs a WebGL context and cannot
 * be run in CI, so every decision worth pinning lives here rather than inline in
 * the component.
 *
 * All lengths are in normalized model units: the scene scales each logo so its
 * longest side is 1, which makes a single depth table look consistent across
 * logos of wildly different SVG viewBoxes.
 */

/** Mirrors DepthLevel in components/Logo/DepthSlider.tsx so the prompt-based 3D controls and real geometry share one vocabulary. */
export type SpinDepthLevel = 'flat' | 'subtle' | 'medium' | 'deep' | 'extreme'
export type SpinMaterial = 'matte' | 'metallic' | 'glossy'
export type SpinAxis = 'y' | 'x' | 'tumble'

export interface ExtrudeParams {
  depth: number
  bevelEnabled: boolean
  bevelThickness: number
  bevelSize: number
  bevelSegments: number
}

/**
 * Extrusion depth per preset.
 *
 * `flat` is 0.02, NOT 0 (AC-4): a zero-depth ExtrudeGeometry produces degenerate
 * side walls that z-fight and vanish edge-on, so "flat" means "a thin plate",
 * not "no geometry". Every value is distinct and positive so stepping through the
 * presets is visible.
 */
export const SPIN_DEPTHS: Record<SpinDepthLevel, number> = {
  flat: 0.02,
  subtle: 0.08,
  medium: 0.18,
  deep: 0.32,
  extreme: 0.5,
}

/** Preset order, matching DEPTH_PRESETS in DepthSlider.tsx. */
export const SPIN_DEPTH_LEVELS: SpinDepthLevel[] = ['flat', 'subtle', 'medium', 'deep', 'extreme']

/** The 0–100 slider positions DEPTH_PRESETS uses, so both surfaces agree. */
const DEPTH_AMOUNTS: Array<{ level: SpinDepthLevel; amount: number }> = [
  { level: 'flat', amount: 0 },
  { level: 'subtle', amount: 25 },
  { level: 'medium', amount: 50 },
  { level: 'deep', amount: 75 },
  { level: 'extreme', amount: 100 },
]

/** Nearest preset for a 0–100 depth amount, so the existing slider can drive this. */
export function depthLevelFromAmount(amount: number): SpinDepthLevel {
  const clamped = Math.min(100, Math.max(0, Number.isFinite(amount) ? amount : 0))
  return DEPTH_AMOUNTS.reduce((best, entry) => (
    Math.abs(entry.amount - clamped) < Math.abs(best.amount - clamped) ? entry : best
  )).level
}

/**
 * ExtrudeGeometry settings for a preset.
 *
 * The bevel is capped rather than scaled straight off the depth: on a thin plate
 * a bevel larger than half the depth eats through the face and the letterforms
 * lose their edges, which is most visible on `flat`.
 */
export function extrudeParamsFor(level: SpinDepthLevel, bevelEnabled: boolean): ExtrudeParams {
  const depth = SPIN_DEPTHS[level] ?? SPIN_DEPTHS.medium
  if (!bevelEnabled) {
    return { depth, bevelEnabled: false, bevelThickness: 0, bevelSize: 0, bevelSegments: 0 }
  }
  const bevel = Math.min(depth * 0.15, 0.02)
  return { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2 }
}

/**
 * Cheap pre-flight for AC-9: does this SVG contain anything extrudable at all?
 *
 * Vectorizing a photo-like logo can return a well-formed SVG with no `<path>` in
 * it (background-only, or everything filtered as speckle). Catching that here
 * gives a clear inline error instead of an empty canvas the user has to interpret.
 * A `fill="none"` path draws no solid either, so it does not count.
 *
 * This is a fast reject, not a parser — the authoritative check is whether
 * SVGLoader actually yields shapes, which needs three and happens in the scene.
 */
export function svgLooksDrawable(svg: string): boolean {
  if (typeof svg !== 'string' || svg.trim() === '') return false
  const pathTags = svg.match(/<path\b[^>]*>/gi)
  if (!pathTags) return false
  return pathTags.some((tag) => !/fill\s*=\s*(['"])\s*none\s*\1/i.test(tag))
}

export interface MaterialParams {
  roughness: number
  metalness: number
}

export const SPIN_MATERIALS: Record<SpinMaterial, MaterialParams> = {
  matte: { roughness: 0.9, metalness: 0 },
  metallic: { roughness: 0.25, metalness: 1 },
  glossy: { roughness: 0.08, metalness: 0.15 },
}

export function materialParamsFor(material: SpinMaterial): MaterialParams {
  return SPIN_MATERIALS[material] ?? SPIN_MATERIALS.matte
}

/** Seconds for one full revolution at speed 1. */
export const SPIN_BASE_PERIOD_SECONDS = 6

export interface Rotation {
  x: number
  y: number
  z: number
}

/**
 * Rotation at a point in time.
 *
 * Driven from elapsed time rather than accumulated per-frame deltas so the motion
 * is frame-rate independent — a 30fps machine and a 144fps one show the same
 * orientation at the same moment, and the export issue that follows this one can
 * sample exact angles without re-deriving them.
 *
 * `tumble` deliberately uses an irrational-ish ratio (0.4) on X so the two axes
 * do not resolve into a short repeating loop.
 */
export function rotationFor(axis: SpinAxis, elapsedSeconds: number, speed: number): Rotation {
  const safeSpeed = Number.isFinite(speed) && speed > 0 ? speed : 1
  const turns = (elapsedSeconds * safeSpeed) / SPIN_BASE_PERIOD_SECONDS
  const angle = turns * Math.PI * 2
  if (axis === 'x') return { x: angle, y: 0, z: 0 }
  if (axis === 'tumble') return { x: angle * 0.4, y: angle, z: 0 }
  return { x: 0, y: angle, z: 0 }
}
