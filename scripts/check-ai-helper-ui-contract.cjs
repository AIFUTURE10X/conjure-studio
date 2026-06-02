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
        /AI_HELPER_PANEL_EXPANDED_WIDTH\s*=\s*'100vw'/.test(sidebar) &&
        !/w-\[400px\]/.test(sidebar)
    },
  },
  {
    name: 'AI helper expanded mode uses the full canvas with organized settings and chat columns',
    pass: () => {
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      const snapshot = read('app/image-studio/components/AIHelper/ContextSnapshot.tsx')
      return /AI_HELPER_PANEL_EXPANDED_WIDTH\s*=\s*'100vw'/.test(sidebar) &&
        /helperWorkspaceClass/.test(sidebar) &&
        /halfCanvasWorkspaceStyle/.test(sidebar) &&
        /helperWorkspaceStyle/.test(sidebar) &&
        /helperSettingsRailClass/.test(sidebar) &&
        /helperConversationClass/.test(sidebar) &&
        /gridTemplateColumns: 'minmax\(0, 1fr\) minmax\(0, 1fr\)'/.test(sidebar) &&
        /isExpanded \? 'workspace' : 'drawer'/.test(sidebar) &&
        /variant\?: 'drawer' \| 'workspace'/.test(snapshot) &&
        /contextGroups/.test(snapshot) &&
        /Core Settings/.test(snapshot) &&
        /References/.test(snapshot) &&
        /Memory/.test(snapshot)
    },
  },
  {
    name: 'AI helper workspace settings rail is spacious and not cramped into tiny chips',
    pass: () => {
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      const snapshot = read('app/image-studio/components/AIHelper/ContextSnapshot.tsx')
      const quickSettings = read('app/image-studio/components/AIHelper/QuickSettingsPanel.tsx')
      return /gridTemplateColumns: 'minmax\(0, 1fr\) minmax\(0, 1fr\)'/.test(sidebar) &&
        /helperWorkspaceStyle/.test(sidebar) &&
        /ContextRow/.test(snapshot) &&
        /contextRowGridClass/.test(snapshot) &&
        /variant === 'workspace'/.test(snapshot) &&
        /Settings overview/.test(snapshot) &&
        /grid-cols-3/.test(snapshot) &&
        /quickSettingsGridClass/.test(quickSettings) &&
        /settingButtonClass/.test(quickSettings) &&
        /grid-cols-3/.test(quickSettings) &&
        /min-h-\[52px\]/.test(quickSettings)
    },
  },
  {
    name: 'AI helper exposes grouped quick settings controls in the canvas rail',
    pass: () => {
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      const quickSettings = read('app/image-studio/components/AIHelper/QuickSettingsPanel.tsx')
      return /QuickSettingsPanel/.test(sidebar) &&
        /handleQuickSettingClick/.test(sidebar) &&
        /runDirectSettingsDecisionCommand\(prompt\)/.test(sidebar) &&
        /onRunSetting=\{handleQuickSettingClick\}/.test(sidebar) &&
        !/onRunSetting=\{\(prompt\) => void runHelperPrompt\(prompt\)\}/.test(sidebar) &&
        /Quick Settings/.test(quickSettings) &&
        /settingsGroups/.test(quickSettings) &&
        /Background \/ PNG/.test(quickSettings) &&
        /Text Mode/.test(quickSettings) &&
        /Model/.test(quickSettings) &&
        /Resolution/.test(quickSettings) &&
        /use photoroom/.test(quickSettings) &&
        /native transparent png/.test(quickSettings) &&
        /normal logo with background/.test(quickSettings) &&
        /use exact text overlay/.test(quickSettings) &&
        /use chatgpt images 2.0/.test(quickSettings) &&
        /use gemini 3.1 flash/.test(quickSettings) &&
        /set 4k/.test(quickSettings)
    },
  },
  {
    name: 'AI helper settings overview reads the active mode settings',
    pass: () => {
      const snapshot = read('app/image-studio/components/AIHelper/ContextSnapshot.tsx')
      return /activeGeneratorModel/.test(snapshot) &&
        /mode === 'logo'\s*\?\s*currentPromptSettings\.logoSelectedModel/.test(snapshot) &&
        /activeResolution/.test(snapshot) &&
        /mode === 'logo'\s*\?\s*currentPromptSettings\.logoResolution/.test(snapshot) &&
        /formatModelLabel\(activeGeneratorModel\)/.test(snapshot) &&
        /value: activeResolution \|\| 'No resolution'/.test(snapshot)
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
        /actions: normalizePlannerActions/.test(route) &&
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
    name: 'AI helper operational context is mode-aware for image and logo settings',
    pass: () => {
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      return /function formatOperationalGeneratorContext\(mode: 'image' \| 'logo', currentPromptSettings: unknown\)/.test(route) &&
        /const isLogoMode = mode === 'logo'/.test(route) &&
        /Selected logo model/.test(route) &&
        /settings\.logoSelectedModel/.test(route) &&
        /settings\.logoResolution/.test(route) &&
        /Selected image model/.test(route) &&
        /formatOperationalGeneratorContext\('image', currentPromptSettings\)/.test(route) &&
        /formatOperationalGeneratorContext\('logo', currentPromptSettings\)/.test(route) &&
        /formatOperationalGeneratorContext\(mode, settings\)/.test(route)
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
    name: 'AI helper has a local capability guide entry point',
    pass: () => {
      const chips = read('app/image-studio/components/AIHelper/PromptSuggestionChips.tsx')
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      return /How can you help\?/.test(chips) &&
        /What can you do as my AI/.test(chips) &&
        /isCapabilityGuideRequest/.test(route) &&
        /buildLocalCapabilityGuideResponse/.test(route) &&
        /AI helper can help with:/.test(route) &&
        /Try asking:/.test(route)
    },
  },
  {
    name: 'AI helper has a local memory status entry point',
    pass: () => {
      const chips = read('app/image-studio/components/AIHelper/PromptSuggestionChips.tsx')
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      return /What do you remember\?/.test(chips) &&
        /What do you remember about this project/.test(chips) &&
        /isMemoryStatusRequest/.test(route) &&
        /buildLocalMemoryStatusResponse/.test(route) &&
        /Memory status:/.test(route) &&
        /Saved preferences:/.test(route)
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
    name: 'AI helper can apply image generator setting patches from chat suggestions',
    pass: () => {
      const hook = read('app/image-studio/hooks/useAIHelper.ts')
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      const handler = read('app/image-studio/hooks/useAISuggestionsHandler.ts')
      const page = read('app/image-studio/hooks/usePageState.ts')
      const card = read('app/image-studio/components/AIHelper/SuggestionCard.tsx')
      return /selectedModel\?: string/.test(hook) &&
        /bgRemovalMethod\?: string/.test(hook) &&
        /normalizeImagePromptSuggestions/.test(route) &&
        /selectedModel: normalizeImageSetting/.test(route) &&
        /bgRemovalMethod: normalizeImageSetting/.test(route) &&
        /Image settings patch/.test(route) &&
        /setSelectedModel: \(value: GenerationModel\) => void/.test(handler) &&
        /setUsePhotoRoomBgRemoval: \(enabled: boolean\) => void/.test(handler) &&
        /validImageModels/.test(handler) &&
        /setSelectedModel\(normalizedModel as GenerationModel\)/.test(handler) &&
        /setUsePhotoRoomBgRemoval\(normalizedBgRemovalMethod === 'photoroom'\)/.test(handler) &&
        /setSelectedModel: state\.setSelectedModel/.test(page) &&
        /setUsePhotoRoomBgRemoval: state\.setUsePhotoRoomBgRemoval/.test(page) &&
        /Model:/.test(card) &&
        /BG Method:/.test(card)
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
    name: 'AI helper builds strict change-control context for single-change follow-ups',
    pass: () => {
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      return /buildChangeControlContext/.test(route) &&
        /CHANGE CONTROL CONTEXT/.test(route) &&
        /Allowed change:/.test(route) &&
        /Locked elements:/.test(route) &&
        /Change budget: single requested edit/.test(route) &&
        /Do not reinterpret the whole concept/.test(route) &&
        /latest user request/.test(route) &&
        /activeTaskContext/.test(route) &&
        /single-change refinement/.test(route) &&
        /background-only refinement/.test(route) &&
        /typography-reference refinement/.test(route) &&
        /exact-text refinement/.test(route) &&
        /const changeControlContext = buildChangeControlContext/.test(route)
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
    name: 'AI helper can clear chat and memory from a direct local command',
    pass: () => {
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      return /runDirectClearMemoryCommand/.test(sidebar) &&
        /clearMemoryCommandTerms/.test(sidebar) &&
        /clear helper memory/.test(sidebar) &&
        /forget everything/.test(sidebar) &&
        /await clearHistory\(\)/.test(sidebar) &&
        /Helper memory cleared/.test(sidebar) &&
        /No generator settings were changed/.test(sidebar) &&
        /runDirectClearMemoryCommand\(userInput\)/.test(sidebar)
    },
  },
  {
    name: 'AI helper can change background removal settings from direct chat commands',
    pass: () => {
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      return /runDirectBackgroundRemovalCommand/.test(sidebar) &&
        /backgroundRemovalCommandTerms/.test(sidebar) &&
        /use photoroom/.test(sidebar) &&
        /use smart cleanup/.test(sidebar) &&
        /native transparent png/.test(sidebar) &&
        /turn off background removal/.test(sidebar) &&
        /bgRemovalMethod: 'photoroom'/.test(sidebar) &&
        /bgRemovalMethod: 'smart'/.test(sidebar) &&
        /bgRemovalMethod: 'native-transparent'/.test(sidebar) &&
        /selectedModel: 'gpt-image-2'/.test(sidebar) &&
        /Background removal set to/.test(sidebar) &&
        /runDirectBackgroundRemovalCommand\(userInput\)/.test(sidebar)
    },
  },
  {
    name: 'AI helper can change logo text mode model and resolution from direct chat commands',
    pass: () => {
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      return /runDirectLogoSettingsCommand/.test(sidebar) &&
        /logoSettingsCommandTerms/.test(sidebar) &&
        /use exact text overlay/.test(sidebar) &&
        /use ai text/.test(sidebar) &&
        /use chatgpt images 2\.0/.test(sidebar) &&
        /use gemini flash/.test(sidebar) &&
        /use gemini pro/.test(sidebar) &&
        /set 4k/.test(sidebar) &&
        /textMode: 'exact-text-overlay'/.test(sidebar) &&
        /textMode: 'ai-text'/.test(sidebar) &&
        /selectedModel: 'gpt-image-2'/.test(sidebar) &&
        /selectedModel: 'gemini-3\.1-flash-image-preview'/.test(sidebar) &&
        /selectedModel: 'gemini-3-pro-image-preview'/.test(sidebar) &&
        /resolution: '4K'/.test(sidebar) &&
        /Logo settings updated:/.test(sidebar) &&
        /runDirectLogoSettingsCommand\(userInput\)/.test(sidebar)
    },
  },
  {
    name: 'AI helper can apply mixed settings decisions and optionally generate',
    pass: () => {
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      return /buildDirectSettingsPatch/.test(sidebar) &&
        /applyDirectSettingsPatch/.test(sidebar) &&
        /settingsGenerateCommandTerms/.test(sidebar) &&
        /use photoroom and 4k/.test(sidebar) &&
        /exact text overlay and generate/.test(sidebar) &&
        /native transparent png and generate/.test(sidebar) &&
        /logo settings updated and generation started/.test(sidebar) &&
        /image settings updated and generation started/.test(sidebar) &&
        /onGenerateFromAIHelper\?\.\(targetMode\)/.test(sidebar) &&
        /No prompt text was changed/.test(sidebar) &&
        /changedLabels/.test(sidebar)
    },
  },
  {
    name: 'AI helper local commands explain preserve change and action like a planner',
    pass: () => {
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      return /buildLocalActionSummary/.test(sidebar) &&
        /Preserving:/.test(sidebar) &&
        /Changing:/.test(sidebar) &&
        /Action:/.test(sidebar) &&
        /Current prompt text and visual direction/.test(sidebar) &&
        /Latest suggestion prompt and stable design choices/.test(sidebar) &&
        /Only the requested refinement/.test(sidebar) &&
        /No prompt text was changed/.test(sidebar) &&
        /runDirectSettingsDecisionCommand/.test(sidebar) &&
        /runDirectSuggestionPatchCommand/.test(sidebar) &&
        /runDirectSuggestionCommand/.test(sidebar)
    },
  },
  {
    name: 'AI helper can patch the latest suggestion from natural single-change follow-ups',
    pass: () => {
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      return /runDirectSuggestionPatchCommand/.test(sidebar) &&
        /buildSuggestionPatchFromFollowUp/.test(sidebar) &&
        /appendPromptDirective/.test(sidebar) &&
        /singleChangePatchTerms/.test(sidebar) &&
        /make the background white/.test(sidebar) &&
        /make it transparent/.test(sidebar) &&
        /match reference font/.test(sidebar) &&
        /change only the font/.test(sidebar) &&
        /preserve every other approved element/.test(sidebar) &&
        /flat pure white/.test(sidebar) &&
        /transparent PNG with no visible background/.test(sidebar) &&
        /reference typography/.test(sidebar) &&
        /updateMessageSuggestions\(latest\.index, patchedSuggestions\)/.test(sidebar) &&
        /Updated the latest/.test(sidebar) &&
        /No model call was needed/.test(sidebar) &&
        /runDirectSuggestionPatchCommand\(userInput\)/.test(sidebar)
    },
  },
  {
    name: 'AI helper can patch and generate the latest suggestion from one natural follow-up',
    pass: () => {
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      return /patchGenerateCommandTerms/.test(sidebar) &&
        /make the background white and generate/.test(sidebar) &&
        /make it transparent and generate/.test(sidebar) &&
        /shouldGenerateAfterPatch/.test(sidebar) &&
        /onGenerateFromAIHelper\?\.\(latest\.targetMode\)/.test(sidebar) &&
        /Updated the latest/.test(sidebar) &&
        /and started generation/.test(sidebar) &&
        /No extra model call was needed/.test(sidebar)
    },
  },
  {
    name: 'AI helper can patch named logo or image suggestions from any helper mode',
    pass: () => {
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      return /const getLatestSuggestionMessage = \(targetMode\?: AIHelperMode\)/.test(sidebar) &&
        /const requestedPatchMode = detectRequestedHelperMode\(userInput\)/.test(sidebar) &&
        /const patchMode = requestedPatchMode \|\| mode/.test(sidebar) &&
        /getLatestSuggestionMessage\(patchMode\)/.test(sidebar) &&
        /if \(patchMode !== mode\) setMode\(patchMode\)/.test(sidebar) &&
        /make the logo background white/.test(sidebar) &&
        /make the image background white/.test(sidebar) &&
        /match the logo reference font/.test(sidebar) &&
        /Updated the latest \$\{latest\.targetMode\} suggestion/.test(sidebar)
    },
  },
  {
    name: 'AI helper can patch exact brand text from natural chat commands',
    pass: () => {
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      return /extractRequestedBrandText/.test(sidebar) &&
        /brandTextPatchTerms/.test(sidebar) &&
        /make the logo say A86 Residence/.test(sidebar) &&
        /change the logo text to A86 Residence/.test(sidebar) &&
        /brand name is A86 Residence/.test(sidebar) &&
        /set exact visible brand text to/.test(sidebar) &&
        /exact brand text/.test(sidebar) &&
        /textMode = 'exact-text-overlay'/.test(sidebar) &&
        /misspelled brand text/.test(sidebar) &&
        /wrong brand name/.test(sidebar) &&
        /requestedBrandText/.test(sidebar)
    },
  },
  {
    name: 'AI helper can patch complaint-style misses from the latest suggestion',
    pass: () => {
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      return /complaintStylePatchTerms/.test(sidebar) &&
        /it gave me a blue background/.test(sidebar) &&
        /background is blue/.test(sidebar) &&
        /still has a background/.test(sidebar) &&
        /not a true png/.test(sidebar) &&
        /font is wrong/.test(sidebar) &&
        /ignored the reference/.test(sidebar) &&
        /does not match the reference/.test(sidebar) &&
        /failed background correction/.test(sidebar) &&
        /failed transparent PNG correction/.test(sidebar) &&
        /failed reference match correction/.test(sidebar) &&
        /rejected blue background/.test(sidebar) &&
        /reference drift/.test(sidebar)
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
      const input = read('app/image-studio/components/AIHelper/ChatInput.tsx')
      return /displayMessage\?: string/.test(hook) &&
        /setPendingFollowUp/.test(sidebar) &&
        /pendingFollowUp/.test(sidebar) &&
        /Answering follow-up/.test(sidebar) &&
        /Clear follow-up/.test(sidebar) &&
        /CLARIFICATION CONTINUATION/.test(sidebar) &&
        /Original question:/.test(sidebar) &&
        /User answer:/.test(sidebar) &&
        /Active design brief:/.test(sidebar) &&
        /Current generator prompt:/.test(sidebar) &&
        /displayMessage: userInput/.test(sidebar) &&
        /pendingQuestion=\{pendingFollowUp\?\.prompt\}/.test(sidebar) &&
        /pendingQuestion\?: string/.test(input) &&
        /textareaRef/.test(input) &&
        /useEffect/.test(input) &&
        /Answer the follow-up/.test(input) &&
        /placeholder=\{pendingQuestion/.test(input) &&
        /aria-label=\{pendingQuestion \? 'Answer follow-up question'/.test(input)
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
    name: 'AI helper context snapshot shows logo generator reference images',
    pass: () => {
      const page = read('app/image-studio/page.tsx')
      const snapshot = read('app/image-studio/components/AIHelper/ContextSnapshot.tsx')
      return /logoHasReferenceImage: logoGeneratorContext\.hasReferenceImage/.test(page) &&
        /logoReferenceMode: logoGeneratorContext\.referenceMode/.test(page) &&
        /mode === 'logo' \? Boolean\(currentPromptSettings\.logoHasReferenceImage\)/.test(snapshot) &&
        /mode === 'logo' \? currentPromptSettings\.logoReferenceMode/.test(snapshot) &&
        /Generator ref:/.test(snapshot)
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
    name: 'AI helper carries a shared project brief across image and logo modes',
    pass: () => {
      const hook = read('app/image-studio/hooks/useAIHelper.ts')
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      const snapshot = read('app/image-studio/components/AIHelper/ContextSnapshot.tsx')
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      return /sharedProjectBrief\?: string/.test(hook) &&
        /getSharedProjectBrief/.test(hook) &&
        /designBrief\?: string/.test(hook) &&
        /designBrief: typeof data\.designBrief === 'string'/.test(hook) &&
        /getSharedProjectBrief\(messages, generationMemory\)/.test(hook) &&
        /generationMemoryWithBrief/.test(hook) &&
        /sharedProjectBrief=/.test(sidebar) &&
        /Shared project brief:/.test(sidebar) &&
        /sharedProjectBrief\?: string/.test(snapshot) &&
        /Shared project/.test(snapshot) &&
        /formatSharedProjectBrief/.test(route) &&
        /SHARED PROJECT BRIEF/.test(route) &&
        /sharedProjectBrief: memory\.sharedProjectBrief/.test(route)
    },
  },
  {
    name: 'AI helper tracks a live active task snapshot for natural follow-up edits',
    pass: () => {
      const hook = read('app/image-studio/hooks/useAIHelper.ts')
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      const snapshot = read('app/image-studio/components/AIHelper/ContextSnapshot.tsx')
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      return /export interface AIHelperActiveTask/.test(hook) &&
        /buildActiveTaskContext/.test(hook) &&
        /parseDesignBriefLine/.test(hook) &&
        /activeTaskContext: buildActiveTaskContext\(messages, mode\)/.test(hook) &&
        /activeTaskContext=/.test(sidebar) &&
        /activeTaskContext\?: AIHelperActiveTask/.test(snapshot) &&
        /Active Task/.test(snapshot) &&
        /Goal:/.test(snapshot) &&
        /Preserve:/.test(snapshot) &&
        /Next:/.test(snapshot) &&
        /formatActiveTaskSnapshot/.test(route) &&
        /ACTIVE TASK SNAPSHOT/.test(route) &&
        /latest user request/.test(route) &&
        /activeTaskContext: memory\.activeTaskContext/.test(route)
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
    name: 'AI helper runs a planner policy and shows a prompt self-check audit',
    pass: () => {
      const hook = read('app/image-studio/hooks/useAIHelper.ts')
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      const auditCard = read('app/image-studio/components/AIHelper/PromptQualityCard.tsx')
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      return /plannerDecision\?: string/.test(hook) &&
        /promptQualityChecklist\?: string\[\]/.test(hook) &&
        /plannerDecision: data\.plannerDecision/.test(hook) &&
        /promptQualityChecklist: data\.promptQualityChecklist/.test(hook) &&
        /PromptQualityCard/.test(sidebar) &&
        /msg\.promptQualityChecklist/.test(sidebar) &&
        /Prompt self-check/.test(auditCard) &&
        /Planner/.test(auditCard) &&
        /normalizePromptQualityChecklist/.test(route) &&
        /PROMPT PLANNER POLICY/.test(route) &&
        /PROMPT SELF-CHECK/.test(route) &&
        /plannerDecision/.test(route) &&
        /promptQualityChecklist/.test(route) &&
        /missing essential/.test(route) &&
        /reference match/.test(route) &&
        /locked elements/.test(route) &&
        /background/.test(route) &&
        /exact text/.test(route)
    },
  },
  {
    name: 'AI helper asks one clarifying question when essential prompt details are missing',
    pass: () => {
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
      return /buildClarificationGate/.test(route) &&
        /CLARIFICATION GATE/.test(route) &&
        /missing essential information/.test(route) &&
        /brand text/.test(route) &&
        /main subject/.test(route) &&
        /single follow-up question/.test(route) &&
        /buildClarificationAction/.test(route) &&
        /normalizePlannerActions/.test(route) &&
        /plannerDecision === 'ask_follow_up'/.test(route) &&
        /suggestions: shouldAskFollowUp \? undefined/.test(route) &&
        /type: 'ask_follow_up'/.test(route) &&
        /Answer question/.test(route) &&
        /pendingFollowUp/.test(sidebar) &&
        /Answering follow-up/.test(sidebar)
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
