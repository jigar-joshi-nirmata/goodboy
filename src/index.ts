#!/usr/bin/env node
import { runFeed } from './commands/feed.js'
import { runBath } from './commands/bath.js'
import { runNap } from './commands/nap.js'
import { runWalk } from './commands/walk.js'
import { runBrew } from './commands/brew.js'
import { runRollover } from './commands/rollover.js'
import { runSit } from './commands/sit.js'
import { runSwitch } from './commands/switch.js'
import { runStatus } from './commands/status.js'
import { runInit } from './commands/init.js'
import { runSessionStart } from './hooks/session-start.js'
import { runSessionEnd } from './hooks/session-end.js'
import { runToolUseFromStdin } from './hooks/tool-use.js'

const [, , cmd, ...args] = process.argv

async function main(): Promise<void> {
  switch (cmd) {
    // Pet care commands
    case 'feed':     return runFeed()
    case 'bath':     return runBath()
    case 'nap':      return runNap()
    case 'walk':     return runWalk()
    case 'brew':     return runBrew()

    // Fun commands
    case 'rollover': return runRollover()
    case 'sit':      return runSit(args)

    // Utility commands
    case 'switch':   return runSwitch(args)
    case 'status':   return runStatus()
    case 'init':     return runInit(args)

    // Hook routing (called by Claude Code hooks)
    case 'hook': {
      const hookType = args[0]
      switch (hookType) {
        case 'session-start': return runSessionStart()
        case 'session-end':   return runSessionEnd()
        case 'tool-use':      return runToolUseFromStdin()
        default:
          console.error(`goodboy: unknown hook type "${hookType}"`)
          process.exit(1)
      }
    }

    case 'help':
    case '--help':
    case '-h':
      printHelp()
      return

    case undefined:
      printHelp()
      return

    default:
      console.error(`goodboy: unknown command "${cmd}"`)
      console.error('run `goodboy help` for usage')
      process.exit(1)
  }
}

function printHelp(): void {
  const lines = [
    '',
    '  goodboy — your developer companion',
    '',
    '  care',
    '    feed          give your dog a treat (+30 hunger)',
    '    bath          clean your dog (+40 hygiene)',
    '    nap           let your dog rest (+35 energy)',
    '    walk          go for a walk (+15 energy, -10 hunger)',
    '    brew          coffee time (+20 energy, -5 hygiene)',
    '',
    '  fun',
    '    rollover      make your dog do a trick',
    '    sit           check deploy safety gate',
    '    sit --enable  enable deploy guard',
    '    sit --disable disable deploy guard',
    '',
    '  utility',
    '    status        show full stat report',
    '    switch        list available personas',
    '    switch <name> switch to a different persona',
    '    init          install hooks into claude settings',
    '    init <name>   init with a specific persona',
    '',
    '  personas: goldie  shiba  byte  pugsy  nova  debug',
    '',
  ]
  console.log(lines.join('\n'))
}

main().catch(err => {
  console.error('goodboy error:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
