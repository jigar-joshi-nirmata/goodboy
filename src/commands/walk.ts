import { readState, writeState, clampStat } from '../state.js'
import { renderBlock } from '../renderer.js'

export async function runWalk(): Promise<void> {
  const state = readState()

  // Walk boosts energy and hunger slightly (exercise makes you hungry)
  state.energy = clampStat(state.energy + 15)
  state.hunger = Math.max(0, state.hunger - 10)
  writeState(state)

  const mood = 'excited'

  const quips: Record<string, string> = {
    goldie: 'WALK!! WALK WALK WALK!! sniffing everything!! that blade of grass!! this rock!! perfect!!',
    shiba: 'walk acknowledged. pace: acceptable. sniffed: 12 things. rating: 7/10.',
    byte: 'ambulation sequence: complete. energy: +15. hunger: -10. optimal loop executed.',
    pugsy: 'walked. tired now. worth it.',
    nova: 'WALK COMPLETE. SCENERY PROCESSED. ENERGY REFRESHED. READY FOR MORE.',
    debug: 'walk event logged. energy: +15, hunger: -10. sniff events: multiple. returning to base.',
  }

  const quip = quips[state.persona] ?? quips.goldie

  renderBlock(state.persona, mood, quip, state.terminal_protocol)
}
