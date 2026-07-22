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
import { ChevronDown, ChevronUp, Clapperboard, Download, Film, ImageIcon, Loader2, Sparkles, X } from 'lucide-react'
import { BeatRow } from './BeatRow'
import { BrollTranscribePanel } from './BrollTranscribePanel'
import { useBrollPlan, BROLL_MODEL } from './useBrollPlan'
import { useBrollTranscribe } from './useBrollTranscribe'
import { buildBrollManifest, manifestToCsv, manifestToJson, downloadTextFile } from './broll-manifest'
import type { SubmitVideoOptions, VideoJob } from '../useVideoGeneration'
import type { VideoSettingsValue } from '../../../constants/video-settings-defaults'
import type { GenerationModel } from '../../../hooks/useImageGeneration'
import { videoGenerationCost, imageGenerationCost } from '@/lib/credits/cost-map'

interface BrollCardProps {
  settings: VideoSettingsValue
  aspectRatio: string
  /** Image model for hero-beat keyframes (mirrors Story Mode). */
  selectedModel: GenerationModel
  submitVideo: (options: SubmitVideoOptions) => Promise<boolean>
  /** All video jobs — the manifest export joins beats to their finished clips. */
  jobs: VideoJob[]
}

const MOMENT_COUNTS = [5, 8, 12, 16]

export function BrollCard({ settings, aspectRatio, selectedModel, submitVideo, jobs }: BrollCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [beatCount, setBeatCount] = useState(8)
  const {
    beats, isPlanning, isFraming, isGenerating,
    planBroll, updateBeat, setBeatMode, removeBeat, clearPlan,
    generateFrameFor, generateAllFrames, generateAllClips,
  } = useBrollPlan({ settings, aspectRatio, selectedModel, submitVideo })
  // Transcription state lives here, above the collapse toggle, so a paid
  // transcript isn't discarded when the card is collapsed.
  const transcription = useBrollTranscribe(beats)

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
  // Hero beats need a keyframe before they can be animated; block "Generate clips"
  // until every hero beat has one so the frames-first ordering is enforced (a
  // still-generating frame counts here so it also blocks clips).
  const heroNeedingFrames = beats.filter((beat) => beat.mode === 'hero' && beat.frameStatus !== 'done')
  // What the "Generate frames" button acts on — excludes in-flight frames so a
  // second click can't re-fire (and double-charge) a beat already generating.
  const heroFramesToGenerate = beats.filter((beat) =>
    beat.mode === 'hero' && (beat.frameStatus === 'none' || beat.frameStatus === 'failed'))
  const frameCredits = heroFramesToGenerate.length * imageGenerationCost(selectedModel, '1K', 1)
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
                  onClick={() => { clearPlan(); transcription.clearTranscript() }}
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
                    onSetMode={setBeatMode}
                    onGenerateFrame={generateFrameFor}
                    onRemove={removeBeat}
                  />
                ))}
              </div>

              {heroFramesToGenerate.length > 0 && (
                <Button
                  onClick={generateAllFrames}
                  disabled={isFraming}
                  size="sm"
                  className="w-full bg-zinc-800 text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
                  title="Generate the keyframe image for every hero beat that doesn't have one yet"
                >
                  {isFraming ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Generating frames…</>
                  ) : (
                    <><ImageIcon className="w-3.5 h-3.5 mr-1.5" />Generate {heroFramesToGenerate.length} hero frame{heroFramesToGenerate.length === 1 ? '' : 's'} · ~{frameCredits} credits</>
                  )}
                </Button>
              )}

              <Button
                onClick={generateAllClips}
                disabled={pending.length === 0 || isGenerating || heroNeedingFrames.length > 0}
                size="sm"
                className="w-full font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850] disabled:opacity-50"
                title={heroNeedingFrames.length > 0
                  ? 'Generate the hero keyframes first'
                  : "Queue a silent Seedance Fast clip for every beat that isn't queued yet"}
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

              <BrollTranscribePanel beats={beats} jobs={jobs} transcription={transcription} />
            </div>
          )}
        </>
      )}
    </Card>
  )
}
