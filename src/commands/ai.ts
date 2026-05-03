import chalk from 'chalk'
import { readState, deriveMood, readSession } from '../state.js'
import { renderBlock, renderDivider } from '../renderer.js'
import { getPersona } from '../personas/index.js'
import { generateAIQuip } from '../ai.js'
import { pickQuip } from '../quips.js'

export async function runAI(): Promise<void> {
  const state = readState()
  const session = readSession()
  const mood = deriveMood(state)
  const config = getPersona(state.persona)
  const c = chalk.hex(config.colors.primary)
  const dim = chalk.dim

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log()
    console.log(c('  goodboy ai — contextual quips powered by Claude Haiku'))
    console.log()
    console.log(dim('  set ANTHROPIC_API_KEY to enable:'))
    console.log(dim('    export ANTHROPIC_API_KEY=sk-ant-...'))
    console.log()
    console.log(dim('  cost: ~$0.00005 per call (claude-haiku-4-5)'))
    console.log(dim('  auto-fires at session end when key is set'))
    console.log()
    return
  }

  const thinkingQuips: Record<string, string> = {
    goldie: 'thinking of something good to say!! one moment!!',
    shiba: 'consulting the archives.',
    byte: 'generating contextual quip. one moment.',
    pugsy: 'thinking.',
    nova: 'PROCESSING. COMPOSING. ALMOST.',
    debug: 'calling haiku. waiting for response. logging latency.',
  }

  renderBlock(state.persona, mood, thinkingQuips[state.persona] ?? thinkingQuips.goldie, state.terminal_protocol)

  const durationMs = Date.now() - session.session_start
  const aiQuip = await generateAIQuip(state, session, durationMs)

  if (!aiQuip) {
    renderDivider(c)
    console.log(dim('  ai quip failed — api error or timeout'))
    console.log(dim('  falling back to static quips'))
    renderDivider(c)
    console.log()
    return
  }

  renderDivider(c)
  console.log()
  console.log(dim('  ✦ ai quip (claude haiku 4.5):'))
  console.log()
  renderBlock(state.persona, mood, aiQuip, state.terminal_protocol)
}
