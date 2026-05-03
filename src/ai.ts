import { GoodboyState, PersonaId } from './personas/types.js'
import { SessionState } from './personas/types.js'

const HAIKU_MODEL = 'claude-haiku-4-5-20251001'
const API_URL = 'https://api.anthropic.com/v1/messages'

interface SessionSummary {
  persona: PersonaId
  mood: string
  duration_min: number
  errors: number
  files_touched: number
  streak: number
  signals_fired: string[]
  deploy_count: number
  hour_of_day: number
}

const PERSONA_VOICE: Record<PersonaId, string> = {
  goldie: 'enthusiastic golden retriever — exclamation marks, celebrates everything, warm and excitable',
  shiba: 'dry shiba inu — minimal words, deadpan, backhanded compliments, never more than one sentence',
  byte: 'analytical border collie — precise, data-driven, slightly smug, uses metrics',
  pugsy: 'unbothered pug — maximum 5 words, completely calm, weirdly wise',
  nova: 'all-caps husky — loud, obsessed with speed and momentum, everything is maximum',
  debug: 'methodical dachshund — counts everything, keeps a log, technical, never forgets',
}

export async function generateKeyExposedQuip(
  state: GoodboyState,
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  const prompt = `You are ${state.persona}, a ${PERSONA_VOICE[state.persona]}.

A secret API key or credential just appeared in the terminal output. You are DISGUSTED and alarmed.
Write ONE quip in character reacting to this security incident.

Rules:
- One sentence only. No quotes around it.
- Do NOT reproduce or reference any key value.
- Strongly recommend rotating the key.
- Stay in voice. ${state.persona === 'pugsy' ? 'Max 6 words.' : ''}${state.persona === 'nova' ? 'ALL CAPS.' : ''}
- Do not start with "I" or the dog name.`

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: HAIKU_MODEL,
        max_tokens: 80,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) return null

    const data = await response.json() as { content?: Array<{ text?: string }> }
    const text = data.content?.[0]?.text?.trim()
    return text ?? null
  } catch {
    return null
  }
}

export async function generateAIQuip(
  state: GoodboyState,
  session: SessionState,
  durationMs: number
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  const summary: SessionSummary = {
    persona: state.persona,
    mood: 'session_end',
    duration_min: Math.floor(durationMs / 60000),
    errors: session.errors,
    files_touched: new Set(session.files_touched).size,
    streak: state.streak,
    signals_fired: session.signals_fired,
    deploy_count: state.deploy_count,
    hour_of_day: new Date().getHours(),
  }

  const prompt = `You are ${state.persona}, a ${PERSONA_VOICE[state.persona]}.

A coding session just ended. Write ONE quip reacting to this session. Stay exactly in character.

Session data:
- duration: ${summary.duration_min} minutes
- errors: ${summary.errors}
- files touched: ${summary.files_touched}
- signals fired: ${summary.signals_fired.join(', ') || 'none'}
- current streak: ${summary.streak} days
- hour: ${summary.hour_of_day}:00

Rules:
- One sentence only. No quotes around it.
- Reference the actual session data — be specific, not generic.
- Stay in voice. ${state.persona === 'pugsy' ? 'Max 6 words.' : ''}${state.persona === 'nova' ? 'ALL CAPS.' : ''}
- Do not start with "I" or the dog name.`

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: HAIKU_MODEL,
        max_tokens: 80,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) return null

    const data = await response.json() as { content?: Array<{ text?: string }> }
    const text = data.content?.[0]?.text?.trim()
    return text ?? null
  } catch {
    return null
  }
}
