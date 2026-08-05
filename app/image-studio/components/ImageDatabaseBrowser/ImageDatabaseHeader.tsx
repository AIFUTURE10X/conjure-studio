import { Database, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CreationLibraryTabs } from '../CreationLibraryTabs'
import { NeonStatusBadge } from '../NeonStatusBadge'
import type { CreationLibraryTab } from '../../hooks/useImageStudioState'

interface ImageDatabaseHeaderProps {
  activeMedia: Exclude<CreationLibraryTab, 'videos'>
  count: number
  isLoading: boolean
  onSelectMedia: (tab: CreationLibraryTab) => void
  onRefresh: () => void
  onClose: () => void
}

export function ImageDatabaseHeader({
  activeMedia,
  count,
  isLoading,
  onSelectMedia,
  onRefresh,
  onClose,
}: ImageDatabaseHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-[#c99850] to-[#dbb56e]">
          <Database className="h-5 w-5 text-black" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Creation Library</h2>
          <p className="text-xs text-zinc-400">
            {isLoading ? `Reading Neon ${activeMedia} records…` : `${count} ${activeMedia} · restore to your working library`}
          </p>
        </div>
        <NeonStatusBadge endpoint="/api/history/test-connection" />
        <CreationLibraryTabs activeTab={activeMedia} onSelect={onSelectMedia} />
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="text-[#c99850] hover:bg-[#c99850]/10 hover:text-[#dbb56e]"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Close Creation Library</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
