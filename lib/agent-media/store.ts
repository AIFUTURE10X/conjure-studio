import { closeSync, existsSync, fsyncSync, linkSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, parse, resolve } from 'node:path'
import { hostname } from 'node:os'
import { randomUUID } from 'node:crypto'
import { requireMedia, safeId, hash } from './contracts'

export class MediaStore {
  readonly root: string
  constructor(root: string, readonly owner: string) {
    requireMedia(isAbsolute(root), 'Media dataRoot must be absolute')
    this.root = resolve(root)
    this.path()
    mkdirSync(this.root, { recursive: true, mode: 0o700 })
    const identity = this.path('identity.json')
    if (!existsSync(identity)) this.write('identity.json', { owner, version: 1 })
    requireMedia(this.read<{ owner: string }>('identity.json').owner === owner, 'Store belongs to another operator')
  }
  path(...parts: string[]) {
    requireMedia(parts.every(p => /^[a-zA-Z0-9_.-]+$/.test(p) && p !== '.' && p !== '..'), 'Invalid storage path')
    const target = join(this.root, ...parts)
    // Reject reparse points in both the configured root ancestry and child paths.
    let cursor = parse(target).root
    for (const part of target.slice(cursor.length).split(/[\\/]/).filter(Boolean)) {
      cursor = join(cursor, part)
      requireMedia(!existsSync(cursor) || !lstatSync(cursor).isSymbolicLink(), 'Symlink storage paths are not supported')
    }
    return target
  }
  exists(...parts: string[]) { return existsSync(this.path(...parts)) }
  read<T>(...parts: string[]): T {
    const bytes = readFileSync(this.path(...parts))
    requireMedia(bytes.length <= 1_000_000, 'Stored record exceeds limit')
    try { return JSON.parse(bytes.toString('utf8')) as T } catch { throw new Error('Stored record is invalid; restore a complete backup') }
  }
  write(file: string, value: unknown, folder?: string) {
    this.bytes(folder ? [folder, file] : [file], Buffer.from(JSON.stringify(value)))
  }
  bytes(parts: string[], bytes: Buffer) {
    const destination = this.path(...parts)
    mkdirSync(dirname(destination), { recursive: true, mode: 0o700 })
    const temp = this.path(...parts.slice(0, -1), `${parts.at(-1)}.${randomUUID()}.tmp`)
    const fd = openSync(temp, 'wx', 0o600)
    try { writeFileSync(fd, bytes); fsyncSync(fd) } finally { closeSync(fd) }
    try { linkSync(temp, destination) } finally { unlinkSync(temp) }
  }
  list() {
    return readdirSync(this.root).filter(name => /^[a-f0-9]{64}$/.test(name) && lstatSync(this.path(name)).isDirectory())
  }
  async lock<T>(work: () => Promise<T>): Promise<T> {
    const path = this.path('writer.lock')
    let fd: number
    try { fd = openSync(path, 'wx', 0o600) } catch { throw new Error('Media store locked; wait for the active operation or inspect a stale lock') }
    const token = randomUUID()
    try {
      writeFileSync(fd, JSON.stringify({ pid: process.pid, host: hostname(), token })); fsyncSync(fd)
      return await work()
    } finally { closeSync(fd); unlinkSync(path) }
  }
  operationId(key: string) { safeId.parse(key); return hash([this.owner, key]) }
}
