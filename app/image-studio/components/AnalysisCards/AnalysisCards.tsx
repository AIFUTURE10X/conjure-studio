"use client"

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, Copy, Check, X } from 'lucide-react'
import { useState, useMemo } from 'react'

interface AnalysisCardsProps {
  analysisResults: {
    subjects: any[]
    scene: any | null
    style: any | null
  }
  subjectImages: any[]
  onClearSubject: () => void
  onClearScene: () => void
  onClearStyle: () => void
  combinedPrompt: string
  mainPrompt: string
  setMainPrompt: (prompt: string) => void
  hasPrompt: boolean
}

export function AnalysisCards({
  analysisResults,
  subjectImages,
  onClearSubject,
  onClearScene,
  onClearStyle,
  combinedPrompt,
  mainPrompt,
  setMainPrompt,
  hasPrompt
}: AnalysisCardsProps) {
  const [showAdvanced, setShowAdvanced] = useState(true)
  const [editingSubject, setEditingSubject] = useState(false)
  const [editingScene, setEditingScene] = useState(false)
  const [editingStyle, setEditingStyle] = useState(false)
  const [editedSubject, setEditedSubject] = useState('')
  const [editedScene, setEditedScene] = useState('')
  const [editedStyle, setEditedStyle] = useState('')
  const [copiedSubject, setCopiedSubject] = useState(false)
  const [copiedScene, setCopiedScene] = useState(false)
  const [copiedStyle, setCopiedStyle] = useState(false)
  const [copiedCombined, setCopiedCombined] = useState(false)

  const subjectAnalysisText = useMemo(() => {
    if (editingSubject) return editedSubject
    const selectedSubjectIds = subjectImages.filter(img => img.selected).map(img => img.id)
    const analyses = analysisResults.subjects
      .filter(subj => selectedSubjectIds.includes(subj.id) && subj.analysis?.trim())
      .map(subj => subj.analysis)
    return analyses.join('\n\n')
  }, [subjectImages, analysisResults.subjects, editingSubject, editedSubject])

  const sceneAnalysisText = useMemo(() => editingScene ? editedScene : analysisResults.scene?.analysis || '', 
    [analysisResults.scene, editingScene, editedScene])

  const styleAnalysisText = useMemo(() => editingStyle ? editedStyle : analysisResults.style?.analysis || '', 
    [analysisResults.style, editingStyle, editedStyle])

  const handleCopy = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text)
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  return (
    <Card className="bg-zinc-900 border-[#c99850]/30">
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center justify-between p-3 hover:bg-zinc-800/50 transition-colors rounded-t-lg"
      >
        <span className="text-xs font-bold text-[#c99850]">Analysis Cards</span>
        <ChevronDown className={`w-4 h-4 text-[#c99850] transition-transform ${showAdvanced ? 'rotate-180' : 'rotate-0'}`} />
      </button>
      
      {showAdvanced && (
        <div className="p-4 pt-0">
          <div className="grid grid-cols-4 gap-4">
            {/* Subject Card */}
            <Card className="bg-zinc-800 border-2 border-[#c99850]/50 hover:border-[#c99850] transition-colors rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Subject</h3>
                  <p className="text-xs text-white/70">Analyzes the main subject</p>
                </div>
                {subjectAnalysisText && (
                  <div className="flex gap-1">
                    <Button onClick={() => editingSubject ? setEditingSubject(false) : (setEditedSubject(subjectAnalysisText), setEditingSubject(true))} size="sm" variant="ghost" className="h-6 px-2 text-[10px] bg-[#c99850]/10 hover:bg-[#c99850]/20 text-[#c99850]">
                      {editingSubject ? 'Save' : 'Edit'}
                    </Button>
                    <Button onClick={() => handleCopy(subjectAnalysisText, setCopiedSubject)} size="sm" variant="ghost" className="h-6 px-2 text-[10px] bg-[#c99850]/10 hover:bg-[#c99850]/20 text-[#c99850]">
                      {copiedSubject ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                    <Button onClick={() => { setEditedSubject(''); setEditingSubject(false); onClearSubject() }} size="sm" variant="ghost" className="h-6 px-2 text-[10px] bg-red-900/20 hover:bg-red-900/30 text-red-400">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
              <textarea value={subjectAnalysisText} onChange={(e) => setEditedSubject(e.target.value)} placeholder="Subject analysis will appear here..." className="w-full h-32 px-3 py-2 rounded-lg text-xs bg-zinc-900 text-white placeholder:text-white/50 border border-[#c99850]/30 focus:outline-none focus:ring-2 focus:ring-[#c99850]/50 resize-none" readOnly={!editingSubject} />
            </Card>
            
            {/* Scene Card */}
            <Card className="bg-zinc-800 border-2 border-[#c99850]/50 hover:border-[#c99850] transition-colors rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Scene</h3>
                  <p className="text-xs text-white/70">Analyzes the environment</p>
                </div>
                {sceneAnalysisText && (
                  <div className="flex gap-1">
                    <Button onClick={() => editingScene ? setEditingScene(false) : (setEditedScene(sceneAnalysisText), setEditingScene(true))} size="sm" variant="ghost" className="h-6 px-2 text-[10px] bg-[#c99850]/10 hover:bg-[#c99850]/20 text-[#c99850]">
                      {editingScene ? 'Save' : 'Edit'}
                    </Button>
                    <Button onClick={() => handleCopy(sceneAnalysisText, setCopiedScene)} size="sm" variant="ghost" className="h-6 px-2 text-[10px] bg-[#c99850]/10 hover:bg-[#c99850]/20 text-[#c99850]">
                      {copiedScene ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                    <Button onClick={() => { setEditedScene(''); setEditingScene(false); onClearScene() }} size="sm" variant="ghost" className="h-6 px-2 text-[10px] bg-red-900/20 hover:bg-red-900/30 text-red-400">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
              <textarea value={sceneAnalysisText} onChange={(e) => setEditedScene(e.target.value)} placeholder="Scene analysis will appear here..." className="w-full h-32 px-3 py-2 rounded-lg text-xs bg-zinc-900 text-white placeholder:text-white/50 border border-[#c99850]/30 focus:outline-none focus:ring-2 focus:ring-[#c99850]/50 resize-none" readOnly={!editingScene} />
            </Card>
            
            {/* Style Card */}
            <Card className="bg-zinc-800 border-2 border-[#c99850]/50 hover:border-[#c99850] transition-colors rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Style</h3>
                  <p className="text-xs text-white/70">Identifies artistic style</p>
                </div>
                {styleAnalysisText && (
                  <div className="flex gap-1">
                    <Button onClick={() => editingStyle ? setEditingStyle(false) : (setEditedStyle(styleAnalysisText), setEditingStyle(true))} size="sm" variant="ghost" className="h-6 px-2 text-[10px] bg-[#c99850]/10 hover:bg-[#c99850]/20 text-[#c99850]">
                      {editingStyle ? 'Save' : 'Edit'}
                    </Button>
                    <Button onClick={() => handleCopy(styleAnalysisText, setCopiedStyle)} size="sm" variant="ghost" className="h-6 px-2 text-[10px] bg-[#c99850]/10 hover:bg-[#c99850]/20 text-[#c99850]">
                      {copiedStyle ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                    <Button onClick={() => { setEditedStyle(''); setEditingStyle(false); onClearStyle() }} size="sm" variant="ghost" className="h-6 px-2 text-[10px] bg-red-900/20 hover:bg-red-900/30 text-red-400">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
              <textarea value={styleAnalysisText} onChange={(e) => setEditedStyle(e.target.value)} placeholder="Style analysis will appear here..." className="w-full h-32 px-3 py-2 rounded-lg text-xs bg-zinc-900 text-white placeholder:text-white/50 border border-[#c99850]/30 focus:outline-none focus:ring-2 focus:ring-[#c99850]/50 resize-none" readOnly={!editingStyle} />
            </Card>
            
            {/* Combined Prompt Card */}
            <Card className="bg-zinc-800 border-2 border-[#c99850]/50 hover:border-[#c99850] transition-colors rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Combined Prompt</h3>
                  <p className="text-xs text-white/70">{hasPrompt ? "Combined analysis ready" : "Upload images"}</p>
                </div>
                {hasPrompt && (
                  <Button onClick={() => handleCopy(combinedPrompt, setCopiedCombined)} size="sm" variant="ghost" className="h-6 px-2 text-[10px] bg-[#c99850]/10 hover:bg-[#c99850]/20 text-[#c99850]">
                    {copiedCombined ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                )}
              </div>
              <div className="h-32 overflow-y-auto text-xs text-white/80 leading-relaxed px-1 bg-zinc-900 rounded-lg p-3 border border-[#c99850]/30">
                {hasPrompt ? combinedPrompt : <div className="text-center py-8"><p className="text-xs text-white/70">Upload images to auto-generate prompts</p></div>}
              </div>
            </Card>
          </div>
        </div>
      )}
    </Card>
  )
}
