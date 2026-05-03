import chalk from 'chalk'
import { readState, readLog } from '../state.js'
import { renderBlock, renderDivider } from '../renderer.js'
import { getPersona } from '../personas/index.js'

export async function runReport(args: string[]): Promise<void> {
  const state = readState()
  const config = getPersona(state.persona)
  const c = chalk.hex(config.colors.primary)
  const dim = chalk.dim

  const isMonth = args.includes('--month')
  const periodMs = isMonth ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
  const periodLabel = isMonth ? 'last 30 days' : 'last 7 days'

  const log = readLog()
  const cutoff = Date.now() - periodMs
  const sessions = log.filter(e => e.type === 'session' && e.ts >= cutoff)

  const quips: Record<string, string> = {
    goldie: `here is the report for ${periodLabel}!! so many things happened!!`,
    shiba: `the numbers. for ${periodLabel}. as requested.`,
    byte: `generating ${periodLabel} summary. pulling from session log.`,
    pugsy: 'report.',
    nova: `${periodLabel.toUpperCase()} STATS. INCOMING.`,
    debug: `report: ${periodLabel}. aggregating session log. computing metrics.`,
  }

  renderBlock(state.persona, 'proud', quips[state.persona] ?? quips.goldie, state.terminal_protocol)

  renderDivider(c)
  console.log()
  console.log(c(`  ${periodLabel}`))
  console.log()

  if (sessions.length === 0) {
    console.log(dim('  no sessions recorded in this period'))
    console.log()
    renderDivider(c)
    console.log()
    return
  }

  const totalErrors = sessions.reduce((sum, s) => sum + (s.errors ?? 0), 0)
  const totalFiles = sessions.reduce((sum, s) => sum + (s.files ?? 0), 0)
  const totalDurationMs = sessions.reduce((sum, s) => sum + (s.duration_ms ?? 0), 0)
  const totalHours = Math.floor(totalDurationMs / 3600000)
  const totalMins = Math.floor((totalDurationMs % 3600000) / 60000)

  const deployCount = sessions.filter(s => s.signal === 'deploy_done').length
  const maxStreak = sessions.reduce((max, s) => Math.max(max, s.streak ?? 0), 0)

  // Best day
  const byDay: Record<string, number> = {}
  for (const s of sessions) {
    const day = new Date(s.ts).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    byDay[day] = (byDay[day] ?? 0) + 1
  }
  const bestDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]

  const rows = [
    ['sessions', String(sessions.length)],
    ['total time', totalHours > 0 ? `${totalHours}h ${totalMins}m` : `${totalMins}m`],
    ['errors', String(totalErrors)],
    ['files touched', String(totalFiles)],
    ['deploys', String(deployCount)],
    ['best day', bestDay ? `${bestDay[0]} (${bestDay[1]} session${bestDay[1] !== 1 ? 's' : ''})` : '—'],
    ['peak streak', `${maxStreak} day${maxStreak !== 1 ? 's' : ''}`],
    ['current streak', `${state.streak} day${state.streak !== 1 ? 's' : ''}`],
  ]

  for (const [label, value] of rows) {
    console.log(dim(`  ${label.padEnd(16)}`) + c(value))
  }

  console.log()
  renderDivider(c)
  console.log()
}
