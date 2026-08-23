"use client"

/**
 * BackgroundRemoverPanel Component
 *
 * Main panel for the Background Remover app. Combines upload, queue,
 * preview, and controls into a cohesive batch processing interface.
 */

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { useBackgroundRemoverState } from '../../hooks/useBackgroundRemoverState'
import { BgRemoverUpload } from './BgRemoverUpload'
import { BgRemoverQueue } from './BgRemoverQueue'
import { BgRemoverPreview } from './BgRemoverPreview'
import { BgRemoverControls } from './BgRemoverControls'
import { BgRemoverLightbox } from './BgRemoverLightbox'
import { Eraser } from 'lucide-react'

export function BackgroundRemoverPanel() {
  const [showLightbox, setShowLightbox] = useState(false)
  const [backgroundColor, setBackgroundColor] = useState<string | null>(null)

  const {
    queue,
    selectedId,
    isProcessingAll,
    addToQueue,
    removeFromQueue,
    clearQueue,
    setSelectedItem,
    processItem,
    processAll,
    getSelectedItem,
  } = useBackgroundRemoverState()

  const selectedItem = getSelectedItem()
  const hasQueue = queue.length > 0
  const pendingCount = queue.filter(i => i.status === 'pending').length
  const completeCount = queue.filter(i => i.status === 'complete').length
  const completeItems = queue.filter(i => i.status === 'complete')
  const isProcessingSelected = selectedItem?.status === 'processing'

  return (
    <div className="w-full max-w-5xl mx-auto">
      <Card className="bg-zinc-900/90 border-zinc-800 p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #c99850 0%, #dbb56e 50%, #c99850 100%)",
            }}
          >
            <Eraser className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Background Remover</h2>
            <p className="text-xs text-zinc-400">Remove backgrounds from images instantly</p>
          </div>
        </div>

        {/* Upload zone - always visible (compact when queue has items) */}
        <BgRemoverUpload
          onUpload={addToQueue}
          compact={hasQueue}
        />

        {/* Queue and preview (when items exist) */}
        {hasQueue && (
          <>
            {/* Queue strip */}
            <BgRemoverQueue
              items={queue}
              selectedId={selectedId}
              onSelect={setSelectedItem}
              onRemove={removeFromQueue}
            />

            {/* Side-by-side preview */}
            <BgRemoverPreview
              original={selectedItem?.originalUrl}
              processed={selectedItem?.processedUrl}
              status={selectedItem?.status}
              error={selectedItem?.error}
              onOpenLightbox={
                selectedItem?.status === 'complete' && selectedItem?.processedUrl
                  ? () => setShowLightbox(true)
                  : undefined
              }
              backgroundColor={backgroundColor}
              onBackgroundColorChange={setBackgroundColor}
            />

            {/* Controls */}
            <BgRemoverControls
              onProcessSelected={() => selectedId && processItem(selectedId)}
              onProcessAll={processAll}
              onClearQueue={clearQueue}
              selectedItem={selectedItem}
              pendingCount={pendingCount}
              completeCount={completeCount}
              completeItems={completeItems}
              isProcessing={isProcessingSelected}
              isProcessingAll={isProcessingAll}
              backgroundColor={backgroundColor}
            />
          </>
        )}
      </Card>

      {/* Before/After Lightbox */}
      {selectedItem?.originalUrl && selectedItem?.processedUrl && (
        <BgRemoverLightbox
          isOpen={showLightbox}
          onClose={() => setShowLightbox(false)}
          originalUrl={selectedItem.originalUrl}
          processedUrl={selectedItem.processedUrl}
          fileName={selectedItem.fileName}
          backgroundColor={backgroundColor}
        />
      )}
    </div>
  )
}
