"use client"

import { Check } from 'lucide-react'
import {
  LogoRenderTreatment,
  LogoType,
  LogoTypographyDirection,
  LogoVisualStyle,
  LOGO_RENDER_TREATMENT_OPTIONS,
  LOGO_TYPE_OPTIONS,
  LOGO_TYPOGRAPHY_DIRECTION_OPTIONS,
  LOGO_VISUAL_STYLE_OPTIONS,
  LogoConcept,
  RenderStyle,
  LOGO_CONCEPTS,
  RENDER_STYLES
} from '../../constants/logo-constants'

interface LogoStyleSelectorProps {
  logoType: LogoType
  setLogoType: (type: LogoType) => void
  logoVisualStyle: LogoVisualStyle
  setLogoVisualStyle: (style: LogoVisualStyle) => void
  logoRenderTreatment: LogoRenderTreatment
  setLogoRenderTreatment: (treatment: LogoRenderTreatment) => void
  logoTypographyDirection: LogoTypographyDirection
  setLogoTypographyDirection: (direction: LogoTypographyDirection) => void
  selectedConcept: LogoConcept | null
  setSelectedConcept: (concept: LogoConcept | null) => void
  selectedRenders: RenderStyle[]
  setSelectedRenders: (renders: RenderStyle[]) => void
  isGenerating: boolean
}

export function LogoStyleSelector({
  logoType,
  setLogoType,
  logoVisualStyle,
  setLogoVisualStyle,
  logoRenderTreatment,
  setLogoRenderTreatment,
  logoTypographyDirection,
  setLogoTypographyDirection,
  selectedConcept,
  setSelectedConcept,
  selectedRenders,
  setSelectedRenders,
  isGenerating,
}: LogoStyleSelectorProps) {
  const buttonBaseClass = 'flex min-h-[50px] flex-col items-start justify-center rounded-md border px-2 py-2 text-left transition-all'
  const buttonStateClass = (selected: boolean) => selected
    ? 'border-[#c99850] bg-[#c99850]/10 text-[#f0d49b]'
    : 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600 hover:text-white'
  const disabledClass = isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'

  const renderSingleSelectGroup = <T extends string>(
    label: string,
    options: Array<{ value: T; label: string; description: string; icon?: string }>,
    value: T,
    onChange: (value: T) => void,
    columns = 'grid-cols-3'
  ) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{label}</label>
      <div className={`grid ${columns} gap-1.5`}>
        {options.map((option) => {
          const isSelected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              disabled={isGenerating}
              className={`${buttonBaseClass} ${buttonStateClass(isSelected)} ${disabledClass}`}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="truncate text-[11px] font-semibold leading-tight">{option.label}</span>
                {isSelected && <Check className="h-3 w-3 shrink-0" />}
              </span>
              <span className="mt-0.5 line-clamp-2 text-[9px] font-medium leading-tight text-zinc-500">{option.description}</span>
            </button>
          )
        })}
      </div>
    </div>
  )

  // Toggle function for concept - click again to deselect
  const toggleConcept = (concept: LogoConcept) => {
    setSelectedConcept(selectedConcept === concept ? null : concept)
  }

  // Toggle function for multi-select rendering styles
  const toggleRenderStyle = (style: RenderStyle) => {
    if (selectedRenders.includes(style)) {
      setSelectedRenders(selectedRenders.filter(s => s !== style))
    } else {
      setSelectedRenders([...selectedRenders, style])
    }
  }

  return (
    <div className="space-y-3">
      {renderSingleSelectGroup('Logo Type', LOGO_TYPE_OPTIONS, logoType, setLogoType, 'grid-cols-3 xl:grid-cols-6')}
      {renderSingleSelectGroup('Visual Style', LOGO_VISUAL_STYLE_OPTIONS, logoVisualStyle, setLogoVisualStyle, 'grid-cols-2 xl:grid-cols-4')}
      {renderSingleSelectGroup('Render Treatment', LOGO_RENDER_TREATMENT_OPTIONS, logoRenderTreatment, setLogoRenderTreatment, 'grid-cols-2 xl:grid-cols-4')}
      {renderSingleSelectGroup('Typography Direction', LOGO_TYPOGRAPHY_DIRECTION_OPTIONS, logoTypographyDirection, setLogoTypographyDirection, 'grid-cols-2 xl:grid-cols-3')}

      <details className="rounded-md border border-zinc-700 bg-zinc-900/60 p-2">
        <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Extra Expert Style Tags
        </summary>
        <div className="mt-3 space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Logo Concept</label>
            <div className="grid grid-cols-6 gap-1">
          {LOGO_CONCEPTS.map((concept) => (
            <button
              key={concept.value}
              type="button"
              onClick={() => toggleConcept(concept.value)}
              disabled={isGenerating}
              className={`
                flex flex-col items-center p-1.5 rounded-lg border transition-all
                ${selectedConcept === concept.value
                  ? 'border-[#c99850] bg-[#c99850]/10'
                  : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                }
                ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className="text-base" style={{ color: concept.color }}>{concept.icon}</span>
              <span className={`text-[9px] font-medium ${selectedConcept === concept.value ? 'text-[#dbb56e]' : 'text-white'}`}>
                {concept.label}
              </span>
            </button>
          ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Rendering Style <span className="text-zinc-500">(multi-select)</span></label>
            <div className="grid grid-cols-6 gap-1">
          {RENDER_STYLES.map((render) => {
            const isSelected = selectedRenders.includes(render.value)
            return (
              <button
                key={render.value}
                type="button"
                onClick={() => toggleRenderStyle(render.value)}
                disabled={isGenerating}
                className={`
                  flex flex-col items-center p-1.5 rounded-lg border transition-all relative
                  ${isSelected
                    ? 'border-[#c99850] bg-[#c99850]/10'
                    : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                  }
                  ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {isSelected && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#c99850] rounded-full flex items-center justify-center">
                    <Check className="w-2 h-2 text-black" />
                  </span>
                )}
                <span
                  className="text-base"
                  style={render.gradient
                    ? { background: render.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }
                    : { color: render.color }
                  }
                >
                  {render.icon}
                </span>
                <span className={`text-[9px] font-medium ${isSelected ? 'text-[#dbb56e]' : 'text-white'}`}>
                  {render.label}
                </span>
              </button>
            )
          })}
            </div>
          </div>
        </div>
      </details>

      {/* Preview of combined style */}
      {(logoType || logoVisualStyle || logoRenderTreatment || logoTypographyDirection || selectedConcept || selectedRenders.length > 0) && (
        <div className="text-[10px] text-zinc-500 text-center">
          Style: <span className="text-[#dbb56e]">
            {[
              LOGO_TYPE_OPTIONS.find(option => option.value === logoType)?.label,
              LOGO_VISUAL_STYLE_OPTIONS.find(option => option.value === logoVisualStyle)?.label,
              LOGO_RENDER_TREATMENT_OPTIONS.find(option => option.value === logoRenderTreatment)?.label,
              LOGO_TYPOGRAPHY_DIRECTION_OPTIONS.find(option => option.value === logoTypographyDirection)?.label,
              selectedConcept ? LOGO_CONCEPTS.find(c => c.value === selectedConcept)?.label : null,
              ...selectedRenders.map(r => RENDER_STYLES.find(rs => rs.value === r)?.label)
            ].filter(Boolean).join(' + ') || 'None selected'}
          </span>
        </div>
      )}
    </div>
  )
}
