"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronDown, Palette, X } from 'lucide-react'
import {
  CREATIVE_DIRECTION_SINGLE_GROUPS,
  DECORATIVE_ELEMENT_OPTIONS,
  DEFAULT_CREATIVE_DIRECTION,
  buildCreativeDirectionSummary,
  getCreativeDirectionOption,
  type CreativeDirectionKey,
  type CreativeDirectionState,
} from '../../constants/creative-direction-options'
import { CreativeDirectionPreview } from './CreativeDirectionPreview'

interface CreativeDirectionPopoverProps {
  creativeDirection: CreativeDirectionState
  onCreativeDirectionChange: (creativeDirection: CreativeDirectionState) => void
  onHover?: (hovered: boolean) => void
}

const GROUP_SECTIONS = [
  {
    title: 'Ad Setup',
    keys: ['adType', 'ctaStyle', 'informationLayout', 'adPreset'] as CreativeDirectionKey[],
  },
  {
    title: 'Visual Style',
    keys: ['typographyStyle', 'fontFill', 'dimensionalStyle', 'visualEffectStyle', 'colorPalette'] as CreativeDirectionKey[],
  },
  {
    title: 'Scene & Texture',
    keys: ['backgroundScenery', 'paperEffect', 'textureStrength'] as CreativeDirectionKey[],
  },
]

export function CreativeDirectionPopover({
  creativeDirection,
  onCreativeDirectionChange,
  onHover,
}: CreativeDirectionPopoverProps) {
  const summary = buildCreativeDirectionSummary(creativeDirection)
  const [openKey, setOpenKey] = useState<CreativeDirectionKey | null>(null)

  const updateSingle = (key: CreativeDirectionKey, value: string) => {
    onCreativeDirectionChange({ ...creativeDirection, [key]: value })
    setOpenKey(null)
  }

  const toggleDecorativeElement = (value: string) => {
    const current = new Set(creativeDirection.decorativeElements)
    if (current.has(value)) {
      current.delete(value)
    } else {
      current.add(value)
    }
    onCreativeDirectionChange({
      ...creativeDirection,
      decorativeElements: Array.from(current),
    })
  }

  const clearAll = () => {
    setOpenKey(null)
    onCreativeDirectionChange(DEFAULT_CREATIVE_DIRECTION)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="px-6 py-3 font-medium flex items-center gap-2 bg-transparent text-zinc-400 hover:text-white max-w-[260px]"
          onMouseEnter={() => onHover?.(true)}
          onMouseLeave={() => onHover?.(false)}
        >
          <Palette className="w-4 h-4 shrink-0" />
          <span className="truncate">{summary ? `Creative: ${summary}` : 'Creative'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" sideOffset={12} className="w-[calc(100vw-32px)] max-w-[1080px] max-h-[78vh] overflow-y-auto bg-zinc-950 border-zinc-800 p-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#c99850]">Creative Direction</h3>
            <p className="text-xs text-zinc-500 mt-1">Shape the ad format, typography, texture, and commercial intent.</p>
          </div>
          <Button
            type="button"
            onClick={clearAll}
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5 min-w-0">
            {GROUP_SECTIONS.map((section) => {
              const activeGroup = openKey && section.keys.includes(openKey)
                ? CREATIVE_DIRECTION_SINGLE_GROUPS.find((item) => item.key === openKey)
                : null

              return (
                <section key={section.title}>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-zinc-500 mb-2">{section.title}</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {section.keys.map((key) => {
                      const group = CREATIVE_DIRECTION_SINGLE_GROUPS.find((item) => item.key === key)
                      if (!group) return null

                      const selectedOption = getCreativeDirectionOption(creativeDirection[key])
                      const isOpen = openKey === key

                      return (
                        <div key={key} className="block min-w-0">
                          <span className="text-xs font-medium text-[#c99850] mb-1.5 block">{group.label}</span>
                          <button
                            type="button"
                            onClick={() => setOpenKey(isOpen ? null : key)}
                            aria-expanded={isOpen}
                            className={`w-full h-10 px-3 rounded-lg text-xs bg-zinc-900 text-white border text-left flex items-center justify-between gap-2 transition-colors ${
                              isOpen ? 'border-[#c99850]' : 'border-[#c99850]/30 hover:border-[#c99850]/70'
                            }`}
                          >
                            <span className="truncate">{selectedOption?.label || 'None'}</span>
                            <ChevronDown className={`w-4 h-4 shrink-0 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {activeGroup && (
                    <div className="mt-3 rounded-lg border border-[#c99850]/30 bg-zinc-900/95 p-2 shadow-xl">
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => updateSingle(activeGroup.key, '')}
                          className={`min-h-10 rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                            creativeDirection[activeGroup.key] === ''
                              ? 'border-[#c99850] bg-[#c99850] text-black'
                              : 'border-zinc-700 bg-zinc-950 text-zinc-200 hover:border-[#c99850]/70 hover:text-white'
                          }`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate">None</span>
                            {creativeDirection[activeGroup.key] === '' && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </span>
                        </button>
                        {activeGroup.options.map((option) => {
                          const selected = creativeDirection[activeGroup.key] === option.value
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => updateSingle(activeGroup.key, option.value)}
                              className={`min-h-10 rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                                selected
                                  ? 'border-[#c99850] bg-[#c99850] text-black'
                                  : 'border-zinc-700 bg-zinc-950 text-zinc-200 hover:border-[#c99850]/70 hover:text-white'
                              }`}
                            >
                              <span className="flex items-center justify-between gap-2">
                                <span className="truncate">{option.label}</span>
                                {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </section>
              )
            })}

            <section>
              <h4 className="text-xs font-bold uppercase tracking-wide text-zinc-500 mb-2">Details</h4>
              <div>
                <span className="text-xs font-medium text-[#c99850] mb-2 block">Decorative Elements</span>
                <div className="flex flex-wrap gap-2">
                  {DECORATIVE_ELEMENT_OPTIONS.map((option) => {
                    const selected = creativeDirection.decorativeElements.includes(option.value)
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleDecorativeElement(option.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          selected
                            ? 'bg-[#c99850] text-black border-[#c99850]'
                            : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-[#c99850]/70 hover:text-white'
                        }`}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </section>
          </div>

          <CreativeDirectionPreview creativeDirection={creativeDirection} />
        </div>
      </PopoverContent>
    </Popover>
  )
}
