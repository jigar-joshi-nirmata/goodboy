import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import chalk from 'chalk'
import { PersonaId, Mood, Protocol } from './personas/types.js'
import { getPersona } from './personas/index.js'

const SPRITES_DIR = path.join(__dirname, '..', 'sprites')

// When stdout is captured by Claude Code hooks, write directly to the terminal
const _ttyFd = (() => {
  if (process.stdout.isTTY) return null
  try { return fs.openSync('/dev/tty', 'w') } catch { return null }
})()

function ttyWrite(s: string): void {
  if (_ttyFd !== null) fs.writeSync(_ttyFd, s)
  else process.stdout.write(s)
}

export function ttyLog(s: string): void {
  ttyWrite(s + '\n')
}

export function detectProtocol(): Protocol {
  const term = process.env.TERM ?? ''
  const termProgram = process.env.TERM_PROGRAM ?? ''
  const override = process.env.GOODBOY_PROTOCOL as Protocol | undefined

  if (override) return override

  // Warp supports iTerm2 inline images natively (JPEG accepted)
  if (termProgram === 'iTerm.app' || termProgram === 'WarpTerminal') return 'iterm2'
  if (term === 'xterm-kitty') return 'kitty'
  return 'ascii'
}

function spritePath(persona: PersonaId, mood: Mood): string {
  // User sprites are .jpg; fall back to .png if needed
  const jpg = path.join(SPRITES_DIR, persona, `${mood}.jpg`)
  if (fs.existsSync(jpg)) return jpg
  return path.join(SPRITES_DIR, persona, `${mood}.png`)
}

function hasSprite(persona: PersonaId, mood: Mood): boolean {
  return fs.existsSync(spritePath(persona, mood))
}

function renderKitty(persona: PersonaId, mood: Mood): void {
  let p = spritePath(persona, mood)
  // Kitty protocol requires PNG; convert .jpg via sips (macOS) if needed
  if (p.endsWith('.jpg') || p.endsWith('.jpeg')) {
    const tmp = `/tmp/goodboy_${persona}_${mood}.png`
    try {
      execSync(`sips -s format png "${p}" --out "${tmp}"`, { stdio: 'ignore' })
      p = tmp
    } catch {
      renderAscii(persona, mood)
      return
    }
  }
  const data = fs.readFileSync(p)
  const b64 = data.toString('base64')
  ttyWrite(`\x1b_Ga=T,f=100,q=2,c=10,r=5;${b64}\x1b\\`)
  ttyWrite('\n')
}

function renderIterm2(persona: PersonaId, mood: Mood): void {
  const p = spritePath(persona, mood)
  const data = fs.readFileSync(p)
  const b64 = data.toString('base64')
  const size = data.length
  const IMG_HEIGHT = 5
  // iTerm2 protocol infers format from file magic bytes — JPEG works natively.
  // Warp keeps cursor at the image start row after the escape — use CSI n B
  // (cursor-down) instead of newlines to advance past the image without
  // triggering terminal scroll, then \r to land at column 0.
  ttyWrite(`\x1b]1337;File=inline=1;size=${size};width=10;height=${IMG_HEIGHT}:${b64}\x07`)
  ttyWrite(`\x1b[${IMG_HEIGHT}B\r`)
}

function renderAscii(persona: PersonaId, mood: Mood): void {
  const config = getPersona(persona)
  const lines = config.ascii[mood] ?? config.ascii.happy
  const color = chalk.hex(config.colors.primary)
  lines.forEach(line => ttyLog(color(line)))
}

export function renderDog(persona: PersonaId, mood: Mood, protocol: Protocol): void {
  if ((protocol === 'kitty' || protocol === 'iterm2') && hasSprite(persona, mood)) {
    try {
      if (protocol === 'kitty') renderKitty(persona, mood)
      else renderIterm2(persona, mood)
      return
    } catch {
      // fall through to ASCII
    }
  }
  renderAscii(persona, mood)
}

export function renderQuip(persona: PersonaId, quip: string): void {
  const config = getPersona(persona)
  const color = chalk.hex(config.colors.accent)
  const name = chalk.bold.hex(config.colors.primary)(config.name)
  ttyLog(`${name}  ${color(`"${quip}"`)}`)
}

export function renderStatBar(label: string, value: number, color: chalk.Chalk): void {
  const filled = Math.round(value / 10)
  const empty = 10 - filled
  const bar = '█'.repeat(filled) + '░'.repeat(empty)
  const pct = String(value).padStart(3)
  ttyLog(`  ${label.padEnd(10)} ${color(bar)}  ${pct}%`)
}

export function renderDivider(color: chalk.Chalk): void {
  ttyLog(color('  ' + '─'.repeat(44)))
}

export function renderCompact(
  persona: PersonaId,
  mood: Mood,
  quip: string,
): void {
  const config = getPersona(persona)
  const c = chalk.hex(config.colors.primary)
  const protocol = detectProtocol()
  ttyLog('')
  ttyLog('')
  renderDivider(c)
  renderDog(persona, mood, protocol)
  renderQuip(persona, quip)
  renderDivider(c)
  ttyLog('')
}

export function renderBlock(
  persona: PersonaId,
  mood: Mood,
  quip: string,
  _storedProtocol?: Protocol
): void {
  const config = getPersona(persona)
  const c = chalk.hex(config.colors.primary)
  // Always detect fresh — stored protocol can be stale from a different terminal
  const protocol = detectProtocol()
  // Extra leading newlines push the sprite below Claude Code's permission-prompt
  // UI chrome, which occupies the first few lines of the visible terminal area.
  ttyLog('')
  ttyLog('')
  ttyLog('')
  ttyLog('')
  ttyLog('')
  renderDivider(c)
  renderDog(persona, mood, protocol)
  renderQuip(persona, quip)
  renderDivider(c)
  ttyLog('')
}

