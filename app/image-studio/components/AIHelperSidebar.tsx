/**
 * 🔒 PROTECTED: AI HELPER SIDEBAR
 *
 * This file is part of the AI Helper feature and should not be modified without explicit approval.
 *
 * APPROVAL REQUIRED: Use phrase "APPROVE SIGNIFICANT CHANGE"
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { useAIHelper, type AIHelperAction, type AIHelperLatestOutput, type AIHelperMode, type AIMessage } from '../hooks/useAIHelper'
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

const AI_HELPER_PANEL_WIDTH = 'min(720px, 100vw)'
const AI_HELPER_PANEL_EXPANDED_WIDTH = 'min(960px, 100vw)'

interface AIHelperSidebarProps {
  isOpen: boolean
  onClose: () => void
  currentPromptSettings?: {
    currentPrompt?: string
    currentNegativePrompt?: string
    currentStyle?: string
    currentCameraAngle?: string
    currentCameraLens?: string
    currentAspectRatio?: string
    styleStrength?: string
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, uploadedImages, isLoading, mode, setMode, sendMessage, sendLogoMessage, sendActionMessage, addImage, removeImage, clearHistory, updateMessageSuggestions, preferenceCount, preferenceMemory, forgetPreference } = useAIHelper()

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const runHelperPrompt = async (prompt?: string) => {
    if (isLoading) return
    const userInput = prompt?.trim() || input.trim() || (mode === 'logo' ? 'Help me design a logo based on this reference' : 'Help me create a prompt based on this reference image')
    if (!userInput.trim() && uploadedImages.length === 0) return
    setInput('')
    mode === 'logo' ? await sendLogoMessage(userInput, currentPromptSettings) : await sendMessage(userInput, currentPromptSettings)
  }

  const handleSend = async () => runHelperPrompt()

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
      setInput(action.prompt)
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
      <ChatInput input={input} setInput={setInput} mode={mode} isLoading={isLoading} hasImages={uploadedImages.length > 0} onSend={handleSend} onImageUpload={handleImageUpload} />
    </div>
  )
}
