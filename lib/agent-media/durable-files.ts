import { closeSync, existsSync, fsyncSync, linkSync, mkdirSync, openSync, rmdirSync, unlinkSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export function flushDirectory(path: string) {
  const fd = openSync(path, 'r')
  try { fsyncSync(fd) } finally { closeSync(fd) }
}

function windowsMove(source: string, destination: string) {
  // Same-volume, no replacement; native WRITE_THROUGH is required, not a
  // best-effort fsync of a directory (unsupported by Node on Windows).
  execFileSync('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-File',
    fileURLToPath(new URL('../../scripts/media-durable-move.ps1', import.meta.url))],
  { input: JSON.stringify({ source, destination }), encoding: 'utf8', windowsHide: true, timeout: 30_000, stdio: ['pipe', 'pipe', 'pipe'] })
}

export function durableDirectory(path: string) {
  if (existsSync(path)) return
  const parent = dirname(path)
  durableDirectory(parent)
  if (process.platform === 'win32') {
    const temp = `${path}.${randomUUID()}.tmp`
    mkdirSync(temp, { mode: 0o700 })
    try { windowsMove(temp, path) } finally { if (existsSync(temp)) rmdirSync(temp) }
  } else {
    mkdirSync(path, { mode: 0o700 })
    flushDirectory(path); flushDirectory(parent)
  }
}

export function durablePublish(temp: string, destination: string) {
  if (process.platform === 'win32') windowsMove(temp, destination)
  else { linkSync(temp, destination); flushDirectory(dirname(destination)) }
}

export function durableRemove(path: string) {
  if (process.platform === 'win32') {
    const tombstone = `${path}.${randomUUID()}.tmp`
    windowsMove(path, tombstone)
    unlinkSync(tombstone)
  } else { unlinkSync(path); flushDirectory(dirname(path)) }
}
