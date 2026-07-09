'use client'

import { Brain, FileText, ImageIcon, Layers, MonitorCheck, Sparkles, X } from 'lucide-react'
import type { AIHelperActiveTask, AIHelperLatestOutput, AIHelperMemorySnapshot, AIHelperMode } from '../../hooks/useAIHelper'
import type { CreativeDirectionState } from '../../constants/creative-direction-options'

interface ContextSnapshotProps {
  mode: AIHelperMode
  variant?: 'drawer' | 'workspace'
  currentPromptSettings?: {
    activeTab?: string
    currentPrompt?: string
    currentNegativePrompt?: string
    currentStyle?: string
    currentCameraAngle?: string
    currentCameraLens?: string
    currentAspectRatio?: string
    styleStrength?: string
    selectedModel?: string
    imageSize?: string
    imageCount?: number
    seed?: number | null
    analysisMode?: string
    imageBgRemovalEnabled?: boolean
    imageBgRemovalMethod?: string
    imageBgRemovalProvider?: string
    imagePhotoRoomBgRemovalEnabled?: boolean
    logoBgRemovalEnabled?: boolean
    logoBgRemovalMethod?: string
    logoBgRemovalProvider?: string
    logoRemoveBackgroundOnly?: boolean
    logoSelectedModel?: string
    logoResolution?: string
    logoAspectRatio?: string
    logoTextMode?: string
    logoType?: string
    logoVisualStyle?: string
    logoRenderTreatment?: string
    logoTypographyDirection?: string
    logoHasReferenceImage?: boolean
    logoReferenceMode?: string
    hasReferenceImage?: boolean
    referenceImageMode?: string
    promptMode?: string
    creativeDirection?: CreativeDirectionState
  }
  uploadedImages: string[]
  preferenceCount?: number
  preferenceMemory?: AIHelperMemorySnapshot[]
  activeDesignBrief?: string
  sharedProjectBrief?: string
  activeTaskContext?: AIHelperActiveTask
  onForgetPreference?: (timestamp: number) => void
  latestOutputs?: {
    image?: AIHelperLatestOutput | null
    logo?: AIHelperLatestOutput | null
  }
}

const hasPromptText = (value?: string) => Boolean(value && value.trim())

const formatModelLabel = (model?: string) => {
  if (!model) return 'No model'
  if (model === 'gpt-image-2') return 'Model: ChatGPT Images 2.0'
  if (model === 'gemini-3-pro-image-preview') return 'Model: Gemini 3 Pro'
  if (model === 'gemini-3.1-flash-image-preview') return 'Model: Gemini 3.1 Flash'
  return `Model: ${model}`
}

const formatBackgroundRemovalChip = (scope: 'image' | 'logo', method?: string, enabled = true) => {
  const scopeLabel = scope === 'logo' ? 'Logo' : 'Image'
  if (!enabled || method === 'none') return `${scopeLabel} BG off`
  if (method === 'photoroom') return 'PhotoRoom BG'
  if (!method) return `${scopeLabel} BG unknown`
  return `${scopeLabel} BG: ${method}`
}

function ContextChip({ icon: Icon, label, active }: { icon: typeof FileText; label: string; active: boolean }) {
  return (
    <span
      className={`flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium ${
        active
          ? 'border-[#c99850]/40 bg-[#c99850]/10 text-[#f0d49b]'
          : 'border-zinc-700 bg-zinc-800/70 text-zinc-500'
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate" title={label}>{label}</span>
    </span>
  )
}

function ContextRow({ icon: Icon, label, value, active }: { icon: typeof FileText; label: string; value: string; active: boolean }) {
  return (
    <div
      className={`flex min-h-[44px] items-center gap-3 rounded-md border px-3 py-2 ${
        active
          ? 'border-[#c99850]/35 bg-[#c99850]/10'
          : 'border-zinc-800 bg-zinc-900/70'
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${
          active
            ? 'border-[#c99850]/30 bg-[#c99850]/10 text-[#f0d49b]'
            : 'border-zinc-700 bg-zinc-800 text-zinc-500'
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{label}</span>
        <span className={`block truncate text-xs font-semibold ${active ? 'text-[#f0d49b]' : 'text-zinc-400'}`}>{value}</span>
      </span>
    </div>
  )
}

export function ContextSnapshot({
  mode,
  variant = 'drawer',
  currentPromptSettings = {},
  uploadedImages,
  preferenceCount = 0,
  preferenceMemory = [],
  activeDesignBrief,
  sharedProjectBrief,
  activeTaskContext,
  onForgetPreference,
  latestOutputs = {},
}: ContextSnapshotProps) {
  const latestOutput = mode === 'logo' ? latestOutputs.logo : latestOutputs.image
  const hasPrompt = hasPromptText(currentPromptSettings.currentPrompt)
  const hasNegativePrompt = hasPromptText(currentPromptSettings.currentNegativePrompt)
  const hasStyle = hasPromptText(currentPromptSettings.currentStyle)
  const hasReferenceImage = uploadedImages.length > 0
  const hasGeneratorReferenceImage = mode === 'logo' ? Boolean(currentPromptSettings.logoHasReferenceImage) : Boolean(currentPromptSettings.hasReferenceImage)
  const generatorReferenceMode = mode === 'logo' ? currentPromptSettings.logoReferenceMode : currentPromptSettings.referenceImageMode
  const hasLatestOutput = Boolean(latestOutput?.url)
  const hasActiveDesignBrief = hasPromptText(activeDesignBrief)
  const hasSharedProjectBrief = hasPromptText(sharedProjectBrief)
  const imageBgRemovalEnabled = currentPromptSettings.imageBgRemovalEnabled !== false && Boolean(currentPromptSettings.imageBgRemovalMethod)
  const logoBgRemovalEnabled = currentPromptSettings.logoBgRemovalEnabled !== false && Boolean(currentPromptSettings.logoBgRemovalMethod)
  const activeGeneratorModel = mode === 'logo'
    ? currentPromptSettings.logoSelectedModel
    : currentPromptSettings.selectedModel
  const activeResolution = mode === 'logo'
    ? currentPromptSettings.logoResolution
    : currentPromptSettings.imageSize
  const activeAspectRatio = mode === 'logo'
    ? currentPromptSettings.logoAspectRatio
    : currentPromptSettings.currentAspectRatio
  const logoStyleSummary = [
    currentPromptSettings.logoType,
    currentPromptSettings.logoVisualStyle,
    currentPromptSettings.logoRenderTreatment,
    currentPromptSettings.logoTypographyDirection,
  ].filter(Boolean).join(' / ')
  const contextGroups = [
    {
      label: 'Core Settings',
      chips: [
        { icon: FileText, label: 'Prompt', value: hasPrompt ? 'Prompt loaded' : 'No prompt', active: hasPrompt },
        { icon: Layers, label: 'Negative', value: hasNegativePrompt ? 'Loaded' : 'No negative prompt', active: hasNegativePrompt },
        { icon: MonitorCheck, label: 'Style', value: hasStyle ? currentPromptSettings.currentStyle || 'Style set' : 'No style', active: hasStyle },
        ...(mode === 'logo'
          ? [{ icon: Sparkles, label: 'Logo Style:', value: logoStyleSummary || 'No logo style', active: Boolean(logoStyleSummary) }]
          : []),
        { icon: MonitorCheck, label: 'Model:', value: formatModelLabel(activeGeneratorModel).replace('Model: ', ''), active: Boolean(activeGeneratorModel) },
        { icon: MonitorCheck, label: 'Resolution:', value: activeResolution || 'No resolution', active: Boolean(activeResolution) },
        { icon: Layers, label: 'Ratio:', value: activeAspectRatio || 'No ratio', active: Boolean(activeAspectRatio) },
        { icon: Layers, label: 'Count:', value: currentPromptSettings.imageCount ? `${currentPromptSettings.imageCount}` : 'No count', active: Boolean(currentPromptSettings.imageCount) },
        ...(mode === 'image'
          ? [{ icon: Layers, label: 'Background', value: formatBackgroundRemovalChip('image' as const, currentPromptSettings.imageBgRemovalMethod, imageBgRemovalEnabled), active: imageBgRemovalEnabled }]
          : [{ icon: Layers, label: 'Background', value: formatBackgroundRemovalChip('logo' as const, currentPromptSettings.logoBgRemovalMethod, logoBgRemovalEnabled), active: logoBgRemovalEnabled }]),
      ],
    },
    {
      label: 'References',
      chips: [
        { icon: ImageIcon, label: 'Reference image', value: hasReferenceImage ? `Reference image x${uploadedImages.length}` : 'No reference image', active: hasReferenceImage },
        { icon: ImageIcon, label: 'Generator ref:', value: hasGeneratorReferenceImage ? `Generator ref: ${generatorReferenceMode || 'loaded'}` : 'No generator ref', active: hasGeneratorReferenceImage },
        { icon: Sparkles, label: 'Latest output', value: hasLatestOutput ? 'Latest output' : 'No latest output', active: hasLatestOutput },
      ],
    },
    {
      label: 'Memory',
      chips: [
        { icon: Brain, label: 'Active brief', value: hasActiveDesignBrief ? 'Active brief' : 'No active brief', active: hasActiveDesignBrief },
        { icon: Brain, label: 'Project', value: hasSharedProjectBrief ? 'Shared project' : 'No shared project', active: hasSharedProjectBrief },
        { icon: Brain, label: 'Preferences', value: preferenceCount > 0 ? `Preference memory x${preferenceCount}` : 'No preference memory', active: preferenceCount > 0 },
      ],
    },
  ]
  // Drawer (narrow side panel): stack groups and chips vertically as
  // full-width rows so labels never wrap into their icons at any zoom.
  const groupGridClass = variant === 'workspace'
    ? 'grid gap-3'
    : 'grid gap-4'
  const contextRowGridClass = variant === 'workspace'
    ? 'grid grid-cols-2 gap-2 xl:grid-cols-3'
    : 'flex flex-col gap-1.5'

  return (
    <div className="border-b border-[#c99850]/20 bg-zinc-950/50 px-4 py-4 sm:px-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{variant === 'workspace' ? 'Settings overview' : 'Current Context'}</span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400">
          <Sparkles className="h-3.5 w-3.5 text-[#c99850]" />
          Mode: {mode === 'logo' ? 'Logo' : 'Image'}
        </span>
      </div>
      <div className={groupGridClass}>
        {contextGroups.map((group) => (
          <div key={group.label}>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{group.label}</div>
            <div className={contextRowGridClass}>
              {group.chips.map((chip) => (
                variant === 'workspace'
                  ? <ContextRow key={chip.label} icon={chip.icon} label={chip.label} value={chip.value} active={chip.active} />
                  : <ContextChip key={chip.label} icon={chip.icon} label={chip.value} active={chip.active} />
              ))}
            </div>
          </div>
        ))}
      </div>
      {hasSharedProjectBrief && (
        <div className="mt-3 rounded-md border border-zinc-700/70 bg-zinc-900/70 p-3">
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            <Brain className="h-3.5 w-3.5" />
            Shared project brief
          </div>
          <div className="line-clamp-3 text-xs leading-5 text-zinc-300">{sharedProjectBrief}</div>
        </div>
      )}
      {activeTaskContext && (
        <div className="mt-3 rounded-md border border-[#c99850]/25 bg-[#c99850]/10 p-3">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f0d49b]">
            <Brain className="h-3.5 w-3.5" />
            Active Task
          </div>
          <div className="grid gap-2 text-xs leading-5 text-zinc-200 sm:grid-cols-3">
            <div>
              <span className="font-semibold text-[#f0d49b]">Goal:</span>{' '}
              <span className="text-zinc-300">{activeTaskContext.goal}</span>
            </div>
            <div>
              <span className="font-semibold text-[#f0d49b]">Preserve:</span>{' '}
              <span className="text-zinc-300">{activeTaskContext.preserve}</span>
            </div>
            <div>
              <span className="font-semibold text-[#f0d49b]">Next:</span>{' '}
              <span className="text-zinc-300">{activeTaskContext.next}</span>
            </div>
          </div>
        </div>
      )}
      {preferenceMemory.length > 0 && (
        <div className="mt-3 border-t border-zinc-800 pt-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Saved Preferences</div>
          <div className="flex flex-wrap gap-2">
            {preferenceMemory.map((preference) => (
              <span
                key={preference.timestamp}
                className="inline-flex min-h-8 max-w-full items-center gap-2 rounded-md border border-[#c99850]/30 bg-[#c99850]/10 px-2.5 py-1 text-xs font-medium text-[#f0d49b]"
                title={preference.preference || 'Saved preference'}
              >
                <Brain className="h-3.5 w-3.5 shrink-0" />
                <span className="max-w-[360px] truncate">{preference.preference}</span>
                <button
                  type="button"
                  onClick={() => onForgetPreference?.(preference.timestamp)}
                  className="rounded p-0.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                  title="Forget preference"
                  aria-label="Forget preference"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
