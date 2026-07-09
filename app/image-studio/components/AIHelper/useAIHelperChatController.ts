'use client'

/**
 * 🔒 PROTECTED: AI HELPER CHAT CONTROLLER
 *
 * Chat state + direct-command logic for the AI helper, relocated verbatim
 * from AIHelperSidebar so the overlay sidebar and the studio HelperPanel
 * share one implementation. The useAIHelper API is consumed, never changed.
 * Behavior is pinned by check-ai-helper-ui-contract.cjs and
 * check-ai-helper-scenarios.cjs — do not modify without explicit approval.
 */

import { useState, useRef, useEffect } from 'react'
import { useAIHelper, type AIHelperAction, type AIHelperLatestOutput, type AIHelperMode, type AIMessage } from '../../hooks/useAIHelper'
import type { DotMatrixConfig } from '../../constants/dot-matrix-config'
import type { CreativeDirectionState } from '../../constants/creative-direction-options'
import {
  buildLocalActionSummary,
  detectRequestedHelperMode,
  matchesDirectCommand,
  matchesNaturalDirectCommand,
  normalizeDirectCommand,
} from '../../utils/helper-commands'
import { buildSuggestionPatchFromFollowUp } from '../../utils/helper-suggestion-patch'

export interface AIHelperPromptSettings {
  activeTab?: string
  currentPrompt?: string
  currentNegativePrompt?: string
  currentStyle?: string
  currentCameraAngle?: string
  currentCameraLens?: string
  currentAspectRatio?: string
  styleStrength?: string
  selectedModel?: string
  imageSize?: string
  imageCount?: number
  seed?: number | null
  analysisMode?: string
  imageBgRemovalEnabled?: boolean
  imageBgRemovalMethod?: string
  imageBgRemovalProvider?: string
  imagePhotoRoomBgRemovalEnabled?: boolean
  logoBgRemovalEnabled?: boolean
  logoBgRemovalMethod?: string
  logoBgRemovalProvider?: string
  logoRemoveBackgroundOnly?: boolean
  logoSelectedModel?: string
  logoResolution?: string
  logoAspectRatio?: string
  logoTextMode?: string
  logoType?: string
  logoVisualStyle?: string
  logoRenderTreatment?: string
  logoTypographyDirection?: string
  logoHasReferenceImage?: boolean
  logoReferenceMode?: string
  hasReferenceImage?: boolean
  referenceImageMode?: string
  promptMode?: string
  creativeDirection?: CreativeDirectionState
  latestImageOutput?: { hasOutput: boolean; prompt?: string; timestamp?: number }
  latestLogoOutput?: {
    hasOutput: boolean
    prompt?: string
    negativePrompt?: string
    timestamp?: number
    source?: string
    aspectRatio?: string
    textMode?: string
    bgRemovalMethod?: string
    seed?: number
    style?: string
  }
}

export interface AIHelperLatestOutputs {
  image?: AIHelperLatestOutput | null
  logo?: AIHelperLatestOutput | null
}

export interface AIHelperChatCallbacks {
  onApplySuggestions?: (suggestions: any) => void
  onApplyLogoSuggestions?: (suggestions: any) => void
  onApplyLogoConfig?: (config: Partial<DotMatrixConfig>) => void
  onGenerateFromAIHelper?: (mode: AIHelperMode, options?: { imageCount?: number }) => void
}

export interface UseAIHelperChatControllerOptions extends AIHelperChatCallbacks {
  currentPromptSettings?: AIHelperPromptSettings
  latestOutputs?: AIHelperLatestOutputs
}

export function useAIHelperChatController({
  currentPromptSettings = {},
  latestOutputs = {},
  onApplySuggestions,
  onApplyLogoSuggestions,
  onApplyLogoConfig,
  onGenerateFromAIHelper,
}: UseAIHelperChatControllerOptions) {
  const [input, setInput] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editedSuggestions, setEditedSuggestions] = useState<any>({})
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null)
  const [pendingFollowUp, setPendingFollowUp] = useState<{ prompt: string; mode: AIHelperMode } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, uploadedImages, isLoading, mode, setMode, sendMessage, sendLogoMessage, sendActionMessage, addImage, removeImage, clearHistory, updateMessageSuggestions, preferenceCount, preferenceMemory, activeDesignBrief, sharedProjectBrief, activeTaskContext, forgetPreference, cancelRequest, appendLocalMessage } = useAIHelper()

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      if (!file.type.startsWith('image/')) { alert('Please upload image files only'); return }
      if (file.size > 10 * 1024 * 1024) { alert(`File ${file.name} is too large. Max size is 10MB`); return }
      const reader = new FileReader()
      reader.onloadend = () => addImage(reader.result as string)
      reader.readAsDataURL(file)
    })
  }

  const handleCopy = async (text: string, field: string) => {
    try { await navigator.clipboard.writeText(text); setCopiedField(field); setTimeout(() => setCopiedField(null), 2000) }
    catch (error) { console.error('Failed to copy:', error) }
  }

  const handleEditStart = (idx: number, suggestions: any) => {
    setEditingIndex(idx)
    setEditedSuggestions({
      ...suggestions,
      prompt: suggestions.prompt || '', negativePrompt: suggestions.negativePrompt || '', style: suggestions.style || '',
      aspectRatio: suggestions.aspectRatio || '1:1', cameraAngle: suggestions.cameraAngle || 'None',
      cameraLens: suggestions.cameraLens || 'None', styleStrength: suggestions.styleStrength || 'moderate', resolution: suggestions.resolution || '1K'
    })
  }

  const handleEditCancel = () => { setEditingIndex(null); setEditedSuggestions({}) }

  const buildActionSuggestions = (action: AIHelperAction, message?: AIMessage) => ({
    prompt: action.prompt || message?.suggestions?.prompt || currentPromptSettings.currentPrompt || '',
    negativePrompt: action.negativePrompt || message?.suggestions?.negativePrompt || currentPromptSettings.currentNegativePrompt || '',
    style: message?.suggestions?.style || currentPromptSettings.currentStyle || '',
    aspectRatio: message?.suggestions?.aspectRatio || currentPromptSettings.currentAspectRatio || '1:1',
    cameraAngle: message?.suggestions?.cameraAngle || currentPromptSettings.currentCameraAngle || 'None',
    cameraLens: message?.suggestions?.cameraLens || currentPromptSettings.currentCameraLens || 'None',
    styleStrength: message?.suggestions?.styleStrength || currentPromptSettings.styleStrength || 'moderate',
    resolution: message?.suggestions?.resolution || '1K',
    _appliedAt: Date.now(),
  })

  const applySuggestionsForMessage = (suggestions: any, idx: number, targetMode?: AIHelperMode) => {
    const isLogoSuggestion = (targetMode || messages[idx]?.mode) === 'logo'
    const applyHandler = isLogoSuggestion ? (onApplyLogoSuggestions || onApplySuggestions) : onApplySuggestions
    if (!applyHandler) { alert('Error: Apply callback is not connected.'); return false }
    applyHandler(suggestions)
    return true
  }

  const handleEditSave = (idx: number) => {
    if (!applySuggestionsForMessage(editedSuggestions, idx)) return
    updateMessageSuggestions(idx, editedSuggestions)
    setEditingIndex(null); setEditedSuggestions({})
  }

  const handleApplyClick = (suggestions: any, idx: number) => {
    const freshSuggestions = {
      ...suggestions,
      prompt: suggestions.prompt || '', negativePrompt: suggestions.negativePrompt || '', style: suggestions.style || '',
      aspectRatio: suggestions.aspectRatio || '1:1', cameraAngle: suggestions.cameraAngle || 'None',
      cameraLens: suggestions.cameraLens || 'None', styleStrength: suggestions.styleStrength || 'moderate', resolution: suggestions.resolution || '1K', _appliedAt: Date.now()
    }
    if (!applySuggestionsForMessage(freshSuggestions, idx)) return
    setAppliedIndex(idx); setTimeout(() => setAppliedIndex(null), 2000)
  }

  const applyLogoConfigFromMessage = (idx: number, config: Partial<DotMatrixConfig>) => {
    if (!onApplyLogoConfig) return
    onApplyLogoConfig(config)
    setAppliedIndex(idx)
    setTimeout(() => setAppliedIndex(null), 2000)
  }

  const handleRunAction = (action: AIHelperAction, idx: number, message: AIMessage) => {
    if (action.type === 'switch_to_logo') {
      setMode('logo')
      return
    }

    if (action.type === 'switch_to_image') {
      setMode('image')
      return
    }

    if (action.type === 'ask_follow_up' && action.prompt) {
      const followUpMode = action.target || (message.mode === 'logo' ? 'logo' : mode)
      setPendingFollowUp({ prompt: action.prompt, mode: followUpMode })
      if (followUpMode !== mode) setMode(followUpMode)
      setInput('')
      return
    }

    if (action.type === 'revise_plan') {
      const followUpMode = action.target || (message.mode === 'logo' ? 'logo' : mode)
      setPendingFollowUp({
        prompt: action.prompt || 'What would you like to change in this plan before I rewrite the prompt?',
        mode: followUpMode,
      })
      if (followUpMode !== mode) setMode(followUpMode)
      setInput('')
      return
    }

    if (action.type === 'copy_prompt' && message.suggestions?.prompt) {
      void handleCopy(message.suggestions.prompt, `prompt-action-${idx}`)
      return
    }

    if (action.type === 'apply_logo_config' && message.logoConfig && onApplyLogoConfig) {
      onApplyLogoConfig(message.logoConfig)
      setAppliedIndex(idx)
      setTimeout(() => setAppliedIndex(null), 2000)
      return
    }

    if (action.type === 'apply_suggestions' && message.suggestions) {
      handleApplyClick(message.suggestions, idx)
      return
    }

    if (action.type === 'apply_and_generate' && message.suggestions) {
      if (!applySuggestionsForMessage({ ...message.suggestions, _appliedAt: Date.now() }, idx)) return
      setAppliedIndex(idx)
      onGenerateFromAIHelper?.(message.mode === 'logo' ? 'logo' : 'image')
      return
    }

    if (action.type === 'restore_memory_prompt') {
      const targetMode = action.target || (message.mode === 'logo' ? 'logo' : mode)
      const restoredSuggestions = buildActionSuggestions(action, message)
      if (!restoredSuggestions.prompt.trim()) return
      if (!applySuggestionsForMessage(restoredSuggestions, idx, targetMode)) return
      setMode(targetMode)
      setAppliedIndex(idx)
      setTimeout(() => setAppliedIndex(null), 2000)
      return
    }

    if (action.type === 'generate_variation_set') {
      const targetMode = action.target || (message.mode === 'logo' ? 'logo' : 'image')
      const variationSuggestions = buildActionSuggestions(action, message)
      if (!variationSuggestions.prompt.trim()) return
      if (!applySuggestionsForMessage(variationSuggestions, idx, targetMode)) return
      setAppliedIndex(idx)
      onGenerateFromAIHelper?.(targetMode, targetMode === 'image' ? { imageCount: 3 } : undefined)
      return
    }

    if (action.type === 'critique_last_output' || action.type === 'make_variation' || action.type === 'compare_to_reference') {
      const actionMode = message.mode === 'logo' ? 'logo' : mode
      const latestOutput = actionMode === 'logo' ? latestOutputs.logo : latestOutputs.image
      if (!latestOutput?.url) {
        setInput(actionMode === 'logo'
          ? 'Generate a logo first, then critique the latest output and improve the prompt.'
          : 'Generate an image first, then critique the latest output and improve the prompt.'
        )
        return
      }
      void sendActionMessage(action.type, currentPromptSettings, latestOutput, actionMode)
    }
  }

  const getLatestSuggestionMessage = (targetMode?: AIHelperMode) => {
    const lookupMode = targetMode || mode
    for (let index = messages.length - 1; index >= 0; index--) {
      const message = messages[index]
      const messageMode: AIHelperMode = message.mode === 'logo' ? 'logo' : 'image'
      if (message.role === 'assistant' && message.suggestions?.prompt && messageMode === lookupMode) {
        return { index, message, targetMode: messageMode }
      }
    }
    return null
  }

  const buildClarificationContinuationRequest = (question: string, answer: string) => {
    const activeTaskSummary = activeTaskContext
      ? `Goal: ${activeTaskContext.goal || 'Unclear'} | Preserve: ${activeTaskContext.preserve || 'None yet'} | Next: ${activeTaskContext.next || 'Use the user answer'}`
      : 'None yet'
    const currentPrompt = typeof currentPromptSettings.currentPrompt === 'string' && currentPromptSettings.currentPrompt.trim()
      ? currentPromptSettings.currentPrompt.trim()
      : 'None'

    return [
      'CLARIFICATION CONTINUATION',
      `Original question: ${question}`,
      `User answer: ${answer}`,
      `Active design brief: ${activeDesignBrief || 'None yet'}`,
      `Shared project brief: ${sharedProjectBrief || 'None yet'}`,
      `Active task: ${activeTaskSummary}`,
      `Current generator prompt: ${currentPrompt}`,
      'Continue from the pending clarification. Use the user answer as the missing essential detail, preserve any active brief/task context, and now produce the generation-ready prompt or settings without asking the same question again.',
    ].join('\n')
  }

  const runDirectClearMemoryCommand = async (userInput: string) => {
    const clearMemoryCommandTerms = [
      'clear helper memory',
      'clear ai helper memory',
      'clear prompt helper memory',
      'clear this chat',
      'clear chat history',
      'forget everything',
      'forget this chat',
      'reset ai helper',
      'reset prompt helper',
      'wipe helper memory',
    ]

    if (!matchesNaturalDirectCommand(userInput, clearMemoryCommandTerms)) return false

    const activeMode = mode
    setPendingFollowUp(null)
    await clearHistory()
    appendLocalMessage({
      role: 'assistant',
      content: 'Helper memory cleared. No generator settings were changed.',
      mode: activeMode,
    })
    return true
  }

  const runDirectBackgroundRemovalCommand = (userInput: string) => {
    const normalized = normalizeDirectCommand(userInput)
    const backgroundRemovalCommandTerms = [
      'use photoroom',
      'turn on photoroom',
      'photoroom bg',
      'photoroom background removal',
      'turn off background removal',
      'disable background removal',
      'no background removal',
      'normal logo with background',
      'normal image with background',
    ]

    if (!matchesNaturalDirectCommand(userInput, backgroundRemovalCommandTerms)) return false

    const wantsOff = ['turn off background removal', 'disable background removal', 'no background removal', 'normal logo with background', 'normal image with background'].some((term) => normalized.includes(term))
    const wantsPhotoRoom = ['use photoroom', 'turn on photoroom', 'photoroom bg', 'photoroom background removal'].some((term) => normalized.includes(term))
    const requestedMode = detectRequestedHelperMode(userInput)
    const targetMode: AIHelperMode = requestedMode || mode

    if (!wantsOff && !wantsPhotoRoom) return false

    const suggestions = targetMode === 'logo'
      ? wantsOff
        ? { bgRemovalMethod: 'none', _appliedAt: Date.now() }
        : { bgRemovalMethod: 'photoroom', _appliedAt: Date.now() }
      : wantsOff
          ? { bgRemovalMethod: 'none', _appliedAt: Date.now() }
          : { bgRemovalMethod: 'photoroom', _appliedAt: Date.now() }

    const applyHandler = targetMode === 'logo'
      ? (onApplyLogoSuggestions || onApplySuggestions)
      : onApplySuggestions

    if (!applyHandler) {
      alert('Error: Apply callback is not connected.')
      return true
    }

    applyHandler(suggestions)
    setPendingFollowUp(null)
    if (targetMode !== mode) setMode(targetMode)
    const settingLabel = wantsOff
        ? `off for normal ${targetMode} backgrounds`
        : 'PhotoRoom'

    appendLocalMessage({ role: 'user', content: userInput, mode: targetMode })
    appendLocalMessage({
      role: 'assistant',
      content: buildLocalActionSummary({
        summary: `Background removal set to ${settingLabel}.`,
        preserving: 'Current prompt text and visual direction.',
        changing: 'Background removal setting only.',
        action: `Applied the setting to the ${targetMode} generator.`,
        note: 'No prompt text was changed.',
      }),
      mode: targetMode,
    })
    return true
  }

  const buildDirectSettingsPatch = (userInput: string) => {
    const normalized = normalizeDirectCommand(userInput)
    const settingsDecisionCommandTerms = [
      'use photoroom and 4k',
    ]
    const settingsGenerateCommandTerms = [
      'use photoroom and 4k and generate',
      'exact text overlay and generate',
      'and generate',
      'then generate',
      'generate it',
      'run it',
    ]
    const wantsPhotoRoom = ['use photoroom', 'turn on photoroom', 'photoroom bg', 'photoroom background removal'].some((term) => normalized.includes(term))
    const wantsOff = ['turn off background removal', 'disable background removal', 'no background removal', 'normal logo with background', 'normal image with background'].some((term) => normalized.includes(term))
    const wantsExactText = ['use exact text overlay', 'set exact text overlay', 'exact text overlay', 'exact text mode'].some((term) => normalized.includes(term))
    const wantsAiText = ['use ai text', 'set ai text', 'ai text mode', 'let ai draw text'].some((term) => normalized.includes(term))
    const wantsGptImage2 = ['use chatgpt images 2.0', 'use chatgpt images 2', 'use gpt image 2', 'use openai image'].some((term) => normalized.includes(term))
    const logoType = normalized.includes('set logo type wordmark') || normalized.includes('logo type wordmark')
      ? 'wordmark'
      : normalized.includes('set logo type icon wordmark') || normalized.includes('icon wordmark')
        ? 'icon-wordmark'
        : normalized.includes('set logo type monogram') || normalized.includes('logo type monogram')
          ? 'monogram'
          : normalized.includes('set logo type badge') || normalized.includes('logo type badge')
            ? 'badge'
            : null
    const logoVisualStyle = normalized.includes('set logo style luxury') || normalized.includes('logo style luxury')
      ? 'luxury'
      : normalized.includes('set logo style minimal') || normalized.includes('logo style minimal')
        ? 'minimal'
        : normalized.includes('set logo style modern') || normalized.includes('logo style modern')
          ? 'modern'
          : normalized.includes('set logo style boutique') || normalized.includes('logo style boutique')
            ? 'boutique'
            : null
    const logoRenderTreatment = normalized.includes('set logo render flat vector') || normalized.includes('logo render flat vector')
      ? 'flat-vector'
      : normalized.includes('set logo render metallic') || normalized.includes('logo render metallic')
        ? 'metallic'
        : normalized.includes('set logo render foil') || normalized.includes('logo render foil')
          ? 'foil'
          : normalized.includes('set logo render soft 3d') || normalized.includes('logo render soft 3d')
            ? 'soft-3d'
            : null
    const logoTypographyDirection = normalized.includes('set logo typography elegant serif') || normalized.includes('logo typography elegant serif')
      ? 'elegant-serif'
      : normalized.includes('set logo typography clean sans') || normalized.includes('logo typography clean sans')
        ? 'clean-sans'
        : normalized.includes('set logo typography script') || normalized.includes('logo typography script')
          ? 'script'
          : normalized.includes('set logo typography reference match') || normalized.includes('logo typography reference match')
            ? 'reference-match'
            : null
    const resolution = normalized.includes('set 4k') || normalized.includes('4k resolution') || normalized.includes('and 4k') || normalized.endsWith('4k')
      ? '4K'
      : normalized.includes('set 2k') || normalized.includes('2k resolution') || normalized.includes('and 2k') || normalized.endsWith('2k')
        ? '2K'
        : normalized.includes('set 1k') || normalized.includes('1k resolution') || normalized.includes('and 1k') || normalized.endsWith('1k')
          ? '1K'
          : null
    const requestedMode = detectRequestedHelperMode(userInput)
    const targetMode: AIHelperMode = (wantsExactText || wantsAiText || Boolean(logoType) || Boolean(logoVisualStyle) || Boolean(logoRenderTreatment) || Boolean(logoTypographyDirection) || normalized.includes('normal logo with background'))
      ? 'logo'
      : requestedMode || mode
    const settingsPatch: Partial<NonNullable<AIMessage['suggestions']>> = {}
    const changedLabels: string[] = []

    if (wantsPhotoRoom) {
      settingsPatch.bgRemovalMethod = 'photoroom'
      changedLabels.push('PhotoRoom background removal')
    } else if (wantsOff) {
      settingsPatch.bgRemovalMethod = 'none'
      changedLabels.push('background removal off')
    }

    if (wantsExactText) {
      settingsPatch.textMode = 'exact-text-overlay'
      changedLabels.push('exact text overlay')
    } else if (wantsAiText) {
      settingsPatch.textMode = 'ai-text'
      changedLabels.push('AI text mode')
    }

    if (wantsGptImage2 && settingsPatch.selectedModel !== 'gpt-image-2') {
      settingsPatch.selectedModel = 'gpt-image-2'
      changedLabels.push('ChatGPT Images 2.0')
    }

    if (resolution) {
      settingsPatch.resolution = resolution
      changedLabels.push(`${resolution} resolution`)
    }

    if (targetMode === 'logo') {
      if (logoType) {
        settingsPatch.logoType = logoType
        changedLabels.push(`logo type ${logoType.replace('-', ' + ')}`)
      }
      if (logoVisualStyle) {
        settingsPatch.logoVisualStyle = logoVisualStyle
        changedLabels.push(`${logoVisualStyle} style`)
      }
      if (logoRenderTreatment) {
        settingsPatch.logoRenderTreatment = logoRenderTreatment
        changedLabels.push(`${logoRenderTreatment.replace('-', ' ')} render`)
      }
      if (logoTypographyDirection) {
        settingsPatch.logoTypographyDirection = logoTypographyDirection
        changedLabels.push(`${logoTypographyDirection.replace('-', ' ')} typography`)
      }
    }

    if (changedLabels.length === 0) return null

    return {
      targetMode,
      settingsPatch: { ...settingsPatch, _appliedAt: Date.now() },
      changedLabels,
      shouldGenerate: matchesNaturalDirectCommand(userInput, settingsGenerateCommandTerms) && !matchesDirectCommand(userInput, settingsDecisionCommandTerms),
    }
  }

  const applyDirectSettingsPatch = (userInput: string, settingsDecision: NonNullable<ReturnType<typeof buildDirectSettingsPatch>>) => {
    const { targetMode, settingsPatch, changedLabels, shouldGenerate } = settingsDecision
    const applyHandler = targetMode === 'logo'
      ? (onApplyLogoSuggestions || onApplySuggestions)
      : onApplySuggestions

    if (!applyHandler) {
      alert('Error: Apply callback is not connected.')
      return true
    }

    applyHandler(settingsPatch)
    setPendingFollowUp(null)
    if (targetMode !== mode) setMode(targetMode)
    if (shouldGenerate) onGenerateFromAIHelper?.(targetMode)
    const updateMessagePrefix = shouldGenerate
      ? targetMode === 'logo' ? 'logo settings updated and generation started' : 'image settings updated and generation started'
      : targetMode === 'logo' ? 'Logo settings updated' : 'Image settings updated'
    appendLocalMessage({ role: 'user', content: userInput, mode: targetMode })
    appendLocalMessage({
      role: 'assistant',
      content: buildLocalActionSummary({
        summary: `${updateMessagePrefix}: ${changedLabels.join(', ')}.`,
        preserving: 'Current prompt text and visual direction.',
        changing: `Generator settings: ${changedLabels.join(', ')}.`,
        action: shouldGenerate
          ? `Applied settings and started ${targetMode} generation.`
          : `Applied settings to the ${targetMode} generator.`,
        note: 'No prompt text was changed.',
      }),
      mode: targetMode,
    })
    return true
  }

  const runDirectSettingsDecisionCommand = (userInput: string) => {
    const settingsDecision = buildDirectSettingsPatch(userInput)
    if (!settingsDecision) return false
    return applyDirectSettingsPatch(userInput, settingsDecision)
  }

  const handleQuickSettingClick = (prompt: string) => {
    if (runDirectSettingsDecisionCommand(prompt)) return
    void runHelperPrompt(prompt)
  }

  const runDirectSuggestionPatchCommand = (userInput: string) => {
    if (uploadedImages.length > 0) return false

    const patchGenerateCommandTerms = [
      'make the logo background white and generate',
      'make the image background white and generate',
      'make the background white and generate',
      'make it transparent and generate',
      'match the logo reference font and generate',
      'match reference font and generate',
      'change only the font and generate',
      'preserve exact text and generate',
      'make the logo say A86 Residence and generate',
      'change the logo text to A86 Residence and generate',
      'then generate',
      'and generate',
      'generate it',
      'run it',
    ]
    const brandTextPatchTerms = [
      'make the logo say A86 Residence',
      'change the logo text to A86 Residence',
      'brand name is A86 Residence',
      'make the logo say',
      'change the logo text to',
      'set logo text to',
      'update logo text to',
      'brand name is',
      'exact text is',
    ]
    const complaintStylePatchTerms = [
      'it gave me a blue background',
      'background is blue',
      'blue background again',
      'still blue background',
      'still has a background',
      'still have some background',
      'not a true png',
      'background in the png',
      'font is wrong',
      'wrong font',
      'ignored the reference',
      'does not match the reference',
      "doesn't match the reference",
      'not following the reference',
      'not following the reference font',
      'reference drift',
    ]
    const singleChangePatchTerms = [
      'make the logo background white',
      'make the image background white',
      'make the background white',
      'white background',
      'plain white background',
      'pure white background',
      'make it transparent',
      'transparent background',
      'true png',
      'no visible background',
      'remove the background',
      'match the logo reference font',
      'match reference font',
      'match the reference font',
      'use reference font',
      'match reference typography',
      'change only the font',
      'font only',
      'preserve exact text',
      'keep exact text',
    ]

    if (!matchesNaturalDirectCommand(userInput, singleChangePatchTerms) && !matchesNaturalDirectCommand(userInput, brandTextPatchTerms) && !matchesNaturalDirectCommand(userInput, complaintStylePatchTerms)) return false

    const shouldGenerateAfterPatch = matchesNaturalDirectCommand(userInput, patchGenerateCommandTerms)
    const requestedPatchMode = detectRequestedHelperMode(userInput)
    const patchMode = requestedPatchMode || mode
    const latest = getLatestSuggestionMessage(patchMode)
    if (!latest?.message.suggestions) return false

    const suggestionPatch = buildSuggestionPatchFromFollowUp(userInput, latest.message.suggestions, latest.targetMode)
    if (!suggestionPatch) return false

    const patchedSuggestions = {
      ...latest.message.suggestions,
      ...suggestionPatch,
      _appliedAt: Date.now(),
    }

    if (!applySuggestionsForMessage(patchedSuggestions, latest.index, latest.targetMode)) return true

    updateMessageSuggestions(latest.index, patchedSuggestions)
    setPendingFollowUp(null)
    if (patchMode !== mode) setMode(patchMode)
    setAppliedIndex(latest.index)
    setTimeout(() => setAppliedIndex(null), 2000)
    if (shouldGenerateAfterPatch) onGenerateFromAIHelper?.(latest.targetMode)
    appendLocalMessage({ role: 'user', content: userInput, mode: latest.targetMode })
    appendLocalMessage({
      role: 'assistant',
      content: buildLocalActionSummary({
        summary: shouldGenerateAfterPatch
          ? `Updated the latest ${latest.targetMode} suggestion, applied it to the generator, and started generation.`
          : `Updated the latest ${latest.targetMode} suggestion and applied it to the generator.`,
        preserving: 'Latest suggestion prompt and stable design choices.',
        changing: 'Only the requested refinement.',
        action: shouldGenerateAfterPatch
          ? `Applied the patched ${latest.targetMode} suggestion and started generation.`
          : `Applied the patched ${latest.targetMode} suggestion.`,
        note: shouldGenerateAfterPatch ? 'No extra model call was needed.' : 'No model call was needed.',
      }),
      mode: latest.targetMode,
    })
    return true
  }

  const runDirectLogoSettingsCommand = (userInput: string) => {
    const normalized = normalizeDirectCommand(userInput)
    const logoSettingsCommandTerms = [
      'use exact text overlay',
      'set exact text overlay',
      'exact text overlay',
      'exact text mode',
      'use ai text',
      'set ai text',
      'ai text mode',
      'let ai draw text',
      'use chatgpt images 2.0',
      'use chatgpt images 2',
      'use gpt image 2',
      'use openai image',
      'set 1k',
      'set 2k',
      'set 4k',
      '1k resolution',
      '2k resolution',
      '4k resolution',
    ]

    if (!matchesNaturalDirectCommand(userInput, logoSettingsCommandTerms)) return false

    const wantsExactText = ['use exact text overlay', 'set exact text overlay', 'exact text overlay', 'exact text mode'].some((term) => normalized.includes(term))
    const wantsAiText = ['use ai text', 'set ai text', 'ai text mode', 'let ai draw text'].some((term) => normalized.includes(term))
    const wantsGptImage2 = ['use chatgpt images 2.0', 'use chatgpt images 2', 'use gpt image 2', 'use openai image'].some((term) => normalized.includes(term))
    const resolutionPatch = normalized.includes('set 4k') || normalized.includes('4k resolution')
      ? { resolution: '4K' }
      : normalized.includes('set 2k') || normalized.includes('2k resolution')
        ? { resolution: '2K' }
        : normalized.includes('set 1k') || normalized.includes('1k resolution')
          ? { resolution: '1K' }
          : {}
    const requestedMode = detectRequestedHelperMode(userInput)
    const targetMode: AIHelperMode = (wantsExactText || wantsAiText) ? 'logo' : requestedMode || mode

    const settingsPatch = {
      ...(wantsExactText ? { textMode: 'exact-text-overlay' } : {}),
      ...(wantsAiText ? { textMode: 'ai-text' } : {}),
      ...(wantsGptImage2 ? { selectedModel: 'gpt-image-2' } : {}),
      ...resolutionPatch,
      _appliedAt: Date.now(),
    }
    const requestedResolution = typeof settingsPatch.resolution === 'string' ? settingsPatch.resolution : null

    const changedLabels = [
      wantsExactText ? 'exact text overlay' : null,
      wantsAiText ? 'AI text mode' : null,
      wantsGptImage2 ? 'ChatGPT Images 2.0' : null,
      requestedResolution ? `${requestedResolution} resolution` : null,
    ].filter(Boolean)

    if (changedLabels.length === 0) return false

    const applyHandler = targetMode === 'logo'
      ? (onApplyLogoSuggestions || onApplySuggestions)
      : onApplySuggestions

    if (!applyHandler) {
      alert('Error: Apply callback is not connected.')
      return true
    }

    applyHandler(settingsPatch)
    setPendingFollowUp(null)
    if (targetMode !== mode) setMode(targetMode)
    const updateMessagePrefix = targetMode === 'logo' ? 'Logo settings updated:' : 'Image settings updated:'
    appendLocalMessage({ role: 'user', content: userInput, mode: targetMode })
    appendLocalMessage({
      role: 'assistant',
      content: buildLocalActionSummary({
        summary: `${updateMessagePrefix} ${changedLabels.join(', ')}.`,
        preserving: 'Current prompt text and visual direction.',
        changing: `Generator settings: ${changedLabels.join(', ')}.`,
        action: `Applied settings to the ${targetMode} generator.`,
        note: 'No prompt text was changed.',
      }),
      mode: targetMode,
    })
    return true
  }

  const runDirectSuggestionCommand = (userInput: string) => {
    if (uploadedImages.length > 0) return false

    const generateCommandTerms = [
      'generate it',
      'generate this',
      'run it',
      'try it',
      'do it',
      'go ahead',
      'go ahead and generate',
      'apply and generate',
      'use it and generate',
      'use that and generate',
    ]
    const applyCommandTerms = [
      'apply it',
      'apply this',
      'apply that',
      'use it',
      'use this',
      'use that',
      'set it',
      'load it',
    ]
    const shouldGenerate = matchesDirectCommand(userInput, generateCommandTerms)
    const shouldApply = !shouldGenerate && matchesDirectCommand(userInput, applyCommandTerms)
    if (!shouldGenerate && !shouldApply) return false

    const latest = getLatestSuggestionMessage()
    if (!latest?.message.suggestions) return false

    const suggestions = { ...latest.message.suggestions, _appliedAt: Date.now() }
    if (!applySuggestionsForMessage(suggestions, latest.index, latest.targetMode)) return true

    appendLocalMessage({ role: 'user', content: userInput, mode: latest.targetMode })
    appendLocalMessage({
      role: 'assistant',
      content: buildLocalActionSummary({
        summary: shouldGenerate
          ? `Started generation from the latest ${latest.targetMode} suggestion.`
          : `Applied the latest ${latest.targetMode} suggestion to the generator.`,
        preserving: 'Latest suggestion prompt and stable design choices.',
        changing: shouldGenerate ? 'Generator run state only.' : 'Generator fields from the latest suggestion.',
        action: shouldGenerate
          ? `Applied the latest ${latest.targetMode} suggestion and started generation.`
          : `Applied the latest ${latest.targetMode} suggestion.`,
      }),
      mode: latest.targetMode,
    })
    setAppliedIndex(latest.index)
    setTimeout(() => setAppliedIndex(null), 2000)
    if (shouldGenerate) onGenerateFromAIHelper?.(latest.targetMode)
    return true
  }

  const runDirectLatestOutputCommand = (userInput: string) => {
    if (uploadedImages.length > 0) return false

    const critiqueCommandTerms = [
      'critique',
      'critique latest',
      'critique this',
      'what went wrong',
      'what missed',
      'why is it wrong',
      'fix the latest',
    ]
    const compareCommandTerms = [
      'compare to reference',
      'compare it to the reference',
      'compare latest to reference',
      'match the reference',
      'closer to the reference',
    ]
    const variationCommandTerms = [
      'make a variation',
      'make another variation',
      'make another version',
      'another version',
      'new version',
      'try another version',
      'create another option',
    ]

    const directAction: Extract<AIHelperAction['type'], 'critique_last_output' | 'make_variation' | 'compare_to_reference'> | null =
      matchesNaturalDirectCommand(userInput, compareCommandTerms)
        ? 'compare_to_reference'
        : matchesNaturalDirectCommand(userInput, variationCommandTerms)
          ? 'make_variation'
          : matchesNaturalDirectCommand(userInput, critiqueCommandTerms)
            ? 'critique_last_output'
            : null

    if (!directAction) return false

    const latestOutput = mode === 'logo' ? latestOutputs.logo : latestOutputs.image
    const feedbackMessage = directAction === 'compare_to_reference'
      ? `Comparing the latest ${mode} to the remembered reference.`
      : directAction === 'make_variation'
        ? `Making a new variation from the latest ${mode}.`
        : `Critiquing the latest ${mode} output.`

    appendLocalMessage({ role: 'user', content: userInput, mode })

    if (!latestOutput?.url) {
      appendLocalMessage({
        role: 'assistant',
        content: `Generate a ${mode} first, then I can ${directAction === 'make_variation' ? 'make a variation from it' : directAction === 'compare_to_reference' ? 'compare it to the reference' : 'critique it'}.`,
        mode,
      })
      return true
    }

    appendLocalMessage({ role: 'assistant', content: feedbackMessage, mode })
    void sendActionMessage(directAction, currentPromptSettings, latestOutput, mode, { skipUserMessage: true })
    return true
  }

  const runHelperPrompt = async (prompt?: string) => {
    if (isLoading) return
    const userInput = prompt?.trim() || input.trim() || (mode === 'logo' ? 'Help me design a logo based on this reference' : 'Help me create a prompt based on this reference image')
    if (!userInput.trim() && uploadedImages.length === 0) return
    if (!prompt) {
      const didClearMemory = await runDirectClearMemoryCommand(userInput)
      if (didClearMemory) {
        setInput('')
        return
      }
    }
    if (!prompt && runDirectSettingsDecisionCommand(userInput)) {
      setInput('')
      return
    }
    if (!prompt && runDirectBackgroundRemovalCommand(userInput)) {
      setInput('')
      return
    }
    if (!prompt && runDirectLogoSettingsCommand(userInput)) {
      setInput('')
      return
    }
    if (!prompt && runDirectSuggestionPatchCommand(userInput)) {
      setInput('')
      return
    }
    if (!prompt && pendingFollowUp && userInput.trim()) {
      const followUpRequest = buildClarificationContinuationRequest(pendingFollowUp.prompt, userInput)
      const followUpMode = pendingFollowUp.mode
      setPendingFollowUp(null)
      setInput('')
      followUpMode === 'logo'
        ? await sendLogoMessage(followUpRequest, currentPromptSettings, { displayMessage: userInput })
        : await sendMessage(followUpRequest, currentPromptSettings, { displayMessage: userInput })
      return
    }
    if (!prompt && runDirectLatestOutputCommand(userInput)) {
      setInput('')
      return
    }
    if (!prompt && runDirectSuggestionCommand(userInput)) {
      setInput('')
      return
    }
    setInput('')
    const targetMode = !prompt ? detectRequestedHelperMode(userInput) || mode : mode
    if (targetMode !== mode) setMode(targetMode)
    targetMode === 'logo' ? await sendLogoMessage(userInput, currentPromptSettings) : await sendMessage(userInput, currentPromptSettings)
  }

  const handleSend = async () => runHelperPrompt()

  const updateEditedField = (field: string, value: string) => setEditedSuggestions((prev: any) => ({ ...prev, [field]: value }))

  return {
    // composer + edit state
    input, setInput,
    copiedField,
    editingIndex,
    editedSuggestions,
    appliedIndex,
    pendingFollowUp, setPendingFollowUp,
    messagesEndRef,
    // chat state from useAIHelper (API unchanged)
    messages,
    uploadedImages,
    isLoading,
    mode, setMode,
    clearHistory,
    removeImage,
    preferenceCount,
    preferenceMemory,
    activeDesignBrief,
    sharedProjectBrief,
    activeTaskContext,
    forgetPreference,
    cancelRequest,
    // handlers
    handleImageUpload,
    handleCopy,
    handleEditStart,
    handleEditCancel,
    handleEditSave,
    handleApplyClick,
    handleRunAction,
    handleQuickSettingClick,
    applyLogoConfigFromMessage,
    runHelperPrompt,
    handleSend,
    updateEditedField,
    // host callbacks (for conditional rendering in chat UI)
    callbacks: { onApplySuggestions, onApplyLogoSuggestions, onApplyLogoConfig },
  }
}

export type AIHelperChatController = ReturnType<typeof useAIHelperChatController>
