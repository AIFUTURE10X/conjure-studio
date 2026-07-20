"use client"

/**
 * CanvasPanel
 *
 * Center workspace panel. Image mode: ResultsCanvas + PromptDock.
 * Logo mode: LogoCanvas + PromptDock. Mockups and the background remover
 * stay mounted-hidden so their state survives mode switches, matching the
 * classic page's behavior.
 */

import { Card } from '@/components/ui/card'
import { ResultsCanvas } from './ResultsCanvas'
import { LogoCanvas } from './LogoCanvas'
import { PromptDock } from './PromptDock'
import { ProductMockupsPanel } from '../Logo/MockupPreview/ProductMockupsPanel'
import { BackgroundRemoverPanel } from '../BackgroundRemover'
import { ThumbnailCanvas } from '../Thumbnail'
import { TranslateTextPanel } from '../TranslateText'
import { VideoCanvas } from '../Video'
import { GuideCanvas } from '../Guide/GuideCanvas'
import { AnalyticsCanvas } from '../Analytics/AnalyticsCanvas'
import { useStudioMode } from '../../context/useStudio'

export function CanvasPanel() {
  const { mode } = useStudioMode()
  const isPromptMode = mode === 'image' || mode === 'logo'

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {mode === 'image' && <ResultsCanvas />}
      {mode === 'logo' && <LogoCanvas />}
      {mode === 'thumbnail' && <ThumbnailCanvas />}
      {mode === 'translate' && <TranslateTextPanel />}
      {mode === 'guide' && <GuideCanvas />}
      {mode === 'analytics' && <AnalyticsCanvas />}

      {/* Mounted-hidden so pending video jobs keep polling across mode switches. */}
      <div className={`flex-1 min-h-0 flex-col ${mode === 'video' ? 'flex' : 'hidden'}`}>
        <VideoCanvas />
      </div>

      <Card
        className={`flex-1 min-h-0 m-3 bg-zinc-900/90 border border-zinc-800 overflow-clip ${
          mode !== 'mockups' ? 'hidden' : ''
        }`}
      >
        <ProductMockupsPanel />
      </Card>

      <div className={`flex-1 min-h-0 overflow-y-auto px-4 py-4 ${mode !== 'bg-remover' ? 'hidden' : ''}`}>
        <BackgroundRemoverPanel />
      </div>

      {isPromptMode && <PromptDock />}
    </div>
  )
}
