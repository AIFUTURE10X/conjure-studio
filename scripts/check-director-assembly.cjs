const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

/**
 * Photo Director assembly contract. These functions are the deterministic
 * spine of the two-photo workflow: prompt assembly (camera fragment +
 * motionCore + preservation block), credit estimation (must equal the debit),
 * concept gating (unsafe continuous transitions must be DISABLED, not just
 * flagged), and draft/final model recommendation (an end-frame shot must never
 * draft on a model that cannot take an end frame).
 *
 * Per the repo's check policy, the real modules are transpiled and EXECUTED —
 * a regex-only contract keeps passing after the runtime behavior regresses.
 */

const MODULES = {
  './providers': 'lib/video/providers.ts',
  '../credits/cost-map': 'lib/credits/cost-map.ts',
  './camera-moves': 'lib/video/camera-moves.ts',
  './director-assembly': 'lib/video/director-assembly.ts',
  './director-project': 'lib/video/director-project.ts',
}

const cache = {}
function loadModule(specifier) {
  if (cache[specifier]) return cache[specifier]
  const file = MODULES[specifier]
  if (!file) return {} // type-only imports (photo-director-schema) erase at transpile
  const { outputText } = ts.transpileModule(read(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: file,
  })
  const mod = { exports: {} }
  new Function('exports', 'require', 'module', '__filename', '__dirname', outputText)(
    mod.exports,
    loadModule,
    mod,
    file,
    path.dirname(file),
  )
  cache[specifier] = mod.exports
  return mod.exports
}

const assembly = loadModule('./director-assembly')
const directorProject = loadModule('./director-project')
const cameraMoves = loadModule('./camera-moves')
const providers = loadModule('./providers')
const costMap = loadModule('../credits/cost-map')

const CONSTRAINTS = [
  { id: 'sofa', subject: 'sofa and cushions', requirement: 'keep the sofa arrangement intact', negativePhrase: 'do not restyle the cushions', severity: 'should', source: 'ai' },
  { id: 'window', subject: 'window proportions', requirement: 'keep the window exactly as photographed', negativePhrase: 'do not add extra windows', severity: 'must', source: 'ai' },
]

const checks = []
const check = (name, pass) => checks.push({ name, pass })

// --- buildPreservationBlock ------------------------------------------------

check('preservation block — empty constraints produce an empty string', () =>
  assembly.buildPreservationBlock([]) === '')

check('preservation block — includes every requirement and negativePhrase', () => {
  const block = assembly.buildPreservationBlock(CONSTRAINTS)
  return CONSTRAINTS.every((c) => block.includes(c.requirement) && block.includes(c.negativePhrase))
})

check('preservation block — must constraints come before should constraints', () => {
  const block = assembly.buildPreservationBlock(CONSTRAINTS)
  const mustIndex = block.indexOf('window proportions')
  const shouldIndex = block.indexOf('sofa and cushions')
  return mustIndex !== -1 && shouldIndex !== -1 && mustIndex < shouldIndex
})

check('preservation block — always ends with the standing negatives', () => {
  const block = assembly.buildPreservationBlock(CONSTRAINTS)
  return block.trimEnd().endsWith(assembly.STANDING_NEGATIVES)
})

// --- assembleMotionPrompt --------------------------------------------------

const MOTION_CORE = 'Warm morning light shifts subtly through the sheer curtains.'

check('motion prompt — starts with the exact camera fragment for every model × move', () =>
  Object.keys(providers.VIDEO_MODELS).every((model) =>
    cameraMoves.CAMERA_MOVES.every((move) => {
      const prompt = assembly.assembleMotionPrompt({
        model, cameraMove: move, motionCore: MOTION_CORE, durationSeconds: 6, constraints: CONSTRAINTS,
      })
      const fragment = cameraMoves.cameraFragment(model, move)
      if (!prompt.startsWith(fragment)) {
        console.error(`    ${model} × ${move}: prompt does not start with its camera fragment`)
        return false
      }
      return true
    })))

check('motion prompt — contains the motionCore and ends with the preservation block', () => {
  const prompt = assembly.assembleMotionPrompt({
    model: 'seedance-fast', cameraMove: 'push-in', motionCore: MOTION_CORE, durationSeconds: 6, constraints: CONSTRAINTS,
  })
  return prompt.includes(MOTION_CORE) && prompt.trimEnd().endsWith(assembly.STANDING_NEGATIVES)
})

check('motion prompt — throws on a near-empty motionCore (never-generic guarantee)', () => {
  try {
    assembly.assembleMotionPrompt({
      model: 'seedance-fast', cameraMove: 'push-in', motionCore: 'cinematic', durationSeconds: 6, constraints: [],
    })
    return false
  } catch {
    return true
  }
})

// --- estimateDirectorCredits ----------------------------------------------

check('credit estimate — equals the cost-map debit for snapped duration/resolution, plus assembly', () => {
  const renders = [
    { shotId: 'a', model: 'seedance-fast', durationSeconds: 6, resolution: '720p', withAudio: false },
    // 4s snaps to 5 (seedance-2's minimum supported duration); 4k is supported.
    { shotId: 'b', model: 'seedance-2', durationSeconds: 4, resolution: '4k', withAudio: true },
  ]
  const want =
    costMap.videoGenerationCost('seedance-fast', 6, '720p', false) +
    costMap.videoGenerationCost('seedance-2', 5, '4k', true) +
    costMap.VIDEO_TOOL_COSTS.filmAssembly
  const got = assembly.estimateDirectorCredits(renders, { includeAssembly: true }).total
  if (got !== want) {
    console.error(`    expected: ${want}`)
    console.error(`    received: ${got}`)
    return false
  }
  return true
})

check('credit estimate — moves by the per-second rate when a duration changes', () => {
  const render = (seconds) => [{ shotId: 'a', model: 'seedance-fast', durationSeconds: seconds, resolution: '720p', withAudio: false }]
  const at6 = assembly.estimateDirectorCredits(render(6), { includeAssembly: false }).total
  const at8 = assembly.estimateDirectorCredits(render(8), { includeAssembly: false }).total
  return at8 - at6 === costMap.videoGenerationCost('seedance-fast', 8, '720p', false) -
    costMap.videoGenerationCost('seedance-fast', 6, '720p', false)
})

check('credit estimate — snaps an unsupported resolution the way the route does', () => {
  // kling-3 only supports 1080p; a 4k request must be priced at 1080p (no 2x multiplier).
  const renders = [{ shotId: 'a', model: 'kling-3', durationSeconds: 6, resolution: '4k', withAudio: false }]
  const got = assembly.estimateDirectorCredits(renders, { includeAssembly: false }).total
  return got === costMap.videoGenerationCost('kling-3', 6, '1080p', false)
})

// --- gateConcepts ----------------------------------------------------------

const CONCEPTS = [
  { id: 'reveal', archetype: 'room-reveal', title: 'Smooth Room Reveal', summary: 's', structure: 'continuous-transition', durationSeconds: 8, shotCount: 1, platformFit: [], cameraMoves: [], fidelityRisk: 'medium', rationale: 'r', disabled: false },
  { id: 'two', archetype: 'two-shot-luxury', title: 'Two-Shot', summary: 's', structure: 'two-shot', durationSeconds: 12, shotCount: 2, platformFit: [], cameraMoves: [], fidelityRisk: 'low', rationale: 'r', disabled: false },
]
const continuity = (riskLevel, confidence) => ({
  sameLocationConfidence: confidence, viewpointRelation: 'adjacent-angles', sharedObjectIds: [],
  riskLevel, riskReasons: ['the window is on opposite walls'], recommendSeparateShots: true,
})

check('gate — high risk disables continuous-transition with a non-empty reason', () => {
  const gated = assembly.gateConcepts(CONCEPTS, continuity('high', 0.9))
  const reveal = gated.find((c) => c.id === 'reveal')
  return reveal.disabled === true && typeof reveal.disabledReason === 'string' && reveal.disabledReason.length > 0
})

check('gate — low same-location confidence also disables continuous-transition', () => {
  const gated = assembly.gateConcepts(CONCEPTS, continuity('low', 0.4))
  return gated.find((c) => c.id === 'reveal').disabled === true
})

check('gate — other structures stay enabled; safe continuity gates nothing', () => {
  const highGated = assembly.gateConcepts(CONCEPTS, continuity('high', 0.9))
  const safeGated = assembly.gateConcepts(CONCEPTS, continuity('low', 0.9))
  return highGated.find((c) => c.id === 'two').disabled === false &&
    safeGated.every((c) => c.disabled === false)
})

// --- recommendRender -------------------------------------------------------

check('render rec — a shot with an end frame never drafts on a model without endFrame support', () => {
  const rec = assembly.recommendRender({ endPhotoId: 'x' }, 'draft')
  return providers.VIDEO_MODELS[rec.model].capabilities.endFrame === true
})

check('render rec — a plain shot drafts on the draft-tier model', () => {
  const rec = assembly.recommendRender({ endPhotoId: null }, 'draft')
  return providers.VIDEO_MODELS[rec.model].tier === 'draft'
})

check('render rec — finals use final-tier models; transition finals support end frames', () => {
  const plain = assembly.recommendRender({ endPhotoId: null }, 'final')
  const transition = assembly.recommendRender({ endPhotoId: 'x' }, 'final')
  return providers.VIDEO_MODELS[plain.model].tier === 'final' &&
    providers.VIDEO_MODELS[transition.model].capabilities.endFrame === true
})

// --- step reachability (a step's work must never become unreachable) -------

const project = (overrides) => ({
  version: 1, id: 'p', createdAt: 0, step: 'upload', photos: [], analysis: null,
  correctedObservedIds: [], confirmedInferredIds: [], rejectedInferredIds: [], correctionNote: '',
  constraints: [], brief: null, concepts: null, selectedConceptId: null, storyboard: [],
  renderOverrides: {}, shotJobs: {}, assembledJobId: null, ...overrides,
})
const ANALYSIS = {
  observed: [{ id: 'bed', label: 'Bed', detail: '', photoIndices: [0, 1], confidence: 0.9 }],
  inferred: [{ id: 'light', label: 'Daylight', detail: '', photoIndices: [1], confidence: 0.5 }],
  suggested: [], continuity: continuity('low', 0.9),
  bestOpeningPhotoIndex: 0, bestClosingPhotoIndex: 1, framingRationale: '', preservation: CONSTRAINTS,
}

check('reachability — stepping back to photos keeps the analysis reachable', () => {
  // The regression this pins: navigation used to be walk-order based, so going
  // back to 'upload' disabled every later step and stranded a paid analysis.
  const back = project({ step: 'upload', analysis: ANALYSIS })
  return directorProject.isDirectorStepReachable(back, 'analysis') === true &&
    directorProject.isDirectorStepReachable(back, 'brief') === true
})

check('reachability — steps without their data stay locked', () => {
  const fresh = project({ step: 'upload' })
  return directorProject.isDirectorStepReachable(fresh, 'analysis') === false &&
    directorProject.isDirectorStepReachable(fresh, 'concepts') === false &&
    directorProject.isDirectorStepReachable(fresh, 'storyboard') === false &&
    directorProject.isDirectorStepReachable(fresh, 'upload') === true
})

check('reachability — the current step is always reachable', () =>
  directorProject.DIRECTOR_STEP_SEQUENCE.every((step) =>
    directorProject.isDirectorStepReachable(project({ step }), step) === true))

check('reachability — later work stays reachable from an earlier step', () => {
  const deep = project({
    step: 'analysis', analysis: ANALYSIS, brief: {}, concepts: [{}],
    storyboard: [{ id: 's1' }], shotJobs: { s1: {} },
  })
  const reachable = directorProject.reachableDirectorSteps(deep)
  return ['upload', 'analysis', 'brief', 'concepts', 'storyboard', 'preflight', 'generate']
    .every((step) => reachable.includes(step)) && !reachable.includes('done')
})

// --- analysis remap on reorder (reordering must not discard findings) ------

check('remap — swapping two photos rewrites every index reference', () => {
  const mapping = [1, 0] // photo 0 and 1 swapped
  const remapped = directorProject.remapAnalysisPhotoIndices(ANALYSIS, mapping)
  return JSON.stringify(remapped.observed[0].photoIndices) === JSON.stringify([0, 1]) &&
    JSON.stringify(remapped.inferred[0].photoIndices) === JSON.stringify([0]) &&
    remapped.bestOpeningPhotoIndex === 1 &&
    remapped.bestClosingPhotoIndex === 0
})

check('remap — indices outside the mapping are left alone', () => {
  const remapped = directorProject.remapAnalysisPhotoIndices(
    { ...ANALYSIS, observed: [{ ...ANALYSIS.observed[0], photoIndices: [5] }] },
    [1, 0],
  )
  return JSON.stringify(remapped.observed[0].photoIndices) === JSON.stringify([5])
})

// --- wiring (source-level: call sites live inside React components) --------

check('wiring — the step rail is driven by reachability, not walk order', () => {
  const rail = read('app/image-studio/components/Video/PhotoDirector/DirectorStepRail.tsx')
  return rail.includes('isDirectorStepReachable') && !/index < currentIndex\s*\n?\s*const isCurrent/.test(rail)
})

check('wiring — reordering photos goes through the analysis-preserving action', () => {
  const upload = read('app/image-studio/components/Video/PhotoDirector/PhotoUploadStep.tsx')
  return upload.includes('moveDirectorPhoto') && upload.includes('appendDirectorPhotos')
})

check('wiring — generation submits assembled prompts under the Shot N/M prefix', () => {
  const hook = read('app/image-studio/components/Video/PhotoDirector/useDirectorGeneration.ts')
  return hook.includes('assembleMotionPrompt') &&
    /`Shot \$\{index \+ 1\}\/\$\{total\} — \$\{shot\.title\}: \$\{prompt\}`/.test(hook)
})

check('wiring — preflight shows the same estimate the guard will debit', () => {
  const preflight = read('app/image-studio/components/Video/PhotoDirector/PreflightStep.tsx')
  return preflight.includes('estimateDirectorCredits')
})

// ---------------------------------------------------------------------------

const failures = checks.filter((item) => {
  try {
    return !item.pass()
  } catch (error) {
    console.error(`    threw: ${error && error.message}`)
    return true
  }
})

if (failures.length > 0) {
  console.error('Photo Director assembly checks failed:')
  for (const failure of failures) console.error(`- ${failure.name}`)
  process.exit(1)
}

console.log(`Photo Director assembly checks passed (${checks.length} assertions executed against the real modules)`)
