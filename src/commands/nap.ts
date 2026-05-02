import { readState, writeState, clampStat } from '../state.js'
import { renderBlock } from '../renderer.js'

export async function runNap(): Promise<void> {
  const state = readState()
  const before = state.energy
  state.energy = clampStat(state.energy + 35)
  writeState(state)

  const alreadyRested = before >= 90
  const mood = 'sleepy'

  const quips: Record<string, Record<string, string>> = {
    goldie: {
      normal: 'nap time!! curling up!! zzzz!! dreams about treats!! zzzzz!!',
      rested: 'i was already rested!! but napping again is ALWAYS okay!!',
    },
    shiba: {
      normal: 'nap. fine.',
      rested: 'did not need this. napped anyway.',
    },
    byte: {
      normal: `energy stat: ${before}% → ${state.energy}%. entering low-power mode. standby.`,
      rested: 'energy was sufficient. nap executed regardless. efficiency: unchanged.',
    },
    pugsy: {
      normal: 'zzz.',
      rested: 'not tired. zzz anyway.',
    },
    nova: {
      normal: 'INITIATING POWER RESTORE SEQUENCE. NAP MODE: ACTIVE. RECHARGING.',
      rested: 'ALREADY CHARGED. BONUS NAP. ULTRA CHARGE. MAXIMUM.',
    },
    debug: {
      normal: `energy event: nap. delta: +${state.energy - before}. current: ${state.energy}%. standby mode: active.`,
      rested: 'energy was already optimal. nap logged. no energy deficit detected.',
    },
  }

  const personaQuips = quips[state.persona] ?? quips.goldie
  const quip = alreadyRested ? personaQuips.rested : personaQuips.normal

  renderBlock(state.persona, mood, quip, state.terminal_protocol)
}
