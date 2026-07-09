"use client"

import {
  MaterialType,
  MaterialOption,
  MATERIAL_OPTIONS,
  MATERIAL_CATEGORIES,
  getMaterialById,
} from '../../constants/material-options'

// Re-export types and helpers for backwards compatibility
export type { MaterialType, MaterialOption }
export { MATERIAL_OPTIONS, MATERIAL_CATEGORIES, getMaterialById }

// ============================================
// COMPONENT PROPS
// ============================================

interface MaterialSelectorProps {
  selectedMaterial: MaterialType | null
  onSelectMaterial: (material: MaterialType | null) => void
}

// ============================================
// COMPONENT
// ============================================

export function MaterialSelector({
  selectedMaterial,
  onSelectMaterial,
}: MaterialSelectorProps) {

  const handleMaterialClick = (materialId: MaterialType) => {
    if (selectedMaterial === materialId) {
      onSelectMaterial(null)
    } else {
      onSelectMaterial(materialId)
    }
  }

  const selectedMaterialInfo = MATERIAL_OPTIONS.find(m => m.id === selectedMaterial)

  return (
    <div className="space-y-4">
      {/* Material Grid */}
      <div className="grid grid-cols-4 gap-2">
        {MATERIAL_OPTIONS.map((material) => (
          <button
            key={material.id}
            onClick={() => handleMaterialClick(material.id)}
            className={`group relative p-2 rounded-lg border transition-all ${
              selectedMaterial === material.id
                ? 'border-purple-500 bg-purple-500/20 ring-1 ring-purple-500'
                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800'
            }`}
          >
            {/* Material Preview Swatch */}
            <div
              className="w-full aspect-square rounded-md mb-1.5 border border-zinc-600"
              style={{ background: material.previewGradient }}
            />

            {/* Material Name */}
            <div className="text-[10px] text-white truncate text-center font-medium">
              {material.name}
            </div>

            {/* Icon Badge */}
            <div className="absolute top-1 right-1 text-xs opacity-60 group-hover:opacity-100">
              {material.icon}
            </div>

            {/* Tooltip on Hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {material.description}
            </div>
          </button>
        ))}
      </div>

      {/* Selected Material Info */}
      {selectedMaterialInfo && (
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-md border border-purple-500/50"
              style={{ background: selectedMaterialInfo.previewGradient }}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{selectedMaterialInfo.name}</span>
                <span className="text-xs">{selectedMaterialInfo.icon}</span>
              </div>
              <p className="text-xs text-zinc-400">{selectedMaterialInfo.description}</p>
            </div>
            <button
              onClick={() => onSelectMaterial(null)}
              className="text-xs text-zinc-500 hover:text-white px-2 py-1"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
