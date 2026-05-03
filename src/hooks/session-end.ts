import chalk from 'chalk'
import {
  readState, writeState, readSession, clearSession, deriveMood,
  appendLog, clearDiary,
} from '../state.js'
import { renderBlock, renderDivider } from '../renderer.js'
import { pickQuip } from '../quips.js'
import { Signal } from '../personas/types.js'
import { getPersona } from '../personas/index.js'
import { generateAIQuip } from '../ai.js'

export async function runSessionEnd(): Promise<void> {
  const state = readState()
  const session = readSession()

  const durationMs = Date.now() - session.session_start
  const durationMin = Math.floor(durationMs / 60000)
  const durationStr =
    durationMin < 60
      ? `${durationMin}m`
      : `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`

  // Determine strongest signal from session
  const signalPriority: Signal[] = [
    'rm_rf_detected',
    'error_streak_3',
    'deploy_done',
    'test_pass',
    'long_session',
    'late_night',
    'auth_file',
    'legacy_file',
    'css_file',
    'new_file',
    'clean_exit',
  ]

  const firedSignals = new Set(session.signals_fired)
  const topSignal =
    signalPriority.find(s => firedSignals.has(s)) ??
    (session.errors === 0 ? 'clean_exit' : 'error_streak_3')

  const hasDeploy = firedSignals.has('deploy_done')
  const hasErrorStreak = session.consecutive_errors >= 3 || session.errors > 5
  const mood = deriveMood(state, hasErrorStreak, hasDeploy)

  // Try AI quip first (costs ~$0.00005, opt-in via ANTHROPIC_API_KEY)
  const aiQuip = await generateAIQuip(state, session, durationMs)
  const quip = aiQuip ?? pickQuip(state.persona, topSignal as Signal)

  clearSession()
  clearDiary()

  appendLog({
    ts: Date.now(),
    type: 'session',
    signal: topSignal,
    quip,
    duration_ms: durationMs,
    errors: session.errors,
    files: [...new Set(session.files_touched)].length,
    streak: state.streak,
    deploys: state.deploy_count,
  })

  const protocol = state.terminal_protocol
  renderBlock(state.persona, mood, quip, protocol)

  // Session summary line
  const config = getPersona(state.persona)
  const c = chalk.hex(config.colors.primary)
  const dim = chalk.dim

  renderDivider(c)
  const parts = [
    `session: ${durationStr}`,
    `errors: ${session.errors}`,
    `files: ${[...new Set(session.files_touched)].length}`,
    `streak: ${state.streak} day${state.streak !== 1 ? 's' : ''}`,
  ]
  console.log(dim('  ' + parts.join('  |  ')))
  renderDivider(c)
  console.log()
}
