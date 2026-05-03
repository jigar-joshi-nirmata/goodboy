import chalk from 'chalk'
import { readState, writeState } from '../state.js'
import { renderBlock } from '../renderer.js'
import { getPersona } from '../personas/index.js'
import { Signal } from '../personas/types.js'

const VALID_SIGNALS: Signal[] = [
  'clean_exit', 'test_pass', 'rm_rf_detected', 'legacy_file', 'todo_found',
  'late_night', 'error_streak_3', 'deploy_done', 'new_file', 'long_session',
  'css_file', 'auth_file',
]

export async function runIgnore(args: string[]): Promise<void> {
  const state = readState()
  const config = getPersona(state.persona)
  const c = chalk.hex(config.colors.primary)
  const dim = chalk.dim

  const signal = args[0]?.toLowerCase() as Signal | undefined

  if (!signal) {
    console.log()
    console.log(c('  ignored signals:'))
    console.log()
    if (state.ignored_signals.length === 0) {
      console.log(dim('  none — all signals active'))
    } else {
      for (const s of state.ignored_signals) {
        console.log(dim('  • ') + c(s))
      }
    }
    console.log()
    console.log(dim('  valid signals: ') + VALID_SIGNALS.join(', '))
    console.log(dim('  usage: goodboy ignore <signal>'))
    console.log(dim('         goodboy ignore <signal> --remove'))
    console.log()
    return
  }

  if (!VALID_SIGNALS.includes(signal)) {
    console.log()
    console.log(chalk.red(`  unknown signal: "${signal}"`))
    console.log(dim(`  valid: ${VALID_SIGNALS.join(', ')}`))
    console.log()
    process.exit(1)
  }

  const remove = args.includes('--remove')

  if (remove) {
    state.ignored_signals = (state.ignored_signals as Signal[]).filter(s => s !== signal)
    writeState(state)

    const quips: Record<string, string> = {
      goldie: `okay!! i will react to ${signal} again!! watching carefully!!`,
      shiba: `${signal}: restored. i will notice again.`,
      byte: `signal ${signal}: re-enabled. monitoring: active.`,
      pugsy: `${signal} back on.`,
      nova: `SIGNAL ${signal.toUpperCase()}: RESTORED. WATCHING.`,
      debug: `signal ${signal}: removed from ignore list. detection: resumed.`,
    }
    renderBlock(state.persona, 'happy', quips[state.persona] ?? quips.goldie, state.terminal_protocol)
    return
  }

  if ((state.ignored_signals as Signal[]).includes(signal)) {
    const quips: Record<string, string> = {
      goldie: `already ignoring ${signal}!! already done!! no problem!!`,
      shiba: `${signal} was already ignored.`,
      byte: `signal ${signal}: already suppressed. no change.`,
      pugsy: `already ignored.`,
      nova: `ALREADY IGNORING ${signal.toUpperCase()}.`,
      debug: `${signal} already in ignore list. no-op.`,
    }
    renderBlock(state.persona, 'happy', quips[state.persona] ?? quips.goldie, state.terminal_protocol)
    return
  }

  state.ignored_signals = [...(state.ignored_signals as Signal[]), signal]
  writeState(state)

  const quips: Record<string, string> = {
    goldie: `okay!! i will stop reacting to ${signal}!! if that is what you want!! i trust you!!`,
    shiba: `${signal}: suppressed. noted.`,
    byte: `signal ${signal}: added to ignore list. will not react.`,
    pugsy: `${signal} off.`,
    nova: `SIGNAL ${signal.toUpperCase()}: SUPPRESSED.`,
    debug: `signal ${signal}: added to ignore list. reaction: disabled.`,
  }
  renderBlock(state.persona, 'judgy', quips[state.persona] ?? quips.judgy, state.terminal_protocol)
}
