const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

const HELPER_PATH = 'app/image-studio/utils/build-image-prompt.ts'
const PROVIDER_PATH = 'app/image-studio/context/ImageGenerationProvider.tsx'
const PANEL_PATH = 'app/image-studio/components/GeneratePanel.tsx'

/**
 * Load and EXECUTE the real merge helper.
 *
 * A regex-only contract keeps passing after the runtime behavior regresses — dead
 * code or a leftover matching string satisfies it — so the assertions below call
 * the actual shipped function. The module is transpiled with the repo's own
 * TypeScript, then evaluated with its sibling imports stubbed: those imports are
 * only dereferenced inside expandStyleForPrompt/buildFinalImagePrompt, which this
 * check never invokes, while mergePromptWithReferenceAnalysis is pure.
 */
function loadHelperModule() {
  const { outputText } = ts.transpileModule(read(HELPER_PATH), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: HELPER_PATH,
  })
  const mod = { exports: {} }
  const stubRequire = () => ({})
  new Function('exports', 'require', 'module', '__filename', '__dirname', outputText)(
    mod.exports,
    stubRequire,
    mod,
    HELPER_PATH,
    path.dirname(HELPER_PATH),
  )
  return mod.exports
}

const merge = loadHelperModule().mergePromptWithReferenceAnalysis

/** Executed against the real helper — these fail if the merge logic regresses. */
const BEHAVIOR_CASES = [
  {
    name: 'joins the typed prompt with the reference analysis, typed prompt first',
    args: ['claymation version of me', 'A bald man with a gold chain'],
    want: 'claymation version of me. A bald man with a gold chain',
  },
  { name: 'typed prompt alone is unchanged', args: ['a red sports car', ''], want: 'a red sports car' },
  {
    name: 'reference analysis alone is unchanged',
    args: ['', 'A bald man with a gold chain'],
    want: 'A bald man with a gold chain',
  },
  { name: 'neither present falls back to a neutral scene', args: ['', ''], want: 'a beautiful scene' },
  { name: 'whitespace-only inputs fall back to a neutral scene', args: ['   ', '\n\t '], want: 'a beautiful scene' },
  {
    name: 'surrounding whitespace is trimmed on both sides',
    args: ['  a red sports car  ', '  studio lighting  '],
    want: 'a red sports car. studio lighting',
  },
]

const checks = [
  { name: 'merge helper is exported and callable', pass: () => typeof merge === 'function' },
  ...BEHAVIOR_CASES.map((testCase) => ({
    name: `behavior — ${testCase.name}`,
    pass: () => {
      const got = merge(...testCase.args)
      if (got !== testCase.want) {
        console.error(`    expected: ${JSON.stringify(testCase.want)}`)
        console.error(`    received: ${JSON.stringify(got)}`)
        return false
      }
      return true
    },
  })),
  // Wiring stays source-level: both call sites live inside React components that
  // can't be invoked headlessly here. These confirm the helper is actually reached,
  // that its result flows into the generation call, and that the old OR-drop
  // (which discarded the analysis whenever a prompt was typed) has not returned.
  {
    name: 'wiring — studio path merges via the helper and feeds the result to generation',
    pass: () => {
      const provider = read(PROVIDER_PATH)
      return /const finalPrompt = mergePromptWithReferenceAnalysis\(state\.mainPrompt, combinedPrompt\)/.test(provider) &&
        !/state\.mainPrompt\.trim\(\)\s*\|\|\s*combinedPrompt\.trim\(\)/.test(provider) &&
        /basePrompt: generationPrompt/.test(provider) &&
        /displayPrompt: finalPrompt/.test(provider)
    },
  },
  {
    name: 'wiring — legacy path merges via the helper and feeds the result to generation',
    pass: () => {
      const panel = read(PANEL_PATH)
      return /const finalPrompt = mergePromptWithReferenceAnalysis\(mainPrompt, combinedPrompt\)/.test(panel) &&
        !/mainPrompt\.trim\(\)\s*\|\|\s*combinedPrompt\.trim\(\)/.test(panel) &&
        /basePrompt: finalPrompt/.test(panel)
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
  console.error('Prompt merge checks failed:')
  for (const failure of failures) {
    console.error(`- ${failure.name}`)
  }
  process.exit(1)
}

console.log(
  `Prompt merge checks passed (${checks.length} assertions; ${BEHAVIOR_CASES.length} executed against the real helper)`,
)
