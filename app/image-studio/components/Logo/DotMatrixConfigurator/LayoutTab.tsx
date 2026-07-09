"use client"

import { TabsContent } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Image as ImageIcon } from 'lucide-react'
import { DotMatrixConfig, LOGO_ORIENTATION_OPTIONS } from '../../../constants/dot-matrix-config'
import { IconSelector, IconStyle as ExtendedIconStyle, IconPosition } from '../IconSelector'
import { OptionButton } from './OptionButton'

interface LayoutTabProps {
  config: DotMatrixConfig
  toggleConfig: <K extends keyof DotMatrixConfig>(key: K, value: DotMatrixConfig[K]) => void
  updateConfig: <K extends keyof DotMatrixConfig>(key: K, value: DotMatrixConfig[K]) => void
}

export function LayoutTab({ config, toggleConfig, updateConfig }: LayoutTabProps) {
  return (
    <TabsContent value="layout" className="mt-0 space-y-6">
      {/* Icon Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-purple-400" />
          Icon / Symbol Integration
        </label>
        <p className="text-xs text-zinc-500">
          Add an icon or symbol to your logo
        </p>
      </div>

      <IconSelector
        selectedIcon={config.extendedIconStyle as ExtendedIconStyle | null}
        selectedPosition={config.iconPosition as IconPosition | null}
        onIconChange={(icon) => updateConfig('extendedIconStyle', icon)}
        onPositionChange={(position) => updateConfig('iconPosition', position)}
      />

      {/* Divider */}
      <div className="border-t border-zinc-700 pt-4">
        <p className="text-xs text-zinc-500 mb-4">Layout Options</p>
      </div>

      {/* Logo Orientation */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Logo Orientation</label>
        <div className="flex gap-2">
          {LOGO_ORIENTATION_OPTIONS.map((opt) => (
            <OptionButton key={opt.value} selected={config.logoOrientation === opt.value} onClick={() => toggleConfig('logoOrientation', opt.value)} className="px-4 py-2 text-xs">
              {opt.label}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Tilt Angle Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-zinc-300">Tilt Angle</label>
          <span className="text-xs text-zinc-500">{config.tiltAngle}°</span>
        </div>
        <Slider
          value={[config.tiltAngle]}
          onValueChange={(v: number[]) => updateConfig('tiltAngle', v[0])}
          min={-30}
          max={30}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-zinc-600">
          <span>-30° (left)</span>
          <span>0° (straight)</span>
          <span>+30° (right)</span>
        </div>
      </div>
    </TabsContent>
  )
}
