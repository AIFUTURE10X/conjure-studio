"use client"

/**
 * LogoHistoryModal
 *
 * Full-size pop-out for the logo Generation History — the same experience as
 * the image generator's Parameter History panel: a large overlay with the
 * complete history grid, toolbar (sync/compare/clear), and per-card actions.
 * Hosts LogoHistoryPanel in alwaysExpanded + fullHeight mode.
 */

import { X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { LogoHistoryPanel } from './LogoHistoryPanel'
import type { LogoHistoryItem } from './useLogoHistory'

interface LogoHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  onUseSettings?: (item: LogoHistoryItem) => void
  onLoadImage?: (item: LogoHistoryItem) => void
  onSendToMockups?: (item: LogoHistoryItem) => void
  onCompare?: (items: LogoHistoryItem[]) => void
  filterStyle?: 'logo' | 'mockup'
}

export function LogoHistoryModal({
  isOpen,
  onClose,
  onUseSettings,
  onLoadImage,
  onSendToMockups,
  onCompare,
  filterStyle,
}: LogoHistoryModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="relative w-full max-w-6xl h-[90vh] bg-zinc-900 border-[#c99850]/30 overflow-hidden flex flex-col p-4">
        <button
          onClick={onClose}
          title="Close"
          className="absolute top-3 right-3 z-10 p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <LogoHistoryPanel
          alwaysExpanded
          fullHeight
          filterStyle={filterStyle}
          onUseSettings={onUseSettings}
          onLoadImage={onLoadImage}
          onSendToMockups={onSendToMockups}
          onCompare={onCompare}
        />
      </Card>
    </div>
  )
}
