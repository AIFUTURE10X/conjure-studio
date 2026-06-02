'use client'

import { Copy, Check, Edit2 } from 'lucide-react'
import { useState } from 'react'
import { STYLE_OPTIONS, ASPECT_RATIO_OPTIONS, CAMERA_ANGLE_OPTIONS, CAMERA_LENS_OPTIONS, RESOLUTION_OPTIONS } from './constants'

const APPLY_TO_IMAGE_GENERATOR_LABEL = 'Apply to Image Generator'
const APPLY_TO_LOGO_GENERATOR_LABEL = 'Apply to Logo Generator'

export const SUGGESTION_APPLY_LABELS = {
  image: APPLY_TO_IMAGE_GENERATOR_LABEL,
  logo: APPLY_TO_LOGO_GENERATOR_LABEL,
} as const

interface Suggestions {
  prompt: string
  negativePrompt?: string
  style?: string
  aspectRatio?: string
  cameraAngle?: string
  cameraLens?: string
  styleStrength?: string
  resolution?: string
  textMode?: string
  bgRemovalMethod?: string
  selectedModel?: string
}

interface SuggestionCardProps {
  suggestions: Suggestions
  idx: number
  isLatest: boolean
  isEditing: boolean
  isApplied: boolean
  applyLabel: string
  editedSuggestions: any
  onEditStart: (idx: number, suggestions: Suggestions) => void
  onEditCancel: () => void
  onEditSave: (idx: number) => void
  onApply: (suggestions: Suggestions, idx: number) => void
  onCopy: (text: string, field: string) => void
  copiedField: string | null
  updateEditedField: (field: string, value: string) => void
}

export function SuggestionCard({
  suggestions, idx, isLatest, isEditing, isApplied, applyLabel, editedSuggestions,
  onEditStart, onEditCancel, onEditSave, onApply, onCopy, copiedField, updateEditedField
}: SuggestionCardProps) {
  return (
    <div className="mt-3 bg-zinc-800 border border-[#c99850]/30 rounded-lg p-4 space-y-3">
      {isLatest && (
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#c99850]/20">
          <span className="px-2 py-1 text-xs font-bold bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black rounded">LATEST</span>
          <span className="text-xs text-zinc-400">Most recent suggestions</span>
        </div>
      )}

      {isEditing ? (
        <EditableForm
          editedSuggestions={editedSuggestions}
          applyLabel={applyLabel}
          updateEditedField={updateEditedField}
          onSave={() => onEditSave(idx)}
          onCancel={onEditCancel}
        />
      ) : (
        <DisplayForm
          suggestions={suggestions}
          idx={idx}
          isApplied={isApplied}
          applyLabel={applyLabel}
          onEditStart={() => onEditStart(idx, suggestions)}
          onApply={() => onApply(suggestions, idx)}
          onCopy={onCopy}
          copiedField={copiedField}
        />
      )}
    </div>
  )
}

function EditableForm({ editedSuggestions, applyLabel, updateEditedField, onSave, onCancel }: {
  editedSuggestions: any
  applyLabel: string
  updateEditedField: (field: string, value: string) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <>
      <div>
        <label className="text-xs font-bold text-[#c99850] block mb-1">Prompt:</label>
        <textarea
          value={editedSuggestions.prompt || ''}
          onChange={(e) => updateEditedField('prompt', e.target.value)}
          className="w-full px-3 py-2 bg-zinc-900 border border-[#c99850]/30 rounded text-sm leading-6 text-white resize-none"
          rows={5}
        />
      </div>
      <div>
        <label className="text-xs font-bold text-[#c99850] block mb-1">Negative Prompt:</label>
        <textarea
          value={editedSuggestions.negativePrompt || ''}
          onChange={(e) => updateEditedField('negativePrompt', e.target.value)}
          className="w-full px-3 py-2 bg-zinc-900 border border-[#c99850]/30 rounded text-sm leading-6 text-white resize-none"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-[#c99850]/20">
        <SelectField label="Style:" value={editedSuggestions.style || '3D Render'} options={STYLE_OPTIONS.map(s => ({ value: s, label: s }))} onChange={(v) => updateEditedField('style', v)} />
        <SelectField label="Aspect Ratio:" value={editedSuggestions.aspectRatio || '1:1'} options={ASPECT_RATIO_OPTIONS} onChange={(v) => updateEditedField('aspectRatio', v)} />
        <SelectField label="Camera Angle:" value={editedSuggestions.cameraAngle || 'None'} options={CAMERA_ANGLE_OPTIONS.map(a => ({ value: a, label: a }))} onChange={(v) => updateEditedField('cameraAngle', v)} />
        <SelectField label="Camera Lens:" value={editedSuggestions.cameraLens || 'None'} options={CAMERA_LENS_OPTIONS.map(l => ({ value: l, label: l }))} onChange={(v) => updateEditedField('cameraLens', v)} />
        <SelectField label="Resolution:" value={editedSuggestions.resolution || '1K'} options={RESOLUTION_OPTIONS} onChange={(v) => updateEditedField('resolution', v)} />
      </div>
      <div className="flex gap-2 mt-2">
        <button onClick={onSave} className="flex-1 px-3 py-1.5 bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black text-xs font-bold rounded hover:from-[#dbb56e] hover:to-[#f4d698] transition-all">
          {applyLabel}
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 bg-zinc-700 text-white text-xs font-bold rounded hover:bg-zinc-600 transition-all">
          Cancel
        </button>
      </div>
    </>
  )
}

function DisplayForm({ suggestions, idx, isApplied, applyLabel, onEditStart, onApply, onCopy, copiedField }: {
  suggestions: Suggestions
  idx: number
  isApplied: boolean
  applyLabel: string
  onEditStart: () => void
  onApply: () => void
  onCopy: (text: string, field: string) => void
  copiedField: string | null
}) {
  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-bold text-[#c99850]">Prompt:</label>
          <button onClick={() => onCopy(suggestions.prompt, `prompt-${idx}`)} className="text-[#c99850] hover:text-[#dbb56e] transition-colors" title="Copy prompt">
            {copiedField === `prompt-${idx}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
        <PromptBody>{suggestions.prompt}</PromptBody>
      </div>

      {suggestions.negativePrompt && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-[#c99850]">Negative Prompt:</label>
            <button onClick={() => onCopy(suggestions.negativePrompt!, `neg-${idx}`)} className="text-[#c99850] hover:text-[#dbb56e] transition-colors" title="Copy negative prompt">
              {copiedField === `neg-${idx}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <PromptBody>{suggestions.negativePrompt}</PromptBody>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-[#c99850]/20">
        <DisplayField label="Style:" value={suggestions.style} />
        <DisplayField label="Aspect Ratio:" value={suggestions.aspectRatio || '1:1'} />
        <DisplayField label="Camera Angle:" value={suggestions.cameraAngle} />
        <DisplayField label="Camera Lens:" value={suggestions.cameraLens} />
        <DisplayField label="Resolution:" value={suggestions.resolution || '1K'} />
        {suggestions.textMode && <DisplayField label="Text Mode:" value={suggestions.textMode} />}
        {suggestions.bgRemovalMethod && <DisplayField label="BG Method:" value={suggestions.bgRemovalMethod} />}
        {suggestions.selectedModel && <DisplayField label="Model:" value={suggestions.selectedModel} />}
      </div>

      <div className="flex gap-2 mt-2">
        <button onClick={onEditStart} className="flex-1 px-3 py-1.5 bg-zinc-700 text-white text-xs font-bold rounded hover:bg-zinc-600 transition-all flex items-center justify-center gap-1">
          <Edit2 className="w-3 h-3" /> Edit Settings
        </button>
        <button
          onClick={onApply}
          className={`flex-1 px-3 py-1.5 text-xs font-bold rounded transition-all flex items-center justify-center gap-1 ${
            isApplied ? 'bg-green-500 text-white' : 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#f4d698]'
          }`}
        >
          {isApplied ? <><Check className="w-3 h-3" /> Applied!</> : applyLabel}
        </button>
      </div>
    </>
  )
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[] | string[]; onChange: (v: string) => void }) {
  const normalizedOptions = options.map(o => typeof o === 'string' ? { value: o, label: o } : o)
  return (
    <div>
      <label className="text-xs font-bold text-[#c99850] block mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-2 py-1 bg-zinc-900 border border-[#c99850]/30 rounded text-xs text-white">
        {normalizedOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  )
}

function DisplayField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <label className="text-xs font-bold text-[#c99850]">{label}</label>
      <p className="text-xs text-zinc-300">{value || '-'}</p>
    </div>
  )
}

function PromptBody({ children }: { children: string }) {
  return (
    <p className="rounded-md bg-zinc-900/70 border border-zinc-700/70 px-3 py-2 text-sm leading-6 text-zinc-200 whitespace-pre-wrap">
      {children}
    </p>
  )
}
