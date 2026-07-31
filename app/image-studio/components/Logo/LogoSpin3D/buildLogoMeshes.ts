import { ExtrudeGeometry, type Shape } from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { extrudeParamsFor, type SpinDepthLevel } from './spin-3d-params'

/**
 * Turn vectorized logo SVG into extruded geometry.
 *
 * Deterministic: every shape comes from a path the vectorizer already produced,
 * so there is nothing inferred and nothing to hallucinate — unlike an
 * image-to-3D model, the silhouette and the letterform edges are exact.
 *
 * Kept out of the scene component so the numeric decisions stay in
 * `spin-3d-params.ts` (executed by scripts/check-logo-3d-extrude.cjs) and this
 * file only does the three-specific work that needs a real library.
 */

export interface LogoMesh {
  geometry: ExtrudeGeometry
  /** The path's own fill, so a multi-colour logo keeps its colours (AC-6). */
  color: string
}

export interface LogoMeshBuild {
  meshes: LogoMesh[]
  /** Uniform scale bringing the logo's longest side to 1 model unit. */
  scale: number
  /** Centre of the logo in SVG units, so the group can be recentred on the origin. */
  center: { x: number; y: number }
  /** Extrusion depth in SVG units, so the caller can centre the solid on Z too. */
  depth: number
  /** Logo bounds in SVG units (multiply by `scale` for model units), so the camera can fit the real solid, not an assumed unit square. */
  size: { x: number; y: number }
}

/** XY bounds across every shape, including hole contours. */
function measureShapes(shapes: Shape[]): { minX: number; minY: number; maxX: number; maxY: number } | null {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const shape of shapes) {
    const contours = [shape.getPoints(12), ...shape.holes.map((hole) => hole.getPoints(12))]
    for (const points of contours) {
      for (const point of points) {
        if (point.x < minX) minX = point.x
        if (point.x > maxX) maxX = point.x
        if (point.y < minY) minY = point.y
        if (point.y > maxY) maxY = point.y
      }
    }
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null
  return { minX, minY, maxX, maxY }
}

/**
 * Build one mesh per SVG path.
 *
 * Returns an empty `meshes` array when the SVG yields nothing extrudable, which
 * the caller turns into AC-9's inline error rather than an empty canvas.
 *
 * Depth is scaled into SVG units before extruding (`depth * longestSide`) so the
 * normalized values in spin-3d-params stay meaningful across logos whose
 * viewBoxes differ by orders of magnitude — a fixed 0.18 would be invisible on a
 * 1024-unit viewBox and absurd on a 1-unit one.
 */
export function buildLogoMeshes(
  svg: string,
  level: SpinDepthLevel,
  bevelEnabled: boolean,
): LogoMeshBuild {
  const { paths } = new SVGLoader().parse(svg)

  const perPath: Array<{ shapes: Shape[]; color: string }> = []
  const allShapes: Shape[] = []

  for (const path of paths) {
    // `true` treats subpaths as holes rather than separate solids, which is what
    // keeps counters (the middle of an O) open instead of filled.
    const shapes = path.toShapes(true)
    if (shapes.length === 0) continue
    const color = path.color?.getStyle?.() ?? '#d4d4d8'
    perPath.push({ shapes, color })
    allShapes.push(...shapes)
  }

  const bounds = measureShapes(allShapes)
  if (!bounds || perPath.length === 0) {
    // Logged, not just surfaced to the user: this is a 200 OK from the vectorizer
    // that happens to contain nothing extrudable. Without a log line, a vectorizer
    // regression producing empty output across many logos would show up only as
    // user reports, with no signal to find it by.
    console.error('[logo-3d] Vectorized SVG contained no extrudable shapes', {
      svgLength: svg.length,
      parsedPaths: paths.length,
      shapesFound: allShapes.length,
    })
    return { meshes: [], scale: 1, center: { x: 0, y: 0 }, depth: 0, size: { x: 0, y: 0 } }
  }

  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY
  const longestSide = Math.max(width, height)
  if (!(longestSide > 0)) {
    return { meshes: [], scale: 1, center: { x: 0, y: 0 }, depth: 0, size: { x: 0, y: 0 } }
  }

  const params = extrudeParamsFor(level, bevelEnabled)
  const settings = {
    depth: params.depth * longestSide,
    bevelEnabled: params.bevelEnabled,
    bevelThickness: params.bevelThickness * longestSide,
    bevelSize: params.bevelSize * longestSide,
    bevelSegments: params.bevelSegments,
    curveSegments: 12,
  }

  const meshes: LogoMesh[] = []
  for (const { shapes, color } of perPath) {
    const geometry = new ExtrudeGeometry(shapes, settings)
    geometry.computeVertexNormals()
    meshes.push({ geometry, color })
  }

  return {
    meshes,
    scale: 1 / longestSide,
    center: {
      x: bounds.minX + width / 2,
      y: bounds.minY + height / 2,
    },
    depth: settings.depth,
    size: { x: width, y: height },
  }
}

/** Release GPU buffers when params change or the panel closes. */
export function disposeLogoMeshes(build: LogoMeshBuild | null): void {
  if (!build) return
  for (const mesh of build.meshes) mesh.geometry.dispose()
}
