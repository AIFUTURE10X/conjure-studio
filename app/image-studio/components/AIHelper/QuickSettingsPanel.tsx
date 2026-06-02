'use client'

import { BadgeCheck, ImageIcon, MonitorCog, Scissors, Settings2, Type } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AIHelperMode } from '../../hooks/useAIHelper'

interface QuickSettingsPanelProps {
  mode: AIHelperMode
  currentPromptSettings?: {
    selectedModel?: string
    imageSize?: string
    imageBgRemovalMethod?: string
    imagePhotoRoomBgRemovalEnabled?: boolean
    logoBgRemovalMethod?: string
    logoSelectedModel?: string
    logoResolution?: string
    logoTextMode?: string
  }
  onRunSetting: (prompt: string) => void
}

interface QuickSettingAction {
  label: string
  prompt: string
  icon: LucideIcon
  active?: boolean
}

interface QuickSettingGroup {
  label: string
  actions: QuickSettingAction[]
}

export function QuickSettingsPanel({ mode, currentPromptSettings = {}, onRunSetting }: QuickSettingsPanelProps) {
  const activeModel = mode === 'logo'
    ? currentPromptSettings.logoSelectedModel
    : currentPromptSettings.selectedModel
  const activeResolution = mode === 'logo'
    ? currentPromptSettings.logoResolution
    : currentPromptSettings.imageSize
  const activeBgMethod = mode === 'logo'
    ? currentPromptSettings.logoBgRemovalMethod
    : currentPromptSettings.imageBgRemovalMethod || (currentPromptSettings.imagePhotoRoomBgRemovalEnabled ? 'photoroom' : 'smart')

  const settingsGroups: QuickSettingGroup[] = [
    {
      label: 'Background / PNG',
      actions: mode === 'logo'
        ? [
            { label: 'PhotoRoom', prompt: 'use photoroom', icon: Scissors, active: activeBgMethod === 'photoroom' },
            { label: 'Native PNG', prompt: 'native transparent png', icon: ImageIcon, active: activeBgMethod === 'native-transparent' },
            { label: 'Normal BG', prompt: 'normal logo with background', icon: BadgeCheck, active: activeBgMethod === 'none' },
          ]
        : [
            { label: 'PhotoRoom', prompt: 'use photoroom', icon: Scissors, active: activeBgMethod === 'photoroom' },
            { label: 'Smart BG', prompt: 'use smart cleanup', icon: ImageIcon, active: activeBgMethod === 'smart' },
          ],
    },
    ...(mode === 'logo'
      ? [{
          label: 'Text Mode',
          actions: [
            { label: 'Exact Overlay', prompt: 'use exact text overlay', icon: Type, active: currentPromptSettings.logoTextMode === 'exact-text-overlay' },
            { label: 'AI Text', prompt: 'use ai text', icon: Type, active: currentPromptSettings.logoTextMode === 'ai-text' },
          ],
        }]
      : []),
    {
      label: 'Model',
      actions: [
        { label: 'Gemini Flash', prompt: 'use gemini 3.1 flash', icon: MonitorCog, active: activeModel === 'gemini-3.1-flash-image-preview' },
        { label: 'Gemini Pro', prompt: 'use gemini 3 pro', icon: MonitorCog, active: activeModel === 'gemini-3-pro-image-preview' },
        { label: 'ChatGPT 2.0', prompt: 'use chatgpt images 2.0', icon: MonitorCog, active: activeModel === 'gpt-image-2' },
      ],
    },
    {
      label: 'Resolution',
      actions: [
        { label: '1K', prompt: 'set 1k', icon: Settings2, active: activeResolution === '1K' },
        { label: '2K', prompt: 'set 2k', icon: Settings2, active: activeResolution === '2K' },
        { label: '4K', prompt: 'set 4k', icon: Settings2, active: activeResolution === '4K' },
      ],
    },
  ]

  return (
    <div className="border-b border-[#c99850]/20 bg-zinc-950/40 px-4 py-3 sm:px-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          <Settings2 className="h-3.5 w-3.5 text-[#c99850]" />
          Quick Settings
        </span>
        <span className="text-xs font-medium text-zinc-500">{mode === 'logo' ? 'Logo' : 'Image'}</span>
      </div>
      <div className="grid gap-3">
        {settingsGroups.map((group) => (
          <div key={group.label}>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{group.label}</div>
            <div className="flex flex-wrap gap-2">
              {group.actions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={`${group.label}-${action.label}`}
                    type="button"
                    onClick={() => onRunSetting(action.prompt)}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold transition-colors ${
                      action.active
                        ? 'border-[#c99850]/50 bg-[#c99850]/15 text-[#f0d49b]'
                        : 'border-zinc-700 bg-zinc-800/70 text-zinc-300 hover:border-[#c99850]/50 hover:text-white'
                    }`}
                    title={action.prompt}
                    aria-label={action.prompt}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {action.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
