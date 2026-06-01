/**
 * 🔒 PROTECTED: AI HELPER SIDEBAR
 *
 * This file is part of the AI Helper feature and should not be modified without explicit approval.
 *
 * APPROVAL REQUIRED: Use phrase "APPROVE SIGNIFICANT CHANGE"
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { useAIHelper, type AIHelperMode } from '../hooks/useAIHelper'
import type { DotMatrixConfig } from '../constants/dot-matrix-config'
import type { CreativeDirectionState } from '../constants/creative-direction-options'

// Sub-components
import { AIHelperHeader, EmptyState } from './AIHelper/AIHelperHeader'
import { MessageBubble, LoadingIndicator } from './AIHelper/MessageBubble'
import { LogoConfigCard } from './AIHelper/LogoConfigCard'
import { SuggestionCard, SUGGESTION_APPLY_LABELS } from './AIHelper/SuggestionCard'
import { ImageUploadPreview } from './AIHelper/ImageUploadPreview'
import { ChatInput } from './AIHelper/ChatInput'

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
  }
  onApplySuggestions?: (suggestions: any) => void
  onApplyLogoSuggestions?: (suggestions: any) => void
  onApplyLogoConfig?: (config: Partial<DotMatrixConfig>) => void
}

export function AIHelperSidebar({ isOpen, onClose, currentPromptSettings = {}, onApplySuggestions, onApplyLogoSuggestions, onApplyLogoConfig }: AIHelperSidebarProps) {
  const [input, setInput] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editedSuggestions, setEditedSuggestions] = useState<any>({})
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, uploadedImages, isLoading, mode, setMode, sendMessage, sendLogoMessage, addImage, removeImage, clearHistory, updateMessageSuggestions } = useAIHelper()

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async () => {
    if (!input.trim() && uploadedImages.length === 0) return
    if (isLoading) return
    const userInput = input.trim() || (mode === 'logo' ? 'Help me design a logo based on this reference' : 'Help me create a prompt based on this reference image')
    setInput('')
    mode === 'logo' ? await sendLogoMessage(userInput) : await sendMessage(userInput, currentPromptSettings)
  }

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

  const applySuggestionsForMessage = (suggestions: any, idx: number) => {
    const isLogoSuggestion = messages[idx]?.mode === 'logo'
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

  const updateEditedField = (field: string, value: string) => setEditedSuggestions((prev: any) => ({ ...prev, [field]: value }))

  if (!isOpen) return null

  const suggestionMessages = messages.filter(m => m.suggestions)

  return (
    <div className="fixed right-0 top-0 h-full w-[400px] bg-zinc-900 border-l border-[#c99850]/30 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 z-50">
      <AIHelperHeader mode={mode} setMode={setMode} onClearHistory={clearHistory} onClose={onClose} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && <EmptyState mode={mode} />}

        {messages.map((msg, idx) => (
          <div key={idx}>
            <MessageBubble role={msg.role} content={msg.content} />

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
