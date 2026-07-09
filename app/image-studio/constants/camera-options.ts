// ============================================
// CAMERA ANGLE OPTIONS
// ============================================

export const cameraAngleOptions = [
  'Eye-level shot',
  'Low-angle shot',
  'High-angle shot',
  'Aerial view',
  'Dutch angle',
  'Over-the-shoulder shot',
  'Point-of-view shot',
  "Bird's-eye view",
  "Worm's-eye view",
] as const

export type CameraAngle = typeof cameraAngleOptions[number] | ''

// ============================================
// CAMERA LENS OPTIONS
// ============================================

export const cameraLensOptions = [
  '14mm ultra-wide',
  '16mm fisheye',
  '24mm wide-angle',
  '35mm standard',
  '50mm prime',
  '85mm portrait',
  '135mm telephoto',
  '200mm super-telephoto',
  'Macro lens',
] as const

export type CameraLens = typeof cameraLensOptions[number] | ''

// ============================================
// ASPECT RATIO OPTIONS
// ============================================

export const aspectRatioOptions = [
  '1:1',
  '16:9',
  '9:16',
  '4:3',
  '3:4',
  '3:2',
  '2:3',
  '21:9',
] as const

export type AspectRatio = typeof aspectRatioOptions[number]

// ============================================
// STYLE PRESETS
// ============================================

export interface StylePreset {
  value: string
  label: string
  thumbnail: string
  description: string
}

export const stylePresets: StylePreset[] = [
  { value: 'Realistic', label: 'Realistic', thumbnail: '/realistic-photograph.jpg', description: 'Photorealistic details, natural lighting' },
  { value: 'Cartoon Style', label: 'Cartoon Style', thumbnail: '/cartoon-style.jpg', description: 'Bold outlines, simple colors' },
  { value: 'Pixar', label: 'Pixar', thumbnail: '/pixar-3d-animation.jpg', description: '3D animated, vibrant colors' },
  { value: 'PhotoReal', label: 'PhotoReal', thumbnail: '/photorealistic-cgi.jpg', description: 'Ultra-detailed CGI rendering' },
  { value: 'Anime', label: 'Anime', thumbnail: '/anime-style-character.png', description: 'Japanese anime, expressive eyes' },
  { value: 'Oil Painting', label: 'Oil Painting', thumbnail: '/abstract-oil-painting.png', description: 'Visible brush strokes, texture' },
  { value: 'Watercolor', label: 'Watercolor', thumbnail: '/watercolor-painting-still-life.png', description: 'Soft textures, fluid transitions' },
  { value: '3D Render', label: '3D Render', thumbnail: '/abstract-3d-render.png', description: 'Soft 3D realism, appealing shapes' },
  { value: 'Sketch', label: 'Sketch', thumbnail: '/pencil-sketch.png', description: 'Hand-drawn pencil textures' },
  { value: 'Pencil Sketch', label: 'Pencil Sketch', thumbnail: '/pencil-sketch-drawing.jpg', description: 'Detailed pencil drawing, cross-hatching, shading' },
  { value: 'Comic Book', label: 'Comic Book', thumbnail: '/comic-book-art.png', description: 'Bold style, halftone patterns' },
  { value: 'Studio Ghibli', label: 'Studio Ghibli', thumbnail: '/studio-ghibli-style.jpg', description: 'Hand-painted, pastoral nature' },
  { value: 'Makoto Shinkai', label: 'Makoto Shinkai', thumbnail: '/makoto-shinkai-anime.jpg', description: 'Soft 3D, expressive lighting' },
  { value: 'Disney Modern 3D', label: 'Disney Modern 3D', thumbnail: '/disney-3d-animation.jpg', description: 'High-finish animation, glossy' },
  { value: 'Sony Spider-Verse', label: 'Sony Spider-Verse', thumbnail: '/spider-verse-style.jpg', description: 'Mixed media, comic book look' },
  { value: 'Laika', label: 'Laika', thumbnail: '/laika-stop-motion.jpg', description: 'Handcrafted textures, moody' },
  { value: 'Cartoon Saloon', label: 'Cartoon Saloon', thumbnail: '/cartoon-saloon-style.jpg', description: 'Flat decorative, Celtic motifs' },
  { value: 'Studio Trigger', label: 'Studio Trigger', thumbnail: '/studio-trigger-anime.jpg', description: 'Neon palettes, explosive motion' },
  { value: 'Ufotable', label: 'Ufotable', thumbnail: '/ufotable-anime.jpg', description: 'Hyper-polished, VFX glow trails' },
  { value: 'Kyoto Animation', label: 'Kyoto Animation', thumbnail: '/kyoto-animation.jpg', description: 'Slice-of-life realism, delicate' },
]

// Helper to get style values for normalization
export const styleValues = stylePresets.map(p => p.value)
