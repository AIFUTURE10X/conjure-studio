/**
 * Style recipes: one-tap templates that bundle a prompt scaffold with the
 * settings that make it work (OpenArt-recipes pattern). {subject} is
 * replaced with the user's current prompt when applied.
 */

export interface StyleRecipe {
  id: string
  label: string
  emoji: string
  description: string
  /** Prompt template; {subject} is replaced with the user's prompt. */
  scaffold: string
  settings: {
    aspectRatio?: string
    selectedStylePreset?: string
    styleStrength?: 'subtle' | 'moderate' | 'strong'
    selectedCameraAngle?: string
    selectedCameraLens?: string
    negativePrompt?: string
  }
}

export const SUBJECT_PLACEHOLDER = 'your subject'

export const STYLE_RECIPES: StyleRecipe[] = [
  {
    id: 'product-white',
    label: 'Product on White',
    emoji: '📦',
    description: 'Clean e-commerce product shot on seamless white',
    scaffold: 'Professional product photograph of {subject} on a seamless pure white background, studio softbox lighting, crisp edge definition, subtle natural shadow beneath, commercial e-commerce quality',
    settings: { aspectRatio: '1:1', selectedStylePreset: 'Realistic', styleStrength: 'strong', negativePrompt: 'clutter, busy background, harsh shadows, color cast' },
  },
  {
    id: 'ugc-phone',
    label: 'UGC Phone Photo',
    emoji: '📱',
    description: 'Casual authentic phone-camera look for social ads',
    scaffold: 'Casual smartphone photo of {subject}, shot on a phone camera, natural imperfect framing, everyday lighting, authentic UGC social media style, slightly candid',
    settings: { aspectRatio: '9:16', selectedStylePreset: 'Realistic', styleStrength: 'moderate', negativePrompt: 'studio lighting, professional photography, staged, polished' },
  },
  {
    id: 'cinematic-still',
    label: 'Cinematic Still',
    emoji: '🎬',
    description: 'Movie-frame look with anamorphic depth',
    scaffold: 'Cinematic film still of {subject}, anamorphic lens, shallow depth of field, dramatic motivated lighting, filmic color grade with teal-orange balance, 35mm movie frame',
    settings: { aspectRatio: '16:9', selectedStylePreset: 'PhotoReal', styleStrength: 'strong', selectedCameraLens: '85mm portrait' },
  },
  {
    id: 'vintage-polaroid',
    label: 'Vintage Polaroid',
    emoji: '📸',
    description: 'Faded instant-film nostalgia',
    scaffold: 'Vintage Polaroid instant photo of {subject}, faded warm colors, soft focus, light leaks, white instant-film border, nostalgic 1970s feel',
    settings: { aspectRatio: '1:1', selectedStylePreset: 'Realistic', styleStrength: 'strong' },
  },
  {
    id: 'studio-portrait',
    label: 'Studio Portrait',
    emoji: '💡',
    description: 'Pro headshot with Rembrandt lighting',
    scaffold: 'Professional studio portrait of {subject}, Rembrandt lighting, dark neutral backdrop, sharp focus on the eyes, medium format quality, refined retouching',
    settings: { aspectRatio: '3:4', selectedStylePreset: 'Realistic', styleStrength: 'strong', selectedCameraLens: '85mm portrait' },
  },
  {
    id: 'isometric-3d',
    label: 'Isometric 3D',
    emoji: '🧊',
    description: 'Cute 3D render, app-icon energy',
    scaffold: 'Isometric 3D render of {subject}, soft studio lighting, smooth rounded forms, pastel color palette, clean solid background, high-quality octane-style render',
    settings: { aspectRatio: '1:1', selectedStylePreset: '3D Render', styleStrength: 'strong' },
  },
  {
    id: 'flat-illustration',
    label: 'Flat Illustration',
    emoji: '🎨',
    description: 'Modern vector-style editorial art',
    scaffold: 'Flat vector illustration of {subject}, bold simple shapes, limited harmonious color palette, clean lines, modern editorial illustration style, no gradients',
    settings: { aspectRatio: '4:3', selectedStylePreset: 'Cartoon Style', styleStrength: 'strong', negativePrompt: 'photorealistic, 3d render, texture, noise' },
  },
  {
    id: 'neon-cyberpunk',
    label: 'Neon Cyberpunk',
    emoji: '🌃',
    description: 'Rain-slick streets and neon glow',
    scaffold: '{subject} in a neon-lit cyberpunk scene, rain-slick reflective surfaces, glowing magenta and cyan signage, atmospheric haze, night city energy, cinematic sci-fi mood',
    settings: { aspectRatio: '16:9', selectedStylePreset: 'PhotoReal', styleStrength: 'strong' },
  },
  {
    id: 'watercolor',
    label: 'Watercolor',
    emoji: '🖌️',
    description: 'Soft hand-painted washes',
    scaffold: 'Delicate watercolor painting of {subject}, soft translucent washes, visible paper texture, loose expressive brushwork, gentle color bleeding at the edges',
    settings: { aspectRatio: '4:3', selectedStylePreset: 'Watercolor', styleStrength: 'strong', negativePrompt: 'photograph, sharp edges, digital look' },
  },
  {
    id: 'food-photo',
    label: 'Food Photography',
    emoji: '🍽️',
    description: 'Editorial overhead food styling',
    scaffold: 'Editorial food photograph of {subject}, overhead 45-degree angle, natural window light, styled props and linen, shallow depth of field, appetizing rich colors',
    settings: { aspectRatio: '4:3', selectedStylePreset: 'Realistic', styleStrength: 'strong', selectedCameraAngle: 'High-angle shot' },
  },
]
