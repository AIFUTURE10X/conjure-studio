"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Shield, X } from 'lucide-react'
import { removeConstraint, upsertConstraint } from './useDirectorProject'
import type { PreservationConstraint } from '@/lib/video/photo-director-schema'

interface ConstraintEditorProps {
  constraints: PreservationConstraint[]
}

/**
 * The preservation list — what the video must never change. Every entry is
 * appended to every shot's prompt automatically, so an edit here propagates to
 * the whole storyboard without re-planning.
 */
export function ConstraintEditor({ constraints }: ConstraintEditorProps) {
  const [newSubject, setNewSubject] = useState('')

  const handleAdd = () => {
    const subject = newSubject.trim()
    if (!subject) return
    upsertConstraint({
      id: `user-${Date.now().toString(36)}`,
      subject,
      requirement: `Keep the ${subject} exactly as photographed`,
      negativePhrase: `do not change, move, or remove the ${subject}`,
      severity: 'must',
      source: 'user',
    })
    setNewSubject('')
  }

  const ordered = [...constraints].sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === 'must' ? -1 : 1)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5 text-[#dbb56e]" />
        <p className="text-xs font-medium text-zinc-200">Never change these</p>
        <span className="text-[10px] text-zinc-500">applied to every shot automatically</span>
      </div>
      <div className="space-y-1 max-h-[30vh] overflow-y-auto pr-1">
        {ordered.map((constraint) => (
          <div key={constraint.id} className="flex items-start gap-2 px-2 py-1.5 rounded-md bg-zinc-950 border border-zinc-800">
            <button
              onClick={() => upsertConstraint({
                ...constraint,
                severity: constraint.severity === 'must' ? 'should' : 'must',
              })}
              title={constraint.severity === 'must'
                ? 'Strict — click to relax to "keep if possible"'
                : 'Soft — click to make strict'}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 mt-0.5 ${
                constraint.severity === 'must'
                  ? 'bg-[#c99850]/20 text-[#dbb56e]'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {constraint.severity}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-200 leading-4">{constraint.subject}</p>
              <p className="text-[10px] text-zinc-500 leading-4">{constraint.requirement}</p>
            </div>
            {constraint.source === 'user' && (
              <span className="text-[9px] text-zinc-600 shrink-0 mt-0.5">yours</span>
            )}
            <button
              onClick={() => removeConstraint(constraint.id)}
              title="Remove this rule"
              className="p-0.5 rounded text-zinc-600 hover:text-red-400 shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {ordered.length === 0 && (
          <p className="text-[11px] text-zinc-600">No preservation rules yet — add anything the video must never change.</p>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          placeholder='Add a rule — e.g. "the temple view from the balcony"'
          aria-label="Add preservation rule"
          className="h-7 bg-zinc-950 border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600"
        />
        <Button
          onClick={handleAdd}
          disabled={!newSubject.trim()}
          size="sm"
          className="h-7 px-2 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
          title="Add this preservation rule"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
