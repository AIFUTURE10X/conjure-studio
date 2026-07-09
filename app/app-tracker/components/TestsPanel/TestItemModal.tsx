'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, X } from 'lucide-react'
import type { TestItem, TestStatus, Priority, Platform } from '../../constants/types'
import { TEST_STATUS_OPTIONS, PRIORITY_OPTIONS, PLATFORM_OPTIONS } from '../../constants/status-options'

interface TestItemModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: {
    title: string
    steps: string
    expected_result: string
    priority: Priority
    platforms: Platform[]
    notes: string
    status?: TestStatus
    category?: string
  }) => void
  testItem?: TestItem // If provided, we're editing/viewing
  mode?: 'view' | 'edit' | 'create'
  existingCategories?: string[]
}

export function TestItemModal({ open, onClose, onSave, testItem, mode = 'create', existingCategories = [] }: TestItemModalProps) {
  const [title, setTitle] = useState('')
  const [steps, setSteps] = useState('')
  const [expectedResult, setExpectedResult] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [platforms, setPlatforms] = useState<Platform[]>(['web'])
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<TestStatus>('not_tested')
  const [currentMode, setCurrentMode] = useState(mode)
  const [category, setCategory] = useState('')
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const categoryInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (testItem) {
      setTitle(testItem.title)
      setSteps(testItem.steps)
      setExpectedResult(testItem.expected_result)
      setPriority(testItem.priority)
      setPlatforms(testItem.platforms)
      setNotes(testItem.notes)
      setStatus(testItem.status)
      setCategory(testItem.category || '')
    } else {
      setTitle('')
      setSteps('')
      setExpectedResult('')
      setPriority('medium')
      setPlatforms(['web'])
      setNotes('')
      setStatus('not_tested')
      setCategory('')
    }
    setCurrentMode(mode)
    setShowCategoryDropdown(false)
  }, [testItem, mode, open])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        categoryInputRef.current &&
        !categoryInputRef.current.contains(event.target as Node)
      ) {
        setShowCategoryDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      steps: steps.trim(),
      expected_result: expectedResult.trim(),
      priority,
      platforms,
      notes: notes.trim(),
      status: testItem ? status : undefined,
      category: category.trim() || undefined,
    })
    onClose()
  }

  // Filter categories based on input
  const filteredCategories = existingCategories.filter(cat =>
    cat.toLowerCase().includes(category.toLowerCase())
  )

  const handleSelectCategory = (cat: string) => {
    setCategory(cat)
    setShowCategoryDropdown(false)
  }

  const togglePlatform = (platform: Platform) => {
    setPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const isViewMode = currentMode === 'view'
  const isEditing = currentMode === 'edit' || (currentMode === 'create' && !testItem)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {currentMode === 'create' ? 'Add New Test' : currentMode === 'edit' ? 'Edit Test' : 'Test Details'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Title</label>
            {isViewMode ? (
              <p className="text-white">{title}</p>
            ) : (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are you testing?"
                className="bg-zinc-800 border-zinc-700 text-white"
                autoFocus
              />
            )}
          </div>

          {/* Steps */}
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Test Steps</label>
            {isViewMode ? (
              <pre className="text-sm text-zinc-300 whitespace-pre-wrap bg-zinc-800 p-3 rounded-md">{steps || 'No steps defined'}</pre>
            ) : (
              <Textarea
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder="1. Do this&#10;2. Then this&#10;3. Check that"
                className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
              />
            )}
          </div>

          {/* Expected Result */}
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Expected Result</label>
            {isViewMode ? (
              <p className="text-zinc-300 bg-zinc-800 p-3 rounded-md">{expectedResult || 'No expected result defined'}</p>
            ) : (
              <Textarea
                value={expectedResult}
                onChange={(e) => setExpectedResult(e.target.value)}
                placeholder="What should happen..."
                className="bg-zinc-800 border-zinc-700 text-white min-h-[60px]"
              />
            )}
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Category</label>
            {isViewMode ? (
              <p className="text-zinc-300 bg-zinc-800 p-3 rounded-md">{category || 'Uncategorized'}</p>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Input
                    ref={categoryInputRef}
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value)
                      setShowCategoryDropdown(true)
                    }}
                    onFocus={() => setShowCategoryDropdown(true)}
                    placeholder="Select or type a category..."
                    className="bg-zinc-800 border-zinc-700 text-white pr-16"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {category && (
                      <button
                        type="button"
                        onClick={() => setCategory('')}
                        className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Dropdown */}
                {showCategoryDropdown && (filteredCategories.length > 0 || category.trim()) && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-50 mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-md shadow-lg max-h-[150px] overflow-y-auto"
                  >
                    {filteredCategories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleSelectCategory(cat)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 transition-colors ${
                          cat === category ? 'bg-zinc-700 text-[#c99850]' : 'text-zinc-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                    {category.trim() && !existingCategories.includes(category.trim()) && (
                      <button
                        type="button"
                        onClick={() => {
                          setCategory(category.trim())
                          setShowCategoryDropdown(false)
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-[#c99850] hover:bg-zinc-700 transition-colors border-t border-zinc-700"
                      >
                        + Create "{category.trim()}"
                      </button>
                    )}
                    {filteredCategories.length === 0 && !category.trim() && existingCategories.length === 0 && (
                      <p className="px-3 py-2 text-sm text-zinc-500">Type to create a new category</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status (only for editing existing) */}
          {testItem && (
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Status</label>
              <div className="flex flex-wrap gap-2">
                {TEST_STATUS_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !isViewMode && setStatus(option.value)}
                    disabled={isViewMode}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      status === option.value
                        ? `${option.bg} ${option.color} border border-current`
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                    } ${isViewMode ? 'cursor-default' : ''}`}
                  >
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Priority</label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => !isViewMode && setPriority(option.value)}
                  disabled={isViewMode}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    priority === option.value
                      ? `${option.bg} ${option.color} border border-current`
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                  } ${isViewMode ? 'cursor-default' : ''}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Platforms</label>
            <div className="flex gap-2">
              {PLATFORM_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => !isViewMode && togglePlatform(option.value)}
                  disabled={isViewMode}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    platforms.includes(option.value)
                      ? 'bg-[#c99850]/20 text-[#c99850] border border-[#c99850]/50'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                  } ${isViewMode ? 'cursor-default' : ''}`}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes (only in view/edit for existing) */}
          {testItem && (
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Notes</label>
              {isViewMode ? (
                <p className="text-zinc-300 bg-zinc-800 p-3 rounded-md">{notes || 'No notes'}</p>
              ) : (
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes about test results..."
                  className="bg-zinc-800 border-zinc-700 text-white min-h-[60px]"
                />
              )}
            </div>
          )}

          <DialogFooter>
            {isViewMode ? (
              <>
                <Button type="button" variant="ghost" onClick={onClose}>
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => setCurrentMode('edit')}
                  className="bg-[#c99850] hover:bg-[#dbb56e] text-black"
                >
                  Edit
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!title.trim()}
                  className="bg-[#c99850] hover:bg-[#dbb56e] text-black"
                >
                  {testItem ? 'Save Changes' : 'Add Test'}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
