/**
 * 🔒 PROTECTED: AI HELPER SIDEBAR
 *
 * This file is part of the AI Helper feature and should not be modified without explicit approval.
 *
 * APPROVAL REQUIRED: Use phrase "APPROVE SIGNIFICANT CHANGE"
 *
 * Composition shell for the full-canvas helper overlay. Chat state, direct
 * commands, and the conversation column live in
 * AIHelper/useAIHelperChatController + AIHelper/AIHelperChat (extracted
 * verbatim); this file keeps the overlay chrome and the settings rail.
 */

'use client'

import { useState, useEffect } from 'react'
import type { AIHelperActiveTask } from '../hooks/useAIHelper'

// Sub-components
import { AIHelperHeader } from './AIHelper/AIHelperHeader'
import { AIHelperChat } from './AIHelper/AIHelperChat'
import { ContextSnapshot } from './AIHelper/ContextSnapshot'
import { PromptSuggestionChips } from './AIHelper/PromptSuggestionChips'
import { PromptPreflightPanel } from './AIHelper/PromptPreflightPanel'
import { QuickSettingsPanel } from './AIHelper/QuickSettingsPanel'
import {
  useAIHelperChatController,
  type AIHelperChatCallbacks,
  type AIHelperLatestOutputs,
  type AIHelperPromptSettings,
} from './AIHelper/useAIHelperChatController'

const AI_HELPER_PANEL_EXPANDED_WIDTH = '100vw'
type AIHelperSettingsTab = 'overview' | 'quick-settings'

interface AIHelperSidebarProps extends AIHelperChatCallbacks {
  isOpen: boolean
  onClose: () => void
  currentPromptSettings?: AIHelperPromptSettings
  latestOutputs?: AIHelperLatestOutputs
}

export function AIHelperSidebar({ isOpen, onClose, currentPromptSettings = {}, latestOutputs = {}, onApplySuggestions, onApplyLogoSuggestions, onApplyLogoConfig, onGenerateFromAIHelper }: AIHelperSidebarProps) {
  const [helperSettingsTab, setHelperSettingsTab] = useState<AIHelperSettingsTab>('overview')

  const controller = useAIHelperChatController({
    currentPromptSettings,
    latestOutputs,
    onApplySuggestions,
    onApplyLogoSuggestions,
    onApplyLogoConfig,
    onGenerateFromAIHelper,
  })

  const {
    setInput, mode, setMode, clearHistory, uploadedImages,
    preferenceCount, preferenceMemory, activeDesignBrief, sharedProjectBrief,
    activeTaskContext, forgetPreference, handleQuickSettingClick, runHelperPrompt,
  } = controller

  useEffect(() => { if (isOpen) setHelperSettingsTab('overview') }, [isOpen])

  if (!isOpen) return null

  const contextVariant = 'workspace'
  const halfCanvasWorkspaceStyle = { gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }
  const helperWorkspaceClass = 'grid min-h-0 flex-1 grid-cols-1 bg-zinc-900 lg:grid-cols-none'
  const helperWorkspaceStyle = halfCanvasWorkspaceStyle
  const helperSettingsRailClass = 'min-h-0 overflow-y-auto border-b border-[#c99850]/20 bg-zinc-950/70 lg:border-b-0 lg:border-r lg:border-[#c99850]/25'
  const helperConversationClass = 'flex min-h-0 flex-col bg-zinc-900'
  const settingsTabButtonClass = 'flex min-h-[52px] flex-1 flex-col items-start justify-center rounded-md border px-3 py-2 text-left transition-colors'

  return (
    <div
      className="fixed right-0 top-0 z-50 flex h-full max-w-full flex-col border-l border-[#c99850]/30 bg-zinc-900 shadow-2xl transition-[width] duration-300 animate-in slide-in-from-right"
      style={{ width: AI_HELPER_PANEL_EXPANDED_WIDTH }}
    >
      <AIHelperHeader
        mode={mode}
        setMode={setMode}
        onClearHistory={clearHistory}
        onClose={onClose}
      />

      <div className={helperWorkspaceClass} style={helperWorkspaceStyle}>
        <div className={helperSettingsRailClass}>
          <div className="sticky top-0 z-10 border-b border-[#c99850]/20 bg-zinc-950/95 px-4 py-3 backdrop-blur sm:px-5">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Settings</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHelperSettingsTab('overview')}
                className={`${settingsTabButtonClass} ${
                  helperSettingsTab === 'overview'
                    ? 'border-[#c99850]/50 bg-[#c99850]/15 text-[#f0d49b]'
                    : 'border-zinc-700 bg-zinc-900/80 text-zinc-400 hover:border-[#c99850]/40 hover:text-zinc-100'
                }`}
              >
                <span className="text-sm font-semibold">Overview</span>
                <span className="text-[11px] font-medium text-zinc-500">References & Memory</span>
              </button>
              <button
                type="button"
                onClick={() => setHelperSettingsTab('quick-settings')}
                className={`${settingsTabButtonClass} ${
                  helperSettingsTab === 'quick-settings'
                    ? 'border-[#c99850]/50 bg-[#c99850]/15 text-[#f0d49b]'
                    : 'border-zinc-700 bg-zinc-900/80 text-zinc-400 hover:border-[#c99850]/40 hover:text-zinc-100'
                }`}
              >
                <span className="text-sm font-semibold">Quick Settings</span>
                <span className="text-[11px] font-medium text-zinc-500">Resolution & Next</span>
              </button>
            </div>
          </div>

          {helperSettingsTab === 'overview' && (
            <ContextSnapshot
              mode={mode}
              variant={contextVariant}
              currentPromptSettings={currentPromptSettings}
              uploadedImages={uploadedImages}
              preferenceCount={preferenceCount}
              preferenceMemory={preferenceMemory}
              activeDesignBrief={activeDesignBrief}
              sharedProjectBrief={sharedProjectBrief}
              activeTaskContext={activeTaskContext as AIHelperActiveTask | undefined}
              onForgetPreference={forgetPreference}
              latestOutputs={latestOutputs}
            />
          )}

          {helperSettingsTab === 'quick-settings' && (
            <>
              <QuickSettingsPanel
                mode={mode}
                currentPromptSettings={currentPromptSettings}
                onRunSetting={handleQuickSettingClick}
              />

              <PromptSuggestionChips
                mode={mode}
                currentPromptSettings={currentPromptSettings}
                uploadedImages={uploadedImages}
                latestOutputs={latestOutputs}
                onSelectPrompt={setInput}
                onRunPrompt={(prompt) => void runHelperPrompt(prompt)}
              />

              <PromptPreflightPanel
                mode={mode}
                currentPromptSettings={currentPromptSettings}
                uploadedImages={uploadedImages}
                onAskHelper={setInput}
                onRunFix={(prompt) => void runHelperPrompt(prompt)}
              />
            </>
          )}
        </div>

        <AIHelperChat controller={controller} className={helperConversationClass} />
      </div>
    </div>
  )
}
