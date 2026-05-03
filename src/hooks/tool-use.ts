import {
  readState, writeState, readSession, writeSession, deriveMood, appendDiary,
} from '../state.js'
import { renderBlock } from '../renderer.js'
import { detectSignal, pickQuip, MILESTONE_QUIPS } from '../quips.js'
import { Signal } from '../personas/types.js'

interface ToolUseContext {
  tool_name?: string
  tool_input?: { command?: string; file_path?: string }
  tool_response?: { output?: string; exit_code?: number; error?: string }
}

export async function runToolUse(ctx: ToolUseContext): Promise<void> {
  const state = readState()
  const session = readSession()

  const command = ctx.tool_input?.command ?? ''
  const filename = ctx.tool_input?.file_path ?? ''
  const exitCode = ctx.tool_response?.exit_code ?? 0
  const hour = new Date().getHours()
  const sessionDurationMs = Date.now() - session.session_start

  // Track errors
  const isError = exitCode !== 0 || !!ctx.tool_response?.error
  if (isError) {
    session.errors += 1
    session.consecutive_errors += 1
  } else {
    session.consecutive_errors = 0
  }

  if (filename) session.files_touched.push(filename)

  // Detect git push --force
  if (command.includes('push') && (command.includes('--force') || command.includes(' -f '))) {
    const quip = MILESTONE_QUIPS[state.persona].git_push_force
    writeSession(session)
    renderBlock(state.persona, 'alarmed', quip, state.terminal_protocol)
    return
  }

  // Detect sudo
  if (command.startsWith('sudo ')) {
    const quip = MILESTONE_QUIPS[state.persona].sudo_detected
    writeSession(session)
    renderBlock(state.persona, 'alarmed', quip, state.terminal_protocol)
    return
  }

  // Error streak
  if (session.consecutive_errors >= 3 && !session.signals_fired.includes('error_streak_3')) {
    session.signals_fired.push('error_streak_3')
    writeSession(session)

    state.hygiene = Math.max(0, state.hygiene - 5)
    state.error_count_lifetime += 1
    writeState(state)

    const quip = pickQuip(state.persona, 'error_streak_3', session.signals_fired.map(() => ''))
    renderBlock(state.persona, 'alarmed', quip, state.terminal_protocol)
    return
  }

  // Detect signal from this tool call
  const signal = detectSignal(command, exitCode, filename, hour, sessionDurationMs)

  if (!signal) {
    writeSession(session)
    return
  }

  // Don't repeat the same signal twice in a session (except errors)
  if (session.signals_fired.includes(signal) && signal !== 'error_streak_3') {
    writeSession(session)
    return
  }

  session.signals_fired.push(signal)

  // Update hygiene for bad events
  if (signal === 'rm_rf_detected') {
    state.hygiene = Math.max(0, state.hygiene - 15)
    writeState(state)
  }

  // Deploy milestone
  if (signal === 'deploy_done') {
    state.deploy_count += 1
    const isFriday = new Date().getDay() === 5
    writeState(state)

    if (isFriday) {
      const quip = MILESTONE_QUIPS[state.persona].friday_deploy
      writeSession(session)
      renderBlock(state.persona, 'alarmed', quip, state.terminal_protocol)
      return
    }
  }

  writeSession(session)

  const hasErrorStreak = session.consecutive_errors >= 3
  const mood = deriveMood(state, hasErrorStreak, signal === 'deploy_done')
  const quip = pickQuip(state.persona, signal as Signal)
  appendDiary({ ts: Date.now(), signal, quip })
  renderBlock(state.persona, mood, quip, state.terminal_protocol)
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
