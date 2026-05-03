import { readState, writeState, clampStat } from '../state.js'
import { renderBlock } from '../renderer.js'

export async function runTreat(): Promise<void> {
  const state = readState()
  state.hunger = clampStat(state.hunger + 15)
  writeState(state)

  const quips: Record<string, string> = {
    goldie: 'EXTRA TREAT!! you did not have to!! but i am so glad you did!! the best!!',
    shiba: 'bonus treat. unexpected. appreciated. do not make it a pattern.',
    byte: 'supplemental treat: received. hunger delta: +15. morale: marginally improved.',
    pugsy: 'oh. treat.',
    nova: 'BONUS TREAT. EXTRA FUEL. SURPRISE REWARD. LOVE IT.',
    debug: 'treat event: supplemental. hunger delta: +15. reason: unconditional. logged.',
  }

  renderBlock(state.persona, 'excited', quips[state.persona] ?? quips.goldie, state.terminal_protocol)
}
