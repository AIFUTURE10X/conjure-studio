// Style presets for image generation
// These define the artistic styles available in the GeneratePanel

export interface StylePreset {
  value: string
  label: string
  description: string
  thumbnail: string
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    value: "Realistic",
    label: "Realistic",
    description: "Hyper-realistic photography",
    thumbnail: "/realistic-photograph.jpg"
  },
  {
    value: "Cartoon Style",
    label: "Cartoon Style",
    description: "Vibrant animated style",
    thumbnail: "/cartoon-style.jpg"
  },
  {
    value: "Pixar",
    label: "Pixar",
    description: "3D animation style",
    thumbnail: "/pixar-3d-animation.jpg"
  },
  {
    value: "PhotoReal",
    label: "PhotoReal",
    description: "Ultra-realistic CGI",
    thumbnail: "/photorealistic-cgi.jpg"
  },
  {
    value: "Anime",
    label: "Anime",
    description: "Japanese animation",
    thumbnail: "/anime-style-character.png"
  },
  {
    value: "Oil Painting",
    label: "Oil Painting",
    description: "Traditional oil paint",
    thumbnail: "/abstract-oil-painting.png"
  },
  {
    value: "Watercolor",
    label: "Watercolor",
    description: "Soft watercolor wash",
    thumbnail: "/watercolor-painting-still-life.png"
  },
  {
    value: "3D Render",
    label: "3D Render",
    description: "Modern 3D CGI",
    thumbnail: "/abstract-3d-render.png"
  },
  {
    value: "Sketch",
    label: "Sketch",
    description: "Hand-drawn pencil",
    thumbnail: "/pencil-sketch.png"
  },
  {
    value: "Comic Book",
    label: "Comic Book",
    description: "Bold ink lines",
    thumbnail: "/comic-book-art.png"
  },
  {
    value: "Studio Ghibli",
    label: "Studio Ghibli",
    description: "Hand-painted pastoral",
    thumbnail: "/studio-ghibli-style.jpg"
  },
  {
    value: "Makoto Shinkai",
    label: "Makoto Shinkai",
    description: "Soft 3D realism",
    thumbnail: "/makoto-shinkai-anime.jpg"
  },
  {
    value: "Disney Modern 3D",
    label: "Disney Modern 3D",
    description: "High-finish character",
    thumbnail: "/disney-3d-animation.jpg"
  },
  {
    value: "Sony Spider-Verse",
    label: "Sony Spider-Verse",
    description: "Mixed media comic",
    thumbnail: "/spider-verse-style.jpg"
  },
  {
    value: "Laika",
    label: "Laika",
    description: "Tactile handcrafted",
    thumbnail: "/laika-stop-motion.jpg"
  },
  {
    value: "Cartoon Saloon",
    label: "Cartoon Saloon",
    description: "Storybook flat shapes",
    thumbnail: "/cartoon-saloon-style.jpg"
  },
  {
    value: "Studio Trigger",
    label: "Studio Trigger",
    description: "Exaggerated silhouettes",
    thumbnail: "/studio-trigger-anime.jpg"
  },
  {
    value: "Ufotable",
    label: "Ufotable",
    description: "Hyper-polished VFX",
    thumbnail: "/ufotable-anime.jpg"
  },
  {
    value: "Kyoto Animation",
    label: "Kyoto Animation",
    description: "Polished slice-of-life",
    thumbnail: "/kyoto-animation.jpg"
  },
]

// Helper to get style names for AI Helper dropdown
export const STYLE_NAMES = STYLE_PRESETS.map(s => s.value)
