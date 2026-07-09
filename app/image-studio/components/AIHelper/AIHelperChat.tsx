'use client'

/**
 * AIHelperChat
 *
 * The AI helper conversation column: message list with structured cards,
 * upload preview, follow-up banner, and composer. Extracted verbatim from
 * AIHelperSidebar so the overlay sidebar and the studio HelperPanel render
 * the same chat. All state and behavior come from useAIHelperChatController.
 */

import { EmptyState } from './AIHelperHeader'
import { MessageBubble, LoadingIndicator } from './MessageBubble'
import { LogoConfigCard } from './LogoConfigCard'
import { SuggestionCard, SUGGESTION_APPLY_LABELS } from './SuggestionCard'
import { ImageUploadPreview } from './ImageUploadPreview'
import { ChatInput } from './ChatInput'
import { SmartActionBar } from './SmartActionBar'
import { DesignBriefCard } from './DesignBriefCard'
import { ExecutionPlanCard } from './ExecutionPlanCard'
import { DiagnosticCard } from './DiagnosticCard'
import { PromptQualityCard } from './PromptQualityCard'
import type { AIHelperChatController } from './useAIHelperChatController'

interface AIHelperChatProps {
  controller: AIHelperChatController
  className?: string
}

export function AIHelperChat({ controller, className }: AIHelperChatProps) {
  const {
    input, setInput, copiedField, editingIndex, editedSuggestions, appliedIndex,
    pendingFollowUp, setPendingFollowUp, messagesEndRef,
    messages, uploadedImages, isLoading, mode,
    removeImage, cancelRequest,
    handleImageUpload, handleCopy, handleEditStart, handleEditCancel, handleEditSave,
    handleApplyClick, handleRunAction, applyLogoConfigFromMessage,
    handleSend, updateEditedField,
    callbacks: { onApplySuggestions, onApplyLogoSuggestions, onApplyLogoConfig },
  } = controller

  const suggestionMessages = messages.filter(m => m.suggestions)

  return (
    <div className={className ?? 'flex min-h-0 flex-col bg-zinc-900'}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.length === 0 && !isLoading && <EmptyState mode={mode} />}

        {messages.map((msg, idx) => (
          <div key={idx}>
            <MessageBubble role={msg.role} content={msg.content} />

            {msg.designBrief && (
              <DesignBriefCard designBrief={msg.designBrief} />
            )}

            {msg.executionPlan && (
              <ExecutionPlanCard executionPlan={msg.executionPlan} />
            )}

            {msg.promptQualityChecklist && (
              <PromptQualityCard plannerDecision={msg.plannerDecision} checklist={msg.promptQualityChecklist} />
            )}

            {msg.diagnosticFindings && (
              <DiagnosticCard findings={msg.diagnosticFindings} />
            )}

            {msg.actions && msg.actions.length > 0 && (
              <SmartActionBar actions={msg.actions} onRunAction={(action) => handleRunAction(action, idx, msg)} />
            )}

            {msg.logoConfig && Object.keys(msg.logoConfig).length > 0 && onApplyLogoConfig && (
              <LogoConfigCard
                logoConfig={msg.logoConfig}
                isApplied={appliedIndex === idx}
                onApply={() => applyLogoConfigFromMessage(idx, msg.logoConfig!)}
              />
            )}

            {msg.suggestions && (onApplySuggestions || onApplyLogoSuggestions) && (
              <SuggestionCard
                suggestions={msg.suggestions}
                idx={idx}
                isLatest={idx === suggestionMessages.length - 1 && suggestionMessages.length > 1}
                isEditing={editingIndex === idx}
                isApplied={appliedIndex === idx}
                applyLabel={msg.mode === 'logo' ? SUGGESTION_APPLY_LABELS.logo : SUGGESTION_APPLY_LABELS.image}
                editedSuggestions={editedSuggestions}
                onEditStart={handleEditStart}
                onEditCancel={handleEditCancel}
                onEditSave={handleEditSave}
                onApply={handleApplyClick}
                onCopy={handleCopy}
                copiedField={copiedField}
                updateEditedField={updateEditedField}
              />
            )}
          </div>
        ))}

        {isLoading && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <ImageUploadPreview images={uploadedImages} onRemove={removeImage} />
      {pendingFollowUp && (
        <div className="border-t border-[#c99850]/20 bg-zinc-950/70 px-4 py-3 sm:px-5">
          <div className="flex items-start justify-between gap-3 rounded-md border border-[#c99850]/30 bg-[#c99850]/10 px-3 py-2">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f0d49b]">Answering follow-up</div>
              <div className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-200">{pendingFollowUp.prompt}</div>
            </div>
            <button
              type="button"
              onClick={() => setPendingFollowUp(null)}
              className="shrink-0 rounded border border-zinc-700 px-2 py-1 text-xs font-semibold text-zinc-300 transition-colors hover:border-[#c99850]/50 hover:text-white"
              title="Clear follow-up"
              aria-label="Clear follow-up"
            >
              Clear
            </button>
          </div>
        </div>
      )}
      <ChatInput
        input={input}
        setInput={setInput}
        mode={mode}
        isLoading={isLoading}
        hasImages={uploadedImages.length > 0}
        pendingQuestion={pendingFollowUp?.prompt}
        onSend={handleSend}
        onCancelRequest={cancelRequest}
        onImageUpload={handleImageUpload}
      />
    </div>
  )
}
