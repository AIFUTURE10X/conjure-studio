"use client"

/**
 * Studio context consumer hooks
 *
 * useStudioCore       — full page-state bundle (transitional, replaces direct usePageState calls)
 * useStudioMode       — studio mode + setter, isolated from state churn
 * usePendingSuggestion — AI helper suggestion preview state, isolated so
 *                        chat typing doesn't re-render settings consumers
 */

import { useContext } from 'react'
import {
  PendingSuggestionContext,
  StudioCoreContext,
  StudioModeContext,
  type PendingSuggestionValue,
  type StudioCore,
  type StudioModeValue,
} from './StudioProvider'

function requireContext<T>(value: T | null, hook: string): T {
  if (value === null) {
    throw new Error(`${hook} must be used within <StudioProvider>`)
  }
  return value
}

export function useStudioCore(): StudioCore {
  return requireContext(useContext(StudioCoreContext), 'useStudioCore')
}

export function useStudioMode(): StudioModeValue {
  return requireContext(useContext(StudioModeContext), 'useStudioMode')
}

export function usePendingSuggestion(): PendingSuggestionValue {
  return requireContext(useContext(PendingSuggestionContext), 'usePendingSuggestion')
}
