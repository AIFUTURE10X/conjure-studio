import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { MediaStore } from './store'

test('POSIX publication flushes new directory ancestry and final record directory', t => {
  const root = fs.mkdtempSync(join(tmpdir(), 'media-durability-'))
  const platform = Object.getOwnPropertyDescriptor(process, 'platform')!
  const open = fs.openSync, close = fs.closeSync, flush = fs.fsyncSync
  const directories = new Map<number, string>(), synced: string[] = []
  let next = -100
  Object.defineProperty(process, 'platform', { value: 'linux' })
  t.after(() => {
    t.mock.restoreAll(); syncBuiltinESMExports(); Object.defineProperty(process, 'platform', platform)
    fs.rmSync(root, { recursive: true, force: true })
  })
  // Directory handles are modeled so the same persistence contract runs on Windows.
  t.mock.method(fs, 'openSync', (...args: Parameters<typeof open>) => {
    if (fs.existsSync(args[0]) && fs.statSync(args[0]).isDirectory()) {
      const fd = next--; directories.set(fd, String(args[0])); return fd
    }
    return open(...args)
  })
  t.mock.method(fs, 'closeSync', (fd: number) => { if (!directories.has(fd)) close(fd) })
  t.mock.method(fs, 'fsyncSync', (fd: number) => { if (directories.has(fd)) synced.push(directories.get(fd)!); else flush(fd) })
  syncBuiltinESMExports()
  const storeRoot = join(root, 'new-store'), store = new MediaStore(storeRoot, 'fixture')
  store.write('reserved.json', { retained: true }, 'operation')
  assert.ok(synced.includes(dirname(storeRoot)), 'New store entry must be durable in its parent')
  assert.ok(synced.includes(storeRoot), 'New operation entry must be durable in the store')
  assert.ok(synced.includes(join(storeRoot, 'operation')), 'Final reservation name must be flushed before return')
  assert.deepEqual(store.read('operation', 'reserved.json'), { retained: true })
})
