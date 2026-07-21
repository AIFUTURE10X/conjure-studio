"use client"

import { useSyncExternalStore } from 'react'
import type { ConciergePlan } from '../constants/concierge-tree'

/**
 * Active Concierge plan store: a tiny module-level store (localStorage-backed)
 * so the dialog can start a plan and the pinned checklist can observe it from
 * anywhere in the shell without threading props.
 */

export interface ActiveConciergePlan {
  planId: string
  /** Epoch ms when the plan was applied — auto-ticks only count work after this. */
  startedAt: number
  /** Manually-toggled step keys (auto steps compute separately). */
  done: string[]
  /** AI-generated plans aren't in the static tree, so they embed here. */
  plan?: ConciergePlan
}

const STORAGE_KEY = 'conjure-concierge-plan'

let current: ActiveConciergePlan | null | undefined
const listeners = new Set<() => void>()

function read(): ActiveConciergePlan | null {
  if (current !== undefined) return current
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    current = raw ? (JSON.parse(raw) as ActiveConciergePlan) : null
  } catch {
    current = null
  }
  return current
}

function write(next: ActiveConciergePlan | null) {
  current = next
  try {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage unavailable (private mode) — the plan still works for the session.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function startConciergePlan(planId: string, plan?: ConciergePlan) {
  write({ planId, startedAt: Date.now(), done: [], ...(plan ? { plan } : {}) })
}

export function toggleConciergeStep(stepKey: string) {
  const plan = read()
  if (!plan) return
  const done = plan.done.includes(stepKey)
    ? plan.done.filter((key) => key !== stepKey)
    : [...plan.done, stepKey]
  write({ ...plan, done })
}

export function clearConciergePlan() {
  write(null)
}

export function useActiveConciergePlan(): ActiveConciergePlan | null {
  return useSyncExternalStore(subscribe, read, () => null)
}
