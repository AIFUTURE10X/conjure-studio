"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { VIDEO_MODELS, VIDEO_MODEL_IDS, type VideoModelId, type VideoResolution } from '@/lib/video/providers'
import { DEFAULT_VIDEO_SETTINGS } from '../../../constants/video-settings-defaults'
import type { GeneratePreset } from '../../../constants/settings-defaults'

interface TemplateEditFormProps {
  preset: GeneratePreset
  onSave: (id: string, updates: { name: string; params: GeneratePreset['params'] }) => void
  onCancel: () => void
}

const ASPECT_OPTIONS = ['auto', '16:9', '9:16', '1:1', '4:3', '3:4', '21:9']

const inputClass = 'w-full rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200 focus:border-[#c99850]/50 focus:outline-none'

/** Inline editor for a video template: name, category, prompt, and clip settings. */
export function TemplateEditForm({ preset, onSave, onCancel }: TemplateEditFormProps) {
  const [name, setName] = useState(preset.name)
  const [category, setCategory] = useState(preset.params.category ?? '')
  const [prompt, setPrompt] = useState(preset.params.mainPrompt)
  const [video, setVideo] = useState(preset.params.video ?? DEFAULT_VIDEO_SETTINGS)

  const caps = VIDEO_MODELS[video.model]?.capabilities

  const changeModel = (model: VideoModelId) => {
    const next = VIDEO_MODELS[model].capabilities
    setVideo({
      ...video,
      model,
      duration: next.durations.includes(video.duration) ? video.duration : next.durations[0],
      resolution: next.resolutions.includes(video.resolution) ? video.resolution : next.resolutions[next.resolutions.length - 1],
      generateAudio: video.generateAudio && next.audio,
    })
  }

  const save = () => {
    onSave(preset.id, {
      name: name.trim() || preset.name,
      params: {
        ...preset.params,
        mainPrompt: prompt,
        aspectRatio: video.aspectRatio,
        video,
        category: category.trim() || undefined,
      },
    })
  }

  return (
    <div className="space-y-2 rounded-md border border-[#c99850]/30 bg-zinc-950/60 p-2.5">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-0.5 block text-[10px] text-zinc-500">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] text-zinc-500">Category</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Uncategorized" className={inputClass} />
        </div>
      </div>

      <div>
        <label className="mb-0.5 block text-[10px] text-zinc-500">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className={`${inputClass} resize-y leading-5`}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-0.5 block text-[10px] text-zinc-500">Model</label>
          <select value={video.model} onChange={(e) => changeModel(e.target.value as VideoModelId)} className={inputClass}>
            {VIDEO_MODEL_IDS.map((id) => <option key={id} value={id}>{VIDEO_MODELS[id].label}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] text-zinc-500">Duration</label>
          <select
            value={video.duration}
            onChange={(e) => setVideo({ ...video, duration: Number(e.target.value) })}
            className={inputClass}
          >
            {(caps?.durations ?? [5]).map((seconds) => <option key={seconds} value={seconds}>{seconds}s</option>)}
          </select>
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] text-zinc-500">Resolution</label>
          <select
            value={video.resolution}
            onChange={(e) => setVideo({ ...video, resolution: e.target.value as VideoResolution })}
            className={inputClass}
          >
            {(caps?.resolutions ?? ['1080p']).map((res) => <option key={res} value={res}>{res}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] text-zinc-500">Aspect</label>
          <select
            value={video.aspectRatio}
            onChange={(e) => setVideo({ ...video, aspectRatio: e.target.value })}
            className={inputClass}
          >
            {ASPECT_OPTIONS.map((aspect) => <option key={aspect} value={aspect}>{aspect}</option>)}
          </select>
        </div>
      </div>

      <label className={`flex items-center gap-2 text-xs ${caps?.audio ? 'text-zinc-300' : 'text-zinc-600'}`}>
        <input
          type="checkbox"
          checked={video.generateAudio}
          disabled={!caps?.audio}
          onChange={(e) => setVideo({ ...video, generateAudio: e.target.checked })}
          className="accent-[#c99850]"
        />
        Generate audio{caps?.audio ? '' : ' (not supported by this model)'}
      </label>

      <div className="flex gap-2 pt-1">
        <Button onClick={save} size="sm" className="flex-1 bg-[#c99850] text-black hover:bg-[#dbb56e]">
          Save changes
        </Button>
        <Button onClick={onCancel} size="sm" variant="ghost" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
          Cancel
        </Button>
      </div>
    </div>
  )
}
