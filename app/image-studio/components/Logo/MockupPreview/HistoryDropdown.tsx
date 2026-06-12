"use client"

/**
 * HistoryDropdown Component
 *
 * Dropdown showing mockup history from LogoHistoryPanel.
 * Extracted from ProductMockupsPanel.tsx to keep files under 300 lines.
 */

import { RefObject } from 'react'
import { History, ChevronDown } from 'lucide-react'
import { LogoHistoryPanel, LogoHistoryItem } from '../LogoHistory'

interface HistoryDropdownProps {
  isOpen: boolean
  onToggle: () => void
  onLoadImage: (item: LogoHistoryItem) => void
  dropdownRef: RefObject<HTMLDivElement | null>
  refreshRef: RefObject<(() => void) | null>
}

export function HistoryDropdown({
  isOpen,
  onToggle,
  onLoadImage,
  dropdownRef,
  refreshRef
}: HistoryDropdownProps) {
  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          isOpen
            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
            : 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700'
        }`}
        title="View mockup history"
      >
        <History className="w-4 h-4" />
        Mockup History
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden p-4 min-w-[874px]">
          <LogoHistoryPanel
            filterStyle="mockup"
            compact={true}
            alwaysExpanded={true}
            refreshRef={refreshRef}
            onLoadImage={onLoadImage}
          />
        </div>
      )}
    </div>
  )
}
