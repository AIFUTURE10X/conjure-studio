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
 *  - StudioLogoContext: lifted useLogoPanelState (shared by the v2 logo
 *    canvas + settings rail; the classic LogoPanel keeps its own instance
 *    until the shell swap)
 */

import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react'
import { usePageState } from '../hooks/usePageState'
import { useLogoPanelState } from '../hooks/useLogoPanelState'
import { MODE_FOR_TAB, TAB_FOR_MODE, type StudioMode } from './studio-types'
import type { PendingSuggestion } from './suggestion-patch'

export type StudioCore = ReturnType<typeof usePageState>
export type StudioLogoState = ReturnType<typeof useLogoPanelState>

export interface StudioModeValue {
  mode: StudioMode
  setMode: (mode: StudioMode) => void
  /** Whether the bottom prompt dock is collapsed to its slim preview bar. */
  promptCollapsed: boolean
  setPromptCollapsed: (collapsed: boolean) => void
}

export interface PendingSuggestionValue {
  pendingSuggestion: PendingSuggestion | null
  setPendingSuggestion: (suggestion: PendingSuggestion | null) => void
  clearPendingSuggestion: () => void
}

export const StudioCoreContext = createContext<StudioCore | null>(null)
export const StudioModeContext = createContext<StudioModeValue | null>(null)
export const PendingSuggestionContext = createContext<PendingSuggestionValue | null>(null)
export const StudioLogoContext = createContext<StudioLogoState | null>(null)

export function StudioProvider({ children }: { children: ReactNode }) {
  const core = usePageState()

  // Lifted logo generator state: shared prompt flows in the same way the
  // classic page feeds LogoPanel (externalPrompt one-way sync).
  const logoState = useLogoPanelState({
    externalPrompt: core.state.mainPrompt,
    externalNegativePrompt: core.state.negativePrompt,
    pendingLogoConfig: core.state.pendingLogoConfig,
  })

  const { activeTab, setActiveTab } = core.state
  const mode = MODE_FOR_TAB[activeTab]
  const setMode = useCallback(
    (nextMode: StudioMode) => setActiveTab(TAB_FOR_MODE[nextMode]),
    [setActiveTab],
  )
  const [promptCollapsed, setPromptCollapsed] = useState(false)
  const modeValue = useMemo(
    () => ({ mode, setMode, promptCollapsed, setPromptCollapsed }),
    [mode, setMode, promptCollapsed],
  )

  const [pendingSuggestion, setPendingSuggestion] = useState<PendingSuggestion | null>(null)
  const clearPendingSuggestion = useCallback(() => setPendingSuggestion(null), [])
  const suggestionValue = useMemo(
    () => ({ pendingSuggestion, setPendingSuggestion, clearPendingSuggestion }),
    [pendingSuggestion, clearPendingSuggestion],
  )

  return (
    <StudioCoreContext.Provider value={core}>
      <StudioLogoContext.Provider value={logoState}>
        <StudioModeContext.Provider value={modeValue}>
          <PendingSuggestionContext.Provider value={suggestionValue}>
            {children}
          </PendingSuggestionContext.Provider>
        </StudioModeContext.Provider>
      </StudioLogoContext.Provider>
    </StudioCoreContext.Provider>
  )
}
