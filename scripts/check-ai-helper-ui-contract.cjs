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
  {
    name: 'AI helper runs prompt preflight checks before generation',
    pass: () => {
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      const preflight = read('app/image-studio/components/AIHelper/PromptPreflightPanel.tsx')
      return /PromptPreflightPanel/.test(sidebar) &&
        /onAskHelper=\{setInput\}/.test(sidebar) &&
        /getPromptPreflightIssues/.test(preflight) &&
        /Prompt Preflight/.test(preflight) &&
        /Background unclear/.test(preflight) &&
        /Exact text risk/.test(preflight) &&
        /Reference not mentioned/.test(preflight) &&
        /Negative prompt weak/.test(preflight) &&
        /Fix with helper/.test(preflight)
    },
  },
  {
    name: 'AI helper preflight detects current setting conflicts before generation',
    pass: () => {
      const preflight = read('app/image-studio/components/AIHelper/PromptPreflightPanel.tsx')
      return /logoTextMode\?: string/.test(preflight) &&
        /logoBgRemovalMethod\?: string/.test(preflight) &&
        /logoSelectedModel\?: string/.test(preflight) &&
        /imageBgRemovalMethod\?: string/.test(preflight) &&
        /Exact text mode mismatch/.test(preflight) &&
        /Visible background conflict/.test(preflight) &&
        /Native PNG model mismatch/.test(preflight) &&
        /PNG cleanup off/.test(preflight) &&
        /logoTextMode !== 'exact-text-overlay'/.test(preflight) &&
        /logoBgRemovalMethod === 'native-transparent' && logoSelectedModel !== 'gpt-image-2'/.test(preflight) &&
        /Use exact text overlay/.test(preflight) &&
        /turn off transparent PNG/.test(preflight)
    },
  },
  {
    name: 'AI helper can apply logo generator setting patches from chat suggestions',
    pass: () => {
      const hook = read('app/image-studio/hooks/useAIHelper.ts')
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      const card = read('app/image-studio/components/AIHelper/SuggestionCard.tsx')
      const page = read('app/image-studio/page.tsx')
      const logoPanel = read('app/image-studio/components/LogoPanel/LogoPanel.tsx')
      return /textMode\?: string/.test(hook) &&
        /bgRemovalMethod\?: string/.test(hook) &&
        /selectedModel\?: string/.test(hook) &&
        /normalizeLogoPromptSuggestions/.test(route) &&
        /textMode: normalizeLogoSetting/.test(route) &&
        /bgRemovalMethod: normalizeLogoSetting/.test(route) &&
        /Logo settings patch/.test(route) &&
        /\.\.\.suggestions/.test(sidebar) &&
        /Text Mode:/.test(card) &&
        /BG Method:/.test(card) &&
        /extractLogoSettingsPatch/.test(page) &&
        /pendingLogoSettings/.test(page) &&
        /onClearPendingSettings/.test(page) &&
        /LogoGeneratorSettingsPatch/.test(logoPanel) &&
        /pendingLogoSettings/.test(logoPanel) &&
        /applyPendingLogoSettings/.test(logoPanel) &&
        /setTextMode/.test(logoPanel) &&
        /setBgRemovalMethod/.test(logoPanel)
    },
  },
  {
    name: 'AI helper suggested prompts and preflight fixes can run immediately',
    pass: () => {
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      const chips = read('app/image-studio/components/AIHelper/PromptSuggestionChips.tsx')
      const preflight = read('app/image-studio/components/AIHelper/PromptPreflightPanel.tsx')
      return /runHelperPrompt/.test(sidebar) &&
        /handleSend = async \(\) => runHelperPrompt/.test(sidebar) &&
        /onRunPrompt=\{\(prompt\) => void runHelperPrompt\(prompt\)\}/.test(sidebar) &&
        /onRunFix=\{\(prompt\) => void runHelperPrompt\(prompt\)\}/.test(sidebar) &&
        /onRunPrompt\?: \(prompt: string\) => void/.test(chips) &&
        /onRunFix\?: \(prompt: string\) => void/.test(preflight) &&
        /Run now/.test(chips) &&
        /Run now/.test(preflight)
    },
  },
  {
    name: 'AI helper requests can be stopped while loading',
    pass: () => {
      const hook = read('app/image-studio/hooks/useAIHelper.ts')
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      const input = read('app/image-studio/components/AIHelper/ChatInput.tsx')
      return /AbortController/.test(hook) &&
        /abortControllerRef/.test(hook) &&
        /cancelRequest/.test(hook) &&
        /const requestController = new AbortController\(\)/.test(hook) &&
        /signal: requestController\.signal/.test(hook) &&
        /requestController\.signal\.aborted/.test(hook) &&
        /abortControllerRef\.current === requestController/.test(hook) &&
        /error instanceof DOMException && error\.name === 'AbortError'/.test(hook) &&
        /onCancelRequest=\{cancelRequest\}/.test(sidebar) &&
        /onCancelRequest: \(\) => void/.test(input) &&
        /Stop/.test(input)
    },
  },
  {
    name: 'AI helper exposes targeted refinement chips for iterative fixes',
    pass: () => {
      const chips = read('app/image-studio/components/AIHelper/PromptSuggestionChips.tsx')
      return /Fix background/.test(chips) &&
        /Match reference font/.test(chips) &&
        /Preserve exact text/.test(chips) &&
        /Change only one thing/.test(chips) &&
        /Keep the strongest parts/.test(chips) &&
        /do not change the composition/.test(chips)
    },
  },
  {
    name: 'AI helper builds an iteration intent brief for natural follow-up edits',
    pass: () => {
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      return /buildIterationIntentBrief/.test(route) &&
        /ITERATION INTENT BRIEF/.test(route) &&
        /single-change refinement/.test(route) &&
        /background-only refinement/.test(route) &&
        /typography-reference refinement/.test(route) &&
        /exact-text refinement/.test(route) &&
        /Preserve stable elements unless the user explicitly changes them/.test(route) &&
        /const iterationIntentBrief = buildIterationIntentBrief/.test(route)
    },
  },
  {
    name: 'AI helper can run direct apply and generate commands from chat',
    pass: () => {
      const hook = read('app/image-studio/hooks/useAIHelper.ts')
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      return /appendLocalMessage/.test(hook) &&
        /getLatestSuggestionMessage/.test(sidebar) &&
        /runDirectSuggestionCommand/.test(sidebar) &&
        /generateCommandTerms/.test(sidebar) &&
        /applyCommandTerms/.test(sidebar) &&
        /Applied the latest/.test(sidebar) &&
        /Started generation from the latest/.test(sidebar)
    },
  },
  {
    name: 'AI helper can run natural latest-output critique compare and variation commands from chat',
    pass: () => {
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      return /runDirectLatestOutputCommand/.test(sidebar) &&
        /critiqueCommandTerms/.test(sidebar) &&
        /compareCommandTerms/.test(sidebar) &&
        /variationCommandTerms/.test(sidebar) &&
        /sendActionMessage\(directAction/.test(sidebar) &&
        /Critiquing the latest/.test(sidebar) &&
        /Comparing the latest/.test(sidebar) &&
        /Making a new variation/.test(sidebar)
    },
  },
  {
    name: 'AI helper routes clear logo or image requests to the correct mode',
    pass: () => {
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      return /detectRequestedHelperMode/.test(sidebar) &&
        /logoRequestTerms/.test(sidebar) &&
        /imageRequestTerms/.test(sidebar) &&
        /const targetMode = !prompt \? detectRequestedHelperMode\(userInput\) \|\| mode : mode/.test(sidebar) &&
        /if \(targetMode !== mode\) setMode\(targetMode\)/.test(sidebar) &&
        /targetMode === 'logo' \? await sendLogoMessage/.test(sidebar)
    },
  },
  {
    name: 'AI helper supports answer mode for clarifying follow-up questions',
    pass: () => {
      const hook = read('app/image-studio/hooks/useAIHelper.ts')
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      return /displayMessage\?: string/.test(hook) &&
        /setPendingFollowUp/.test(sidebar) &&
        /pendingFollowUp/.test(sidebar) &&
        /Answering follow-up/.test(sidebar) &&
        /Clear follow-up/.test(sidebar) &&
        /Clarifying question:/.test(sidebar) &&
        /User answer:/.test(sidebar) &&
        /displayMessage: userInput/.test(sidebar)
    },
  },
  {
    name: 'AI helper receives and shows active generator operation context',
    pass: () => {
      const page = read('app/image-studio/page.tsx')
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      const snapshot = read('app/image-studio/components/AIHelper/ContextSnapshot.tsx')
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      return /selectedModel: state\.selectedModel/.test(page) &&
        /imageSize: state\.imageSize/.test(page) &&
        /imageCount: state\.imageCount/.test(page) &&
        /activeTab: state\.activeTab/.test(page) &&
        /hasReferenceImage: Boolean\(state\.referenceImage\)/.test(page) &&
        /formatOperationalGeneratorContext/.test(route) &&
        /OPERATIONAL GENERATOR CONTEXT/.test(route) &&
        /selectedModel\?: string/.test(sidebar) &&
        /imageSize\?: string/.test(snapshot) &&
        /Model:/.test(snapshot) &&
        /Resolution:/.test(snapshot) &&
        /Count:/.test(snapshot) &&
        /Generator ref/.test(snapshot)
    },
  },
  {
    name: 'AI helper receives and explains background removal and true PNG context',
    pass: () => {
      const state = read('app/image-studio/hooks/useImageStudioState.ts')
      const generateTab = read('app/image-studio/components/PageTabs/GenerateTab.tsx')
      const generatePanel = read('app/image-studio/components/GeneratePanel.tsx')
      const page = read('app/image-studio/page.tsx')
      const logoPanel = read('app/image-studio/components/LogoPanel/LogoPanel.tsx')
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      const snapshot = read('app/image-studio/components/AIHelper/ContextSnapshot.tsx')
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      return /usePhotoRoomBgRemoval/.test(state) &&
        /setUsePhotoRoomBgRemoval/.test(state) &&
        /usePhotoRoomBgRemoval=/.test(generateTab) &&
        /onPhotoRoomBgRemovalChange=/.test(generateTab) &&
        /usePhotoRoomBgRemoval\?: boolean/.test(generatePanel) &&
        /onPhotoRoomBgRemovalChange\?: \(enabled: boolean\) => void/.test(generatePanel) &&
        /imageBgRemovalMethod: state\.usePhotoRoomBgRemoval \? 'photoroom' : 'smart'/.test(page) &&
        /logoGeneratorContext/.test(page) &&
        /onLogoContextChange/.test(logoPanel) &&
        /logoBgRemovalMethod\?: string/.test(sidebar) &&
        /imageBgRemovalMethod\?: string/.test(snapshot) &&
        /PhotoRoom BG/.test(snapshot) &&
        /Native PNG/.test(snapshot) &&
        /formatBackgroundRemovalContext/.test(route) &&
        /BACKGROUND REMOVAL CONTEXT/.test(route) &&
        /PhotoRoom/.test(route) &&
        /native-transparent/.test(route) &&
        /transparent PNG/.test(route)
    },
  },
  {
    name: 'AI helper carries a visible working design brief with each suggestion',
    pass: () => {
      const hook = read('app/image-studio/hooks/useAIHelper.ts')
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      const card = read('app/image-studio/components/AIHelper/DesignBriefCard.tsx')
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      return /designBrief\?: string/.test(hook) &&
        /designBrief: data\.designBrief/.test(hook) &&
        /DesignBriefCard/.test(sidebar) &&
        /msg\.designBrief/.test(sidebar) &&
        /Working brief/.test(card) &&
        /What I understood/.test(card) &&
        /What to preserve/.test(card) &&
        /What changes next/.test(card) &&
        /"designBrief"/.test(route) &&
        /Working design brief/.test(route)
    },
  },
  {
    name: 'AI helper carries the active working brief forward across follow-up turns',
    pass: () => {
      const hook = read('app/image-studio/hooks/useAIHelper.ts')
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      const snapshot = read('app/image-studio/components/AIHelper/ContextSnapshot.tsx')
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      return /activeDesignBrief\?: string/.test(hook) &&
        /getActiveDesignBrief/.test(hook) &&
        /activeDesignBrief: getActiveDesignBrief\(messages, mode\)/.test(hook) &&
        /activeDesignBrief=/.test(sidebar) &&
        /Active brief/.test(snapshot) &&
        /formatActiveTaskBrief/.test(route) &&
        /ACTIVE TASK BRIEF/.test(route) &&
        /activeDesignBrief: memory\.activeDesignBrief/.test(route) &&
        /\[Working Design Brief:/.test(route)
    },
  },
  {
    name: 'AI helper supports a plan then execute flow with revise plan action',
    pass: () => {
      const hook = read('app/image-studio/hooks/useAIHelper.ts')
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      const planCard = read('app/image-studio/components/AIHelper/ExecutionPlanCard.tsx')
      const actionBar = read('app/image-studio/components/AIHelper/SmartActionBar.tsx')
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      return /executionPlan\?: string\[\]/.test(hook) &&
        /executionPlan: data\.executionPlan/.test(hook) &&
        /revise_plan/.test(hook) &&
        /ExecutionPlanCard/.test(sidebar) &&
        /msg\.executionPlan/.test(sidebar) &&
        /action\.type === 'revise_plan'/.test(sidebar) &&
        /What would you like to change in this plan/.test(sidebar) &&
        /Creative plan/.test(planCard) &&
        /Plan step/.test(planCard) &&
        /PencilLine/.test(actionBar) &&
        /normalizeExecutionPlan/.test(route) &&
        /"executionPlan"/.test(route) &&
        /Creative execution plan/.test(route) &&
        /Revise Plan/.test(route)
    },
  },
  {
    name: 'AI helper supports diagnostic-only chat without forcing generator changes',
    pass: () => {
      const hook = read('app/image-studio/hooks/useAIHelper.ts')
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      const diagnosticCard = read('app/image-studio/components/AIHelper/DiagnosticCard.tsx')
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      return /responseMode\?: 'suggestion' \| 'diagnostic'/.test(hook) &&
        /diagnosticFindings\?: string\[\]/.test(hook) &&
        /responseMode: data\.responseMode/.test(hook) &&
        /diagnosticFindings: data\.diagnosticFindings/.test(hook) &&
        /DiagnosticCard/.test(sidebar) &&
        /msg\.diagnosticFindings/.test(sidebar) &&
        /Diagnosis/.test(diagnosticCard) &&
        /No generator changes/.test(diagnosticCard) &&
        /normalizeResponseMode/.test(route) &&
        /normalizeDiagnosticFindings/.test(route) &&
        /isDiagnosticOnlyRequest/.test(route) &&
        /"responseMode": "diagnostic"/.test(route) &&
        /Diagnostic-only questions/.test(route)
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
