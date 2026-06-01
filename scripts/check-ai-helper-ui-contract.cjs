const fs = require('fs')
const path = require('path')

const root = process.cwd()

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

const checks = [
  {
    name: 'AI helper drawer uses a wide responsive panel instead of the narrow legacy width',
    pass: () => {
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      return /AI_HELPER_PANEL_WIDTH\s*=\s*'min\(720px, 100vw\)'/.test(sidebar) &&
        /AI_HELPER_PANEL_EXPANDED_WIDTH\s*=\s*'min\(960px, 100vw\)'/.test(sidebar) &&
        !/w-\[400px\]/.test(sidebar)
    },
  },
  {
    name: 'AI helper header exposes an expand collapse control',
    pass: () => {
      const header = read('app/image-studio/components/AIHelper/AIHelperHeader.tsx')
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      return /isExpanded/.test(header) &&
        /onToggleExpanded/.test(header) &&
        /Maximize2/.test(header) &&
        /Minimize2/.test(header) &&
        /setIsExpanded/.test(sidebar)
    },
  },
  {
    name: 'AI helper suggestion cards use the wider layout',
    pass: () => {
      const card = read('app/image-studio/components/AIHelper/SuggestionCard.tsx')
      return /md:grid-cols-3/.test(card) &&
        /text-sm leading-6/.test(card) &&
        /PromptBody/.test(card)
    },
  },
  {
    name: 'AI helper composer is optimized for the wider drawer',
    pass: () => {
      const input = read('app/image-studio/components/AIHelper/ChatInput.tsx')
      return /items-end/.test(input) &&
        /min-h-\[96px\]/.test(input) &&
        /w-12/.test(input)
    },
  },
  {
    name: 'AI helper supports Codex-style structured agent actions',
    pass: () => {
      const hook = read('app/image-studio/hooks/useAIHelper.ts')
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      return /export interface AIHelperAction/.test(hook) &&
        /actions\?: AIHelperAction\[\]/.test(hook) &&
        /AGENTIC AI HELPER CONTRACT/.test(route) &&
        /normalizeHelperActions/.test(route) &&
        /actions: normalizeHelperActions/.test(route) &&
        /SmartActionBar/.test(sidebar)
    },
  },
  {
    name: 'AI helper sends current context and memory to logo mode',
    pass: () => {
      const hook = read('app/image-studio/hooks/useAIHelper.ts')
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      return /agentMemory/.test(hook) &&
        /buildAgentMemory/.test(hook) &&
        /sendLogoMessage\(userInput, currentPromptSettings\)/.test(sidebar) &&
        /currentPromptSettings/.test(route) &&
        /AGENT MEMORY/.test(route)
    },
  },
  {
    name: 'AI helper can apply suggestions and trigger generation',
    pass: () => {
      const hook = read('app/image-studio/hooks/useAIHelper.ts')
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      const page = read('app/image-studio/page.tsx')
      const logoPanel = read('app/image-studio/components/LogoPanel/LogoPanel.tsx')
      return /apply_and_generate/.test(hook) &&
        /apply_and_generate/.test(route) &&
        /onGenerateFromAIHelper/.test(sidebar) &&
        /handleAIGenerateRequest/.test(page) &&
        /logoPanelRef/.test(page) &&
        /forwardRef<LogoPanelRef/.test(logoPanel) &&
        /triggerGenerate:\s*handleGenerate/.test(logoPanel)
    },
  },
  {
    name: 'AI helper can critique and vary the latest generated output',
    pass: () => {
      const hook = read('app/image-studio/hooks/useAIHelper.ts')
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      const page = read('app/image-studio/page.tsx')
      return /critique_last_output/.test(hook) &&
        /make_variation/.test(hook) &&
        /sendActionMessage/.test(hook) &&
        /LATEST GENERATED OUTPUT ANALYSIS/.test(route) &&
        /latestOutputAnalysis/.test(route) &&
        /latestOutputs/.test(sidebar) &&
        /sendActionMessage\(action\.type/.test(sidebar) &&
        /latestLogoOutput/.test(page)
    },
  },
  {
    name: 'AI helper persists generation memory for cross-session iteration',
    pass: () => {
      const hook = read('app/image-studio/hooks/useAIHelper.ts')
      const persistence = read('app/image-studio/hooks/useAIHelperPersistence.ts')
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      return /AIHelperMemorySnapshot/.test(hook) &&
        /generationMemory/.test(hook) &&
        /rememberAssistantSuggestion/.test(hook) &&
        /loadStoredAgentMemory/.test(persistence) &&
        /saveAgentMemory/.test(persistence) &&
        /clearStoredAgentMemory/.test(persistence) &&
        /persistentGenerations/.test(route)
    },
  },
  {
    name: 'AI helper can compare latest output against the last reference',
    pass: () => {
      const hook = read('app/image-studio/hooks/useAIHelper.ts')
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      const actionBar = read('app/image-studio/components/AIHelper/SmartActionBar.tsx')
      return /compare_to_reference/.test(hook) &&
        /lastReferenceAnalysis/.test(hook) &&
        /REFERENCE MATCH COMPARISON/.test(route) &&
        /hasReferenceMemory/.test(route) &&
        /Compare Reference/.test(route) &&
        /compare_to_reference/.test(sidebar) &&
        /GitCompare/.test(actionBar)
    },
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
  console.error('AI helper UI contract checks failed:')
  for (const failure of failures) {
    console.error(`- ${failure.name}`)
  }
  process.exit(1)
}

console.log('AI helper UI contract checks passed')
