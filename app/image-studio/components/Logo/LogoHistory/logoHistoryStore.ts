"use client"

/**
 * Shared store for logo history state.
 *
 * LogoHistoryPanel is mounted in several places at once (the inline bar, the
 * pop-out modal, the mockup history dropdown). With per-instance useState,
 * deleting in one mount left every other mount showing the stale list — bulk
 * deletes in the modal "came back" when it closed. All instances now read and
 * write this single store, so every mount updates together.
 */

import type { LogoHistoryState } from './types'

type Updater = LogoHistoryState | ((prev: LogoHistoryState) => LogoHistoryState)

let state: LogoHistoryState = { items: [], isLoading: true, isSyncing: false }
const listeners = new Set<() => void>()

export const logoHistoryStore = {
  getState: (): LogoHistoryState => state,
  setState: (updater: Updater): void => {
    state = typeof updater === 'function' ? updater(state) : updater
    listeners.forEach((listener) => listener())
  },
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
