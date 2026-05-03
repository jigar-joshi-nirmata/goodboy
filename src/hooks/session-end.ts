import chalk from 'chalk'
import {
  readState, readSession, deriveMood,
  appendLog,
} from '../state.js'
import { pickQuip } from '../quips.js'
import { Signal } from '../personas/types.js'
import { generateAIQuip } from '../ai.js'
import { ttyLog } from '../renderer.js'
import { getPersona } from '../personas/index.js'

export async function runSessionEnd(): Promise<void> {
  const state = readState()
  const session = readSession()

  const durationMs = Date.now() - session.session_start
  const durationMin = Math.floor(durationMs / 60000)
  const durationStr =
    durationMin < 60
      ? `${durationMin}m`
      : `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`

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

  const aiQuip = await generateAIQuip(state, session, durationMs)
  const quip = aiQuip ?? pickQuip(state.persona, topSignal as Signal)

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

  // Compact single-line stat bar — no sprite to avoid cursor corruption at Stop
  const config = getPersona(state.persona)
  const c = chalk.hex(config.colors.primary)
  const filesCount = new Set(session.files_touched).size
  const errorPart = session.errors > 0
    ? chalk.yellow(`${session.errors} error${session.errors !== 1 ? 's' : ''}`)
    : chalk.green('clean')
  ttyLog('')
  ttyLog(
    c(`  ${config.name}`) +
    chalk.dim('  ·  ') +
    chalk.white(durationStr) +
    chalk.dim('  ·  ') +
    chalk.dim(`${filesCount} file${filesCount !== 1 ? 's' : ''}`) +
    chalk.dim('  ·  ') +
    errorPart
  )
  ttyLog('')
}
