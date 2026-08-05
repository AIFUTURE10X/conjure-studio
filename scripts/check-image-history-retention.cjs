#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

function read(relativePath) {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing ${relativePath}`)
  }
  return fs.readFileSync(absolutePath, 'utf8')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const sharedLimit = read('lib/image-history-retention.ts')
const clientHistory = read('lib/history.ts')
const serverStore = read('lib/db/generation-history-store.ts')
const historyRoute = read('app/api/history/route.ts')

assert(
  /IMAGE_HISTORY_RETENTION_LIMIT\s*=\s*250/.test(sharedLimit),
  'The shared image-history retention limit must be 250 rows.',
)
assert(
  /IMAGE_HISTORY_RETENTION_LIMIT/.test(clientHistory) &&
    !/MAX_HISTORY_ITEMS\s*=\s*100/.test(clientHistory),
  'The client history cache must use the shared retention limit.',
)
assert(
  /IMAGE_HISTORY_RETENTION_LIMIT/.test(serverStore) &&
    !/RETENTION_LIMIT\s*=\s*100/.test(serverStore),
  'The server-side history prune must use the shared retention limit.',
)
assert(
  /LIMIT\s+\$\{IMAGE_HISTORY_RETENTION_LIMIT\}/.test(historyRoute) &&
    !/LIMIT\s+100/.test(historyRoute),
  'The history API read limit must use the shared retention limit.',
)

console.log('✅ Image history retention uses the shared 250-row limit')
