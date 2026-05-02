# goodboy — Technical Design

## Stack

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript | MCP SDK is TypeScript-first, broad contributor familiarity |
| Runtime | Node.js 18+ | Ships via `npx`, zero install friction |
| Plugin type | Claude Code MCP server (stdio) | Native Claude Code integration |
| State | JSON file at `~/.goodboy` | Simple, portable, inspectable with `cat` |
| Images | Bundled PNGs + raw escape sequences | No image lib needed for Kitty/iTerm2 |

---

## File structure

```
goodboy/
├── src/
│   ├── index.ts                  # MCP server entry, registers all tools + hooks
│   ├── state.ts                  # ~/.goodboy read/write with atomic writes
│   ├── renderer.ts               # Terminal protocol detection + sprite output
│   ├── milestones.ts             # Birthday, streak, token, session milestone logic
│   ├── quips.ts                  # Quip selection by signal + persona
│   ├── hooks/
│   │   ├── session-start.ts      # PostSessionStart handler
│   │   ├── tool-use.ts           # PostToolUse (error filter + streak tracker)
│   │   └── session-end.ts        # PreSessionEnd handler
│   ├── commands/
│   │   ├── feed.ts
│   │   ├── bath.ts
│   │   ├── brew.ts
│   │   ├── nap.ts
│   │   ├── walk.ts
│   │   ├── status.ts
│   │   ├── rollover.ts
│   │   └── switch.ts
│   └── personas/
│       ├── types.ts              # Persona + QuipMap + SpriteMap interfaces
│       └── index.ts              # Persona registry, loads quips + sprite paths
├── quips/
│   ├── goldie.json
│   ├── byte.json
│   ├── shiba.json
│   ├── pugsy.json
│   ├── nova.json
│   └── debug.json
├── sprites/
│   ├── goldie/
│   │   ├── happy.png
│   │   ├── proud.png
│   │   ├── alarmed.png
│   │   ├── sad.png
│   │   ├── sleepy.png
│   │   └── judgy.png
│   ├── byte/   (same structure)
│   ├── shiba/  (same structure)
│   ├── pugsy/  (same structure)
│   ├── nova/   (same structure)
│   └── debug/  (same structure)
├── assets/
│   └── hero.png                  # README banner
├── package.json
├── tsconfig.json
└── .goodboy.config.json.example  # Deploy gate config template
```

---

## State management

### Schema

```typescript
interface GoodboyState {
  persona: PersonaId                 // 'goldie' | 'byte' | 'shiba' | 'pugsy' | 'nova' | 'debug'
  hunger: number                     // 0–100
  hygiene: number                    // 0–100
  energy: number                     // 0–100
  streak: number                     // consecutive days with at least one session
  streak_last_date: string           // ISO date string, YYYY-MM-DD
  born_at: string                    // ISO datetime, set on init
  last_seen: string                  // ISO datetime, updated on session start
  terminal_protocol: Protocol        // cached after first detection
  token_count: number                // lifetime tokens if accessible
  session_count: number              // lifetime sessions
}
```

### Atomic writes

State is written to `~/.goodboy.tmp` then renamed to `~/.goodboy`. Prevents corruption on crash mid-write.

### Stat decay

Applied on every `PostSessionStart`, based on hours elapsed since `last_seen`:

```typescript
function applyDecay(state: GoodboyState, hoursElapsed: number): GoodboyState {
  return {
    ...state,
    hunger: Math.max(0, state.hunger - hoursElapsed),
    energy: Math.max(0, state.energy - hoursElapsed * 0.5),
    // hygiene decays only on bad events (rm -rf, error streaks), not time
  }
}
```

### Mood derivation

Mood is computed from current stats, never stored:

```typescript
function deriveMood(state: GoodboyState): Mood {
  if (state.hunger < 20) return 'sad'
  if (state.hygiene < 20) return 'judgy'
  if (state.energy < 20) return 'sleepy'
  if (state.hunger > 70 && state.energy > 70 && state.streak >= 7) return 'proud'
  return 'happy'
}
```

---

## Terminal rendering

### Protocol detection

```typescript
type Protocol = 'kitty' | 'iterm2' | 'sixel' | 'unicode'

function detectProtocol(): Protocol {
  const term = process.env.TERM ?? ''
  const termProgram = process.env.TERM_PROGRAM ?? ''

  if (term === 'xterm-kitty' || termProgram === 'WarpTerminal') return 'kitty'
  if (termProgram === 'iTerm.app') return 'iterm2'
  // sixel detection via DA2 response (advanced, skip for v1)
  return 'unicode'
}
```

Protocol detected once on first run, cached in `~/.goodboy` as `terminal_protocol`.

### Kitty protocol

```typescript
function renderKitty(pngPath: string): string {
  const data = fs.readFileSync(pngPath)
  const b64 = data.toString('base64')
  // Kitty: ESC _G a=T,f=100,q=2;<base64> ESC \
  return `\x1b_Ga=T,f=100,q=2;${b64}\x1b\\`
}
```

### iTerm2 protocol

```typescript
function renderIterm2(pngPath: string): string {
  const data = fs.readFileSync(pngPath)
  const b64 = data.toString('base64')
  const size = data.length
  return `\x1b]1337;File=inline=1;size=${size};width=64px;height=64px:${b64}\x07`
}
```

### Unicode fallback

Each mood maps to a Unicode face:

```typescript
const UNICODE_FACES: Record<Mood, string> = {
  happy:   '(•‿•)',
  proud:   '(ᵔᴥᵔ)',
  alarmed: '(º o º)',
  sad:     '(╥_╥)',
  sleepy:  '(-.-) zzz',
  judgy:   '( ._.) ',
}
```

---

## Quip system

### Schema (quips/[persona].json)

```json
{
  "signals": {
    "clean_exit":      ["...", "..."],
    "test_pass":       ["..."],
    "rm_rf_detected":  ["..."],
    "legacy_file":     ["..."],
    "todo_found":      ["..."],
    "late_night":      ["..."],
    "error_streak_3":  ["..."],
    "deploy_done":     ["..."],
    "new_file":        ["..."],
    "long_session":    ["..."],
    "css_file":        ["..."],
    "auth_file":       ["..."]
  }
}
```

10 quips per signal bucket, 12 buckets = 120 quips per persona.

### Signal detection

Signal is determined from tool use metadata only — no code is read:

```typescript
function detectSignal(toolResult: ToolResult): Signal | null {
  const { filename, exitCode, durationMs, errorCount, time } = toolResult

  if (filename?.includes('rm -rf')) return 'rm_rf_detected'
  if (filename?.includes('legacy_') || filename?.includes('old_')) return 'legacy_file'
  if (filename?.toLowerCase().includes('auth')) return 'auth_file'
  if (filename?.endsWith('.css') || filename?.endsWith('.scss')) return 'css_file'
  if (exitCode === 0 && errorCount === 0) return 'clean_exit'
  if (new Date(time).getHours() >= 22 || new Date(time).getHours() <= 4) return 'late_night'

  return null
}
```

### Quip selection

```typescript
function pickQuip(persona: Persona, signal: Signal): string {
  const pool = persona.quips.signals[signal]
  return pool[Math.floor(Math.random() * pool.length)]
}
```

---

## Hook logic

### PostSessionStart

1. Read `~/.goodboy`, apply stat decay based on time since `last_seen`
2. Update `last_seen`, increment `session_count`, update streak
3. Check milestones (birthday, anniversary, streak, session count)
4. Detect terminal protocol if not cached
5. Derive mood from current stats
6. Select quip: time-of-day signal takes priority, then mood-based greeting
7. Render sprite + quip + any milestone celebration
8. Write updated state

### PostToolUse (error filter)

1. Only fires on non-zero exit codes
2. Track consecutive error count in session-scoped memory (not persisted)
3. On error streak hitting 3: render alarmed sprite + `error_streak_3` quip, decrement hygiene
4. On clean exit after streak: reset counter, optional brief recovery quip

### PreSessionEnd

1. Compute session summary from Claude Code context (duration, error count, files touched)
2. Detect strongest signal from session (rm_rf, late_night, long_session, etc.)
3. Derive final mood
4. Select quip for signal/mood
5. Render sprite + quip + one-line session summary
6. Write final state

---

## Sit. Stay. Deploy gate

### Configuration (.goodboy.config.json in project root)

```json
{
  "checks": [
    { "name": "tests passing", "command": "npm test", "required": true },
    { "name": "no console.log", "command": "grep -r 'console.log' src/", "expectExitCode": 1, "required": false },
    { "name": "not on main", "command": "[ $(git branch --show-current) != 'main' ]", "required": true }
  ]
}
```

### Flow

```
goodboy sit
→ render dog "sit." quip
→ run each check, stream results with ✓/✗
→ if all required checks pass: render "stay." → "deploy, boy!" → exit 0
→ if any required check fails: show failures, prompt override [y/N] → exit 1 if N
```

---

## Persona interface

```typescript
type PersonaId = 'goldie' | 'byte' | 'shiba' | 'pugsy' | 'nova' | 'debug'
type Mood = 'happy' | 'proud' | 'alarmed' | 'sad' | 'sleepy' | 'judgy'
type Signal = 'clean_exit' | 'test_pass' | 'rm_rf_detected' | 'legacy_file' |
              'todo_found' | 'late_night' | 'error_streak_3' | 'deploy_done' |
              'new_file' | 'long_session' | 'css_file' | 'auth_file'

interface Persona {
  id: PersonaId
  name: string
  breed: string
  tagline: string
  colors: { primary: string; accent: string }
  quips: { signals: Record<Signal, string[]> }
  spritePaths: Record<Mood, string>
}
```

---

## Dependencies

| Package | Version | Use |
|---|---|---|
| `@modelcontextprotocol/sdk` | latest | MCP server |
| `chalk` | ^5 | Terminal colors |
| `@anthropic-ai/sdk` | latest | V2 Haiku quips (optional, gated) |

No image processing library needed — Kitty and iTerm2 protocols use raw base64 PNG.

---

## Build & publish

```bash
npm run build     # tsc → dist/
npm run dev       # ts-node src/index.ts --watch
npm publish       # publishes as 'goodboy' on npm
```

Entry point in `package.json`:
```json
{
  "name": "goodboy",
  "bin": { "goodboy": "dist/index.js" },
  "main": "dist/index.js"
}
```

---

## First-run flow

```
$ npx goodboy init

  pick your companion.

  [Goldie]  [Byte]  [Shiba]
  [Pugsy]   [Nova]  [Debug]

  → enter dog name: shiba

  [Shiba sprite — happy]
  "...fine. i'll allow it."

  goodboy initialized. your dog is waiting.
```

---

## What gets shipped in the npm package

- `dist/` — compiled JS
- `quips/` — all 6 JSON files
- `sprites/` — all 36 PNG files (6 personas × 6 moods)
- `assets/` — hero image (not functionally required)
- `README.md`, `CONTRIBUTING.md`
- `.goodboy.config.json.example`
