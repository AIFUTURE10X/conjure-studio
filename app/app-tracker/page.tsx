'use client'

import { useState } from 'react'
import { useAppTracker } from './hooks/useAppTracker'
import { useAppSettings } from './hooks/useAppSettings'
import { AppTrackerHeader } from './components/AppTrackerHeader'
import { ProjectTabs } from './components/ProjectTabs'
import { FeatureTabs, FeatureHeader } from './components/FeatureTabs'
import { TasksPanel } from './components/TasksPanel'
import { TestsPanel } from './components/TestsPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { GlobalTodosPanel } from './components/GlobalTodos'
import { AddProjectDialog, AddFeatureDialog, ConfirmDialog } from './components/Dialogs'
import { EmptyState } from './components/shared'
import { Loader2 } from 'lucide-react'

export default function AppTrackerPage() {
  const tracker = useAppTracker()
  const { settings, updateSetting, resetSettings } = useAppSettings()

  // Dialog states
  const [showAddProject, setShowAddProject] = useState(false)
  const [showAddFeature, setShowAddFeature] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'project' | 'feature'; id: string } | null>(null)

  // Get current project and feature
  const currentProject = tracker.activeProjectId
    ? tracker.projects.find(p => p.id === tracker.activeProjectId)
    : null

  const projectFeatures = tracker.activeProjectId
    ? tracker.getFeaturesByProject(tracker.activeProjectId)
    : []

  const currentFeature = tracker.activeFeatureId
    ? projectFeatures.find(f => f.id === tracker.activeFeatureId)
    : null

  // Loading state
  if (tracker.isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading tracker...</span>
        </div>
      </div>
    )
  }

  // Handlers
  const handleAddProject = (name: string, description: string, icon: string) => {
    const project = tracker.createProject(name, description, icon)
    tracker.setActiveProjectId(project.id)
  }

  const handleAddFeature = (name: string, description: string, icon: string) => {
    if (!tracker.activeProjectId) return
    const feature = tracker.createFeature(tracker.activeProjectId, name, description, icon)
    tracker.setActiveFeatureId(feature.id)
  }

  const handleDeleteConfirm = () => {
    if (!deleteConfirm) return
    if (deleteConfirm.type === 'project') {
      tracker.deleteProject(deleteConfirm.id)
    } else {
      tracker.deleteFeature(deleteConfirm.id)
    }
    setDeleteConfirm(null)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <AppTrackerHeader
        onAddProject={() => setShowAddProject(true)}
        onOpenSettings={() => tracker.setActiveView('settings')}
        onOpenGlobalTodos={() => tracker.setActiveView('global-todos')}
        onResetToDefaults={tracker.resetToDefaults}
      />

      {/* Project tabs */}
      {tracker.projects.length > 0 && (
        <ProjectTabs
          projects={tracker.projects}
          tasks={tracker.tasks}
          testItems={tracker.testItems}
          activeProjectId={tracker.activeProjectId}
          onSelectProject={tracker.setActiveProjectId}
          onAddProject={() => setShowAddProject(true)}
          onDeleteProject={(id) => setDeleteConfirm({ type: 'project', id })}
        />
      )}

      {/* Main content */}
      {tracker.activeView === 'settings' ? (
        <SettingsPanel
          settings={settings}
          onUpdateSetting={updateSetting}
          onResetSettings={resetSettings}
        />
      ) : tracker.activeView === 'global-todos' ? (
        <GlobalTodosPanel
          projects={tracker.projects}
          onBack={() => tracker.setActiveView('tasks')}
        />
      ) : tracker.projects.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon="📋"
            title="No projects yet"
            description="Create your first project to start tracking progress and QA testing"
            action={
              <button
                onClick={() => setShowAddProject(true)}
                className="px-4 py-2 bg-[#c99850] hover:bg-[#dbb56e] text-black font-medium rounded-lg transition-colors"
              >
                Create First Project
              </button>
            }
          />
        </div>
      ) : currentProject ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Feature tabs */}
          <FeatureTabs
            features={projectFeatures}
            tasks={tracker.tasks}
            testItems={tracker.testItems}
            activeFeatureId={tracker.activeFeatureId}
            onSelectFeature={tracker.setActiveFeatureId}
            onAddFeature={() => setShowAddFeature(true)}
          />

          {/* Feature content */}
          {currentFeature ? (
            <>
              <FeatureHeader
                feature={currentFeature}
                tasks={tracker.tasks}
                testItems={tracker.testItems}
                activeView={tracker.activeView}
                onViewChange={tracker.setActiveView}
                onDelete={() => setDeleteConfirm({ type: 'feature', id: currentFeature.id })}
              />

              {/* Tasks or Tests panel */}
              {tracker.activeView === 'tasks' ? (
                <TasksPanel
                  projectId={tracker.activeProjectId!}
                  featureId={currentFeature.id}
                  tasks={tracker.tasks}
                  onCreateTask={tracker.createTask}
                  onUpdateTask={tracker.updateTask}
                  onDeleteTask={tracker.deleteTask}
                  onToggleStatus={tracker.toggleTaskStatus}
                />
              ) : (
                <TestsPanel
                  projectId={tracker.activeProjectId!}
                  featureId={currentFeature.id}
                  testItems={tracker.testItems}
                  filters={tracker.testFilters}
                  onFiltersChange={tracker.setTestFilters}
                  onFiltersReset={() => tracker.setTestFilters({
                    status: 'all',
                    priority: 'all',
                    platforms: [],
                    search: '',
                  })}
                  onCreateTest={tracker.createTestItem}
                  onUpdateTest={tracker.updateTestItem}
                  onDeleteTest={tracker.deleteTestItem}
                  onSetStatus={tracker.setTestStatus}
                />
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon="⚡"
                title="No features yet"
                description="Add features to organize your tasks and tests"
                action={
                  <button
                    onClick={() => setShowAddFeature(true)}
                    className="px-4 py-2 bg-[#c99850] hover:bg-[#dbb56e] text-black font-medium rounded-lg transition-colors"
                  >
                    Add First Feature
                  </button>
                }
              />
            </div>
          )}
        </div>
      ) : null}

      {/* Dialogs */}
      <AddProjectDialog
        open={showAddProject}
        onClose={() => setShowAddProject(false)}
        onSave={handleAddProject}
      />

      <AddFeatureDialog
        open={showAddFeature}
        onClose={() => setShowAddFeature(false)}
        onSave={handleAddFeature}
        projectName={currentProject?.name}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title={deleteConfirm?.type === 'project' ? 'Delete Project?' : 'Delete Feature?'}
        description={
          deleteConfirm?.type === 'project'
            ? 'This will delete the project and all its features, tasks, and tests. This cannot be undone.'
            : 'This will delete the feature and all its tasks and tests. This cannot be undone.'
        }
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
