'use client'

import { useEffect, useState } from 'react'
import {
  normalizeAIHelperModelChoice,
  type AIHelperModelChoice,
} from '@/lib/ai-helper-models'

const STORAGE_KEY = 'conjure-ai-helper-model'

export interface AIHelperModelAvailability {
  auto: boolean
  best: boolean
  opus: boolean
}

export type AIHelperModelNames = Record<AIHelperModelChoice, string>

const DEFAULT_AVAILABILITY: AIHelperModelAvailability = {
  auto: true,
  best: true,
  opus: false,
}

const DEFAULT_MODEL_NAMES: AIHelperModelNames = {
  auto: 'Configured OpenAI model',
  best: 'gpt-5.6-sol',
  opus: 'claude-opus-5',
}

export function useAIHelperModelSelection() {
  const [modelChoice, setModelChoice] = useState<AIHelperModelChoice>(() => (
    typeof window === 'undefined'
      ? 'auto'
      : normalizeAIHelperModelChoice(localStorage.getItem(STORAGE_KEY))
  ))
  const [modelAvailability, setModelAvailability] = useState(DEFAULT_AVAILABILITY)
  const [modelNames, setModelNames] = useState(DEFAULT_MODEL_NAMES)

  useEffect(() => {
    fetch('/api/generate-prompt-suggestion')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Model availability unavailable')))
      .then((data: { availability?: Partial<AIHelperModelAvailability>; models?: Partial<AIHelperModelNames> }) => {
        setModelAvailability({ ...DEFAULT_AVAILABILITY, ...data.availability })
        setModelNames({ ...DEFAULT_MODEL_NAMES, ...data.models })
      })
      .catch(() => setModelAvailability(DEFAULT_AVAILABILITY))
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, modelChoice)
  }, [modelChoice])

  return { modelChoice, setModelChoice, modelAvailability, modelNames }
}
