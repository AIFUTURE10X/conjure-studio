import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"
import { buildLogoSystemPrompt } from "@/app/image-studio/constants/ai-logo-knowledge"
import {
  CREATIVE_DIRECTION_SINGLE_GROUPS,
  DECORATIVE_ELEMENT_OPTIONS,
  buildCreativeDirectionPrompt,
  getCreativeDirectionOption,
  hasCreativeDirection,
  normalizeCreativeDirection,
  type CreativeDirectionState,
} from "@/app/image-studio/constants/creative-direction-options"
import { getGeminiApiKey, getGeminiApiKeyNames } from "@/lib/gemini-api-key"
import {
  LOGO_BACKGROUND_REMOVAL_METHODS,
  LOGO_GENERATION_MODELS,
  LOGO_TEXT_MODES,
} from "@/lib/logo-generation-contract"

// Initialize Gemini with API key check
const apiKey = getGeminiApiKey()
if (!apiKey) {
  console.error(`[v0 API] ${getGeminiApiKeyNames()} is not set in environment variables`)
}
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

const CREATIVE_DIRECTION_OPTION_CONTEXT = [
  ...CREATIVE_DIRECTION_SINGLE_GROUPS.map((group) => (
    `${group.label}: ${group.options.map((option) => option.label).join(", ")}`
  )),
  `Decorative Elements: ${DECORATIVE_ELEMENT_OPTIONS.map((option) => option.label).join(", ")}`,
].join("\n")

const IMAGE_GENERATION_MODELS = [
  'gemini-3.1-flash-image-preview',
  'gemini-3-pro-image-preview',
  'gpt-image-2',
] as const

const IMAGE_BACKGROUND_REMOVAL_METHODS = ['photoroom', 'smart'] as const

type HelperActionType =
  | 'apply_suggestions'
  | 'apply_and_generate'
  | 'apply_logo_config'
  | 'critique_last_output'
  | 'make_variation'
  | 'compare_to_reference'
  | 'restore_memory_prompt'
  | 'generate_variation_set'
  | 'copy_prompt'
  | 'switch_to_image'
  | 'switch_to_logo'
  | 'ask_follow_up'
  | 'revise_plan'

interface HelperAction {
  type: HelperActionType
  label: string
  description?: string
  prompt?: string
  negativePrompt?: string
  target?: 'image' | 'logo'
}

type HelperResponseMode = 'suggestion' | 'diagnostic'
type HelperPlannerDecision = 'ask_follow_up' | 'suggest_prompt' | 'diagnose' | 'iterate_from_current' | 'compare_to_reference'

interface PromptConstraint {
  key: string
  label: string
  promptPhrase: string
  negativePhrase?: string
}

interface ClarificationGate {
  shouldAsk: boolean
  question: string
  reason: string
}

interface ImagePromptSuggestions {
  prompt: string
  negativePrompt?: string
  style: string
  cameraAngle: string
  cameraLens: string
  aspectRatio: string
  styleStrength: 'subtle' | 'moderate' | 'strong'
  resolution: string
  selectedModel?: string
  bgRemovalMethod?: string
}

const HELPER_ACTION_TYPES = new Set<HelperActionType>([
  'apply_suggestions',
  'apply_and_generate',
  'apply_logo_config',
  'critique_last_output',
  'make_variation',
  'compare_to_reference',
  'restore_memory_prompt',
  'generate_variation_set',
  'copy_prompt',
  'switch_to_image',
  'switch_to_logo',
  'ask_follow_up',
  'revise_plan',
])

const AGENTIC_AI_HELPER_CONTRACT = `AGENTIC AI HELPER CONTRACT:
- Act like a smart in-app creative agent, not a generic prompt writer
- Read the current generator settings, uploaded reference analysis, AGENT MEMORY, and recent conversation before answering
- Preserve what the user liked from previous prompts and change only what the user asks to change
- If the user reports a miss such as wrong font, wrong background, wrong colors, or poor reference match, diagnose the likely cause and return a corrected prompt/settings
- Prefer useful action buttons over long instructions; include 1-3 actions that match the response
- Use "apply_suggestions" when you generated a prompt/settings payload the app should apply
- Use "apply_and_generate" when the user asks you to do it, run it, try it, make it, or generate the next version
- Use "critique_last_output" when a generated output is available and the user may want diagnosis
- Use "make_variation" when a generated output is available and the user may want the next iteration
- Use "compare_to_reference" when there is a latest output and a remembered reference analysis
- Use "restore_memory_prompt" when a remembered prompt exists and the user may want to go back
- Use "generate_variation_set" for image mode when the user may want several options at once
- Use "copy_prompt" when the prompt is useful but should not immediately change settings
- Use "switch_to_logo" or "switch_to_image" only when the user is in the wrong mode
- Use "ask_follow_up" only when one short answer is required before making a good prompt
- Use "revise_plan" when the user may want to adjust your plan before applying or generating
- Diagnostic-only questions should use "responseMode": "diagnostic", return diagnosticFindings, and avoid apply/generate actions
- Return "designBrief" as a compact Working design brief with three lines: What I understood, What to preserve, and What changes next
- Return "executionPlan" as a Creative execution plan with 2-4 short steps before the user applies or generates
- Return "plannerDecision" and "promptQualityChecklist" so the UI can show the reasoning boundary before the user applies or generates`

const PROMPT_PLANNER_POLICY = `PROMPT PLANNER POLICY:
- Decide first, then answer: classify the turn with "plannerDecision" as "ask_follow_up", "suggest_prompt", "diagnose", "iterate_from_current", or "compare_to_reference".
- Use "ask_follow_up" only when missing essential information would make the result misleading, such as no brand text for a wordmark, no subject for an image, or contradictory background/reference instructions.
- If a reasonable prompt can be made from the current context, proceed with clear assumptions instead of asking unnecessary questions.
- For follow-up edits, prefer "iterate_from_current" and preserve locked elements from CHANGE CONTROL CONTEXT.
- For diagnostic-only questions, use "diagnose" and do not include apply/generate actions.
- For latest-output plus reference comparison, use "compare_to_reference".
- When CLARIFICATION GATE says ask, ask a single follow-up question, return "plannerDecision": "ask_follow_up", set suggestions to null, and include one "ask_follow_up" action with the same question in action.prompt.

PROMPT SELF-CHECK:
- Return "promptQualityChecklist" as 3-5 short audit lines.
- Include a reference match line when reference context exists, naming typography, layout, palette, or composition.
- Include a locked elements line when CHANGE CONTROL CONTEXT has a preserve list or single requested edit.
- Include a background line when the request or settings mention white, blue, transparent, true PNG, PhotoRoom, or background removal.
- Include an exact text or typography line when logo text, spelling, capitalization, font, lettering, or typeface matters.
- Include a generator settings line when model, resolution, text mode, or background-removal settings need to change.`

const SCENARIO_QUALITY_GATES = `SCENARIO QUALITY GATES:
- Reference wordmark typography: when the user gives or describes a clean script/serif/sans wordmark reference, match the letter proportions, stroke contrast, spacing, capitalization, and visual rhythm. Do not replace a clean wordmark reference with dot matrix, generic geometric lettering, unrelated 3D icon systems, or decorative effects unless the user asks for that change.
- Exact brand text: if the user cares about a brand name, spelling, capitalization, or wording, use exact-text-overlay when available, repeat the exact text in the prompt, and do not invent words, suffixes, slogans, or alternate spellings.
- Background intent: white background means visible flat pure white #FFFFFF; transparent PNG means no visible background and needs true PNG cleanup such as PhotoRoom or native transparent output. If both are requested together, ask which output is wanted before generating.
- Single-change follow-up: when CHANGE CONTROL CONTEXT says single requested edit, change only the named attribute, preserve locked elements, and do not reinterpret the concept, palette, typography, icon, camera, or composition.
- Generator settings: if the request needs professional true PNG cleanup, prefer PhotoRoom. Use native-transparent only when the selected model supports it, such as gpt-image-2.`

function normalizeHelperActions(rawActions: unknown, fallbackActions: HelperAction[] = []): HelperAction[] {
  if (!Array.isArray(rawActions)) return fallbackActions

  const actions = rawActions
    .map((rawAction): HelperAction | null => {
      if (!rawAction || typeof rawAction !== 'object') return null
      const action = rawAction as Record<string, unknown>
      const type = typeof action.type === 'string' ? action.type : ''
      if (!HELPER_ACTION_TYPES.has(type as HelperActionType)) return null
      const label = typeof action.label === 'string' && action.label.trim()
        ? action.label.trim()
        : type.replace(/_/g, ' ')

      return {
        type: type as HelperActionType,
        label,
        ...(typeof action.description === 'string' && action.description.trim() ? { description: action.description.trim() } : {}),
        ...(typeof action.prompt === 'string' && action.prompt.trim() ? { prompt: action.prompt.trim() } : {}),
        ...(typeof action.negativePrompt === 'string' && action.negativePrompt.trim() ? { negativePrompt: action.negativePrompt.trim() } : {}),
        ...(action.target === 'image' || action.target === 'logo' ? { target: action.target } : {}),
      }
    })
    .filter((action): action is HelperAction => Boolean(action))

  return actions.length > 0 ? actions.slice(0, 7) : fallbackActions
}

function buildClarificationAction(mode: 'image' | 'logo', question: string): HelperAction {
  return {
    type: 'ask_follow_up',
    label: 'Answer question',
    description: 'Reply with this missing detail so the helper can make the prompt',
    prompt: question,
    target: mode,
  }
}

function normalizePlannerActions(
  rawActions: unknown,
  fallbackActions: HelperAction[],
  plannerDecision: HelperPlannerDecision,
  mode: 'image' | 'logo',
  clarificationQuestion: string,
  responseMode: HelperResponseMode
): HelperAction[] {
  const applyActionTypes: HelperActionType[] = ['apply_suggestions', 'apply_and_generate', 'apply_logo_config']

  if (plannerDecision === 'ask_follow_up') {
    const normalizedActions = normalizeHelperActions(rawActions, [])
    const askAction = normalizedActions.find((action) => action.type === 'ask_follow_up' && action.prompt)
    return [askAction || buildClarificationAction(mode, clarificationQuestion)]
  }

  return normalizeHelperActions(rawActions, fallbackActions)
    .filter((action) => responseMode !== 'diagnostic' || !applyActionTypes.includes(action.type))
}

function normalizeExecutionPlan(rawPlan: unknown): string[] {
  const rawSteps = Array.isArray(rawPlan)
    ? rawPlan
    : typeof rawPlan === 'string'
      ? rawPlan.split(/\n|;/)
      : []

  return rawSteps
    .map((step) => typeof step === 'string' ? step.trim() : '')
    .map((step) => step.replace(/^[-*\d.)\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 4)
}

function normalizeResponseMode(rawMode: unknown, diagnosticOnly = false): HelperResponseMode {
  return rawMode === 'diagnostic' || diagnosticOnly ? 'diagnostic' : 'suggestion'
}

function normalizePlannerDecision(
  rawDecision: unknown,
  responseMode: HelperResponseMode,
  hasSuggestions: boolean,
  hasOutput: boolean,
  hasReference: boolean
): HelperPlannerDecision {
  if (
    rawDecision === 'ask_follow_up' ||
    rawDecision === 'suggest_prompt' ||
    rawDecision === 'diagnose' ||
    rawDecision === 'iterate_from_current' ||
    rawDecision === 'compare_to_reference'
  ) {
    return rawDecision
  }

  if (responseMode === 'diagnostic') return 'diagnose'
  if (hasOutput && hasReference) return 'compare_to_reference'
  if (hasOutput) return 'iterate_from_current'
  return hasSuggestions ? 'suggest_prompt' : 'ask_follow_up'
}

function normalizePromptQualityChecklist(rawChecklist: unknown, fallbackItems: string[] = []): string[] {
  const rawItems = Array.isArray(rawChecklist)
    ? rawChecklist
    : typeof rawChecklist === 'string'
      ? rawChecklist.split(/\n|;/)
      : []
  const checklist = rawItems
    .map((item) => typeof item === 'string' ? item.trim() : '')
    .map((item) => item.replace(/^[-*\d.)\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 5)

  return checklist.length > 0
    ? checklist
    : fallbackItems.map((item) => item.trim()).filter(Boolean).slice(0, 5)
}

function normalizeDiagnosticFindings(rawFindings: unknown, fallbackMessage = ''): string[] {
  const rawItems = Array.isArray(rawFindings)
    ? rawFindings
    : typeof rawFindings === 'string'
      ? rawFindings.split(/\n|;/)
      : []
  const findings = rawItems
    .map((finding) => typeof finding === 'string' ? finding.trim() : '')
    .map((finding) => finding.replace(/^[-*\d.)\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 5)

  if (findings.length > 0) return findings
  return fallbackMessage.trim() ? [fallbackMessage.trim()] : []
}

function isDiagnosticOnlyRequest(message: unknown): boolean {
  if (typeof message !== 'string') return false
  const text = message.toLowerCase()
  const diagnosticTerms = [
    'why ',
    'what went wrong',
    'what is wrong',
    "what's wrong",
    'explain ',
    'diagnose',
    'is this using',
    'does this use',
    'how does',
    'what should i change',
    'what background',
    'what api',
    'what model',
  ]
  const generationTerms = [
    'create',
    'generate',
    'make me',
    'write a prompt',
    'rewrite',
    'fix it',
    'apply',
    'run it',
    'try it',
  ]

  return diagnosticTerms.some((term) => text.includes(term)) && !generationTerms.some((term) => text.includes(term))
}

function hasLatestOutput(currentPromptSettings: unknown): boolean {
  if (!currentPromptSettings || typeof currentPromptSettings !== 'object') return false
  const settings = currentPromptSettings as Record<string, unknown>
  const latestOutput = settings.latestOutput
  if (latestOutput && typeof latestOutput === 'object' && (latestOutput as Record<string, unknown>).hasOutput) return true
  const latestImageOutput = settings.latestImageOutput
  if (latestImageOutput && typeof latestImageOutput === 'object' && (latestImageOutput as Record<string, unknown>).hasOutput) return true
  const latestLogoOutput = settings.latestLogoOutput
  return Boolean(latestLogoOutput && typeof latestLogoOutput === 'object' && (latestLogoOutput as Record<string, unknown>).hasOutput)
}

function hasReferenceMemory(agentMemory: unknown): boolean {
  return Boolean(
    agentMemory &&
    typeof agentMemory === 'object' &&
    typeof (agentMemory as Record<string, unknown>).lastReferenceAnalysis === 'string' &&
    ((agentMemory as Record<string, unknown>).lastReferenceAnalysis as string).trim()
  )
}

function hasCurrentSettingsReference(mode: 'image' | 'logo', currentPromptSettings: unknown): boolean {
  if (!currentPromptSettings || typeof currentPromptSettings !== 'object') return false
  const settings = currentPromptSettings as Record<string, unknown>
  if (mode === 'logo') {
    return Boolean(settings.logoHasReferenceImage || (settings.logoReferenceMode && settings.logoReferenceMode !== 'none'))
  }
  return Boolean(settings.hasReferenceImage || (settings.referenceImageMode && settings.referenceImageMode !== 'none'))
}

function formatCurrentGeneratorReferenceContext(mode: 'image' | 'logo', currentPromptSettings: unknown): string {
  if (!currentPromptSettings || typeof currentPromptSettings !== 'object') {
    return 'No generator reference image is loaded.'
  }

  const settings = currentPromptSettings as Record<string, unknown>
  const hasSettingsReference = hasCurrentSettingsReference(mode, settings)
  if (!hasSettingsReference) {
    return 'No generator reference image is loaded.'
  }

  const referenceMode = mode === 'logo'
    ? getStringSetting(settings, 'logoReferenceMode') || 'loaded'
    : getStringSetting(settings, 'referenceImageMode') || 'loaded'
  const generatorLabel = mode === 'logo' ? 'Logo generator' : 'Image generator'
  const matchingTargets = mode === 'logo'
    ? 'typography, letterforms, wordmark spacing, icon geometry, palette, background, and overall layout'
    : 'subject, composition, pose, palette, lighting, background, and overall style'

  return [
    `- ${generatorLabel} reference image: loaded (${referenceMode}). Treat this as active reference context even if no separate AI-helper image analysis is available.`,
    `- Reference-following rule: write prompts that explicitly preserve and match the loaded reference ${matchingTargets} unless the user asks to change one of those elements.`,
    '- If the prompt is applied and generated, assume the generator can use its loaded reference image for image-to-image guidance; do not behave as though no reference exists.',
  ].join('\n')
}

function getLastPersistentGeneration(agentMemory: unknown): { prompt: string; negativePrompt?: string } | null {
  if (!agentMemory || typeof agentMemory !== 'object') return null
  const persistentGenerations = (agentMemory as Record<string, unknown>).persistentGenerations
  if (!Array.isArray(persistentGenerations)) return null
  const lastGeneration = [...persistentGenerations]
    .reverse()
    .find((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && typeof (item as Record<string, unknown>).prompt === 'string'))
  if (!lastGeneration?.prompt) return null
  return {
    prompt: String(lastGeneration.prompt).trim(),
    ...(typeof lastGeneration.negativePrompt === 'string' && lastGeneration.negativePrompt.trim() ? { negativePrompt: lastGeneration.negativePrompt.trim() } : {}),
  }
}

function defaultHelperActions(
  mode: 'image' | 'logo',
  hasSuggestions: boolean,
  hasLogoConfig = false,
  hasOutput = false,
  hasReference = false,
  lastPersistentGeneration: { prompt: string; negativePrompt?: string } | null = null
): HelperAction[] {
  const actions: HelperAction[] = []
  if (hasSuggestions) {
    actions.push({
      type: 'apply_suggestions',
      label: mode === 'logo' ? 'Apply to Logo Generator' : 'Apply to Image Generator',
      description: 'Use this prompt and settings in the generator',
      target: mode,
    })
    actions.push({
      type: 'apply_and_generate',
      label: mode === 'logo' ? 'Apply and Generate Logo' : 'Apply and Generate Image',
      description: 'Apply these settings and start generation',
      target: mode,
    })
    actions.push({
      type: 'revise_plan',
      label: 'Revise Plan',
      description: 'Tell the helper what to change before applying',
      prompt: 'What would you like to change in this plan before I rewrite the prompt?',
      target: mode,
    })
    actions.push({
      type: 'copy_prompt',
      label: 'Copy Prompt',
      description: 'Copy the generated prompt',
      target: mode,
    })
    if (mode === 'image') {
      actions.push({
        type: 'generate_variation_set',
        label: 'Generate 3 Variations',
        description: 'Apply this prompt and generate three image options',
        target: mode,
      })
    }
  }
  if (lastPersistentGeneration) {
    actions.push({
      type: 'restore_memory_prompt',
      label: 'Restore Last Prompt',
      description: 'Restore the last remembered prompt from helper memory',
      prompt: lastPersistentGeneration.prompt,
      ...(lastPersistentGeneration.negativePrompt ? { negativePrompt: lastPersistentGeneration.negativePrompt } : {}),
      target: mode,
    })
  }
  if (hasOutput) {
    actions.push({
      type: 'critique_last_output',
      label: 'Critique Latest',
      description: 'Analyze the latest generated output and fix the prompt',
      target: mode,
    })
    actions.push({
      type: 'make_variation',
      label: 'Make Variation',
      description: 'Create a new prompt from the latest output',
      target: mode,
    })
    if (hasReference) {
      actions.push({
        type: 'compare_to_reference',
        label: 'Compare Reference',
        description: 'Compare the latest output against the remembered reference',
        target: mode,
      })
    }
  }
  if (mode === 'logo' && hasLogoConfig) {
    actions.push({
      type: 'apply_logo_config',
      label: 'Apply Logo Effects',
      description: 'Apply the suggested configurator settings',
      target: 'logo',
    })
  }
  return actions
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term))
}

function buildClarificationGate({
  mode,
  message,
  currentPrompt,
  agentMemory,
  hasReference,
  hasOutput,
}: {
  mode: 'image' | 'logo'
  message: unknown
  currentPrompt?: unknown
  agentMemory?: unknown
  hasReference: boolean
  hasOutput: boolean
}): ClarificationGate {
  const requestText = typeof message === 'string' ? message.trim() : ''
  const request = requestText.toLowerCase()
  const hasCurrentPrompt = typeof currentPrompt === 'string' && currentPrompt.trim().length > 0
  const memory = agentMemory && typeof agentMemory === 'object'
    ? agentMemory as Record<string, unknown>
    : {}
  const activeTaskContext = memory.activeTaskContext && typeof memory.activeTaskContext === 'object'
    ? memory.activeTaskContext as Record<string, unknown>
    : {}
  const hasActiveTask = Object.keys(activeTaskContext).length > 0 || (typeof memory.activeDesignBrief === 'string' && memory.activeDesignBrief.trim().length > 0)
  const hasLegacyClarificationAnswer = request.includes('clarifying question:') && request.includes('user answer:')
  const hasStructuredClarificationContinuation = request.includes('clarification continuation') && request.includes('original question:') && request.includes('user answer:')
  const hasClarificationAnswer = hasLegacyClarificationAnswer || hasStructuredClarificationContinuation
  const hasUsefulContext = hasCurrentPrompt || hasReference || hasOutput || hasActiveTask || hasClarificationAnswer
  const asksForCreativeOutput = includesAny(request, ['create', 'generate', 'make', 'design', 'write', 'prompt', 'build'])
  const asksForLogo = mode === 'logo' || includesAny(request, ['logo', 'wordmark', 'brand mark', 'brandmark', 'icon'])
  const asksForImage = mode === 'image' && includesAny(request, ['image', 'picture', 'photo', 'scene', 'illustration', 'art', 'graphic'])
  const hasQuotedText = /["'“”‘’][^"'“”‘’]{2,}["'“”‘’]/.test(requestText)
  const hasLikelyBrandText = hasQuotedText || /\b[A-Z0-9][A-Za-z0-9&.-]*(?:\s+[A-Z0-9][A-Za-z0-9&.-]*){0,4}\b/.test(requestText.replace(/\b(Create|Generate|Make|Design|Write|Prompt|Logo|Image|Brand|For|A|An|The)\b/g, ''))
  const hasSpecificSubject = request
    .replace(/\b(create|generate|make|design|write|a|an|the|image|picture|photo|scene|illustration|art|graphic|prompt|for|me|please)\b/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length >= 2

  if (!hasUsefulContext && asksForCreativeOutput && asksForLogo && !hasLikelyBrandText) {
    return {
      shouldAsk: true,
      question: 'What exact brand text should appear in the logo?',
      reason: 'missing essential information: brand text for a logo or wordmark request; ask a single follow-up question.',
    }
  }

  if (!hasUsefulContext && asksForCreativeOutput && asksForImage && !hasSpecificSubject) {
    return {
      shouldAsk: true,
      question: 'What is the main subject of the image?',
      reason: 'missing essential information: main subject for an image request; ask a single follow-up question.',
    }
  }

  if (includesAny(request, ['transparent', 'true png', 'no background', 'remove background']) && includesAny(request, ['white background', 'blue background', 'dark background', 'visible background'])) {
    return {
      shouldAsk: true,
      question: 'Should the final output be a transparent PNG or use a visible background?',
      reason: 'missing essential information: background instructions conflict; ask a single follow-up question.',
    }
  }

  return {
    shouldAsk: false,
    question: 'No clarification needed.',
    reason: hasUsefulContext
      ? 'Enough current context exists to proceed with assumptions.'
      : 'No missing essential information detected.',
  }
}

function formatClarificationGate(gate: ClarificationGate): string {
  return [
    `- Decision: ${gate.shouldAsk ? 'ask a single follow-up question' : 'proceed with assumptions'}`,
    `- Question: ${gate.question}`,
    `- Reason: ${gate.reason}`,
    '- If asking, do not produce generator settings or apply/generate actions yet.',
  ].join('\n')
}

function buildClarificationResponse(mode: 'image' | 'logo', gate: ClarificationGate) {
  return NextResponse.json({
    message: gate.question,
    responseMode: 'suggestion',
    plannerDecision: 'ask_follow_up',
    designBrief: `What I understood: More detail is needed before making a reliable ${mode} prompt.\nWhat to preserve: No generator changes yet.\nWhat changes next: Answer the clarification question so I can produce the prompt.`,
    executionPlan: ['Ask one missing-essential question', 'Use the answer with the current context', 'Return a generation-ready prompt after the answer'],
    diagnosticFindings: [],
    promptQualityChecklist: [
      'Planner: missing essential information was detected before calling the AI model.',
      `Clarification: ${gate.reason}`,
      'Locked elements: no generator settings or prompt changes were applied yet.',
    ],
    suggestions: undefined,
    logoConfig: mode === 'logo' ? {} : undefined,
    actions: [buildClarificationAction(mode, gate.question)],
    ...(mode === 'logo' ? { mode: 'logo' } : {}),
  })
}

function isOperationalDiagnosticRequest(message: unknown): boolean {
  if (typeof message !== 'string') return false
  const text = message.toLowerCase()
  const operationalTerms = [
    'what background remover',
    'which background remover',
    'background remover',
    'background removal api',
    'background removal service',
    'what api',
    'which api',
    'what model',
    'which model',
    'current model',
    'selected model',
    'current settings',
    'what settings',
    'photoroom',
    'native png',
    'true png',
    'transparent png',
    'remove bg',
    'remove background',
    'is this using',
    'does this use',
  ]
  const generationTerms = [
    'create',
    'generate',
    'make me',
    'write a prompt',
    'rewrite',
    'fix it',
    'apply',
    'run it',
    'try it',
  ]

  return (isDiagnosticOnlyRequest(message) || includesAny(text, operationalTerms)) && !includesAny(text, generationTerms)
}

function formatGenerationModelLabel(model: string): string {
  if (!model) return 'unknown'
  if (model === 'gpt-image-2') return 'ChatGPT Images 2.0 (gpt-image-2)'
  if (model === 'gemini-3.1-flash-image-preview') return 'Gemini 3.1 Flash Image Preview'
  if (model === 'gemini-3-pro-image-preview') return 'Gemini 3 Pro Image Preview'
  return model
}

function getActiveGeneratorModel(settings: Record<string, unknown>, mode: 'image' | 'logo'): string {
  const preferredKey = mode === 'logo' ? 'logoSelectedModel' : 'selectedModel'
  const fallbackKey = mode === 'logo' ? 'selectedModel' : 'logoSelectedModel'
  return getStringSetting(settings, preferredKey) || getStringSetting(settings, fallbackKey)
}

function getActiveBackgroundRemovalSummary(settings: Record<string, unknown>, mode: 'image' | 'logo'): string {
  if (mode === 'logo') {
    const method = getStringSetting(settings, 'logoBgRemovalMethod')
    const provider = getStringSetting(settings, 'logoBgRemovalProvider')
    const enabled = settings.logoBgRemovalEnabled !== false && Boolean(method) && method !== 'none'
    return formatBackgroundRemovalMethod(method, provider, enabled)
  }

  const method = getStringSetting(settings, 'imageBgRemovalMethod') || (settings.imagePhotoRoomBgRemovalEnabled ? 'photoroom' : 'smart')
  const provider = getStringSetting(settings, 'imageBgRemovalProvider') || (method === 'photoroom' ? 'PhotoRoom' : 'Smart local cleanup')
  const enabled = settings.imageBgRemovalEnabled !== false && Boolean(method)
  return formatBackgroundRemovalMethod(method, provider, enabled)
}

function buildOperationalDiagnosticFindings(mode: 'image' | 'logo', currentPromptSettings: unknown): string[] {
  const settings = currentPromptSettings && typeof currentPromptSettings === 'object'
    ? currentPromptSettings as Record<string, unknown>
    : {}
  const currentModel = getActiveGeneratorModel(settings, mode)
  const backgroundRemoval = getActiveBackgroundRemovalSummary(settings, mode)
  const operationalContext = formatOperationalGeneratorContext(settings)
  const backgroundRemovalContext = formatBackgroundRemovalContext(settings)

  return [
    `Current model: ${formatGenerationModelLabel(currentModel)}`,
    `Background removal: ${backgroundRemoval}`,
    'PhotoRoom: API post-generation cleanup; the image model creates the artwork first, then PhotoRoom removes the background if selected.',
    'Native PNG: model-side transparent output only when using ChatGPT Images 2.0 (gpt-image-2) with native-transparent selected.',
    `Current settings snapshot:\n${operationalContext}\n${backgroundRemovalContext ? `\n${backgroundRemovalContext}` : ''}`,
  ]
}

function buildLocalDiagnosticResponse(mode: 'image' | 'logo', message: unknown, currentPromptSettings: unknown) {
  if (!isOperationalDiagnosticRequest(message)) return null

  const diagnosticFindings = buildOperationalDiagnosticFindings(mode, currentPromptSettings)
  return NextResponse.json({
    message: [
      `I checked the current ${mode} generator settings before Gemini is required.`,
      diagnosticFindings.slice(0, 4).join('\n'),
      'So: PhotoRoom is background removal after generation. Native PNG is only model-side transparency with ChatGPT Images 2.0 when native-transparent is selected.',
    ].join('\n\n'),
    responseMode: 'diagnostic',
    plannerDecision: 'diagnose',
    designBrief: '',
    executionPlan: ['Read current generator settings', 'Identify the active model and background-removal path', 'Explain the PNG/background behavior without changing generator settings'],
    diagnosticFindings,
    promptQualityChecklist: [
      'Planner: answered from current local generator settings before Gemini is required.',
      'Current model and background removal settings were reported without creating a new prompt.',
      'Diagnostic answer returned no apply or generate actions.',
    ],
    suggestions: undefined,
    logoConfig: mode === 'logo' ? {} : undefined,
    actions: [],
    ...(mode === 'logo' ? { mode: 'logo' } : {}),
  })
}

function isCapabilityGuideRequest(message: unknown): boolean {
  if (typeof message !== 'string') return false
  const text = message.toLowerCase().trim()
  const guideTerms = [
    'what can you do',
    'how can you help',
    'how do i use you',
    'how should i use you',
    'what can this helper do',
    'what can the helper do',
    'what can my ai helper do',
    'how do i use this helper',
    'show me what you can do',
    'explain what you can do',
  ]
  const creativeGenerationTerms = [
    'create a',
    'create an',
    'generate a',
    'generate an',
    'make me',
    'write a prompt for',
    'design a',
    'design an',
  ]

  return includesAny(text, guideTerms) && !includesAny(text, creativeGenerationTerms)
}

function buildLocalCapabilityGuideResponse(
  mode: 'image' | 'logo',
  message: unknown,
  currentPromptSettings: unknown,
  agentMemory?: unknown
) {
  if (!isCapabilityGuideRequest(message)) return null

  const settings = currentPromptSettings && typeof currentPromptSettings === 'object'
    ? currentPromptSettings as Record<string, unknown>
    : {}
  const currentModel = getActiveGeneratorModel(settings, mode)
  const backgroundRemoval = getActiveBackgroundRemovalSummary(settings, mode)
  const hasReference = hasReferenceMemory(agentMemory) || Boolean(
    mode === 'logo'
      ? settings.logoHasReferenceImage
      : settings.hasReferenceImage
  )
  const hasOutput = hasLatestOutput(settings)
  const findings = [
    `AI helper can help with: prompt writing, reference matching, follow-up edits, latest-output critique, generator settings, and background/PNG diagnosis.`,
    `Current context: ${mode === 'logo' ? 'Logo' : 'Image'} mode, ${formatGenerationModelLabel(currentModel)}, latest output ${hasOutput ? 'available' : 'not available yet'}.`,
    `Reference matching: ${hasReference ? 'reference context is available, so I can preserve typography, layout, palette, background, and composition.' : 'upload a reference image or generate once, then I can compare and tighten the next prompt.'}`,
    `Follow-up edits: ask for one natural change such as "keep everything else but make the background white" or "match the reference font more closely."`,
    `PhotoRoom / Native PNG: ${backgroundRemoval} Try asking: "what background remover is this using?", "compare latest to reference", or "apply and generate it."`,
  ]

  return NextResponse.json({
    message: [
      `I checked the current ${mode} helper state before Gemini is required.`,
      findings.join('\n'),
      'Talk to it like a creative assistant: describe the goal, upload a reference when style matters, then ask for small follow-up changes after each result.',
    ].join('\n\n'),
    responseMode: 'diagnostic',
    plannerDecision: 'diagnose',
    designBrief: '',
    executionPlan: ['Explain available helper workflows', 'Read current mode, model, reference, output, and PNG settings', 'Suggest natural next requests without changing generator settings'],
    diagnosticFindings: findings,
    promptQualityChecklist: [
      'Planner: local capability guide selected, no generator changes should be applied.',
      'Context: current model, reference status, latest output status, and background-removal path were checked.',
      'Next move: user can ask for reference matching, follow-up edits, critique, or apply/generate commands.',
    ],
    suggestions: undefined,
    logoConfig: mode === 'logo' ? {} : undefined,
    actions: [],
    ...(mode === 'logo' ? { mode: 'logo' } : {}),
  })
}

function addPromptConstraint(constraints: PromptConstraint[], constraint: PromptConstraint): void {
  if (constraints.some((item) => item.key === constraint.key)) return
  constraints.push(constraint)
}

function collectPromptConstraintsFromText(rawText: unknown, source: 'latest' | 'current', hasReference = false): PromptConstraint[] {
  if (typeof rawText !== 'string' || !rawText.trim()) return []
  const text = rawText.toLowerCase()
  const constraints: PromptConstraint[] = []

  if (includesAny(text, ['white background', 'background white', 'plain white', 'pure white', '#ffffff', 'white backdrop'])) {
    addPromptConstraint(constraints, {
      key: 'background:white',
      label: source === 'latest' ? 'Latest request requires a white background' : 'Current prompt uses a white background',
      promptPhrase: 'Hard background constraint: use a flat pure white #FFFFFF background only.',
      negativePhrase: 'blue background, dark background, gradient background, textured background, colored backdrop',
    })
  }

  if (includesAny(text, ['transparent background', 'true png', 'png transparency', 'no background', 'remove background', 'without background'])) {
    addPromptConstraint(constraints, {
      key: 'background:transparent',
      label: source === 'latest' ? 'Latest request requires transparent/no background' : 'Current prompt requires transparent/no background',
      promptPhrase: 'Hard background constraint: transparent PNG/no background; isolate only the subject or logo.',
      negativePhrase: 'solid background, colored background, scene background, shadowed backdrop, rectangle backdrop',
    })
  }

  if (includesAny(text, ['no blue background', 'not a blue background', 'without blue background'])) {
    addPromptConstraint(constraints, {
      key: 'background:no-blue',
      label: 'Blue background is explicitly rejected',
      promptPhrase: 'Hard color constraint: do not use a blue background.',
      negativePhrase: 'blue background, navy background, cyan background',
    })
  }

  if (includesAny(text, ['font', 'typeface', 'typography', 'lettering', 'script', 'cursive', 'serif', 'sans serif', 'wordmark', 'handwritten'])) {
    addPromptConstraint(constraints, {
      key: 'typography',
      label: source === 'latest' ? 'Latest request includes typography direction' : 'Current prompt includes typography direction',
      promptPhrase: 'Hard typography constraint: match the requested/reference font style and lettering proportions.',
      negativePhrase: 'wrong font, generic font, dot matrix lettering, distorted typography, illegible text',
    })
  }

  if (includesAny(text, ['exact text', 'exact wording', 'exact words', 'exact spelling', 'spelling', 'same text', 'brand name', 'capitalization'])) {
    addPromptConstraint(constraints, {
      key: 'exact-text',
      label: 'Exact text and spelling are important',
      promptPhrase: 'Hard text constraint: preserve exact wording, spelling, capitalization, and spacing; do not add extra words.',
      negativePhrase: 'misspelled text, extra words, random letters, altered brand name, incorrect capitalization',
    })
  }

  if (hasReference && includesAny(text, ['reference', 'same as', 'match this', 'like this', 'closer to', 'follow that', 'use this image'])) {
    addPromptConstraint(constraints, {
      key: 'reference-match',
      label: 'Reference image matching is required',
      promptPhrase: 'Hard reference constraint: use the uploaded or remembered reference as the visual target; match composition, typography, spacing, palette, and background unless the user changes them.',
      negativePhrase: 'style drift, wrong composition, wrong palette, wrong background, mismatched typography',
    })
  }

  return constraints
}

function extractPromptConstraints(
  message: unknown,
  currentPrompt: unknown,
  currentNegativePrompt: unknown,
  hasReference = false
): PromptConstraint[] {
  const latestConstraints = collectPromptConstraintsFromText(message, 'latest', hasReference)
  const currentConstraints = [
    ...collectPromptConstraintsFromText(currentPrompt, 'current', hasReference),
    ...collectPromptConstraintsFromText(currentNegativePrompt, 'current', hasReference),
  ]
  const constraints: PromptConstraint[] = []

  for (const constraint of [...latestConstraints, ...currentConstraints]) {
    addPromptConstraint(constraints, constraint)
  }

  return constraints
}

function formatPromptConstraints(constraints: PromptConstraint[]): string {
  if (constraints.length === 0) return 'None detected'
  return constraints
    .map((constraint) => `- ${constraint.label}: ${constraint.promptPhrase}${constraint.negativePhrase ? ` Negative prompt must block: ${constraint.negativePhrase}.` : ''}`)
    .join('\n')
}

function buildPromptQualityFallback({
  mode,
  responseMode,
  hasReference,
  hasOutput,
  hasSuggestions,
  constraints,
  hasStrictChangeRequest,
}: {
  mode: 'image' | 'logo'
  responseMode: HelperResponseMode
  hasReference: boolean
  hasOutput: boolean
  hasSuggestions: boolean
  constraints: PromptConstraint[]
  hasStrictChangeRequest: boolean
}): string[] {
  const hasBackgroundConstraint = constraints.some((constraint) => constraint.key.startsWith('background:'))
  const hasTypographyConstraint = constraints.some((constraint) => constraint.key === 'typography')
  const hasExactTextConstraint = constraints.some((constraint) => constraint.key === 'exact-text')
  const lines = [
    responseMode === 'diagnostic'
      ? 'Planner: diagnostic response selected, no generator changes should be applied.'
      : `Planner: ${hasSuggestions ? 'generation-ready prompt returned' : 'missing essential prompt details, follow-up may be needed'}.`,
    hasReference
      ? 'Reference match: reference context was included for typography, layout, palette, or composition.'
      : 'Reference match: no active reference context is available for this turn.',
    hasStrictChangeRequest || hasOutput
      ? 'Locked elements: current draft and preserve list should stay stable except for the requested change.'
      : `Locked elements: preserve the core ${mode === 'logo' ? 'logo identity, text, layout, and palette' : 'subject, composition, style, and palette'}.`,
    hasBackgroundConstraint
      ? 'Background: hard background or transparent PNG constraint was promoted into the prompt and negative prompt.'
      : 'Background: no hard background change was detected.',
    hasTypographyConstraint || hasExactTextConstraint
      ? 'Exact text/typography: text, spelling, capitalization, lettering, and font constraints were protected.'
      : 'Exact text/typography: no exact text or typography constraint was detected.',
  ]

  return lines.slice(0, 5)
}

function buildIterationIntentBrief({
  mode,
  message,
  currentPrompt,
  hasReference,
  hasOutput,
  hasPreviousPrompt,
}: {
  mode: 'image' | 'logo'
  message: unknown
  currentPrompt?: unknown
  hasReference: boolean
  hasOutput: boolean
  hasPreviousPrompt: boolean
}): string {
  const request = typeof message === 'string' ? message.toLowerCase() : ''
  const activePrompt = typeof currentPrompt === 'string' && currentPrompt.trim()
  const hasIterationContext = Boolean(activePrompt || hasOutput || hasPreviousPrompt)
  const subjectLabel = mode === 'logo' ? 'logo, icon, wordmark, layout, exact text, typography, palette, material, and background' : 'subject, composition, style, palette, lighting, camera, and background'
  const lines: string[] = ['- Preserve stable elements unless the user explicitly changes them.']

  if (hasIterationContext && includesAny(request, ['same', 'keep', 'only', 'just', 'but', 'now', 'fix', 'change', 'make it', 'more ', 'less ', 'closer', 'background', 'font', 'text'])) {
    lines.push('- Treat this as an iteration from the current draft, not a brand-new concept.')
  }

  if (includesAny(request, ['change only', 'only change', 'one thing', 'single change', 'just change', 'keep everything else', 'do not change', "don't change"])) {
    lines.push(`- single-change refinement: make only the requested edit; preserve ${subjectLabel}.`)
  }

  if (includesAny(request, ['background', 'backdrop', 'white background', 'transparent', 'true png', 'no background', 'remove background', 'blue background'])) {
    lines.push(`- background-only refinement: change the background request only; preserve ${subjectLabel.replace(', and background', '')}.`)
  }

  if (includesAny(request, ['font', 'typeface', 'typography', 'lettering', 'script', 'cursive', 'serif', 'sans serif', 'wordmark', 'match reference font'])) {
    lines.push('- typography-reference refinement: prioritize requested/reference letter proportions, stroke contrast, spacing, capitalization, and visual rhythm.')
  }

  if (includesAny(request, ['exact text', 'exact wording', 'exact words', 'exact spelling', 'spelling', 'same text', 'brand name', 'capitalization'])) {
    lines.push('- exact-text refinement: preserve spelling, capitalization, spacing, line breaks, and avoid extra/random words.')
  }

  if (hasReference) {
    lines.push('- Reference context is available; use it as the target for typography, composition, palette, spacing, and background unless the user changes one of those.')
  }

  if (hasOutput) {
    lines.push('- Latest output context is available; use it as the current draft to diagnose or iterate from, not as a new reference target.')
  }

  return lines.join('\n')
}

function buildChangeControlContext({
  mode,
  message,
  currentPrompt,
  agentMemory,
  hasReference,
  hasOutput,
}: {
  mode: 'image' | 'logo'
  message: unknown
  currentPrompt?: unknown
  agentMemory?: unknown
  hasReference: boolean
  hasOutput: boolean
}): string {
  const requestText = typeof message === 'string' ? message.trim() : ''
  const request = requestText.toLowerCase()
  const hasCurrentPrompt = typeof currentPrompt === 'string' && currentPrompt.trim().length > 0
  const memory = agentMemory && typeof agentMemory === 'object'
    ? agentMemory as Record<string, unknown>
    : {}
  const activeTaskContext = memory.activeTaskContext && typeof memory.activeTaskContext === 'object'
    ? memory.activeTaskContext as Record<string, unknown>
    : {}
  const latestUserRequest = typeof activeTaskContext.latestUserRequest === 'string' && activeTaskContext.latestUserRequest.trim()
    ? activeTaskContext.latestUserRequest.trim()
    : requestText || 'None'
  const preserve = typeof activeTaskContext.preserve === 'string' && activeTaskContext.preserve.trim()
    ? activeTaskContext.preserve.trim()
    : ''
  const next = typeof activeTaskContext.next === 'string' && activeTaskContext.next.trim()
    ? activeTaskContext.next.trim()
    : ''
  const hasActiveTaskContext = Object.keys(activeTaskContext).length > 0
  const hasIterationContext = hasCurrentPrompt || hasOutput || hasActiveTaskContext
  const isSingleChangeRequest = includesAny(request, ['change only', 'only change', 'one thing', 'single change', 'just change', 'keep everything else', 'do not change', "don't change"])
  const isBackgroundRequest = includesAny(request, ['background', 'backdrop', 'white background', 'transparent', 'true png', 'no background', 'remove background', 'blue background'])
  const isTypographyRequest = includesAny(request, ['font', 'typeface', 'typography', 'lettering', 'script', 'cursive', 'serif', 'sans serif', 'wordmark', 'match reference font'])
  const isExactTextRequest = includesAny(request, ['exact text', 'exact wording', 'exact words', 'exact spelling', 'spelling', 'same text', 'brand name', 'capitalization'])
  const hasFollowUpLanguage = includesAny(request, ['same', 'keep', 'only', 'just', 'but', 'now', 'fix', 'change', 'make it', 'more ', 'less ', 'closer'])
  const hasStrictChangeRequest = hasIterationContext && (
    isSingleChangeRequest ||
    ((isBackgroundRequest || isTypographyRequest || isExactTextRequest) && hasFollowUpLanguage)
  )
  const allowedChanges: string[] = []
  const subjectLabel = mode === 'logo'
    ? 'logo composition, exact text, typography style, icon shape, color palette, material, and background unless named as the allowed change'
    : 'subject, composition, style, palette, lighting, camera, and background unless named as the allowed change'

  if (isBackgroundRequest) {
    allowedChanges.push('background, backdrop, transparency, or background-removal setting only')
  }

  if (isTypographyRequest) {
    allowedChanges.push('font, typeface, lettering, spacing, and reference typography matching only')
  }

  if (isExactTextRequest) {
    allowedChanges.push('exact wording, spelling, capitalization, spacing, and text mode only')
  }

  if (isSingleChangeRequest && allowedChanges.length === 0) {
    allowedChanges.push(`the latest user request only: ${latestUserRequest}`)
  }

  const allowedChange = hasStrictChangeRequest
    ? allowedChanges.length > 0 ? allowedChanges.join('; ') : `the latest user request only: ${latestUserRequest}`
    : 'No strict single-change request detected'
  const lockedElements = [preserve, subjectLabel]
    .filter(Boolean)
    .join(' | ')
  const changeBudgetLine = hasStrictChangeRequest
    ? '- Change budget: single requested edit'
    : '- Change budget: normal prompt rewrite'

  return [
    changeBudgetLine,
    `- Allowed change: ${allowedChange}`,
    `- Locked elements: ${lockedElements}`,
    `- latest user request: ${latestUserRequest}`,
    `- Active task next change: ${next || 'Respond to the latest request'}`,
    `- Reference context available: ${hasReference ? 'yes' : 'no'}`,
    `- Latest output context available: ${hasOutput ? 'yes' : 'no'}`,
    '- Do not reinterpret the whole concept; edit only the allowed change when change budget is single requested edit.',
  ].join('\n')
}

function appendUniqueCommaList(baseValue: unknown, addition: string): string {
  const base = typeof baseValue === 'string' ? baseValue.trim() : ''
  const additions = addition
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  const existing = new Set(base.toLowerCase().split(',').map((item) => item.trim()).filter(Boolean))
  const missing = additions.filter((item) => !existing.has(item.toLowerCase()))
  return [base, ...missing].filter(Boolean).join(', ')
}

function applyPromptConstraintGuardrails<T extends { prompt?: string; negativePrompt?: string }>(
  rawSuggestions: T | undefined,
  constraints: PromptConstraint[]
): T | undefined {
  if (!rawSuggestions || constraints.length === 0) return rawSuggestions
  const promptPrefix = constraints.map((constraint) => constraint.promptPhrase).join(' ')
  const currentPrompt = typeof rawSuggestions.prompt === 'string' ? rawSuggestions.prompt.trim() : ''
  const guardedPrompt = currentPrompt.toLowerCase().includes(promptPrefix.slice(0, 40).toLowerCase())
    ? currentPrompt
    : `${promptPrefix} ${currentPrompt}`.trim()
  const negativePhrase = constraints
    .map((constraint) => constraint.negativePhrase)
    .filter((phrase): phrase is string => Boolean(phrase))
    .join(', ')

  return {
    ...rawSuggestions,
    prompt: guardedPrompt,
    negativePrompt: negativePhrase ? appendUniqueCommaList(rawSuggestions.negativePrompt, negativePhrase) : rawSuggestions.negativePrompt,
  }
}

function applyLogoConfigConstraintGuardrails(rawLogoConfig: unknown, constraints: PromptConstraint[]): Record<string, unknown> {
  const logoConfig = rawLogoConfig && typeof rawLogoConfig === 'object'
    ? { ...(rawLogoConfig as Record<string, unknown>) }
    : {}
  if (constraints.length === 0) return logoConfig

  const needsTransparentBackground = constraints.some((constraint) => constraint.key === 'background:transparent')
  const needsWhiteOrNoBlueBackground = constraints.some((constraint) => constraint.key === 'background:white' || constraint.key === 'background:no-blue')

  if (needsTransparentBackground) {
    logoConfig.backgroundColor = 'transparent'
    return logoConfig
  }

  if (needsWhiteOrNoBlueBackground && typeof logoConfig.backgroundColor === 'string') {
    delete logoConfig.backgroundColor
  }

  return logoConfig
}

function formatAgentMemory(agentMemory: unknown): string {
  if (!agentMemory || typeof agentMemory !== 'object') return 'None yet'
  const memory = agentMemory as Record<string, unknown>
  return JSON.stringify({
    mode: memory.mode || 'unknown',
    lastImagePrompt: memory.lastImagePrompt || '',
    lastLogoPrompt: memory.lastLogoPrompt || '',
    lastNegativePrompt: memory.lastNegativePrompt || '',
    lastAssistantSummary: memory.lastAssistantSummary || '',
    activeDesignBrief: memory.activeDesignBrief || '',
    sharedProjectBrief: memory.sharedProjectBrief || '',
    activeTaskContext: memory.activeTaskContext || null,
    lastReferenceAnalysis: memory.lastReferenceAnalysis || '',
    persistentGenerations: Array.isArray(memory.persistentGenerations)
      ? memory.persistentGenerations.slice(-5)
      : [],
    persistentPreferences: Array.isArray(memory.persistentPreferences)
      ? memory.persistentPreferences.slice(-8)
      : [],
    recentUserRequests: Array.isArray(memory.recentUserRequests) ? memory.recentUserRequests.slice(-4) : [],
  }, null, 2)
}

function formatSharedProjectBrief(agentMemory: unknown): string {
  if (!agentMemory || typeof agentMemory !== 'object') return 'None yet'
  const memory = agentMemory as Record<string, unknown>
  const sharedProjectBrief = memory.sharedProjectBrief
  return typeof sharedProjectBrief === 'string' && sharedProjectBrief.trim()
    ? sharedProjectBrief.trim()
    : 'None yet'
}

function formatActiveTaskSnapshot(agentMemory: unknown): string {
  if (!agentMemory || typeof agentMemory !== 'object') return 'None yet'
  const memory = agentMemory as Record<string, unknown>
  const activeTaskContext = memory.activeTaskContext
  if (!activeTaskContext || typeof activeTaskContext !== 'object') return 'None yet'
  const task = activeTaskContext as Record<string, unknown>
  const goal = typeof task.goal === 'string' && task.goal.trim() ? task.goal.trim() : 'Unclear'
  const preserve = typeof task.preserve === 'string' && task.preserve.trim() ? task.preserve.trim() : 'No preserve list yet'
  const next = typeof task.next === 'string' && task.next.trim() ? task.next.trim() : 'Respond to the latest request'
  const latestUserRequest = typeof task.latestUserRequest === 'string' && task.latestUserRequest.trim() ? task.latestUserRequest.trim() : 'None'

  return [
    `- Current goal: ${goal}`,
    `- Preserve: ${preserve}`,
    `- Next change: ${next}`,
    `- latest user request: ${latestUserRequest}`,
    '- Treat this as the live task state for natural follow-up edits. Preserve stable elements unless the user explicitly changes them.',
  ].join('\n')
}

function formatActiveTaskBrief(agentMemory: unknown): string {
  if (!agentMemory || typeof agentMemory !== 'object') return 'None yet'
  const memory = agentMemory as Record<string, unknown>
  const activeDesignBrief = memory.activeDesignBrief
  if (typeof activeDesignBrief !== 'string' || !activeDesignBrief.trim()) {
    return formatActiveTaskSnapshot(agentMemory)
  }

  return `${activeDesignBrief.trim()}

Use this as the live continuity brief for the next response. Preserve the "What to preserve" items unless the user explicitly changes them, apply only the requested follow-up edit, and update designBrief with the new understanding.`
}

function formatPersistentPreferences(agentMemory: unknown): string {
  if (!agentMemory || typeof agentMemory !== 'object') return 'None saved'
  const persistentPreferences = (agentMemory as Record<string, unknown>).persistentPreferences
  if (!Array.isArray(persistentPreferences) || persistentPreferences.length === 0) return 'None saved'

  const preferenceLines = persistentPreferences
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const preference = (item as Record<string, unknown>).preference
      return typeof preference === 'string' && preference.trim() ? `- ${preference.trim()}` : null
    })
    .filter((line): line is string => Boolean(line))

  return preferenceLines.length > 0 ? preferenceLines.join('\n') : 'None saved'
}

function formatOperationalGeneratorContext(currentPromptSettings: unknown): string {
  if (!currentPromptSettings || typeof currentPromptSettings !== 'object') return 'None available'
  const settings = currentPromptSettings as Record<string, unknown>
  const lines = [
    `- Active tab: ${settings.activeTab || 'unknown'}`,
    `- Selected image model: ${settings.selectedModel || 'unknown'}`,
    `- Resolution: ${settings.imageSize || 'unknown'}`,
    `- Image count: ${settings.imageCount || 'unknown'}`,
    `- Seed: ${settings.seed ?? 'random'}`,
    `- Analysis mode: ${settings.analysisMode || 'unknown'}`,
    `- Generator reference image: ${settings.hasReferenceImage ? `loaded (${settings.referenceImageMode || 'mode unknown'})` : 'none'}`,
  ]

  return lines.join('\n')
}

function getStringSetting(settings: Record<string, unknown>, key: string): string {
  const value = settings[key]
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function formatBackgroundRemovalMethod(method: string, provider: string, enabled: boolean): string {
  if (!enabled || method === 'none') {
    return 'off. Keep a normal generated background unless the user asks for transparent output.'
  }

  if (method === 'photoroom') {
    return `${provider || 'PhotoRoom'} API post-generation background removal for professional transparent PNG cleanup.`
  }

  if (method === 'native-transparent') {
    return 'native-transparent. This asks ChatGPT Images 2.0 for real transparent PNG alpha and skips post-generation removal; it requires selected model gpt-image-2.'
  }

  if (method === 'smart') {
    return `${provider || 'Smart local cleanup'} post-generation background removal.`
  }

  return `${provider || method} post-generation background removal.`
}

function formatBackgroundRemovalContext(currentPromptSettings: unknown): string {
  if (!currentPromptSettings || typeof currentPromptSettings !== 'object') return 'None available'
  const settings = currentPromptSettings as Record<string, unknown>
  const imageMethod = getStringSetting(settings, 'imageBgRemovalMethod')
  const imageProvider = getStringSetting(settings, 'imageBgRemovalProvider')
  const imageEnabled = settings.imageBgRemovalEnabled !== false && Boolean(imageMethod)
  const logoMethod = getStringSetting(settings, 'logoBgRemovalMethod')
  const logoProvider = getStringSetting(settings, 'logoBgRemovalProvider')
  const logoEnabled = settings.logoBgRemovalEnabled !== false && Boolean(logoMethod)
  const logoModel = getStringSetting(settings, 'logoSelectedModel')

  return [
    `- Image generator Remove BG action: ${formatBackgroundRemovalMethod(imageMethod, imageProvider, imageEnabled)}`,
    `- Image generator PhotoRoom BG checkbox: ${settings.imagePhotoRoomBgRemovalEnabled ? 'checked, so PhotoRoom is selected for Remove BG' : 'unchecked, so Smart local cleanup is selected for Remove BG'}.`,
    `- Logo generator background removal method: ${formatBackgroundRemovalMethod(logoMethod, logoProvider, logoEnabled)}`,
    `- Logo generator model for native transparent PNG: ${logoModel || 'unknown'}. native-transparent requires gpt-image-2; PhotoRoom can clean up Gemini or OpenAI outputs after generation.`,
    `- True PNG guidance: PhotoRoom and smart cleanup remove the background after the model creates the image. native-transparent is the only current model-side transparent PNG path, and only for gpt-image-2.`,
    `- If the user asks for a normal logo/image with a visible background, keep background removal off or avoid promising transparent PNG output.`,
  ].join('\n')
}

function formatCreativeDirectionContext(input: Partial<CreativeDirectionState> | null | undefined): string {
  const creativeDirection = normalizeCreativeDirection(input)
  if (!hasCreativeDirection(creativeDirection)) return "None selected"

  const selectedLines = CREATIVE_DIRECTION_SINGLE_GROUPS
    .map((group) => {
      const option = getCreativeDirectionOption(creativeDirection[group.key])
      return option ? `- ${group.label}: ${option.label}` : null
    })
    .filter((line): line is string => Boolean(line))

  const decorativeLabels = creativeDirection.decorativeElements
    .map((value) => getCreativeDirectionOption(value)?.label)
    .filter((label): label is string => Boolean(label))

  if (decorativeLabels.length > 0) {
    selectedLines.push(`- Decorative Elements: ${decorativeLabels.join(", ")}`)
  }

  const promptModifier = buildCreativeDirectionPrompt(creativeDirection)
  if (promptModifier) {
    selectedLines.push(`- Generation prompt modifier: ${promptModifier}`)
  }

  return selectedLines.join("\n")
}

function normalizeImageSetting<T extends readonly string[]>(rawValue: unknown, allowedValues: T): T[number] | undefined {
  if (typeof rawValue !== 'string') return undefined
  const value = rawValue.trim()
  return allowedValues.includes(value) ? value as T[number] : undefined
}

function normalizeImagePromptSuggestions(rawSuggestions: unknown): ImagePromptSuggestions | undefined {
  if (!rawSuggestions || typeof rawSuggestions !== 'object') return undefined

  const suggestions = rawSuggestions as Record<string, unknown>
  const prompt = stringFromUnknown(suggestions.prompt)
  if (!prompt) return undefined

  const styleStrength = stringFromUnknown(suggestions.styleStrength, 'moderate').toLowerCase()
  const normalizedStyleStrength: ImagePromptSuggestions['styleStrength'] =
    styleStrength === 'subtle' || styleStrength === 'strong' ? styleStrength : 'moderate'
  const negativePrompt = stringFromUnknown(suggestions.negativePrompt)
  const normalizedImageSettings = {
    selectedModel: normalizeImageSetting(suggestions.selectedModel || suggestions.model, IMAGE_GENERATION_MODELS),
    bgRemovalMethod: normalizeImageSetting(suggestions.bgRemovalMethod || suggestions.imageBgRemovalMethod, IMAGE_BACKGROUND_REMOVAL_METHODS),
  }

  return {
    prompt,
    ...(negativePrompt ? { negativePrompt } : {}),
    style: stringFromUnknown(suggestions.style, 'Realistic'),
    cameraAngle: stringFromUnknown(suggestions.cameraAngle, 'None'),
    cameraLens: stringFromUnknown(suggestions.cameraLens, 'None'),
    aspectRatio: stringFromUnknown(suggestions.aspectRatio, '1:1'),
    styleStrength: normalizedStyleStrength,
    resolution: stringFromUnknown(suggestions.resolution || suggestions.imageSize, '1K'),
    ...(normalizedImageSettings.selectedModel ? { selectedModel: normalizedImageSettings.selectedModel } : {}),
    ...(normalizedImageSettings.bgRemovalMethod ? { bgRemovalMethod: normalizedImageSettings.bgRemovalMethod } : {}),
  }
}

export async function POST(request: Request) {
  try {
    const {
      message,
      currentPrompt,
      currentNegativePrompt,
      currentStyle,
      currentCameraAngle,
      currentCameraLens,
      currentAspectRatio,
      styleStrength,
      promptMode,
      creativeDirection,
      currentPromptSettings,
      latestOutputAnalysis,
      agentMemory,
      conversationHistory,
      mode, // NEW: 'image' | 'logo'
      logoAnalysis, // NEW: analysis from reference logo image
    } = await request.json()

    console.log("[v0 API] Generate Prompt Suggestion called:", {
      messageLength: message?.length,
      hasImageAnalysis: message?.includes("REFERENCE IMAGES ANALYSIS"),
      currentPromptLength: currentPrompt?.length,
      mode: mode || 'image',
    })

    // Handle logo mode separately; it can answer missing-essential clarifications before Gemini is required.
    if (mode === 'logo') {
      return handleLogoMode(message, conversationHistory, logoAnalysis, currentPromptSettings, agentMemory, latestOutputAnalysis)
    }

    const hasImageAnalysisForEarlyGate = typeof message === 'string' && message.includes("REFERENCE IMAGES ANALYSIS")
    const hasSettingsReferenceForEarlyGate = hasCurrentSettingsReference('image', currentPromptSettings)
    const earlyClarificationGate = buildClarificationGate({
      mode: 'image',
      message,
      currentPrompt,
      agentMemory,
      hasReference: hasReferenceMemory(agentMemory) || hasImageAnalysisForEarlyGate || hasSettingsReferenceForEarlyGate,
      hasOutput: hasLatestOutput(currentPromptSettings),
    })
    if (earlyClarificationGate.shouldAsk) {
      return buildClarificationResponse('image', earlyClarificationGate)
    }

    const earlyDiagnosticResponse = buildLocalDiagnosticResponse('image', message, currentPromptSettings)
    if (earlyDiagnosticResponse) {
      return earlyDiagnosticResponse
    }

    const earlyCapabilityGuideResponse = buildLocalCapabilityGuideResponse('image', message, currentPromptSettings, agentMemory)
    if (earlyCapabilityGuideResponse) {
      return earlyCapabilityGuideResponse
    }

    // Check if Gemini is available
    if (!genAI) {
      console.error(`[v0 API] Gemini API not initialized - missing ${getGeminiApiKeyNames()}`)
      return NextResponse.json(
        { error: "AI service not configured", details: `${getGeminiApiKeyNames()} environment variable is not set` },
        { status: 500 }
      )
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // Build conversation context WITH generated prompts (so AI can reference previous suggestions)
    const contextMessages = conversationHistory
      ?.slice(-5) // Last 5 messages for context
      .map((msg: any) => {
        let context = `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
        if (msg.role === "assistant" && typeof msg.designBrief === "string" && msg.designBrief.trim()) {
          context += `\n  [Working Design Brief: ${msg.designBrief.trim()}]`
        }
        if (msg.role === "assistant" && Array.isArray(msg.executionPlan) && msg.executionPlan.length > 0) {
          context += `\n  [Creative Execution Plan: ${msg.executionPlan.filter(Boolean).join(' | ')}]`
        }
        // Include the actual generated prompt if present (critical for "add to previous" requests)
        if (msg.role === "assistant" && msg.suggestions?.prompt) {
          context += `\n  [Generated Prompt: "${msg.suggestions.prompt}"]`
        }
        return context
      })
      .join("\n\n")

    // Extract the LAST generated prompt for explicit reference
    const lastAssistantMsg = conversationHistory
      ?.slice().reverse().find((m: any) => m.role === "assistant" && m.suggestions?.prompt)
    const lastGeneratedPrompt = lastAssistantMsg?.suggestions?.prompt || null

    const hasImageAnalysis = message?.includes("REFERENCE IMAGES ANALYSIS")
    const diagnosticOnly = isDiagnosticOnlyRequest(message)
    const creativeDirectionContext = formatCreativeDirectionContext(creativeDirection)
    const agentMemoryContext = formatAgentMemory(agentMemory)
    const hasOutput = hasLatestOutput(currentPromptSettings)
    const hasSettingsReference = hasCurrentSettingsReference('image', currentPromptSettings)
    const hasReference = hasReferenceMemory(agentMemory) || hasSettingsReference
    const hasActiveReferenceContext = hasReference || hasImageAnalysis
    const lastPersistentGeneration = getLastPersistentGeneration(agentMemory)
    const promptConstraints = extractPromptConstraints(message, currentPrompt, currentNegativePrompt, hasActiveReferenceContext)
    const promptConstraintContext = formatPromptConstraints(promptConstraints)
    const persistentPreferenceContext = formatPersistentPreferences(agentMemory)
    const operationalGeneratorContext = formatOperationalGeneratorContext(currentPromptSettings)
    const backgroundRemovalContext = formatBackgroundRemovalContext(currentPromptSettings)
    const currentGeneratorReferenceContext = formatCurrentGeneratorReferenceContext('image', currentPromptSettings)
    const sharedProjectBriefContext = formatSharedProjectBrief(agentMemory)
    const activeTaskBrief = formatActiveTaskBrief(agentMemory)
    const activeTaskSnapshot = formatActiveTaskSnapshot(agentMemory)
    const clarificationGate = buildClarificationGate({
      mode: 'image',
      message,
      currentPrompt,
      agentMemory,
      hasReference: hasActiveReferenceContext,
      hasOutput,
    })
    const iterationIntentBrief = buildIterationIntentBrief({
      mode: 'image',
      message,
      currentPrompt,
      hasReference: hasActiveReferenceContext,
      hasOutput,
      hasPreviousPrompt: Boolean(lastGeneratedPrompt || lastPersistentGeneration?.prompt),
    })
    const changeControlContext = buildChangeControlContext({
      mode: 'image',
      message,
      currentPrompt,
      agentMemory,
      hasReference: hasActiveReferenceContext,
      hasOutput,
    })
    const hasStrictChangeRequest = changeControlContext.includes('Change budget: single requested edit')

    const systemPrompt = `You are an expert AI image prompt assistant. Help users create detailed, effective prompts for AI image generation.

${AGENTIC_AI_HELPER_CONTRACT}

${PROMPT_PLANNER_POLICY}

${SCENARIO_QUALITY_GATES}

Current Settings:
- Prompt: ${currentPrompt || "None"}
- Negative Prompt: ${currentNegativePrompt || "None"}
- Style: ${currentStyle || "None"}
- Camera Angle: ${currentCameraAngle || "None"}
- Camera Lens: ${currentCameraLens || "None"}
- Aspect Ratio: ${currentAspectRatio || "None"}
- Style Strength: ${styleStrength || "None"}
- Prompt Mode: ${promptMode || "None"}
- Current Creative Direction:
${creativeDirectionContext}

OPERATIONAL GENERATOR CONTEXT:
${operationalGeneratorContext}

BACKGROUND REMOVAL CONTEXT:
${backgroundRemovalContext}

CURRENT GENERATOR REFERENCE CONTEXT:
${currentGeneratorReferenceContext}

- Raw currentPromptSettings snapshot:
${JSON.stringify(currentPromptSettings || {}, null, 2)}

Available Creative Direction controls:
${CREATIVE_DIRECTION_OPTION_CONTEXT}

AGENT MEMORY:
${agentMemoryContext}

SHARED PROJECT BRIEF:
${sharedProjectBriefContext}

ACTIVE TASK BRIEF:
${activeTaskBrief}

ACTIVE TASK SNAPSHOT:
${activeTaskSnapshot}

CLARIFICATION GATE:
${formatClarificationGate(clarificationGate)}

PERSISTENT USER PREFERENCES:
${persistentPreferenceContext}

EXPLICIT USER CONSTRAINTS (hard requirements):
${promptConstraintContext}

ITERATION INTENT BRIEF:
${iterationIntentBrief}

CHANGE CONTROL CONTEXT:
${changeControlContext}

Constraint discipline:
- Treat these constraints as non-negotiable and preserve them across iterations.
- When CHANGE CONTROL CONTEXT says single requested edit, preserve locked elements and do not reinterpret the whole concept.
- Put hard background, typography, text, and reference constraints near the start of suggestions.prompt.
- Put contradictions in suggestions.negativePrompt, especially wrong background colors, wrong font, misspellings, and extra words.
- Before returning JSON, self-check that suggestions.prompt does not contradict these constraints.

${latestOutputAnalysis ? `
=== LATEST GENERATED OUTPUT ANALYSIS ===
This is the current output to critique or iterate from, not a new reference target:
${latestOutputAnalysis}

If the user asks for critique, diagnose mismatches between this output, the current prompt, and prior requests. If the user asks for a variation, preserve the strongest parts and change only the requested/weak parts.
` : ''}

${latestOutputAnalysis && hasActiveReferenceContext ? `
=== REFERENCE MATCH COMPARISON ===
The AGENT MEMORY includes the most recent reference analysis. Compare the latest output against that reference when the user asks to compare, match, fix drift, or get closer to the reference.
` : ''}

Recent Conversation:
${contextMessages || "None"}

${lastGeneratedPrompt ? `
PREVIOUS GENERATED PROMPT (reference for "add to this", "make it more X", etc.):
"${lastGeneratedPrompt}"

IMPORTANT: If the user's request references the previous prompt (e.g., "add sparkles", "make it darker", "include a dog", "now add X"), BUILD UPON the previous prompt by incorporating their additions/changes rather than creating something entirely new. Preserve what worked and add the new elements they request.
` : ''}

User Request: ${message}

${
  hasImageAnalysis
    ? `
IMPORTANT: The user has provided image analysis data above. You MUST:
1. Extract ALL specific visual details from the "REFERENCE IMAGES ANALYSIS" section
2. If the uploaded image is an ad, flyer, poster, social creative, landing graphic, or branded design, focus on design direction: ad type, typography, dimensional lettering, font fill/inlay, layout, CTA, background scenery, paper effects, texture, decorative elements, and color palette.
3. If the uploaded image is a character/subject reference, create a detailed prompt that replicates the exact character/subject described, including features, clothing, accessories, pose, and expression.
4. Recommend concrete Creative Direction settings by label when they match the uploaded ad/design or when they would help the requested iteration, including Text Outline / Rim when the reference uses gold rims, keylines, inset strokes, or foil edges.
5. Be extremely specific and detailed. Do NOT give generic advice - use the specific details from the analysis.

Your response should acknowledge the image analysis and provide a detailed prompt based on it.
`
    : ""
}

Based on the user's request${hasImageAnalysis ? " and the provided image analysis" : ""} and current settings, provide:
1. A conversational response explaining your suggestions${hasImageAnalysis ? " (acknowledge you've analyzed their reference image)" : ""}
2. An improved main prompt (detailed, descriptive${hasImageAnalysis ? ", using specifics from the image analysis" : ""})
3. An improved negative prompt
4. Recommended style preset (MUST be one of the available styles listed below)
5. Recommended camera angle (use "None" if not applicable)
6. Recommended camera lens (use "None" if not applicable)
7. Recommended aspect ratio
8. Style strength (subtle, moderate, or strong - how much to apply the style)
9. A Working design brief that makes your assumptions visible before the user applies or generates
10. A Creative execution plan with 2-4 short steps showing how the prompt will satisfy the request before the user applies or generates
11. A plannerDecision and promptQualityChecklist that show whether you asked, diagnosed, iterated, or produced a generation-ready prompt

Image settings patch: when the request or active context needs real image-generator setting changes, include optional suggestions.selectedModel ("gemini-3.1-flash-image-preview", "gemini-3-pro-image-preview", or "gpt-image-2") and suggestions.bgRemovalMethod ("photoroom" or "smart"). Use "photoroom" when the user needs the best post-generation background removal/true PNG cleanup workflow; use "smart" only when they prefer local/free cleanup.

Diagnostic-only questions:
- If the user is asking why something happened, what API/model/background is being used, what went wrong, or what they should change, and they are not asking you to create/rewrite/generate, set "responseMode": "diagnostic".
- In diagnostic mode, answer directly, return "diagnosticFindings", set "suggestions" to null, and use actions such as "copy_prompt" only when useful. Do not include apply/generate actions.

Creative Direction guidance:
- Treat the selected Creative Direction settings as active context. Do not contradict them unless the user asks to change direction.
- If the user asks what style to use, or uploads an ad/design to iterate on, name the closest Creative Direction controls to use in the conversational "message".
- Use the JSON schema below. Put Creative Direction recommendations in the conversational message and incorporate visual direction into the improved prompt.

Format your response as JSON:
{
  "responseMode": "suggestion",
  "message": "Your conversational response here",
  "plannerDecision": "suggest_prompt",
  "designBrief": "What I understood: concise design target.\\nWhat to preserve: stable elements from the prompt, reference, or latest output.\\nWhat changes next: the exact improvement this prompt makes.",
  "executionPlan": ["Plan step 1", "Plan step 2", "Plan step 3"],
  "diagnosticFindings": ["Only include this for diagnostic responses"],
  "promptQualityChecklist": ["Reference match: ...", "Locked elements: ...", "Background: ...", "Exact text/typography: ..."],
  "suggestions": {
    "prompt": "improved prompt",
    "negativePrompt": "improved negative prompt",
    "style": "style_preset_value",
    "cameraAngle": "camera_angle_value or None",
    "cameraLens": "camera_lens_value or None",
    "aspectRatio": "aspect_ratio_value",
    "styleStrength": "moderate",
    "selectedModel": "optional image model id",
    "bgRemovalMethod": "optional photoroom or smart"
  },
  "actions": [
    { "type": "ask_follow_up", "label": "Answer question", "description": "Reply with the missing detail before making a prompt" },
    { "type": "apply_suggestions", "label": "Apply to Image Generator", "description": "Use this prompt and settings" },
    { "type": "apply_and_generate", "label": "Apply and Generate Image", "description": "Use this prompt and start generation" },
    { "type": "revise_plan", "label": "Revise Plan", "description": "Adjust the plan before applying" },
    { "type": "generate_variation_set", "label": "Generate 3 Variations", "description": "Use this prompt to create three options" },
    { "type": "critique_last_output", "label": "Critique Latest", "description": "Analyze the latest output and fix the prompt" },
    { "type": "make_variation", "label": "Make Variation", "description": "Create a new prompt from the latest output" },
    { "type": "compare_to_reference", "label": "Compare Reference", "description": "Compare the latest output to the remembered reference" },
    { "type": "restore_memory_prompt", "label": "Restore Last Prompt", "description": "Restore the last remembered prompt" },
    { "type": "copy_prompt", "label": "Copy Prompt", "description": "Copy the improved prompt" }
  ]
}

Available styles (MUST use exact values): Realistic, Cartoon Style, Pixar, PhotoReal, Anime, Oil Painting, Watercolor, 3D Render, Sketch, Comic Book, Studio Ghibli, Makoto Shinkai, Disney Modern 3D, Sony Spider-Verse, Laika Stop-Motion, Cartoon Saloon, Studio Trigger, Ufotable, Kyoto Animation
Available camera angles: eye-level, high-angle, low-angle, birds-eye, overhead, dutch-angle, worms-eye, over-the-shoulder, point-of-view, None
Available camera lenses: standard, wide-angle, telephoto, fisheye, macro, portrait, tilt-shift, None
Available aspect ratios: 1:1, 16:9, 9:16, 4:3, 3:4, 21:9
Available style strengths: subtle, moderate, strong`

    console.log("[v0 API] Calling Gemini API with prompt length:", systemPrompt.length)

    const result = await model.generateContent(systemPrompt)
    const responseText = result.response.text()

    console.log("[v0 API] Gemini response received, length:", responseText.length)

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const jsonResponse = JSON.parse(jsonMatch[0])
      console.log("[v0 API] Successfully parsed JSON response")
      const responseMode = normalizeResponseMode(jsonResponse.responseMode, diagnosticOnly)
      const shouldAskFollowUp = clarificationGate.shouldAsk || jsonResponse.plannerDecision === 'ask_follow_up'
      const guardedSuggestions = responseMode === 'diagnostic' || shouldAskFollowUp
        ? undefined
        : applyPromptConstraintGuardrails(normalizeImagePromptSuggestions(jsonResponse.suggestions), promptConstraints)
      const hasSuggestions = Boolean(guardedSuggestions?.prompt)
      const plannerDecision = shouldAskFollowUp
        ? 'ask_follow_up'
        : normalizePlannerDecision(jsonResponse.plannerDecision, responseMode, hasSuggestions, hasOutput, hasActiveReferenceContext)
      const promptQualityChecklist = normalizePromptQualityChecklist(
        jsonResponse.promptQualityChecklist,
        buildPromptQualityFallback({
          mode: 'image',
          responseMode,
          hasReference: hasActiveReferenceContext,
          hasOutput,
          hasSuggestions,
          constraints: promptConstraints,
          hasStrictChangeRequest,
        })
      )
      return NextResponse.json({
        ...jsonResponse,
        responseMode,
        plannerDecision,
        designBrief: stringFromUnknown(jsonResponse.designBrief),
        executionPlan: normalizeExecutionPlan(jsonResponse.executionPlan),
        diagnosticFindings: normalizeDiagnosticFindings(jsonResponse.diagnosticFindings, responseMode === 'diagnostic' ? jsonResponse.message : ''),
        promptQualityChecklist,
        suggestions: shouldAskFollowUp ? undefined : guardedSuggestions,
        actions: normalizePlannerActions(
          jsonResponse.actions,
          responseMode === 'diagnostic' ? [] : defaultHelperActions('image', hasSuggestions, false, hasOutput, hasActiveReferenceContext, lastPersistentGeneration),
          plannerDecision,
          'image',
          clarificationGate.shouldAsk ? clarificationGate.question : stringFromUnknown(jsonResponse.message, 'What detail should I use before I make the prompt?'),
          responseMode
        ),
      })
    }

    console.warn("[v0 API] Failed to parse JSON, using fallback response")
    return NextResponse.json({
      message: responseText,
      responseMode: diagnosticOnly ? 'diagnostic' : 'suggestion',
      plannerDecision: diagnosticOnly ? 'diagnose' : clarificationGate.shouldAsk ? 'ask_follow_up' : 'iterate_from_current',
      designBrief: currentPrompt
        ? `What I understood: Improve the current prompt from the active generator context.\nWhat to preserve: Keep the current subject, style, and explicit constraints.\nWhat changes next: Reuse the current prompt until the helper can parse a stronger structured response.`
        : null,
      executionPlan: currentPrompt ? ['Review the current prompt and constraints', 'Preserve stable visual elements', 'Apply the requested follow-up change'] : [],
      diagnosticFindings: diagnosticOnly ? normalizeDiagnosticFindings([], responseText) : [],
      promptQualityChecklist: buildPromptQualityFallback({
        mode: 'image',
        responseMode: diagnosticOnly ? 'diagnostic' : 'suggestion',
        hasReference: hasActiveReferenceContext,
        hasOutput,
        hasSuggestions: Boolean(currentPrompt),
        constraints: promptConstraints,
        hasStrictChangeRequest,
      }),
      suggestions: clarificationGate.shouldAsk || diagnosticOnly ? undefined : applyPromptConstraintGuardrails({
        prompt: currentPrompt || "",
        negativePrompt: currentNegativePrompt || "",
        style: currentStyle || "Realistic",
        cameraAngle: currentCameraAngle || "None",
        cameraLens: currentCameraLens || "None",
        aspectRatio: currentAspectRatio || "1:1",
        styleStrength: styleStrength || "moderate",
      }, promptConstraints),
      actions: diagnosticOnly
        ? []
        : clarificationGate.shouldAsk
          ? [buildClarificationAction('image', clarificationGate.question)]
          : defaultHelperActions('image', Boolean(currentPrompt), false, hasOutput, hasActiveReferenceContext, lastPersistentGeneration),
    })
  } catch (error: any) {
    console.error("[v0 API] Error generating prompt suggestion:", error)

    // Check for specific Gemini API errors
    const errorMessage = error?.message || String(error)
    const isRateLimit = errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate")
    const isAuthError = errorMessage.includes("401") || errorMessage.includes("403") || errorMessage.includes("API key")

    if (isRateLimit) {
      return NextResponse.json(
        { error: "Rate limit exceeded", details: "Please wait a moment and try again" },
        { status: 429 }
      )
    }

    if (isAuthError) {
      return NextResponse.json(
        { error: "API authentication failed", details: `Check your ${getGeminiApiKeyNames()} configuration` },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: "Failed to generate suggestion", details: errorMessage },
      { status: 500 },
    )
  }
}

interface LogoPromptSuggestions {
  prompt: string
  negativePrompt?: string
  style: string
  cameraAngle: string
  cameraLens: string
  aspectRatio: string
  styleStrength: 'subtle' | 'moderate' | 'strong'
  resolution: string
  textMode?: string
  bgRemovalMethod?: string
  selectedModel?: string
}

function stringFromUnknown(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function normalizeLogoSetting<T extends readonly string[]>(rawValue: unknown, allowedValues: T): T[number] | undefined {
  if (typeof rawValue !== 'string') return undefined
  const value = rawValue.trim()
  return allowedValues.includes(value) ? value as T[number] : undefined
}

function normalizeLogoPromptSuggestions(rawSuggestions: unknown): LogoPromptSuggestions | undefined {
  if (!rawSuggestions || typeof rawSuggestions !== 'object') return undefined

  const suggestions = rawSuggestions as Record<string, unknown>
  const prompt = stringFromUnknown(suggestions.prompt)
  if (!prompt) return undefined

  const styleStrength = stringFromUnknown(suggestions.styleStrength, 'moderate').toLowerCase()
  const normalizedStyleStrength: LogoPromptSuggestions['styleStrength'] =
    styleStrength === 'subtle' || styleStrength === 'strong' ? styleStrength : 'moderate'
  const negativePrompt = stringFromUnknown(suggestions.negativePrompt)
  const normalizedLogoSettings = {
    textMode: normalizeLogoSetting(suggestions.textMode, LOGO_TEXT_MODES),
    bgRemovalMethod: normalizeLogoSetting(suggestions.bgRemovalMethod, LOGO_BACKGROUND_REMOVAL_METHODS),
    selectedModel: normalizeLogoSetting(suggestions.selectedModel || suggestions.model, LOGO_GENERATION_MODELS),
  }

  return {
    prompt,
    ...(negativePrompt ? { negativePrompt } : {}),
    style: stringFromUnknown(suggestions.style, '3D Render'),
    cameraAngle: stringFromUnknown(suggestions.cameraAngle, 'None'),
    cameraLens: stringFromUnknown(suggestions.cameraLens, 'None'),
    aspectRatio: stringFromUnknown(suggestions.aspectRatio, '1:1'),
    styleStrength: normalizedStyleStrength,
    resolution: stringFromUnknown(suggestions.resolution, '1K'),
    ...(normalizedLogoSettings.textMode ? { textMode: normalizedLogoSettings.textMode } : {}),
    ...(normalizedLogoSettings.bgRemovalMethod ? { bgRemovalMethod: normalizedLogoSettings.bgRemovalMethod } : {}),
    ...(normalizedLogoSettings.selectedModel ? { selectedModel: normalizedLogoSettings.selectedModel } : {}),
  }
}

/**
 * Handle logo mode requests - suggests general logo prompts and optional configurator settings.
 */
async function handleLogoMode(
  message: string,
  conversationHistory: any[],
  logoAnalysis?: string,
  currentPromptSettings?: unknown,
  agentMemory?: unknown,
  latestOutputAnalysis?: string
) {
  try {
    const logoSettingsForGate = currentPromptSettings && typeof currentPromptSettings === 'object'
      ? currentPromptSettings as Record<string, unknown>
      : {}
    const hasSettingsReferenceForEarlyGate = hasCurrentSettingsReference('logo', currentPromptSettings)
    const earlyClarificationGate = buildClarificationGate({
      mode: 'logo',
      message,
      currentPrompt: logoSettingsForGate.currentPrompt,
      agentMemory,
      hasReference: hasReferenceMemory(agentMemory) || Boolean(logoAnalysis) || hasSettingsReferenceForEarlyGate,
      hasOutput: hasLatestOutput(currentPromptSettings),
    })
    if (earlyClarificationGate.shouldAsk) {
      return buildClarificationResponse('logo', earlyClarificationGate)
    }

    const earlyDiagnosticResponse = buildLocalDiagnosticResponse('logo', message, currentPromptSettings)
    if (earlyDiagnosticResponse) {
      return earlyDiagnosticResponse
    }

    const earlyCapabilityGuideResponse = buildLocalCapabilityGuideResponse('logo', message, currentPromptSettings, agentMemory)
    if (earlyCapabilityGuideResponse) {
      return earlyCapabilityGuideResponse
    }

    // Check if Gemini is available
    if (!genAI) {
      console.error(`[v0 API] Logo mode - Gemini API not initialized - missing ${getGeminiApiKeyNames()}`)
      return NextResponse.json(
        { error: "AI service not configured", details: `${getGeminiApiKeyNames()} environment variable is not set` },
        { status: 500 }
      )
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const diagnosticOnly = isDiagnosticOnlyRequest(message)

    // Build conversation context WITH logo configs (so AI can reference previous suggestions)
    const contextMessages = conversationHistory
      ?.slice(-5)
      .map((msg: any) => {
        let context = `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
        if (msg.role === "assistant" && typeof msg.designBrief === "string" && msg.designBrief.trim()) {
          context += `\n  [Working Design Brief: ${msg.designBrief.trim()}]`
        }
        if (msg.role === "assistant" && Array.isArray(msg.executionPlan) && msg.executionPlan.length > 0) {
          context += `\n  [Creative Execution Plan: ${msg.executionPlan.filter(Boolean).join(' | ')}]`
        }
        // Include key logo config settings if present (critical for "add to previous" requests)
        if (msg.role === "assistant" && msg.logoConfig) {
          const cfg = msg.logoConfig
          const keySettings = []
          if (cfg.brandName) keySettings.push(`brandName: "${cfg.brandName}"`)
          if (cfg.textColor) keySettings.push(`textColor: ${cfg.textColor}`)
          if (cfg.metallicFinish && cfg.metallicFinish !== 'none') keySettings.push(`metallic: ${cfg.metallicFinish}`)
          if (cfg.glowEffect && cfg.glowEffect !== 'none') keySettings.push(`glow: ${cfg.glowEffect}`)
          if (cfg.depthLevel) keySettings.push(`depth: ${cfg.depthLevel}`)
          if (keySettings.length > 0) {
            context += `\n  [Generated Config: ${keySettings.join(', ')}]`
          }
        }
        if (msg.role === "assistant" && msg.suggestions?.prompt) {
          context += `\n  [Generated Logo Prompt: "${msg.suggestions.prompt}"]`
          if (msg.suggestions.negativePrompt) {
            context += `\n  [Generated Negative Prompt: "${msg.suggestions.negativePrompt}"]`
          }
        }
        return context
      })
      .join("\n\n")

    // Extract the LAST generated logoConfig for explicit reference
    const lastAssistantMsg = conversationHistory
      ?.slice().reverse().find((m: any) => m.role === "assistant" && (m.logoConfig || m.suggestions?.prompt))
    const lastLogoConfig = lastAssistantMsg?.logoConfig || null
    const lastLogoPrompt = lastAssistantMsg?.suggestions?.prompt || null

    // Get the dynamic system prompt from ai-logo-knowledge.ts
    const logoSystemPrompt = buildLogoSystemPrompt()
    const agentMemoryContext = formatAgentMemory(agentMemory)
    const hasOutput = hasLatestOutput(currentPromptSettings)
    const hasSettingsReference = hasCurrentSettingsReference('logo', currentPromptSettings)
    const hasReference = hasReferenceMemory(agentMemory) || hasSettingsReference
    const hasActiveReferenceContext = hasReference || Boolean(logoAnalysis)
    const lastPersistentGeneration = getLastPersistentGeneration(agentMemory)
    const logoSettings = currentPromptSettings && typeof currentPromptSettings === 'object'
      ? currentPromptSettings as Record<string, unknown>
      : {}
    const promptConstraints = extractPromptConstraints(
      message,
      logoSettings.currentPrompt,
      logoSettings.currentNegativePrompt,
      hasActiveReferenceContext
    )
    const promptConstraintContext = formatPromptConstraints(promptConstraints)
    const persistentPreferenceContext = formatPersistentPreferences(agentMemory)
    const operationalGeneratorContext = formatOperationalGeneratorContext(currentPromptSettings)
    const backgroundRemovalContext = formatBackgroundRemovalContext(currentPromptSettings)
    const currentGeneratorReferenceContext = formatCurrentGeneratorReferenceContext('logo', currentPromptSettings)
    const sharedProjectBriefContext = formatSharedProjectBrief(agentMemory)
    const activeTaskBrief = formatActiveTaskBrief(agentMemory)
    const activeTaskSnapshot = formatActiveTaskSnapshot(agentMemory)
    const clarificationGate = buildClarificationGate({
      mode: 'logo',
      message,
      currentPrompt: logoSettings.currentPrompt,
      agentMemory,
      hasReference: hasActiveReferenceContext,
      hasOutput,
    })
    const iterationIntentBrief = buildIterationIntentBrief({
      mode: 'logo',
      message,
      currentPrompt: logoSettings.currentPrompt,
      hasReference: hasActiveReferenceContext,
      hasOutput,
      hasPreviousPrompt: Boolean(lastLogoPrompt || lastPersistentGeneration?.prompt),
    })
    const changeControlContext = buildChangeControlContext({
      mode: 'logo',
      message,
      currentPrompt: logoSettings.currentPrompt,
      agentMemory,
      hasReference: hasActiveReferenceContext,
      hasOutput,
    })
    const hasStrictChangeRequest = changeControlContext.includes('Change budget: single requested edit')

    const fullPrompt = `${logoSystemPrompt}

${AGENTIC_AI_HELPER_CONTRACT}

${PROMPT_PLANNER_POLICY}

${SCENARIO_QUALITY_GATES}

Current Logo/Image Studio Settings:
${JSON.stringify(currentPromptSettings || {}, null, 2)}

OPERATIONAL GENERATOR CONTEXT:
${operationalGeneratorContext}

BACKGROUND REMOVAL CONTEXT:
${backgroundRemovalContext}

CURRENT GENERATOR REFERENCE CONTEXT:
${currentGeneratorReferenceContext}

AGENT MEMORY:
${agentMemoryContext}

SHARED PROJECT BRIEF:
${sharedProjectBriefContext}

ACTIVE TASK BRIEF:
${activeTaskBrief}

ACTIVE TASK SNAPSHOT:
${activeTaskSnapshot}

CLARIFICATION GATE:
${formatClarificationGate(clarificationGate)}

PERSISTENT USER PREFERENCES:
${persistentPreferenceContext}

EXPLICIT USER CONSTRAINTS (hard requirements):
${promptConstraintContext}

ITERATION INTENT BRIEF:
${iterationIntentBrief}

CHANGE CONTROL CONTEXT:
${changeControlContext}

Constraint discipline:
- Treat these constraints as non-negotiable and preserve them across logo iterations.
- When CHANGE CONTROL CONTEXT says single requested edit, preserve locked elements and do not reinterpret the whole concept.
- Put hard background, typography, exact text, and reference constraints near the start of suggestions.prompt.
- Put contradictions in suggestions.negativePrompt, especially wrong background colors, wrong font, misspellings, extra words, mockups, and scenes.
- Before returning JSON, self-check that suggestions.prompt and logoConfig do not contradict these constraints.

${latestOutputAnalysis ? `
=== LATEST GENERATED OUTPUT ANALYSIS ===
This is the current generated logo to critique or iterate from, not the user's original reference target:
${latestOutputAnalysis}

If the user asks for critique, diagnose typography, layout, background, color, readability, and reference-match misses. If the user asks for a variation, keep the strongest brand direction and correct the weak parts.
` : ''}

${latestOutputAnalysis && hasActiveReferenceContext ? `
=== REFERENCE MATCH COMPARISON ===
The AGENT MEMORY includes the most recent logo reference analysis. Compare the latest generated logo against that reference for typography, spacing, palette, background, composition, and text accuracy.
` : ''}

${logoAnalysis ? `
=== REFERENCE LOGO ANALYSIS ===
The user has uploaded a reference logo. Here is the analysis:
${logoAnalysis}

IMPORTANT: Use this analysis to suggest settings that will recreate a similar look.
Match the colors, materials, effects, and style as closely as possible.
` : ''}

${contextMessages ? `
Recent Conversation:
${contextMessages}
` : ''}

${lastLogoConfig ? `
PREVIOUS GENERATED CONFIG (reference for "add glow", "make it gold", "change the color", etc.):
${JSON.stringify(lastLogoConfig, null, 2)}

IMPORTANT: If the user wants to ADD or MODIFY settings (e.g., "add more glow", "make it gold", "change the color to blue", "now add sparkles"), START with the previous config and incorporate their changes. Don't create from scratch unless they explicitly ask for something completely different. Preserve the settings that worked and add/modify only what they request.
` : ''}

${lastLogoPrompt ? `
PREVIOUS GENERATED LOGO PROMPT (reference for "make it more premium", "add an icon", "remove text", etc.):
"${lastLogoPrompt}"

IMPORTANT: If the user asks for an iteration, build on the previous generation-ready logo prompt while making the requested changes.
` : ''}

User Request: ${message}

Based on the user's request${logoAnalysis ? ' and the reference logo analysis' : ''}${lastLogoConfig || lastLogoPrompt ? ' (building upon the previous design if applicable)' : ''}, suggest appropriate general logo settings and a generation-ready logo prompt.
Only include logoConfig keys when the user explicitly wants configurator-controlled effects such as dot matrix, 3D depth, metallic materials, glow, sparkles, or icon presets. For clean wordmark or reference-style typography requests, return an empty logoConfig and keep the prompt focused on typography, composition, palette, and background.
Logo settings patch: when the request or preflight context needs real generator setting changes, include optional suggestions.textMode ("ai-text" or "exact-text-overlay"), suggestions.bgRemovalMethod ("none", "photoroom", "smart", "native-transparent", etc.), and suggestions.selectedModel ("gemini-3.1-flash-image-preview", "gemini-3-pro-image-preview", or "gpt-image-2"). Use exact-text-overlay for exact spelling/real typography workflows; use photoroom for professional post-generation transparent PNG cleanup; use native-transparent only with selectedModel gpt-image-2.
Remember to respond with a JSON object containing "message", "plannerDecision", "designBrief", "executionPlan", "promptQualityChecklist", "suggestions", "logoConfig", and "actions" as specified above.
Working design brief requirement: Return designBrief as a compact string with "What I understood:", "What to preserve:", and "What changes next:" lines.
Creative execution plan requirement: Return executionPlan as an array of 2-4 short steps that explain how the prompt will preserve the reference/current brief and make the requested change.
Prompt self-check requirement: Return promptQualityChecklist as 3-5 short audit lines for reference match, locked elements, background, exact text/typography, and generator settings when relevant.
Diagnostic-only questions: If the user is asking why something happened, what API/model/background is being used, what went wrong, or what they should change, and they are not asking you to create/rewrite/generate, return "responseMode": "diagnostic", include diagnosticFindings, set suggestions to null, keep logoConfig empty, and do not include apply/generate actions.

JSON fields:
"plannerDecision": "ask_follow_up | suggest_prompt | diagnose | iterate_from_current | compare_to_reference"
"promptQualityChecklist": ["Reference match: ...", "Locked elements: ...", "Background: ...", "Exact text/typography: ...", "Generator settings: ..."]

Action schema:
"actions": [
  { "type": "ask_follow_up", "label": "Answer question", "description": "Reply with the missing detail before making a logo prompt" },
  { "type": "apply_suggestions", "label": "Apply to Logo Generator", "description": "Use this prompt and settings" },
  { "type": "apply_and_generate", "label": "Apply and Generate Logo", "description": "Use this prompt and start generation" },
  { "type": "revise_plan", "label": "Revise Plan", "description": "Adjust the plan before applying" },
  { "type": "critique_last_output", "label": "Critique Latest", "description": "Analyze the latest logo and fix the prompt" },
  { "type": "make_variation", "label": "Make Variation", "description": "Create a new prompt from the latest logo" },
  { "type": "compare_to_reference", "label": "Compare Reference", "description": "Compare the latest logo to the remembered reference" },
  { "type": "restore_memory_prompt", "label": "Restore Last Prompt", "description": "Restore the last remembered logo prompt" },
  { "type": "copy_prompt", "label": "Copy Prompt", "description": "Copy the generated logo prompt" }
]`

    console.log("[v0 API] Logo mode - calling Gemini with dynamic system prompt")

    const result = await model.generateContent(fullPrompt)
    const responseText = result.response.text()

    console.log("[v0 API] Logo mode - Gemini response received, length:", responseText.length)

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const jsonResponse = JSON.parse(jsonMatch[0])
        const responseMode = normalizeResponseMode(jsonResponse.responseMode, diagnosticOnly)
        const shouldAskFollowUp = clarificationGate.shouldAsk || jsonResponse.plannerDecision === 'ask_follow_up'
        const logoSuggestions = responseMode === 'diagnostic' || shouldAskFollowUp
          ? undefined
          : applyPromptConstraintGuardrails(normalizeLogoPromptSuggestions(jsonResponse.suggestions), promptConstraints)
        const logoConfig = responseMode === 'diagnostic' || shouldAskFollowUp
          ? {}
          : applyLogoConfigConstraintGuardrails(jsonResponse.logoConfig, promptConstraints)
        const hasLogoConfig = Boolean(logoConfig && Object.keys(logoConfig).length > 0)
        const plannerDecision = shouldAskFollowUp
          ? 'ask_follow_up'
          : normalizePlannerDecision(jsonResponse.plannerDecision, responseMode, Boolean(logoSuggestions?.prompt), hasOutput, hasActiveReferenceContext)
        const promptQualityChecklist = normalizePromptQualityChecklist(
          jsonResponse.promptQualityChecklist,
          buildPromptQualityFallback({
            mode: 'logo',
            responseMode,
            hasReference: hasActiveReferenceContext,
            hasOutput,
            hasSuggestions: Boolean(logoSuggestions?.prompt),
            constraints: promptConstraints,
            hasStrictChangeRequest,
          })
        )
        console.log("[v0 API] Logo mode - Successfully parsed JSON response with config keys:",
          hasLogoConfig ? Object.keys(logoConfig) : 'none')
        return NextResponse.json({
          message: jsonResponse.message || "Here are my logo design suggestions.",
          responseMode,
          plannerDecision,
          designBrief: stringFromUnknown(jsonResponse.designBrief),
          executionPlan: normalizeExecutionPlan(jsonResponse.executionPlan),
          diagnosticFindings: normalizeDiagnosticFindings(jsonResponse.diagnosticFindings, responseMode === 'diagnostic' ? jsonResponse.message : ''),
          promptQualityChecklist,
          suggestions: shouldAskFollowUp ? undefined : logoSuggestions,
          logoConfig,
          actions: normalizePlannerActions(
            jsonResponse.actions,
            responseMode === 'diagnostic' ? [] : defaultHelperActions('logo', Boolean(logoSuggestions?.prompt), hasLogoConfig, hasOutput, hasActiveReferenceContext, lastPersistentGeneration),
            plannerDecision,
            'logo',
            clarificationGate.shouldAsk ? clarificationGate.question : stringFromUnknown(jsonResponse.message, 'What detail should I use before I make the logo prompt?'),
            responseMode
          ),
          mode: 'logo'
        })
      } catch (parseError) {
        console.error("[v0 API] Logo mode - JSON parse error:", parseError)
      }
    }

    // Fallback response
    console.warn("[v0 API] Logo mode - Failed to parse JSON, using fallback")
    return NextResponse.json({
      message: responseText,
      responseMode: diagnosticOnly ? 'diagnostic' : 'suggestion',
      plannerDecision: diagnosticOnly ? 'diagnose' : clarificationGate.shouldAsk ? 'ask_follow_up' : 'suggest_prompt',
      diagnosticFindings: diagnosticOnly ? normalizeDiagnosticFindings([], responseText) : [],
      promptQualityChecklist: buildPromptQualityFallback({
        mode: 'logo',
        responseMode: diagnosticOnly ? 'diagnostic' : 'suggestion',
        hasReference: hasActiveReferenceContext,
        hasOutput,
        hasSuggestions: false,
        constraints: promptConstraints,
        hasStrictChangeRequest,
      }),
      logoConfig: {},
      actions: diagnosticOnly
        ? []
        : clarificationGate.shouldAsk
          ? [buildClarificationAction('logo', clarificationGate.question)]
          : defaultHelperActions('logo', false, false, hasOutput, hasActiveReferenceContext, lastPersistentGeneration),
      mode: 'logo'
    })
  } catch (error: any) {
    console.error("[v0 API] Logo mode error:", error)

    // Check for specific Gemini API errors
    const errorMessage = error?.message || String(error)
    const isRateLimit = errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate")
    const isAuthError = errorMessage.includes("401") || errorMessage.includes("403") || errorMessage.includes("API key")

    if (isRateLimit) {
      return NextResponse.json(
        { error: "Rate limit exceeded", details: "Please wait a moment and try again" },
        { status: 429 }
      )
    }

    if (isAuthError) {
      return NextResponse.json(
        { error: "API authentication failed", details: `Check your ${getGeminiApiKeyNames()} configuration` },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: "Failed to generate logo suggestions", details: errorMessage },
      { status: 500 },
    )
  }
}
