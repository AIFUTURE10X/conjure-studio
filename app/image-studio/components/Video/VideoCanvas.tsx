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
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { BookmarkPlus, BookOpen, Clapperboard, Loader2, Sparkles } from 'lucide-react'
import { VideoSettings } from './VideoSettings'
import { PromptLibraryModal } from '../PromptLibrary/PromptLibraryModal'
import { CameraMotionChips } from './CameraMotionChips'
import { VideoResultCard } from './VideoResultCard'
import { useVideoGeneration } from './useVideoGeneration'
import { useMotionSuggestion } from './useMotionSuggestion'
import { EndFrameDialog } from '../Studio/EndFrameDialog'
import { useStudioCore } from '../../context/useStudio'
import { useImageGenerationEngine } from '../../context/ImageGenerationProvider'

export function VideoCanvas() {
  const { state, savePreset } = useStudioCore()
  const { createEndFrame } = useImageGenerationEngine()
  const { jobs, isSubmitting, historyLoaded, submitVideo, extendVideo, toggleFavorite } = useVideoGeneration()
  const prompt = state.videoPrompt
  const setPrompt = state.setVideoPrompt
  const settings = state.videoSettings
  const setSettings = state.setVideoSettings
  const [showEndFrameDialog, setShowEndFrameDialog] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)

  const handleSavePreset = () => {
    savePreset(
      `Video · ${settings.model} · ${settings.duration}s`,
      {
        mainPrompt: prompt,
        negativePrompt: '',
        aspectRatio: settings.aspectRatio,
        selectedStylePreset: '',
        selectedCameraAngle: '',
        selectedCameraLens: '',
        styleStrength: 'moderate',
        imageSize: '1K',
        selectedModel: '',
        video: settings,
      },
      'video',
    )
    toast.success('Video preset saved — rename it in Settings → Presets')
  }

  const startFrameUrl = state.videoStartFrame
  const endFrameUrl = state.videoEndFrame
  const { isSuggesting, suggestNow } = useMotionSuggestion({ startFrameUrl, prompt, setPrompt })
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
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setShowLibrary(true)}
              title="Prompt Library — reuse, star, and search every prompt you've generated with"
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <BookOpen className="w-3 h-3" />
              Library
            </button>
            <button
              onClick={handleSavePreset}
              title="Save the current prompt + clip settings as a preset (Settings → Presets)"
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <BookmarkPlus className="w-3 h-3" />
              Save preset
            </button>
          </div>
        </div>

        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={isSuggesting
            ? 'Writing a motion prompt from your start frame…'
            : startFrameUrl
              ? 'Describe the motion — e.g. slow camera push-in while the logo shimmers…'
              : 'Describe the video you want to generate…'}
          className="min-h-[70px] bg-zinc-950 border-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-600 resize-y"
        />

        {startFrameUrl && (
          <button
            onClick={suggestNow}
            disabled={isSuggesting}
            title="AI looks at your start frame and writes the motion prompt for you (replaces the current prompt)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#c99850]/10 text-[#dbb56e] hover:bg-[#c99850]/20 transition-colors disabled:opacity-50"
          >
            {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {isSuggesting ? 'Writing motion prompt…' : 'Suggest motion from start frame'}
          </button>
        )}

        <CameraMotionChips prompt={prompt} onPromptChange={setPrompt} />

        <VideoSettings
          value={settings}
          onChange={setSettings}
          startFrameUrl={startFrameUrl}
          endFrameUrl={endFrameUrl}
          onClearStartFrame={() => state.setVideoStartFrame(null)}
          onClearEndFrame={() => state.setVideoEndFrame(null)}
          onUploadStartFrame={(dataUrl) => state.setVideoStartFrame(dataUrl)}
          onUploadEndFrame={(dataUrl) => state.setVideoEndFrame(dataUrl)}
          onGenerateEndFrame={() => setShowEndFrameDialog(true)}
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
            Tip: generate images first, then press “Animate” on your opening
            image and “End Frame” on your closing image — the video will move
            from one to the other.
          </p>
        </div>
      )}

      <PromptLibraryModal
        open={showLibrary}
        onOpenChange={setShowLibrary}
        defaultFilter="video"
        onUsePrompt={(libraryPrompt) => setPrompt(libraryPrompt)}
      />

      <EndFrameDialog
        isOpen={showEndFrameDialog}
        onOpenChange={setShowEndFrameDialog}
        sourcePreview={startFrameUrl ?? undefined}
        onConfirm={async (endPrompt) => {
          if (startFrameUrl) await createEndFrame(startFrameUrl, endPrompt)
        }}
      />

      {jobs.length > 0 && (
        <Card className="bg-zinc-900 border-[#c99850]/30 p-4">
          <h3 className="text-lg font-bold text-white mb-4">Videos ({jobs.length})</h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <VideoResultCard
                key={job.jobId}
                job={job}
                onExtend={async (source, extensionPrompt, lastFrame) => extendVideo(source, extensionPrompt, lastFrame)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
