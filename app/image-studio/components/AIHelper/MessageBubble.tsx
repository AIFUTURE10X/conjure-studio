'use client'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[92%] sm:max-w-[78%] rounded-lg px-4 py-3 ${
          role === 'user' ? 'bg-[#c99850] text-black' : 'bg-zinc-800 text-white'
        }`}
      >
        <p className="text-sm leading-6 whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  )
}

export function LoadingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-zinc-800 rounded-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#c99850] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-[#c99850] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-[#c99850] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
