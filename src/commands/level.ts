import chalk from 'chalk'
import { readState } from '../state.js'
import { renderBlock, renderDivider } from '../renderer.js'
import { getPersona } from '../personas/index.js'
import { getExperienceLevel } from '../milestones.js'

const LEVELS = [
  { min: 0, max: 9, level: 1, title: 'Fresh Pup' },
  { min: 10, max: 24, level: 2, title: 'Eager Learner' },
  { min: 25, max: 49, level: 3, title: 'Junior Developer Dog' },
  { min: 50, max: 99, level: 4, title: 'Mid-Level Mutt' },
  { min: 100, max: 249, level: 5, title: 'Senior Dev Dog' },
  { min: 250, max: 499, level: 6, title: 'Staff Engineer Dog' },
  { min: 500, max: 999, level: 7, title: 'Principal Pupper' },
  { min: 1000, max: Infinity, level: 8, title: 'Distinguished Fellow (Dog)' },
]

export async function runLevel(): Promise<void> {
  const state = readState()
  const config = getPersona(state.persona)
  const c = chalk.hex(config.colors.primary)
  const dim = chalk.dim
  const { level, title } = getExperienceLevel(state.session_count)

  const current = LEVELS.find(l => l.level === level)!
  const next = LEVELS.find(l => l.level === level + 1)

  const quips: Record<string, string> = {
    goldie: `level ${level}!! ${title}!! we have grown so much together!!`,
    shiba: `level ${level}. ${title}. accurate.`,
    byte: `experience level: ${level}. classification: ${title}. sessions logged: ${state.session_count}.`,
    pugsy: `level ${level}. ${title}.`,
    nova: `LEVEL ${level}! ${title.toUpperCase()}! THE GRIND IS REAL.`,
    debug: `level: ${level}. title: ${title}. sessions: ${state.session_count}. progression: tracked.`,
  }

  renderBlock(state.persona, 'proud', quips[state.persona] ?? quips.goldie, state.terminal_protocol)

  renderDivider(c)
  console.log()
  console.log(c(`  level ${level} — ${title}`))
  console.log()
  console.log(dim(`  sessions: `) + c(String(state.session_count)))

  if (next) {
    const sessionsToNext = next.min - state.session_count
    console.log(dim(`  next level: `) + c(`${next.title} in ${sessionsToNext} session${sessionsToNext !== 1 ? 's' : ''}`))
  } else {
    console.log(dim('  status: ') + c('maximum rank achieved'))
  }

  console.log()
  console.log(dim('  all levels:'))
  for (const l of LEVELS) {
    const marker = l.level === level ? c('→') : dim(' ')
    const label = l.level === level ? c(`${l.level}. ${l.title}`) : dim(`${l.level}. ${l.title}`)
    const range = l.max === Infinity ? `${l.min}+` : `${l.min}–${l.max}`
    console.log(`  ${marker} ${label}${dim(` (${range} sessions)`)}`)
  }

  console.log()
  renderDivider(c)
  console.log()
}
