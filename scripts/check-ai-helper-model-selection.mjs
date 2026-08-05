import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const root = process.cwd()
const modelModulePath = path.join(root, 'lib', 'ai-helper-models.ts')

assert.equal(existsSync(modelModulePath), true, 'AI helper model resolver must exist')

const {
  normalizeAIHelperModelChoice,
  resolveAIHelperModel,
} = await import(pathToFileURL(modelModulePath).href)

assert.equal(normalizeAIHelperModelChoice('best'), 'best')
assert.equal(normalizeAIHelperModelChoice('opus'), 'opus')
assert.equal(normalizeAIHelperModelChoice('unexpected'), 'auto')

assert.deepEqual(
  resolveAIHelperModel('auto', { OPENAI_TEXT_MODEL: ' gpt-5.4 ' }),
  { choice: 'auto', provider: 'openai', model: 'gpt-5.4' },
)
assert.deepEqual(
  resolveAIHelperModel('best', {}),
  { choice: 'best', provider: 'openai', model: 'gpt-5.6-sol' },
)
assert.deepEqual(
  resolveAIHelperModel('opus', {}),
  { choice: 'opus', provider: 'anthropic', model: 'claude-opus-5' },
)

const hook = readFileSync(path.join(root, 'app/image-studio/hooks/useAIHelper.ts'), 'utf8')
const controller = readFileSync(path.join(root, 'app/image-studio/components/AIHelper/useAIHelperChatController.ts'), 'utf8')
const chat = readFileSync(path.join(root, 'app/image-studio/components/AIHelper/AIHelperChat.tsx'), 'utf8')
const route = readFileSync(path.join(root, 'app/api/generate-prompt-suggestion/route.ts'), 'utf8')

assert.match(hook, /helperModel:\s*options\.modelChoice/)
assert.match(controller, /retryLastPromptWithBest/)
assert.match(chat, /AIHelperModelSelector/)
assert.match(route, /generateAIHelperText\(systemPrompt, helperModel\)/)
assert.match(route, /generateAIHelperText\(fullPrompt, helperModel\)/)

console.log('AI helper model selection checks passed')
