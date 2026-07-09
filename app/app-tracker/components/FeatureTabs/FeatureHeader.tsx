'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Feature, Task, TestItem } from '../../constants/types'
import { ProgressSummary } from '../Progress'
import { calculateFeatureProgress } from '../../hooks/useProgress'

interface FeatureHeaderProps {
  feature: Feature
  tasks: Task[]
  testItems: TestItem[]
  activeView: 'tasks' | 'tests'
  onViewChange: (view: 'tasks' | 'tests') => void
  onEdit?: () => void
  onDelete?: () => void
}

export function FeatureHeader({
  feature,
  tasks,
  testItems,
  activeView,
  onViewChange,
  onEdit,
  onDelete,
}: FeatureHeaderProps) {
  const featureTasks = tasks.filter(t => t.feature_id === feature.id)
  const featureTests = testItems.filter(t => t.feature_id === feature.id)
  const progress = calculateFeatureProgress(tasks, testItems, feature.id)

  return (
    <div className="px-6 py-4 bg-zinc-900 border-b border-zinc-800">
      {/* Feature info row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{feature.icon}</span>
          <div>
            <h2 className="text-lg font-semibold text-white">{feature.name}</h2>
            {feature.description && (
              <p className="text-sm text-zinc-400">{feature.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <Button variant="ghost" size="icon" onClick={onEdit} className="text-zinc-400 hover:text-white h-8 w-8">
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-zinc-400 hover:text-red-400 h-8 w-8">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress row */}
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1 max-w-md">
          <ProgressSummary
            buildProgress={progress.buildProgress}
            testProgress={progress.testProgress}
            size="md"
          />
        </div>

        {/* Tasks/Tests toggle */}
        <div className="flex items-center bg-zinc-800 rounded-lg p-1">
          <button
            onClick={() => onViewChange('tasks')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeView === 'tasks'
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Tasks ({featureTasks.length})
          </button>
          <button
            onClick={() => onViewChange('tests')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeView === 'tests'
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Tests ({featureTests.length})
          </button>
        </div>
      </div>
    </div>
  )
}
