const fs = require('fs')
const path = require('path')

const root = process.cwd()

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath))

const checks = [
  {
    name: 'shared logo generation contract exists',
    pass: () => exists('lib/logo-generation-contract.ts'),
  },
  {
    name: 'contract defines exact-text overlay mode',
    pass: () => /exact-text-overlay/.test(read('lib/logo-generation-contract.ts')),
  },
  {
    name: 'logo API uses request parser helper',
    pass: () => /parseLogoGenerationRequest/.test(read('app/api/generate-logo/route.ts')),
  },
  {
    name: 'logo API uses image pipeline helper',
    pass: () => /generateLogoBaseImage/.test(read('app/api/generate-logo/route.ts')),
  },
  {
    name: 'prompt builder accepts text mode',
    pass: () => /LogoTextMode/.test(read('app/api/generate-logo/logo-prompts.ts')),
  },
  {
    name: 'advanced settings exposes text handling',
    pass: () => /Text Handling/.test(read('app/image-studio/components/Logo/LogoAdvancedSettings.tsx')),
  },
  {
    name: 'logo AI knowledge exposes prompt blueprint instructions',
    pass: () => /buildLogoPromptBlueprintInstructions/.test(read('app/image-studio/constants/ai-logo-knowledge.ts')),
  },
  {
    name: 'logo AI mode asks for reusable prompt suggestions',
    pass: () => /suggestions/.test(read('app/api/generate-prompt-suggestion/route.ts')) &&
      /generation-ready logo prompt/.test(read('app/api/generate-prompt-suggestion/route.ts')),
  },
  {
    name: 'logo AI messages preserve prompt suggestions',
    pass: () => /mode:\s*'logo'[\s\S]*suggestions:\s*data\.suggestions/.test(read('app/image-studio/hooks/useAIHelper.ts')),
  },
  {
    name: 'logo prompt enhancer can return a negative prompt',
    pass: () => /negativePrompt/.test(read('app/api/enhance-logo-prompt/route.ts')) &&
      /setNegativePrompt\(data\.negativePrompt\)/.test(read('app/image-studio/components/Logo/LogoPromptSection.tsx')),
  },
  {
    name: 'AI helper has a separate logo suggestion apply callback',
    pass: () => /onApplyLogoSuggestions/.test(read('app/image-studio/components/AIHelperSidebar.tsx')) &&
      /handleApplyLogoSuggestions/.test(read('app/image-studio/hooks/usePageState.ts')),
  },
  {
    name: 'logo suggestions switch to the logo generator when applied',
    pass: () => /handleApplyLogoSuggestions[\s\S]*setActiveTab\('logo'\)/.test(read('app/image-studio/hooks/usePageState.ts')),
  },
  {
    name: 'suggestion cards label their apply destination',
    pass: () => /Apply to Logo Generator/.test(read('app/image-studio/components/AIHelper/SuggestionCard.tsx')) &&
      /Apply to Image Generator/.test(read('app/image-studio/components/AIHelper/SuggestionCard.tsx')),
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
  console.error('Logo generator contract checks failed:')
  for (const failure of failures) {
    console.error(`- ${failure.name}`)
  }
  process.exit(1)
}

console.log('Logo generator contract checks passed')
