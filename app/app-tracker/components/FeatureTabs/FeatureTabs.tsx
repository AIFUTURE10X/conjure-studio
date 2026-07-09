'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Feature, Task, TestItem } from '../../constants/types'
import { calculateFeatureProgress } from '../../hooks/useProgress'

interface FeatureTabsProps {
  features: Feature[]
  tasks: Task[]
  testItems: TestItem[]
  activeFeatureId: string | null
  onSelectFeature: (featureId: string) => void
  onAddFeature: () => void
}

export function FeatureTabs({
  features,
  tasks,
  testItems,
  activeFeatureId,
  onSelectFeature,
  onAddFeature,
}: FeatureTabsProps) {
  if (features.length === 0) {
    return (
      <div className="flex items-center justify-center px-4 py-3 bg-zinc-800/50">
        <Button
          variant="outline"
          size="sm"
          onClick={onAddFeature}
          className="border-dashed border-zinc-600 text-zinc-400 hover:border-[#c99850] hover:text-[#c99850]"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Feature
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-zinc-800/50 overflow-x-auto">
      <span className="text-xs text-zinc-500 mr-2">Features:</span>
      {features.map(feature => {
        const isActive = feature.id === activeFeatureId
        const progress = calculateFeatureProgress(tasks, testItems, feature.id)

        return (
          <button
            key={feature.id}
            onClick={() => onSelectFeature(feature.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
              isActive
                ? 'bg-[#c99850]/20 text-[#c99850] border border-[#c99850]/50'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
            }`}
          >
            <span>{feature.icon}</span>
            <span className="whitespace-nowrap">{feature.name}</span>
            {(progress.taskCount > 0 || progress.testCount > 0) && (
              <span className={`text-xs ${isActive ? 'text-[#c99850]/70' : 'text-zinc-500'}`}>
                ({Math.round((progress.buildProgress + progress.testProgress) / 2)}%)
              </span>
            )}
          </button>
        )
      })}

      <Button
        variant="ghost"
        size="sm"
        onClick={onAddFeature}
        className="text-zinc-500 hover:text-[#c99850] ml-1 h-7 px-2"
      >
        <Plus className="w-3 h-3" />
      </Button>
    </div>
  )
}
