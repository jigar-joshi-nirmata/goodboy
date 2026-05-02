import chalk from 'chalk'
import { readState, deriveMood } from '../state.js'
import { renderBlock, renderStatBar, renderDivider } from '../renderer.js'
import { getPersona } from '../personas/index.js'
import { getDogAge, getExperienceLevel } from '../milestones.js'

export async function runStatus(): Promise<void> {
  const state = readState()
  const mood = deriveMood(state)
  const config = getPersona(state.persona)
  const c = chalk.hex(config.colors.primary)
  const dim = chalk.dim
  const { level, title } = getExperienceLevel(state.session_count)
  const age = getDogAge(state.born_at)

  const quips: Record<string, string> = {
    goldie: 'here is my report!! i am so glad you asked!! i have MANY stats!!',
    shiba: 'stats. as requested. do not read too much into them.',
    byte: 'stat report: initiated. compiling current telemetry.',
    pugsy: 'stats.',
    nova: 'STATUS REPORT INCOMING. HOLD TIGHT.',
    debug: 'status query received. generating report. all fields: populated.',
  }

  renderBlock(state.persona, mood, quips[state.persona] ?? quips.goldie, state.terminal_protocol)

  renderDivider(c)

  console.log()
  renderStatBar('hunger ', state.hunger, c)
  renderStatBar('hygiene', state.hygiene, chalk.hex(config.colors.accent))
  renderStatBar('energy ', state.energy, c)
  console.log()

  renderDivider(c)

  const parts = [
    dim('  age      ') + c(age),
    dim('  level    ') + c(`${level} — ${title}`),
    dim('  streak   ') + c(`${state.streak} day${state.streak !== 1 ? 's' : ''}`),
    dim('  sessions ') + c(String(state.session_count)),
    dim('  deploys  ') + c(String(state.deploy_count)),
    dim('  errors   ') + c(String(state.error_count_lifetime)),
    dim('  tokens   ') + c(state.token_count >= 1_000_000
      ? `${(state.token_count / 1_000_000).toFixed(1)}M`
      : state.token_count >= 1000
        ? `${(state.token_count / 1000).toFixed(1)}k`
        : String(state.token_count)),
    dim('  persona  ') + c(state.persona),
    dim('  guard    ') + (state.guard_enabled ? c('enabled') : chalk.dim('disabled')),
    dim('  protocol ') + c(state.terminal_protocol),
  ]

  for (const part of parts) console.log(part)
  console.log()
  renderDivider(c)
  console.log()
}
