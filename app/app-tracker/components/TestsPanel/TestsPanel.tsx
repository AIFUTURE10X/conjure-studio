'use client'

import { useState, useMemo } from 'react'
import { Plus, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TestItem, TestStatus, Priority, Platform, TestFilters as TFilters } from '../../constants/types'
import { TestItemCard } from './TestItemCard'
import { TestItemRow } from './TestItemRow'
import { TestItemModal } from './TestItemModal'
import { TestFilters } from './TestFilters'
import { TestCategoryGroup } from './TestCategoryGroup'
import { EmptyState } from '../shared'

interface TestsPanelProps {
  projectId: string
  featureId: string
  testItems: TestItem[]
  filters: TFilters
  onFiltersChange: (filters: TFilters) => void
  onFiltersReset: () => void
  onCreateTest: (
    projectId: string,
    featureId: string,
    title: string,
    steps: string,
    expectedResult: string,
    priority: Priority,
    platforms: Platform[],
    category?: string
  ) => void
  onUpdateTest: (testId: string, updates: Partial<TestItem>) => void
  onDeleteTest: (testId: string) => void
  onSetStatus: (testId: string, status: TestStatus) => void
}

export function TestsPanel({
  projectId,
  featureId,
  testItems,
  filters,
  onFiltersChange,
  onFiltersReset,
  onCreateTest,
  onUpdateTest,
  onDeleteTest,
  onSetStatus,
}: TestsPanelProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('create')
  const [selectedTest, setSelectedTest] = useState<TestItem | undefined>()
  const [allExpanded, setAllExpanded] = useState(false)

  // Filter tests for this feature
  const featureTests = testItems.filter(t => t.feature_id === featureId)
  const filteredTests = featureTests.filter(item => {
    if (filters.status !== 'all' && item.status !== filters.status) return false
    if (filters.priority !== 'all' && item.priority !== filters.priority) return false
    if (filters.platforms.length > 0 && !filters.platforms.some(p => item.platforms.includes(p))) return false
    if (filters.search && !item.title.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  // Stats
  const passedCount = featureTests.filter(t => t.status === 'passed').length
  const failedCount = featureTests.filter(t => t.status === 'failed').length

  // Extract unique categories from all feature tests for the dropdown
  const existingCategories = useMemo(() => {
    const cats = featureTests
      .filter(t => t.category && t.category !== 'Uncategorized')
      .map(t => t.category!)
    return [...new Set(cats)].sort()
  }, [featureTests])

  // Group tests by category
  const testsByCategory = useMemo(() => {
    const groups: Record<string, TestItem[]> = {}
    filteredTests.forEach(test => {
      const category = test.category || 'Uncategorized'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(test)
    })
    // Sort categories alphabetically, but keep "Uncategorized" at the end
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === 'Uncategorized') return 1
      if (b === 'Uncategorized') return -1
      return a.localeCompare(b)
    })
    return sortedKeys.map(key => ({ category: key, tests: groups[key] }))
  }, [filteredTests])

  const hasCategories = testsByCategory.some(g => g.category !== 'Uncategorized') || testsByCategory.length > 1

  const handleAddClick = () => {
    setSelectedTest(undefined)
    setModalMode('create')
    setModalOpen(true)
  }

  const handleViewClick = (test: TestItem) => {
    setSelectedTest(test)
    setModalMode('view')
    setModalOpen(true)
  }

  const handleEditClick = (test: TestItem) => {
    setSelectedTest(test)
    setModalMode('edit')
    setModalOpen(true)
  }

  const handleSave = (data: {
    title: string
    steps: string
    expected_result: string
    priority: Priority
    platforms: Platform[]
    notes: string
    status?: TestStatus
    category?: string
  }) => {
    if (selectedTest) {
      // Editing existing
      onUpdateTest(selectedTest.id, {
        title: data.title,
        steps: data.steps,
        expected_result: data.expected_result,
        priority: data.priority,
        platforms: data.platforms,
        notes: data.notes,
        category: data.category || undefined,
        ...(data.status && { status: data.status }),
      })
    } else {
      // Creating new
      onCreateTest(
        projectId,
        featureId,
        data.title,
        data.steps,
        data.expected_result,
        data.priority,
        data.platforms,
        data.category
      )
    }
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-white">QA Tests</h3>
          <p className="text-sm text-zinc-400">
            {passedCount} passed, {failedCount} failed of {featureTests.length} tests
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasCategories && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAllExpanded(!allExpanded)}
              className="border-zinc-700 text-zinc-400"
            >
              {allExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Collapse All
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Expand All
                </>
              )}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`border-zinc-700 ${showFilters ? 'text-[#c99850] border-[#c99850]/50' : 'text-zinc-400'}`}
          >
            <Filter className="w-4 h-4 mr-1" />
            Filter
          </Button>
          <Button
            onClick={handleAddClick}
            className="bg-[#c99850] hover:bg-[#dbb56e] text-black"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Test
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-4">
          <TestFilters
            filters={filters}
            onChange={onFiltersChange}
            onReset={onFiltersReset}
          />
        </div>
      )}

      {/* Test list */}
      {filteredTests.length === 0 ? (
        <EmptyState
          icon="🧪"
          title={featureTests.length === 0 ? 'No tests yet' : 'No matching tests'}
          description={featureTests.length === 0
            ? 'Add QA tests to verify this feature works correctly'
            : 'Try adjusting your filters'
          }
          action={featureTests.length === 0 ? (
            <Button
              variant="outline"
              onClick={handleAddClick}
              className="border-[#c99850]/50 text-[#c99850] hover:bg-[#c99850]/10"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add First Test
            </Button>
          ) : undefined}
        />
      ) : hasCategories ? (
        // Grouped view with collapsible categories - responsive grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {testsByCategory.map(group => (
            <TestCategoryGroup
              key={group.category}
              category={group.category}
              tests={group.tests}
              onStatusChange={onSetStatus}
              onView={handleViewClick}
              onEdit={handleEditClick}
              onDelete={onDeleteTest}
              expanded={allExpanded}
            />
          ))}
        </div>
      ) : (
        // Flat view for uncategorized tests - compact list
        <div className="rounded-lg overflow-hidden border border-zinc-700/50 divide-y divide-zinc-700/50">
          {filteredTests.map(test => (
            <TestItemRow
              key={test.id}
              testItem={test}
              onStatusChange={(status) => onSetStatus(test.id, status)}
              onView={() => handleViewClick(test)}
              onEdit={() => handleEditClick(test)}
              onDelete={() => onDeleteTest(test.id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <TestItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        testItem={selectedTest}
        mode={modalMode}
        existingCategories={existingCategories}
      />
    </div>
  )
}
