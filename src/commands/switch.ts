import { readState, writeState } from '../state.js'
import { renderBlock } from '../renderer.js'
import { PERSONAS, getPersona } from '../personas/index.js'
import { PersonaId } from '../personas/types.js'
import chalk from 'chalk'

const PERSONA_IDS = Object.keys(PERSONAS) as PersonaId[]

export async function runSwitch(args: string[]): Promise<void> {
  const state = readState()
  const requested = args[0]?.toLowerCase() as PersonaId | undefined

  if (!requested) {
    const config = getPersona(state.persona)
    const c = chalk.hex(config.colors.primary)
    console.log()
    console.log(c(`  current persona: ${state.persona}`))
    console.log()
    console.log('  available personas:')
    for (const id of PERSONA_IDS) {
      const p = getPersona(id)
      const marker = id === state.persona ? '→' : ' '
      console.log(chalk.dim(`  ${marker} ${id.padEnd(8)}`) + chalk.hex(p.colors.primary)(` ${p.name}`))
    }
    console.log()
    console.log(chalk.dim('  usage: goodboy switch <persona>'))
    console.log()
    return
  }

  if (!PERSONA_IDS.includes(requested)) {
    console.log()
    console.log(chalk.red(`  unknown persona: "${requested}"`))
    console.log(chalk.dim(`  valid options: ${PERSONA_IDS.join(', ')}`))
    console.log()
    process.exit(1)
  }

  if (requested === state.persona) {
    const quips: Record<string, string> = {
      goldie: `i AM goldie!! you cannot switch to me if i am already me!! this is fine!!`,
      shiba: 'already this persona. change rejected.',
      byte: `persona is already ${state.persona}. no-op executed.`,
      pugsy: 'already me.',
      nova: 'ALREADY THIS PERSONA. CANNOT DOUBLE-EQUIP.',
      debug: `switch attempted. source === target (${state.persona}). operation: skipped.`,
    }
    renderBlock(state.persona, 'happy', quips[state.persona] ?? quips.goldie, state.terminal_protocol)
    return
  }

  const oldPersona = state.persona
  state.persona = requested
  writeState(state)

  const newConfig = getPersona(requested)
  const farewells: Record<string, string> = {
    goldie: 'bye!! i love you!! come back soon!! 🐾',
    shiba: 'fine. leaving.',
    byte: 'persona: goldie offline.',
    pugsy: 'bye.',
    nova: 'SIGNING OFF. OVER AND OUT.',
    debug: 'persona: unloaded.',
  }

  const hellos: Record<PersonaId, string> = {
    goldie: 'HI HI HI!! i\'m goldie!! we are going to be BEST FRIENDS!!',
    shiba: 'shiba inu. online. let\'s keep this professional.',
    byte: 'byte initialized. border collie. analytical mode: active. ready.',
    pugsy: 'hey.',
    nova: 'NOVA ONLINE. SYSTEMS NOMINAL. MAXIMUM HYPE READY.',
    debug: 'debug loaded. dachshund unit online. observation mode: active.',
  }

  const c = chalk.hex(newConfig.colors.primary)
  console.log()
  console.log(chalk.dim(`  ${farewells[oldPersona] ?? farewells.goldie}`))
  console.log()

  renderBlock(requested, 'excited', hellos[requested] ?? hellos.goldie, state.terminal_protocol)
}
