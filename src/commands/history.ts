import chalk from 'chalk'
import { readState, readLog } from '../state.js'
import { renderDivider } from '../renderer.js'
import { getPersona } from '../personas/index.js'

export async function runHistory(): Promise<void> {
  const state = readState()
  const config = getPersona(state.persona)
  const c = chalk.hex(config.colors.primary)
  const dim = chalk.dim

  const log = readLog()
  const sessions = log.filter(e => e.type === 'session').slice(-10).reverse()

  renderDivider(c)
  console.log()
  console.log(c('  recent sessions'))
  console.log()

  if (sessions.length === 0) {
    console.log(dim('  no sessions logged yet'))
    console.log()
    renderDivider(c)
    console.log()
    return
  }

  for (const entry of sessions) {
    const date = new Date(entry.ts)
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const dur = entry.duration_ms
      ? entry.duration_ms < 60000
        ? `${Math.floor(entry.duration_ms / 1000)}s`
        : entry.duration_ms < 3600000
          ? `${Math.floor(entry.duration_ms / 60000)}m`
          : `${Math.floor(entry.duration_ms / 3600000)}h ${Math.floor((entry.duration_ms % 3600000) / 60000)}m`
      : '?'

    const parts = [
      c(`${dateStr} ${timeStr}`),
      dim(`${dur}`),
      dim(`${entry.errors ?? 0} errors`),
      dim(`${entry.files ?? 0} files`),
    ]

    console.log('  ' + parts.join(dim('  |  ')))
    if (entry.quip) console.log(dim(`    "${entry.quip}"`))
    console.log()
  }

  renderDivider(c)
  console.log()
}
