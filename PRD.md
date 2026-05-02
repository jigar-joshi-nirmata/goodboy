# goodboy — Product Requirements Document

## Vision

A terminal-native Tamagotchi for developers. goodboy is a Claude Code plugin that gives developers a pixel-art dog companion with persistent state, distinct personality, and just enough utility to justify keeping it installed forever.

goodboy doesn't solve a hard engineering problem. It solves the mood problem. It makes the terminal feel alive.

---

## The problem

Development is often a lonely, stressful grind. Tools are cold and transactional. You ship something good and nothing happens. You hit three errors in a row and nothing happens. You work until 2am and nothing acknowledges it.

goodboy doesn't fix any of that. But it notices.

---

## Target users

- Developers who use Claude Code daily
- People who've ever named a variable after their pet
- Anyone who has whispered "come on" to a failing build
- OSS contributors who want the "easy first PR" path to actually be fun

---

## Non-goals

- goodboy is **not** a productivity tool disguised as a pet
- goodboy does **not** read your code (only metadata: filename, exit code, time, error count)
- goodboy does **not** send telemetry or call home
- goodboy does **not** require an API key (v1)
- goodboy does **not** appear after every tool call — only at meaningful moments

---

## The six personas

| Name | Breed | Personality | Quip tone |
|---|---|---|---|
| **Goldie** | Golden Retriever | Enthusiastic optimist | Celebrates everything, even the bad. Exclamation marks. Genuine warmth. |
| **Byte** | Border Collie | Focused and clever | Precise, slightly smug, occasionally condescending but never mean. |
| **Shiba** | Shiba Inu | Sassy and independent | Dry roasts, backhanded compliments, judges silently then speaks. |
| **Pugsy** | Pug | Lazy genius | Minimal words, surprisingly insightful, completely unbothered by chaos. |
| **Nova** | Husky | Energetic overachiever | Loud, fast, obsessed with performance and clean code. |
| **Debug** | Dachshund | Relentless bug hunter | Technical, keeps count of everything, never forgets, dry humor. |

---

## V1 Features

### 1. First-run persona selection

On `npx goodboy init`, user sees all 6 dogs in a styled terminal grid with name and one-line personality. They pick one. This is their dog. This moment should feel like picking a starter Pokémon.

- `goodboy switch` lets them change later (dog acts betrayed for 10 seconds)
- Persona selection is stored in `~/.goodboy`

### 2. Session lifecycle hooks

Hooks into Claude Code's lifecycle — three moments only:

| Hook | When | What happens |
|---|---|---|
| `PostSessionStart` | Start of every Claude Code session | Dog wakes up, greets based on mood + time of day |
| `PostToolUse` (errors only) | After 3+ consecutive errors | Dog reacts with alarmed sprite + error_streak quip |
| `PreSessionEnd` | End of session | Dog summarizes session, shows mood sprite + quip |

### 3. Sit. Stay. Deploy gate

Pre-deploy checklist triggered by `goodboy sit` or by detecting deploy commands in tool use.

Default checks:
- Tests passing (runs configured test command)
- No `console.log` left behind
- Not pushing directly from main
- No unresolved TODOs in changed files (optional, configurable)

Dog narrates each check in character. On failure, shows failed checks and requires explicit `y` to override. Config lives in `.goodboy.config.json` in project root.

### 4. Pet commands

| Command | Effect | Quip style |
|---|---|---|
| `goodboy feed` | hunger += 30 | Happy, tail wag |
| `goodboy bath` | hygiene += 40 | Reluctant but clean |
| `goodboy brew` | energy += 20 | Coffee solidarity |
| `goodboy nap` | energy += 50, takes 3 seconds | Dog actually sleeps |
| `goodboy walk` | starts 5-min timer | Dog drags you away |
| `goodboy status` | full stat display | Shows sprite + all stats |
| `goodboy rollover` | nothing | Dog rolls over |
| `goodboy switch` | change persona | Betrayal animation |

### 5. Persistent state

State file at `~/.goodboy` (JSON):

```json
{
  "persona": "shiba",
  "hunger": 80,
  "hygiene": 60,
  "energy": 90,
  "streak": 7,
  "streak_last_date": "2025-05-03",
  "born_at": "2025-05-03T00:00:00Z",
  "last_seen": "2025-05-03T10:00:00Z",
  "terminal_protocol": "kitty",
  "token_count": 1240000,
  "session_count": 89
}
```

**Stat decay rules:**
- `hunger`: -1 per hour since `last_seen`
- `hygiene`: -2 per `rm -rf` detected, -1 per error streak of 3+
- `energy`: -1 per 2 hours of active session time

**Mood derivation** (derived, not stored):
- hunger < 20 → sad
- hygiene < 20 → judgy
- energy < 20 → sleepy
- all stats > 70 + streak > 7 → proud
- all stats > 70 → happy
- default → happy

### 6. Milestone celebrations

| Milestone | Trigger | What happens |
|---|---|---|
| Birthday | `born_at` date match | Dog goes full unhinged, unique quip |
| Monthly anniversary | Monthly `born_at` day match | Brief moment of reflection |
| Streak: 7 days | streak == 7 | Dog is impressed (Shiba reluctantly so) |
| Streak: 30 days | streak == 30 | Bigger reaction, special quip |
| Streak: 100 days | streak == 100 | Legendary response |
| Session count | 10, 50, 100, 500 | Milestone quip |
| Token count | 1M, 5M, 10M | If accessible from Claude Code context |

### 7. Quip system (zero API cost)

Each persona ships with `quips/[name].json` — 120 quips across 12 signal buckets.

Signal buckets:
- `clean_exit`, `test_pass`, `rm_rf_detected`, `legacy_file`
- `todo_found`, `late_night`, `error_streak_3`, `deploy_done`
- `new_file`, `long_session`, `css_file`, `auth_file`

Signal detection reads only metadata (filename, exit code, time of day, error count). Zero tokens consumed.

### 8. Terminal rendering

| Terminal | Protocol | Quality |
|---|---|---|
| Kitty, WezTerm | Kitty graphics protocol | Full pixel art |
| iTerm2 | iTerm2 inline images | Full pixel art |
| Warp | Kitty protocol | Full pixel art |
| Other | Unicode faces | Fallback, still charming |

Protocol detected once, cached in `~/.goodboy`.

---

## V2 Features (post-launch)

- **AI quips** — one Haiku call per session end using only metadata JSON, user brings own key
- **Dog aging** — sprite stages (puppy → adult → senior) based on `born_at`
- **Community quip packs** — installable per-persona voice packs
- **Wag on PR merge** — optional GitHub webhook integration
- **Seasonal sprites** — Halloween, holiday, etc. (community contributed)

---

## Open source strategy

- Full MIT license
- Quip PRs are the easiest entry point — no code required
- Each persona's quips.json is the "mascot territory" people will defend and improve
- Community can add new signal buckets (PRs welcome)
- Sprite contributions welcomed for seasonal variants

---

## Success metrics

| Metric | Target |
|---|---|
| GitHub stars | 500 in first month |
| npm weekly downloads | 1,000/week by month 2 |
| Community quip PRs | 10 PRs in first 3 months |
| Developer Twitter mentions | People tweeting their dog's reaction screenshots |
