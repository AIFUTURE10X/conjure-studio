"use client"

/**
 * BrollTranscribePanel — Phase-4 auto-placement. Upload the voiceover audio,
 * fal Whisper times it word-by-word, each beat's sourcePhrase is matched to a
 * real timecode, and the plan exports as an SRT marker track or CMX3600 EDL
 * that places every clip. Sequential export lays clips back-to-back when
 * there's no transcript.
 */

import { useRef } from 'react'
import { AudioLines, Download, Loader2, X } from 'lucide-react'
import type { useBrollTranscribe } from './useBrollTranscribe'
import { buildBrollManifest, manifestToEdl, manifestToSrt, downloadTextFile, EDL_FPS } from './broll-manifest'
import type { BrollBeat } from './useBrollPlan'
import type { VideoJob } from '../useVideoGeneration'

interface BrollTranscribePanelProps {
  beats: BrollBeat[]
  jobs: VideoJob[]
  /** Lifted into BrollCard so a paid transcript survives collapsing the card. */
  transcription: ReturnType<typeof useBrollTranscribe>
}

export function BrollTranscribePanel({ beats, jobs, transcription }: BrollTranscribePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { words, isTranscribing, transcribe, clearTranscript, timecodes, sequential, matchSummary } = transcription

  const handleExport = (format: 'srt' | 'edl', useSequential = false) => {
    const rows = buildBrollManifest(beats, jobs, useSequential ? sequential() : timecodes)
    const date = new Date().toISOString().slice(0, 10)
    if (format === 'srt') {
      downloadTextFile(`broll-${date}.srt`, 'text/plain', manifestToSrt(rows))
    } else {
      downloadTextFile(`broll-${EDL_FPS}fps-${date}.edl`, 'text/plain', manifestToEdl(rows))
    }
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <AudioLines className="w-3.5 h-3.5 text-[#dbb56e] shrink-0" />
        <p className="text-[11px] font-medium text-zinc-300 flex-1">Auto-placement</p>
        {words === null ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isTranscribing}
            title="Upload your voiceover audio (max 4MB — export the audio track from a long video first). Costs 2 credits."
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-[#c99850]/10 text-[#dbb56e] hover:bg-[#c99850]/20 disabled:opacity-50"
          >
            {isTranscribing ? (
              <><Loader2 className="w-3 h-3 animate-spin" />Timing voiceover…</>
            ) : (
              <><AudioLines className="w-3 h-3" />Upload voiceover · 2 credits</>
            )}
          </button>
        ) : (
          <>
            {matchSummary && (
              <span className="text-[10px] text-zinc-500">
                {matchSummary.exact} matched
                {matchSummary.fuzzy > 0 && <> · <span className="text-amber-400">{matchSummary.fuzzy} fuzzy</span></>}
                {matchSummary.unmatched > 0 && <> · <span className="text-red-400">{matchSummary.unmatched} unmatched</span></>}
              </span>
            )}
            <button
              onClick={clearTranscript}
              title="Discard this transcript timing"
              className="p-1 rounded-md text-zinc-600 hover:text-red-400 shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,video/mp4,video/webm"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) transcribe(file)
            e.target.value = ''
          }}
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {words !== null ? (
          <>
            {(['srt', 'edl'] as const).map((format) => (
              <button
                key={format}
                onClick={() => handleExport(format)}
                title={format === 'srt'
                  ? 'SRT marker track — one cue per placed beat at its real voiceover timecode (a placement guide, not captions)'
                  : `CMX3600 EDL — places each finished clip on V1 at its timecode. Import into a ${EDL_FPS}fps non-drop sequence; unmatched or unfinished beats are skipped.`}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
              >
                <Download className="w-3 h-3" />
                {format.toUpperCase()}
              </button>
            ))}
            <p className="text-[10px] text-zinc-600">
              EDL assumes a {EDL_FPS}fps non-drop sequence; unmatched beats export in JSON/CSV only.
            </p>
          </>
        ) : (
          <>
            <button
              onClick={() => handleExport('srt', true)}
              title="No transcript: lay beats back-to-back from 0:00 as an SRT marker track"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
            >
              <Download className="w-3 h-3" />
              Sequential SRT
            </button>
            <p className="text-[10px] text-zinc-600">
              Upload your voiceover to place beats at their real timecodes — or export a back-to-back SRT without it.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
