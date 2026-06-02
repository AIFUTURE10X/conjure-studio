'use client'

import { ClipboardList } from 'lucide-react'

interface DesignBriefCardProps {
  designBrief?: string
}

interface DesignBriefSections {
  understood: string
  preserve: string
  next: string
}

const SECTION_PREFIXES = [
  { key: 'understood', label: 'What I understood' },
  { key: 'preserve', label: 'What to preserve' },
  { key: 'next', label: 'What changes next' },
] as const

function parseDesignBrief(designBrief: string): DesignBriefSections {
  const sections: DesignBriefSections = {
    understood: '',
    preserve: '',
    next: '',
  }
  let matchedAnySection = false

  for (const line of designBrief.split('\n')) {
    const cleanLine = line.replace(/^[-*]\s*/, '').trim()
    const matchedPrefix = SECTION_PREFIXES.find((section) => cleanLine.toLowerCase().startsWith(`${section.label.toLowerCase()}:`))
    if (!matchedPrefix) continue

    matchedAnySection = true
    const value = cleanLine.slice(matchedPrefix.label.length + 1).trim()
    sections[matchedPrefix.key] = value
  }

  return matchedAnySection ? sections : { ...sections, understood: designBrief.trim() }
}

export function DesignBriefCard({ designBrief }: DesignBriefCardProps) {
  if (!designBrief?.trim()) return null

  const sections = parseDesignBrief(designBrief)
  const visibleSections = [
    { label: 'What I understood', value: sections.understood },
    { label: 'What to preserve', value: sections.preserve },
    { label: 'What changes next', value: sections.next },
  ].filter((section) => section.value.trim())

  if (visibleSections.length === 0) return null

  return (
    <div className="mt-3 rounded-lg border border-[#c99850]/30 bg-zinc-800/80 p-4">
      <div className="mb-3 flex items-center gap-2 border-b border-[#c99850]/20 pb-2">
        <ClipboardList className="h-4 w-4 text-[#c99850]" />
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#f0d49b]">Working brief</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {visibleSections.map((section) => (
          <div key={section.label} className="min-w-0">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{section.label}</div>
            <p className="text-sm leading-6 text-zinc-200">{section.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
