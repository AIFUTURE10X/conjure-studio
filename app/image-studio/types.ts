export interface UploadedImage {
  id: string
  file: File
  preview: string
  selected: boolean
  analysis?: string
}

export interface AnalysisResult {
  text: string
  loading: boolean
  error?: string
}

export interface GeneratedImage {
  id: string
  url: string
  prompt: string
  timestamp: Date
  metadata?: {
    model?: string
    seed?: number
    steps?: number
  }
}
