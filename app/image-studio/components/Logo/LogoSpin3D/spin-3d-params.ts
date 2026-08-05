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

/**
 * The lighting rig, shared by the live preview and the export renderer.
 *
 * Declared as data rather than duplicated JSX and imperative code, because the
 * export builds its scene imperatively while the preview is declarative — and if
 * the two rigs drift, an export stops matching the thing the user approved on
 * screen. Same reason `SPIN_CAMERA_FOV` is not written twice.
 */
export interface SpinLight {
  kind: 'ambient' | 'directional'
  intensity: number
  position?: [number, number, number]
}

export const SPIN_LIGHTS: SpinLight[] = [
  { kind: 'ambient', intensity: 0.7 },
  { kind: 'directional', intensity: 1.5, position: [3, 4, 5] },
  // Rim light, so the extruded sides read against a dark backdrop as the logo turns away.
  { kind: 'directional', intensity: 0.6, position: [-4, -2, -3] },
]

export const SPIN_CAMERA_FOV = 45

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
  return rotationForTurns(axis, (elapsedSeconds * safeSpeed) / SPIN_BASE_PERIOD_SECONDS)
}

/**
 * Rotation at a given number of turns.
 *
 * The export works in turns, not seconds — it needs a whole number of
 * revolutions across the clip so the loop closes — so this is the primitive and
 * `rotationFor` is the time-based wrapper. Exposing it avoids the export having
 * to convert turns back into seconds through the base period, which put a magic
 * constant on both sides of the same equation.
 */
export function rotationForTurns(axis: SpinAxis, turns: number): Rotation {
  const safeTurns = Number.isFinite(turns) ? turns : 0
  // The live preview runs forever, so its tumble tilt can be a plain fraction of
  // the spin — nothing has to close. An export does, which is why it uses
  // rotationForAxisTurns with an independently whole tilt instead.
  return rotationForAxisTurns(axis, safeTurns, safeTurns * PREVIEW_TUMBLE_TILT_RATIO)
}

/** Preview-only tilt ratio; exports derive their tilt from `tumbleTiltTurns`. */
const PREVIEW_TUMBLE_TILT_RATIO = 0.4

/**
 * Rotation from explicit per-axis turn counts.
 *
 * Exists because tumble has two independent rotations, and an exported clip only
 * loops if BOTH land on a whole turn. Deriving the tilt as a fixed fraction of the
 * spin — the obvious approach — closes only when the spin count happens to be a
 * multiple of 1/ratio, so almost every export would snap at the seam.
 */
export function rotationForAxisTurns(axis: SpinAxis, spinTurns: number, tiltTurns: number): Rotation {
  const safeSpin = Number.isFinite(spinTurns) ? spinTurns : 0
  const safeTilt = Number.isFinite(tiltTurns) ? tiltTurns : 0
  const spinAngle = safeSpin * Math.PI * 2
  const tiltAngle = safeTilt * Math.PI * 2
  if (axis === 'x') return { x: spinAngle, y: 0, z: 0 }
  if (axis === 'tumble') return { x: tiltAngle, y: spinAngle, z: 0 }
  return { x: 0, y: spinAngle, z: 0 }
}
