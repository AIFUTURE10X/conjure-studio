"use client"

/**
 * StoryModeCard — idea → AI shot plan → start frames → queued clips.
 * Collapsible card at the top of the video canvas; clips land in the
 * normal jobs list below, labeled "Shot N/M".
 */

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { BookText, ChevronDown, ChevronUp, Clapperboard, ImageIcon, Loader2, Sparkles, X } from 'lucide-react'
import { ShotRow } from './ShotRow'
import { useStoryMode } from './useStoryMode'
import type { SubmitVideoOptions } from '../useVideoGeneration'
import type { VideoSettingsValue } from '../../../constants/video-settings-defaults'
import type { GenerationModel } from '../../../hooks/useImageGeneration'

interface StoryModeCardProps {
  settings: VideoSettingsValue
  aspectRatio: string
  selectedModel: GenerationModel
  submitVideo: (options: SubmitVideoOptions) => Promise<boolean>
}

export function StoryModeCard({ settings, aspectRatio, selectedModel, submitVideo }: StoryModeCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [idea, setIdea] = useState('')
  const [shotCount, setShotCount] = useState(4)
  const {
    storyTitle, shots, isWritingScript, isGeneratingFrames, isAnimating,
    writeScript, updateShot, removeShot, generateFrameFor, generateAllFrames, animateAll, clearStory,
    refineWithHelper,
  } = useStoryMode({ settings, aspectRatio, selectedModel, submitVideo })

  const framesDone = shots.filter((shot) => shot.frameStatus === 'done').length
  const framesPending = shots.some((shot) => shot.frameStatus === 'none' || shot.frameStatus === 'failed')
  const readyToAnimate = shots.filter((shot) => shot.frameUrl && !shot.videoQueued).length

  return (
    <Card className="bg-zinc-900 border-zinc-800 p-4 space-y-3">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-2 text-left">
        <BookText className="w-4 h-4 text-[#dbb56e]" />
        <h3 className="text-sm font-bold text-white">Story Mode</h3>
        <span className="text-[10px] text-zinc-500">idea → script → shots → clips</span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-zinc-500 ml-auto" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-500 ml-auto" />
        )}
      </button>

      {expanded && (
        <>
          {shots.length === 0 ? (
            <div className="space-y-2">
              <Textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Describe your story idea — or paste a full script. e.g. “A lone lighthouse keeper discovers a glowing bottle washed up in a storm…”"
                className="min-h-[70px] bg-zinc-950 border-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-600 resize-y"
              />
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-zinc-500">Shots:</span>
                  {[3, 4, 5, 6].map((count) => (
                    <button
                      key={count}
                      onClick={() => setShotCount(count)}
                      className={`w-7 h-7 rounded-md text-xs font-bold transition-colors ${
                        shotCount === count
                          ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={() => writeScript(idea.trim(), shotCount)}
                  disabled={idea.trim().length < 3 || isWritingScript}
                  size="sm"
                  className="ml-auto font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850] disabled:opacity-50"
                >
                  {isWritingScript ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Writing script…</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5 mr-1.5" />Write script</>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-[#f0d49b] flex-1 truncate">“{storyTitle}”</p>
                <p className="text-[10px] text-zinc-500 shrink-0">{framesDone}/{shots.length} frames</p>
                <button
                  onClick={refineWithHelper}
                  title="Send this plan to the AI helper for conversational revision — chat, then Apply the revised plan"
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-[#c99850]/10 text-[#dbb56e] hover:bg-[#c99850]/20 transition-colors shrink-0"
                >
                  <Sparkles className="w-3 h-3" />
                  Refine with AI
                </button>
                <button
                  onClick={clearStory}
                  title="Discard this story plan"
                  className="p-1 rounded-md text-zinc-600 hover:text-red-400 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-[45vh] overflow-y-auto pr-1">
                {shots.map((shot) => (
                  <ShotRow
                    key={shot.id}
                    shot={shot}
                    totalShots={shots.length}
                    onUpdate={updateShot}
                    onRemove={removeShot}
                    onRegenerateFrame={generateFrameFor}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={generateAllFrames}
                  disabled={!framesPending || isGeneratingFrames}
                  size="sm"
                  className="flex-1 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
                  title="Generate the start frame image for every shot that doesn't have one"
                >
                  {isGeneratingFrames ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Generating frames…</>
                  ) : (
                    <><ImageIcon className="w-3.5 h-3.5 mr-1.5" />Generate frames</>
                  )}
                </Button>
                <Button
                  onClick={animateAll}
                  disabled={readyToAnimate === 0 || isAnimating}
                  size="sm"
                  className="flex-1 font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850] disabled:opacity-50"
                  title={`Queue a video clip for every shot with a frame (uses the model selected below: ${settings.model})`}
                >
                  {isAnimating ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Queueing…</>
                  ) : (
                    <><Clapperboard className="w-3.5 h-3.5 mr-1.5" />Animate all ({readyToAnimate})</>
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-zinc-600 leading-4">
                Clips use the model, resolution, and audio settings from the Video Generator below.
                Finished shots appear in the Videos list — use Extend to chain them longer.
              </p>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
