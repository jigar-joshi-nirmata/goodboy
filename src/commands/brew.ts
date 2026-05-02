import { readState, writeState, clampStat } from '../state.js'
import { renderBlock } from '../renderer.js'

export async function runBrew(): Promise<void> {
  const state = readState()

  // Coffee boosts energy but drains hygiene a little (coffee breath)
  state.energy = clampStat(state.energy + 20)
  state.hygiene = Math.max(0, state.hygiene - 5)
  writeState(state)

  const mood = 'excited'

  const quips: Record<string, string> = {
    goldie: 'coffee time!! watching you make it!! the smell!! so good!! you are so talented!!',
    shiba: 'coffee. yes. energy stat: improving. hygiene: slightly worse. acceptable trade.',
    byte: 'caffeine intake logged. energy: +20. hygiene penalty: -5. net output: positive.',
    pugsy: 'coffee. energy.',
    nova: 'COFFEE DETECTED. ENERGY SPIKING. HYGIENE MINOR HIT. ACCEPTABLE. LET\'S GO.',
    debug: 'brew event logged. caffeine: detected. energy delta: +20. hygiene delta: -5. trade-off: approved.',
  }

  const quip = quips[state.persona] ?? quips.goldie

  renderBlock(state.persona, mood, quip, state.terminal_protocol)
}
