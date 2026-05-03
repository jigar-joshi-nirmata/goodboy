import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { createInterface } from 'readline'
import { readState, writeState, appendLog } from '../state.js'
import { renderBlock, renderDivider } from '../renderer.js'
import { getPersona } from '../personas/index.js'
import chalk from 'chalk'

interface CheckConfig {
  name: string
  command: string
  required?: boolean
  expect_exit?: number
}

interface GuardConfig {
  blocked_days?: number[]
  blocked_hours?: number[]
  custom_message?: string
  checks?: CheckConfig[]
}

const GUARD_CONFIG_PATH = path.join(process.cwd(), '.goodboy.config.json')
const HOME_GUARD_PATH = path.join(process.env.HOME ?? '~', '.goodboy.guard.json')

function readGuardConfig(): GuardConfig {
  for (const p of [GUARD_CONFIG_PATH, HOME_GUARD_PATH]) {
    if (fs.existsSync(p)) {
      try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch {}
    }
  }
  return {}
}

interface CheckResult {
  name: string
  passed: boolean
  required: boolean
  output: string
  durationMs: number
}

function runCheck(check: CheckConfig): CheckResult {
  const start = Date.now()
  const expectedExit = check.expect_exit ?? 0
  try {
    const output = execSync(check.command, { encoding: 'utf8', timeout: 30000, stdio: 'pipe' }).trim()
    const passed = expectedExit === 0
    return { name: check.name, passed, required: check.required !== false, output, durationMs: Date.now() - start }
  } catch (e: unknown) {
    const err = e as { status?: number; stdout?: string; stderr?: string }
    const actualExit = err.status ?? 1
    const passed = actualExit === expectedExit
    const output = ((err.stdout ?? '') + (err.stderr ?? '')).trim().split('\n').slice(-2).join(' ')
    return { name: check.name, passed, required: check.required !== false, output, durationMs: Date.now() - start }
  }
}

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(question, answer => { rl.close(); resolve(answer) })
  })
}

export async function runSit(args: string[]): Promise<void> {
  const state = readState()
  const config = getPersona(state.persona)
  const c = chalk.hex(config.colors.primary)
  const dim = chalk.dim

  if (args.includes('--enable')) {
    state.guard_enabled = true
    writeState(state)
    const quips: Record<string, string> = {
      goldie: 'deploy guard ON!! i will protect you from friday disasters!! very serious now!!',
      shiba: 'guard enabled. watching.',
      byte: 'deploy guard: enabled. pre-deploy checks: active.',
      pugsy: 'guard on.',
      nova: 'GUARD MODE: ENABLED. NO ACCIDENTS ON MY WATCH.',
      debug: 'guard_enabled: true. deploy gate: armed.',
    }
    renderBlock(state.persona, 'proud', quips[state.persona] ?? quips.goldie, state.terminal_protocol)
    return
  }

  if (args.includes('--disable')) {
    state.guard_enabled = false
    writeState(state)
    const quips: Record<string, string> = {
      goldie: 'deploy guard off... okay... i trust you... be careful...',
      shiba: 'guard disabled. your consequences.',
      byte: 'deploy guard: disabled. responsibility: operator.',
      pugsy: 'ok.',
      nova: 'GUARD OFF. YOUR CALL.',
      debug: 'guard_enabled: false. logging this decision.',
    }
    renderBlock(state.persona, 'judgy', quips[state.persona] ?? quips.goldie, state.terminal_protocol)
    return
  }

  if (!state.guard_enabled) {
    const quips: Record<string, string> = {
      goldie: 'deploy guard is OFF!! enable with `goodboy sit --enable`!!',
      shiba: 'guard is off. not my problem.',
      byte: 'deploy guard: disabled. enable with --enable to activate.',
      pugsy: 'guard off.',
      nova: 'GUARD INACTIVE. ENABLE IT.',
      debug: 'guard_enabled: false. no check performed.',
    }
    renderBlock(state.persona, 'sleepy', quips[state.persona] ?? quips.goldie, state.terminal_protocol)
    return
  }

  const guardConfig = readGuardConfig()
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const blockWarnings: string[] = []
  if (guardConfig.blocked_days?.includes(day)) blockWarnings.push(`today is ${dayNames[day]} — blocked deploy day`)
  if (guardConfig.blocked_hours?.some(h => hour === h)) blockWarnings.push(`hour ${hour}:xx is in blocked deploy window`)
  if (guardConfig.custom_message) blockWarnings.push(guardConfig.custom_message)

  const isFriday = day === 5

  // Run custom checks from config
  const checks = guardConfig.checks ?? []
  const checkResults: CheckResult[] = []

  if (checks.length > 0) {
    console.log()
    console.log(dim('  running checks...'))
    console.log()
    for (const check of checks) {
      const result = runCheck(check)
      checkResults.push(result)
      const icon = result.passed ? c('✓') : (result.required ? chalk.red('✗') : chalk.yellow('⚠'))
      const dur = dim(`(${result.durationMs}ms)`)
      console.log(`  ${icon}  ${result.name.padEnd(36)} ${dur}`)
      if (!result.passed && result.output) {
        console.log(dim('       ' + result.output.split('\n')[0].trim()))
      }
    }
    console.log()
  }

  const failedRequired = checkResults.filter(r => !r.passed && r.required)
  const failedOptional = checkResults.filter(r => !r.passed && !r.required)

  if (blockWarnings.length > 0) {
    renderDivider(c)
    for (const w of blockWarnings) console.log(`  ${chalk.yellow('⚠')}  ${w}`)
    renderDivider(c)
    console.log()
    const quips: Record<string, string> = {
      goldie: `WAIT WAIT WAIT!! ${blockWarnings[0]}!! i am protecting you!!`,
      shiba: `blocked. ${blockWarnings[0]}.`,
      byte: `deploy gate: BLOCKED. reason: ${blockWarnings[0]}.`,
      pugsy: `no. ${blockWarnings[0]}.`,
      nova: `STOP. GUARD TRIGGERED. DO NOT DEPLOY.`,
      debug: `deploy check: BLOCKED. ${blockWarnings[0]}.`,
    }
    renderBlock(state.persona, 'alarmed', quips[state.persona] ?? quips.goldie, state.terminal_protocol)
    process.exit(1)
  }

  if (failedRequired.length > 0) {
    const quips: Record<string, string> = {
      goldie: `${failedRequired.length} required check${failedRequired.length !== 1 ? 's' : ''} failed!! cannot deploy!! fix first!!`,
      shiba: `${failedRequired.length} required check${failedRequired.length !== 1 ? 's' : ''} failed. not deploying.`,
      byte: `${failedRequired.length} required check${failedRequired.length !== 1 ? 's' : ''} failed. deploy: blocked.`,
      pugsy: `${failedRequired.length} check${failedRequired.length !== 1 ? 's' : ''} failed. no.`,
      nova: `${failedRequired.length} REQUIRED CHECK${failedRequired.length !== 1 ? 'S' : ''} FAILED. CANNOT SHIP THIS.`,
      debug: `${failedRequired.length} required check${failedRequired.length !== 1 ? 's' : ''} failed. deploy: rejected.`,
    }
    renderBlock(state.persona, 'alarmed', quips[state.persona] ?? quips.goldie, state.terminal_protocol)
    process.exit(1)
  }

  if (failedOptional.length > 0) {
    const quips: Record<string, string> = {
      goldie: `${failedOptional.length} non-required check${failedOptional.length !== 1 ? 's' : ''} failed... deploy anyway?`,
      shiba: `${failedOptional.length} non-required issue${failedOptional.length !== 1 ? 's' : ''}. your call.`,
      byte: `${failedOptional.length} optional check${failedOptional.length !== 1 ? 's' : ''} failed. proceed at your own risk.`,
      pugsy: `${failedOptional.length} optional. up to you.`,
      nova: `${failedOptional.length} OPTIONAL CHECK${failedOptional.length !== 1 ? 'S' : ''} FAILED. STILL YOUR CALL.`,
      debug: `${failedOptional.length} non-critical issue${failedOptional.length !== 1 ? 's' : ''} logged. awaiting decision.`,
    }
    renderBlock(state.persona, 'judgy', quips[state.persona] ?? quips.goldie, state.terminal_protocol)

    const answer = await prompt(dim('  deploy anyway? [y/N]: '))
    if (!answer.toLowerCase().startsWith('y')) {
      console.log()
      appendLog({ ts: Date.now(), type: 'event', signal: 'deploy_done', quip: 'deploy aborted by user' })
      process.exit(0)
    }
    appendLog({ ts: Date.now(), type: 'event', signal: 'deploy_done', quip: 'deploy override: non-required checks failed' })
  }

  if (isFriday && failedOptional.length === 0 && failedRequired.length === 0) {
    const quips: Record<string, string> = {
      goldie: 'all checks pass!! but it is FRIDAY!! are you sure?? i believe in you but ARE YOU SURE??',
      shiba: "friday. all clear. historically unwise. your choice.",
      byte: "friday deploy. checks: passing. elevated risk remains. proceed carefully.",
      pugsy: "friday. checked. brave.",
      nova: "FRIDAY DEPLOY. CHECKS GREEN. FULL SEND. GOOD LUCK.",
      debug: "friday deploy confirmed. checks: passing. logging with elevated scrutiny.",
    }
    renderBlock(state.persona, 'alarmed', quips[state.persona] ?? quips.goldie, state.terminal_protocol)

    const answer = await prompt(dim('  friday override confirmed? [y/N]: '))
    if (!answer.toLowerCase().startsWith('y')) {
      console.log()
      process.exit(0)
    }
    return
  }

  const quips: Record<string, string> = {
    goldie: 'all clear!! everything looks great!! go go go!! i believe in you!!',
    shiba: 'checked. nothing flagged. proceed.',
    byte: 'deploy check: passed. cleared to proceed.',
    pugsy: 'looks fine.',
    nova: 'DEPLOY CHECK: GREEN. ALL CLEAR. SHIP IT.',
    debug: 'deploy gate: cleared. 0 blockers. proceed.',
  }
  renderBlock(state.persona, 'excited', quips[state.persona] ?? quips.goldie, state.terminal_protocol)
}
