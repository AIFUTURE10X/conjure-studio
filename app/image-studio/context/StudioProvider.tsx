"use client"

/**
 * StudioProvider
 *
 * Hosts the page-level state (usePageState) plus studio mode and pending
 * suggestion state for the unified workspace. Split into three contexts so
 * chat/suggestion churn doesn't re-render settings consumers and vice versa:
 *  - StudioCoreContext: the full usePageState bundle (transitional)
 *  - StudioModeContext: studio mode, bridged to the legacy activeTab
 *  - PendingSuggestionContext: AI helper suggestion preview state
 */

import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react'
import { usePageState } from '../hooks/usePageState'
import { MODE_FOR_TAB, TAB_FOR_MODE, type StudioMode } from './studio-types'
import type { PendingSuggestion } from './suggestion-patch'

export type StudioCore = ReturnType<typeof usePageState>

export interface StudioModeValue {
  mode: StudioMode
  setMode: (mode: StudioMode) => void
}

export interface PendingSuggestionValue {
  pendingSuggestion: PendingSuggestion | null
  setPendingSuggestion: (suggestion: PendingSuggestion | null) => void
  clearPendingSuggestion: () => void
}

export const StudioCoreContext = createContext<StudioCore | null>(null)
export const StudioModeContext = createContext<StudioModeValue | null>(null)
export const PendingSuggestionContext = createContext<PendingSuggestionValue | null>(null)

export function StudioProvider({ children }: { children: ReactNode }) {
  const core = usePageState()

  const { activeTab, setActiveTab } = core.state
  const mode = MODE_FOR_TAB[activeTab]
  const setMode = useCallback(
    (nextMode: StudioMode) => setActiveTab(TAB_FOR_MODE[nextMode]),
    [setActiveTab],
  )
  const modeValue = useMemo(() => ({ mode, setMode }), [mode, setMode])

  const [pendingSuggestion, setPendingSuggestion] = useState<PendingSuggestion | null>(null)
  const clearPendingSuggestion = useCallback(() => setPendingSuggestion(null), [])
  const suggestionValue = useMemo(
    () => ({ pendingSuggestion, setPendingSuggestion, clearPendingSuggestion }),
    [pendingSuggestion, clearPendingSuggestion],
  )

  return (
    <StudioCoreContext.Provider value={core}>
      <StudioModeContext.Provider value={modeValue}>
        <PendingSuggestionContext.Provider value={suggestionValue}>
          {children}
        </PendingSuggestionContext.Provider>
      </StudioModeContext.Provider>
    </StudioCoreContext.Provider>
  )
}
