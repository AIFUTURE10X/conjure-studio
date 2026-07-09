// App Progress & QA Tracker - TypeScript Types

// ===== STATUS ENUMS =====
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TestStatus = 'not_tested' | 'in_progress' | 'passed' | 'failed'
export type Priority = 'low' | 'medium' | 'high'
export type Platform = 'ios' | 'android' | 'web'

// ===== PROJECT =====
export interface Project {
  id: string
  name: string
  description: string
  icon: string // emoji
  created_at: number
  updated_at: number
}

// Project with computed progress values
export interface ProjectWithProgress extends Project {
  buildProgress: number // 0-100
  testProgress: number // 0-100
  overallProgress: number // average of both
  taskCount: number
  testCount: number
}

// ===== FEATURE (Sub-category within project) =====
export interface Feature {
  id: string
  project_id: string
  name: string
  description: string
  icon: string // emoji
  order: number
  created_at: number
}

// Feature with computed progress
export interface FeatureWithProgress extends Feature {
  buildProgress: number
  testProgress: number
  taskCount: number
  testCount: number
}

// ===== TASK (Dev to-do) =====
export interface Task {
  id: string
  project_id: string
  feature_id: string
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  created_at: number
  updated_at: number
}

// ===== TEST ITEM (QA checklist item) =====
export interface TestItem {
  id: string
  project_id: string
  feature_id: string
  category?: string // Optional category for grouping tests
  title: string
  steps: string
  expected_result: string
  status: TestStatus
  priority: Priority
  platforms: Platform[]
  notes: string
  created_at: number
  updated_at: number
}

// ===== TEMPLATE =====
export interface Template {
  id: string
  name: string
  description: string
  icon: string
  is_builtin: boolean
  created_at: number
  features: TemplateFeature[]
}

export interface TemplateFeature {
  name: string
  description: string
  icon: string
  items: TemplateTestItem[]
}

export interface TemplateTestItem {
  title: string
  steps: string
  expected_result: string
  priority: Priority
  platforms: Platform[]
}

// ===== FILTER TYPES =====
export interface TaskFilters {
  status: TaskStatus | 'all'
  priority: Priority | 'all'
  search: string
}

export interface TestFilters {
  status: TestStatus | 'all'
  priority: Priority | 'all'
  platforms: Platform[]
  search: string
}

// ===== VIEW TYPE =====
export type ActiveView = 'tasks' | 'tests' | 'settings' | 'global-todos'

// ===== GLOBAL TODO TYPES =====
export type GlobalTodoCategory =
  | 'auth'
  | 'payments'
  | 'database'
  | 'ui'
  | 'api'
  | 'security'
  | 'performance'
  | 'testing'
  | 'deployment'
  | 'other'

// The main global todo - exists independently of projects
export interface GlobalTodo {
  id: string
  title: string
  description: string
  category: GlobalTodoCategory
  priority: Priority
  apply_to_all: boolean  // If true, automatically applies to ALL projects
  created_at: number
  updated_at: number
}

// Assignment linking a global todo to a specific project
export interface GlobalTodoAssignment {
  id: string
  global_todo_id: string      // Reference to the GlobalTodo
  project_id: string          // Reference to the Project
  status: TaskStatus          // Per-project completion status (todo/in_progress/done)
  notes: string               // Optional project-specific notes
  assigned_at: number
  completed_at: number | null
}

// Filter type for global todos panel
export interface GlobalTodoFilters {
  status: TaskStatus | 'all'
  priority: Priority | 'all'
  category: GlobalTodoCategory | 'all'
  search: string
}

// ===== APP STATE =====
export interface AppTrackerState {
  projects: Project[]
  features: Feature[]
  tasks: Task[]
  testItems: TestItem[]
  templates: Template[]
  activeProjectId: string | null
  activeFeatureId: string | null
  activeView: ActiveView
  isInitialized: boolean
}

// ===== APP SETTINGS =====
export interface AppSettings {
  ui: {
    compactMode: boolean
    defaultView: 'tasks' | 'tests'
    showProgressBars: boolean
  }
  features: {
    autoExpandCategories: boolean
    confirmBeforeDelete: boolean
    showCompletedTasks: boolean
  }
  api: {
    // Placeholder for future API integrations
  }
}

// ===== STORAGE KEYS =====
export const STORAGE_KEYS = {
  PROJECTS: 'app-tracker-projects',
  FEATURES: 'app-tracker-features',
  TASKS: 'app-tracker-tasks',
  TEST_ITEMS: 'app-tracker-items',
  TEMPLATES: 'app-tracker-templates',
  ACTIVE_PROJECT: 'app-tracker-active-project',
  ACTIVE_FEATURE: 'app-tracker-active-feature',
  INITIALIZED: 'app-tracker-initialized',
  SETTINGS: 'app-tracker-settings',
  GLOBAL_TODOS: 'app-tracker-global-todos',
  GLOBAL_TODO_ASSIGNMENTS: 'app-tracker-global-todo-assignments',
} as const
