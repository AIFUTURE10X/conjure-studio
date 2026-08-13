const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

function loadModule(relativePath) {
  const { outputText } = ts.transpileModule(read(relativePath), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: relativePath,
  })
  const mod = { exports: {} }
  new Function('exports', 'require', 'module', '__filename', '__dirname', outputText)(
    mod.exports,
    (id) => { throw new Error(`unexpected runtime import in ${relativePath}: ${id}`) },
    mod,
    relativePath,
    path.dirname(relativePath),
  )
  return mod.exports
}

const providers = loadModule('lib/video/providers.ts')
const costs = loadModule('lib/credits/cost-map.ts')
const model = providers.getVideoModel('seedance-2.5')

const baseParams = {
  prompt: 'A cinematic product reveal',
  durationSeconds: 30,
  resolution: '720p',
  aspectRatio: '16:9',
  generateAudio: true,
}

const checks = [
  {
    name: 'Seedance 2.5 is exposed by the video model registry',
    pass: () => providers.VIDEO_MODEL_IDS.includes('seedance-2.5') && model?.label === 'Seedance 2.5',
  },
  {
    name: 'Seedance 2.5 exposes the fal-supported capabilities',
    pass: () => model?.capabilities.textToVideo === true &&
      model.capabilities.imageToVideo === true &&
      model.capabilities.endFrame === true &&
      model.capabilities.audio === true &&
      JSON.stringify(model.capabilities.resolutions) === JSON.stringify(['480p', '720p']) &&
      model.capabilities.durations.includes(4) &&
      model.capabilities.durations.includes(30),
  },
  {
    name: 'text-to-video uses the Seedance 2.5 fal endpoint and preserves 30 seconds',
    pass: () => model?.endpoint(baseParams) === 'bytedance/seedance-2.5/text-to-video' &&
      model.buildInput(baseParams).duration === '30',
  },
  {
    name: 'image-to-video maps start and end frames onto the fal schema',
    pass: () => {
      if (!model) return false
      const params = { ...baseParams, startImageUrl: 'https://example.com/start.png', endImageUrl: 'https://example.com/end.png' }
      const input = model.buildInput(params)
      return model.endpoint(params) === 'bytedance/seedance-2.5/image-to-video' &&
        input.image_url === params.startImageUrl &&
        input.end_image_url === params.endImageUrl &&
        input.generate_audio === true
    },
  },
  {
    name: '30-second Seedance 2.5 clips are charged for all 30 seconds',
    pass: () => costs.videoGenerationCost('seedance-2.5', 30, '720p', true) === 600,
  },
  {
    name: 'the 30-second request ceiling does not overstate older model durations',
    pass: () => providers.normalizeVideoDuration('seedance-2', 30) === 15 &&
      providers.normalizeVideoDuration('seedance-2.5', 30) === 30 &&
      costs.videoGenerationCost('seedance-2', 30, '720p', true) === 120,
  },
  {
    name: 'the generate-video route accepts Seedance 2.5 durations through 30 seconds',
    pass: () => /duration:\s*z\.coerce\.number\(\)\.int\(\)\.min\(2\)\.max\(30\)/.test(read('app/api/generate-video/route.ts')) &&
      /normalizeVideoDuration\(modelId, requestedDuration\)/.test(read('app/api/generate-video/route.ts')),
  },
]

let failed = 0
for (const check of checks) {
  let passed = false
  try {
    passed = check.pass()
  } catch (error) {
    console.error(`    ${error instanceof Error ? error.message : error}`)
  }
  console.log(`${passed ? 'PASS' : 'FAIL'} ${check.name}`)
  if (!passed) failed += 1
}

if (failed > 0) {
  console.error(`${failed} Seedance 2.5 contract check(s) failed`)
  process.exit(1)
}

console.log(`Seedance 2.5 checks passed (${checks.length} assertions)`)
