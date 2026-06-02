/**
 * 🔒 PROTECTED: AI HELPER SIDEBAR
 *
 * This file is part of the AI Helper feature and should not be modified without explicit approval.
 *
 * APPROVAL REQUIRED: Use phrase "APPROVE SIGNIFICANT CHANGE"
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { useAIHelper, type AIHelperAction, type AIHelperActiveTask, type AIHelperLatestOutput, type AIHelperMode, type AIMessage } from '../hooks/useAIHelper'
import type { DotMatrixConfig } from '../constants/dot-matrix-config'
import type { CreativeDirectionState } from '../constants/creative-direction-options'

// Sub-components
import { AIHelperHeader, EmptyState } from './AIHelper/AIHelperHeader'
import { MessageBubble, LoadingIndicator } from './AIHelper/MessageBubble'
import { LogoConfigCard } from './AIHelper/LogoConfigCard'
import { SuggestionCard, SUGGESTION_APPLY_LABELS } from './AIHelper/SuggestionCard'
import { ImageUploadPreview } from './AIHelper/ImageUploadPreview'
import { ChatInput } from './AIHelper/ChatInput'
import { SmartActionBar } from './AIHelper/SmartActionBar'
import { ContextSnapshot } from './AIHelper/ContextSnapshot'
import { PromptSuggestionChips } from './AIHelper/PromptSuggestionChips'
import { PromptPreflightPanel } from './AIHelper/PromptPreflightPanel'
import { QuickSettingsPanel } from './AIHelper/QuickSettingsPanel'
import { DesignBriefCard } from './AIHelper/DesignBriefCard'
import { ExecutionPlanCard } from './AIHelper/ExecutionPlanCard'
import { DiagnosticCard } from './AIHelper/DiagnosticCard'
import { PromptQualityCard } from './AIHelper/PromptQualityCard'

const AI_HELPER_PANEL_EXPANDED_WIDTH = '100vw'
type AIHelperSettingsTab = 'overview' | 'quick-settings'

interface AIHelperSidebarProps {
  isOpen: boolean
  onClose: () => void
  currentPromptSettings?: {
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
    logoHasReferenceImage?: boolean
    logoReferenceMode?: string
    hasReferenceImage?: boolean
    referenceImageMode?: string
    promptMode?: string
    creativeDirection?: CreativeDirectionState
    latestImageOutput?: { hasOutput: boolean; prompt?: string; timestamp?: number }
    latestLogoOutput?: { hasOutput: boolean; prompt?: string; timestamp?: number }
  }
  latestOutputs?: {
    image?: AIHelperLatestOutput | null
    logo?: AIHelperLatestOutput | null
  }
  onApplySuggestions?: (suggestions: any) => void
  onApplyLogoSuggestions?: (suggestions: any) => void
  onApplyLogoConfig?: (config: Partial<DotMatrixConfig>) => void
  onGenerateFromAIHelper?: (mode: AIHelperMode, options?: { imageCount?: number }) => void
}

export function AIHelperSidebar({ isOpen, onClose, currentPromptSettings = {}, latestOutputs = {}, onApplySuggestions, onApplyLogoSuggestions, onApplyLogoConfig, onGenerateFromAIHelper }: AIHelperSidebarProps) {
  const [input, setInput] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editedSuggestions, setEditedSuggestions] = useState<any>({})
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null)
  const [helperSettingsTab, setHelperSettingsTab] = useState<AIHelperSettingsTab>('overview')
  const [pendingFollowUp, setPendingFollowUp] = useState<{ prompt: string; mode: AIHelperMode } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, uploadedImages, isLoading, mode, setMode, sendMessage, sendLogoMessage, sendActionMessage, addImage, removeImage, clearHistory, updateMessageSuggestions, preferenceCount, preferenceMemory, activeDesignBrief, sharedProjectBrief, activeTaskContext, forgetPreference, cancelRequest, appendLocalMessage } = useAIHelper()

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if (isOpen) setHelperSettingsTab('overview') }, [isOpen])

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

  const normalizeDirectCommand = (value: string) => value
    .toLowerCase()
    .trim()
    .replace(/[.!?]+$/g, '')
    .replace(/^(ok|okay|yes|yep|please|sure)[,\s]+/g, '')
    .trim()

  const detectRequestedHelperMode = (value: string): AIHelperMode | null => {
    const normalized = normalizeDirectCommand(value)
    const logoRequestTerms = [
      'logo',
      'wordmark',
      'brand mark',
      'brandmark',
      'monogram',
      'business logo',
      'company logo',
      'symbol-only',
      'text logo',
    ]
    const imageRequestTerms = [
      'image',
      'photo',
      'picture',
      'poster',
      'flyer',
      'illustration',
      'artwork',
      'ad creative',
      'social media post',
      'product shot',
    ]
    const asksForLogo = logoRequestTerms.some((term) => normalized.includes(term))
    const asksForImage = imageRequestTerms.some((term) => normalized.includes(term))

    if (asksForLogo && !asksForImage) return 'logo'
    if (asksForImage && !asksForLogo) return 'image'
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

  const matchesDirectCommand = (value: string, terms: string[]) => terms.includes(normalizeDirectCommand(value))

  const matchesNaturalDirectCommand = (value: string, terms: string[]) => {
    const normalized = normalizeDirectCommand(value)
    return terms.some((term) => normalized === term || normalized.includes(term))
  }

  const appendPromptDirective = (prompt: string | undefined, directive: string) => {
    const basePrompt = prompt?.trim() || ''
    if (basePrompt.toLowerCase().includes(directive.toLowerCase())) return basePrompt
    return basePrompt ? `${basePrompt}\n\n${directive}` : directive
  }

  const appendNegativeDirective = (negativePrompt: string | undefined, directive: string) => {
    const baseNegative = negativePrompt?.trim() || ''
    if (!baseNegative) return directive
    if (baseNegative.toLowerCase().includes(directive.toLowerCase())) return baseNegative
    return `${baseNegative}, ${directive}`
  }

  const buildLocalActionSummary = ({
    summary,
    preserving,
    changing,
    action,
    note,
  }: {
    summary: string
    preserving: string
    changing: string
    action: string
    note?: string
  }) => [
    summary,
    `Preserving: ${preserving}`,
    `Changing: ${changing}`,
    `Action: ${action}`,
    note,
  ].filter(Boolean).join('\n')

  const extractRequestedBrandText = (userInput: string) => {
    const trimmedInput = userInput.trim().replace(/[.!?]+$/g, '')
    const brandTextPatterns = [
      /(?:make|change|set|update)\s+(?:the\s+)?(?:logo\s+|brand\s+)?(?:text|wording)\s+(?:to|say)\s+["']?(.+?)["']?$/i,
      /(?:make|change|set|update)\s+(?:the\s+)?logo\s+say\s+["']?(.+?)["']?$/i,
      /(?:brand\s+name|logo\s+name|exact\s+text)\s+(?:is|should\s+be|to)\s+["']?(.+?)["']?$/i,
      /(?:use|set)\s+["'](.+?)["']\s+as\s+(?:the\s+)?(?:brand\s+text|logo\s+text|exact\s+text)$/i,
    ]
    const match = brandTextPatterns
      .map((pattern) => trimmedInput.match(pattern)?.[1]?.trim())
      .find(Boolean)

    if (!match) return null
    return match
      .replace(/\s+(?:and\s+)?(?:generate|run it|try it|apply it)$/i, '')
      .replace(/^["']|["']$/g, '')
      .trim()
  }

  const buildSuggestionPatchFromFollowUp = (
    userInput: string,
    suggestions: AIMessage['suggestions'],
    targetMode: AIHelperMode
  ): Partial<NonNullable<AIMessage['suggestions']>> | null => {
    const normalized = normalizeDirectCommand(userInput)
    const requestedBrandText = extractRequestedBrandText(userInput)
    const wantsWhiteBackground = [
      'make the background white',
      'white background',
      'plain white background',
      'pure white background',
      'make it white',
    ].some((term) => normalized.includes(term))
    const wantsTransparentBackground = [
      'make it transparent',
      'transparent background',
      'true png',
      'no visible background',
      'remove the background',
    ].some((term) => normalized.includes(term))
    const wantsReferenceTypography = [
      'match reference font',
      'match the reference font',
      'use reference font',
      'make font like reference',
      'match reference typography',
    ].some((term) => normalized.includes(term))
    const wantsFontOnlyChange = [
      'change only the font',
      'font only',
      'only change the font',
      'just change the font',
    ].some((term) => normalized.includes(term))
    const wantsExactText = [
      'preserve exact text',
      'keep exact text',
      'exact spelling',
      'do not change the words',
      'same words',
    ].some((term) => normalized.includes(term))
    const reportsRejectedBlueBackground = [
      'it gave me a blue background',
      'it is giving me a blue background',
      'it gave a blue background',
      'background is blue',
      'blue background again',
      'still blue background',
    ].some((term) => normalized.includes(term))
    const reportsVisibleBackgroundAfterTransparentRequest = [
      'still has a background',
      'still have some background',
      'has a background not a true png',
      'not a true png',
      'not true png',
      'background in the png',
    ].some((term) => normalized.includes(term))
    const reportsReferenceDrift = [
      'ignored the reference',
      'does not match the reference',
      "doesn't match the reference",
      'not following the reference',
      'not following that reference',
      'reference drift',
    ].some((term) => normalized.includes(term))
    const reportsWrongFont = [
      'font is wrong',
      'wrong font',
      'typeface is wrong',
      'lettering is wrong',
      'not following the font',
      'not following the reference font',
    ].some((term) => normalized.includes(term))

    if (!suggestions || (!requestedBrandText && !wantsWhiteBackground && !wantsTransparentBackground && !wantsReferenceTypography && !wantsFontOnlyChange && !wantsExactText && !reportsRejectedBlueBackground && !reportsVisibleBackgroundAfterTransparentRequest && !reportsReferenceDrift && !reportsWrongFont)) {
      return null
    }

    let prompt = suggestions.prompt || ''
    let negativePrompt = suggestions.negativePrompt || ''
    const patch: Partial<NonNullable<AIMessage['suggestions']>> = {}

    if (wantsWhiteBackground) {
      prompt = appendPromptDirective(prompt, 'Single-change refinement: make the background a visible flat pure white (#FFFFFF) background; preserve every other approved element.')
      negativePrompt = appendNegativeDirective(negativePrompt, 'blue background, navy background, dark background, gradient background, transparent background')
      if (targetMode === 'logo') patch.bgRemovalMethod = 'none'
    }

    if (reportsRejectedBlueBackground) {
      prompt = appendPromptDirective(prompt, 'Single-change refinement: failed background correction: use a visible flat pure white (#FFFFFF) background only; preserve every other approved element and treat any blue background as rejected blue background.')
      negativePrompt = appendNegativeDirective(negativePrompt, 'rejected blue background, blue background, navy background, cyan background, dark background, gradient background')
      if (targetMode === 'logo') patch.bgRemovalMethod = 'none'
    }

    if (wantsTransparentBackground) {
      prompt = appendPromptDirective(prompt, 'Single-change refinement: create a transparent PNG with no visible background; preserve every other approved element.')
      negativePrompt = appendNegativeDirective(negativePrompt, 'visible background, white box, dark backdrop, colored backdrop, checkerboard pattern')
      patch.bgRemovalMethod = 'photoroom'
    }

    if (reportsVisibleBackgroundAfterTransparentRequest) {
      prompt = appendPromptDirective(prompt, 'Single-change refinement: failed transparent PNG correction: create a true transparent PNG with no visible background, no leftover rectangle, and no background residue; preserve every other approved element.')
      negativePrompt = appendNegativeDirective(negativePrompt, 'visible background, leftover background, rectangle backdrop, white box, dark backdrop, colored backdrop, checkerboard pattern')
      patch.bgRemovalMethod = 'photoroom'
    }

    if (wantsReferenceTypography) {
      prompt = appendPromptDirective(prompt, 'Single-change refinement: match the reference typography as closely as possible, including letter proportions, stroke contrast, spacing, capitalization, and visual rhythm; preserve every other approved element.')
      negativePrompt = appendNegativeDirective(negativePrompt, 'wrong font, generic font, dot matrix style, mismatched typography, altered wording')
      if (targetMode === 'logo') patch.textMode = 'exact-text-overlay'
    }

    if (reportsReferenceDrift || reportsWrongFont) {
      prompt = appendPromptDirective(prompt, 'Single-change refinement: failed reference match correction: correct reference drift by matching the uploaded/reference typography, letter proportions, stroke contrast, spacing, capitalization, and visual rhythm; preserve every other approved element.')
      negativePrompt = appendNegativeDirective(negativePrompt, 'reference drift, ignored reference, does not match the reference, wrong font, generic font, dot matrix style, mismatched typography, altered wording')
      if (targetMode === 'logo') patch.textMode = 'exact-text-overlay'
    }

    if (wantsFontOnlyChange) {
      prompt = appendPromptDirective(prompt, 'Single-change refinement: change only the font/typography treatment; preserve every other approved element, layout, colors, background, icon, and composition.')
      negativePrompt = appendNegativeDirective(negativePrompt, 'composition changes, color changes, background changes, icon changes, extra words')
    }

    if (wantsExactText) {
      prompt = appendPromptDirective(prompt, 'Single-change refinement: preserve exact text, spelling, capitalization, spacing, and line breaks; preserve every other approved element.')
      negativePrompt = appendNegativeDirective(negativePrompt, 'misspelled text, extra words, missing words, incorrect capitalization, altered wording')
      if (targetMode === 'logo') patch.textMode = 'exact-text-overlay'
    }

    if (requestedBrandText) {
      prompt = appendPromptDirective(prompt, `Single-change refinement: set exact visible brand text to "${requestedBrandText}" as the exact brand text; preserve every other approved element.`)
      negativePrompt = appendNegativeDirective(negativePrompt, 'misspelled brand text, wrong brand name, extra words, missing words, incorrect capitalization, altered wording')
      if (targetMode === 'logo') patch.textMode = 'exact-text-overlay'
    }

    return {
      ...patch,
      prompt,
      negativePrompt,
    }
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
      'native transparent png',
      'native png',
      'true native png',
      'model-side transparent',
      'turn off background removal',
      'disable background removal',
      'no background removal',
      'normal logo with background',
      'normal image with background',
    ]

    if (!matchesNaturalDirectCommand(userInput, backgroundRemovalCommandTerms)) return false

    const wantsNativeTransparent = ['native transparent png', 'native png', 'true native png', 'model-side transparent'].some((term) => normalized.includes(term))
    const wantsOff = ['turn off background removal', 'disable background removal', 'no background removal', 'normal logo with background', 'normal image with background'].some((term) => normalized.includes(term))
    const wantsPhotoRoom = ['use photoroom', 'turn on photoroom', 'photoroom bg', 'photoroom background removal'].some((term) => normalized.includes(term))
    const requestedMode = detectRequestedHelperMode(userInput)
    const targetMode: AIHelperMode = wantsNativeTransparent ? 'logo' : requestedMode || mode

    if (!wantsNativeTransparent && !wantsOff && !wantsPhotoRoom) return false

    if (targetMode === 'image' && wantsNativeTransparent) {
      appendLocalMessage({ role: 'user', content: userInput, mode: targetMode })
      appendLocalMessage({
        role: 'assistant',
        content: 'Native transparent PNG is a logo-generator setting. For images, use PhotoRoom or turn background removal off.',
        mode: targetMode,
      })
      return true
    }

    const suggestions = targetMode === 'logo'
      ? wantsNativeTransparent
        ? { bgRemovalMethod: 'native-transparent', selectedModel: 'gpt-image-2', _appliedAt: Date.now() }
        : wantsOff
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
    const settingLabel = wantsNativeTransparent
      ? 'Native transparent PNG with ChatGPT Images 2.0'
      : wantsOff
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
      'native transparent png and generate',
      'and generate',
      'then generate',
      'generate it',
      'run it',
    ]
    const wantsNativeTransparent = ['native transparent png', 'native png', 'true native png', 'model-side transparent'].some((term) => normalized.includes(term))
    const wantsPhotoRoom = ['use photoroom', 'turn on photoroom', 'photoroom bg', 'photoroom background removal'].some((term) => normalized.includes(term))
    const wantsOff = ['turn off background removal', 'disable background removal', 'no background removal', 'normal logo with background', 'normal image with background'].some((term) => normalized.includes(term))
    const wantsExactText = ['use exact text overlay', 'set exact text overlay', 'exact text overlay', 'exact text mode'].some((term) => normalized.includes(term))
    const wantsAiText = ['use ai text', 'set ai text', 'ai text mode', 'let ai draw text'].some((term) => normalized.includes(term))
    const wantsGptImage2 = ['use chatgpt images 2.0', 'use chatgpt images 2', 'use gpt image 2', 'use openai image'].some((term) => normalized.includes(term))
    const wantsGeminiFlash = ['use gemini flash', 'use gemini 3.1 flash'].some((term) => normalized.includes(term))
    const wantsGeminiPro = ['use gemini pro', 'use gemini 3 pro'].some((term) => normalized.includes(term))
    const resolution = normalized.includes('set 4k') || normalized.includes('4k resolution') || normalized.includes('and 4k') || normalized.endsWith('4k')
      ? '4K'
      : normalized.includes('set 2k') || normalized.includes('2k resolution') || normalized.includes('and 2k') || normalized.endsWith('2k')
        ? '2K'
        : normalized.includes('set 1k') || normalized.includes('1k resolution') || normalized.includes('and 1k') || normalized.endsWith('1k')
          ? '1K'
          : null
    const requestedMode = detectRequestedHelperMode(userInput)
    const targetMode: AIHelperMode = (wantsNativeTransparent || wantsExactText || wantsAiText || normalized.includes('normal logo with background'))
      ? 'logo'
      : requestedMode || mode
    const settingsPatch: Partial<NonNullable<AIMessage['suggestions']>> = {}
    const changedLabels: string[] = []

    if (wantsNativeTransparent) {
      settingsPatch.bgRemovalMethod = 'native-transparent'
      settingsPatch.selectedModel = 'gpt-image-2'
      changedLabels.push('native transparent PNG', 'ChatGPT Images 2.0')
    } else if (wantsPhotoRoom) {
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
    } else if (wantsGeminiFlash) {
      settingsPatch.selectedModel = 'gemini-3.1-flash-image-preview'
      changedLabels.push('Gemini 3.1 Flash')
    } else if (wantsGeminiPro) {
      settingsPatch.selectedModel = 'gemini-3-pro-image-preview'
      changedLabels.push('Gemini 3 Pro')
    }

    if (resolution) {
      settingsPatch.resolution = resolution
      changedLabels.push(`${resolution} resolution`)
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
      'use gemini flash',
      'use gemini 3.1 flash',
      'use gemini pro',
      'use gemini 3 pro',
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
    const wantsGeminiFlash = ['use gemini flash', 'use gemini 3.1 flash'].some((term) => normalized.includes(term))
    const wantsGeminiPro = ['use gemini pro', 'use gemini 3 pro'].some((term) => normalized.includes(term))
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
      ...(wantsGeminiFlash ? { selectedModel: 'gemini-3.1-flash-image-preview' } : {}),
      ...(wantsGeminiPro ? { selectedModel: 'gemini-3-pro-image-preview' } : {}),
      ...resolutionPatch,
      _appliedAt: Date.now(),
    }
    const requestedResolution = typeof settingsPatch.resolution === 'string' ? settingsPatch.resolution : null

    const changedLabels = [
      wantsExactText ? 'exact text overlay' : null,
      wantsAiText ? 'AI text mode' : null,
      wantsGptImage2 ? 'ChatGPT Images 2.0' : null,
      wantsGeminiFlash ? 'Gemini 3.1 Flash' : null,
      wantsGeminiPro ? 'Gemini 3 Pro' : null,
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

  if (!isOpen) return null

  const suggestionMessages = messages.filter(m => m.suggestions)
  const contextVariant = 'workspace'
  const halfCanvasWorkspaceStyle = { gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }
  const helperWorkspaceClass = 'grid min-h-0 flex-1 grid-cols-1 bg-zinc-900 lg:grid-cols-none'
  const helperWorkspaceStyle = halfCanvasWorkspaceStyle
  const helperSettingsRailClass = 'min-h-0 overflow-y-auto border-b border-[#c99850]/20 bg-zinc-950/70 lg:border-b-0 lg:border-r lg:border-[#c99850]/25'
  const helperConversationClass = 'flex min-h-0 flex-col bg-zinc-900'
  const settingsTabButtonClass = 'flex min-h-[52px] flex-1 flex-col items-start justify-center rounded-md border px-3 py-2 text-left transition-colors'

  return (
    <div
      className="fixed right-0 top-0 z-50 flex h-full max-w-full flex-col border-l border-[#c99850]/30 bg-zinc-900 shadow-2xl transition-[width] duration-300 animate-in slide-in-from-right"
      style={{ width: AI_HELPER_PANEL_EXPANDED_WIDTH }}
    >
      <AIHelperHeader
        mode={mode}
        setMode={setMode}
        onClearHistory={clearHistory}
        onClose={onClose}
      />

      <div className={helperWorkspaceClass} style={helperWorkspaceStyle}>
        <div className={helperSettingsRailClass}>
          <div className="sticky top-0 z-10 border-b border-[#c99850]/20 bg-zinc-950/95 px-4 py-3 backdrop-blur sm:px-5">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Settings</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHelperSettingsTab('overview')}
                className={`${settingsTabButtonClass} ${
                  helperSettingsTab === 'overview'
                    ? 'border-[#c99850]/50 bg-[#c99850]/15 text-[#f0d49b]'
                    : 'border-zinc-700 bg-zinc-900/80 text-zinc-400 hover:border-[#c99850]/40 hover:text-zinc-100'
                }`}
              >
                <span className="text-sm font-semibold">Overview</span>
                <span className="text-[11px] font-medium text-zinc-500">References & Memory</span>
              </button>
              <button
                type="button"
                onClick={() => setHelperSettingsTab('quick-settings')}
                className={`${settingsTabButtonClass} ${
                  helperSettingsTab === 'quick-settings'
                    ? 'border-[#c99850]/50 bg-[#c99850]/15 text-[#f0d49b]'
                    : 'border-zinc-700 bg-zinc-900/80 text-zinc-400 hover:border-[#c99850]/40 hover:text-zinc-100'
                }`}
              >
                <span className="text-sm font-semibold">Quick Settings</span>
                <span className="text-[11px] font-medium text-zinc-500">Resolution & Next</span>
              </button>
            </div>
          </div>

          {helperSettingsTab === 'overview' && (
            <ContextSnapshot
              mode={mode}
              variant={contextVariant}
              currentPromptSettings={currentPromptSettings}
              uploadedImages={uploadedImages}
              preferenceCount={preferenceCount}
              preferenceMemory={preferenceMemory}
              activeDesignBrief={activeDesignBrief}
              sharedProjectBrief={sharedProjectBrief}
              activeTaskContext={activeTaskContext as AIHelperActiveTask | undefined}
              onForgetPreference={forgetPreference}
              latestOutputs={latestOutputs}
            />
          )}

          {helperSettingsTab === 'quick-settings' && (
            <>
              <QuickSettingsPanel
                mode={mode}
                currentPromptSettings={currentPromptSettings}
                onRunSetting={handleQuickSettingClick}
              />

              <PromptSuggestionChips
                mode={mode}
                currentPromptSettings={currentPromptSettings}
                uploadedImages={uploadedImages}
                latestOutputs={latestOutputs}
                onSelectPrompt={setInput}
                onRunPrompt={(prompt) => void runHelperPrompt(prompt)}
              />

              <PromptPreflightPanel
                mode={mode}
                currentPromptSettings={currentPromptSettings}
                uploadedImages={uploadedImages}
                onAskHelper={setInput}
                onRunFix={(prompt) => void runHelperPrompt(prompt)}
              />
            </>
          )}
        </div>

        <div className={helperConversationClass}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.length === 0 && !isLoading && <EmptyState mode={mode} />}

            {messages.map((msg, idx) => (
              <div key={idx}>
                <MessageBubble role={msg.role} content={msg.content} />

                {msg.designBrief && (
                  <DesignBriefCard designBrief={msg.designBrief} />
                )}

                {msg.executionPlan && (
                  <ExecutionPlanCard executionPlan={msg.executionPlan} />
                )}

                {msg.promptQualityChecklist && (
                  <PromptQualityCard plannerDecision={msg.plannerDecision} checklist={msg.promptQualityChecklist} />
                )}

                {msg.diagnosticFindings && (
                  <DiagnosticCard findings={msg.diagnosticFindings} />
                )}

                {msg.actions && msg.actions.length > 0 && (
                  <SmartActionBar actions={msg.actions} onRunAction={(action) => handleRunAction(action, idx, msg)} />
                )}

                {msg.logoConfig && Object.keys(msg.logoConfig).length > 0 && onApplyLogoConfig && (
                  <LogoConfigCard
                    logoConfig={msg.logoConfig}
                    isApplied={appliedIndex === idx}
                    onApply={() => { onApplyLogoConfig(msg.logoConfig!); setAppliedIndex(idx); setTimeout(() => setAppliedIndex(null), 2000) }}
                  />
                )}

                {msg.suggestions && (onApplySuggestions || onApplyLogoSuggestions) && (
                  <SuggestionCard
                    suggestions={msg.suggestions}
                    idx={idx}
                    isLatest={idx === suggestionMessages.length - 1 && suggestionMessages.length > 1}
                    isEditing={editingIndex === idx}
                    isApplied={appliedIndex === idx}
                    applyLabel={msg.mode === 'logo' ? SUGGESTION_APPLY_LABELS.logo : SUGGESTION_APPLY_LABELS.image}
                    editedSuggestions={editedSuggestions}
                    onEditStart={handleEditStart}
                    onEditCancel={handleEditCancel}
                    onEditSave={handleEditSave}
                    onApply={handleApplyClick}
                    onCopy={handleCopy}
                    copiedField={copiedField}
                    updateEditedField={updateEditedField}
                  />
                )}
              </div>
            ))}

            {isLoading && <LoadingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          <ImageUploadPreview images={uploadedImages} onRemove={removeImage} />
          {pendingFollowUp && (
            <div className="border-t border-[#c99850]/20 bg-zinc-950/70 px-4 py-3 sm:px-5">
              <div className="flex items-start justify-between gap-3 rounded-md border border-[#c99850]/30 bg-[#c99850]/10 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f0d49b]">Answering follow-up</div>
                  <div className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-200">{pendingFollowUp.prompt}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingFollowUp(null)}
                  className="shrink-0 rounded border border-zinc-700 px-2 py-1 text-xs font-semibold text-zinc-300 transition-colors hover:border-[#c99850]/50 hover:text-white"
                  title="Clear follow-up"
                  aria-label="Clear follow-up"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
          <ChatInput
            input={input}
            setInput={setInput}
            mode={mode}
            isLoading={isLoading}
            hasImages={uploadedImages.length > 0}
            pendingQuestion={pendingFollowUp?.prompt}
            onSend={handleSend}
            onCancelRequest={cancelRequest}
            onImageUpload={handleImageUpload}
          />
        </div>
      </div>
    </div>
  )
}
