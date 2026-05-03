import chalk from 'chalk'
import { readState, deriveMood } from '../state.js'
import { renderBlock, renderDivider } from '../renderer.js'
import { getPersona } from '../personas/index.js'

export async function runMood(): Promise<void> {
  const state = readState()
  const mood = deriveMood(state)
  const config = getPersona(state.persona)
  const c = chalk.hex(config.colors.primary)
  const dim = chalk.dim

  const causes: string[] = []
  const fixes: string[] = []

  if (state.hunger < 10) { causes.push('hunger critical (< 10%)'); fixes.push('goodboy feed — immediately') }
  else if (state.hunger < 25) { causes.push(`hunger low (${state.hunger}%)`); fixes.push('goodboy feed') }

  if (state.hygiene < 20) { causes.push(`hygiene critical (${state.hygiene}%)`); fixes.push('goodboy bath') }
  else if (state.hygiene < 40) { causes.push(`hygiene low (${state.hygiene}%)`); fixes.push('goodboy bath') }

  if (state.energy < 20) { causes.push(`energy critical (${state.energy}%)`); fixes.push('goodboy nap or goodboy brew') }

  if (causes.length === 0) {
    if (state.streak >= 7 && state.hunger > 70 && state.energy > 70) {
      causes.push(`streak at ${state.streak} days with high stats`)
    } else {
      causes.push('all stats healthy')
    }
  }

  const moodQuips: Record<string, Record<string, string>> = {
    goldie: {
      happy: 'feeling great!! everything is good!! i love today!!',
      excited: 'SO EXCITED RIGHT NOW!! maximum positive energy!!',
      proud: 'proud and happy!! look at this streak!! look at these stats!!',
      sad: 'feeling a little sad... please help...',
      sleepy: 'very sleepy... everything is so heavy...',
      judgy: 'i have concerns. about the hygiene situation. specifically.',
      alarmed: 'something is very wrong!! i am worried!!',
      disgusted: 'the state of things right now is... a lot.',
    },
    shiba: {
      happy: 'adequate. things are fine.',
      excited: 'things are... above average. do not read into it.',
      proud: 'earned this mood. statistically justified.',
      sad: 'stats are concerning. not thriving.',
      sleepy: 'running low. can still function.',
      judgy: 'have issues. with the hygiene specifically.',
      alarmed: 'something is wrong. addressing it.',
      disgusted: 'the current state is unacceptable.',
    },
    byte: {
      happy: 'all metrics nominal. system operating within expected parameters.',
      excited: 'performance indicators elevated. positive trend confirmed.',
      proud: 'streak data and stat levels support this mood rating.',
      sad: 'one or more stats below threshold. mood: degraded.',
      sleepy: 'energy metric below nominal. efficiency: reduced.',
      judgy: 'hygiene stat below acceptable range. flagging.',
      alarmed: 'critical stat threshold breached. alert state active.',
      disgusted: 'system state: below standards. recommend immediate remediation.',
    },
    pugsy: {
      happy: 'fine.',
      excited: 'good.',
      proud: 'earned.',
      sad: 'not great.',
      sleepy: 'tired.',
      judgy: 'concerned.',
      alarmed: 'bad.',
      disgusted: 'no.',
    },
    nova: {
      happy: 'SYSTEMS NOMINAL. FULL SPEED AHEAD.',
      excited: 'ELEVATED PERFORMANCE. ALL METRICS GREEN.',
      proud: 'STREAK HOLDING. STATS HIGH. THE PACE CONTINUES.',
      sad: 'STATS DROPPING. ADDRESSING BEFORE CONTINUING.',
      sleepy: 'ENERGY LOW. TEMPORARILY REDUCED VELOCITY.',
      judgy: 'HYGIENE STAT FLAGGED. BATH REQUIRED. THEN FULL SPEED.',
      alarmed: 'CRITICAL THRESHOLD BREACHED. ALL STOP. FIXING NOW.',
      disgusted: 'CURRENT STATE: UNACCEPTABLE. IMMEDIATE ACTION REQUIRED.',
    },
    debug: {
      happy: 'all stats within normal range. mood: nominal.',
      excited: 'stats above baseline. positive event logged.',
      proud: `streak: ${state.streak} days. stats: healthy. confidence: justified.`,
      sad: 'stat analysis: one or more below threshold. mood: degraded.',
      sleepy: 'energy log: low. efficiency impact: logged.',
      judgy: 'hygiene below nominal. mood impact: documented.',
      alarmed: 'alert condition met. stat threshold breached. logging.',
      disgusted: 'current system state: critically degraded. full remediation required.',
    },
  }

  renderBlock(state.persona, mood, moodQuips[state.persona]?.[mood] ?? `current mood: ${mood}`, state.terminal_protocol)

  renderDivider(c)
  console.log()
  console.log(c(`  current mood: ${mood}`))
  console.log()

  if (causes.length > 0) {
    console.log(dim('  caused by:'))
    for (const cause of causes) console.log(dim('    • ') + cause)
    console.log()
  }

  if (fixes.length > 0) {
    console.log(dim('  to improve:'))
    for (const fix of fixes) console.log(dim('    → ') + c(fix))
    console.log()
  }

  renderDivider(c)
  console.log()
}
