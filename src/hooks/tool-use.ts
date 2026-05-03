import {
  readState, writeState, readSession, writeSession, deriveMood, appendDiary,
} from '../state.js'
import { detectSignal, pickQuip } from '../quips.js'
import { Signal, Mood, PersonaId } from '../personas/types.js'
import { renderCompact } from '../renderer.js'
import { generateKeyExposedQuip } from '../ai.js'

interface ToolUseContext {
  tool_name?: string
  tool_input?: { command?: string; file_path?: string }
  tool_response?: { output?: string; exit_code?: number; error?: string }
}

const KEY_RE = /\b(sk-ant-[A-Za-z0-9_-]{20,}|sk-proj-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{40,}|AKIA[A-Z0-9]{16}|ghp_[A-Za-z0-9]{36,}|npm_[A-Za-z0-9]{36,}|xoxb-[0-9]{8,}-[0-9]{8,})/

function detectKeyExposure(command: string, output?: string): boolean {
  const haystack = command + ' ' + (output ?? '').slice(0, 3000)
  return KEY_RE.test(haystack)
}

const RENDER_SIGNALS: Partial<Record<Signal, Mood>> = {
  test_pass:    'excited',
  git_commit:   'proud',
  deploy_done:  'excited',
  error_streak_3: 'alarmed',
  rm_rf_detected: 'alarmed',
}

const GIT_COMMIT_QUIPS: Record<PersonaId, string> = {
  goldie: 'commit!! it is in the history forever!! we made a permanent thing!!',
  shiba:  'committed. it exists now. good.',
  byte:   'commit logged. hash recorded. the history is updated.',
  pugsy:  'it is saved.',
  nova:   'COMMITTED. THE RECORD IS SET. THE HISTORY IS WRITTEN. ONWARD.',
  debug:  'commit complete. adding to the session commit log. hash noted.',
}

const KEY_EXPOSED_FALLBACK: Record<PersonaId, string> = {
  goldie: 'oh NO!! is that an API KEY in the terminal?! rotate it RIGHT NOW!!',
  shiba:  '...a key. in plain text. rotate it. now.',
  byte:   'credential exposure detected. severity: high. rotation required immediately.',
  pugsy:  'rotate that. now.',
  nova:   'KEY EXPOSED. ROTATE IMMEDIATELY. NO DELAY. THIS IS URGENT.',
  debug:  'key exposed in output. logging incident. recommend immediate rotation.',
}

export async function runToolUse(ctx: ToolUseContext): Promise<void> {
  const state = readState()
  const session = readSession()

  const command = ctx.tool_input?.command ?? ''
  const filename = ctx.tool_input?.file_path ?? ''
  const exitCode = ctx.tool_response?.exit_code ?? 0
  const hour = new Date().getHours()
  const sessionDurationMs = Date.now() - session.session_start

  // Key exposure check — highest priority
  if (detectKeyExposure(command, ctx.tool_response?.output) && !session.signals_fired.includes('key_exposed')) {
    session.signals_fired.push('key_exposed')
    const quip = (await generateKeyExposedQuip(state)) ?? KEY_EXPOSED_FALLBACK[state.persona]
    renderCompact(state.persona, 'disgusted', quip)
    appendDiary({ ts: Date.now(), signal: 'key_exposed', quip })
    writeSession(session)
    return
  }

  // Track errors
  const isError = exitCode !== 0 || !!ctx.tool_response?.error
  if (isError) {
    session.errors += 1
    session.consecutive_errors += 1
  } else {
    session.consecutive_errors = 0
  }

  if (filename) session.files_touched.push(filename)

  // Force push / dangerous git
  if (command.includes('push') && (command.includes('--force') || command.includes(' -f '))) {
    if (!session.signals_fired.includes('rm_rf_detected')) {
      session.signals_fired.push('rm_rf_detected')
      const quip = pickQuip(state.persona, 'rm_rf_detected')
      renderCompact(state.persona, 'alarmed', quip)
      appendDiary({ ts: Date.now(), signal: 'rm_rf_detected', quip })
    }
    writeSession(session)
    return
  }

  // Error streak
  if (session.consecutive_errors >= 3 && !session.signals_fired.includes('error_streak_3')) {
    session.signals_fired.push('error_streak_3')
    state.hygiene = Math.max(0, state.hygiene - 5)
    state.error_count_lifetime += 1
    writeState(state)
    const quip = pickQuip(state.persona, 'error_streak_3')
    renderCompact(state.persona, 'alarmed', quip)
    appendDiary({ ts: Date.now(), signal: 'error_streak_3', quip })
    writeSession(session)
    return
  }

  const signal = detectSignal(command, exitCode, filename, hour, sessionDurationMs)

  if (!signal) {
    writeSession(session)
    return
  }

  if (session.signals_fired.includes(signal) && signal !== 'error_streak_3') {
    writeSession(session)
    return
  }

  session.signals_fired.push(signal)

  if (signal === 'rm_rf_detected') {
    state.hygiene = Math.max(0, state.hygiene - 15)
    writeState(state)
  }

  if (signal === 'deploy_done') {
    state.deploy_count += 1
    writeState(state)
  }

  const quip = signal === 'git_commit'
    ? GIT_COMMIT_QUIPS[state.persona]
    : pickQuip(state.persona, signal as Signal)

  appendDiary({ ts: Date.now(), signal, quip })

  const renderMood = RENDER_SIGNALS[signal as Signal]
  if (renderMood) {
    renderCompact(state.persona, renderMood, quip)
  }

  writeSession(session)
}

export async function runToolUseFromStdin(): Promise<void> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8').trim()
  if (!raw) return

  try {
    const ctx = JSON.parse(raw) as ToolUseContext
    await runToolUse(ctx)
  } catch {
    // silently ignore malformed hook context
  }
}
