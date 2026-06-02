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
  {
    name: 'AI helper can restore remembered prompts and generate three variations',
    pass: () => {
      const hook = read('app/image-studio/hooks/useAIHelper.ts')
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      const page = read('app/image-studio/page.tsx')
      return /restore_memory_prompt/.test(hook) &&
        /generate_variation_set/.test(hook) &&
        /getLastPersistentGeneration/.test(route) &&
        /Restore Last Prompt/.test(route) &&
        /Generate 3 Variations/.test(route) &&
        /onGenerateFromAIHelper\?: \(mode: AIHelperMode, options\?: \{ imageCount\?: number \}\)/.test(sidebar) &&
        /action\.type === 'restore_memory_prompt'/.test(sidebar) &&
        /action\.type === 'generate_variation_set'/.test(sidebar) &&
        /options\?\.imageCount/.test(page)
    },
  },
  {
    name: 'AI helper preserves explicit user constraints for background typography and exact text',
    pass: () => {
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      return /extractPromptConstraints/.test(route) &&
        /EXPLICIT USER CONSTRAINTS \(hard requirements\)/.test(route) &&
        /applyPromptConstraintGuardrails/.test(route) &&
        /applyLogoConfigConstraintGuardrails/.test(route) &&
        /Hard background constraint/.test(route) &&
        /Hard typography constraint/.test(route) &&
        /Hard text constraint/.test(route) &&
        /wrong font/.test(route) &&
        /blue background/.test(route)
    },
  },
  {
    name: 'AI helper shows a visible context snapshot for current prompt references and latest outputs',
    pass: () => {
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      const snapshot = read('app/image-studio/components/AIHelper/ContextSnapshot.tsx')
      return /ContextSnapshot/.test(sidebar) &&
        /currentPromptSettings=/.test(sidebar) &&
        /uploadedImages=/.test(sidebar) &&
        /latestOutputs=/.test(sidebar) &&
        /Current Context/.test(snapshot) &&
        /Prompt loaded/.test(snapshot) &&
        /Reference image/.test(snapshot) &&
        /Latest output/.test(snapshot) &&
        /Mode/.test(snapshot)
    },
  },
  {
    name: 'AI helper offers context-aware suggested next prompts',
    pass: () => {
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      const chips = read('app/image-studio/components/AIHelper/PromptSuggestionChips.tsx')
      return /PromptSuggestionChips/.test(sidebar) &&
        /onSelectPrompt=\{setInput\}/.test(sidebar) &&
        /getPromptSuggestionChips/.test(chips) &&
        /Improve this prompt/.test(chips) &&
        /Match the reference/.test(chips) &&
        /Critique latest output/.test(chips) &&
        /Make exact text logo/.test(chips) &&
        /uploadedImages\.length > 0/.test(chips) &&
        /latestOutput\?\.url/.test(chips)
    },
  },
  {
    name: 'AI helper persists durable user preferences in agent memory',
    pass: () => {
      const hook = read('app/image-studio/hooks/useAIHelper.ts')
      const persistence = read('app/image-studio/hooks/useAIHelperPersistence.ts')
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      const snapshot = read('app/image-studio/components/AIHelper/ContextSnapshot.tsx')
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      return /kind: 'suggestion' \| 'reference' \| 'preference'/.test(hook) &&
        /persistentPreferences/.test(hook) &&
        /rememberUserPreference/.test(hook) &&
        /extractPreferenceMemory/.test(hook) &&
        /MAX_STORED_MEMORY = 60/.test(persistence) &&
        /persistentPreferences/.test(route) &&
        /PERSISTENT USER PREFERENCES/.test(route) &&
        /preferenceCount/.test(sidebar) &&
        /Preference memory/.test(snapshot)
    },
  },
  {
    name: 'AI helper preference memory can be inspected and forgotten',
    pass: () => {
      const hook = read('app/image-studio/hooks/useAIHelper.ts')
      const snapshot = read('app/image-studio/components/AIHelper/ContextSnapshot.tsx')
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      return /preferenceMemory/.test(hook) &&
        /forgetPreference/.test(hook) &&
        /filter\(\(snapshot\) => snapshot\.kind !== 'preference' \|\| snapshot\.timestamp !== timestamp\)/.test(hook) &&
        /preferenceMemory=/.test(sidebar) &&
        /onForgetPreference=/.test(sidebar) &&
        /Saved Preferences/.test(snapshot) &&
        /Forget preference/.test(snapshot) &&
        /onForgetPreference\?\.\(preference\.timestamp\)/.test(snapshot)
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
