"use client"

/**
 * HelperBridgeProvider
 *
 * Lets the PromptDock hand the typed idea to the AI helper without the two
 * components knowing about each other. HelperPanel registers its prompt
 * runner; the mobile layout registers an "open the helper sheet" callback;
 * PromptDock calls improveWithHelper(text), which opens the helper (mobile)
 * and runs the prompt so its polished suggestion previews in the rail.
 *
 * Ref-based registration keeps registrations out of React state so they
 * don't trigger re-renders.
 */

import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react'

type HelperRunner = (prompt: string) => void

export interface HelperBridgeValue {
  registerHelperRunner: (runner: HelperRunner | null) => void
  registerOpenHelper: (open: (() => void) | null) => void
  improveWithHelper: (prompt: string) => void
}

const HelperBridgeContext = createContext<HelperBridgeValue | null>(null)

export function HelperBridgeProvider({ children }: { children: ReactNode }) {
  const runnerRef = useRef<HelperRunner | null>(null)
  const openRef = useRef<(() => void) | null>(null)
  const pendingPromptRef = useRef<string | null>(null)

  const registerHelperRunner = useCallback((runner: HelperRunner | null) => {
    runnerRef.current = runner
    // On mobile the helper mounts only after its sheet opens, so a prompt
    // sent while it was closed waits here and is delivered on registration.
    if (runner && pendingPromptRef.current) {
      const pending = pendingPromptRef.current
      pendingPromptRef.current = null
      runner(pending)
    }
  }, [])

  const registerOpenHelper = useCallback((open: (() => void) | null) => {
    openRef.current = open
  }, [])

  const improveWithHelper = useCallback((prompt: string) => {
    const text = prompt.trim()
    if (!text) return
    if (runnerRef.current) {
      runnerRef.current(text)
    } else {
      pendingPromptRef.current = text
    }
    openRef.current?.()
  }, [])

  const value = useMemo<HelperBridgeValue>(
    () => ({ registerHelperRunner, registerOpenHelper, improveWithHelper }),
    [registerHelperRunner, registerOpenHelper, improveWithHelper],
  )

  return <HelperBridgeContext.Provider value={value}>{children}</HelperBridgeContext.Provider>
}

export function useHelperBridge(): HelperBridgeValue {
  const value = useContext(HelperBridgeContext)
  if (value === null) {
    throw new Error('useHelperBridge must be used within <HelperBridgeProvider>')
  }
  return value
}
