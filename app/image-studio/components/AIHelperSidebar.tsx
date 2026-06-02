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
import { DesignBriefCard } from './AIHelper/DesignBriefCard'
import { ExecutionPlanCard } from './AIHelper/ExecutionPlanCard'
import { DiagnosticCard } from './AIHelper/DiagnosticCard'
import { PromptQualityCard } from './AIHelper/PromptQualityCard'

const AI_HELPER_PANEL_WIDTH = 'min(720px, 100vw)'
const AI_HELPER_PANEL_EXPANDED_WIDTH = 'min(960px, 100vw)'

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
  const [isExpanded, setIsExpanded] = useState(false)
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

  const getLatestSuggestionMessage = () => {
    for (let index = messages.length - 1; index >= 0; index--) {
      const message = messages[index]
      const messageMode: AIHelperMode = message.mode === 'logo' ? 'logo' : 'image'
      if (message.role === 'assistant' && message.suggestions?.prompt && messageMode === mode) {
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
      content: shouldGenerate
        ? `Started generation from the latest ${latest.targetMode} suggestion.`
        : `Applied the latest ${latest.targetMode} suggestion to the generator.`,
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

  return (
    <div
      className="fixed right-0 top-0 z-50 flex h-full max-w-full flex-col border-l border-[#c99850]/30 bg-zinc-900 shadow-2xl transition-[width] duration-300 animate-in slide-in-from-right"
      style={{ width: isExpanded ? AI_HELPER_PANEL_EXPANDED_WIDTH : AI_HELPER_PANEL_WIDTH }}
    >
      <AIHelperHeader
        mode={mode}
        setMode={setMode}
        isExpanded={isExpanded}
        onToggleExpanded={() => setIsExpanded((value) => !value)}
        onClearHistory={clearHistory}
        onClose={onClose}
      />

      <ContextSnapshot
        mode={mode}
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
  )
}
