"use client"

/**
 * CanvasPanel
 *
 * Center workspace panel. Image mode: ResultsCanvas + PromptDock.
 * The remaining modes land here in later steps (logo, then
 * mockups/bg-remover mounted-hidden).
 */

import { Card } from '@/components/ui/card'
import { ResultsCanvas } from './ResultsCanvas'
import { PromptDock } from './PromptDock'
import { useStudioMode } from '../../context/useStudio'

const PENDING_MODE_LABELS: Record<string, string> = {
  logo: 'Logo generator',
  mockups: 'Product mockups',
  'bg-remover': 'Background remover',
}

export function CanvasPanel() {
  const { mode } = useStudioMode()

  if (mode !== 'image') {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-zinc-950">
        <Card className="bg-zinc-900/90 border-zinc-800 px-8 py-6 max-w-md text-center">
          <p className="text-sm text-zinc-300 font-medium mb-1">
            {PENDING_MODE_LABELS[mode] || mode} joins the workspace soon
          </p>
          <p className="text-xs text-zinc-500 leading-5">
            This mode is still served by the classic studio page while the
            workspace migration is in progress.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <ResultsCanvas />
      <PromptDock />
    </div>
  )
}
