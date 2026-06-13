"use client"

/**
 * ThumbnailSubjectFxPanel
 *
 * "Pop" effects for the cut-out subject — drop shadow, outline/stroke, and a
 * colored glow — plus the photo adjustments (brightness/contrast/etc.). The
 * signature thumbnail move that makes a face leap off the background.
 */

import { Loader2, Sparkles } from 'lucide-react'
import { useThumbnail } from './ThumbnailProvider'
import { AdjustControls, RangeRow, SelectRow, SwatchRow, ToggleRow } from './ThumbnailControls'
import { BLEND_MODES, DEFAULT_ADJUST, DEFAULT_SUBJECT_FX, SUBJECT_FRAMES } from './thumbnail-constants'
import { railButton, railLabel } from './thumbnail-ui'

export function ThumbnailSubjectFxPanel() {
  const { config, patchSubject, patchSubjectFx, patchSubjectAdjust, enhanceImage, isEnhancing } = useThumbnail()
  const subject = config.subject
  if (!subject) return null

  const fx = { ...DEFAULT_SUBJECT_FX, ...subject.fx }
  const adjust = { ...DEFAULT_ADJUST, ...subject.adjust }
  const frame = subject.frame ?? 'none'

  return (
    <div className="space-y-2.5">
      <h4 className={railLabel}>Subject pop FX</h4>

      <button onClick={() => enhanceImage('subject')} disabled={isEnhancing} className={`${railButton} w-full`} title="AI upscale / sharpen the cutout">
        {isEnhancing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        Enhance photo
      </button>

      <div className="grid grid-cols-3 gap-1.5">
        {SUBJECT_FRAMES.map((f) => (
          <button
            key={f.id}
            onClick={() => patchSubject({ frame: f.id })}
            className={`rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors ${
              frame === f.id ? 'border-[#c99850] bg-[#c99850]/10 text-[#dbb56e]' : 'border-zinc-700 bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <SelectRow label="Blend" value={subject.blend ?? 'normal'} options={BLEND_MODES} onChange={(v) => patchSubject({ blend: v })} />

      <div className="space-y-1.5">
        <ToggleRow label="Drop shadow" active={fx.shadow} onToggle={() => patchSubjectFx({ shadow: !fx.shadow })} />
        {fx.shadow && (
          <div className="space-y-1.5 rounded-md border border-zinc-800 bg-zinc-900/40 p-2">
            <SwatchRow label="Color" value={fx.shadowColor} onChange={(v) => patchSubjectFx({ shadowColor: v })} />
            <RangeRow label="Offset" value={fx.shadowOffset} min={0} max={48} suffix="px" onChange={(v) => patchSubjectFx({ shadowOffset: v })} />
            <RangeRow label="Direction" value={fx.shadowAngle} min={0} max={360} suffix="°" onChange={(v) => patchSubjectFx({ shadowAngle: v })} />
            <RangeRow label="Blur" value={fx.shadowBlur} min={0} max={60} suffix="px" onChange={(v) => patchSubjectFx({ shadowBlur: v })} />
            <RangeRow label="Opacity" value={fx.shadowOpacity} min={0} max={100} suffix="%" onChange={(v) => patchSubjectFx({ shadowOpacity: v })} />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <ToggleRow label="Outline / stroke" active={fx.outline} onToggle={() => patchSubjectFx({ outline: !fx.outline })} />
        {fx.outline && (
          <div className="space-y-1.5 rounded-md border border-zinc-800 bg-zinc-900/40 p-2">
            <SwatchRow label="Color" value={fx.outlineColor} onChange={(v) => patchSubjectFx({ outlineColor: v })} />
            <RangeRow label="Thickness" value={fx.outlineWidth} min={1} max={20} suffix="px" onChange={(v) => patchSubjectFx({ outlineWidth: v })} />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <ToggleRow label="Glow" active={fx.glow} onToggle={() => patchSubjectFx({ glow: !fx.glow })} />
        {fx.glow && (
          <div className="space-y-1.5 rounded-md border border-zinc-800 bg-zinc-900/40 p-2">
            <SwatchRow label="Color" value={fx.glowColor} onChange={(v) => patchSubjectFx({ glowColor: v })} />
            <RangeRow label="Size" value={fx.glowSize} min={2} max={48} suffix="px" onChange={(v) => patchSubjectFx({ glowSize: v })} />
          </div>
        )}
      </div>

      <details className="group">
        <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-wide text-zinc-500 transition-colors hover:text-zinc-300">
          Photo adjust ▾
        </summary>
        <div className="mt-1.5">
          <AdjustControls adjust={adjust} onChange={patchSubjectAdjust} />
        </div>
      </details>
    </div>
  )
}
