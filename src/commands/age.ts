import chalk from 'chalk'
import { readState, deriveMood } from '../state.js'
import { renderBlock, renderDivider } from '../renderer.js'
import { getPersona } from '../personas/index.js'
import { getDogAge, getExperienceLevel } from '../milestones.js'

export async function runAge(): Promise<void> {
  const state = readState()
  const mood = deriveMood(state)
  const config = getPersona(state.persona)
  const c = chalk.hex(config.colors.primary)
  const dim = chalk.dim
  const age = getDogAge(state.born_at)
  const { level, title } = getExperienceLevel(state.session_count)

  const quips: Record<string, string> = {
    goldie: `${age}!! and every moment has been the best moment!!`,
    shiba: `${age}. not that i am counting.`,
    byte: `age: ${age}. lifecycle data: available on request.`,
    pugsy: `${age}.`,
    nova: `${age}. MOVING FAST. STAYING YOUNG.`,
    debug: `age: ${age}. born: ${state.born_at.split('T')[0]}. uptime: continuous.`,
  }

  renderBlock(state.persona, mood, quips[state.persona] ?? quips.goldie, state.terminal_protocol)

  renderDivider(c)
  console.log()

  const errorRate = state.session_count > 0
    ? (state.error_count_lifetime / state.session_count).toFixed(1)
    : '0.0'

  const rows = [
    ['born', state.born_at.split('T')[0]],
    ['age', age],
    ['level', `${level} — ${title}`],
    ['sessions', String(state.session_count)],
    ['lifetime errors', `${state.error_count_lifetime} (avg ${errorRate}/session)`],
    ['deploys witnessed', String(state.deploy_count)],
    ['tokens processed', state.token_count >= 1_000_000
      ? `${(state.token_count / 1_000_000).toFixed(2)}M`
      : state.token_count >= 1000
        ? `${(state.token_count / 1000).toFixed(1)}k`
        : String(state.token_count)],
    ['streak', `${state.streak} day${state.streak !== 1 ? 's' : ''}`],
  ]

  for (const [label, value] of rows) {
    console.log(dim(`  ${label.padEnd(20)}`) + c(value))
  }

  console.log()
  renderDivider(c)
  console.log()
}
