"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Database } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { CreationMediaMetadata } from '@/lib/creation-metadata'
import { getUserId } from '@/lib/user-id'
import { CreationMetadataEditor } from '../CreationMetadata'
import { ImageLightbox } from '../ImageLightbox'
import { usePreviewLightbox } from '../../hooks/usePreviewLightbox'
import type { CreationLibraryTab } from '../../hooks/useImageStudioState'
import { ImageDatabaseCard } from './ImageDatabaseCard'
import { ImageDatabaseFilters } from './ImageDatabaseFilters'
import { ImageDatabaseHeader } from './ImageDatabaseHeader'
import {
  applyCreationMetadata,
  buildImageDatabaseRecords,
  filterImageDatabaseRecords,
  filterImageDatabaseRecordsByMedia,
  type ImageDatabaseRecord,
  type ImageDatabaseSource,
  type ImageDatabaseSourceFilter,
} from './image-database-records'
import { favoriteRestorePayload, historyRestorePayload, restoredTargetsForUrl } from './image-database-actions'

const PAGE_SIZE = 60

interface ImageDatabaseBrowserProps {
  activeMedia: Exclude<CreationLibraryTab, 'videos'>
  onSelectMedia: (tab: CreationLibraryTab) => void
  onClose: () => void
  onFavoritesChanged: () => Promise<void>
}

interface ImageDatabaseResponses {
  history?: unknown[]
  favorites?: unknown[]
  metadata?: unknown[]
}

async function requestImageDatabaseRecords(): Promise<ImageDatabaseRecord[]> {
  const userId = encodeURIComponent(getUserId())
  const responses = await Promise.all([
    fetch(`/api/history?userId=${userId}`),
    fetch(`/api/favorites?userId=${userId}`),
    fetch(`/api/logo-history?userId=${userId}`),
    fetch(`/api/creation-metadata?userId=${userId}`),
  ])
  const failedResponse = responses.find((response) => !response.ok)
  if (failedResponse) throw new Error(`Database request failed (${failedResponse.status})`)
  const [historyData, favoritesData, logoData, metadataData] = await Promise.all(
    responses.map((response) => response.json() as Promise<ImageDatabaseResponses>),
  )
  const records = buildImageDatabaseRecords({
    history: Array.isArray(historyData.history) ? historyData.history as Parameters<typeof buildImageDatabaseRecords>[0]['history'] : [],
    favorites: Array.isArray(favoritesData.favorites) ? favoritesData.favorites as Parameters<typeof buildImageDatabaseRecords>[0]['favorites'] : [],
    logoHistory: Array.isArray(logoData.history) ? logoData.history as Parameters<typeof buildImageDatabaseRecords>[0]['logoHistory'] : [],
  })
  const metadata = Array.isArray(metadataData.metadata) ? metadataData.metadata as CreationMediaMetadata[] : []
  return applyCreationMetadata(records, metadata)
}

export function ImageDatabaseBrowser({ activeMedia, onSelectMedia, onClose, onFavoritesChanged }: ImageDatabaseBrowserProps) {
  const [records, setRecords] = useState<ImageDatabaseRecord[]>([])
  const [source, setSource] = useState<ImageDatabaseSourceFilter>('all')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [tag, setTag] = useState('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set())
  const [editingItem, setEditingItem] = useState<CreationMediaMetadata | null>(null)
  const pendingActionsRef = useRef<Set<string>>(new Set())

  const loadRecords = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRecords(await requestImageDatabaseRecords())
    } catch (loadError) {
      console.error('[Image Database] Failed to load image records:', loadError)
      setError(loadError instanceof Error ? loadError.message : 'Could not load image records')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    void requestImageDatabaseRecords()
      .then((nextRecords) => { if (active) setRecords(nextRecords) })
      .catch((loadError) => {
        console.error('[Image Database] Failed to load image records:', loadError)
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load image records')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const mediaRecords = useMemo(() => filterImageDatabaseRecordsByMedia(records, activeMedia), [records, activeMedia])
  const activeSource = activeMedia === 'logos' ? 'all' : source
  const filteredRecords = useMemo(
    () => filterImageDatabaseRecords(mediaRecords, activeSource, query, category, tag),
    [activeSource, category, mediaRecords, query, tag],
  )
  const visibleRecords = filteredRecords.slice(0, visibleCount)
  const previewImages = useMemo(() => filteredRecords.map((record) => ({ url: record.url, prompt: record.prompt })), [filteredRecords])
  const lightbox = usePreviewLightbox(previewImages)

  const counts = useMemo(() => records.reduce<Record<ImageDatabaseSource, number>>((result, record) => {
    result[record.source] += 1
    return result
  }, { generation_history: 0, favorites: 0, logo_history: 0 }), [records])
  const sourceFilters = [
    { value: 'all' as const, label: 'All', count: mediaRecords.length },
    { value: 'generation_history' as const, label: 'History', count: counts.generation_history },
    { value: 'favorites' as const, label: 'Favorites', count: counts.favorites },
  ]
  const categories = useMemo(() => [...new Set(mediaRecords.map((record) => record.category).filter((value): value is string => Boolean(value)))].sort(), [mediaRecords])
  const tags = useMemo(() => [...new Set(mediaRecords.flatMap((record) => record.tags ?? []))].sort(), [mediaRecords])

  const changeFilter = (setter: (value: string) => void, value: string) => {
    setter(value)
    setVisibleCount(PAGE_SIZE)
  }

  const selectMedia = (tab: CreationLibraryTab) => {
    setSource('all')
    setCategory('all')
    setTag('all')
    setVisibleCount(PAGE_SIZE)
    onSelectMedia(tab)
  }

  const restoreRecord = async (record: ImageDatabaseRecord, target: 'history' | 'favorites') => {
    const actionKey = `${target}:${record.url}`
    if (pendingActionsRef.current.has(actionKey)) return
    if (restoredTargetsForUrl(records, record.url)[target]) {
      toast.info(`Already in ${target === 'history' ? 'History' : 'Favorites'}`)
      return
    }
    pendingActionsRef.current.add(actionKey)
    setPendingActions(new Set(pendingActionsRef.current))
    try {
      const response = await fetch(target === 'history' ? '/api/history' : '/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(target === 'history' ? historyRestorePayload(record, getUserId()) : favoriteRestorePayload(record, getUserId())),
      })
      const result = await response.json() as { alreadyExists?: boolean; error?: string }
      if (!response.ok) throw new Error(result.error || `Restore failed (${response.status})`)
      if (target === 'favorites') await onFavoritesChanged()
      await loadRecords()
      toast.success(result.alreadyExists ? `Already in ${target === 'history' ? 'History' : 'Favorites'}` : `Added to ${target === 'history' ? 'History' : 'Favorites'}`)
    } catch (restoreError) {
      toast.error(restoreError instanceof Error ? restoreError.message : 'Could not restore image')
    } finally {
      pendingActionsRef.current.delete(actionKey)
      setPendingActions(new Set(pendingActionsRef.current))
    }
  }

  const openEditor = (record: ImageDatabaseRecord) => setEditingItem({
    mediaType: record.mediaType,
    mediaUrl: record.url,
    title: record.title ?? null,
    category: record.category ?? null,
    tags: record.tags ?? [],
  })
  const handleMetadataSaved = (metadata: CreationMediaMetadata) => {
    setRecords((current) => applyCreationMetadata(current, [metadata]))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <Card className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden border-[#c99850]/30 bg-zinc-900">
        <ImageDatabaseHeader activeMedia={activeMedia} count={mediaRecords.length} isLoading={loading} onSelectMedia={selectMedia} onRefresh={() => void loadRecords()} onClose={onClose} />
        <ImageDatabaseFilters
          activeMedia={activeMedia} activeSource={activeSource} sourceFilters={sourceFilters}
          query={query} category={category} tag={tag} categories={categories} tags={tags}
          onSourceChange={(value) => { setSource(value); setVisibleCount(PAGE_SIZE) }}
          onQueryChange={(value) => changeFilter(setQuery, value)}
          onCategoryChange={(value) => changeFilter(setCategory, value)}
          onTagChange={(value) => changeFilter(setTag, value)}
        />

        <div className="flex-1 overflow-y-auto p-4">
          {error ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-red-400">{error}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void loadRecords()}>Try again</Button>
            </div>
          ) : loading && records.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-zinc-400">Loading thumbnails from Neon…</div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Database className="mb-4 h-14 w-14 text-zinc-700" />
              <p className="text-zinc-400">No matching {activeMedia}</p>
              <p className="mt-1 text-xs text-zinc-600">Try another search term or filter.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {visibleRecords.map((record) => {
                  const previewIndex = filteredRecords.findIndex((candidate) => candidate.recordId === record.recordId && candidate.source === record.source)
                  const restored = restoredTargetsForUrl(records, record.url)
                  return (
                    <ImageDatabaseCard
                      key={`${record.source}:${record.recordId}`}
                      record={record}
                      isInHistory={restored.history}
                      isInFavorites={restored.favorites}
                      isAddingHistory={pendingActions.has(`history:${record.url}`)}
                      isAddingFavorite={pendingActions.has(`favorites:${record.url}`)}
                      onPreview={() => lightbox.open(previewIndex)}
                      onRestoreHistory={() => void restoreRecord(record, 'history')}
                      onRestoreFavorite={() => void restoreRecord(record, 'favorites')}
                      onEditMetadata={() => openEditor(record)}
                    />
                  )
                })}
              </div>
              {visibleRecords.length < filteredRecords.length && (
                <div className="flex justify-center pt-5">
                  <Button type="button" variant="outline" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                    Load {Math.min(PAGE_SIZE, filteredRecords.length - visibleRecords.length)} more
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      <CreationMetadataEditor item={editingItem} categorySuggestions={categories} onClose={() => setEditingItem(null)} onSaved={handleMetadataSaved} />
      <ImageLightbox isOpen={lightbox.isOpen} images={previewImages} currentIndex={lightbox.index ?? 0} onClose={lightbox.close} onNavigate={lightbox.navigate} onDownload={() => void lightbox.download()} />
    </div>
  )
}
