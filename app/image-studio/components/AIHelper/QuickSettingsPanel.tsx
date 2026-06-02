'use client'

import { BadgeCheck, Boxes, Crown, MonitorCog, PenLine, Scissors, Settings2, Type } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AIHelperMode } from '../../hooks/useAIHelper'

interface QuickSettingsPanelProps {
  mode: AIHelperMode
  currentPromptSettings?: {
    selectedModel?: string
    imageSize?: string
    imageBgRemovalEnabled?: boolean
    imageBgRemovalMethod?: string
    imagePhotoRoomBgRemovalEnabled?: boolean
    logoBgRemovalMethod?: string
    logoSelectedModel?: string
    logoResolution?: string
    logoTextMode?: string
    logoType?: string
    logoVisualStyle?: string
    logoRenderTreatment?: string
    logoTypographyDirection?: string
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
    : currentPromptSettings.imageBgRemovalEnabled === false
      ? 'none'
      : currentPromptSettings.imageBgRemovalMethod || (currentPromptSettings.imagePhotoRoomBgRemovalEnabled ? 'photoroom' : 'none')

  const settingsGroups: QuickSettingGroup[] = [
    {
      label: 'Background / PNG',
      actions: mode === 'logo'
        ? [
            { label: 'PhotoRoom', prompt: 'use photoroom', icon: Scissors, active: activeBgMethod === 'photoroom' },
            { label: 'Normal BG', prompt: 'normal logo with background', icon: BadgeCheck, active: activeBgMethod === 'none' },
          ]
        : [
            { label: 'PhotoRoom', prompt: 'use photoroom', icon: Scissors, active: activeBgMethod === 'photoroom' },
            { label: 'Normal BG', prompt: 'turn off background removal', icon: BadgeCheck, active: activeBgMethod === 'none' },
          ],
    },
    ...(mode === 'logo'
      ? [{
          label: 'Logo Type',
          actions: [
            { label: 'Wordmark', prompt: 'set logo type wordmark', icon: Type, active: currentPromptSettings.logoType === 'wordmark' },
            { label: 'Icon + Wordmark', prompt: 'set logo type icon wordmark', icon: Boxes, active: currentPromptSettings.logoType === 'icon-wordmark' },
            { label: 'Monogram', prompt: 'set logo type monogram', icon: Type, active: currentPromptSettings.logoType === 'monogram' },
          ],
        }, {
          label: 'Logo Style',
          actions: [
            { label: 'Luxury', prompt: 'set logo style luxury', icon: Crown, active: currentPromptSettings.logoVisualStyle === 'luxury' },
            { label: 'Minimal', prompt: 'set logo style minimal', icon: BadgeCheck, active: currentPromptSettings.logoVisualStyle === 'minimal' },
            { label: 'Modern', prompt: 'set logo style modern', icon: Settings2, active: currentPromptSettings.logoVisualStyle === 'modern' },
            { label: 'Boutique', prompt: 'set logo style boutique', icon: Crown, active: currentPromptSettings.logoVisualStyle === 'boutique' },
          ],
        }, {
          label: 'Render Treatment',
          actions: [
            { label: 'Flat Vector', prompt: 'set logo render flat vector', icon: BadgeCheck, active: currentPromptSettings.logoRenderTreatment === 'flat-vector' },
            { label: 'Metallic', prompt: 'set logo render metallic', icon: Crown, active: currentPromptSettings.logoRenderTreatment === 'metallic' },
            { label: 'Foil', prompt: 'set logo render foil', icon: Crown, active: currentPromptSettings.logoRenderTreatment === 'foil' },
            { label: 'Soft 3D', prompt: 'set logo render soft 3d', icon: Boxes, active: currentPromptSettings.logoRenderTreatment === 'soft-3d' },
          ],
        }, {
          label: 'Typography',
          actions: [
            { label: 'Elegant Serif', prompt: 'set logo typography elegant serif', icon: Type, active: currentPromptSettings.logoTypographyDirection === 'elegant-serif' },
            { label: 'Clean Sans', prompt: 'set logo typography clean sans', icon: Type, active: currentPromptSettings.logoTypographyDirection === 'clean-sans' },
            { label: 'Script', prompt: 'set logo typography script', icon: PenLine, active: currentPromptSettings.logoTypographyDirection === 'script' },
            { label: 'Reference Match', prompt: 'set logo typography reference match', icon: Type, active: currentPromptSettings.logoTypographyDirection === 'reference-match' },
          ],
        }, {
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
  const quickSettingsGridClass = 'grid grid-cols-2 gap-2 xl:grid-cols-3'
  const settingButtonClass = 'inline-flex min-h-[52px] items-center gap-2 rounded-md border px-3 py-2 text-left text-xs font-semibold transition-colors'

  return (
    <div className="border-b border-[#c99850]/20 bg-zinc-950/40 px-4 py-4 sm:px-5">
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
            <div className={quickSettingsGridClass}>
              {group.actions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={`${group.label}-${action.label}`}
                    type="button"
                    onClick={() => onRunSetting(action.prompt)}
                    className={`${settingButtonClass} ${
                      action.active
                        ? 'border-[#c99850]/50 bg-[#c99850]/15 text-[#f0d49b]'
                        : 'border-zinc-700 bg-zinc-800/70 text-zinc-300 hover:border-[#c99850]/50 hover:text-white'
                    }`}
                    title={action.prompt}
                    aria-label={action.prompt}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${
                      action.active
                        ? 'border-[#c99850]/30 bg-[#c99850]/10'
                        : 'border-zinc-700 bg-zinc-900/80'
                    }`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate">{action.label}</span>
                      <span className="block truncate text-[11px] font-medium text-zinc-500">{action.active ? 'Active' : action.prompt}</span>
                    </span>
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
