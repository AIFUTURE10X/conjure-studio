"use client"

import { TabsContent } from '@/components/ui/tabs'
import { Paintbrush } from 'lucide-react'
import { DotMatrixConfig } from '../../../constants/dot-matrix-config'
import { MaterialSelector, MaterialType } from '../MaterialSelector'

interface MaterialsTabProps {
  config: DotMatrixConfig
  updateConfig: <K extends keyof DotMatrixConfig>(key: K, value: DotMatrixConfig[K]) => void
}

export function MaterialsTab({ config, updateConfig }: MaterialsTabProps) {
  return (
    <TabsContent value="materials" className="mt-0 space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Paintbrush className="w-4 h-4 text-purple-400" />
          Material / Surface Type
        </label>
        <p className="text-xs text-zinc-500">
          Choose the surface material for your logo text
        </p>
      </div>

      <MaterialSelector
        selectedMaterial={config.materialType as MaterialType | null}
        onSelectMaterial={(material) => updateConfig('materialType', material)}
      />
    </TabsContent>
  )
}
