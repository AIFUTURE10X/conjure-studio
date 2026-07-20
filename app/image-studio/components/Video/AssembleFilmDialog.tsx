"use client"

/**
 * AssembleFilmDialog — pick finished clips (click order = film order;
 * Story Mode shots auto-preselect in shot order), add narration
 * (ElevenLabs/Kling, AI-writable) and mood music, and assemble one film.
 */

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Clapperboard, Film, Loader2, Sparkles } from 'lucide-react'
import { FilmSoundPickers, type NarrationChoice } from './FilmSoundPickers'
import { ELEVENLABS_VOICES } from '../../constants/film-assembly'
import type { VideoJob } from './useVideoGeneration'

interface AssembleFilmDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  jobs: VideoJob[]
  onConfirm: (
    selected: VideoJob[],
    options: {
      narration?: { text: string; engine: 'elevenlabs' | 'kling'; voiceId: string }
      musicStyleId?: string
    },
  ) => Promise<boolean>
}

const SHOT_PATTERN = /^Shot (\d+)\/(\d+) — /

/** Newest completed clip per story shot number, ordered 1..N (needs ≥2 to count as a story). */
function detectStoryShots(jobs: VideoJob[]): VideoJob[] {
  const byShot = new Map<number, VideoJob>()
  for (const job of jobs) {
    const match = job.prompt.match(SHOT_PATTERN)
    if (!match || job.status !== 'completed' || !job.videoUrl) continue
    const shotNumber = Number(match[1])
    const existing = byShot.get(shotNumber)
    if (!existing || job.timestamp > existing.timestamp) byShot.set(shotNumber, job)
  }
  const shots = [...byShot.entries()].sort((a, b) => a[0] - b[0]).map(([, job]) => job)
  return shots.length >= 2 ? shots : []
}

export function AssembleFilmDialog({ isOpen, onOpenChange, jobs, onConfirm }: AssembleFilmDialogProps) {
  const completed = useMemo(
    () => jobs.filter((job) => job.status === 'completed' && job.videoUrl),
    [jobs],
  )
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [narrationChoice, setNarrationChoice] = useState<NarrationChoice>('elevenlabs')
  const [voiceId, setVoiceId] = useState(ELEVENLABS_VOICES[0].id)
  const [narrationText, setNarrationText] = useState('')
  const [musicStyleId, setMusicStyleId] = useState('cinematic')
  const [isWriting, setIsWriting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-preselect the latest story's shots in order when the dialog opens.
  useEffect(() => {
    if (!isOpen) return
    const storyShots = detectStoryShots(jobs)
    setSelectedIds(storyShots.map((job) => job.jobId))
  }, [isOpen, jobs])

  const toggleClip = (jobId: number) => {
    setSelectedIds((prev) => prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId])
  }

  const selectedJobs = selectedIds
    .map((id) => completed.find((job) => job.jobId === id))
    .filter((job): job is VideoJob => Boolean(job))
  const totalSeconds = selectedJobs.reduce((sum, job) => sum + (job.durationSeconds ?? 5), 0)

  const handleWriteNarration = async () => {
    if (selectedJobs.length < 2 || isWriting) return
    setIsWriting(true)
    try {
      const response = await fetch('/api/write-narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clips: selectedJobs.map((job) => job.prompt.slice(0, 1000)),
          targetSeconds: Math.max(4, totalSeconds),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Could not write narration')
      setNarrationText(data.narration as string)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not write narration')
    } finally {
      setIsWriting(false)
    }
  }

  const handleAssemble = async () => {
    if (selectedJobs.length < 2 || isSubmitting) return
    if (narrationChoice !== 'none' && !narrationText.trim()) {
      toast.error('Write (or AI-write) the narration, or switch narration to None')
      return
    }
    setIsSubmitting(true)
    try {
      const ok = await onConfirm(selectedJobs, {
        narration: narrationChoice !== 'none'
          ? { text: narrationText.trim().slice(0, 1500), engine: narrationChoice, voiceId }
          : undefined,
        musicStyleId,
      })
      if (ok) onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 text-zinc-100 max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Film className="w-4 h-4 text-[#dbb56e]" />
            Assemble Film
          </DialogTitle>
        </DialogHeader>

        <div>
          <p className="text-xs text-zinc-400 mb-1.5">
            Clips — click to add in order ({selectedJobs.length} selected · ~{totalSeconds}s film)
          </p>
          <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
            {completed.map((job) => {
              const orderIndex = selectedIds.indexOf(job.jobId)
              return (
                <button
                  key={job.jobId}
                  onClick={() => toggleClip(job.jobId)}
                  className={`w-full flex items-center gap-2 rounded-md border p-1.5 text-left transition-colors ${
                    orderIndex >= 0 ? 'border-[#c99850]/60 bg-[#c99850]/10' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600'
                  }`}
                >
                  <span className={`shrink-0 w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center ${
                    orderIndex >= 0 ? 'bg-[#c99850] text-black' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {orderIndex >= 0 ? orderIndex + 1 : '+'}
                  </span>
                  {job.startImageUrl ? (
                    <img src={job.startImageUrl} alt="" className="w-12 h-8 object-cover rounded shrink-0" />
                  ) : (
                    <span className="w-12 h-8 rounded bg-zinc-800 flex items-center justify-center shrink-0">
                      <Clapperboard className="w-3.5 h-3.5 text-zinc-600" />
                    </span>
                  )}
                  <span className="flex-1 min-w-0 text-[11px] text-zinc-300 truncate">{job.prompt}</span>
                  <span className="shrink-0 text-[10px] text-zinc-600">{job.durationSeconds ?? 5}s</span>
                </button>
              )
            })}
          </div>
        </div>

        <FilmSoundPickers
          narrationChoice={narrationChoice}
          onNarrationChoice={setNarrationChoice}
          voiceId={voiceId}
          onVoiceId={setVoiceId}
          musicStyleId={musicStyleId}
          onMusicStyleId={setMusicStyleId}
        />

        {narrationChoice !== 'none' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-zinc-400">Narration script</p>
              <button
                onClick={handleWriteNarration}
                disabled={selectedJobs.length < 2 || isWriting}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-[#c99850]/10 text-[#dbb56e] hover:bg-[#c99850]/20 transition-colors disabled:opacity-50"
              >
                {isWriting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {isWriting ? 'Writing…' : 'Write with AI'}
              </button>
            </div>
            <Textarea
              value={narrationText}
              onChange={(e) => setNarrationText(e.target.value.slice(0, 1500))}
              placeholder={`What the narrator says over the film (~${Math.round(totalSeconds * 1.8)} words fits ${totalSeconds}s)…`}
              className="min-h-[90px] bg-zinc-950 border-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-600 resize-y"
            />
          </div>
        )}

        <Button
          onClick={handleAssemble}
          disabled={selectedJobs.length < 2 || isSubmitting}
          className="w-full font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850] disabled:opacity-50"
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Preparing narration & music…</>
          ) : (
            <>Assemble film ({selectedJobs.length} clips)</>
          )}
        </Button>
        <p className="text-[10px] text-zinc-600 -mt-2">
          The finished film appears in the Videos list like any clip — download, Enhance, or favorite it. Failed assemblies auto-refund.
        </p>
      </DialogContent>
    </Dialog>
  )
}
