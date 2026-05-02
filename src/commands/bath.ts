import { readState, writeState, clampStat, deriveMood } from '../state.js'
import { renderBlock } from '../renderer.js'

export async function runBath(): Promise<void> {
  const state = readState()
  const before = state.hygiene
  state.hygiene = clampStat(state.hygiene + 40)
  writeState(state)

  const alreadyClean = before >= 90
  const mood = state.hygiene > 70 ? 'happy' : 'proud'

  const quips: Record<string, Record<string, string>> = {
    goldie: {
      normal: 'BATH TIME!! splashing!! so fresh!! i smell like lavender!! best day!!',
      clean: 'i was already clean but bath is bath!! more splashing!!',
    },
    shiba: {
      normal: 'fine. bath acknowledged. hygiene: restored.',
      clean: 'unnecessary. but fine. hygiene: already adequate.',
    },
    byte: {
      normal: `hygiene stat: ${before}% → ${state.hygiene}%. odor coefficients: nominal.`,
      clean: 'hygiene was already nominal. bath logged. no delta.',
    },
    pugsy: {
      normal: 'wet. clean now.',
      clean: 'already clean. still wet now.',
    },
    nova: {
      normal: 'BATH ACTIVATED. HYGIENE: RESTORED. SMELL: EXCELLENT. READY.',
      clean: 'ALREADY CLEAN. BATH ANYWAY. MAXIMUM FRESHNESS ACHIEVED.',
    },
    debug: {
      normal: `hygiene event: bath. delta: +${state.hygiene - before}. current: ${state.hygiene}%. odor: resolved.`,
      clean: 'hygiene was nominal. bath received anyway. no complaints filed.',
    },
  }

  const personaQuips = quips[state.persona] ?? quips.goldie
  const quip = alreadyClean ? personaQuips.clean : personaQuips.normal

  renderBlock(state.persona, mood, quip, state.terminal_protocol)
}
