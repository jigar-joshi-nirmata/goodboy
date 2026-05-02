import fs from 'fs'
import path from 'path'
import os from 'os'
import { readState, writeState } from '../state.js'
import { renderBlock } from '../renderer.js'

const GUARD_CONFIG_PATH = path.join(os.homedir(), '.goodboy.guard.json')

interface GuardConfig {
  blocked_days?: number[]
  blocked_hours?: number[]
  require_tests?: boolean
  require_green_ci?: boolean
  custom_message?: string
}

function readGuardConfig(): GuardConfig {
  if (!fs.existsSync(GUARD_CONFIG_PATH)) return {}
  try {
    return JSON.parse(fs.readFileSync(GUARD_CONFIG_PATH, 'utf8'))
  } catch {
    return {}
  }
}

function checkGuard(config: GuardConfig): string[] {
  const warnings: string[] = []
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()

  if (config.blocked_days?.includes(day)) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    warnings.push(`today is ${dayNames[day]} — blocked deploy day`)
  }

  if (config.blocked_hours?.some(h => hour === h)) {
    warnings.push(`current hour (${hour}:xx) is in blocked deploy window`)
  }

  if (config.custom_message) {
    warnings.push(config.custom_message)
  }

  return warnings
}

export async function runSit(args: string[]): Promise<void> {
  const state = readState()

  // `goodboy sit --enable` toggles deploy guard on
  if (args.includes('--enable')) {
    state.guard_enabled = true
    writeState(state)

    const quips: Record<string, string> = {
      goldie: 'deploy guard ON!! i will protect you from friday disasters!! i take this very seriously!!',
      shiba: 'guard enabled. i will be watching.',
      byte: 'deploy guard: enabled. monitoring active. proceeding with caution.',
      pugsy: 'watching. very serious.',
      nova: 'GUARD MODE: ENABLED. DEPLOY PROTECTION: ACTIVE. NO ACCIDENTS ON MY WATCH.',
      debug: 'guard flag: true. deploy gate: armed. watching for anomalies.',
    }
    renderBlock(state.persona, 'proud', quips[state.persona] ?? quips.goldie, state.terminal_protocol)
    return
  }

  if (args.includes('--disable')) {
    state.guard_enabled = false
    writeState(state)

    const quips: Record<string, string> = {
      goldie: 'deploy guard off... okay... i trust you... be careful out there...',
      shiba: 'guard disabled. your choice. consequences: your own.',
      byte: 'deploy guard: disabled. monitoring paused. responsibility: transferred to operator.',
      pugsy: 'ok fine.',
      nova: 'GUARD OFF. YOUR CALL. GOOD LUCK.',
      debug: 'guard flag: false. deploy gate: disarmed. logging this decision.',
    }
    renderBlock(state.persona, 'judgy', quips[state.persona] ?? quips.goldie, state.terminal_protocol)
    return
  }

  // Check deploy guard
  if (!state.guard_enabled) {
    const quips: Record<string, string> = {
      goldie: 'deploy guard is OFF!! run `goodboy sit --enable` to let me protect you!!',
      shiba: 'guard is off. you are on your own.',
      byte: 'deploy guard: disabled. enable with --enable flag to activate protection.',
      pugsy: 'guard off.',
      nova: 'GUARD INACTIVE. ENABLE IT. TRUST THE DOG.',
      debug: 'guard_enabled: false. no deploy check performed. enable to activate.',
    }
    renderBlock(state.persona, 'sleepy', quips[state.persona] ?? quips.goldie, state.terminal_protocol)
    return
  }

  const config = readGuardConfig()
  const warnings = checkGuard(config)

  const isFriday = new Date().getDay() === 5
  if (isFriday && !config.blocked_days?.includes(5)) {
    warnings.push("it's friday — are you sure about this deploy?")
  }

  if (warnings.length > 0) {
    const quips: Record<string, string> = {
      goldie: `WAIT WAIT WAIT!! i am sitting!! you cannot deploy!! ${warnings[0]}!! i am protecting you!!`,
      shiba: `sit. hold. ${warnings[0]}. you know the rules.`,
      byte: `deploy gate: BLOCKED. reason: ${warnings[0]}. resolve before proceeding.`,
      pugsy: `no. ${warnings[0]}.`,
      nova: `STOP. GUARD TRIGGERED. ${warnings[0].toUpperCase()}. DO NOT DEPLOY.`,
      debug: `deploy check: FAILED. warnings: ${warnings.length}. top issue: ${warnings[0]}.`,
    }
    console.log()
    for (const w of warnings) {
      console.log(`  ⚠️  ${w}`)
    }
    console.log()
    renderBlock(state.persona, 'alarmed', quips[state.persona] ?? quips.goldie, state.terminal_protocol)
    process.exit(1)
  }

  const quips: Record<string, string> = {
    goldie: 'all clear!! deploy looks safe!! go go go!! i believe in you!!',
    shiba: 'checked. nothing flagged. proceed.',
    byte: 'deploy check: passed. no blockers detected. cleared to proceed.',
    pugsy: 'looks fine.',
    nova: 'DEPLOY CHECK: GREEN. ALL CLEAR. SHIP IT.',
    debug: 'deploy gate: cleared. 0 warnings. proceed with confidence.',
  }
  renderBlock(state.persona, 'excited', quips[state.persona] ?? quips.goldie, state.terminal_protocol)
}
