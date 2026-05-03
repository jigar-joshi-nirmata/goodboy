import fs from 'fs'
import path from 'path'
import os from 'os'
import chalk from 'chalk'
import { readState, writeState } from '../state.js'
import { renderBlock, detectProtocol } from '../renderer.js'
import { getPersona, PERSONAS } from '../personas/index.js'
import { PersonaId } from '../personas/types.js'

const PERSONA_IDS = Object.keys(PERSONAS) as PersonaId[]

const CLAUDE_CONFIG_PATH = path.join(os.homedir(), '.claude', 'settings.json')

const HOOK_TEMPLATE = {
  hooks: {
    PostToolUse: [
      {
        matcher: '',
        hooks: [{ type: 'command', command: 'goodboy hook tool-use' }],
      },
    ],
    SessionStart: [{ type: 'command', command: 'goodboy hook session-start' }],
    Stop: [{ type: 'command', command: 'goodboy hook session-end' }],
  },
}

function patchClaudeSettings(): { patched: boolean; error?: string } {
  try {
    const dir = path.dirname(CLAUDE_CONFIG_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    let existing: Record<string, unknown> = {}
    if (fs.existsSync(CLAUDE_CONFIG_PATH)) {
      existing = JSON.parse(fs.readFileSync(CLAUDE_CONFIG_PATH, 'utf8'))
    }

    const hooks = (existing.hooks as Record<string, unknown> | undefined) ?? {}
    const merged = { ...existing, hooks: { ...hooks, ...HOOK_TEMPLATE.hooks } }
    fs.writeFileSync(CLAUDE_CONFIG_PATH, JSON.stringify(merged, null, 2))
    return { patched: true }
  } catch (e: unknown) {
    return { patched: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function runInit(args: string[]): Promise<void> {
  const requestedPersona = (args[0]?.toLowerCase() as PersonaId | undefined) ?? 'goldie'
  const persona = PERSONA_IDS.includes(requestedPersona) ? requestedPersona : 'goldie'

  const state = readState()
  const isFirstRun = state.session_count === 0
  state.persona = persona
  state.terminal_protocol = detectProtocol()
  writeState(state)

  const config = getPersona(persona)
  const c = chalk.hex(config.colors.primary)
  const dim = chalk.dim

  console.log()
  console.log(c(`  ✦ goodboy — developer companion`))
  console.log()

  if (isFirstRun) {
    console.log(dim('  first run! setting up your companion...\n'))
  }

  const { patched, error } = patchClaudeSettings()

  if (patched) {
    console.log(c('  ✓') + dim(' claude hooks: installed'))
    console.log(c('  ✓') + dim(` persona: ${persona}`))
    console.log(c('  ✓') + dim(` state: ~/.goodboy`))
  } else {
    console.log(chalk.yellow('  ⚠ could not auto-install hooks: ' + error))
    console.log()
    console.log(dim('  add these manually to ~/.claude/settings.json:'))
    console.log(dim(JSON.stringify(HOOK_TEMPLATE, null, 4)))
  }

  console.log()

  const quips: Record<PersonaId, string> = {
    goldie: 'i am ready!! let\'s write so much code!! i believe in everything you do!!',
    shiba: 'initialized. expectations: managed. let\'s work.',
    byte: 'init complete. all systems nominal. ready for development session.',
    pugsy: 'ready.',
    nova: 'INITIALIZED. FULL SEND. LET\'S BUILD SOMETHING GREAT.',
    debug: 'init complete. all hooks armed. observation mode: standing by.',
  }

  renderBlock(persona, 'excited', quips[persona] ?? quips.goldie, state.terminal_protocol)

  console.log(dim('  run `goodboy status` to see your dog\'s stats'))
  console.log(dim('  run `goodboy switch <persona>` to change companions'))
  console.log(dim('  run `goodboy help` for all commands'))
  console.log()

  // AI quips hint
  const hasKey = !!process.env.ANTHROPIC_API_KEY
  if (hasKey) {
    console.log(c('  ✓') + dim(' ANTHROPIC_API_KEY detected — AI quips enabled at session end'))
  } else {
    console.log(dim('  tip: add ANTHROPIC_API_KEY to your shell profile for AI-generated quips'))
    console.log(dim('       echo \'export ANTHROPIC_API_KEY=sk-ant-...\' >> ~/.zshrc'))
    console.log(dim('       (costs ~$0.00005/session via Claude Haiku — optional)'))
  }
  console.log()
}
