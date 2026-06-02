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

import { useState, useEffect, useCallback, useRef } from 'react'
import type { DotMatrixConfig } from '../constants/dot-matrix-config'
import {
  clearStoredAgentMemory,
  clearStoredMessages,
  loadStoredAgentMemory,
  loadStoredMessages,
  saveAgentMemory,
  saveMessages,
} from './useAIHelperPersistence'
import { analyzeUploadedImage } from './useImageCompression'

export type AIHelperMode = 'image' | 'logo'

export type AIHelperActionType =
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

export interface AIHelperAction {
  type: AIHelperActionType
  label: string
  description?: string
  prompt?: string
  negativePrompt?: string
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
  lastReferenceAnalysis?: string
  persistentGenerations: AIHelperMemorySnapshot[]
  persistentPreferences: AIHelperMemorySnapshot[]
  recentUserRequests: string[]
}

export interface AIHelperMemorySnapshot {
  mode: AIHelperMode
  kind: 'suggestion' | 'reference' | 'preference'
  timestamp: number
  prompt?: string
  negativePrompt?: string
  summary?: string
  analysis?: string
  preference?: string
}

export interface AIHelperLatestOutput {
  url?: string
  prompt?: string
  timestamp?: number
}

export function buildAgentMemory(
  messages: AIMessage[],
  mode: AIHelperMode,
  generationMemory: AIHelperMemorySnapshot[] = []
): AIHelperAgentMemory {
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
  const persistentGenerations = generationMemory
    .filter((snapshot) => snapshot.mode === mode && snapshot.kind === 'suggestion')
    .slice(-5)
  const lastReferenceAnalysis = [...generationMemory]
    .reverse()
    .find((snapshot) => snapshot.mode === mode && snapshot.kind === 'reference')?.analysis
  const persistentPreferences = generationMemory
    .filter((snapshot) => snapshot.mode === mode && snapshot.kind === 'preference')
    .slice(-8)

  return {
    mode,
    lastImagePrompt: lastImageSuggestion?.suggestions?.prompt,
    lastLogoPrompt: lastLogoSuggestion?.suggestions?.prompt,
    lastNegativePrompt: lastLogoSuggestion?.suggestions?.negativePrompt || lastImageSuggestion?.suggestions?.negativePrompt,
    lastAssistantSummary: lastAssistant?.content,
    lastReferenceAnalysis,
    persistentGenerations,
    persistentPreferences,
    recentUserRequests,
  }
}

export function extractPreferenceMemory(userInput: string): string | null {
  const preference = userInput.trim().replace(/\s+/g, ' ')
  if (!preference) return null
  const lowerPreference = preference.toLowerCase()
  const hasDurableLanguage = [
    'remember ',
    'always ',
    'never ',
    'prefer ',
    'avoid ',
    'do not ',
    "don't ",
    'must ',
    'make sure ',
  ].some((term) => lowerPreference.includes(term))

  if (!hasDurableLanguage) return null
  return preference.length > 260 ? `${preference.slice(0, 257)}...` : preference
}

export function useAIHelper() {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [generationMemory, setGenerationMemory] = useState<AIHelperMemorySnapshot[]>([])
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const [mode, setMode] = useState<AIHelperMode>('image')
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load chat history on mount
  useEffect(() => {
    const storedMessages = loadStoredMessages()
    if (storedMessages.length > 0) {
      console.log(`[AI Helper] Loaded ${storedMessages.length} messages from history`)
      setMessages(storedMessages)
    }
    const storedMemory = loadStoredAgentMemory()
    if (storedMemory.length > 0) {
      console.log(`[AI Helper] Loaded ${storedMemory.length} memory snapshots`)
      setGenerationMemory(storedMemory)
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
    setGenerationMemory([])
    clearStoredMessages()
    clearStoredAgentMemory()
  }, [])

  const cancelRequest = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsLoading(false)
  }, [])

  const rememberMemorySnapshot = useCallback((snapshot: AIHelperMemorySnapshot) => {
    setGenerationMemory(prev => {
      const next = [...prev, snapshot].slice(-40)
      saveAgentMemory(next)
      return next
    })
  }, [])

  const rememberAssistantSuggestion = useCallback((data: any, assistantMode: AIHelperMode) => {
    if (!data?.suggestions?.prompt) return
    rememberMemorySnapshot({
      mode: assistantMode,
      kind: 'suggestion',
      timestamp: Date.now(),
      prompt: data.suggestions.prompt,
      negativePrompt: data.suggestions.negativePrompt,
      summary: typeof data.message === 'string' ? data.message : undefined,
    })
  }, [rememberMemorySnapshot])

  const rememberUserPreference = useCallback((userInput: string, preferenceMode: AIHelperMode) => {
    const preference = extractPreferenceMemory(userInput)
    if (!preference) return
    rememberMemorySnapshot({
      mode: preferenceMode,
      kind: 'preference',
      timestamp: Date.now(),
      preference,
    })
  }, [rememberMemorySnapshot])

  const forgetPreference = useCallback((timestamp: number) => {
    setGenerationMemory(prev => {
      const next = prev.filter((snapshot) => snapshot.kind !== 'preference' || snapshot.timestamp !== timestamp)
      saveAgentMemory(next)
      return next
    })
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
    rememberUserPreference(userInput, 'image')
    const requestController = new AbortController()
    abortControllerRef.current = requestController
    setIsLoading(true)

    const currentImages = [...uploadedImages]
    let imageAnalysisContext = ''

    if (currentImages.length > 0) {
      const analyses = await Promise.all(
        currentImages.map((url, i) => analyzeUploadedImage(url, i, 'style'))
      )
      const successfulAnalyses = analyses.filter((a): a is NonNullable<typeof a> => a !== null && !a.error)

      if (successfulAnalyses.length > 0) {
        const referenceSummary = successfulAnalyses
          .map(a => `[IMAGE ${a.index}]\n${a.analysis}`)
          .join('\n\n')
        imageAnalysisContext = `\n\n=== REFERENCE IMAGES ANALYSIS ===\n${successfulAnalyses
          .map(a => `\n[IMAGE ${a.index}] - STYLE AND SUBJECT ANALYSIS:\n${a.analysis}`)
          .join('\n\n')}\n\nCRITICAL INSTRUCTIONS:
1. The user has uploaded ${successfulAnalyses.length} reference image(s).
2. EXTRACT THE DETECTED STYLE from the analysis and recommend it in your suggestions.
3. If the reference is an ad, flyer, poster, social creative, or branded design, identify the ad design direction: ad type, typography, dimensional lettering, font fill/inlay, layout, CTA treatment, background, texture, decorative elements, and palette.
4. Recommend which Creative Direction controls would best match the reference or support the user's requested style change, including Text Outline / Rim for gold rims, keylines, inset strokes, or foil edges.
5. When they mention "this character", "the image", etc., replicate the exact character/subject from the analysis.
6. Include the detected artistic or commercial style in your style recommendation.`
        rememberMemorySnapshot({
          mode: 'image',
          kind: 'reference',
          timestamp: Date.now(),
          analysis: referenceSummary,
        })
      }
      setUploadedImages([])
    }
    if (requestController.signal.aborted) {
      if (abortControllerRef.current === requestController) {
        abortControllerRef.current = null
        setIsLoading(false)
      }
      return
    }

    try {
      const response = await fetch('/api/generate-prompt-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: requestController.signal,
        body: JSON.stringify({
          message: userInput + imageAnalysisContext,
          ...currentPromptSettings,
          currentPromptSettings,
          agentMemory: buildAgentMemory(messages, 'image', generationMemory),
          conversationHistory: messages
        })
      })

      if (response.ok) {
        const data = await response.json()
        rememberAssistantSuggestion(data, 'image')
        setMessages(prev => [...prev, { role: 'assistant', content: data.message, timestamp: Date.now(), suggestions: data.suggestions, actions: data.actions }])
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorData.error}. Please try again.`, timestamp: Date.now() }])
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      console.error('[v0] AI Helper error:', error)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: Date.now() }])
    } finally {
      if (abortControllerRef.current === requestController) {
        abortControllerRef.current = null
        setIsLoading(false)
      }
    }
  }, [uploadedImages, messages, generationMemory, rememberAssistantSuggestion, rememberMemorySnapshot, rememberUserPreference])

  const sendLogoMessage = useCallback(async (userInput: string, currentPromptSettings: any = {}) => {
    const displayMessage = userInput.trim() || '📷 [Logo reference uploaded]'
    const userMessage: AIMessage = { role: 'user', content: displayMessage, timestamp: Date.now(), mode: 'logo' }
    setMessages(prev => [...prev, userMessage])
    rememberUserPreference(userInput, 'logo')
    const requestController = new AbortController()
    abortControllerRef.current = requestController
    setIsLoading(true)

    const currentImages = [...uploadedImages]
    let logoAnalysis = ''

    if (currentImages.length > 0) {
      for (let index = 0; index < currentImages.length; index++) {
        const result = await analyzeUploadedImage(currentImages[index], index, 'logo')
        if (result) logoAnalysis += `\n[Logo Reference ${result.index}]:\n${result.analysis}\n`
      }
      if (logoAnalysis.trim()) {
        rememberMemorySnapshot({
          mode: 'logo',
          kind: 'reference',
          timestamp: Date.now(),
          analysis: logoAnalysis.trim(),
        })
      }
      setUploadedImages([])
    }
    if (requestController.signal.aborted) {
      if (abortControllerRef.current === requestController) {
        abortControllerRef.current = null
        setIsLoading(false)
      }
      return
    }

    try {
      const response = await fetch('/api/generate-prompt-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: requestController.signal,
        body: JSON.stringify({
          message: userInput,
          mode: 'logo',
          logoAnalysis: logoAnalysis || undefined,
          currentPromptSettings,
          agentMemory: buildAgentMemory(messages, 'logo', generationMemory),
          conversationHistory: messages.filter(m => m.mode === 'logo')
        })
      })

      if (response.ok) {
        const data = await response.json()
        rememberAssistantSuggestion(data, 'logo')
        setMessages(prev => [...prev, { role: 'assistant', content: data.message, timestamp: Date.now(), mode: 'logo', logoConfig: data.logoConfig, suggestions: data.suggestions, actions: data.actions }])
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorData.error}. Please try again.`, timestamp: Date.now(), mode: 'logo' }])
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      console.error('[v0] AI Helper logo mode error:', error)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: Date.now(), mode: 'logo' }])
    } finally {
      if (abortControllerRef.current === requestController) {
        abortControllerRef.current = null
        setIsLoading(false)
      }
    }
  }, [uploadedImages, messages, generationMemory, rememberAssistantSuggestion, rememberMemorySnapshot, rememberUserPreference])

  const sendActionMessage = useCallback(async (
    actionType: Extract<AIHelperActionType, 'critique_last_output' | 'make_variation' | 'compare_to_reference'>,
    currentPromptSettings: any = {},
    latestOutput?: AIHelperLatestOutput | null,
    targetMode: AIHelperMode = mode
  ) => {
    const isLogo = targetMode === 'logo'
    const actionLabel = actionType === 'critique_last_output'
      ? 'Critique latest output'
      : actionType === 'compare_to_reference'
        ? 'Compare latest output to reference'
        : 'Make a variation'
    const userInput = actionType === 'critique_last_output'
      ? `Critique the latest generated ${isLogo ? 'logo' : 'image'} against my prompt, reference goals, and previous requests. Explain what missed, then give me a corrected prompt and settings.`
      : actionType === 'compare_to_reference'
        ? `Compare the latest generated ${isLogo ? 'logo' : 'image'} against my most recent reference analysis. Identify exact mismatches and give me a corrected prompt and settings.`
        : `Make a new variation from the latest generated ${isLogo ? 'logo' : 'image'}. Keep what works, fix weak parts, and give me the next prompt and settings.`

    setMessages(prev => [...prev, { role: 'user', content: actionLabel, timestamp: Date.now(), mode: isLogo ? 'logo' : 'image' }])
    const requestController = new AbortController()
    abortControllerRef.current = requestController
    setIsLoading(true)

    let latestOutputAnalysis = ''
    if (latestOutput?.url) {
      const analysis = await analyzeUploadedImage(latestOutput.url, 0, isLogo ? 'logo' : 'style')
      if (analysis?.analysis) {
        latestOutputAnalysis = `\n[Latest Generated ${isLogo ? 'Logo' : 'Image'}]\n${analysis.analysis}`
      }
    }
    if (requestController.signal.aborted) {
      if (abortControllerRef.current === requestController) {
        abortControllerRef.current = null
        setIsLoading(false)
      }
      return
    }

    try {
      const response = await fetch('/api/generate-prompt-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: requestController.signal,
        body: JSON.stringify({
          message: userInput,
          ...(isLogo ? { mode: 'logo' } : currentPromptSettings),
          currentPromptSettings: {
            ...currentPromptSettings,
            latestOutput: latestOutput ? {
              hasOutput: Boolean(latestOutput.url),
              prompt: latestOutput.prompt || '',
              timestamp: latestOutput.timestamp,
            } : { hasOutput: false },
          },
          latestOutputAnalysis: latestOutputAnalysis || undefined,
          agentMemory: buildAgentMemory(messages, isLogo ? 'logo' : 'image', generationMemory),
          conversationHistory: isLogo ? messages.filter(m => m.mode === 'logo') : messages,
        })
      })

      if (response.ok) {
        const data = await response.json()
        rememberAssistantSuggestion(data, isLogo ? 'logo' : 'image')
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
          timestamp: Date.now(),
          mode: isLogo ? 'logo' : 'image',
          logoConfig: data.logoConfig,
          suggestions: data.suggestions,
          actions: data.actions,
        }])
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorData.error}. Please try again.`, timestamp: Date.now(), mode: isLogo ? 'logo' : 'image' }])
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      console.error('[v0] AI Helper action error:', error)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not inspect the latest output. Please try again.', timestamp: Date.now(), mode: isLogo ? 'logo' : 'image' }])
    } finally {
      if (abortControllerRef.current === requestController) {
        abortControllerRef.current = null
        setIsLoading(false)
      }
    }
  }, [messages, mode, generationMemory, rememberAssistantSuggestion])

  const preferenceMemory = generationMemory
    .filter((snapshot) => snapshot.mode === mode && snapshot.kind === 'preference')
    .slice(-8)

  return {
    messages, uploadedImages, isLoading, mode, setMode,
    sendMessage, sendLogoMessage, sendActionMessage, addImage, removeImage,
    preferenceCount: preferenceMemory.length,
    preferenceMemory,
    forgetPreference,
    cancelRequest,
    clearHistory, updateMessageSuggestions, updateMessageLogoConfig
  }
}
