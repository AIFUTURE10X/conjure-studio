// Toolbar Options Constants

export const ASPECT_RATIO_OPTIONS = [
  { value: '1:1', label: '1:1', description: 'Square' },
  { value: '16:9', label: '16:9', description: 'Landscape' },
  { value: '9:16', label: '9:16', description: 'Portrait' },
  { value: '4:3', label: '4:3', description: 'Standard' },
  { value: '3:4', label: '3:4', description: 'Portrait' },
  { value: '3:2', label: '3:2', description: 'Photo' },
  { value: '2:3', label: '2:3', description: 'Portrait' },
  { value: '21:9', label: '21:9', description: 'Cinematic' },
  { value: '5:4', label: '5:4', description: 'Classic' },
  { value: '4:5', label: '4:5', description: 'Instagram' },
]

export const CAMERA_ANGLE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'Eye-level shot', label: 'Eye-level shot' },
  { value: 'Low-angle shot', label: 'Low-angle shot' },
  { value: 'High-angle shot', label: 'High-angle shot' },
  { value: 'Aerial view', label: 'Aerial view' },
  { value: 'Dutch angle', label: 'Dutch angle' },
  { value: 'Over-the-shoulder shot', label: 'Over-the-shoulder' },
  { value: 'Point-of-view shot', label: 'Point-of-view' },
  { value: "Bird's-eye view", label: "Bird's-eye view" },
  { value: "Worm's-eye view", label: "Worm's-eye view" },
]

export const CAMERA_LENS_OPTIONS = [
  { value: '', label: 'None' },
  { value: '14mm ultra-wide', label: '14mm ultra-wide' },
  { value: '16mm fisheye', label: '16mm fisheye' },
  { value: '24mm wide-angle', label: '24mm wide-angle' },
  { value: '35mm standard', label: '35mm standard' },
  { value: '50mm prime', label: '50mm prime' },
  { value: '85mm portrait', label: '85mm portrait' },
  { value: '135mm telephoto', label: '135mm telephoto' },
  { value: '200mm super-telephoto', label: '200mm super' },
  { value: 'Macro lens', label: 'Macro lens' },
]

// Helper to get aspect ratio display dimensions
export function getAspectRatioDimensions(ratio: string): { width: string; height: string } {
  const portraitRatios = ['9:16', '3:4', '2:3', '4:5']
  const wideRatios = ['16:9', '4:3', '3:2', '5:4']

  if (ratio === '21:9') return { width: '42px', height: '18px' }
  if (portraitRatios.includes(ratio)) return { width: '20px', height: '34px' }
  if (wideRatios.includes(ratio)) return { width: '34px', height: '20px' }
  return { width: '34px', height: '34px' }
}
