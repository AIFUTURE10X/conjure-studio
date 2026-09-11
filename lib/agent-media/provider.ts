import { generateOpenAIImage } from '../openai-image-client'
import type { Provider } from './contracts'

// Reuse the same service function as Conjure's image route; do not call that
// anonymous HTTP route or duplicate its provider routing in the MCP boundary.
export const conjureImageProvider: Provider = {
  async generate(request, size, reference) {
    const result = await generateOpenAIImage({
      prompt: request.prompt, aspectRatio: request.aspectRatio, imageSize: '1K',
      imageQuality: request.quality, exactSize: size, requestTimeoutMs: 100_000,
      referenceImageFile: reference ? new File([new Uint8Array(reference)], 'reference.png', { type: 'image/png' }) : undefined,
    })
    return Buffer.from(result.imageBase64, 'base64')
  },
}
