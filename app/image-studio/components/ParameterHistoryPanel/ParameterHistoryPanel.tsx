"use client"

/**
 * ParameterHistoryPanel Component
 *
 * Panel for viewing and managing generation parameter history
 */

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import { getHistory, deleteHistoryItem, clearHistory, syncHistoryFromNeon, type HistoryItem } from '@/lib/history'
import { toast } from 'sonner'
import { HistoryHeader } from './HistoryHeader'
import { HistoryItemCard } from './HistoryItemCard'

interface ParameterHistoryPanelProps {
  isOpen: boolean
  onClose: () => void
  onRestoreParameters: (params: any) => void
}

export function ParameterHistoryPanel({ isOpen, onClose, onRestoreParameters }: ParameterHistoryPanelProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  // On open: show the local cache instantly, then refresh from Neon in the
  // background. The cache intentionally drops heavyweight data-URI entries
  // (quota safety), so without this auto-sync fresh generations only appeared
  // after pressing Sync — and vanished again on reopen.
  useEffect(() => {
    if (isOpen) {
      loadHistory()
      void syncFromNeon(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const loadHistory = () => {
    const items = getHistory()
    console.log('[v0] Loaded history:', items.length, 'items')
    setHistory(items)
  }

  const handleToggleSelect = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedItems.size === history.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(history.map(h => h.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return
    if (!confirm(`Delete ${selectedItems.size} selected item(s)?`)) return

    setIsDeleting(true)
    try {
      for (const id of selectedItems) {
        await deleteHistoryItem(id)
      }
      setSelectedItems(new Set())
      loadHistory()
      toast.success(`Deleted ${selectedItems.size} item(s)`)
    } finally {
      setIsDeleting(false)
    }
  }

  const syncFromNeon = async (silent = false) => {
    setLoading(true)
    try {
      console.log('[v0] Syncing history from Neon...')
      const result = await syncHistoryFromNeon()
      setHistory(result.data)

      if (result.success) {
        if (!silent) {
          if (result.syncedCount === 0) {
            toast.info('No history found in cloud database')
          } else {
            toast.success(`Synced ${result.syncedCount} items from cloud`)
          }
        }
        console.log('[v0] Synced', result.syncedCount, 'items from Neon')
      } else {
        if (!silent) toast.error(`Sync failed: ${result.error}`)
        console.error('[v0] Sync failed:', result.error)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (!silent) toast.error(`Sync failed: ${errorMessage}`)
      console.error('[v0] Failed to sync history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Delete this history item?')) {
      await deleteHistoryItem(id)
      loadHistory()
      toast.success('Item deleted')
    }
  }

  const handleClearAll = async () => {
    if (confirm('Clear all history? This cannot be undone.')) {
      await clearHistory()
      loadHistory()
      toast.success('All history cleared')
    }
  }

  const handleRestore = (item: HistoryItem) => {
    console.log('[v0] Restoring parameters from history item:', item.id)
    onRestoreParameters({
      mainPrompt: item.prompt,
      aspectRatio: item.aspectRatio,
      imageUrls: item.imageUrls,
    })
    onClose()
  }

  const handleDownloadImage = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl, {
        mode: 'cors',
        cache: 'no-cache'
      })
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `history-image-${index + 1}-${Date.now()}.png`
      link.style.display = 'none'

      document.body.appendChild(link)
      link.click()

      setTimeout(() => {
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)
      }, 100)
    } catch (error) {
      console.error('[v0] Download failed:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] bg-zinc-900 border-[#c99850]/30 overflow-hidden flex flex-col">
        <HistoryHeader
          historyCount={history.length}
          selectedCount={selectedItems.size}
          allSelected={selectedItems.size === history.length && history.length > 0}
          loading={loading}
          isDeleting={isDeleting}
          onSelectAll={handleSelectAll}
          onSync={() => void syncFromNeon()}
          onBulkDelete={handleBulkDelete}
          onClearAll={handleClearAll}
          onClose={onClose}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Clock className="w-16 h-16 text-zinc-600 mb-4" />
              <h3 className="text-lg font-semibold text-zinc-400 mb-2">No History Yet</h3>
              <p className="text-sm text-zinc-500 max-w-md">
                Generate images to start building your parameter history. Previous generations will appear here with thumbnails for quick restoration.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item) => (
                <HistoryItemCard
                  key={item.id}
                  item={item}
                  isSelected={selectedItems.has(item.id)}
                  onToggleSelect={handleToggleSelect}
                  onRestore={handleRestore}
                  onDelete={handleDelete}
                  onDownload={handleDownloadImage}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
