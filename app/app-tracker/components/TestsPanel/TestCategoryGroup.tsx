'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import type { TestItem, TestStatus } from '../../constants/types'
import { TestItemRow } from './TestItemRow'

interface TestCategoryGroupProps {
  category: string
  tests: TestItem[]
  onStatusChange: (testId: string, status: TestStatus) => void
  onView: (test: TestItem) => void
  onEdit: (test: TestItem) => void
  onDelete: (testId: string) => void
  expanded: boolean
}

export function TestCategoryGroup({
  category,
  tests,
  onStatusChange,
  onView,
  onEdit,
  onDelete,
  expanded,
}: TestCategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(expanded)

  // Sync with parent's expanded state
  useEffect(() => {
    setIsExpanded(expanded)
  }, [expanded])

  // Calculate stats
  const passedCount = tests.filter(t => t.status === 'passed').length
  const failedCount = tests.filter(t => t.status === 'failed').length
  const notTestedCount = tests.filter(t => t.status === 'not_tested').length
  const inProgressCount = tests.filter(t => t.status === 'in_progress').length
  const totalCount = tests.length

  // Determine header color based on status
  const allPassed = passedCount === totalCount
  const hasFailed = failedCount > 0
  const allNotTested = notTestedCount === totalCount

  const headerBgClass = allPassed
    ? 'bg-green-500/10 border-green-500/30'
    : hasFailed
    ? 'bg-red-500/10 border-red-500/30'
    : allNotTested
    ? 'bg-orange-500/10 border-orange-500/30'
    : 'bg-zinc-800/50 border-zinc-700'

  const StatusIcon = allPassed
    ? CheckCircle2
    : hasFailed
    ? AlertCircle
    : Circle

  const iconColor = allPassed
    ? 'text-green-400'
    : hasFailed
    ? 'text-red-400'
    : allNotTested
    ? 'text-orange-400'
    : 'text-zinc-400'

  return (
    <div className="w-full">
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-colors hover:bg-zinc-700/30 ${headerBgClass}`}
      >
        <div className="flex items-center gap-1.5">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
          )}
          <StatusIcon className={`w-4 h-4 shrink-0 ${iconColor}`} />
          <span className="text-sm font-medium text-white truncate">{category}</span>
          <span className="text-xs text-zinc-400 shrink-0">({totalCount})</span>
        </div>

        {/* Mini stats - compact */}
        <div className="flex items-center gap-2 text-[10px] shrink-0">
          {passedCount > 0 && (
            <span className="text-green-400">{passedCount} ✓</span>
          )}
          {failedCount > 0 && (
            <span className="text-red-400">{failedCount} ✗</span>
          )}
          {notTestedCount > 0 && (
            <span className="text-orange-400">{notTestedCount} ○</span>
          )}
        </div>
      </button>

      {/* Expandable Content - Compact List View */}
      {isExpanded && (
        <div className="mt-1 rounded-lg overflow-hidden border border-zinc-700/50 divide-y divide-zinc-700/50">
          {tests.map(test => (
            <TestItemRow
              key={test.id}
              testItem={test}
              onStatusChange={(status) => onStatusChange(test.id, status)}
              onView={() => onView(test)}
              onEdit={() => onEdit(test)}
              onDelete={() => onDelete(test.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
