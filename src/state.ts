import fs from 'fs'
import os from 'os'
import path from 'path'
import { GoodboyState, SessionState, DEFAULT_STATE, Mood } from './personas/types.js'

const STATE_PATH = path.join(os.homedir(), '.goodboy')
const SESSION_PATH = path.join(os.tmpdir(), 'goodboy-session.json')

export function readState(): GoodboyState {
  try {
    const raw = fs.readFileSync(STATE_PATH, 'utf8')
    return { ...DEFAULT_STATE, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_STATE, born_at: new Date().toISOString() }
  }
}

export function writeState(state: GoodboyState): void {
  const tmp = STATE_PATH + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf8')
  fs.renameSync(tmp, STATE_PATH)
}

export function readSession(): SessionState {
  try {
    const raw = fs.readFileSync(SESSION_PATH, 'utf8')
    return JSON.parse(raw)
  } catch {
    return {
      consecutive_errors: 0,
      signals_fired: [],
      files_touched: [],
      errors: 0,
      session_start: Date.now(),
    }
  }
}

export function writeSession(session: SessionState): void {
  fs.writeFileSync(SESSION_PATH, JSON.stringify(session), 'utf8')
}

export function clearSession(): void {
  try { fs.unlinkSync(SESSION_PATH) } catch {}
}

export function applyDecay(state: GoodboyState): GoodboyState {
  const now = Date.now()
  const lastSeen = new Date(state.last_seen).getTime()
  const hoursElapsed = (now - lastSeen) / (1000 * 60 * 60)

  return {
    ...state,
    hunger: Math.max(0, state.hunger - Math.floor(hoursElapsed * 2)),
    energy: Math.max(0, state.energy - Math.floor(hoursElapsed * 0.5)),
  }
}

export function updateStreak(state: GoodboyState): GoodboyState {
  const today = new Date().toISOString().split('T')[0]
  const lastDate = state.streak_last_date

  if (lastDate === today) return state

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const newStreak = lastDate === yesterday ? state.streak + 1 : 1

  return { ...state, streak: newStreak, streak_last_date: today }
}

export function deriveMood(state: GoodboyState, hasErrorStreak = false, hasDeploy = false): Mood {
  if (hasErrorStreak || state.hunger < 10) return 'alarmed'
  if (state.hygiene < 20) return 'disgusted'
  if (state.hunger < 25) return 'sad'
  if (state.energy < 20) return 'sleepy'
  if (state.hygiene < 40) return 'judgy'
  if (hasDeploy) return 'excited'
  if (state.streak >= 7 && state.hunger > 70 && state.energy > 70) return 'proud'
  if (state.hunger > 70 && state.energy > 70) return 'happy'
  return 'happy'
}

export function clampStat(value: number): number {
  return Math.min(100, Math.max(0, value))
}

export function stateExists(): boolean {
  return fs.existsSync(STATE_PATH)
}
