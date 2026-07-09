"use client"

/**
 * TabRenderer Component
 *
 * Dynamically renders the correct tab component based on tab definition.
 * Handles both shared tabs (Brand, Colors, etc.) and category-specific tabs.
 */

import { TabsContent } from '@/components/ui/tabs'
import { TabDefinition, UnifiedLogoConfig } from '../../../constants/preset-schemas'

// Import shared tabs (these will be moved from DotMatrixConfigurator)
// For now, we'll create placeholder renders that delegate to existing components
import { BrandTab } from '../DotMatrixConfigurator/BrandTab'
import { ColorsTab } from '../DotMatrixConfigurator/ColorsTab'
import { TypographyTab } from '../DotMatrixConfigurator/TypographyTab'
import { LayoutTab } from '../DotMatrixConfigurator/LayoutTab'
import { EffectsTab } from '../DotMatrixConfigurator/EffectsTab'
import { AdvancedTab } from '../DotMatrixConfigurator/AdvancedTab'
import { DotsTab } from '../DotMatrixConfigurator/DotsTab'

// Category-specific tabs
import { TechElementsTab } from './tabs/category/TechElementsTab'
import { LuxuryMaterialsTab } from './tabs/category/LuxuryMaterialsTab'
import { NatureOrganicsTab } from './tabs/category/NatureOrganicsTab'
import { FoodCulinaryTab } from './tabs/category/FoodCulinaryTab'
import { RealEstatePropertyTab } from './tabs/category/RealEstatePropertyTab'
import { FinanceSecurityTab } from './tabs/category/FinanceSecurityTab'
import { CreativeArtsTab } from './tabs/category/CreativeArtsTab'
import { SportsEnergyTab } from './tabs/category/SportsEnergyTab'

interface TabRendererProps {
  tab: TabDefinition
  config: UnifiedLogoConfig
  updateConfig: <K extends keyof UnifiedLogoConfig>(key: K, value: UnifiedLogoConfig[K]) => void
  toggleConfig: <K extends keyof UnifiedLogoConfig>(key: K, value: UnifiedLogoConfig[K]) => void
  applyIndustryPreset?: (presetId: string) => void
  presetId: string
}

export function TabRenderer({
  tab,
  config,
  updateConfig,
  toggleConfig,
  applyIndustryPreset,
  presetId,
}: TabRendererProps) {
  // Cast config to any for compatibility with existing tab components
  // This is temporary until we fully migrate the tab components
  const configAny = config as any

  // Render the appropriate tab based on component name
  switch (tab.component) {
    case 'BrandTab':
      return (
        <BrandTab
          config={configAny}
          updateConfig={updateConfig as any}
          applyIndustryPreset={applyIndustryPreset || (() => {})}
        />
      )

    case 'ColorsTab':
      return (
        <ColorsTab
          config={configAny}
          toggleConfig={toggleConfig as any}
          updateConfig={updateConfig as any}
        />
      )

    case 'TypographyTab':
      return (
        <TypographyTab
          config={configAny}
          toggleConfig={toggleConfig as any}
          updateConfig={updateConfig as any}
        />
      )

    case 'LayoutTab':
      return (
        <LayoutTab
          config={configAny}
          toggleConfig={toggleConfig as any}
          updateConfig={updateConfig as any}
        />
      )

    case 'EffectsTab':
      return (
        <EffectsTab
          config={configAny}
          toggleConfig={toggleConfig as any}
          updateConfig={updateConfig as any}
        />
      )

    case 'AdvancedTab':
      return (
        <AdvancedTab
          config={configAny}
          toggleConfig={toggleConfig as any}
          updateConfig={updateConfig as any}
        />
      )

    case 'DotsTab':
      return (
        <DotsTab
          config={configAny}
          toggleConfig={toggleConfig as any}
          updateConfig={updateConfig as any}
        />
      )

    // Category-specific tabs - fully implemented
    case 'TechElementsTab':
      return (
        <TechElementsTab
          config={configAny}
          updateConfig={updateConfig as any}
          toggleConfig={toggleConfig as any}
        />
      )

    case 'LuxuryMaterialsTab':
      return (
        <LuxuryMaterialsTab
          config={configAny}
          updateConfig={updateConfig as any}
          toggleConfig={toggleConfig as any}
        />
      )

    case 'NatureOrganicsTab':
      return (
        <NatureOrganicsTab
          config={configAny}
          updateConfig={updateConfig as any}
          toggleConfig={toggleConfig as any}
        />
      )

    case 'FoodCulinaryTab':
      return (
        <FoodCulinaryTab
          config={configAny}
          updateConfig={updateConfig as any}
          toggleConfig={toggleConfig as any}
        />
      )

    case 'RealEstatePropertyTab':
      return (
        <RealEstatePropertyTab
          config={configAny}
          updateConfig={updateConfig as any}
          toggleConfig={toggleConfig as any}
        />
      )

    case 'FinanceSecurityTab':
      return (
        <FinanceSecurityTab
          config={configAny}
          updateConfig={updateConfig as any}
          toggleConfig={toggleConfig as any}
        />
      )

    case 'CreativeArtsTab':
      return (
        <CreativeArtsTab
          config={configAny}
          updateConfig={updateConfig as any}
          toggleConfig={toggleConfig as any}
        />
      )

    case 'SportsEnergyTab':
      return (
        <SportsEnergyTab
          config={configAny}
          updateConfig={updateConfig as any}
          toggleConfig={toggleConfig as any}
        />
      )

    default:
      return (
        <TabsContent value={tab.id} className="mt-0 space-y-6">
          <PlaceholderTab tabName={tab.label} description="Tab content coming soon" />
        </TabsContent>
      )
  }
}

// Placeholder component for tabs that haven't been implemented yet
function PlaceholderTab({ tabName, description }: { tabName: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
        <span className="text-2xl">🚧</span>
      </div>
      <h3 className="text-lg font-medium text-white mb-2">{tabName}</h3>
      <p className="text-sm text-zinc-400 max-w-sm">{description}</p>
      <p className="text-xs text-zinc-500 mt-4">Coming in Phase 3</p>
    </div>
  )
}
