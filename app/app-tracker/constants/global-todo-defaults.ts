// Global Todo Category Configurations

import type { GlobalTodoCategory } from './types'

export interface CategoryConfig {
  key: GlobalTodoCategory
  label: string
  icon: string
  color: string
}

export const GLOBAL_TODO_CATEGORIES: CategoryConfig[] = [
  { key: 'auth', label: 'Authentication', icon: '🔐', color: 'text-blue-400' },
  { key: 'payments', label: 'Payments', icon: '💳', color: 'text-green-400' },
  { key: 'database', label: 'Database', icon: '🗄️', color: 'text-purple-400' },
  { key: 'ui', label: 'User Interface', icon: '🎨', color: 'text-pink-400' },
  { key: 'api', label: 'API', icon: '🔌', color: 'text-orange-400' },
  { key: 'security', label: 'Security', icon: '🛡️', color: 'text-red-400' },
  { key: 'performance', label: 'Performance', icon: '⚡', color: 'text-yellow-400' },
  { key: 'testing', label: 'Testing', icon: '🧪', color: 'text-cyan-400' },
  { key: 'deployment', label: 'Deployment', icon: '🚀', color: 'text-indigo-400' },
  { key: 'other', label: 'Other', icon: '📋', color: 'text-zinc-400' },
]

export const getCategoryConfig = (category: GlobalTodoCategory): CategoryConfig => {
  return GLOBAL_TODO_CATEGORIES.find(c => c.key === category) || GLOBAL_TODO_CATEGORIES[9]
}

export const getCategoryByKey = (key: string): CategoryConfig | undefined => {
  return GLOBAL_TODO_CATEGORIES.find(c => c.key === key)
}

// Default filter state
export const DEFAULT_GLOBAL_TODO_FILTERS = {
  status: 'all' as const,
  priority: 'all' as const,
  category: 'all' as const,
  search: '',
}
