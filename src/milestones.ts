import { GoodboyState, PersonaId } from './personas/types.js'
import { MILESTONE_QUIPS } from './quips.js'

export interface MilestoneEvent {
  key: string
  quip: string
}

export function checkMilestones(state: GoodboyState): MilestoneEvent[] {
  const events: MilestoneEvent[] = []
  const persona = state.persona as PersonaId
  const quips = MILESTONE_QUIPS[persona]
  const seen = new Set(state.milestones_seen)

  const today = new Date()
  const born = new Date(state.born_at)

  // Birthday
  if (
    today.getMonth() === born.getMonth() &&
    today.getDate() === born.getDate() &&
    !seen.has(`birthday_${today.getFullYear()}`)
  ) {
    events.push({ key: `birthday_${today.getFullYear()}`, quip: quips.birthday })
  }

  // Monthly anniversary
  if (
    today.getDate() === born.getDate() &&
    today.getTime() - born.getTime() > 30 * 24 * 60 * 60 * 1000 &&
    !seen.has(`monthly_${today.getFullYear()}_${today.getMonth()}`)
  ) {
    events.push({
      key: `monthly_${today.getFullYear()}_${today.getMonth()}`,
      quip: quips.monthly_anniversary,
    })
  }

  // Streak milestones
  for (const [days, key] of [[7, 'streak_7'], [30, 'streak_30'], [100, 'streak_100']] as const) {
    if (state.streak >= days && !seen.has(key)) {
      events.push({ key, quip: quips[key] })
    }
  }

  // Session count milestones
  for (const [count, key] of [
    [10, 'session_10'],
    [50, 'session_50'],
    [100, 'session_100'],
    [500, 'session_500'],
  ] as const) {
    if (state.session_count >= count && !seen.has(key)) {
      events.push({ key, quip: quips[key] })
    }
  }

  // Token milestones
  if (state.token_count >= 1_000_000 && !seen.has('token_1m')) {
    events.push({ key: 'token_1m', quip: quips.token_1m })
  }
  if (state.token_count >= 5_000_000 && !seen.has('token_5m')) {
    events.push({ key: 'token_5m', quip: quips.token_5m })
  }

  // Neglect milestones
  const hoursSinceSeen =
    (Date.now() - new Date(state.last_seen).getTime()) / (1000 * 60 * 60)

  if (hoursSinceSeen > 168 && !seen.has('neglected_7d_recent')) {
    events.push({ key: 'neglected_7d_recent', quip: quips.neglected_7d })
  } else if (hoursSinceSeen > 720 && !seen.has('neglected_30d_recent')) {
    events.push({ key: 'neglected_30d_recent', quip: quips.neglected_30d })
  }

  return events
}

export function markMilestonesSeen(state: GoodboyState, events: MilestoneEvent[]): GoodboyState {
  const seen = [...state.milestones_seen, ...events.map(e => e.key)]
  return { ...state, milestones_seen: [...new Set(seen)] }
}

export function getDogAge(bornAt: string): string {
  const born = new Date(bornAt)
  const now = new Date()
  const diffMs = now.getTime() - born.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days === 0) return `${hours} hours old`
  if (days === 1) return `1 day, ${hours} hours old`
  return `${days} days, ${hours} hours old`
}

export function getExperienceLevel(sessions: number): { level: number; title: string } {
  if (sessions < 10) return { level: 1, title: 'Fresh Pup' }
  if (sessions < 25) return { level: 2, title: 'Eager Learner' }
  if (sessions < 50) return { level: 3, title: 'Junior Developer Dog' }
  if (sessions < 100) return { level: 4, title: 'Mid-Level Mutt' }
  if (sessions < 250) return { level: 5, title: 'Senior Dev Dog' }
  if (sessions < 500) return { level: 6, title: 'Staff Engineer Dog' }
  if (sessions < 1000) return { level: 7, title: 'Principal Pupper' }
  return { level: 8, title: 'Distinguished Fellow (Dog)' }
}
