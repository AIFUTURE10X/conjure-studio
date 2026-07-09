// Fancy Font Styles Data
// This file contains all font definitions for the FancyFontGrid component

export type FancyFontCategory =
  | 'luxury' | 'script' | 'modern' | 'retro'
  | 'display' | 'tech' | 'art-deco' | 'gothic'
  | 'grunge' | 'bold' | 'decorative' | 'elegant' | 'handwritten'

export interface FancyFontStyle {
  id: string
  name: string
  category: FancyFontCategory
  description: string
  promptDescription: string
  fallbackPreview: string
  tags: string[]
}

export const FONT_CATEGORIES: { id: FancyFontCategory; label: string; icon: string }[] = [
  { id: 'luxury', label: 'Luxury', icon: '👑' },
  { id: 'script', label: 'Script', icon: '✍️' },
  { id: 'modern', label: 'Modern', icon: '◼️' },
  { id: 'retro', label: 'Retro', icon: '📻' },
  { id: 'display', label: 'Display', icon: '🎨' },
  { id: 'tech', label: 'Tech', icon: '🤖' },
  { id: 'art-deco', label: 'Art Deco', icon: '🏛️' },
  { id: 'gothic', label: 'Gothic', icon: '⚔️' },
  { id: 'grunge', label: 'Grunge', icon: '🎸' },
  { id: 'bold', label: 'Bold', icon: '💪' },
  { id: 'decorative', label: 'Decorative', icon: '✨' },
  { id: 'elegant', label: 'Elegant', icon: '💎' },
  { id: 'handwritten', label: 'Handwritten', icon: '📝' },
]

export const FANCY_FONT_STYLES: FancyFontStyle[] = [
  // LUXURY
  { id: 'didot', name: 'Didot', category: 'luxury', description: 'Classic luxury fashion typography', promptDescription: 'elegant Didot high-contrast luxury serif typography with thin serifs', fallbackPreview: "'Didot', 'Playfair Display', 'Times New Roman', serif", tags: ['elegant', 'fashion', 'premium', 'high-contrast'] },
  { id: 'bodoni', name: 'Bodoni', category: 'luxury', description: 'Elegant high contrast serif', promptDescription: 'sophisticated Bodoni serif typography with dramatic thick-thin contrast', fallbackPreview: "'Bodoni MT', 'Playfair Display', serif", tags: ['elegant', 'classic', 'dramatic'] },
  { id: 'playfair', name: 'Playfair Display', category: 'luxury', description: 'Sophisticated transitional serif', promptDescription: 'refined Playfair Display elegant serif with subtle curves', fallbackPreview: "'Playfair Display', 'Georgia', serif", tags: ['sophisticated', 'refined', 'editorial'] },
  { id: 'cormorant', name: 'Cormorant', category: 'luxury', description: 'Refined elegant Garamond-style', promptDescription: 'graceful Cormorant Garamond-style elegant serif typography', fallbackPreview: "'Cormorant Garamond', 'Garamond', serif", tags: ['graceful', 'refined', 'classic'] },
  { id: 'cinzel', name: 'Cinzel', category: 'luxury', description: 'Ancient Roman luxury', promptDescription: 'majestic Cinzel Roman-inspired capital letters with elegant serifs', fallbackPreview: "'Cinzel', 'Trajan Pro', serif", tags: ['roman', 'ancient', 'majestic', 'capitals'] },
  { id: 'trajan', name: 'Trajan Pro', category: 'luxury', description: 'Premium cinematic serif', promptDescription: 'premium Trajan Pro Roman column-inspired capitals, movie poster style', fallbackPreview: "'Trajan Pro', 'Cinzel', serif", tags: ['cinematic', 'premium', 'movie', 'capitals'] },

  // SCRIPT
  { id: 'great-vibes', name: 'Great Vibes', category: 'script', description: 'Flowing elegant script', promptDescription: 'flowing Great Vibes elegant cursive script with dramatic flourishes', fallbackPreview: "'Great Vibes', 'Brush Script MT', cursive", tags: ['flowing', 'elegant', 'cursive', 'flourishes'] },
  { id: 'pacifico', name: 'Pacifico', category: 'script', description: 'Casual brush script', promptDescription: 'casual Pacifico retro brush script with friendly curves', fallbackPreview: "'Pacifico', 'Brush Script MT', cursive", tags: ['casual', 'brush', 'retro', 'friendly'] },
  { id: 'dancing-script', name: 'Dancing Script', category: 'script', description: 'Lively bouncy cursive', promptDescription: 'lively Dancing Script bouncy cursive with playful baseline', fallbackPreview: "'Dancing Script', cursive", tags: ['lively', 'bouncy', 'playful'] },
  { id: 'alex-brush', name: 'Alex Brush', category: 'script', description: 'Romantic calligraphy', promptDescription: 'romantic Alex Brush flowing calligraphy script', fallbackPreview: "'Alex Brush', cursive", tags: ['romantic', 'calligraphy', 'wedding'] },
  { id: 'allura', name: 'Allura', category: 'script', description: 'Wedding-style formal script', promptDescription: 'formal Allura wedding invitation calligraphy script', fallbackPreview: "'Allura', cursive", tags: ['formal', 'wedding', 'invitation'] },
  { id: 'sacramento', name: 'Sacramento', category: 'script', description: 'Thin elegant monoline script', promptDescription: 'thin Sacramento elegant monoline script with consistent stroke', fallbackPreview: "'Sacramento', cursive", tags: ['thin', 'monoline', 'elegant'] },

  // MODERN
  { id: 'montserrat', name: 'Montserrat', category: 'modern', description: 'Clean geometric sans-serif', promptDescription: 'clean Montserrat geometric sans-serif with urban modern feel', fallbackPreview: "'Montserrat', 'Arial', sans-serif", tags: ['clean', 'geometric', 'urban', 'versatile'] },
  { id: 'poppins', name: 'Poppins', category: 'modern', description: 'Friendly geometric modern', promptDescription: 'friendly Poppins geometric sans-serif with perfect circles', fallbackPreview: "'Poppins', 'Arial', sans-serif", tags: ['friendly', 'geometric', 'rounded'] },
  { id: 'raleway', name: 'Raleway', category: 'modern', description: 'Elegant thin modern', promptDescription: 'elegant Raleway thin weight modern sans-serif', fallbackPreview: "'Raleway', 'Arial', sans-serif", tags: ['elegant', 'thin', 'sophisticated'] },
  { id: 'futura', name: 'Futura', category: 'modern', description: 'Classic geometric Bauhaus', promptDescription: 'classic Futura Bauhaus geometric sans-serif with perfect shapes', fallbackPreview: "'Futura', 'Century Gothic', sans-serif", tags: ['bauhaus', 'geometric', 'classic', 'iconic'] },
  { id: 'avant-garde', name: 'Avant Garde', category: 'modern', description: 'Bold geometric display', promptDescription: 'bold ITC Avant Garde geometric sans-serif with tight letter spacing', fallbackPreview: "'Avant Garde', 'Century Gothic', sans-serif", tags: ['bold', 'geometric', 'tight'] },

  // RETRO
  { id: 'bebas-neue', name: 'Bebas Neue', category: 'retro', description: 'Tall condensed impact', promptDescription: 'tall Bebas Neue condensed all-caps headline typography', fallbackPreview: "'Bebas Neue', 'Impact', sans-serif", tags: ['tall', 'condensed', 'impact', 'headline'] },
  { id: 'oswald', name: 'Oswald', category: 'retro', description: 'Strong condensed headline', promptDescription: 'strong Oswald condensed gothic headline typography', fallbackPreview: "'Oswald', 'Arial Narrow', sans-serif", tags: ['strong', 'condensed', 'gothic'] },
  { id: 'righteous', name: 'Righteous', category: 'retro', description: '70s groovy rounded', promptDescription: 'groovy Righteous 1970s rounded retro display typography', fallbackPreview: "'Righteous', sans-serif", tags: ['70s', 'groovy', 'rounded', 'retro'] },
  { id: 'alfa-slab', name: 'Alfa Slab One', category: 'retro', description: 'Bold chunky slab serif', promptDescription: 'bold Alfa Slab One chunky vintage slab serif', fallbackPreview: "'Alfa Slab One', 'Rockwell', serif", tags: ['bold', 'chunky', 'slab', 'vintage'] },
  { id: 'cooper-black', name: 'Cooper Black', category: 'retro', description: 'Friendly rounded vintage', promptDescription: 'friendly Cooper Black rounded vintage serif with soft curves', fallbackPreview: "'Cooper Black', serif", tags: ['friendly', 'rounded', 'vintage', 'soft'] },

  // DISPLAY
  { id: 'lobster', name: 'Lobster', category: 'display', description: 'Bold connected script', promptDescription: 'bold Lobster connected script display with retro charm', fallbackPreview: "'Lobster', cursive", tags: ['bold', 'connected', 'retro', 'script'] },
  { id: 'paytone-one', name: 'Paytone One', category: 'display', description: 'Rounded bold display', promptDescription: 'rounded Paytone One bold display with friendly curves', fallbackPreview: "'Paytone One', sans-serif", tags: ['rounded', 'bold', 'friendly'] },
  { id: 'bangers', name: 'Bangers', category: 'display', description: 'Comic action style', promptDescription: 'comic Bangers action-style display typography, superhero vibe', fallbackPreview: "'Bangers', cursive", tags: ['comic', 'action', 'superhero', 'fun'] },
  { id: 'fredoka-one', name: 'Fredoka One', category: 'display', description: 'Playful soft rounded', promptDescription: 'playful Fredoka One soft rounded friendly display', fallbackPreview: "'Fredoka One', sans-serif", tags: ['playful', 'soft', 'rounded', 'friendly'] },
  { id: 'bungee', name: 'Bungee', category: 'display', description: 'Layered chromatic display', promptDescription: 'bold Bungee layered display with urban signage style', fallbackPreview: "'Bungee', cursive", tags: ['layered', 'urban', 'signage', 'bold'] },

  // TECH
  { id: 'orbitron', name: 'Orbitron', category: 'tech', description: 'Sci-fi geometric', promptDescription: 'futuristic Orbitron sci-fi geometric display with sharp edges', fallbackPreview: "'Orbitron', sans-serif", tags: ['sci-fi', 'geometric', 'futuristic', 'space'] },
  { id: 'audiowide', name: 'Audiowide', category: 'tech', description: 'Wide tech racing', promptDescription: 'wide Audiowide tech racing typography with speed lines feel', fallbackPreview: "'Audiowide', cursive", tags: ['wide', 'racing', 'speed', 'tech'] },
  { id: 'exo-2', name: 'Exo 2', category: 'tech', description: 'Modern technological', promptDescription: 'modern Exo 2 technological geometric sans-serif', fallbackPreview: "'Exo 2', sans-serif", tags: ['modern', 'technological', 'geometric'] },
  { id: 'rajdhani', name: 'Rajdhani', category: 'tech', description: 'Digital tech condensed', promptDescription: 'digital Rajdhani condensed tech typography with angular cuts', fallbackPreview: "'Rajdhani', sans-serif", tags: ['digital', 'condensed', 'angular'] },
  { id: 'oxanium', name: 'Oxanium', category: 'tech', description: 'Cyber futuristic', promptDescription: 'cyber Oxanium futuristic display with digital aesthetic', fallbackPreview: "'Oxanium', cursive", tags: ['cyber', 'futuristic', 'digital'] },
  { id: 'share-tech', name: 'Share Tech Mono', category: 'tech', description: 'Monospace code style', promptDescription: 'technical Share Tech monospace code-style typography', fallbackPreview: "'Share Tech Mono', 'Courier New', monospace", tags: ['monospace', 'code', 'technical'] },

  // ART DECO
  { id: 'poiret-one', name: 'Poiret One', category: 'art-deco', description: 'Thin art deco geometric', promptDescription: 'thin Poiret One 1920s art deco geometric display', fallbackPreview: "'Poiret One', cursive", tags: ['thin', 'art-deco', '1920s', 'geometric'] },
  { id: 'josefin-sans', name: 'Josefin Sans', category: 'art-deco', description: 'Elegant 1920s geometric', promptDescription: 'elegant Josefin Sans vintage 1920s geometric sans-serif', fallbackPreview: "'Josefin Sans', sans-serif", tags: ['elegant', '1920s', 'vintage', 'geometric'] },
  { id: 'forum', name: 'Forum', category: 'art-deco', description: 'Roman-inspired deco', promptDescription: 'classical Forum Roman-inspired art deco serif', fallbackPreview: "'Forum', serif", tags: ['roman', 'classical', 'art-deco'] },

  // GOTHIC
  { id: 'cinzel-decorative', name: 'Cinzel Decorative', category: 'gothic', description: 'Ornate ancient display', promptDescription: 'ornate Cinzel Decorative ancient Roman capitals with flourishes', fallbackPreview: "'Cinzel Decorative', serif", tags: ['ornate', 'ancient', 'flourishes', 'capitals'] },
  { id: 'unifraktur', name: 'UnifrakturMaguntia', category: 'gothic', description: 'Traditional blackletter', promptDescription: 'traditional Fraktur blackletter gothic calligraphy', fallbackPreview: "'UnifrakturMaguntia', serif", tags: ['blackletter', 'gothic', 'medieval', 'calligraphy'] },
  { id: 'pirata-one', name: 'Pirata One', category: 'gothic', description: 'Gothic pirate display', promptDescription: 'gothic Pirata One decorative blackletter display', fallbackPreview: "'Pirata One', cursive", tags: ['gothic', 'pirate', 'decorative'] },

  // GRUNGE
  { id: 'permanent-marker', name: 'Permanent Marker', category: 'grunge', description: 'Hand-drawn marker', promptDescription: 'hand-drawn Permanent Marker casual handwriting style', fallbackPreview: "'Permanent Marker', cursive", tags: ['hand-drawn', 'marker', 'casual'] },
  { id: 'rock-salt', name: 'Rock Salt', category: 'grunge', description: 'Rough hand scratchy', promptDescription: 'rough Rock Salt scratchy hand-drawn distressed typography', fallbackPreview: "'Rock Salt', cursive", tags: ['rough', 'scratchy', 'distressed'] },
  { id: 'special-elite', name: 'Special Elite', category: 'grunge', description: 'Vintage typewriter', promptDescription: 'vintage Special Elite typewriter typography with ink irregularities', fallbackPreview: "'Special Elite', 'Courier New', monospace", tags: ['vintage', 'typewriter', 'irregular'] },

  // BOLD
  { id: 'anton', name: 'Anton', category: 'bold', description: 'Ultra condensed impact', promptDescription: 'ultra Anton condensed impact headline typography', fallbackPreview: "'Anton', 'Impact', sans-serif", tags: ['ultra', 'condensed', 'impact', 'headline'] },
  { id: 'black-ops-one', name: 'Black Ops One', category: 'bold', description: 'Military stencil', promptDescription: 'military Black Ops One stencil display typography', fallbackPreview: "'Black Ops One', cursive", tags: ['military', 'stencil', 'tactical'] },
  { id: 'passion-one', name: 'Passion One', category: 'bold', description: 'Thick rounded display', promptDescription: 'thick Passion One rounded heavy display typography', fallbackPreview: "'Passion One', cursive", tags: ['thick', 'rounded', 'heavy'] },
  { id: 'titan-one', name: 'Titan One', category: 'bold', description: 'Heavy friendly rounded', promptDescription: 'heavy Titan One friendly rounded slab display', fallbackPreview: "'Titan One', cursive", tags: ['heavy', 'friendly', 'rounded', 'slab'] },

  // DECORATIVE
  { id: 'abril-fatface', name: 'Abril Fatface', category: 'decorative', description: 'Bold vintage display', promptDescription: 'elegant Abril Fatface high-contrast decorative display serif', fallbackPreview: "'Abril Fatface', 'Georgia', serif", tags: ['vintage', 'bold', 'display', 'elegant'] },
  { id: 'monoton', name: 'Monoton', category: 'decorative', description: 'Neon outline style', promptDescription: 'retro Monoton inline neon-style decorative typography', fallbackPreview: "'Monoton', cursive", tags: ['neon', 'retro', 'inline', 'decorative'] },
  { id: 'fascinate', name: 'Fascinate', category: 'decorative', description: 'Art nouveau swirls', promptDescription: 'ornate Fascinate art nouveau decorative display with swirls', fallbackPreview: "'Fascinate', cursive", tags: ['ornate', 'art-nouveau', 'swirls'] },
  { id: 'press-start-2p', name: 'Press Start 2P', category: 'decorative', description: 'Pixel retro gaming', promptDescription: 'pixelated Press Start 2P retro video game typography', fallbackPreview: "'Press Start 2P', cursive", tags: ['pixel', 'retro', 'gaming', '8-bit'] },
  { id: 'megrim', name: 'Megrim', category: 'decorative', description: 'Thin geometric futuristic', promptDescription: 'ultra-thin Megrim geometric futuristic display', fallbackPreview: "'Megrim', cursive", tags: ['thin', 'geometric', 'futuristic'] },
  { id: 'nova-cut', name: 'Nova Cut', category: 'decorative', description: 'Cut-out stencil style', promptDescription: 'dramatic Nova Cut stencil cut-out display typography', fallbackPreview: "'Nova Cut', cursive", tags: ['stencil', 'cut-out', 'dramatic'] },
  { id: 'berkshire-swash', name: 'Berkshire Swash', category: 'decorative', description: 'Classic swash capitals', promptDescription: 'classic Berkshire Swash decorative serif with elegant swashes', fallbackPreview: "'Berkshire Swash', serif", tags: ['swash', 'classic', 'elegant'] },
  { id: 'rye', name: 'Rye', category: 'decorative', description: 'Western saloon style', promptDescription: 'bold Rye western saloon decorative slab serif', fallbackPreview: "'Rye', cursive", tags: ['western', 'saloon', 'vintage'] },

  // ELEGANT
  { id: 'tangerine', name: 'Tangerine', category: 'elegant', description: 'Refined calligraphy', promptDescription: 'refined Tangerine calligraphic elegant script', fallbackPreview: "'Tangerine', cursive", tags: ['calligraphy', 'refined', 'formal'] },
  { id: 'italianno', name: 'Italianno', category: 'elegant', description: 'Flowing italic elegance', promptDescription: 'flowing Italianno elegant italic calligraphy script', fallbackPreview: "'Italianno', cursive", tags: ['italic', 'flowing', 'elegant'] },
  { id: 'pinyon-script', name: 'Pinyon Script', category: 'elegant', description: 'Classic formal script', promptDescription: 'classic Pinyon Script formal elegant calligraphy', fallbackPreview: "'Pinyon Script', cursive", tags: ['formal', 'classic', 'wedding'] },
  { id: 'rozha-one', name: 'Rozha One', category: 'elegant', description: 'Bold elegant serif', promptDescription: 'bold Rozha One elegant display serif with refined curves', fallbackPreview: "'Rozha One', serif", tags: ['bold', 'elegant', 'display'] },
  { id: 'libre-baskerville', name: 'Libre Baskerville', category: 'elegant', description: 'Classic book serif', promptDescription: 'classic Libre Baskerville refined book serif typography', fallbackPreview: "'Libre Baskerville', 'Georgia', serif", tags: ['classic', 'book', 'refined'] },
  { id: 'lora', name: 'Lora', category: 'elegant', description: 'Brushed modern serif', promptDescription: 'modern Lora elegant serif with brushed curves', fallbackPreview: "'Lora', 'Georgia', serif", tags: ['modern', 'brushed', 'elegant'] },
  { id: 'spectral', name: 'Spectral', category: 'elegant', description: 'Sophisticated display serif', promptDescription: 'sophisticated Spectral elegant high-contrast serif', fallbackPreview: "'Spectral', 'Georgia', serif", tags: ['sophisticated', 'high-contrast', 'display'] },

  // HANDWRITTEN
  { id: 'caveat', name: 'Caveat', category: 'handwritten', description: 'Casual handwriting', promptDescription: 'casual Caveat natural handwriting typography', fallbackPreview: "'Caveat', cursive", tags: ['casual', 'natural', 'friendly'] },
  { id: 'kalam', name: 'Kalam', category: 'handwritten', description: 'Pen handwriting', promptDescription: 'authentic Kalam pen handwriting typography', fallbackPreview: "'Kalam', cursive", tags: ['pen', 'authentic', 'natural'] },
  { id: 'indie-flower', name: 'Indie Flower', category: 'handwritten', description: 'Playful handwriting', promptDescription: 'playful Indie Flower whimsical handwriting style', fallbackPreview: "'Indie Flower', cursive", tags: ['playful', 'whimsical', 'fun'] },
  { id: 'architects-daughter', name: 'Architects Daughter', category: 'handwritten', description: 'Technical sketch style', promptDescription: 'technical Architects Daughter architectural handwriting', fallbackPreview: "'Architects Daughter', cursive", tags: ['technical', 'sketch', 'architectural'] },
  { id: 'shadows-into-light', name: 'Shadows Into Light', category: 'handwritten', description: 'Light casual script', promptDescription: 'light Shadows Into Light casual handwriting script', fallbackPreview: "'Shadows Into Light', cursive", tags: ['light', 'casual', 'airy'] },
  { id: 'homemade-apple', name: 'Homemade Apple', category: 'handwritten', description: 'Scratchy pencil style', promptDescription: 'authentic Homemade Apple scratchy pencil handwriting', fallbackPreview: "'Homemade Apple', cursive", tags: ['scratchy', 'pencil', 'authentic'] },
  { id: 'amatic-sc', name: 'Amatic SC', category: 'handwritten', description: 'Condensed hand-drawn', promptDescription: 'condensed Amatic SC hand-drawn display typography', fallbackPreview: "'Amatic SC', cursive", tags: ['condensed', 'hand-drawn', 'narrow'] },
  { id: 'nothing-you-could-do', name: 'Nothing You Could Do', category: 'handwritten', description: 'Casual pen script', promptDescription: 'casual Nothing You Could Do natural pen handwriting', fallbackPreview: "'Nothing You Could Do', cursive", tags: ['casual', 'pen', 'natural'] },

  // Additional LUXURY fonts
  { id: 'yeseva-one', name: 'Yeseva One', category: 'luxury', description: 'Premium headline serif', promptDescription: 'premium Yeseva One elegant headline serif typography', fallbackPreview: "'Yeseva One', serif", tags: ['premium', 'headline', 'elegant'] },
  { id: 'marcellus', name: 'Marcellus', category: 'luxury', description: 'Classic roman capitals', promptDescription: 'classic Marcellus roman capital display serif', fallbackPreview: "'Marcellus', serif", tags: ['roman', 'classic', 'capitals'] },

  // Additional SCRIPT fonts
  { id: 'mr-de-haviland', name: 'Mr De Haviland', category: 'script', description: 'Sophisticated flourish', promptDescription: 'sophisticated Mr De Haviland flourished calligraphy script', fallbackPreview: "'Mr De Haviland', cursive", tags: ['flourish', 'sophisticated', 'calligraphy'] },
  { id: 'meow-script', name: 'Meow Script', category: 'script', description: 'Bouncy playful script', promptDescription: 'bouncy Meow Script playful connected script', fallbackPreview: "'Meow Script', cursive", tags: ['bouncy', 'playful', 'connected'] },

  // Additional TECH fonts
  { id: 'chakra-petch', name: 'Chakra Petch', category: 'tech', description: 'Futuristic Thai-inspired', promptDescription: 'futuristic Chakra Petch geometric tech display', fallbackPreview: "'Chakra Petch', sans-serif", tags: ['futuristic', 'geometric', 'tech'] },
  { id: 'saira', name: 'Saira', category: 'tech', description: 'Racing tech sans', promptDescription: 'dynamic Saira racing tech sans-serif', fallbackPreview: "'Saira', sans-serif", tags: ['racing', 'dynamic', 'tech'] },
  { id: 'iceland', name: 'Iceland', category: 'tech', description: 'Nordic tech display', promptDescription: 'angular Iceland nordic tech display typography', fallbackPreview: "'Iceland', cursive", tags: ['nordic', 'angular', 'tech'] },
]

// Helper to get font by ID
export function getFontById(id: string): FancyFontStyle | undefined {
  return FANCY_FONT_STYLES.find(f => f.id === id)
}
