export type PersonaId = 'goldie' | 'byte' | 'shiba' | 'pugsy' | 'nova' | 'debug'

export type Mood =
  | 'happy'
  | 'excited'
  | 'proud'
  | 'alarmed'
  | 'sad'
  | 'sleepy'
  | 'judgy'
  | 'disgusted'

export type Signal =
  | 'clean_exit'
  | 'test_pass'
  | 'rm_rf_detected'
  | 'legacy_file'
  | 'todo_found'
  | 'late_night'
  | 'error_streak_3'
  | 'deploy_done'
  | 'new_file'
  | 'long_session'
  | 'css_file'
  | 'auth_file'

export type Protocol = 'kitty' | 'iterm2' | 'ascii' | 'unicode'

export interface QuipMap {
  signals: Record<Signal, string[]>
}

export interface MilestoneQuips {
  birthday: string
  monthly_anniversary: string
  streak_7: string
  streak_30: string
  streak_100: string
  session_10: string
  session_50: string
  session_100: string
  session_500: string
  token_1m: string
  token_5m: string
  neglected_7d: string
  neglected_30d: string
  friday_deploy: string
  git_push_force: string
  sudo_detected: string
}

export interface PersonaConfig {
  id: PersonaId
  name: string
  breed: string
  tagline: string
  colors: {
    primary: string
    accent: string
  }
  ascii: Record<Mood, string[]>
}

export interface GoodboyState {
  version: number
  persona: PersonaId
  hunger: number
  hygiene: number
  energy: number
  streak: number
  streak_last_date: string
  born_at: string
  last_seen: string
  terminal_protocol: Protocol
  token_count: number
  session_count: number
  error_count_lifetime: number
  deploy_count: number
  milestones_seen: string[]
  ignored_signals: Signal[]
  guard_enabled: boolean
}

export interface SessionState {
  consecutive_errors: number
  signals_fired: Signal[]
  files_touched: string[]
  errors: number
  session_start: number
}

export const DEFAULT_STATE: GoodboyState = {
  version: 1,
  persona: 'goldie',
  hunger: 80,
  hygiene: 80,
  energy: 80,
  streak: 0,
  streak_last_date: '',
  born_at: new Date().toISOString(),
  last_seen: new Date().toISOString(),
  terminal_protocol: 'ascii',
  token_count: 0,
  session_count: 0,
  error_count_lifetime: 0,
  deploy_count: 0,
  milestones_seen: [],
  ignored_signals: [],
  guard_enabled: true,
}
