"use client"

/**
 * BrollCard — Script → B-roll. Paste a voiceover transcript, the AI finds the
 * lines worth illustrating, and each becomes a silent cutaway clip queued
 * through the normal video pipeline. Sibling of Story Mode at the top of the
 * video canvas; clips land in the Videos list below.
 */

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, ChevronUp, Clapperboard, Download, Film, Loader2, Sparkles, X } from 'lucide-react'
import { BeatRow } from './BeatRow'
import { useBrollPlan, BROLL_MODEL } from './useBrollPlan'
import { buildBrollManifest, manifestToCsv, manifestToJson, downloadTextFile } from './broll-manifest'
import type { SubmitVideoOptions, VideoJob } from '../useVideoGeneration'
import type { VideoSettingsValue } from '../../../constants/video-settings-defaults'
import { videoGenerationCost } from '@/lib/credits/cost-map'

interface BrollCardProps {
  settings: VideoSettingsValue
  aspectRatio: string
  submitVideo: (options: SubmitVideoOptions) => Promise<boolean>
  /** All video jobs — the manifest export joins beats to their finished clips. */
  jobs: VideoJob[]
}

const MOMENT_COUNTS = [5, 8, 12, 16]

export function BrollCard({ settings, aspectRatio, submitVideo, jobs }: BrollCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [beatCount, setBeatCount] = useState(8)
  const {
    beats, isPlanning, isGenerating,
    planBroll, updateBeat, removeBeat, clearPlan, generateAllClips,
  } = useBrollPlan({ settings, aspectRatio, submitVideo })

  const handleExportManifest = (format: 'json' | 'csv') => {
    const rows = buildBrollManifest(beats, jobs)
    const date = new Date().toISOString().slice(0, 10)
    if (format === 'json') {
      const resolution = settings.resolution === '4k' ? '1080p' : settings.resolution
      downloadTextFile(`broll-manifest-${date}.json`, 'application/json', manifestToJson(rows, { resolution, aspectRatio }))
    } else {
      downloadTextFile(`broll-manifest-${date}.csv`, 'text/csv', manifestToCsv(rows))
    }
  }

  const pending = beats.filter((beat) => !beat.videoQueued)
  // Live estimate for the un-queued beats — mirrors what the hook submits
  // (Seedance Fast, silent, 1080p cap) so the button number matches the debit.
  const estResolution = settings.resolution === '4k' ? '1080p' : settings.resolution
  const estCredits = pending.reduce(
    (sum, beat) => sum + videoGenerationCost(BROLL_MODEL, beat.durationSeconds, estResolution, false),
    0,
  )

  return (
    <Card className="bg-zinc-900 border-zinc-800 p-4 space-y-3">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-2 text-left">
        <Film className="w-4 h-4 text-[#dbb56e]" />
        <h3 className="text-sm font-bold text-white">Script → B-roll</h3>
        <span className="text-[10px] text-zinc-500">voiceover → cutaway clips</span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-zinc-500 ml-auto" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-500 ml-auto" />
        )}
      </button>

      {expanded && (
        <>
          {beats.length === 0 ? (
            <div className="space-y-2">
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Paste your voiceover script or transcript. The AI finds the lines worth illustrating and writes a silent B-roll clip for each — to cut over your talking head in your editor."
                className="min-h-[90px] bg-zinc-950 border-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-600 resize-y"
              />
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-zinc-500">Moments:</span>
                  {MOMENT_COUNTS.map((count) => (
                    <button
                      key={count}
                      onClick={() => setBeatCount(count)}
                      className={`w-8 h-7 rounded-md text-xs font-bold transition-colors ${
                        beatCount === count
                          ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={() => planBroll(transcript.trim(), beatCount)}
                  disabled={transcript.trim().length < 20 || isPlanning}
                  size="sm"
                  className="ml-auto font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850] disabled:opacity-50"
                >
                  {isPlanning ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Finding moments…</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5 mr-1.5" />Find B-roll moments</>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-[#f0d49b] flex-1">
                  {beats.length} B-roll moment{beats.length === 1 ? '' : 's'}
                </p>
                {(['json', 'csv'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => handleExportManifest(format)}
                    title={`Download the plan as ${format.toUpperCase()} — each beat with the transcript line it covers and its clip URL, for handoff to your editor`}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 shrink-0"
                  >
                    <Download className="w-3 h-3" />
                    {format.toUpperCase()}
                  </button>
                ))}
                <button
                  onClick={clearPlan}
                  title="Discard this B-roll plan"
                  className="p-1 rounded-md text-zinc-600 hover:text-red-400 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-[45vh] overflow-y-auto pr-1">
                {beats.map((beat) => (
                  <BeatRow
                    key={beat.id}
                    beat={beat}
                    totalBeats={beats.length}
                    onUpdate={updateBeat}
                    onRemove={removeBeat}
                  />
                ))}
              </div>

              <Button
                onClick={generateAllClips}
                disabled={pending.length === 0 || isGenerating}
                size="sm"
                className="w-full font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850] disabled:opacity-50"
                title="Queue a silent Seedance Fast clip for every beat that isn't queued yet"
              >
                {isGenerating ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Queueing…</>
                ) : (
                  <><Clapperboard className="w-3.5 h-3.5 mr-1.5" />Generate {pending.length} clip{pending.length === 1 ? '' : 's'} · ~{estCredits} credits</>
                )}
              </Button>
              <p className="text-[10px] text-zinc-600 leading-4">
                Clips render on Seedance Fast (silent, {estResolution}) at your current aspect ratio and land in the Videos
                list below. B-roll is meant to be cut over your voiceover in your editor.
              </p>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
