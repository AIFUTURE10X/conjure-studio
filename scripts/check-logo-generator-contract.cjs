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
    name: 'logo AI knowledge exposes prompt blueprint instructions',
    pass: () => /buildLogoPromptBlueprintInstructions/.test(read('app/image-studio/constants/ai-logo-knowledge.ts')),
  },
  {
    name: 'logo AI mode asks for reusable prompt suggestions',
    pass: () => /suggestions/.test(read('app/api/generate-prompt-suggestion/route.ts')) &&
      /generation-ready logo prompt/.test(read('app/api/generate-prompt-suggestion/route.ts')),
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
    pass: () => /onApplyLogoSuggestions/.test(read('app/image-studio/components/AIHelperSidebar.tsx')) &&
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
    name: 'advanced settings exposes native transparent PNG option for OpenAI',
    pass: () => /Native transparent PNG/.test(read('app/image-studio/constants/logo-constants.ts')) &&
      /requiresModel:\s*'gpt-image-2'/.test(read('app/image-studio/constants/logo-constants.ts')) &&
      /method\.requiresModel/.test(read('app/image-studio/components/Logo/LogoAdvancedSettings.tsx')),
  },
  {
    name: 'OpenAI image client can request transparent PNG output',
    pass: () => /outputBackground\?:\s*OpenAIImageBackground/.test(read('lib/openai-image-client.ts')) &&
      /formData\.append\(\"background\",/.test(read('lib/openai-image-client.ts')) &&
      /\.\.\.\(background \? \{ background \} : \{\}\)/.test(read('lib/openai-image-client.ts')) &&
      /output_format:\s*\"png\"/.test(read('lib/openai-image-client.ts')),
  },
  {
    name: 'logo pipeline maps native transparency to OpenAI background parameter',
    pass: () => /bgRemovalMethod === 'native-transparent'/.test(read('app/api/generate-logo/logo-image-pipeline.ts')) &&
      /outputBackground:\s*request\.bgRemovalMethod === 'native-transparent' \? 'transparent' : 'auto'/.test(read('app/api/generate-logo/logo-image-pipeline.ts')),
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
      /material effects must stay clipped inside the logo/.test(read('app/api/generate-logo/logo-prompts.ts')),
  },
  {
    name: 'logo API rejects native transparency for non-OpenAI models',
    pass: () => /Native transparent PNG requires ChatGPT Images 2\.0/.test(read('app/api/generate-logo/route.ts')),
  },
  {
    name: 'default logo background removal bypasses Replicate',
    pass: () => /bgRemovalMethod:\s*'smart'/.test(read('lib/logo-generation-contract.ts')) &&
      !/bgRemovalMethod:\s*'replicate'/.test(read('lib/logo-generation-contract.ts')),
  },
  {
    name: 'logo panel defaults and reset use smart background removal',
    pass: () => /useState<BgRemovalMethod>\('smart'\)/.test(read('app/image-studio/hooks/useLogoPanelState.ts')) &&
      /setBgRemovalMethod\('smart'\)/.test(read('app/image-studio/hooks/useLogoPanelState.ts')),
  },
  {
    name: 'manual background removal defaults avoid Replicate',
    pass: () => /formData\.append\('bgRemovalMethod', 'smart'\)/.test(read('app/image-studio/components/GeneratePanel.tsx')) &&
      /formData\.append\('bgRemovalMethod', 'smart'\)/.test(read('app/image-studio/components/Logo/MockupPreview/generic/useBackgroundRemoval.ts')) &&
      /useState<BgRemovalMethod>\('smart'\)/.test(read('app/image-studio/hooks/useBackgroundRemoverState.ts')),
  },
  {
    name: 'batch generation fallback metadata uses smart background removal',
    pass: () => /DEFAULT_LOGO_GENERATION_SETTINGS\.bgRemovalMethod/.test(read('app/image-studio/hooks/useBatchGeneration.ts')) &&
      !/options\.bgRemovalMethod \|\| 'replicate'/.test(read('app/image-studio/hooks/useBatchGeneration.ts')),
  },
  {
    name: 'logo pipeline handles smart removal without Replicate',
    pass: () => /removeBackgroundSmart/.test(read('app/api/generate-logo/logo-image-pipeline.ts')) &&
      /request\.bgRemovalMethod === 'smart'/.test(read('app/api/generate-logo/logo-image-pipeline.ts')),
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
