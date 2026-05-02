import { readState, writeState, clampStat, deriveMood } from '../state.js'
import { renderBlock } from '../renderer.js'

export async function runFeed(): Promise<void> {
  const state = readState()
  const before = state.hunger
  state.hunger = clampStat(state.hunger + 30)
  writeState(state)

  const mood = state.hunger > 70 ? 'excited' : 'happy'
  const alreadyFull = before >= 90

  const quips: Record<string, Record<string, string>> = {
    goldie: {
      normal: 'TREAT!! i love treats!! i love you!! this is the best moment!!',
      full: 'i was already full but i will NEVER say no to a treat!! thank you!!',
    },
    shiba: {
      normal: 'acceptable. hunger stat: improved.',
      full: 'i did not need that. i ate it anyway.',
    },
    byte: {
      normal: `hunger stat: ${before}% → ${state.hunger}%. optimal range restored.`,
      full: 'hunger was already adequate. treat logged regardless.',
    },
    pugsy: {
      normal: 'food. yes.',
      full: 'did not need. ate anyway.',
    },
    nova: {
      normal: 'FUEL RECEIVED. ENERGY: INCREASING. THANK YOU.',
      full: 'ALREADY FUELED. EXTRA FUEL. MAXIMUM CAPACITY. LOVE IT.',
    },
    debug: {
      normal: `hunger event logged. stat delta: +${state.hunger - before}. current: ${state.hunger}%.`,
      full: 'hunger was nominal. treat received and logged. no complaints.',
    },
  }

  const personaQuips = quips[state.persona] ?? quips.goldie
  const quip = alreadyFull ? personaQuips.full : personaQuips.normal

  renderBlock(state.persona, mood, quip, state.terminal_protocol)
}
