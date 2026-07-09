'use client'

import { SearchCheck } from 'lucide-react'

interface DiagnosticCardProps {
  findings?: string[]
}

export function DiagnosticCard({ findings }: DiagnosticCardProps) {
  const visibleFindings = (findings || [])
    .map((finding) => finding.trim())
    .filter(Boolean)
    .slice(0, 5)

  if (visibleFindings.length === 0) return null

  return (
    <div className="mt-3 rounded-lg border border-sky-500/30 bg-sky-950/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-sky-500/20 pb-2">
        <div className="flex items-center gap-2">
          <SearchCheck className="h-4 w-4 text-sky-300" />
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-sky-200">Diagnosis</span>
        </div>
        <span className="rounded border border-sky-500/30 px-2 py-1 text-[11px] font-semibold text-sky-200">No generator changes</span>
      </div>
      <ul className="space-y-2">
        {visibleFindings.map((finding, index) => (
          <li key={`${index}-${finding}`} className="flex gap-2 text-sm leading-6 text-zinc-200">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
            <span>{finding}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
