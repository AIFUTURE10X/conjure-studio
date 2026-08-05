"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Database, ExternalLink, RefreshCw, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getUserId } from '@/lib/user-id'
import { ImageLibraryTabs } from '../ImageLibraryTabs'
import { ImageLightbox } from '../ImageLightbox'
import { NeonStatusBadge } from '../NeonStatusBadge'
import { usePreviewLightbox } from '../../hooks/usePreviewLightbox'
import type { ImageLibraryTab } from '../../hooks/useImageStudioState'
import {
  buildImageDatabaseRecords,
  filterImageDatabaseRecords,
  type ImageDatabaseRecord,
  type ImageDatabaseSource,
  type ImageDatabaseSourceFilter,
} from './image-database-records'

const PAGE_SIZE = 60

const SOURCE_LABELS: Record<ImageDatabaseSource, string> = {
  generation_history: 'History',
  favorites: 'Favorite',
  logo_history: 'Logo',
}

interface ImageDatabaseBrowserProps {
  activeTab: ImageLibraryTab
  onSelectTab: (tab: ImageLibraryTab) => void
  onClose: () => void
}

interface ImageDatabaseResponses {
  history?: unknown[]
  favorites?: unknown[]
}

async function requestImageDatabaseRecords(): Promise<ImageDatabaseRecord[]> {
  const userId = encodeURIComponent(getUserId())
  const [historyResponse, favoritesResponse, logoResponse] = await Promise.all([
    fetch(`/api/history?userId=${userId}`),
    fetch(`/api/favorites?userId=${userId}`),
    fetch(`/api/logo-history?userId=${userId}`),
  ])

  const failedResponse = [historyResponse, favoritesResponse, logoResponse].find((response) => !response.ok)
  if (failedResponse) throw new Error(`Database request failed (${failedResponse.status})`)

  const [historyData, favoritesData, logoData] = await Promise.all([
    historyResponse.json() as Promise<ImageDatabaseResponses>,
    favoritesResponse.json() as Promise<ImageDatabaseResponses>,
    logoResponse.json() as Promise<ImageDatabaseResponses>,
  ])

  return buildImageDatabaseRecords({
    history: Array.isArray(historyData.history) ? historyData.history as Parameters<typeof buildImageDatabaseRecords>[0]['history'] : [],
    favorites: Array.isArray(favoritesData.favorites) ? favoritesData.favorites as Parameters<typeof buildImageDatabaseRecords>[0]['favorites'] : [],
    logoHistory: Array.isArray(logoData.history) ? logoData.history as Parameters<typeof buildImageDatabaseRecords>[0]['logoHistory'] : [],
  })
}

function displayUrl(url: string) {
  try {
    const parsed = new URL(url)
    return `${parsed.hostname}${parsed.pathname}`
  } catch {
    return url
  }
}

function formatDate(timestamp: number) {
  if (!Number.isFinite(timestamp)) return 'Unknown date'
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function ImageDatabaseBrowser({ activeTab, onSelectTab, onClose }: ImageDatabaseBrowserProps) {
  const [records, setRecords] = useState<ImageDatabaseRecord[]>([])
  const [source, setSource] = useState<ImageDatabaseSourceFilter>('all')
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      .then((nextRecords) => {
        if (active) setRecords(nextRecords)
      })
      .catch((loadError) => {
        console.error('[Image Database] Failed to load image records:', loadError)
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load image records')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const filteredRecords = useMemo(
    () => filterImageDatabaseRecords(records, source, query),
    [records, source, query],
  )
  const visibleRecords = filteredRecords.slice(0, visibleCount)
  const previewImages = useMemo(
    () => filteredRecords.map((record) => ({ url: record.url, prompt: record.prompt })),
    [filteredRecords],
  )
  const lightbox = usePreviewLightbox(previewImages)

  const counts = useMemo(() => records.reduce<Record<ImageDatabaseSource, number>>((result, record) => {
    result[record.source] += 1
    return result
  }, { generation_history: 0, favorites: 0, logo_history: 0 }), [records])

  const filters: Array<{ value: ImageDatabaseSourceFilter; label: string; count: number }> = [
    { value: 'all', label: 'All', count: records.length },
    { value: 'generation_history', label: 'History', count: counts.generation_history },
    { value: 'favorites', label: 'Favorites', count: counts.favorites },
    { value: 'logo_history', label: 'Logos', count: counts.logo_history },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <Card className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden border-[#c99850]/30 bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-[#c99850] to-[#dbb56e]">
              <Database className="h-5 w-5 text-black" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Image Library</h2>
              <p className="text-xs text-zinc-400">
                {loading ? 'Reading Neon image records…' : `${records.length} image records · read only`}
              </p>
            </div>
            <NeonStatusBadge endpoint="/api/history/test-connection" />
            <ImageLibraryTabs
              activeTab={activeTab}
              onSelectTab={onSelectTab}
              historyCount={counts.generation_history}
              favoritesCount={counts.favorites}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void loadRecords()}
              disabled={loading}
              className="text-[#c99850] hover:bg-[#c99850]/10 hover:text-[#dbb56e]"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 px-4 py-3">
          <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-800 bg-zinc-950/70 p-1">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => {
                  setSource(filter.value)
                  setVisibleCount(PAGE_SIZE)
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  source === filter.value
                    ? 'bg-[#c99850]/20 text-[#dbb56e]'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
          <label className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setVisibleCount(PAGE_SIZE)
              }}
              placeholder="Search prompt, record ID, or image URL"
              className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 pl-9 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#c99850]"
            />
          </label>
        </div>

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
              <p className="text-zinc-400">No matching image records</p>
              <p className="mt-1 text-xs text-zinc-600">Try another source or search term.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {visibleRecords.map((record) => {
                  const previewIndex = filteredRecords.findIndex((candidate) => candidate.recordId === record.recordId && candidate.source === record.source)
                  return (
                    <article key={`${record.source}:${record.recordId}`} className="group overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                      <button
                        type="button"
                        onClick={() => lightbox.open(previewIndex)}
                        className="relative block aspect-square w-full cursor-zoom-in overflow-hidden bg-black text-left"
                        title="Click to view full size"
                      >
                        <img
                          src={record.url}
                          alt={record.prompt || `${SOURCE_LABELS[record.source]} image ${record.sourceId}`}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                        />
                        <span className="absolute left-2 top-2 rounded bg-black/75 px-2 py-1 text-[10px] font-medium text-[#dbb56e] backdrop-blur-sm">
                          {SOURCE_LABELS[record.source]}
                        </span>
                      </button>
                      <div className="space-y-1.5 p-2.5">
                        <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-500">
                          <span className="truncate" title={record.recordId}>ID {record.recordId}</span>
                          <span className="shrink-0">{formatDate(record.timestamp)}</span>
                        </div>
                        {record.prompt && <p className="line-clamp-2 text-xs text-zinc-300">{record.prompt}</p>}
                        {record.detail && <p className="truncate text-[10px] text-zinc-500">{record.detail}</p>}
                        <a
                          href={record.url}
                          target="_blank"
                          rel="noreferrer"
                          title={record.url}
                          className="flex items-center gap-1 text-[10px] text-[#c99850] hover:text-[#dbb56e]"
                        >
                          <span className="truncate">{displayUrl(record.url)}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </div>
                    </article>
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

      <ImageLightbox
        isOpen={lightbox.isOpen}
        images={previewImages}
        currentIndex={lightbox.index ?? 0}
        onClose={lightbox.close}
        onNavigate={lightbox.navigate}
        onDownload={() => void lightbox.download()}
      />
    </div>
  )
}
