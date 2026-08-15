"use client"

/**
 * PhotoDirectorCard — "Create video from photos". A guided, director-style
 * workflow: upload two+ photos → joint AI analysis → creative brief → concept
 * cards → editable storyboard → cost preflight → draft clips → review →
 * assemble. Sibling of Story Mode / B-roll at the top of the video canvas;
 * clips land in the shared Videos list below. Only the preflight's
 * "Approve and generate" spends credits.
 */

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Camera, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { DirectorStepRail } from './DirectorStepRail'
import { PhotoUploadStep } from './PhotoUploadStep'
import { AnalysisReviewStep } from './AnalysisReviewStep'
import { BriefStep } from './BriefStep'
import { ConceptsStep } from './ConceptsStep'
import { StoryboardStep } from './StoryboardStep'
import { PreflightStep } from './PreflightStep'
import { GenerateReviewStep } from './GenerateReviewStep'
import { clearDirectorProject, setDirectorStep, startDirectorProject, useDirectorProject } from './useDirectorProject'
import { useDirectorAnalysis } from './useDirectorAnalysis'
import { useDirectorPlanning } from './useDirectorPlanning'
import { useDirectorGeneration } from './useDirectorGeneration'
import type { SubmitVideoOptions, VideoJob } from '../useVideoGeneration'

interface PhotoDirectorCardProps {
  submitVideo: (options: SubmitVideoOptions) => Promise<number | null>
  jobs: VideoJob[]
  onOpenAssemble: () => void
}

export function PhotoDirectorCard({ submitVideo, jobs, onOpenAssemble }: PhotoDirectorCardProps) {
  const [expanded, setExpanded] = useState(false)
  const project = useDirectorProject()
  const { analyzePhotos, isAnalyzing } = useDirectorAnalysis()
  const { planConcepts, planStoryboard, isPlanningConcepts, isPlanningStoryboard } = useDirectorPlanning()
  const { generateDrafts, regenerateShot, generateFinal, isGenerating } = useDirectorGeneration({ submitVideo })

  const handleExpand = () => {
    if (!expanded && !project) startDirectorProject()
    setExpanded(!expanded)
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 p-4 space-y-3">
      <button onClick={handleExpand} className="w-full flex items-center gap-2 text-left">
        <Camera className="w-4 h-4 text-[#dbb56e]" />
        <h3 className="text-sm font-bold text-white">Create video from photos</h3>
        <span className="text-[10px] text-zinc-500 hidden sm:inline">AI director builds the shot plan</span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-zinc-500 ml-auto" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-500 ml-auto" />
        )}
      </button>

      {expanded && project && (
        <div className="space-y-3">
          <p className="text-[11px] text-zinc-500 leading-4 -mt-1">
            Upload two or more photos and let the AI analyze them, suggest video ideas and build a shot plan.
          </p>
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <DirectorStepRail project={project} onStepClick={setDirectorStep} />
            </div>
            <Button
              onClick={() => { clearDirectorProject(); startDirectorProject() }}
              size="sm"
              variant="ghost"
              title="Start over — clears this photo project (generated clips stay in your history)"
              className="h-6 px-2 text-[10px] text-zinc-500 hover:text-red-400 shrink-0"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Start over
            </Button>
          </div>

          {project.step === 'upload' && (
            <PhotoUploadStep onAnalyze={() => void analyzePhotos()} isAnalyzing={isAnalyzing} />
          )}
          {project.step === 'analysis' && <AnalysisReviewStep />}
          {project.step === 'brief' && (
            <BriefStep onPlanConcepts={(brief) => void planConcepts(brief)} isPlanning={isPlanningConcepts} />
          )}
          {project.step === 'concepts' && (
            <ConceptsStep
              onChooseConcept={(concept) => void planStoryboard(concept)}
              onReplan={() => { if (project.brief) void planConcepts(project.brief) }}
              isPlanningConcepts={isPlanningConcepts}
              isPlanningStoryboard={isPlanningStoryboard}
            />
          )}
          {project.step === 'storyboard' && (
            <StoryboardStep
              onRewrite={() => {
                const concept = project.concepts?.find((item) => item.id === project.selectedConceptId)
                if (concept) void planStoryboard(concept)
              }}
              isRewriting={isPlanningStoryboard}
            />
          )}
          {project.step === 'preflight' && (
            <PreflightStep onApprove={() => void generateDrafts()} isGenerating={isGenerating} />
          )}
          {project.step === 'generate' && (
            <GenerateReviewStep
              jobs={jobs}
              isGenerating={isGenerating}
              onRegenerate={(shotId, options) => void regenerateShot(shotId, options)}
              onGenerateFinal={(shotId) => void generateFinal(shotId)}
              onOpenAssemble={onOpenAssemble}
            />
          )}
          {project.step === 'done' && (
            <div className="space-y-2 text-center py-2">
              <p className="text-xs font-bold text-white">Your video project is complete 🎉</p>
              <p className="text-[11px] text-zinc-500 leading-4">
                Everything you generated is saved in the Videos list below and your Creation Library.
              </p>
              <Button
                onClick={() => { clearDirectorProject(); startDirectorProject() }}
                size="sm"
                className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              >
                Start a new photo video
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
