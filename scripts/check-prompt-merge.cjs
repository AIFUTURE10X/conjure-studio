const fs = require('fs')
const path = require('path')

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

const helper = read('app/image-studio/utils/build-image-prompt.ts')
const provider = read('app/image-studio/context/ImageGenerationProvider.tsx')
const panel = read('app/image-studio/components/GeneratePanel.tsx')

const checks = [
  {
    // The helper must JOIN the typed prompt with the reference analysis (keeping
    // both), not OR them (which dropped the analysis whenever a prompt was typed).
    name: 'shared merge helper joins typed prompt with reference analysis, with a neutral fallback',
    pass: () =>
      /export function mergePromptWithReferenceAnalysis/.test(helper) &&
      /\.filter\(Boolean\)\.join\('\. '\)\s*\|\|\s*'a beautiful scene'/.test(helper),
  },
  {
    name: 'studio generate path merges via the helper instead of OR-dropping the analysis',
    pass: () =>
      /mergePromptWithReferenceAnalysis\(state\.mainPrompt, combinedPrompt\)/.test(provider) &&
      !/state\.mainPrompt\.trim\(\)\s*\|\|\s*combinedPrompt\.trim\(\)/.test(provider),
  },
  {
    name: 'legacy generate path merges via the helper instead of OR-dropping the analysis',
    pass: () =>
      /mergePromptWithReferenceAnalysis\(mainPrompt, combinedPrompt\)/.test(panel) &&
      !/mainPrompt\.trim\(\)\s*\|\|\s*combinedPrompt\.trim\(\)/.test(panel),
  },
]

const failures = checks.filter((check) => {
  try {
    return !check.pass()
  } catch {
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

console.log('Prompt merge checks passed')
