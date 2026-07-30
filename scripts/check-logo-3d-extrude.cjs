const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

/**
 * Source with comments stripped, for the few assertions that must stay
 * source-level.
 *
 * Matching raw source lets a commented-out call satisfy a check — the dead-code
 * trap CLAUDE.md warns about, which the video-history check was actually caught
 * by. Anything asserted against source goes through here.
 */
const readCode = (relativePath) => read(relativePath)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/.*$/gm, '$1')

const PARAMS_PATH = 'app/image-studio/components/Logo/LogoSpin3D/spin-3d-params.ts'
const SCENE_PATH = 'app/image-studio/components/Logo/LogoSpin3D/LogoSpinScene.tsx'
const BUILDER_PATH = 'app/image-studio/components/Logo/LogoSpin3D/buildLogoMeshes.ts'

/**
 * Load and EXECUTE the real parameter module.
 *
 * The scene needs a WebGL context and cannot run in CI, so the decisions worth
 * pinning were extracted into this import-free module. `require` deliberately
 * throws rather than stubbing: if someone later pulls three (or anything else)
 * into it, this fails loudly instead of silently degrading to a source-level
 * match.
 *
 * Note the precise guarantee — an import the module never *uses* is elided by the
 * transpiler and slips through, which is harmless (an elided import cannot affect
 * behavior and does not cost executability). What is caught is any import whose
 * bindings are actually used, which is the case that would break this check.
 */
function loadParamsModule() {
  const { outputText } = ts.transpileModule(read(PARAMS_PATH), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: PARAMS_PATH,
  })
  const mod = { exports: {} }
  const noImports = (id) => {
    throw new Error(`${PARAMS_PATH} must stay import-free so this check can execute it; got: ${id}`)
  }
  new Function('exports', 'require', 'module', '__filename', '__dirname', outputText)(
    mod.exports,
    noImports,
    mod,
    PARAMS_PATH,
    path.dirname(PARAMS_PATH),
  )
  return mod.exports
}

let params
try {
  params = loadParamsModule()
} catch (error) {
  // Reported here rather than crashing with a raw stack: the usual cause is a new
  // import in the params module, and the fix is to move that code elsewhere.
  console.error('Logo 3D extrude checks failed: could not execute the params module')
  console.error(`  ${error && error.message}`)
  console.error(`  ${PARAMS_PATH} must stay dependency-free so CI can run these assertions headlessly.`)
  process.exit(1)
}
const {
  SPIN_DEPTHS, SPIN_DEPTH_LEVELS, SPIN_MATERIALS,
  extrudeParamsFor, depthLevelFromAmount, materialParamsFor, rotationFor, svgLooksDrawable,
  SPIN_BASE_PERIOD_SECONDS,
} = params

const near = (a, b, tolerance = 1e-9) => Math.abs(a - b) < tolerance

const checks = [
  {
    name: 'depth — all five presets are exported',
    pass: () => {
      const want = ['flat', 'subtle', 'medium', 'deep', 'extreme']
      const got = SPIN_DEPTH_LEVELS
      if (JSON.stringify(got) !== JSON.stringify(want)) {
        console.error(`    expected: ${JSON.stringify(want)}`)
        console.error(`    received: ${JSON.stringify(got)}`)
        return false
      }
      return true
    },
  },
  {
    // AC-4: a zero-depth extrude produces degenerate side walls that z-fight and
    // disappear edge-on. "Flat" must still be a thin plate.
    name: 'depth — flat is positive, not degenerate zero-thickness',
    pass: () => {
      const { depth } = extrudeParamsFor('flat', false)
      if (!(depth > 0)) {
        console.error('    expected: flat depth > 0 (a thin plate, not zero geometry)')
        console.error(`    received: ${depth}`)
        return false
      }
      return true
    },
  },
  {
    name: 'depth — every preset is positive and strictly deeper than the last',
    pass: () => {
      let previous = 0
      for (const level of SPIN_DEPTH_LEVELS) {
        const { depth } = extrudeParamsFor(level, false)
        if (!(depth > 0)) {
          console.error(`    ${level}: expected depth > 0, received ${depth}`)
          return false
        }
        if (!(depth > previous)) {
          console.error(`    ${level}: expected depth > previous (${previous}), received ${depth}`)
          console.error('    presets must be visibly distinct when stepped through')
          return false
        }
        previous = depth
      }
      return true
    },
  },
  {
    name: 'depth — an unknown level falls back rather than producing undefined geometry',
    pass: () => {
      const { depth } = extrudeParamsFor('nonsense', false)
      if (!(typeof depth === 'number' && depth > 0)) {
        console.error(`    expected a positive numeric fallback depth, received ${JSON.stringify(depth)}`)
        return false
      }
      return true
    },
  },
  {
    name: 'bevel — disabled means no bevel at all',
    pass: () => {
      const got = extrudeParamsFor('medium', false)
      const ok = got.bevelEnabled === false && got.bevelThickness === 0 && got.bevelSize === 0
      if (!ok) {
        console.error(`    expected bevelEnabled false with zero thickness/size, received ${JSON.stringify(got)}`)
        return false
      }
      return true
    },
  },
  {
    // A bevel wider than half the depth eats through the face; worst on `flat`.
    name: 'bevel — never exceeds half the extrusion depth on any preset',
    pass: () => SPIN_DEPTH_LEVELS.every((level) => {
      const { depth, bevelSize, bevelThickness } = extrudeParamsFor(level, true)
      const limit = depth / 2
      if (!(bevelSize > 0 && bevelSize < limit && bevelThickness < limit)) {
        console.error(`    ${level}: depth ${depth}, bevelSize ${bevelSize}, bevelThickness ${bevelThickness}`)
        console.error(`    expected 0 < bevel < ${limit}`)
        return false
      }
      return true
    }),
  },
  {
    name: 'depth amount — the 0-100 slider positions map to the matching presets',
    pass: () => {
      const cases = [[0, 'flat'], [25, 'subtle'], [50, 'medium'], [75, 'deep'], [100, 'extreme'],
        [12, 'flat'], [13, 'subtle'], [90, 'extreme'], [-40, 'flat'], [400, 'extreme']]
      return cases.every(([amount, want]) => {
        const got = depthLevelFromAmount(amount)
        if (got !== want) {
          console.error(`    amount ${amount}: expected ${want}, received ${got}`)
          return false
        }
        return true
      })
    },
  },
  {
    // AC-9's fast reject. Vectorizing a photographic logo can return well-formed
    // SVG with nothing solid in it; catching that yields a sentence instead of an
    // empty canvas the user has to interpret.
    name: 'drawable — SVGs with nothing extrudable are rejected before the loader sees them',
    pass: () => {
      const cases = [
        ['<svg><path d="M0 0h10v10H0z"/></svg>', true, 'a plain filled path'],
        ['<svg><path fill="#ff0000" d="M0 0h10v10H0z"/></svg>', true, 'an explicitly filled path'],
        ['<svg><path fill="none" d="M0 0h10v10H0z"/></svg>', false, 'only an unfilled outline'],
        ["<svg><path fill='none' d='M0 0h10'/></svg>", false, 'unfilled with single quotes'],
        ['<svg><rect width="10" height="10"/></svg>', false, 'a rect but no path'],
        ['<svg></svg>', false, 'an empty svg'],
        ['', false, 'an empty string'],
        ['   ', false, 'whitespace only'],
        ['<svg><path fill="none" d="M0 0"/><path fill="#0f0" d="M1 1h2v2H1z"/></svg>', true, 'one unfilled plus one filled'],
      ]
      return cases.every(([svg, want, label]) => {
        const got = svgLooksDrawable(svg)
        if (got !== want) {
          console.error(`    ${label}: expected ${want}, received ${got}`)
          return false
        }
        return true
      })
    },
  },
  {
    name: 'material — the three presets are distinct in roughness and metalness',
    pass: () => {
      const want = ['matte', 'metallic', 'glossy']
      if (want.some((key) => !SPIN_MATERIALS[key])) {
        console.error(`    expected presets ${JSON.stringify(want)}, received ${JSON.stringify(Object.keys(SPIN_MATERIALS))}`)
        return false
      }
      const signatures = want.map((key) => {
        const { roughness, metalness } = materialParamsFor(key)
        return `${roughness}|${metalness}`
      })
      if (new Set(signatures).size !== want.length) {
        console.error(`    expected three visually distinct materials, received ${JSON.stringify(signatures)}`)
        return false
      }
      return want.every((key) => {
        const { roughness, metalness } = materialParamsFor(key)
        const inRange = roughness >= 0 && roughness <= 1 && metalness >= 0 && metalness <= 1
        if (!inRange) console.error(`    ${key}: roughness/metalness must be within 0..1, received ${roughness}/${metalness}`)
        return inRange
      })
    },
  },
  {
    name: 'material — an unknown material falls back instead of yielding undefined',
    pass: () => {
      const got = materialParamsFor('holographic')
      return got && typeof got.roughness === 'number' && typeof got.metalness === 'number'
    },
  },
  {
    name: 'spin — one base period is exactly one full turn at speed 1',
    pass: () => {
      const { y } = rotationFor('y', SPIN_BASE_PERIOD_SECONDS, 1)
      if (!near(y, Math.PI * 2)) {
        console.error(`    expected: ${Math.PI * 2} (one full turn)`)
        console.error(`    received: ${y}`)
        return false
      }
      return true
    },
  },
  {
    // Frame-rate independence is the point of deriving from elapsed time rather
    // than accumulating per-frame deltas.
    name: 'spin — rotation depends only on elapsed time, not on how it is sampled',
    pass: () => {
      const once = rotationFor('y', 3, 1)
      const sampledFinely = rotationFor('y', 3, 1)
      const half = rotationFor('y', 1.5, 1)
      if (!near(once.y, sampledFinely.y) || !near(half.y * 2, once.y)) {
        console.error(`    expected rotation at 3s to be exactly twice that at 1.5s`)
        console.error(`    received: 1.5s=${half.y}, 3s=${once.y}`)
        return false
      }
      return true
    },
  },
  {
    name: 'spin — speed scales the rotation linearly',
    pass: () => {
      const base = rotationFor('y', 2, 1)
      const double = rotationFor('y', 2, 2)
      return near(double.y, base.y * 2)
    },
  },
  {
    name: 'spin — a zero or invalid speed does not freeze or NaN the scene',
    pass: () => {
      for (const speed of [0, -1, NaN, Infinity]) {
        const { y } = rotationFor('y', 3, speed)
        if (!Number.isFinite(y) || y <= 0) {
          console.error(`    speed ${speed}: expected a finite positive rotation fallback, received ${y}`)
          return false
        }
      }
      return true
    },
  },
  {
    name: 'spin — each axis drives the component it claims',
    pass: () => {
      const y = rotationFor('y', 3, 1)
      const x = rotationFor('x', 3, 1)
      const tumble = rotationFor('tumble', 3, 1)
      if (!(y.y > 0 && y.x === 0)) { console.error(`    y axis should rotate only Y, received ${JSON.stringify(y)}`); return false }
      if (!(x.x > 0 && x.y === 0)) { console.error(`    x axis should rotate only X, received ${JSON.stringify(x)}`); return false }
      if (!(tumble.x > 0 && tumble.y > 0)) { console.error(`    tumble should rotate both, received ${JSON.stringify(tumble)}`); return false }
      if (near(tumble.x, tumble.y)) { console.error('    tumble axes must differ or it degenerates into a single-axis spin'); return false }
      return true
    },
  },
  {
    // Source-level because the scene needs a WebGL context. Read comment-stripped
    // so a commented-out call cannot satisfy it.
    name: 'wiring — geometry, material and spin all come from the executed params',
    pass: () => {
      const builder = readCode(BUILDER_PATH)
      const scene = readCode(SCENE_PATH)
      const usesExtrude = /extrudeParamsFor\(/.test(builder)
      const usesMaterial = /materialParamsFor\(/.test(scene)
      const usesRotation = /rotationFor\(/.test(scene)
      // The depth table is expressed in normalized units, so the builder has to
      // scale it by the logo's own size or a 0.18 depth is invisible on a
      // 1024-unit viewBox. Assert the multiply rather than just the call.
      const scalesDepth = /params\.depth \* longestSide/.test(builder)
      if (!usesExtrude) console.error(`    ${BUILDER_PATH} does not call extrudeParamsFor — depth presets are not driving geometry`)
      if (!usesMaterial) console.error(`    ${SCENE_PATH} does not call materialParamsFor`)
      if (!usesRotation) console.error(`    ${SCENE_PATH} does not call rotationFor — the spin is not the pinned, frame-rate-independent one`)
      if (!scalesDepth) console.error('    the builder does not scale depth into SVG units; extrusion will not match the preset')
      return usesExtrude && usesMaterial && usesRotation && scalesDepth
    },
  },
]

const failures = checks.filter((check) => {
  try {
    return !check.pass()
  } catch (error) {
    console.error(`    threw: ${error && error.message}`)
    return true
  }
})

if (failures.length > 0) {
  console.error('Logo 3D extrude checks failed:')
  for (const failure of failures) {
    console.error(`- ${failure.name}`)
  }
  process.exit(1)
}

console.log(`Logo 3D extrude checks passed (${checks.length} assertions; ${checks.length - 1} executed against the real module)`)
