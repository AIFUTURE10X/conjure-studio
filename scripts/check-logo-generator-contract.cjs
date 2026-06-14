const fs = require('fs')
const path = require('path')

const root = process.cwd()

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath))

const checks = [
  {
    name: 'shared logo generation contract exists',
    pass: () => exists('lib/logo-generation-contract.ts'),
  },
  {
    name: 'contract defines exact-text overlay mode',
    pass: () => /exact-text-overlay/.test(read('lib/logo-generation-contract.ts')),
  },
  {
    name: 'logo API uses request parser helper',
    pass: () => /parseLogoGenerationRequest/.test(read('app/api/generate-logo/route.ts')),
  },
  {
    name: 'logo API uses image pipeline helper',
    pass: () => /generateLogoBaseImage/.test(read('app/api/generate-logo/route.ts')),
  },
  {
    name: 'prompt builder accepts text mode',
    pass: () => /LogoTextMode/.test(read('app/api/generate-logo/logo-prompts.ts')),
  },
  {
    name: 'advanced settings exposes text handling',
    pass: () => /Text Handling/.test(read('app/image-studio/components/Logo/LogoAdvancedSettings.tsx')),
  },
  {
    name: 'advanced settings exposes logo-native style controls',
    pass: () => {
      const constants = read('app/image-studio/constants/logo-constants.ts')
      const advanced = read('app/image-studio/components/Logo/LogoAdvancedSettings.tsx')
      const selector = read('app/image-studio/components/Logo/LogoStyleSelector.tsx')
      const state = read('app/image-studio/hooks/useLogoPanelState.ts')
      const promptBuilder = read('app/api/generate-logo/logo-prompts.ts')
      return /LogoType/.test(constants) &&
        /LogoVisualStyle/.test(constants) &&
        /LogoRenderTreatment/.test(constants) &&
        /LogoTypographyDirection/.test(constants) &&
        /Logo Style/.test(advanced) &&
        /LogoStyleSelector/.test(advanced) &&
        /Logo Type/.test(selector) &&
        /Visual Style/.test(selector) &&
        /Render Treatment/.test(selector) &&
        /Typography Direction/.test(selector) &&
        /useState<LogoType>\('icon-wordmark'\)/.test(state) &&
        /useState<LogoVisualStyle>\('modern'\)/.test(state) &&
        /useState<LogoRenderTreatment>\('flat-vector'\)/.test(state) &&
        /useState<LogoTypographyDirection>\('clean-sans'\)/.test(state) &&
        /SELECTED LOGO STYLE SETTINGS/.test(promptBuilder) &&
        /formatSelectedLogoStyleGuidance/.test(promptBuilder)
    },
  },
  {
    name: 'logo AI knowledge exposes prompt blueprint instructions',
    pass: () => /buildLogoPromptBlueprintInstructions/.test(read('app/image-studio/constants/ai-logo-knowledge.ts')),
  },
  {
    name: 'logo AI mode asks for reusable prompt suggestions',
    pass: () => /suggestions/.test(read('app/api/generate-prompt-suggestion/route.ts')) &&
      /generation-ready logo prompt/.test(read('app/api/generate-prompt-suggestion/route.ts')),
  },
  {
    name: 'logo AI helper does not force Dot Matrix 3D styling',
    pass: () => /general-purpose brand identity and logo design assistant/.test(read('app/image-studio/constants/ai-logo-knowledge.ts')) &&
      /Return an empty logoConfig unless/.test(read('app/image-studio/constants/ai-logo-knowledge.ts')) &&
      /suggest appropriate general logo settings and a generation-ready logo prompt/.test(read('app/api/generate-prompt-suggestion/route.ts')) &&
      !/specialized in creating Dot Matrix 3D logos/.test(read('app/image-studio/constants/ai-logo-knowledge.ts')) &&
      !/suggest appropriate Dot Matrix 3D logo settings/.test(read('app/api/generate-prompt-suggestion/route.ts')),
  },
  {
    name: 'logo AI messages preserve prompt suggestions',
    pass: () => /mode:\s*'logo'[\s\S]*suggestions:\s*data\.suggestions/.test(read('app/image-studio/hooks/useAIHelper.ts')),
  },
  {
    name: 'logo prompt enhancer can return a negative prompt',
    pass: () => /negativePrompt/.test(read('app/api/enhance-logo-prompt/route.ts')) &&
      /setNegativePrompt\(data\.negativePrompt\)/.test(read('app/image-studio/components/Logo/LogoPromptSection.tsx')),
  },
  {
    name: 'AI helper has a separate logo suggestion apply callback',
    pass: () => /onApplyLogoSuggestions/.test(read('app/image-studio/components/Studio/HelperPanel.tsx')) &&
      /handleApplyLogoSuggestions/.test(read('app/image-studio/hooks/usePageState.ts')),
  },
  {
    name: 'logo suggestions switch to the logo generator when applied',
    pass: () => /handleApplyLogoSuggestions[\s\S]*setActiveTab\('logo'\)/.test(read('app/image-studio/hooks/usePageState.ts')),
  },
  {
    name: 'suggestion cards label their apply destination',
    pass: () => /Apply to Logo Generator/.test(read('app/image-studio/components/AIHelper/SuggestionCard.tsx')) &&
      /Apply to Image Generator/.test(read('app/image-studio/components/AIHelper/SuggestionCard.tsx')),
  },
  {
    name: 'contract defines native transparent background method',
    pass: () => /native-transparent/.test(read('lib/logo-generation-contract.ts')),
  },
  {
    name: 'advanced settings exposes only PhotoRoom on off background removal',
    pass: () => /PhotoRoom BG/.test(read('app/image-studio/components/Logo/LogoAdvancedSettings.tsx')) &&
      /setBgRemovalMethod\(DEFAULT_LOGO_GENERATION_SETTINGS\.bgRemovalMethod\)/.test(read('app/image-studio/components/Logo/LogoAdvancedSettings.tsx')) &&
      /setBgRemovalMethod\('none'\)/.test(read('app/image-studio/components/Logo/LogoAdvancedSettings.tsx')) &&
      !/BG_REMOVAL_METHODS/.test(read('app/image-studio/components/Logo/LogoAdvancedSettings.tsx')) &&
      !/<select/.test(read('app/image-studio/components/Logo/LogoAdvancedSettings.tsx')),
  },
  {
    name: 'OpenAI image client avoids unsupported transparent background requests',
    pass: () => /output_format:\s*\"png\"/.test(read('lib/openai-image-client.ts')) &&
      !/formData\.append\(\"background\",/.test(read('lib/openai-image-client.ts')) &&
      !/background:\s*\"transparent\"/.test(read('lib/openai-image-client.ts')) &&
      !/\.\.\.\(background \? \{ background \} : \{\}\)/.test(read('lib/openai-image-client.ts')),
  },
  {
    name: 'logo pipeline keeps legacy transparency as local cleanup',
    pass: () => /bgRemovalMethod === 'native-transparent'/.test(read('app/api/generate-logo/logo-image-pipeline.ts')) &&
      /outputBackground:\s*'auto'/.test(read('app/api/generate-logo/logo-image-pipeline.ts')),
  },
  {
    name: 'logo pipeline verifies native transparent output has alpha',
    pass: () => /hasTransparency/.test(read('app/api/generate-logo/logo-image-pipeline.ts')) &&
      /ensureNativeTransparentLogo/.test(read('app/api/generate-logo/logo-image-pipeline.ts')) &&
      /OpenAI returned an opaque PNG/.test(read('app/api/generate-logo/logo-image-pipeline.ts')),
  },
  {
    name: 'native transparent prompt forbids presentation backdrops',
    pass: () => /isNativeTransparent/.test(read('app/api/generate-logo/logo-prompts.ts')) &&
      /No presentation backdrop/.test(read('app/api/generate-logo/logo-prompts.ts')) &&
      /transparent-background cleanup/.test(read('app/api/generate-logo/logo-prompts.ts')) &&
      /material effects must stay clipped inside the logo/.test(read('app/api/generate-logo/logo-prompts.ts')),
  },
  {
    name: 'logo API rejects native transparency for non-OpenAI models',
    pass: () => /Native transparent PNG requires ChatGPT Images 2\.0/.test(read('app/api/generate-logo/route.ts')),
  },
  {
    name: 'default logo background removal uses PhotoRoom without Replicate',
    pass: () => /bgRemovalMethod:\s*'photoroom'/.test(read('lib/logo-generation-contract.ts')) &&
      !/bgRemovalMethod:\s*'replicate'/.test(read('lib/logo-generation-contract.ts')),
  },
  {
    name: 'default logo model uses ChatGPT Images when Gemini key is optional',
    pass: () => /model:\s*'gpt-image-2'/.test(read('lib/logo-generation-contract.ts')) &&
      /useState<LogoGenerationModel>\(DEFAULT_LOGO_GENERATION_SETTINGS\.model\)/.test(read('app/image-studio/hooks/useLogoPanelState.ts')) &&
      /setSelectedModel\(DEFAULT_LOGO_GENERATION_SETTINGS\.model\)/.test(read('app/image-studio/hooks/useLogoPanelState.ts')) &&
      /value: 'gpt-image-2', label: 'ChatGPT Images 2\.0'/.test(read('app/image-studio/components/Studio/SettingsRail/LogoSettingsRail.tsx')),
  },
  {
    name: 'logo generation applies selected background removal by default',
    pass: () => /options\.skipBgRemoval === true \? 'true' : 'false'/.test(read('app/image-studio/hooks/useLogoGeneration.ts')) &&
      /DEFAULT_LOGO_GENERATION_SETTINGS\.bgRemovalMethod/.test(read('app/image-studio/hooks/useLogoGeneration.ts')) &&
      !/Skip background removal by default/.test(read('app/image-studio/hooks/useLogoGeneration.ts')),
  },
  {
    name: 'logo panel defaults and reset follow shared background removal default',
    pass: () => /useState<BgRemovalMethod>\(DEFAULT_LOGO_GENERATION_SETTINGS\.bgRemovalMethod\)/.test(read('app/image-studio/hooks/useLogoPanelState.ts')) &&
      /setBgRemovalMethod\(DEFAULT_LOGO_GENERATION_SETTINGS\.bgRemovalMethod\)/.test(read('app/image-studio/hooks/useLogoPanelState.ts')),
  },
  {
    name: 'image generator exposes PhotoRoom background removal toggle',
    pass: () => /useImageBgRemoval/.test(read('app/image-studio/components/GeneratePanel.tsx')) &&
      /usePhotoRoomBgRemoval/.test(read('app/image-studio/components/GeneratePanel.tsx')) &&
      /photoRoomBgRemovalEnabled/.test(read('app/image-studio/components/GeneratePanel.tsx')) &&
      /checked=\{photoRoomBgRemovalEnabled\}/.test(read('app/image-studio/components/GeneratePanel.tsx')) &&
      /setPhotoRoomBgRemovalEnabled\(e\.target\.checked\)/.test(read('app/image-studio/components/GeneratePanel.tsx')) &&
      !/usePhotoRoomBgRemoval \? 'photoroom' : 'smart'/.test(read('app/image-studio/components/GeneratePanel.tsx')) &&
      /PhotoRoom BG/.test(read('app/image-studio/components/GeneratePanel.tsx')),
  },
  {
    name: 'image generator omits redundant toolbar background removal button',
    pass: () => !/RemoveBgButton/.test(read('app/image-studio/components/GeneratePanel.tsx')) &&
      !/handleBulkRemoveBackground/.test(read('app/image-studio/components/GeneratePanel.tsx')),
  },
  {
    name: 'manual background removal uses PhotoRoom and avoids Replicate',
    pass: () => /if \(!photoRoomBgRemovalEnabled\)/.test(read('app/image-studio/components/GeneratePanel.tsx')) &&
      /formData\.append\('bgRemovalMethod', 'photoroom'\)/.test(read('app/image-studio/components/GeneratePanel.tsx')) &&
      !/formData\.append\('bgRemovalMethod', 'replicate'\)/.test(read('app/image-studio/components/GeneratePanel.tsx')) &&
      /formData\.append\('bgRemovalMethod', 'photoroom'\)/.test(read('app/image-studio/components/Logo/MockupPreview/generic/useBackgroundRemoval.ts')) &&
      /useState<BgRemovalMethod>\('photoroom'\)/.test(read('app/image-studio/hooks/useBackgroundRemoverState.ts')),
  },
  {
    name: 'batch generation fallback metadata uses shared background removal default',
    pass: () => /DEFAULT_LOGO_GENERATION_SETTINGS\.bgRemovalMethod/.test(read('app/image-studio/hooks/useBatchGeneration.ts')) &&
      !/options\.bgRemovalMethod \|\| 'replicate'/.test(read('app/image-studio/hooks/useBatchGeneration.ts')),
  },
  {
    name: 'logo pipeline keeps legacy smart removal without Replicate',
    pass: () => /removeBackgroundSmart/.test(read('app/api/generate-logo/logo-image-pipeline.ts')) &&
      /request\.bgRemovalMethod === 'smart'/.test(read('app/api/generate-logo/logo-image-pipeline.ts')),
  },
  {
    name: 'advanced logo settings expose PhotoRoom cleanup',
    pass: () => /PhotoRoom BG/.test(read('app/image-studio/components/Logo/LogoAdvancedSettings.tsx')) &&
      /PhotoRoom removes the background after generation/.test(read('app/image-studio/components/Logo/LogoAdvancedSettings.tsx')),
  },
  {
    name: 'advanced logo settings can disable background removal for normal logo backgrounds',
    pass: () => /checked=\{bgRemovalMethod !== 'none'\}/.test(read('app/image-studio/components/Logo/LogoAdvancedSettings.tsx')) &&
      /setBgRemovalMethod\('none'\)/.test(read('app/image-studio/components/Logo/LogoAdvancedSettings.tsx')) &&
      /DEFAULT_LOGO_GENERATION_SETTINGS\.bgRemovalMethod/.test(read('app/image-studio/components/Logo/LogoAdvancedSettings.tsx')) &&
      /Off keeps the generated logo background intact/.test(read('app/image-studio/components/Logo/LogoAdvancedSettings.tsx')),
  },
  {
    name: 'logo pipeline calls PhotoRoom for selected cleanup without smart fallback',
    pass: () => /removeBackgroundWithPhotoRoom/.test(read('app/api/generate-logo/logo-image-pipeline.ts')) &&
      /isPhotoRoomBgRemovalAvailable/.test(read('app/api/generate-logo/logo-image-pipeline.ts')) &&
      /request\.bgRemovalMethod === 'photoroom'/.test(read('app/api/generate-logo/logo-image-pipeline.ts')) &&
      /PhotoRoom background removal is selected but PHOTOROOM_API_KEY is not configured/.test(read('app/api/generate-logo/logo-image-pipeline.ts')) &&
      !/PhotoRoom unavailable/.test(read('app/api/generate-logo/logo-image-pipeline.ts')),
  },
  {
    name: 'normal background logos use free-form presentation prompt',
    pass: () => /request\.bgRemovalMethod === 'none'/.test(read('app/api/generate-logo/logo-image-pipeline.ts')) &&
      /return request\.skipBgRemoval \|\| request\.bgRemovalMethod === 'none' \|\| cloudRemovalAvailable/.test(read('app/api/generate-logo/logo-image-pipeline.ts')),
  },
  {
    name: 'logo API returns the actual background removal method used',
    pass: () => /LogoBackgroundRemovalResult/.test(read('app/api/generate-logo/logo-image-pipeline.ts')) &&
      /processedLogo\.imageBase64/.test(read('app/api/generate-logo/route.ts')) &&
      /bgRemovalMethod:\s*processedLogo\.bgRemovalMethod/.test(read('app/api/generate-logo/route.ts')) &&
      /bgRemovalMethod:\s*data\.bgRemovalMethod \|\| options\.bgRemovalMethod/.test(read('app/image-studio/hooks/useLogoGeneration.ts')),
  },
  {
    name: 'reference logo generation prioritizes user prompt typography and background',
    pass: () => /buildReferenceLogoPrompt/.test(read('app/api/generate-logo/logo-prompts.ts')) &&
      /REFERENCE TYPOGRAPHY PRIORITY/.test(read('app/api/generate-logo/logo-prompts.ts')) &&
      /USER PROMPT HAS PRIORITY/.test(read('app/api/generate-logo/logo-prompts.ts')) &&
      /referenceMode/.test(read('app/api/generate-logo/logo-request.ts')) &&
      /formData\.append\('referenceMode', options\.referenceMode\)/.test(read('app/image-studio/hooks/useLogoGeneration.ts')) &&
      /referenceMode:\s*state\.referenceMode === 'replicate' \? 'replicate' : 'inspire'/.test(read('app/image-studio/components/LogoPanel/useLogoPanelGenerate.ts')),
  },
  {
    name: 'logo history stores the actual background removal method used',
    pass: () => /bgRemovalMethod\?:\s*BgRemovalMethod/.test(read('app/image-studio/components/LogoPanel/useLogoPanelGenerate.ts')) &&
      /bgRemovalMethod:\s*logo\.bgRemovalMethod \|\| state\.bgRemovalMethod/.test(read('app/image-studio/components/LogoPanel/useLogoPanelGenerate.ts')),
  },
  {
    name: 'upscale defaults avoid Replicate',
    pass: () => /const method = \(formData\.get\('method'\) as UpscaleMethod\) \|\| 'fast'/.test(read('app/api/upscale-logo/route.ts')) &&
      /formData\.append\('method', 'fast'\)/.test(read('app/image-studio/hooks/useImageGeneration.ts')) &&
      /method: 'ai' \| 'fast' = 'fast'/.test(read('app/image-studio/hooks/useLogoPanelHandlers.ts')),
  },
  {
    name: 'image overload fallback upscales without Replicate',
    pass: () => /upscaleBase64WithSharp/.test(read('app/api/generate-image/route.ts')) &&
      !/replicate-upscaler/.test(read('app/api/generate-image/route.ts')),
  },
  {
    name: 'mockup photo generator removes backgrounds without Replicate',
    pass: () => /removeBackgroundSmart/.test(read('app/api/generate-mockup-photos/route.ts')) &&
      !/removeBackgroundWithReplicate/.test(read('app/api/generate-mockup-photos/route.ts')),
  },
  {
    name: 'recolor logo uses OpenAI image editing without Replicate',
    pass: () => /generateOpenAIImage/.test(read('app/api/recolor-logo/route.ts')) &&
      !/from "replicate"|replicate\.run|REPLICATE_API_TOKEN/.test(read('app/api/recolor-logo/route.ts')),
  },
]

const failures = checks.filter((check) => {
  try {
    return !check.pass()
  } catch {
    return true
  }
})

if (failures.length > 0) {
  console.error('Logo generator contract checks failed:')
  for (const failure of failures) {
    console.error(`- ${failure.name}`)
  }
  process.exit(1)
}

console.log('Logo generator contract checks passed')
