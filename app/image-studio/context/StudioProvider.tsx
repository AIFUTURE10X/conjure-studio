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

import { createContext, useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
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

export interface StudioResetValue {
  /**
   * A mode's mounted component registers how to reset itself back to defaults
   * (no prompt, no generated output, uploads cleared). Returns an unregister
   * function for the effect cleanup. Multiple components may register for the
   * same mode — e.g. Thumbnail registers the canvas reset from the always-
   * mounted canvas and the AI-input clear from the settings rail — and
   * resetMode runs all of them. Ref-based like HelperBridge, so registering
   * never triggers a re-render.
   */
  registerReset: (mode: StudioMode, handler: () => void) => () => void
  /** Invoke every registered reset for a mode (no-op if none registered). */
  resetMode: (mode: StudioMode) => void
}

export const StudioCoreContext = createContext<StudioCore | null>(null)
export const StudioModeContext = createContext<StudioModeValue | null>(null)
export const PendingSuggestionContext = createContext<PendingSuggestionValue | null>(null)
export const StudioLogoContext = createContext<StudioLogoState | null>(null)
export const StudioResetContext = createContext<StudioResetValue | null>(null)

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

  // Per-mode reset registry. Mode components register handlers; the top bar's
  // Reset button dispatches to the active mode. A Set per mode lets several
  // components contribute to one mode's reset. Ref-based so registration never
  // triggers a re-render.
  const resetHandlersRef = useRef<Map<StudioMode, Set<() => void>>>(new Map())
  const registerReset = useCallback((resetModeKey: StudioMode, handler: () => void) => {
    let handlers = resetHandlersRef.current.get(resetModeKey)
    if (!handlers) {
      handlers = new Set()
      resetHandlersRef.current.set(resetModeKey, handlers)
    }
    handlers.add(handler)
    return () => {
      handlers?.delete(handler)
    }
  }, [])
  const resetMode = useCallback((resetModeKey: StudioMode) => {
    resetHandlersRef.current.get(resetModeKey)?.forEach((handler) => handler())
  }, [])
  const resetValue = useMemo<StudioResetValue>(
    () => ({ registerReset, resetMode }),
    [registerReset, resetMode],
  )

  return (
    <StudioCoreContext.Provider value={core}>
      <StudioLogoContext.Provider value={logoState}>
        <StudioModeContext.Provider value={modeValue}>
          <PendingSuggestionContext.Provider value={suggestionValue}>
            <StudioResetContext.Provider value={resetValue}>
              {children}
            </StudioResetContext.Provider>
          </PendingSuggestionContext.Provider>
        </StudioModeContext.Provider>
      </StudioLogoContext.Provider>
    </StudioCoreContext.Provider>
  )
}
