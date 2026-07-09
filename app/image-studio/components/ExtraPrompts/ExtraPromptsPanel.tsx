"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, X, ChevronDown } from 'lucide-react'

interface ExtraPrompt {
  id: string
  text: string
}

export function ExtraPromptsPanel() {
  const [extraPrompts, setExtraPrompts] = useState<ExtraPrompt[]>([])
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  const addPrompt = () => {
    if (extraPrompts.length >= 10) {
      alert('Maximum 10 extra prompts allowed')
      return
    }
    
    const newPrompt: ExtraPrompt = {
      id: Date.now().toString(),
      text: ''
    }
    setExtraPrompts([...extraPrompts, newPrompt])
  }
  
  const removePrompt = (id: string) => {
    setExtraPrompts(extraPrompts.filter(p => p.id !== id))
  }
  
  const updatePrompt = (id: string, text: string) => {
    setExtraPrompts(extraPrompts.map(p => 
      p.id === id ? { ...p, text } : p
    ))
  }
  
  return (
    <Card className="bg-black border-amber-500/20">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-3 hover:bg-zinc-900 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-amber-500">Extra Prompts</span>
          {extraPrompts.length > 0 && (
            <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full">
              {extraPrompts.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={(e) => {
              e.stopPropagation()
              addPrompt()
            }}
            size="sm"
            className="h-7 px-3 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Prompt
          </Button>
          <ChevronDown
            className={`w-4 h-4 text-amber-500 transition-transform ${
              isCollapsed ? 'rotate-0' : 'rotate-180'
            }`}
          />
        </div>
      </button>
      
      {!isCollapsed && (
        <div className="p-4 pt-0 space-y-3">
          {extraPrompts.length === 0 ? (
            <div className="text-center py-6 bg-zinc-900 rounded-lg border border-amber-500/10">
              <p className="text-xs text-amber-500/70 mb-2">
                Add extra prompts to generate multiple variations
              </p>
              <Button
                onClick={addPrompt}
                size="sm"
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Your First Prompt
              </Button>
            </div>
          ) : (
            extraPrompts.map((prompt, index) => (
              <div key={prompt.id} className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-amber-500/70 mb-1 block">
                    Prompt {index + 2}
                  </label>
                  <textarea
                    value={prompt.text}
                    onChange={(e) => updatePrompt(prompt.id, e.target.value)}
                    placeholder={`Enter variation prompt ${index + 2}...`}
                    className="w-full h-20 px-3 py-2 rounded-lg text-xs bg-zinc-800 text-white placeholder:text-amber-500/50 border border-amber-500/30 focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
                  />
                </div>
                <Button
                  onClick={() => removePrompt(prompt.id)}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 mt-5 bg-red-900/20 hover:bg-red-900/30 text-red-400"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
          
          {extraPrompts.length > 0 && extraPrompts.length < 10 && (
            <Button
              onClick={addPrompt}
              size="sm"
              className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Another Prompt ({extraPrompts.length}/10)
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
