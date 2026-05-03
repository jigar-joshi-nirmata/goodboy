#!/usr/bin/env node
import { runFeed } from './commands/feed.js'
import { runBath } from './commands/bath.js'
import { runNap } from './commands/nap.js'
import { runWalk } from './commands/walk.js'
import { runBrew } from './commands/brew.js'
import { runTreat } from './commands/treat.js'
import { runRollover } from './commands/rollover.js'
import { runTrick } from './commands/trick.js'
import { runSpeak } from './commands/speak.js'
import { runFetch } from './commands/fetch.js'
import { runBeg } from './commands/beg.js'
import { runSit } from './commands/sit.js'
import { runSwitch } from './commands/switch.js'
import { runStatus } from './commands/status.js'
import { runMood } from './commands/mood.js'
import { runAge } from './commands/age.js'
import { runLevel } from './commands/level.js'
import { runHistory } from './commands/history.js'
import { runDiary } from './commands/diary.js'
import { runReport } from './commands/report.js'
import { runIgnore } from './commands/ignore.js'
import { runSniff } from './commands/sniff.js'
import { runVet } from './commands/vet.js'
import { runInit } from './commands/init.js'
import { runAI } from './commands/ai.js'
import { runSessionStart } from './hooks/session-start.js'
import { runSessionEnd } from './hooks/session-end.js'
import { runToolUseFromStdin } from './hooks/tool-use.js'

const [, , cmd, ...args] = process.argv

async function main(): Promise<void> {
  switch (cmd) {
    // Care commands
    case 'feed':     return runFeed()
    case 'bath':     return runBath()
    case 'nap':      return runNap()
    case 'walk':     return runWalk()
    case 'brew':     return runBrew()
    case 'treat':    return runTreat()

    // Fun commands
    case 'rollover': return runRollover()
    case 'trick':    return runTrick()
    case 'speak':    return runSpeak()
    case 'fetch':    return runFetch()
    case 'beg':      return runBeg()

    // Deploy gate
    case 'sit':      return runSit(args)

    // Utility commands
    case 'switch':   return runSwitch(args)
    case 'status':   return runStatus()
    case 'mood':     return runMood()
    case 'age':      return runAge()
    case 'level':    return runLevel()
    case 'history':  return runHistory()
    case 'diary':    return runDiary()
    case 'report':   return runReport(args)
    case 'ignore':   return runIgnore(args)
    case 'sniff':    return runSniff()
    case 'vet':      return runVet()
    case 'init':     return runInit(args)
    case 'ai':       return runAI()

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
    '    feed          restore hunger (+30)',
    '    treat         small bonus treat (+15)',
    '    bath          restore hygiene (+40)',
    '    nap           restore energy (+35)',
    '    walk          go for a walk (+15 energy, -10 hunger)',
    '    brew          coffee solidarity (+20 energy)',
    '',
    '  fun',
    '    rollover      classic trick',
    '    trick         random trick (energy required)',
    '    speak         random wisdom',
    '    fetch         git fetch with narration',
    '    beg           dog makes a pointed request',
    '',
    '  deploy gate',
    '    sit                  check deploy safety',
    '    sit --enable         enable deploy guard',
    '    sit --disable        disable deploy guard',
    '',
    '  status & info',
    '    status               full stat report',
    '    mood                 current mood + causes + fixes',
    '    age                  dog age + lifetime stats',
    '    level                experience level + progression',
    '    history              last 10 sessions',
    '    diary                this session\'s events',
    '    report               7-day summary',
    '    report --month       30-day summary',
    '',
    '  codebase health',
    '    sniff                run lint + type checks',
    '    vet                  full codebase health report',
    '',
    '  configuration',
    '    switch               list personas',
    '    switch <name>        change persona',
    '    ignore               list ignored signals',
    '    ignore <signal>      suppress a signal',
    '    ignore <signal> --remove  restore a signal',
    '    init                 install claude hooks',
    '    init <persona>       init with specific persona',
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
