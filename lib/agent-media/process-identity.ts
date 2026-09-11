import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { requireMedia } from './contracts'

export function processBirth(pid: number): string | null {
  requireMedia(Number.isSafeInteger(pid) && pid > 0, 'Invalid writer PID')
  const absent = () => {
    try { process.kill(pid, 0); return false } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ESRCH') return true
      throw new Error('Cannot establish writer identity')
    }
  }
  if (absent()) return null
  try {
    if (process.platform === 'win32') {
      const start = execFileSync('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command',
        `[System.Diagnostics.Process]::GetProcessById(${pid}).StartTime.ToUniversalTime().Ticks.ToString()`],
      { encoding: 'utf8', windowsHide: true, timeout: 15_000, stdio: ['ignore', 'pipe', 'pipe'] }).trim()
      requireMedia(/^\d+$/.test(start), 'Cannot establish writer birth')
      return `windows:${start}`
    }
    if (process.platform === 'linux') {
      const stat = readFileSync(`/proc/${pid}/stat`, 'utf8')
      const start = stat.slice(stat.lastIndexOf(')') + 2).split(' ')[19]
      requireMedia(/^\d+$/.test(start), 'Cannot establish writer birth')
      return `linux:${readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim()}:${start}`
    }
    const start = execFileSync('ps', ['-p', String(pid), '-o', 'lstart='], { encoding: 'utf8', timeout: 15_000 }).trim()
    requireMedia(start.length > 0, 'Cannot establish writer birth')
    return `${process.platform}:${start}`
  } catch {
    if (absent()) return null
    throw new Error('Cannot establish writer identity; leave the lock intact')
  }
}

let ownBirth: string | undefined
export function writerBirth() {
  if (!ownBirth) {
    const birth = processBirth(process.pid)
    requireMedia(birth, 'Cannot establish own process identity')
    ownBirth = birth
  }
  return ownBirth
}
