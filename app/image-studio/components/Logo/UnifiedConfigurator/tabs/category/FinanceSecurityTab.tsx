"use client"

/**
 * FinanceSecurityTab - Finance category specific settings
 *
 * Used by presets: finance-growth, finance-shield
 * Provides settings for finance type, trust elements, growth symbols, security
 */

import { TabsContent } from '@/components/ui/tabs'
import { Shield, TrendingUp, Landmark, Lock } from 'lucide-react'
import {
  FinanceLogoConfig,
  FINANCE_TYPE_OPTIONS,
  TRUST_ELEMENT_OPTIONS,
  GROWTH_SYMBOL_OPTIONS,
  INSTITUTIONAL_STYLE_OPTIONS,
  SECURITY_LEVEL_OPTIONS,
  FINANCE_COLORS,
} from '../../../../../constants/preset-schemas/finance-schema'
import { OptionButton } from '../../../DotMatrixConfigurator/OptionButton'

interface FinanceSecurityTabProps {
  config: FinanceLogoConfig
  updateConfig: <K extends keyof FinanceLogoConfig>(key: K, value: FinanceLogoConfig[K]) => void
  toggleConfig: <K extends keyof FinanceLogoConfig>(key: K, value: FinanceLogoConfig[K]) => void
}

export function FinanceSecurityTab({ config, updateConfig, toggleConfig }: FinanceSecurityTabProps) {
  return (
    <TabsContent value="finance-security" className="mt-0 space-y-6">
      {/* Finance Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Landmark className="w-4 h-4 text-blue-400" />
          Finance Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {FINANCE_TYPE_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.financeType === opt.value}
              onClick={() => updateConfig('financeType', opt.value)}
              className="flex flex-col items-start p-3"
            >
              <span className="text-xs font-medium">{opt.label}</span>
              <span className="text-[10px] text-zinc-500">{opt.description}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Institutional Style */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Institutional Style</label>
        <div className="grid grid-cols-3 gap-2">
          {INSTITUTIONAL_STYLE_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.institutionalStyle === opt.value}
              onClick={() => updateConfig('institutionalStyle', opt.value)}
              className="flex flex-col items-start p-3"
            >
              <span className="text-xs font-medium">{opt.label}</span>
              <span className="text-[10px] text-zinc-500">{opt.description}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Trust Element */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          Trust Element
        </label>
        <div className="grid grid-cols-3 gap-2">
          {TRUST_ELEMENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateConfig('trustElement', opt.value)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                config.trustElement === opt.value
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <span className="text-lg">{opt.emoji}</span>
              <span className="text-xs text-white">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Growth Symbol */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          Growth Symbol
        </label>
        <div className="grid grid-cols-3 gap-2">
          {GROWTH_SYMBOL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateConfig('growthSymbol', opt.value)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                config.growthSymbol === opt.value
                  ? 'border-green-500 bg-green-500/20'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <span className="text-lg">{opt.emoji}</span>
              <span className="text-xs text-white">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Security Level */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400" />
          Security Level
        </label>
        <div className="flex flex-wrap gap-2">
          {SECURITY_LEVEL_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.securityLevel === opt.value}
              onClick={() => updateConfig('securityLevel', opt.value)}
              className="px-3 py-2"
            >
              <span className="text-xs">{opt.label}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Finance Color */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Primary Color</label>
        <div className="flex flex-wrap gap-2">
          {FINANCE_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => updateConfig('primaryFinanceColor', color)}
              className={`w-8 h-8 rounded-lg border-2 transition-all ${
                config.primaryFinanceColor?.value === color.value
                  ? 'border-white scale-110'
                  : 'border-zinc-700 hover:border-zinc-500'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Established Year */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.showEstablishedYear || false}
            onChange={(e) => updateConfig('showEstablishedYear', e.target.checked)}
            className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-zinc-300">Show Established Year</span>
        </label>
        {config.showEstablishedYear && (
          <input
            type="text"
            value={config.establishedYear || ''}
            onChange={(e) => updateConfig('establishedYear', e.target.value)}
            placeholder="e.g., 1985"
            maxLength={4}
            className="w-24 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      {/* Toggle Options */}
      <div className="space-y-3 pt-2 border-t border-zinc-700">
        <label className="text-sm font-medium text-zinc-300">Additional Elements</label>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.hasGrowthIndicator || false}
              onChange={(e) => updateConfig('hasGrowthIndicator', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-xs text-zinc-300">Growth Indicator</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.hasShieldElement || false}
              onChange={(e) => updateConfig('hasShieldElement', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-xs text-zinc-300">Shield Element</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.hasCoinElement || false}
              onChange={(e) => updateConfig('hasCoinElement', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-xs text-zinc-300">Coin Element</span>
          </label>
        </div>
      </div>
    </TabsContent>
  )
}
