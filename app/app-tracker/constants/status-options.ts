// Status, Priority, and Platform options for the App Tracker

import type { TaskStatus, TestStatus, Priority, Platform } from './types'

// ===== TASK STATUS =====
export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string; icon: string; color: string }[] = [
  { value: 'todo', label: 'To Do', icon: '○', color: 'text-zinc-400' },
  { value: 'in_progress', label: 'In Progress', icon: '→', color: 'text-blue-400' },
  { value: 'done', label: 'Done', icon: '✓', color: 'text-green-400' },
]

// ===== TEST STATUS =====
export const TEST_STATUS_OPTIONS: { value: TestStatus; label: string; icon: string; color: string; bg: string }[] = [
  { value: 'not_tested', label: 'Not Tested', icon: '○', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  { value: 'in_progress', label: 'In Progress', icon: '→', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { value: 'passed', label: 'Passed', icon: '✓', color: 'text-green-400', bg: 'bg-green-500/20' },
  { value: 'failed', label: 'Failed', icon: '✗', color: 'text-red-400', bg: 'bg-red-500/20' },
]

// ===== PRIORITY =====
export const PRIORITY_OPTIONS: { value: Priority; label: string; color: string; bg: string }[] = [
  { value: 'low', label: 'Low', color: 'text-zinc-400', bg: 'bg-zinc-700' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  { value: 'high', label: 'High', color: 'text-red-400', bg: 'bg-red-500/20' },
]

// ===== PLATFORM =====
export const PLATFORM_OPTIONS: { value: Platform; label: string; icon: string; color: string }[] = [
  { value: 'web', label: 'Web', icon: '🌐', color: 'text-blue-400' },
  { value: 'ios', label: 'iOS', icon: '🍎', color: 'text-zinc-300' },
  { value: 'android', label: 'Android', icon: '🤖', color: 'text-green-400' },
]

// ===== HELPER FUNCTIONS =====
export function getTaskStatusOption(status: TaskStatus) {
  return TASK_STATUS_OPTIONS.find(opt => opt.value === status) || TASK_STATUS_OPTIONS[0]
}

export function getTestStatusOption(status: TestStatus) {
  return TEST_STATUS_OPTIONS.find(opt => opt.value === status) || TEST_STATUS_OPTIONS[0]
}

export function getPriorityOption(priority: Priority) {
  return PRIORITY_OPTIONS.find(opt => opt.value === priority) || PRIORITY_OPTIONS[0]
}

export function getPlatformOption(platform: Platform) {
  return PLATFORM_OPTIONS.find(opt => opt.value === platform)
}
