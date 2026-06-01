/**
 * 🔒 PROTECTED: AI HELPER HOOK
 *
 * Core hook for AI Helper functionality.
 * Related Files: AIHelperSidebar.tsx, api/ai-helper routes
 *
 * Key Features:
 * - Message management with suggestions
 * - Image upload and analysis integration
 * - Session-based conversation tracking
 * - updateMessageSuggestions - persists edits to messages
 */

import { useState, useEffect, useCallback } from 'react'
import type { DotMatrixConfig } from '../constants/dot-matrix-config'
import { loadStoredMessages, saveMessages, clearStoredMessages } from './useAIHelperPersistence'
import { analyzeUploadedImage } from './useImageCompression'

export type AIHelperMode = 'image' | 'logo'

export type AIHelperActionType =
  | 'apply_suggestions'
  | 'apply_and_generate'
  | 'apply_logo_config'
  | 'copy_prompt'
  | 'switch_to_image'
  | 'switch_to_logo'
  | 'ask_follow_up'

export interface AIHelperAction {
  type: AIHelperActionType
  label: string
  description?: string
  prompt?: string
  target?: AIHelperMode
}

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
  mode?: AIHelperMode
  suggestions?: {
    prompt: string
    negativePrompt?: string
    cameraAngle: string
    cameraLens: string
    style: string
    styleStrength?: 'subtle' | 'moderate' | 'strong'
    aspectRatio?: string
    resolution?: string
  }
  logoConfig?: Partial<DotMatrixConfig>
  actions?: AIHelperAction[]
}

export interface AIHelperAgentMemory {
  mode: AIHelperMode
  lastImagePrompt?: string
  lastLogoPrompt?: string
  lastNegativePrompt?: string
  lastAssistantSummary?: string
  recentUserRequests: string[]
}

export function buildAgentMemory(messages: AIMessage[], mode: AIHelperMode): AIHelperAgentMemory {
  const recentUserRequests = messages
    .filter((message) => message.role === 'user' && (!message.mode || message.mode === mode))
    .slice(-4)
    .map((message) => message.content)

  const lastImageSuggestion = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant' && message.mode !== 'logo' && message.suggestions?.prompt)

  const lastLogoSuggestion = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant' && message.mode === 'logo' && message.suggestions?.prompt)

  const lastAssistant = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant' && (!message.mode || message.mode === mode))

  return {
    mode,
    lastImagePrompt: lastImageSuggestion?.suggestions?.prompt,
    lastLogoPrompt: lastLogoSuggestion?.suggestions?.prompt,
    lastNegativePrompt: lastLogoSuggestion?.suggestions?.negativePrompt || lastImageSuggestion?.suggestions?.negativePrompt,
    lastAssistantSummary: lastAssistant?.content,
    recentUserRequests,
  }
}

export function useAIHelper() {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const [mode, setMode] = useState<AIHelperMode>('image')

  // Load chat history on mount
  useEffect(() => {
    const storedMessages = loadStoredMessages()
    if (storedMessages.length > 0) {
      console.log(`[AI Helper] Loaded ${storedMessages.length} messages from history`)
      setMessages(storedMessages)
    }
    setIsInitialized(true)
  }, [])

  // Save messages when they change
  useEffect(() => {
    if (isInitialized && messages.length > 0) {
      saveMessages(messages)
    }
  }, [messages, isInitialized])

  const addImage = useCallback((imageDataUrl: string) => {
    setUploadedImages(prev => [...prev, imageDataUrl])
  }, [])

  const removeImage = useCallback((index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }, [])

  const clearHistory = useCallback(async () => {
    console.log('[AI Helper] Clearing chat history')
    setMessages([])
    setUploadedImages([])
    clearStoredMessages()
  }, [])

  const updateMessageSuggestions = useCallback((index: number, newSuggestions: any) => {
    console.log('[v0] Updating message', index, 'with new suggestions:', newSuggestions)
    setMessages(prev => {
      const updated = [...prev]
      if (updated[index]?.suggestions) {
        updated[index] = { ...updated[index], suggestions: { ...updated[index].suggestions, ...newSuggestions } }
      }
      return updated
    })
  }, [])

  const updateMessageLogoConfig = useCallback((index: number, newLogoConfig: Partial<DotMatrixConfig>) => {
    console.log('[v0] Updating message', index, 'with new logoConfig:', newLogoConfig)
    setMessages(prev => {
      const updated = [...prev]
      if (updated[index]) {
        updated[index] = { ...updated[index], logoConfig: { ...updated[index].logoConfig, ...newLogoConfig } }
      }
      return updated
    })
  }, [])

  const sendMessage = useCallback(async (userInput: string, currentPromptSettings: any) => {
    const displayMessage = userInput.trim() || '📷 [Image uploaded]'
    const userMessage: AIMessage = { role: 'user', content: displayMessage, timestamp: Date.now() }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    const currentImages = [...uploadedImages]
    let imageAnalysisContext = ''

    if (currentImages.length > 0) {
      const analyses = await Promise.all(
        currentImages.map((url, i) => analyzeUploadedImage(url, i, 'style'))
      )
      const successfulAnalyses = analyses.filter((a): a is NonNullable<typeof a> => a !== null && !a.error)

      if (successfulAnalyses.length > 0) {
        imageAnalysisContext = `\n\n=== REFERENCE IMAGES ANALYSIS ===\n${successfulAnalyses
          .map(a => `\n[IMAGE ${a.index}] - STYLE AND SUBJECT ANALYSIS:\n${a.analysis}`)
          .join('\n\n')}\n\nCRITICAL INSTRUCTIONS:
1. The user has uploaded ${successfulAnalyses.length} reference image(s).
2. EXTRACT THE DETECTED STYLE from the analysis and recommend it in your suggestions.
3. If the reference is an ad, flyer, poster, social creative, or branded design, identify the ad design direction: ad type, typography, dimensional lettering, font fill/inlay, layout, CTA treatment, background, texture, decorative elements, and palette.
4. Recommend which Creative Direction controls would best match the reference or support the user's requested style change, including Text Outline / Rim for gold rims, keylines, inset strokes, or foil edges.
5. When they mention "this character", "the image", etc., replicate the exact character/subject from the analysis.
6. Include the detected artistic or commercial style in your style recommendation.`
      }
      setUploadedImages([])
    }

    try {
      const response = await fetch('/api/generate-prompt-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput + imageAnalysisContext,
          ...currentPromptSettings,
          currentPromptSettings,
          agentMemory: buildAgentMemory(messages, 'image'),
          conversationHistory: messages
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, { role: 'assistant', content: data.message, timestamp: Date.now(), suggestions: data.suggestions, actions: data.actions }])
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorData.error}. Please try again.`, timestamp: Date.now() }])
      }
    } catch (error) {
      console.error('[v0] AI Helper error:', error)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: Date.now() }])
    } finally {
      setIsLoading(false)
    }
  }, [uploadedImages, messages])

  const sendLogoMessage = useCallback(async (userInput: string, currentPromptSettings: any = {}) => {
    const displayMessage = userInput.trim() || '📷 [Logo reference uploaded]'
    const userMessage: AIMessage = { role: 'user', content: displayMessage, timestamp: Date.now(), mode: 'logo' }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    const currentImages = [...uploadedImages]
    let logoAnalysis = ''

    if (currentImages.length > 0) {
      for (let index = 0; index < currentImages.length; index++) {
        const result = await analyzeUploadedImage(currentImages[index], index, 'logo')
        if (result) logoAnalysis += `\n[Logo Reference ${result.index}]:\n${result.analysis}\n`
      }
      setUploadedImages([])
    }

    try {
      const response = await fetch('/api/generate-prompt-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          mode: 'logo',
          logoAnalysis: logoAnalysis || undefined,
          currentPromptSettings,
          agentMemory: buildAgentMemory(messages, 'logo'),
          conversationHistory: messages.filter(m => m.mode === 'logo')
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, { role: 'assistant', content: data.message, timestamp: Date.now(), mode: 'logo', logoConfig: data.logoConfig, suggestions: data.suggestions, actions: data.actions }])
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorData.error}. Please try again.`, timestamp: Date.now(), mode: 'logo' }])
      }
    } catch (error) {
      console.error('[v0] AI Helper logo mode error:', error)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: Date.now(), mode: 'logo' }])
    } finally {
      setIsLoading(false)
    }
  }, [uploadedImages, messages])

  return {
    messages, uploadedImages, isLoading, mode, setMode,
    sendMessage, sendLogoMessage, addImage, removeImage,
    clearHistory, updateMessageSuggestions, updateMessageLogoConfig
  }
}
