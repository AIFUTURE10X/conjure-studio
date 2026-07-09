"use client"

export type GenerationModel = 'gpt-image-2'
export type ImageSize = '1K' | '2K' | '4K'

interface ModelSelectorProps {
  selectedModel: GenerationModel
  onModelChange: (model: GenerationModel) => void
  imageSize: ImageSize
  onImageSizeChange: (size: ImageSize) => void
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  imageSize,
  onImageSizeChange,
}: ModelSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Model Selector */}
      <div className="bg-zinc-800 rounded-lg p-3 border-2 border-[#c99850]/50">
        <label className="text-xs font-bold text-white mb-2 block">
          AI Model
        </label>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => onModelChange('gpt-image-2')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              selectedModel === 'gpt-image-2'
                ? 'bg-[#c99850] text-black'
                : 'bg-zinc-900 text-white/70 hover:bg-zinc-700 border border-[#c99850]/30'
            }`}
          >
            <div className="font-bold">ChatGPT Images 2.0</div>
            <div className="text-[10px] opacity-70">OpenAI</div>
          </button>
        </div>
      </div>

      {/* Resolution Selector */}
      <div className="bg-zinc-800 rounded-lg p-3 border-2 border-[#c99850]/50">
        <label className="text-xs font-bold text-white mb-2 block">
          Resolution
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => onImageSizeChange('1K')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              imageSize === '1K'
                ? 'bg-[#c99850] text-black'
                : 'bg-zinc-900 text-white/70 hover:bg-zinc-700 border border-[#c99850]/30'
            }`}
          >
            <div className="font-bold">1K</div>
            <div className="text-[10px] opacity-70">~1024px</div>
          </button>
          <button
            onClick={() => onImageSizeChange('2K')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              imageSize === '2K'
                ? 'bg-[#c99850] text-black'
                : 'bg-zinc-900 text-white/70 hover:bg-zinc-700 border border-[#c99850]/30'
            }`}
          >
            <div className="font-bold">2K</div>
            <div className="text-[10px] opacity-70">~2048px</div>
          </button>
          <button
            onClick={() => onImageSizeChange('4K')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              imageSize === '4K'
                ? 'bg-[#c99850] text-black'
                : 'bg-zinc-900 text-white/70 hover:bg-zinc-700 border border-[#c99850]/30'
            }`}
          >
            <div className="font-bold">4K</div>
            <div className="text-[10px] opacity-70">~4096px</div>
          </button>
        </div>
      </div>
    </div>
  )
}
