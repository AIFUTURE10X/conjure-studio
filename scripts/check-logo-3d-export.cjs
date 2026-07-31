const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

/**
 * Source with comments stripped, for the few assertions that must stay
 * source-level. Matching raw source lets a commented-out call satisfy a check —
 * the dead-code trap CLAUDE.md warns about, which the video-history check was
 * actually caught by.
 */
const readCode = (relativePath) => read(relativePath)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/.*$/gm, '$1')

const MATH_PATH = 'app/image-studio/components/Logo/LogoSpin3D/spin-export-math.ts'
const ENGINE_PATH = 'app/image-studio/components/Logo/LogoSpin3D/spin-export-engine.ts'

/**
 * Load and EXECUTE the real export maths.
 *
 * Encoding needs WebCodecs and rendering needs a GPU, so the encoder itself
 * cannot run in CI. The decisions that can silently be wrong were extracted into
 * an import-free module; `require` throws rather than stubbing, so pulling a
 * dependency in here fails loudly instead of degrading this to a source match.
 * (An import the module never *uses* is elided by the transpiler and slips
 * through, which is harmless — what is caught is any import actually used.)
 */
function loadMathModule() {
  const { outputText } = ts.transpileModule(read(MATH_PATH), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: MATH_PATH,
  })
  const mod = { exports: {} }
  const noImports = (id) => {
    throw new Error(`${MATH_PATH} must stay import-free so this check can execute it; got: ${id}`)
  }
  new Function('exports', 'require', 'module', '__filename', '__dirname', outputText)(
    mod.exports, noImports, mod, MATH_PATH, path.dirname(MATH_PATH),
  )
  return mod.exports
}

let maths
try {
  maths = loadMathModule()
} catch (error) {
  console.error('Logo 3D export checks failed: could not execute the export maths module')
  console.error(`  ${error && error.message}`)
  console.error(`  ${MATH_PATH} must stay dependency-free so CI can run these assertions headlessly.`)
  process.exit(1)
}

const {
  EXPORT_RESOLUTIONS, EXPORT_FPS_OPTIONS, EXPORT_MIN_SECONDS, EXPORT_MAX_SECONDS,
  clampDuration, frameCountFor, frameTurns, frameTimestamp, frameDuration, clipDurationFor,
  cameraDistanceFor, formatSupportsAlpha, alphaConflict, bitrateFor, exportFilename, tumbleTiltTurns,
  exportRevolutions,
} = maths

const near = (a, b, tolerance = 1e-9) => Math.abs(a - b) < tolerance

const checks = [
  {
    name: 'duration — requests outside the supported range are clamped, not accepted',
    pass: () => {
      const cases = [[5, 5], [EXPORT_MIN_SECONDS, EXPORT_MIN_SECONDS], [EXPORT_MAX_SECONDS, EXPORT_MAX_SECONDS],
        [0, EXPORT_MIN_SECONDS], [-4, EXPORT_MIN_SECONDS], [999, EXPORT_MAX_SECONDS], [NaN, EXPORT_MIN_SECONDS]]
      return cases.every(([input, want]) => {
        const got = clampDuration(input)
        if (got !== want) { console.error(`    ${input}: expected ${want}, received ${got}`); return false }
        return true
      })
    },
  },
  {
    name: 'frames — count is duration x fps for every supported combination',
    pass: () => {
      // The 999s case pins the clamp INSIDE frameCountFor — without it a junk
      // duration asks the encoder for tens of thousands of frames.
      const cases = [[2, 24, 48], [3, 24, 72], [4, 30, 120], [10, 60, 600], [5, 30, 150], [2, 60, 120], [999, 30, 300]]
      return cases.every(([duration, fps, want]) => {
        const got = frameCountFor(duration, fps)
        if (got !== want) { console.error(`    ${duration}s @ ${fps}fps: expected ${want}, received ${got}`); return false }
        return true
      })
    },
  },
  {
    name: 'frames — a bogus fps falls back rather than producing zero or NaN frames',
    pass: () => [0, -30, NaN, Infinity].every((fps) => {
      const got = frameCountFor(4, fps)
      if (!(Number.isInteger(got) && got > 0)) { console.error(`    fps ${fps}: expected a positive integer, received ${got}`); return false }
      return true
    }),
  },
  {
    /*
      The headline property. Frame `frameCount` would repeat frame 0's
      orientation, and only 0..frameCount-1 are rendered, so playback wraps
      seamlessly. Dividing by frameCount - 1 — the natural off-by-one — makes the
      LAST rendered frame a duplicate of the first and the loop visibly stutters.
    */
    name: 'loop — the clip spans exactly one turn with no duplicated frame at the seam',
    pass: () => {
      const frameCount = frameCountFor(4, 30)
      const first = frameTurns(0, frameCount)
      const wrap = frameTurns(frameCount, frameCount)
      const last = frameTurns(frameCount - 1, frameCount)
      if (!near(first, 0)) { console.error(`    frame 0 should be 0 turns, received ${first}`); return false }
      if (!near(wrap, 1)) { console.error(`    frame ${frameCount} should be exactly 1 turn, received ${wrap}`); return false }
      if (!(last < 1)) {
        console.error(`    the last RENDERED frame must fall short of a full turn, received ${last}`)
        console.error('    a value of exactly 1 means frame 0 is rendered twice and the loop stutters')
        return false
      }
      if (!near(last, (frameCount - 1) / frameCount)) {
        console.error(`    expected ${(frameCount - 1) / frameCount}, received ${last}`)
        console.error('    looks like the divisor is frameCount - 1 rather than frameCount')
        return false
      }
      return true
    },
  },
  {
    name: 'loop — turns increase strictly and evenly across the clip',
    pass: () => {
      const frameCount = frameCountFor(3, 24)
      const step = 1 / frameCount
      for (let index = 1; index < frameCount; index += 1) {
        const delta = frameTurns(index, frameCount) - frameTurns(index - 1, frameCount)
        if (!near(delta, step)) {
          console.error(`    frame ${index}: expected step ${step}, received ${delta}`)
          return false
        }
      }
      return true
    },
  },
  {
    name: 'loop — multiple revolutions still land exactly on a whole turn',
    pass: () => [2, 3].every((revolutions) => {
      const frameCount = frameCountFor(6, 30)
      const wrap = frameTurns(frameCount, frameCount, revolutions)
      if (!near(wrap, revolutions)) { console.error(`    ${revolutions} revolutions: expected ${revolutions}, received ${wrap}`); return false }
      return true
    }),
  },
  {
    /*
      AC-3 against exact preview speed: at a user-fixed duration the loop can
      only close on a whole number of turns, so the export cannot always
      reproduce the preview's velocity. The contract is "the whole count nearest
      the preview's rate, never zero" — pinned here so neither direction of the
      tradeoff regresses: preserving the preview's fractional turns would snap
      the seam (AC-3), while a floor-less round would emit a motionless clip for
      short slow spins.
    */
    name: 'loop — revolutions are the whole count nearest the preview speed, floored at one',
    pass: () => {
      const cases = [
        [4, 1, 1],      // previews 2/3 turn; nearest whole is 1 (1.5x the preview rate)
        [6, 1, 1],      // exactly one turn at base speed
        [10, 1, 2],     // previews 1.67 turns; rounds up, a floor-style truncation would give 1
        [8, 1.5, 2],    // previews exactly 2 turns
        [10, 3, 5],     // previews exactly 5 turns
        [2, 0.2, 1],    // previews 1/15 turn; the floor keeps the clip spinning
        [10, 0.2, 1],   // previews 1/3 turn; rounds to 0, the floor lifts it to 1
        [999, 1, 2],    // junk duration clamps to 10s, like the frame count does
        [4, NaN, 1],    // junk speed falls back to 1x
        [4, 0, 1],      // zero speed falls back rather than dividing to zero turns
      ]
      return cases.every(([duration, speed, want]) => {
        const got = exportRevolutions(duration, speed, 6)
        if (got !== want) { console.error(`    ${duration}s @ ${speed}x: expected ${want}, received ${got}`); return false }
        return true
      })
    },
  },
  {
    /*
      Regression guard for a seam that shipped to review.

      Tumble rotates two axes. The spin axis lands on a whole turn by
      construction, but the tilt originally derived as a fixed 0.4x fraction of
      it, which only closes when the spin count is a multiple of 5. Across the
      whole UI range that was ONE combination (10s at 3x) — every other setting,
      including the defaults, ended mid-tilt and snapped at the loop point.

      The earlier checks missed it because they exercised frameTurns alone and
      never composed it with the rotation. This one composes both, exactly as the
      encoder does.
    */
    name: 'loop — a tumble clip closes on BOTH axes, not just the spin',
    pass: () => {
      const combos = [[2, 24], [3, 30], [4, 30], [6, 24], [8, 60], [10, 60]]
      const speeds = [0.2, 0.5, 1, 1.5, 2, 3]
      for (const [duration, fps] of combos) {
        for (const speed of speeds) {
          const frameCount = frameCountFor(duration, fps)
          // The REAL revolutions function, not a copy of its formula — a copy
          // here would keep passing after the engine's derivation drifted.
          const revolutions = exportRevolutions(duration, speed, 6)
          const tilt = tumbleTiltTurns(revolutions)
          if (!Number.isInteger(tilt) || tilt < 1) {
            console.error(`    ${duration}s @ ${fps}fps speed ${speed}: tilt turns ${tilt} is not a positive whole number`)
            return false
          }
          // The frame after the last rendered one must return BOTH axes to their
          // starting orientation, i.e. both land on whole turns.
          const spinAtWrap = frameTurns(frameCount, frameCount, revolutions)
          const tiltAtWrap = frameTurns(frameCount, frameCount, tilt)
          if (!near(spinAtWrap % 1, 0) || !near(tiltAtWrap % 1, 0)) {
            console.error(`    ${duration}s @ ${fps}fps speed ${speed}: spin=${spinAtWrap} tilt=${tiltAtWrap}`)
            console.error('    both must be whole turns or the tumble seam snaps')
            return false
          }
        }
      }
      return true
    },
  },
  {
    name: 'timing — frame timestamps are contiguous and the clip is exactly as long as requested',
    pass: () => {
      const fps = 30
      const frameCount = frameCountFor(4, fps)
      if (!near(frameTimestamp(0, fps), 0)) { console.error('    frame 0 must start at t=0'); return false }
      for (let index = 1; index < 6; index += 1) {
        const gap = frameTimestamp(index, fps) - frameTimestamp(index - 1, fps)
        if (!near(gap, frameDuration(fps))) {
          console.error(`    gap before frame ${index}: expected ${frameDuration(fps)}, received ${gap}`)
          console.error('    a gap that is not exactly one frame long leaves holes or overlaps in the track')
          return false
        }
      }
      const clip = clipDurationFor(4, fps)
      if (!near(clip, 4)) { console.error(`    expected a 4s clip, received ${clip}s`); return false }
      // The last frame's end must equal the clip length exactly.
      const end = frameTimestamp(frameCount - 1, fps) + frameDuration(fps)
      if (!near(end, clip)) { console.error(`    last frame ends at ${end}, clip claims ${clip}`); return false }
      return true
    },
  },
  {
    name: 'framing — a narrower aspect pulls the camera back so the logo still fits',
    pass: () => {
      const wide = cameraDistanceFor(1920 / 1080, 45)
      const square = cameraDistanceFor(1, 45)
      const narrow = cameraDistanceFor(0.5, 45)
      if (!(narrow > square && square >= wide)) {
        console.error(`    expected narrow > square >= wide, received narrow=${narrow} square=${square} wide=${wide}`)
        console.error('    otherwise a square or portrait export crops a logo the preview showed whole')
        return false
      }
      return true
    },
  },
  {
    name: 'framing — distance is finite and positive for junk aspect or fov',
    pass: () => [[0, 45], [-2, 45], [NaN, 45], [1, 0], [1, NaN], [Infinity, 45]].every(([aspect, fov]) => {
      const got = cameraDistanceFor(aspect, fov)
      if (!(Number.isFinite(got) && got > 0)) { console.error(`    aspect=${aspect} fov=${fov}: received ${got}`); return false }
      return true
    }),
  },
  {
    name: 'alpha — only WebM carries it, and the conflict is reported before encoding',
    pass: () => {
      const cases = [
        ['webm', true, false, true], ['webm', false, false, true],
        ['mp4', true, true, false], ['mp4', false, false, false],
      ]
      return cases.every(([format, transparent, wantConflict, wantAlpha]) => {
        const alpha = formatSupportsAlpha(format)
        const conflict = alphaConflict(format, transparent)
        if (alpha !== wantAlpha || conflict !== wantConflict) {
          console.error(`    ${format} transparent=${transparent}: expected alpha=${wantAlpha} conflict=${wantConflict}, received alpha=${alpha} conflict=${conflict}`)
          return false
        }
        return true
      })
    },
  },
  {
    name: 'bitrate — scales with pixels and frame rate, with a floor for short clips',
    pass: () => {
      const sd = bitrateFor(1280, 720, 30)
      const hd = bitrateFor(1920, 1080, 30)
      const hd60 = bitrateFor(1920, 1080, 60)
      const tiny = bitrateFor(16, 16, 24)
      if (!(hd > sd)) { console.error(`    1080p (${hd}) should exceed 720p (${sd})`); return false }
      if (!(hd60 > hd)) { console.error(`    60fps (${hd60}) should exceed 30fps (${hd})`); return false }
      if (!(tiny >= 2_000_000)) { console.error(`    expected a floor of 2Mbps, received ${tiny}`); return false }
      return true
    },
  },
  {
    name: 'filename — identifies the logo and carries the right extension',
    pass: () => {
      const cases = [
        ['Bold Geometric Monogram', 'mp4', 'bold-geometric-monogram-3d-spin.mp4'],
        ['Bold Geometric Monogram', 'webm', 'bold-geometric-monogram-3d-spin.webm'],
        ['  !!! ', 'mp4', 'logo-3d-spin.mp4'],
        ['', 'mp4', 'logo-3d-spin.mp4'],
      ]
      return cases.every(([prompt, format, want]) => {
        const got = exportFilename(prompt, format)
        if (got !== want) { console.error(`    ${JSON.stringify(prompt)}: expected ${want}, received ${got}`); return false }
        return true
      })
    },
  },
  {
    name: 'options — the advertised resolutions and frame rates are sane',
    pass: () => {
      if (!EXPORT_RESOLUTIONS.every((r) => r.width > 0 && r.height > 0 && Number.isInteger(r.width) && Number.isInteger(r.height))) {
        console.error(`    resolutions must be whole positive pixel sizes: ${JSON.stringify(EXPORT_RESOLUTIONS)}`)
        return false
      }
      const hasSquare = EXPORT_RESOLUTIONS.some((r) => r.width === r.height)
      const has1080 = EXPORT_RESOLUTIONS.some((r) => r.width === 1920 && r.height === 1080)
      const has720 = EXPORT_RESOLUTIONS.some((r) => r.width === 1280 && r.height === 720)
      if (!(hasSquare && has1080 && has720)) { console.error('    720p, 1080p and a square option are all required'); return false }
      return EXPORT_FPS_OPTIONS.every((fps) => Number.isInteger(fps) && fps > 0)
    },
  },
  {
    /*
      Regression guard on determinism. MediaRecorder over captureStream is the
      obvious way to record a canvas, but it timestamps by wall clock, so a slow
      machine yields a longer clip than requested. The encoder must drive
      timestamps from the maths above instead.
    */
    name: 'wiring — the encoder drives computed timestamps, not a realtime capture',
    pass: () => {
      const engine = readCode(ENGINE_PATH)
      const usesFrameTurns = /frameTurns\(/.test(engine)
      const usesTimestamps = /frameTimestamp\(/.test(engine) && /frameDuration\(/.test(engine)
      const usesFrameCount = /frameCountFor\(/.test(engine)
      // The turn count must come from the executed helper above, not an inline
      // rederivation — an inline copy can drift from the pinned contract while
      // every executed assertion here stays green.
      const usesRevolutions = /exportRevolutions\(/.test(engine)
      // Tumble needs a whole-turn tilt derived independently of the spin; deriving
      // it as a fraction inside the rotation is what snapped the seam.
      const usesWholeTilt = /tumbleTiltTurns\(/.test(engine) && /rotationForAxisTurns\(/.test(engine)
      const realtime = /MediaRecorder|captureStream\(/.test(engine)
      if (!usesRevolutions) console.error('    the encoder does not derive its turn count via exportRevolutions')
      if (!usesWholeTilt) console.error('    the encoder does not derive a whole-turn tumble tilt (tumbleTiltTurns + rotationForAxisTurns)')
      if (!usesFrameTurns) console.error('    the encoder does not use frameTurns — the loop seam is not the pinned one')
      if (!usesTimestamps) console.error('    the encoder does not use frameTimestamp/frameDuration for sample timing')
      if (!usesFrameCount) console.error('    the encoder does not use frameCountFor')
      if (realtime) console.error('    the encoder references MediaRecorder/captureStream — that timestamps by wall clock and breaks the duration guarantee')
      return usesFrameTurns && usesTimestamps && usesFrameCount && usesRevolutions && usesWholeTilt && !realtime
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
  console.error('Logo 3D export checks failed:')
  for (const failure of failures) console.error(`- ${failure.name}`)
  process.exit(1)
}

console.log(`Logo 3D export checks passed (${checks.length} assertions; ${checks.length - 1} executed against the real module)`)
