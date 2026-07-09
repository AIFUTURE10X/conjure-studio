const fs = require('fs')
const path = require('path')

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath))

const noGeminiTextRoute = (relativePath) => {
  const source = read(relativePath)
  return !/@google\/generative-ai/.test(source) &&
    !/GoogleGenerativeAI/.test(source) &&
    !/getGenerativeModel/.test(source) &&
    !/generateContent\(/.test(source) &&
    !/getGeminiApiKey/.test(source)
}

const checks = [
  {
    name: 'OpenAI text client exists for helper and vision calls',
    pass: () => {
      const source = read('lib/openai-text-client.ts')
      return exists('lib/openai-text-client.ts') &&
        /OPENAI_API_KEY/.test(source) &&
        /https:\/\/api\.openai\.com\/v1\/responses/.test(source) &&
        /generateOpenAIText/.test(source) &&
        /generateOpenAIVisionText/.test(source) &&
        /isOpenAIRateLimitError/.test(source) &&
        /isOpenAIAuthError/.test(source)
    },
  },
  {
    name: 'AI helper route uses OpenAI instead of Gemini text models',
    pass: () => {
      const source = read('app/api/generate-prompt-suggestion/route.ts')
      return noGeminiTextRoute('app/api/generate-prompt-suggestion/route.ts') &&
        /generateOpenAIText/.test(source) &&
        /hasOpenAITextApiKey/.test(source) &&
        /getOpenAITextApiKeyNames/.test(source)
    },
  },
  {
    name: 'image analyzer uses OpenAI vision instead of Gemini',
    pass: () => {
      const source = read('app/api/analyze-image/route.ts')
      return noGeminiTextRoute('app/api/analyze-image/route.ts') &&
        /generateOpenAIVisionText/.test(source) &&
        /hasOpenAITextApiKey/.test(source)
    },
  },
  {
    name: 'logo enhancer uses OpenAI instead of Gemini',
    pass: () => {
      const source = read('app/api/enhance-logo-prompt/route.ts')
      return noGeminiTextRoute('app/api/enhance-logo-prompt/route.ts') &&
        /generateOpenAIText/.test(source) &&
        /hasOpenAITextApiKey/.test(source)
    },
  },
  {
    name: 'general image generation defaults to OpenAI reliability path',
    pass: () => /defaultModel: 'gpt-image-2'/.test(read('app/image-studio/constants/settings-defaults.ts')) &&
      /useState<'gemini-3\.1-flash-image-preview' \| 'gemini-3-pro-image-preview' \| 'gpt-image-2'>\('gpt-image-2'\)/.test(read('app/image-studio/hooks/useImageStudioState.ts')) &&
      /model: lenientModelSchema\.default\('gpt-image-2'\)/.test(read('app/api/generate-image/route.ts')),
  },
  {
    name: 'OpenAI image quality supports predictable medium and high tiers',
    pass: () => /export type OpenAIImageQuality = "low" \| "medium" \| "high" \| "auto"/.test(read('lib/openai-image-client.ts')) &&
      /generationMode === 'fast' \? 'low' : 'medium'/.test(read('app/image-studio/components/GeneratePanel.tsx')) &&
      /state\.analysisMode === 'fast' \? 'low' : 'medium'/.test(read('app/image-studio/context/ImageGenerationProvider.tsx')),
  },
  {
    name: 'gpt-image-2 calls do not request unsupported transparent backgrounds',
    pass: () => {
      const source = read('lib/openai-image-client.ts')
      return /background:\s*"transparent"/.test(source) === false &&
        /formData\.append\("background",/.test(source) === false &&
        /\.\.\.\(background \? \{ background \} : \{\}\)/.test(source) === false
    },
  },
  {
    name: 'visible app model settings only expose ChatGPT Images 2.0',
    pass: () => [
      'app/image-studio/constants/settings-defaults.ts',
      'app/image-studio/components/GeneratePanel/ModelSelector.tsx',
      'app/image-studio/components/Studio/SettingsRail/ImageSettingsRail.tsx',
      'app/image-studio/components/Studio/SettingsRail/LogoSettingsRail.tsx',
      'app/image-studio/components/Logo/LogoAdvancedSettings.tsx',
      'app/image-studio/constants/logo-constants.ts',
      'app/image-studio/components/Thumbnail/thumbnail-constants.ts',
    ].every((relativePath) => {
      const source = read(relativePath)
      return /ChatGPT Images 2\.0/.test(source) &&
        !/Gemini 3/.test(source) &&
        !/gemini-3\.1-flash-image-preview/.test(source) &&
        !/gemini-3-pro-image-preview/.test(source)
    }),
  },
  {
    name: 'AI helper model commands only expose ChatGPT Images 2.0',
    pass: () => {
      const helper = read('app/image-studio/components/AIHelper/useAIHelperChatController.ts')
      const route = read('app/api/generate-prompt-suggestion/route.ts')
      return /use chatgpt images 2/.test(helper) &&
        /selectedModel:\s*'gpt-image-2'/.test(helper) &&
        !/use gemini/.test(helper) &&
        !/selectedModel:\s*'gemini-/.test(helper) &&
        /suggestions\.selectedModel \("gpt-image-2" only\)/.test(route) &&
        !/suggestions\.selectedModel \("gemini/.test(route)
    },
  },
  {
    name: 'remote master thumbnail mode is present in the local studio shell',
    pass: () => {
      const topBar = read('app/image-studio/components/Studio/StudioTopBar.tsx')
      const canvas = read('app/image-studio/components/Studio/CanvasPanel.tsx')
      const types = read('app/image-studio/context/studio-types.ts')
      return /mode: 'thumbnail', label: 'Thumbnail'/.test(topBar) &&
        /mode === 'thumbnail' && <ThumbnailCanvas \/>/.test(canvas) &&
        /export type StudioMode = 'image' \| 'logo' \| 'mockups' \| 'bg-remover' \| 'thumbnail'/.test(types)
    },
  },
  {
    name: 'style settings rail preserves hover thumbnail previews',
    pass: () => {
      const chipSelect = read('app/image-studio/components/Studio/SettingsRail/ChipSelect.tsx')
      const imageRail = read('app/image-studio/components/Studio/SettingsRail/ImageSettingsRail.tsx')
      return /thumbnail\?: string/.test(chipSelect) &&
        /preview\?\.thumbnail/.test(chipSelect) &&
        /src=\{preview\.thumbnail\}/.test(chipSelect) &&
        /thumbnail: s\.thumbnail/.test(imageRail) &&
        /description: s\.description/.test(imageRail)
    },
  },
  {
    name: 'thumbnail generator defaults to ChatGPT Images 2.0',
    pass: () => {
      const constants = read('app/image-studio/components/Thumbnail/thumbnail-constants.ts')
      const utils = read('app/image-studio/components/Thumbnail/thumbnail-utils.ts')
      const generate = read('app/image-studio/components/Thumbnail/useThumbnailGenerate.ts')
      return /THUMBNAIL_MODELS: ThumbnailModelOption\[\] = \[\s*\{ id: 'gpt-image-2', label: 'GPT', full: 'ChatGPT Images 2\.0' \},\s*\]/.test(constants) &&
        /options\?\.model \|\| 'gpt-image-2'/.test(utils) &&
        /form\.append\('model', 'gpt-image-2'\)/.test(generate) &&
        !/gemini-3\.1-flash-image-preview/.test(constants + utils + generate) &&
        !/gemini-3-pro-image-preview/.test(constants + utils + generate)
    },
  },
  {
    name: 'thumbnail ideas route uses OpenAI instead of Gemini text models',
    pass: () => {
      const source = read('app/api/generate-thumbnail-concepts/route.ts')
      return noGeminiTextRoute('app/api/generate-thumbnail-concepts/route.ts') &&
        /generateOpenAIText/.test(source) &&
        /hasOpenAITextApiKey/.test(source)
    },
  },
  {
    name: 'mockup photo generator uses OpenAI image generation',
    pass: () => {
      const source = read('app/api/generate-mockup-photos/route.ts')
      return /generateOpenAIImage/.test(source) &&
        !/generateImageWithRetry/.test(source) &&
        !/gemini-3-pro-image-preview/.test(source)
    },
  },
]

const failures = []
for (const check of checks) {
  try {
    if (!check.pass()) failures.push(check.name)
  } catch (error) {
    failures.push(`${check.name} (${error.message})`)
  }
}

if (failures.length > 0) {
  console.error('OpenAI reliability migration contract failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`OpenAI reliability migration contract passed (${checks.length} checks).`)
