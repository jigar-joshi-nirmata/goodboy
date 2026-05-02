import chalk from 'chalk'
import {
  readState, writeState, readSession, writeSession,
  applyDecay, updateStreak, deriveMood,
} from '../state.js'
import { renderBlock } from '../renderer.js'
import { pickQuip, detectSignal } from '../quips.js'
import { checkMilestones, markMilestonesSeen } from '../milestones.js'
import { Signal } from '../personas/types.js'

export async function runSessionStart(): Promise<void> {
  let state = readState()

  state = applyDecay(state)
  state = updateStreak(state)
  state.session_count += 1

  const milestones = checkMilestones(state)
  state = markMilestonesSeen(state, milestones)
  state.last_seen = new Date().toISOString()
  writeState(state)

  const session = {
    consecutive_errors: 0,
    signals_fired: [] as Signal[],
    files_touched: [] as string[],
    errors: 0,
    session_start: Date.now(),
  }
  writeSession(session)

  const protocol = state.terminal_protocol

  // Show milestone first if one fired
  if (milestones.length > 0) {
    const m = milestones[0]
    renderBlock(state.persona, 'excited', m.quip, protocol)
    if (milestones.length > 1) {
      for (const extra of milestones.slice(1)) {
        console.log(chalk.dim(`  also: "${extra.quip}"`))
      }
    }
    return
  }

  // Time-of-day greeting
  const hour = new Date().getHours()
  let signal: Signal | null = null
  if (hour >= 22 || hour < 5) signal = 'late_night'

  const mood = deriveMood(state)

  let quip: string
  if (signal) {
    quip = pickQuip(state.persona, signal)
  } else {
    // Greeting quip based on mood
    const greetings: Record<string, Record<string, string>> = {
      goldie: {
        happy: 'hi!! hi hi hi!! ready to write some code!!',
        excited: 'GOOD MORNING!! let\'s ship something amazing today!!',
        proud: 'back again!! on a streak!! i love this for us!!',
        sad: 'hi... i missed you... please feed me soon...',
        sleepy: 'zzz... oh! you\'re here... give me a second...',
        judgy: 'hi. you know what would help? feeding me. just saying.',
        alarmed: 'oh!! you\'re finally here!! i was getting worried!!',
        disgusted: 'hi. yes. i see the state of this codebase. hello.',
      },
      shiba: {
        happy: 'you\'re here.',
        excited: 'good. let\'s get this over with.',
        proud: 'another day. fine.',
        sad: 'you came back. eventually.',
        sleepy: '...give me a moment.',
        judgy: 'feed me before we start. we both know it.',
        alarmed: 'finally.',
        disgusted: 'i have concerns about today already.',
      },
      byte: {
        happy: 'session initiated. ready.',
        excited: 'new session. objectives: achieve. let\'s begin.',
        proud: 'streak holding. performance trajectory: positive.',
        sad: 'session started. hunger stat: critical. noted.',
        sleepy: 'session started. energy levels: suboptimal. proceeding anyway.',
        judgy: 'hygiene stat: degraded. recommend: bath before shipping.',
        alarmed: 'session started. multiple stats in warning range.',
        disgusted: 'session started. recommend stat restoration before code review.',
      },
      pugsy: {
        happy: 'hey.',
        excited: 'k. ready.',
        proud: 'here.',
        sad: 'hi.',
        sleepy: 'ugh. okay.',
        judgy: 'feed me.',
        alarmed: 'hi.',
        disgusted: 'this codebase better be good today.',
      },
      nova: {
        happy: 'SESSION START. FULL SPEED. LET\'S GO.',
        excited: 'NEW DAY. MAXIMUM ENERGY. BUILDING THINGS.',
        proud: 'BACK AGAIN. STREAK INTACT. THE PACE CONTINUES.',
        sad: 'SESSION STARTED. HUNGER STAT LOW. STILL GOING.',
        sleepy: 'SESSION STARTED. ENERGY LOW. PUSHING THROUGH ANYWAY.',
        judgy: 'SESSION START. HYGIENE LOW. BATH FIRST. THEN SPEED.',
        alarmed: 'SESSION START. STATS LOW. ADDRESSING BEFORE PROCEEDING.',
        disgusted: 'SESSION START. CODEBASE STATUS: CONCERNING. FIXING IT.',
      },
      debug: {
        happy: 'session started. sniff initiated. all systems go.',
        excited: 'new session. observation mode: active. ready.',
        proud: 'session started. streak: holding. logging.',
        sad: 'session started. hunger stat: low. filing a complaint.',
        sleepy: 'session started. energy: minimal. watching anyway.',
        judgy: 'session started. hygiene stat low. recommending bath.',
        alarmed: 'session started. multiple stats flagged. logging.',
        disgusted: 'session started. state of the codebase: concerning. beginning investigation.',
      },
    }

    const personaGreetings = greetings[state.persona] ?? {}
    quip = personaGreetings[mood] ?? pickQuip(state.persona, 'clean_exit')
  }

  renderBlock(state.persona, mood, quip, protocol)
}
