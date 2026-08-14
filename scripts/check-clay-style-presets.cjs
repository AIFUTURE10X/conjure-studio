const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

function loadTypeScriptModule(relativePath, requireMap = {}) {
  const { outputText } = ts.transpileModule(read(relativePath), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: relativePath,
  })
  const mod = { exports: {} }
  const localRequire = (request) => {
    if (Object.hasOwn(requireMap, request)) return requireMap[request]
    throw new Error(`Unexpected import ${request} from ${relativePath}`)
  }
  new Function('exports', 'require', 'module', '__filename', '__dirname', outputText)(
    mod.exports,
    localRequire,
    mod,
    relativePath,
    path.dirname(relativePath),
  )
  return mod.exports
}

const cameraOptions = loadTypeScriptModule('app/image-studio/constants/camera-options.ts')
const synonyms = loadTypeScriptModule('app/image-studio/constants/normalization-synonyms.ts')
const thumbnailConstants = loadTypeScriptModule('app/image-studio/components/Thumbnail/thumbnail-constants.ts')
const promptBuilder = loadTypeScriptModule('app/image-studio/utils/build-image-prompt.ts', {
  '../constants/camera-options': cameraOptions,
  '../constants/creative-direction-options': { buildCreativeDirectionPrompt: () => '' },
})

const claymation = cameraOptions.stylePresets.find((preset) => preset.value === 'Clay 3D')
const digitalClay = cameraOptions.stylePresets.find((preset) => preset.value === '3D Digital Clay')

const buildStylePrompt = (selectedStylePreset) => promptBuilder.buildFinalImagePrompt({
  basePrompt: 'a friendly explorer',
  selectedStylePreset,
  selectedCameraAngle: '',
  selectedCameraLens: '',
  styleStrength: 'moderate',
  creativeDirection: {},
  negativePrompt: '',
})

const checks = [
  {
    name: 'the existing Clay 3D key is visibly renamed Claymation for saved-preset compatibility',
    pass: () => claymation?.label === 'Claymation',
  },
  {
    name: 'Claymation retains handmade stop-motion surface cues',
    pass: () => /stop-motion claymation/i.test(claymation?.promptHint ?? '') &&
      /visible fingerprints/i.test(claymation?.promptHint ?? '') &&
      /handmade plasticine/i.test(claymation?.promptHint ?? ''),
  },
  {
    name: '3D Digital Clay exists with the requested visible name',
    pass: () => digitalClay?.label === '3D Digital Clay',
  },
  {
    name: '3D Digital Clay requests smooth computer-rendered clay without handmade cues',
    pass: () => /computer-rendered/i.test(digitalClay?.promptHint ?? '') &&
      /smooth/i.test(digitalClay?.promptHint ?? '') &&
      /clean/i.test(digitalClay?.promptHint ?? '') &&
      /symmetr/i.test(digitalClay?.promptHint ?? '') &&
      !/fingerprint|stop-motion|handmade|sculpting tool/i.test(digitalClay?.promptHint ?? ''),
  },
  {
    name: 'the final prompt expands each clay preset into a distinct rendering treatment',
    pass: () => {
      const claymationPrompt = buildStylePrompt('Clay 3D')
      const digitalPrompt = buildStylePrompt('3D Digital Clay')
      return /visible fingerprints/i.test(claymationPrompt) &&
        /computer-rendered/i.test(digitalPrompt) &&
        claymationPrompt !== digitalPrompt
    },
  },
  {
    name: 'style synonyms distinguish handmade claymation from digital clay',
    pass: () => synonyms.styleSynonyms.claymation === 'Clay 3D' &&
      synonyms.styleSynonyms['3d digital clay'] === '3D Digital Clay' &&
      synonyms.styleSynonyms['digital clay'] === '3D Digital Clay',
  },
  {
    name: 'thumbnail generation offers both clay treatments with distinct prompts',
    pass: () => {
      const clayThumbnail = thumbnailConstants.THUMBNAIL_AI_STYLES.find((style) => style.id === 'clay')
      const digitalThumbnail = thumbnailConstants.THUMBNAIL_AI_STYLES.find((style) => style.id === 'digital-clay')
      return clayThumbnail?.label === 'Claymation' &&
        digitalThumbnail?.label === '3D Digital Clay' &&
        /fingerprints/i.test(clayThumbnail.prompt) &&
        /computer-rendered/i.test(digitalThumbnail.prompt)
    },
  },
  {
    name: 'the digital clay preset has its own thumbnail asset',
    pass: () => digitalClay?.thumbnail === '/3d-digital-clay-style.svg' &&
      fs.existsSync(path.join(root, 'public/3d-digital-clay-style.svg')),
  },
]

const failures = checks.filter((check) => {
  try {
    return !check.pass()
  } catch (error) {
    console.error(`    ${check.name} threw: ${error.message}`)
    return true
  }
})

if (failures.length > 0) {
  console.error('Clay style preset checks failed:')
  for (const failure of failures) console.error(`- ${failure.name}`)
  process.exit(1)
}

console.log(`Clay style preset checks passed (${checks.length} assertions)`)
