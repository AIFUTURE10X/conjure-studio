"use client"

/**
 * VideoSettings
 *
 * Model picker + clip controls for the video generator. Options are driven
 * by each model's capability flags from lib/video/providers, so unsupported
 * controls (audio, end frame, resolutions) disable themselves per model.
 */

import { Film, Volume2, VolumeX, X } from 'lucide-react'
import { VIDEO_MODELS, VIDEO_MODEL_IDS, type VideoModelId, type VideoResolution } from '@/lib/video/providers'
import { videoGenerationCost } from '@/lib/credits/cost-map'

export interface VideoSettingsValue {
  model: VideoModelId
  duration: number
  resolution: VideoResolution
  aspectRatio: string
  generateAudio: boolean
}

interface VideoSettingsProps {
  value: VideoSettingsValue
  onChange: (value: VideoSettingsValue) => void
  startFrameUrl: string | null
  endFrameUrl: string | null
  onClearStartFrame: () => void
  onClearEndFrame: () => void
}

const ASPECT_RATIOS = ['auto', '16:9', '9:16', '1:1', '4:3', '3:4', '21:9']

function FrameSlot({ label, url, onClear }: { label: string; url: string | null; onClear: () => void }) {
  return (
    <div className="flex-1 min-w-[120px]">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      {url ? (
        <div className="relative rounded-md overflow-hidden border border-zinc-700 group">
          <img src={url} alt={label} className="w-full h-20 object-cover" />
          <button
            onClick={onClear}
            title={`Remove ${label.toLowerCase()}`}
            className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-zinc-300 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="h-20 rounded-md border border-dashed border-zinc-700 flex items-center justify-center">
          <p className="text-[10px] text-zinc-600 text-center px-2 leading-4">
            Use “Animate” or “End Frame” on a generated image
          </p>
        </div>
      )}
    </div>
  )
}

export function VideoSettings({
  value, onChange, startFrameUrl, endFrameUrl, onClearStartFrame, onClearEndFrame,
}: VideoSettingsProps) {
  const model = VIDEO_MODELS[value.model]
  const caps = model.capabilities

  const set = (patch: Partial<VideoSettingsValue>) => {
    const next = { ...value, ...patch }
    const nextCaps = VIDEO_MODELS[next.model].capabilities
    // Snap settings the newly-picked model doesn't support.
    if (!nextCaps.resolutions.includes(next.resolution)) {
      next.resolution = nextCaps.resolutions[nextCaps.resolutions.length - 1]
    }
    if (!nextCaps.durations.includes(next.duration)) {
      next.duration = nextCaps.durations.reduce((best, option) =>
        Math.abs(option - next.duration) < Math.abs(best - next.duration) ? option : best)
    }
    if (!nextCaps.audio) next.generateAudio = false
    onChange(next)
  }

  const credits = videoGenerationCost(value.model, value.duration, value.resolution, value.generateAudio)

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-zinc-400 mb-2">Model</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {VIDEO_MODEL_IDS.map((id) => {
            const option = VIDEO_MODELS[id]
            const isActive = value.model === id
            return (
              <button
                key={id}
                onClick={() => set({ model: id })}
                title={option.description}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  isActive
                    ? 'border-[#c99850] bg-[#c99850]/10'
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-medium ${isActive ? 'text-[#f0d49b]' : 'text-zinc-200'}`}>
                    {option.label}
                  </span>
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                    option.tier === 'draft' ? 'bg-sky-900/60 text-sky-300' : 'bg-[#c99850]/20 text-[#dbb56e]'
                  }`}>
                    {option.tier === 'draft' ? 'DRAFT' : 'FINAL'}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 leading-4">{option.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <p className="text-xs text-zinc-400 mb-1">Duration</p>
          <div className="flex flex-wrap gap-1">
            {caps.durations.map((seconds) => (
              <button
                key={seconds}
                onClick={() => set({ duration: seconds })}
                className={`px-2 h-7 rounded-md text-xs font-bold transition-colors ${
                  value.duration === seconds
                    ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                }`}
              >
                {seconds}s
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-zinc-400 mb-1">Resolution</p>
          <div className="flex flex-wrap gap-1">
            {caps.resolutions.map((resolution) => (
              <button
                key={resolution}
                onClick={() => set({ resolution })}
                className={`px-2 h-7 rounded-md text-xs font-bold uppercase transition-colors ${
                  value.resolution === resolution
                    ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                }`}
              >
                {resolution}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-zinc-400 mb-1">Aspect</p>
          <div className="flex flex-wrap gap-1">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio}
                onClick={() => set({ aspectRatio: ratio })}
                className={`px-2 h-7 rounded-md text-xs font-bold transition-colors ${
                  value.aspectRatio === ratio
                    ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-zinc-400 mb-1">Audio</p>
          <button
            onClick={() => set({ generateAudio: !value.generateAudio })}
            disabled={!caps.audio}
            title={caps.audio ? 'Generate synchronized audio' : `${model.label} does not support audio`}
            className={`flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              value.generateAudio && caps.audio
                ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            {value.generateAudio && caps.audio ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
            {value.generateAudio && caps.audio ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <FrameSlot label="Start frame" url={startFrameUrl} onClear={onClearStartFrame} />
        <FrameSlot
          label={caps.endFrame ? 'End frame' : `End frame (not supported by ${model.label})`}
          url={caps.endFrame ? endFrameUrl : null}
          onClear={onClearEndFrame}
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Film className="w-3.5 h-3.5 text-[#dbb56e]" />
        <span>
          {credits} credit{credits === 1 ? '' : 's'} per clip · {model.label} · {value.duration}s · {value.resolution.toUpperCase()}
        </span>
      </div>
    </div>
  )
}
