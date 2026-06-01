"use client"

import type { AIHelperMemorySnapshot, AIMessage } from './useAIHelper'

const STORAGE_KEY = 'ai-helper-chat-history'
const MEMORY_STORAGE_KEY = 'ai-helper-agent-memory'
const MAX_STORED_MESSAGES = 100
const MAX_STORED_MEMORY = 40

export function loadStoredMessages(): AIMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (error) {
    console.error('[AI Helper] Failed to load chat history:', error)
  }
  return []
}

export function saveMessages(messages: AIMessage[]) {
  if (typeof window === 'undefined') return
  try {
    const messagesToStore = messages.slice(-MAX_STORED_MESSAGES)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesToStore))
  } catch (error) {
    console.error('[AI Helper] Failed to save chat history:', error)
  }
}

export function loadStoredAgentMemory(): AIHelperMemorySnapshot[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(MEMORY_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (error) {
    console.error('[AI Helper] Failed to load agent memory:', error)
  }
  return []
}

export function saveAgentMemory(memory: AIHelperMemorySnapshot[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memory.slice(-MAX_STORED_MEMORY)))
  } catch (error) {
    console.error('[AI Helper] Failed to save agent memory:', error)
  }
}

export function clearStoredAgentMemory() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(MEMORY_STORAGE_KEY)
      console.log('[AI Helper] Agent memory cleared from localStorage')
    } catch (error) {
      console.error('[AI Helper] Failed to clear agent memory:', error)
    }
  }
}

export function clearStoredMessages() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY)
      console.log('[AI Helper] Chat history cleared from localStorage')
    } catch (error) {
      console.error('[AI Helper] Failed to clear localStorage:', error)
    }
  }
}
