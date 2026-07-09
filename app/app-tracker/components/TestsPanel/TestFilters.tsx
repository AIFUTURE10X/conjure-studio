'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { TestFilters as TFilters, TestStatus, Priority, Platform } from '../../constants/types'
import { TEST_STATUS_OPTIONS, PRIORITY_OPTIONS, PLATFORM_OPTIONS } from '../../constants/status-options'

interface TestFiltersProps {
  filters: TFilters
  onChange: (filters: TFilters) => void
  onReset: () => void
}

export function TestFilters({ filters, onChange, onReset }: TestFiltersProps) {
  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.platforms.length > 0 ||
    filters.search !== ''

  return (
    <div className="space-y-3 p-4 bg-zinc-800/30 rounded-lg">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search tests..."
          className="pl-9 bg-zinc-800 border-zinc-700 text-white"
        />
      </div>

      {/* Status filter */}
      <div>
        <label className="text-xs text-zinc-500 mb-1.5 block">Status</label>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => onChange({ ...filters, status: 'all' })}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              filters.status === 'all'
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All
          </button>
          {TEST_STATUS_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => onChange({ ...filters, status: option.value })}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                filters.status === option.value
                  ? `${option.bg} ${option.color}`
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Priority filter */}
      <div>
        <label className="text-xs text-zinc-500 mb-1.5 block">Priority</label>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => onChange({ ...filters, priority: 'all' })}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              filters.priority === 'all'
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All
          </button>
          {PRIORITY_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => onChange({ ...filters, priority: option.value })}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                filters.priority === option.value
                  ? `${option.bg} ${option.color}`
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Platform filter */}
      <div>
        <label className="text-xs text-zinc-500 mb-1.5 block">Platform</label>
        <div className="flex flex-wrap gap-1">
          {PLATFORM_OPTIONS.map(option => {
            const isActive = filters.platforms.includes(option.value)
            return (
              <button
                key={option.value}
                onClick={() => {
                  const newPlatforms = isActive
                    ? filters.platforms.filter(p => p !== option.value)
                    : [...filters.platforms, option.value]
                  onChange({ ...filters, platforms: newPlatforms })
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#c99850]/20 text-[#c99850]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Reset button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-zinc-400 hover:text-white"
        >
          <X className="w-3 h-3 mr-1" />
          Reset Filters
        </Button>
      )}
    </div>
  )
}
