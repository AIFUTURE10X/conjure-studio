// ============================================
// TYPES
// ============================================

export type IconStyle =
  | 'none'
  // Abstract & Geometric
  | 'abstract-circle' | 'abstract-triangle' | 'abstract-hexagon' | 'abstract-wave'
  | 'geometric-cube' | 'geometric-pyramid' | 'geometric-diamond' | 'geometric-infinity'
  // Nature
  | 'leaf' | 'tree' | 'flower' | 'sun' | 'moon' | 'star' | 'mountain' | 'wave'
  // Technology
  | 'chip' | 'circuit' | 'code' | 'wifi' | 'cloud' | 'database' | 'rocket'
  // Business
  | 'chart' | 'briefcase' | 'handshake' | 'target' | 'trophy' | 'crown' | 'shield'
  // Communication
  | 'globe' | 'message' | 'mail' | 'phone' | 'megaphone'
  // Creative
  | 'palette' | 'camera' | 'music' | 'film' | 'pen' | 'lightbulb'
  // Symbols
  | 'heart' | 'fire' | 'lightning' | 'arrow-up' | 'arrow-right' | 'check' | 'plus'
  // Health & Wellness
  | 'medical-cross' | 'heartbeat' | 'pill' | 'stethoscope' | 'dna' | 'leaf-heart'
  // Education & Learning
  | 'book' | 'graduation' | 'pencil' | 'brain' | 'atom' | 'school'
  // Entertainment & Gaming
  | 'gamepad' | 'dice' | 'theater' | 'sparkle' | 'party' | 'ticket'

export type IconPosition =
  | 'before-text'
  | 'after-text'
  | 'above-text'
  | 'below-text'
  | 'left-of-text'
  | 'right-of-text'
  | 'behind-text'
  | 'replace-first-letter'
  | 'integrated'

export type IconCategory = 'abstract' | 'nature' | 'tech' | 'business' | 'communication' | 'creative' | 'symbols' | 'health' | 'education' | 'entertainment'

export interface IconOption {
  id: IconStyle
  label: string
  category: IconCategory
  emoji: string
  promptDescription: string
}

export interface PositionOption {
  id: IconPosition
  label: string
  icon: string
  description: string
  promptDescription: string
}

// ============================================
// ICON OPTIONS
// ============================================

export const ICON_OPTIONS: IconOption[] = [
  { id: 'none', label: 'None', category: 'abstract', emoji: '—', promptDescription: '' },

  // Abstract & Geometric
  { id: 'abstract-circle', label: 'Circle', category: 'abstract', emoji: '⭕', promptDescription: 'abstract circular ring icon' },
  { id: 'abstract-triangle', label: 'Triangle', category: 'abstract', emoji: '△', promptDescription: 'abstract triangle icon' },
  { id: 'abstract-hexagon', label: 'Hexagon', category: 'abstract', emoji: '⬡', promptDescription: 'abstract hexagon icon' },
  { id: 'abstract-wave', label: 'Wave', category: 'abstract', emoji: '〰️', promptDescription: 'abstract flowing wave icon' },
  { id: 'geometric-cube', label: 'Cube', category: 'abstract', emoji: '🧊', promptDescription: 'geometric 3D cube icon' },
  { id: 'geometric-pyramid', label: 'Pyramid', category: 'abstract', emoji: '🔺', promptDescription: 'geometric pyramid icon' },
  { id: 'geometric-diamond', label: 'Diamond', category: 'abstract', emoji: '💎', promptDescription: 'geometric diamond shape icon' },
  { id: 'geometric-infinity', label: 'Infinity', category: 'abstract', emoji: '∞', promptDescription: 'infinity symbol icon' },

  // Nature
  { id: 'leaf', label: 'Leaf', category: 'nature', emoji: '🍃', promptDescription: 'natural leaf icon' },
  { id: 'tree', label: 'Tree', category: 'nature', emoji: '🌳', promptDescription: 'tree icon' },
  { id: 'flower', label: 'Flower', category: 'nature', emoji: '🌸', promptDescription: 'flower blossom icon' },
  { id: 'sun', label: 'Sun', category: 'nature', emoji: '☀️', promptDescription: 'sun rays icon' },
  { id: 'moon', label: 'Moon', category: 'nature', emoji: '🌙', promptDescription: 'crescent moon icon' },
  { id: 'star', label: 'Star', category: 'nature', emoji: '⭐', promptDescription: 'star icon' },
  { id: 'mountain', label: 'Mountain', category: 'nature', emoji: '🏔️', promptDescription: 'mountain peak icon' },
  { id: 'wave', label: 'Ocean Wave', category: 'nature', emoji: '🌊', promptDescription: 'ocean wave icon' },

  // Technology
  { id: 'chip', label: 'Chip', category: 'tech', emoji: '🔲', promptDescription: 'computer chip icon' },
  { id: 'circuit', label: 'Circuit', category: 'tech', emoji: '⚡', promptDescription: 'circuit board pattern icon' },
  { id: 'code', label: 'Code', category: 'tech', emoji: '💻', promptDescription: 'code brackets icon' },
  { id: 'wifi', label: 'WiFi', category: 'tech', emoji: '📶', promptDescription: 'wifi signal icon' },
  { id: 'cloud', label: 'Cloud', category: 'tech', emoji: '☁️', promptDescription: 'cloud computing icon' },
  { id: 'database', label: 'Database', category: 'tech', emoji: '🗄️', promptDescription: 'database storage icon' },
  { id: 'rocket', label: 'Rocket', category: 'tech', emoji: '🚀', promptDescription: 'rocket launch icon' },

  // Business
  { id: 'chart', label: 'Chart', category: 'business', emoji: '📈', promptDescription: 'growth chart icon' },
  { id: 'briefcase', label: 'Briefcase', category: 'business', emoji: '💼', promptDescription: 'briefcase icon' },
  { id: 'handshake', label: 'Handshake', category: 'business', emoji: '🤝', promptDescription: 'handshake partnership icon' },
  { id: 'target', label: 'Target', category: 'business', emoji: '🎯', promptDescription: 'target bullseye icon' },
  { id: 'trophy', label: 'Trophy', category: 'business', emoji: '🏆', promptDescription: 'trophy award icon' },
  { id: 'crown', label: 'Crown', category: 'business', emoji: '👑', promptDescription: 'royal crown icon' },
  { id: 'shield', label: 'Shield', category: 'business', emoji: '🛡️', promptDescription: 'protective shield icon' },

  // Communication
  { id: 'globe', label: 'Globe', category: 'communication', emoji: '🌐', promptDescription: 'world globe icon' },
  { id: 'message', label: 'Message', category: 'communication', emoji: '💬', promptDescription: 'chat message bubble icon' },
  { id: 'mail', label: 'Mail', category: 'communication', emoji: '✉️', promptDescription: 'email envelope icon' },
  { id: 'phone', label: 'Phone', category: 'communication', emoji: '📱', promptDescription: 'phone icon' },
  { id: 'megaphone', label: 'Megaphone', category: 'communication', emoji: '📢', promptDescription: 'megaphone announcement icon' },

  // Creative
  { id: 'palette', label: 'Palette', category: 'creative', emoji: '🎨', promptDescription: 'artist palette icon' },
  { id: 'camera', label: 'Camera', category: 'creative', emoji: '📷', promptDescription: 'camera icon' },
  { id: 'music', label: 'Music', category: 'creative', emoji: '🎵', promptDescription: 'music note icon' },
  { id: 'film', label: 'Film', category: 'creative', emoji: '🎬', promptDescription: 'film clapperboard icon' },
  { id: 'pen', label: 'Pen', category: 'creative', emoji: '🖊️', promptDescription: 'pen writing icon' },
  { id: 'lightbulb', label: 'Lightbulb', category: 'creative', emoji: '💡', promptDescription: 'lightbulb idea icon' },

  // Symbols
  { id: 'heart', label: 'Heart', category: 'symbols', emoji: '❤️', promptDescription: 'heart icon' },
  { id: 'fire', label: 'Fire', category: 'symbols', emoji: '🔥', promptDescription: 'fire flame icon' },
  { id: 'lightning', label: 'Lightning', category: 'symbols', emoji: '⚡', promptDescription: 'lightning bolt icon' },
  { id: 'arrow-up', label: 'Arrow Up', category: 'symbols', emoji: '⬆️', promptDescription: 'upward arrow icon' },
  { id: 'arrow-right', label: 'Arrow Right', category: 'symbols', emoji: '➡️', promptDescription: 'forward arrow icon' },
  { id: 'check', label: 'Check', category: 'symbols', emoji: '✓', promptDescription: 'checkmark icon' },
  { id: 'plus', label: 'Plus', category: 'symbols', emoji: '➕', promptDescription: 'plus symbol icon' },

  // Health & Wellness
  { id: 'medical-cross', label: 'Medical Cross', category: 'health', emoji: '➕', promptDescription: 'medical cross health icon' },
  { id: 'heartbeat', label: 'Heartbeat', category: 'health', emoji: '💓', promptDescription: 'heartbeat pulse icon' },
  { id: 'pill', label: 'Pill', category: 'health', emoji: '💊', promptDescription: 'medicine pill icon' },
  { id: 'stethoscope', label: 'Stethoscope', category: 'health', emoji: '🩺', promptDescription: 'stethoscope medical icon' },
  { id: 'dna', label: 'DNA', category: 'health', emoji: '🧬', promptDescription: 'DNA double helix icon' },
  { id: 'leaf-heart', label: 'Wellness', category: 'health', emoji: '💚', promptDescription: 'wellness heart leaf icon' },

  // Education & Learning
  { id: 'book', label: 'Book', category: 'education', emoji: '📖', promptDescription: 'open book icon' },
  { id: 'graduation', label: 'Graduation', category: 'education', emoji: '🎓', promptDescription: 'graduation cap icon' },
  { id: 'pencil', label: 'Pencil', category: 'education', emoji: '✏️', promptDescription: 'pencil writing icon' },
  { id: 'brain', label: 'Brain', category: 'education', emoji: '🧠', promptDescription: 'brain intelligence icon' },
  { id: 'atom', label: 'Atom', category: 'education', emoji: '⚛️', promptDescription: 'atom science icon' },
  { id: 'school', label: 'School', category: 'education', emoji: '🏫', promptDescription: 'school building icon' },

  // Entertainment & Gaming
  { id: 'gamepad', label: 'Gamepad', category: 'entertainment', emoji: '🎮', promptDescription: 'game controller icon' },
  { id: 'dice', label: 'Dice', category: 'entertainment', emoji: '🎲', promptDescription: 'dice gaming icon' },
  { id: 'theater', label: 'Theater', category: 'entertainment', emoji: '🎭', promptDescription: 'theater masks drama icon' },
  { id: 'sparkle', label: 'Sparkle', category: 'entertainment', emoji: '✨', promptDescription: 'sparkle magic icon' },
  { id: 'party', label: 'Party', category: 'entertainment', emoji: '🎉', promptDescription: 'party celebration icon' },
  { id: 'ticket', label: 'Ticket', category: 'entertainment', emoji: '🎟️', promptDescription: 'event ticket icon' },
]

// ============================================
// CATEGORY CONFIG
// ============================================

export const ICON_CATEGORIES = [
  { id: 'abstract' as const, label: 'Abstract', icon: '◇' },
  { id: 'nature' as const, label: 'Nature', icon: '🌿' },
  { id: 'tech' as const, label: 'Tech', icon: '💻' },
  { id: 'business' as const, label: 'Business', icon: '💼' },
  { id: 'communication' as const, label: 'Comm', icon: '💬' },
  { id: 'creative' as const, label: 'Creative', icon: '🎨' },
  { id: 'symbols' as const, label: 'Symbols', icon: '✦' },
  { id: 'health' as const, label: 'Health', icon: '🏥' },
  { id: 'education' as const, label: 'Education', icon: '🎓' },
  { id: 'entertainment' as const, label: 'Fun', icon: '🎮' },
]

// ============================================
// POSITION OPTIONS
// ============================================

export const POSITION_OPTIONS: PositionOption[] = [
  { id: 'before-text', label: 'Before', icon: '◀ A', description: 'Icon before text', promptDescription: 'icon positioned before the text' },
  { id: 'after-text', label: 'After', icon: 'A ▶', description: 'Icon after text', promptDescription: 'icon positioned after the text' },
  { id: 'above-text', label: 'Above', icon: '▲', description: 'Icon above text', promptDescription: 'icon positioned above the text' },
  { id: 'below-text', label: 'Below', icon: '▼', description: 'Icon below text', promptDescription: 'icon positioned below the text' },
  { id: 'left-of-text', label: 'Left', icon: '◀', description: 'Icon on left side', promptDescription: 'icon on the left side of the text' },
  { id: 'right-of-text', label: 'Right', icon: '▶', description: 'Icon on right side', promptDescription: 'icon on the right side of the text' },
  { id: 'behind-text', label: 'Behind', icon: '▣', description: 'Icon as background', promptDescription: 'large icon behind the text as watermark' },
  { id: 'replace-first-letter', label: 'Replace 1st', icon: '★A', description: 'Replace first letter', promptDescription: 'icon replacing the first letter of the text' },
  { id: 'integrated', label: 'Integrated', icon: '⊛', description: 'Woven into design', promptDescription: 'icon seamlessly integrated into the logo design' },
]

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getIconById(id: IconStyle): IconOption | undefined {
  return ICON_OPTIONS.find(i => i.id === id)
}

export function getPositionById(id: IconPosition): PositionOption | undefined {
  return POSITION_OPTIONS.find(p => p.id === id)
}

export function getIconPromptDescription(iconId: IconStyle | null, positionId: IconPosition | null): string {
  if (!iconId || iconId === 'none') return ''

  const icon = ICON_OPTIONS.find(i => i.id === iconId)
  const position = POSITION_OPTIONS.find(p => p.id === positionId)

  if (!icon) return ''

  let prompt = `Include a ${icon.promptDescription}`
  if (position) {
    prompt += ` ${position.promptDescription}`
  }

  return prompt
}
