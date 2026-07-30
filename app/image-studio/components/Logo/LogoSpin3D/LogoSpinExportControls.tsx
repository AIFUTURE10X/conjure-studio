"use client"

import { Download, Loader2, TriangleAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  EXPORT_FPS_OPTIONS, EXPORT_MAX_SECONDS, EXPORT_MIN_SECONDS, EXPORT_RESOLUTIONS,
  alphaConflict, clipDurationFor, frameCountFor, type ExportFormat,
} from './spin-export-math'
import type { ExportSupport } from './useSpinExport'

/**
 * Export panel for the 3D spin: format, length, frame rate, resolution.
 *
 * Split from LogoSpin3DModal so both stay under the 300-line limit in
 * app/image-studio/CLAUDE.md.
 */

export interface ExportSettings {
  format: ExportFormat
  durationSeconds: number
  fps: number
  resolutionId: string
}

const FORMATS: Array<{ id: ExportFormat; label: string; hint: string }> = [
  { id: 'mp4', label: 'MP4', hint: 'H.264 — imports into any editor. No transparency.' },
  { id: 'webm', label: 'WebM', hint: 'VP9 — keeps transparency, for overlaying on footage.' },
]

const DURATIONS = [2, 3, 4, 6, 8, 10].filter((s) => s >= EXPORT_MIN_SECONDS && s <= EXPORT_MAX_SECONDS)

interface PillsProps<T extends string | number> {
  options: Array<{ id: T; label: string; hint?: string; disabled?: boolean }>
  value: T
  onChange: (value: T) => void
}

function Pills<T extends string | number>({ options, value, onChange }: PillsProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
      {options.map((option) => {
        const button = (
          <button
            key={String(option.id)}
            onClick={() => onChange(option.id)}
            disabled={option.disabled}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              value === option.id
                ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {option.label}
          </button>
        )
        if (!option.hint) return button
        return (
          <Tooltip key={String(option.id)}>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side="bottom">{option.hint}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

interface LogoSpinExportControlsProps {
  settings: ExportSettings
  onChange: (patch: Partial<ExportSettings>) => void
  /** True when the preview background is transparent. */
  isTransparent: boolean
  support: ExportSupport
  isExporting: boolean
  progress: number
  error: string | null
  onExport: () => void
  onCancel: () => void
  /** False while the SVG is still loading or produced nothing extrudable. */
  canRender: boolean
}

export function LogoSpinExportControls({
  settings, onChange, isTransparent, support, isExporting, progress, error,
  onExport, onCancel, canRender,
}: LogoSpinExportControlsProps) {
  const conflict = alphaConflict(settings.format, isTransparent)
  const formatSupported = settings.format === 'mp4' ? support.mp4 : support.webm
  const nothingSupported = support.probed && !support.mp4 && !support.webm
  const frames = frameCountFor(settings.durationSeconds, settings.fps)
  const clip = clipDurationFor(settings.durationSeconds, settings.fps)

  return (
    <div className="flex flex-col gap-3 border-t border-zinc-800 pt-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-300">Export</span>
        <span className="text-[11px] text-zinc-500">{frames} frames · {clip.toFixed(1)}s</span>
      </div>

      <Pills
        options={FORMATS.map((format) => ({
          ...format,
          disabled: support.probed && !(format.id === 'mp4' ? support.mp4 : support.webm),
        }))}
        value={settings.format}
        onChange={(format) => onChange({ format })}
      />

      <Pills
        options={DURATIONS.map((seconds) => ({ id: seconds, label: `${seconds}s` }))}
        value={settings.durationSeconds}
        onChange={(durationSeconds) => onChange({ durationSeconds })}
      />

      <Pills
        options={EXPORT_FPS_OPTIONS.map((fps) => ({ id: fps, label: `${fps}fps` }))}
        value={settings.fps}
        onChange={(fps) => onChange({ fps })}
      />

      <Pills
        options={EXPORT_RESOLUTIONS.map((resolution) => ({
          id: resolution.id,
          label: resolution.label,
          hint: `${resolution.width}×${resolution.height}`,
        }))}
        value={settings.resolutionId}
        onChange={(resolutionId) => onChange({ resolutionId })}
      />

      {conflict && (
        <p className="flex items-start gap-1.5 text-[11px] text-amber-400">
          <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
          MP4 cannot carry transparency. Pick WebM, or choose a solid background — otherwise the
          transparent areas would export black.
        </p>
      )}

      {nothingSupported && (
        <p className="flex items-start gap-1.5 text-[11px] text-red-400">
          <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
          This browser cannot encode video (no WebCodecs support). Try a recent Chrome, Edge,
          Firefox or Safari.
        </p>
      )}

      {support.probed && !formatSupported && !nothingSupported && (
        <p className="flex items-start gap-1.5 text-[11px] text-amber-400">
          <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
          This browser cannot encode {settings.format.toUpperCase()}. The other format is available.
        </p>
      )}

      {error && !isExporting && <p className="text-[11px] text-red-400">{error}</p>}

      {isExporting ? (
        <div className="flex flex-col gap-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-linear-to-r from-[#c99850] to-[#dbb56e] transition-[width] duration-150"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-zinc-400">
              Encoding {Math.round(progress * 100)}%
            </span>
            <Button
              onClick={onCancel}
              size="sm"
              variant="ghost"
              className="h-7 border border-zinc-800 text-xs text-zinc-300 hover:text-white"
            >
              <X className="mr-1 h-3 w-3" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={onExport}
          disabled={!canRender || conflict || !formatSupported}
          size="sm"
          className="h-8 w-full border border-[#c99850]/30 bg-linear-to-r from-[#c99850]/20 to-[#dbb56e]/20 text-xs text-[#dbb56e] hover:from-[#c99850]/30 hover:to-[#dbb56e]/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {support.probed ? <Download className="mr-1.5 h-3 w-3" /> : <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
          Export {settings.format.toUpperCase()}
        </Button>
      )}
    </div>
  )
}
