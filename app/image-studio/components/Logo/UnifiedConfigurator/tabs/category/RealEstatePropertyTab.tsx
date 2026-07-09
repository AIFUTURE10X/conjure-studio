"use client"

/**
 * RealEstatePropertyTab - Real Estate category specific settings
 *
 * Used by presets: real-estate-house, real-estate-key
 * Provides settings for property type, architecture, roofline, key styles
 */

import { TabsContent } from '@/components/ui/tabs'
import { Home, Key, MapPin, Building2 } from 'lucide-react'
import {
  RealEstateLogoConfig,
  PROPERTY_TYPE_OPTIONS,
  ARCHITECTURAL_STYLE_OPTIONS,
  ROOFLINE_STYLE_OPTIONS,
  KEY_STYLE_OPTIONS,
  PROPERTY_ELEMENT_OPTIONS,
  AGENCY_STYLE_OPTIONS,
  REAL_ESTATE_COLORS,
} from '../../../../../constants/preset-schemas/real-estate-schema'
import { OptionButton } from '../../../DotMatrixConfigurator/OptionButton'

interface RealEstatePropertyTabProps {
  config: RealEstateLogoConfig
  updateConfig: <K extends keyof RealEstateLogoConfig>(key: K, value: RealEstateLogoConfig[K]) => void
  toggleConfig: <K extends keyof RealEstateLogoConfig>(key: K, value: RealEstateLogoConfig[K]) => void
}

export function RealEstatePropertyTab({ config, updateConfig, toggleConfig }: RealEstatePropertyTabProps) {
  return (
    <TabsContent value="property-style" className="mt-0 space-y-6">
      {/* Property Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-400" />
          Property Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {PROPERTY_TYPE_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.propertyType === opt.value}
              onClick={() => updateConfig('propertyType', opt.value)}
              className="flex flex-col items-start p-3"
            >
              <span className="text-xs font-medium">{opt.label}</span>
              <span className="text-[10px] text-zinc-500">{opt.description}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Agency Style */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Agency Style</label>
        <div className="grid grid-cols-2 gap-2">
          {AGENCY_STYLE_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.agencyStyle === opt.value}
              onClick={() => updateConfig('agencyStyle', opt.value)}
              className="flex flex-col items-start p-3"
            >
              <span className="text-xs font-medium">{opt.label}</span>
              <span className="text-[10px] text-zinc-500">{opt.description}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Architectural Style - Only show if house icon enabled */}
      {config.hasHouseIcon && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <Home className="w-4 h-4 text-blue-400" />
              Architectural Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ARCHITECTURAL_STYLE_OPTIONS.map((opt) => (
                <OptionButton
                  key={opt.value}
                  selected={config.architecturalStyle === opt.value}
                  onClick={() => updateConfig('architecturalStyle', opt.value)}
                  className="flex flex-col items-start p-3"
                >
                  <span className="text-xs font-medium">{opt.label}</span>
                  <span className="text-[10px] text-zinc-500">{opt.description}</span>
                </OptionButton>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Roofline Style</label>
            <div className="flex flex-wrap gap-2">
              {ROOFLINE_STYLE_OPTIONS.map((opt) => (
                <OptionButton
                  key={opt.value}
                  selected={config.rooflineStyle === opt.value}
                  onClick={() => updateConfig('rooflineStyle', opt.value)}
                  className="px-3 py-2"
                >
                  <span className="text-xs">{opt.label}</span>
                </OptionButton>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Key Style - Only show if key icon enabled */}
      {config.hasKeyIcon && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            Key Style
          </label>
          <div className="grid grid-cols-3 gap-2">
            {KEY_STYLE_OPTIONS.map((opt) => (
              <OptionButton
                key={opt.value}
                selected={config.keyStyle === opt.value}
                onClick={() => updateConfig('keyStyle', opt.value)}
                className="flex flex-col items-start p-3"
              >
                <span className="text-xs font-medium">{opt.label}</span>
                <span className="text-[10px] text-zinc-500">{opt.description}</span>
              </OptionButton>
            ))}
          </div>
        </div>
      )}

      {/* Property Element */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Property Detail</label>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_ELEMENT_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.propertyElement === opt.value}
              onClick={() => updateConfig('propertyElement', opt.value)}
              className="px-3 py-2"
            >
              <span className="text-xs">{opt.label}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Property Color */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Property Color</label>
        <div className="flex flex-wrap gap-2">
          {REAL_ESTATE_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => updateConfig('primaryPropertyColor', color)}
              className={`w-8 h-8 rounded-lg border-2 transition-all ${
                config.primaryPropertyColor?.value === color.value
                  ? 'border-white scale-110'
                  : 'border-zinc-700 hover:border-zinc-500'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Toggle Options */}
      <div className="space-y-3 pt-2 border-t border-zinc-700">
        <label className="text-sm font-medium text-zinc-300">Property Elements</label>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.hasHouseIcon || false}
              onChange={(e) => updateConfig('hasHouseIcon', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
            />
            <Home className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-zinc-300">House Icon</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.hasKeyIcon || false}
              onChange={(e) => updateConfig('hasKeyIcon', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
            />
            <Key className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-zinc-300">Key Icon</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.hasLocationPin || false}
              onChange={(e) => updateConfig('hasLocationPin', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
            />
            <MapPin className="w-4 h-4 text-red-400" />
            <span className="text-xs text-zinc-300">Location Pin</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showLuxuryBadge || false}
              onChange={(e) => updateConfig('showLuxuryBadge', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-xs text-zinc-300">Luxury Badge</span>
          </label>
        </div>
      </div>
    </TabsContent>
  )
}
