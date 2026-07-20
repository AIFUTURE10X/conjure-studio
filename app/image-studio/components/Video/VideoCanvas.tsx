"use client"

/**
 * VideoCanvas
 *
 * Center canvas for video mode: prompt, model/clip settings, frame-pair
 * slots (fed by the image studio's Animate / End Frame actions), and the
 * job list. Stays mounted-hidden in CanvasPanel so pending jobs keep
 * polling while the user works in other modes.
 */

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Clapperboard, Loader2 } from 'lucide-react'
import { VideoSettings, type VideoSettingsValue } from './VideoSettings'
import { VideoResultCard } from './VideoResultCard'
import { useVideoGeneration } from './useVideoGeneration'
import { useStudioCore } from '../../context/useStudio'

const DEFAULT_SETTINGS: VideoSettingsValue = {
  model: 'seedance-fast',
  duration: 5,
  resolution: '1080p',
  aspectRatio: 'auto',
  generateAudio: false,
}

export function VideoCanvas() {
  const { state } = useStudioCore()
  const { jobs, isSubmitting, historyLoaded, submitVideo } = useVideoGeneration()
  const [prompt, setPrompt] = useState('')
  const [settings, setSettings] = useState<VideoSettingsValue>(DEFAULT_SETTINGS)

  const startFrameUrl = state.videoStartFrame
  const endFrameUrl = state.videoEndFrame
  const canGenerate = prompt.trim().length > 0 && !isSubmitting

  const handleGenerate = async () => {
    if (!canGenerate) return
    await submitVideo({
      prompt: prompt.trim(),
      model: settings.model,
      duration: settings.duration,
      resolution: settings.resolution,
      aspectRatio: settings.aspectRatio,
      generateAudio: settings.generateAudio,
      startFrameUrl,
      endFrameUrl: startFrameUrl ? endFrameUrl : null,
    })
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      <Card className="bg-zinc-900 border-zinc-800 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Clapperboard className="w-4 h-4 text-[#dbb56e]" />
          <h3 className="text-sm font-bold text-white">Video Generator</h3>
        </div>

        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={startFrameUrl
            ? 'Describe the motion — e.g. slow camera push-in while the logo shimmers…'
            : 'Describe the video you want to generate…'}
          className="min-h-[70px] bg-zinc-950 border-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-600 resize-y"
        />

        <VideoSettings
          value={settings}
          onChange={setSettings}
          startFrameUrl={startFrameUrl}
          endFrameUrl={endFrameUrl}
          onClearStartFrame={() => { state.setVideoStartFrame(null); state.setVideoEndFrame(null) }}
          onClearEndFrame={() => state.setVideoEndFrame(null)}
        />

        <Button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850] disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Starting…
            </>
          ) : (
            'Generate Video'
          )}
        </Button>
      </Card>

      {jobs.length === 0 && historyLoaded && (
        <div className="min-h-[20vh] flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Clapperboard className="w-6 h-6 text-zinc-600" />
          </div>
          <p className="text-sm text-zinc-400">Generated videos appear here</p>
          <p className="text-xs text-zinc-600 max-w-sm leading-5">
            Tip: generate an image first, then use its “Animate” button to use it
            as the start frame — or “End Frame” to build a start/end pair for a
            controlled transition.
          </p>
        </div>
      )}

      {jobs.length > 0 && (
        <Card className="bg-zinc-900 border-[#c99850]/30 p-4">
          <h3 className="text-lg font-bold text-white mb-4">Videos ({jobs.length})</h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <VideoResultCard key={job.jobId} job={job} />
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
