import chalk from 'chalk'
import { readState, readDiary } from '../state.js'
import { renderDivider } from '../renderer.js'
import { getPersona } from '../personas/index.js'

export async function runDiary(): Promise<void> {
  const state = readState()
  const config = getPersona(state.persona)
  const c = chalk.hex(config.colors.primary)
  const dim = chalk.dim

  const entries = readDiary()

  renderDivider(c)
  console.log()
  console.log(c('  this session'))
  console.log()

  if (entries.length === 0) {
    console.log(dim('  nothing notable happened yet this session'))
    console.log()
    renderDivider(c)
    console.log()
    return
  }

  for (const entry of entries) {
    const time = new Date(entry.ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    console.log(dim(`  ${time}`) + '  ' + c(entry.signal))
    if (entry.quip) console.log(dim(`         "${entry.quip}"`))
    console.log()
  }

  renderDivider(c)
  console.log()
}
