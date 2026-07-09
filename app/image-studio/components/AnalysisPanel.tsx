"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Edit3, Copy, Check, User, ImageIcon, Palette, Sparkles, X } from 'lucide-react'
import { UploadedImage, AnalysisResult } from '../types'

interface AnalysisPanelProps {
  subjectImages: UploadedImage[]
  sceneImage: UploadedImage | null
  styleImage: UploadedImage | null
  subjectAnalysis: string
  sceneAnalysis: string
  styleAnalysis: string
  combinedPrompt: string
  onEditSubject: (text: string) => void
  onEditScene: (text: string) => void
  onEditStyle: (text: string) => void
  onEditCombined: (text: string) => void
}

export function AnalysisPanel({
  subjectImages,
  sceneImage,
  styleImage,
  subjectAnalysis,
  sceneAnalysis,
  styleAnalysis,
  combinedPrompt,
  onEditSubject,
  onEditScene,
  onEditStyle,
  onEditCombined
}: AnalysisPanelProps) {
  const [editingCard, setEditingCard] = useState<string | null>(null)
  const [copiedCard, setCopiedCard] = useState<string | null>(null)
  const [tempValues, setTempValues] = useState({
    subject: subjectAnalysis,
    scene: sceneAnalysis,
    style: styleAnalysis,
    combined: combinedPrompt
  })

  // Update temp values when props change
  useEffect(() => {
    setTempValues({
      subject: subjectAnalysis,
      scene: sceneAnalysis,
      style: styleAnalysis,
      combined: combinedPrompt
    })
  }, [subjectAnalysis, sceneAnalysis, styleAnalysis, combinedPrompt])

  const handleCopy = (text: string, cardId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCard(cardId)
    setTimeout(() => setCopiedCard(null), 2000)
  }

  const handleEdit = (cardId: string) => {
    setEditingCard(editingCard === cardId ? null : cardId)
  }

  const handleSave = (cardId: string) => {
    switch (cardId) {
      case 'subject':
        onEditSubject(tempValues.subject)
        break
      case 'scene':
        onEditScene(tempValues.scene)
        break
      case 'style':
        onEditStyle(tempValues.style)
        break
      case 'combined':
        onEditCombined(tempValues.combined)
        break
    }
    setEditingCard(null)
  }

  const handleClear = (cardId: string) => {
    switch (cardId) {
      case 'subject':
        onEditSubject('')
        break
      case 'scene':
        onEditScene('')
        break
      case 'style':
        onEditStyle('')
        break
      case 'combined':
        onEditCombined('')
        break
    }
    setTempValues(prev => ({ ...prev, [cardId]: '' }))
  }

  const handleClearAll = () => {
    onEditSubject('')
    onEditScene('')
    onEditStyle('')
    onEditCombined('')
  }

  const cards = [
    {
      id: 'subject',
      title: 'SUBJECT ANALYSIS',
      description: 'Analyzes the main subject',
      icon: User,
      value: subjectAnalysis,
      hasContent: subjectImages.length > 0,
      tempValue: tempValues.subject
    },
    {
      id: 'scene',
      title: 'SCENE ANALYSIS',
      description: 'Analyzes the environment',
      icon: ImageIcon,
      value: sceneAnalysis,
      hasContent: !!sceneImage,
      tempValue: tempValues.scene
    },
    {
      id: 'style',
      title: 'STYLE ANALYSIS',
      description: 'Identifies artistic style',
      icon: Palette,
      value: styleAnalysis,
      hasContent: !!styleImage,
      tempValue: tempValues.style
    },
    {
      id: 'combined',
      title: 'COMBINED PROMPT',
      description: 'Upload images to auto-generate prompts',
      icon: Sparkles,
      value: combinedPrompt,
      hasContent: !!combinedPrompt,
      tempValue: tempValues.combined
    }
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">
          Analysis Cards {!combinedPrompt && <span className="text-zinc-500 text-sm font-normal">(Empty)</span>}
        </h3>
        {combinedPrompt && (
          <Button
            onClick={handleClearAll}
            size="sm"
            variant="ghost"
            className="h-8 px-3 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* 4-Card Grid */}
      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          const isEditing = editingCard === card.id
          const isCopied = copiedCard === card.id
          const isEmpty = !card.value

          return (
            <Card key={card.id} className="bg-black border-[#c99850]/20 overflow-hidden">
              {/* Card Header */}
              <div className="p-4 border-b border-[#c99850]/20">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-[#c99850]" />
                  <h4 className="text-xs font-bold text-[#c99850]">{card.title}</h4>
                </div>
                <p className="text-[10px] text-[#c99850]/70">{card.description}</p>
              </div>

              {/* Card Content */}
              <div className="p-4 min-h-[200px] flex flex-col">
                {isEmpty ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <Upload className="w-8 h-8 text-[#c99850]/30 mb-2" />
                    <p className="text-xs text-[#c99850]/50">Upload an image to analyze</p>
                  </div>
                ) : (
                  <>
                    {card.value && (
                      <div className="flex gap-1 mb-3">
                        <Button
                          onClick={() => handleEdit(card.id)}
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[10px] bg-[#c99850]/10 hover:bg-[#c99850]/20 text-[#c99850] border border-[#c99850]/30"
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleCopy(card.value, card.id)}
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[10px] bg-[#c99850]/10 hover:bg-[#c99850]/20 text-[#c99850] border border-[#c99850]/30"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleClear(card.id)}
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Clear
                        </Button>
                      </div>
                    )}

                    {/* Text Content */}
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={tempValues[card.id as keyof typeof tempValues]}
                            onChange={(e) => setTempValues(prev => ({
                              ...prev,
                              [card.id]: e.target.value
                            }))}
                            className="w-full h-32 p-2 text-[10px] text-[#c99850] bg-zinc-900 border border-[#c99850]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c99850]/30 resize-none leading-relaxed"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSave(card.id)}
                              size="sm"
                              className="h-6 px-3 text-[9px] bg-[#c99850] text-black hover:opacity-90"
                            >
                              Save
                            </Button>
                            <Button
                              onClick={() => setEditingCard(null)}
                              size="sm"
                              variant="ghost"
                              className="h-6 px-3 text-[9px] text-zinc-400 hover:text-white"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-[#c99850]/80 leading-relaxed whitespace-pre-wrap">
                          {card.value}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Card Footer - resize handle dots */}
              <div className="h-3 flex items-center justify-center border-t border-[#c99850]/10">
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-[#c99850]/30" />
                  <div className="w-1 h-1 rounded-full bg-[#c99850]/30" />
                  <div className="w-1 h-1 rounded-full bg-[#c99850]/30" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
