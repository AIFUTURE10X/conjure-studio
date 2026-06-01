"use client"

/**
 * UploadPanel Component
 *
 * Main panel for uploading subject, scene, and style images
 */

import { useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Upload, X, ChevronDown, Info, Images } from 'lucide-react'
import type { UploadedImage } from '../../types'
import { SubjectImageGrid } from './SubjectImageGrid'
import { ImageUploadZone } from './ImageUploadZone'

interface UploadPanelProps {
  subjectImages: UploadedImage[]
  sceneImage: UploadedImage | null
  styleImage: UploadedImage | null
  isDragging: boolean
  setIsDragging: (isDragging: boolean) => void
  addSubjectImages: (files: FileList) => void
  setSceneImageFile: (file: File) => void
  setStyleImageFile: (file: File) => void
  removeSubjectImage: (id: string) => void
  toggleSubjectSelection: (id: string) => void
  clearSceneImage: () => void
  clearStyleImage: () => void
  clearAllImages?: () => void
  onClearAll?: () => void
}

export function UploadPanel({
  subjectImages,
  sceneImage,
  styleImage,
  isDragging,
  setIsDragging,
  addSubjectImages,
  setSceneImageFile,
  setStyleImageFile,
  removeSubjectImage,
  toggleSubjectSelection,
  clearSceneImage,
  clearStyleImage,
  clearAllImages,
  onClearAll,
}: UploadPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const subjectInputRef = useRef<HTMLInputElement>(null)
  const selectedSubjectCount = subjectImages.filter((image) => image.selected).length
  const hasAnyReference = subjectImages.length > 0 || sceneImage || styleImage

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent, type: 'subject' | 'scene' | 'style') => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (!files.length) return

    if (type === 'subject') {
      addSubjectImages(files)
    } else if (type === 'scene' && files[0]) {
      setSceneImageFile(files[0])
    } else if (type === 'style' && files[0]) {
      setStyleImageFile(files[0])
    }
  }

  const handleSubjectFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      addSubjectImages(files)
    }
    e.target.value = ''
  }

  const handleClearAll = () => {
    if (clearAllImages) clearAllImages()
    if (onClearAll) onClearAll()
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden bg-zinc-950/60 border-zinc-800">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-zinc-900/80 transition-colors"
        >
          <div>
            <h2 className="text-lg font-semibold text-white">Image References</h2>
            <p className="text-sm text-zinc-400">Subjects, background, and style cues</p>
          </div>
          <ChevronDown
            className={`w-5 h-5 shrink-0 text-zinc-400 transition-transform ${
              isCollapsed ? '-rotate-90' : ''
            }`}
          />
        </button>

        {!isCollapsed && (
          <div className="px-5 pb-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              <ReferenceStatus
                label="Subjects"
                value={subjectImages.length > 0 ? `${selectedSubjectCount}/${subjectImages.length} selected` : 'None'}
                active={subjectImages.length > 0}
              />
              <ReferenceStatus label="Scene" value={sceneImage ? 'Added' : 'Optional'} active={!!sceneImage} />
              <ReferenceStatus label="Style" value={styleImage ? 'Added' : 'Optional'} active={!!styleImage} />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)]">
              {/* Subject Images Section */}
              <section className="flex h-full flex-col rounded-xl border border-zinc-700/70 bg-zinc-900/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between lg:flex-col 2xl:flex-row 2xl:items-start 2xl:justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#c99850]/25 bg-[#c99850]/10">
                      <Images className="h-4 w-4 text-[#dbb56e]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-white">Subject Images</h3>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="text-zinc-500 hover:text-[#c99850] transition-colors">
                              <Info className="w-4 h-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs bg-black border-[#c99850] text-[#c99850]">
                            <p className="text-sm">
                              Upload multiple subjects to combine them in your generation.
                              Select which subjects to include by clicking on them.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-sm text-zinc-500">People, products, or objects to include</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {hasAnyReference && clearAllImages && (
                      <Button
                        onClick={handleClearAll}
                        variant="outline"
                        size="sm"
                        className="font-semibold text-zinc-400 border-zinc-700 hover:text-white hover:border-zinc-600"
                      >
                        <X className="w-3.5 h-3.5 mr-1.5" />
                        Clear All
                      </Button>
                    )}
                    <Button
                      onClick={() => subjectInputRef.current?.click()}
                      size="sm"
                      className="font-semibold text-black"
                      style={{
                        background: "linear-gradient(135deg, #c99850 0%, #dbb56e 25%, #f4d698 50%, #dbb56e 75%, #c99850 100%)",
                      }}
                    >
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      Add Subjects
                    </Button>
                  </div>
                  <input
                    ref={subjectInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleSubjectFileInput}
                  />
                </div>

                {/* Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'subject')}
                  onClick={() => subjectImages.length === 0 && subjectInputRef.current?.click()}
                  className={`flex-1 border border-dashed rounded-lg p-3 text-center transition-colors ${
                    isDragging
                      ? 'border-[#c99850] bg-[#c99850]/10'
                      : 'border-[#c99850]/40 bg-zinc-950/20 hover:border-[#c99850]/80 hover:bg-zinc-950/40'
                  } ${subjectImages.length === 0 ? 'cursor-pointer' : ''}`}
                >
                  <SubjectImageGrid
                    subjectImages={subjectImages}
                    onToggleSelection={toggleSubjectSelection}
                    onRemove={removeSubjectImage}
                  />
                </div>
              </section>

              <ImageUploadZone
                title="Scene/Background"
                subtitle="Where the image should feel set"
                image={sceneImage}
                isDragging={isDragging}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'scene')}
                onFileSelect={setSceneImageFile}
                onClear={clearSceneImage}
              />

              <ImageUploadZone
                title="Style Reference"
                subtitle="Look, finish, palette, or mood"
                image={styleImage}
                isDragging={isDragging}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'style')}
                onFileSelect={setStyleImageFile}
                onClear={clearStyleImage}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

function ReferenceStatus({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div className={`rounded-full border px-3 py-1 text-xs ${
      active
        ? 'border-[#c99850]/40 bg-[#c99850]/10 text-[#f4d698]'
        : 'border-zinc-800 bg-zinc-900/60 text-zinc-500'
    }`}>
      <span className="font-medium text-zinc-300">{label}</span>
      <span className="mx-1.5 text-zinc-600">/</span>
      <span>{value}</span>
    </div>
  )
}
