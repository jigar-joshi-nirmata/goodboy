# goodboy — Product Requirements Document (v2)

## Executive Summary

goodboy is a production-grade Claude Code plugin that gives developers a persistent, pixel-art dog companion living in their terminal. It is equal parts utility and delight — a Tamagotchi with real developer integrations. The dog reacts to git events, test runs, build outcomes, late-night sessions, and deploy decisions. It has health stats that decay, moods that shift, and a personality that stays consistent across thousands of coding hours.

This document defines the complete v1 feature set, all event triggers, all commands, the full rendering system including ASCII fallback, and the open source strategy.

---

## Problem Statement

Development is largely a feedback-free grind. You push code and nothing celebrates it. You hit a string of errors and nothing acknowledges the struggle. You work until 2am and the terminal doesn't notice.

Tools are cold. Workflows are transactional. goodboy doesn't solve a technical problem — it solves the emotional texture of development. It makes the terminal feel alive.

The secondary goal is utility: the deploy gate, the session summary, and the health commands add real value on top of the personality layer.

---

## Goals

- Ship a Claude Code plugin that developers install and keep installed (not a novelty they delete in a week)
- React to real development events with appropriate dog behavior — meaningful moments only, not noise
- Maintain persistent dog state across sessions — the dog is a companion, not a widget
- Be genuinely funny through distinct per-persona voice, not generic cute
- Work beautifully on rich terminals (pixel art) and degrade gracefully on basic ones (ASCII art)
- Be open source with the lowest possible barrier to contribution (quip PRs require zero code)

## Non-Goals

- goodboy does **not** read source code content — only metadata (filename, exit code, duration, error count, time of day)
- goodboy does **not** send telemetry or call any external server (v1)
- goodboy does **not** require an API key to function
- goodboy does **not** react to every single tool call — only to meaningful development events
- goodboy does **not** block workflows — all reactions are non-blocking output

---

## Success Metrics

| Metric | Target | Timeframe |
|---|---|---|
| GitHub stars | 500 | Month 1 |
| npm weekly downloads | 1,000/week | Month 2 |
| Community quip PRs | 10+ PRs | Month 3 |
| Retention | Users still installed after 30 days | Ongoing |
| Viral moment | Screenshot shared on dev Twitter/Bluesky | Week 1 |

---

## Target Users

| Type | Description |
|---|---|
| Daily Claude Code user | Uses Claude Code for most development work — primary target |
| OSS contributor | Wants the "easy first PR" path to actually be fun — quip PRs |
| Developer with pets | Emotionally predisposed to forming attachment — converts immediately |
| Terminal customizer | Already has a rice'd terminal setup — goodboy fits the aesthetic |
| Developer who works alone | No team around to react to their wins — goodboy fills that gap |

---

## The Six Personas

Each persona is a distinct dog breed with its own visual identity, quip voice, and emotional register. Personas ship with individual `quips/[name].json` files — same signal buckets, completely different tone.

| Name | Breed | Core personality | Quip tone | Accent color |
|---|---|---|---|---|
| **Goldie** | Golden Retriever | Enthusiastic optimist | Warm, excitable, exclamation marks, celebrates even failures | `#FFD700` |
| **Byte** | Border Collie | Focused and analytical | Precise, slightly smug, data-driven, occasionally condescending | `#4A9EFF` |
| **Shiba** | Shiba Inu | Sassy and independent | Dry wit, backhanded compliments, minimal words that land hard | `#FF8C00` |
| **Pugsy** | Pug | Lazy genius | Fewest possible words, completely unbothered, surprisingly wise | `#B088F9` |
| **Nova** | Siberian Husky | Energetic overachiever | Loud, obsessed with speed and metrics, everything is a sprint | `#00D4FF` |
| **Debug** | Dachshund | Relentless bug hunter | Technical, keeps exact count of everything, never forgets anything | `#39D353` |

### Example: same signal, six voices

Signal: `rm_rf_detected`

```
Goldie:  "oh no!! it's okay!! we can rebuild!! probably!!"
Byte:    "entropy maximized. data loss confirmed. irreversible."
Shiba:   "bold. chaotic. historically catastrophic decision."
Pugsy:   "again."
Nova:    "FULL SEND. NO SURVIVORS. ABSOLUTE LEGEND."
Debug:   "deletion event #847 logged. recovery probability: low."
```

---

## Dog Moods

Eight moods cover the full emotional range needed. Mood is derived from stats and events — never stored directly.

| Mood | Triggers | Visual tell |
|---|---|---|
| **happy** | Default healthy state, clean exits, normal sessions | Tail up, open mouth, bright eyes |
| **excited** | Tests all pass, successful deploy, milestones, birthday, git push success | Zoomies energy, full body engaged, sparkles |
| **proud** | Streak milestone, streak > 7 days, high stats sustained | Chest out, tall sit, half-closed smug eyes |
| **alarmed** | 3+ consecutive errors, `rm -rf`, `git push --force`, .env touched, `sudo` | Eyes wide, ears raised, body tense, ! indicator |
| **sad** | Hunger < 20, build failure after long session, dog neglected >48h | Droopy ears, downcast eyes, slumped posture |
| **sleepy** | Energy < 20, session > 3 hours, late night, build taking >5 minutes | Half-closed eyes, tilted head, ZZZ |
| **judgy** | Bad commit message, `console.log` in prod, hygiene < 20, legacy file | Narrowed eyes, head turned, unimpressed side-eye |
| **disgusted** | `legacy_` filename, `old_` filename, `node_modules` mentioned, `rm -rf node_modules`, TODO count > 10 | Recoiling posture, nose wrinkled, strong side-eye |

### Mood priority (highest wins when multiple apply)

`alarmed > disgusted > sad > sleepy > judgy > excited > proud > happy`

### Mood derivation logic

```
if error_streak >= 3 OR rm_rf OR git_push_force OR env_file_touched → alarmed
else if legacy_file OR todo_count > 10 OR node_modules_deleted → disgusted
else if hunger < 20 OR neglected > 48h → sad
else if energy < 20 OR session_duration > 3h OR late_night → sleepy
else if hygiene < 20 OR bad_commit_message OR console_log_found → judgy
else if tests_all_pass OR deploy_success OR milestone → excited
else if streak > 7 AND all_stats > 70 → proud
else → happy
```

---

## Feature Specifications

### Feature 1 — First-Run Experience

On `npx goodboy init`, the user sees a styled terminal selection screen showing all 6 dogs in a 2×3 grid with names, personality descriptions, and accent colors. This moment must feel like picking a starter Pokémon.

**Flow:**

```
$ npx goodboy init

  pick your companion.

  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │  [Goldie]   │  │   [Byte]    │  │   [Shiba]   │
  │             │  │             │  │             │
  │ enthusiastic│  │ focused and │  │ sassy and   │
  │  optimist.  │  │  clever.    │  │ independent.│
  └─────────────┘  └─────────────┘  └─────────────┘

  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │   [Pugsy]   │  │   [Nova]    │  │   [Debug]   │
  │             │  │             │  │             │
  │ lazy genius.│  │  energetic  │  │  sniffing   │
  │             │  │ overachiever│  │  out bugs.  │
  └─────────────┘  └─────────────┘  └─────────────┘

  → enter dog name: _
```

After selection, dog appears with a persona-specific greeting:

- Goldie: *"hi!! hi hi hi!! i'm so happy you picked me!! let's write code!!"*
- Shiba: *"...fine. i'll allow it."*
- Debug: *"new companion initialized. beginning observation."*

`~/.goodboy` is created with defaults. Terminal protocol is detected and cached.

**`goodboy switch`** — change persona at any time. Dog acts betrayed for exactly 3 seconds before the new dog appears.

---

### Feature 2 — Event Detection System

goodboy monitors development events through Claude Code's `PostToolUse` hook. It reads only metadata — never source code. All signal detection is based on command strings, filenames, exit codes, timestamps, and error counts.

#### 2.1 Git Events

| Event | Detection | Dog reaction | Mood |
|---|---|---|---|
| `git push` | command contains `git push`, exit 0 | Excited send-off, deployment quip | excited |
| `git push --force` | command contains `--force` or `-f` | Full alarm, persona-specific horror | alarmed |
| `git pull` | command contains `git pull`, exit 0 | "fetch!" joke, happy | happy |
| `git merge` (clean) | `git merge` exit 0, no conflict markers | Relieved/proud | proud |
| `git merge` (conflict) | exit 1 + "CONFLICT" in output | Confused alarm | alarmed |
| `git commit` (good message) | message length > 20 chars, not in bad list | Approving nod | happy |
| `git commit` (bad message) | message is "fix", "wip", "asdf", ".", single word | Judgy reaction | judgy |
| `git stash` | command contains `git stash` | "hiding something?" | judgy |
| `git reset --hard` | command contains `reset --hard` | Watches in horror | alarmed |
| `git blame` | command contains `git blame` | Detective mode activated | excited |
| `git checkout -b hotfix/*` | branch name contains `hotfix` | Emergency alert | alarmed |
| `git checkout -b feature/*` | branch name contains `feature` | New adventure excitement | excited |
| `git rebase` | command contains `git rebase` | Dog does yoga (stressed) | judgy |
| `git cherry-pick` | command contains `cherry-pick` | Dog picks a cherry, suspicious | judgy |
| First commit of the day | commit after > 8h gap | Morning energy | happy |
| 100th commit in repo | `git log --oneline \| wc -l` == 100 | Milestone celebration | excited |

#### 2.2 Test Events

| Event | Detection | Dog reaction | Mood |
|---|---|---|---|
| All tests pass | test command exit 0, "passed" in output | Full celebration | excited |
| Single test fails | exit 1, "1 failed" pattern | Concerned, supportive | sad |
| Multiple tests fail | exit 1, N > 1 failed | Alarmed intervention | alarmed |
| Test suite > 5 minutes | duration > 300s | Dog fell asleep waiting | sleepy |
| New test file created | filename contains `.test.`, `.spec.` | Approving | proud |
| Zero test files in project | no `.test.` or `.spec.` files found | Judgy disapproval | judgy |
| Snapshot tests updated | `--updateSnapshot` in command | Suspicious | judgy |
| Coverage drops | coverage report shows decrease | Disappointed | sad |

#### 2.3 Build Events

| Event | Detection | Dog reaction | Mood |
|---|---|---|---|
| Build success | build command exit 0 | Happy/proud | happy |
| Build failure | build command exit 1 | Sad, concerned | sad |
| Build > 5 minutes | duration > 300s | Dog napped during build | sleepy |
| Build < 30 seconds | duration < 30s | Nova especially impressed | excited |
| npm install | command = `npm install` | Patient waiting | happy |
| npm install (many packages) | output contains "> 100 packages" | Dog counts out loud | happy |
| npm audit: vulns found | `npm audit` exit 1 | Guard dog mode | alarmed |
| `npm publish` | command contains `npm publish` | Major excited milestone | excited |

#### 2.4 Code Quality Events

| Event | Detection | Dog reaction | Mood |
|---|---|---|---|
| `rm -rf` | command contains `rm -rf` | Absolute terror | alarmed |
| `sudo` | command starts with `sudo` | Guard dog alert | alarmed |
| `.env` file touched | filename = `.env` or `.env.*` | Secrets alarm | alarmed |
| `console.log` in file | grep result positive | Judgy eyeroll | judgy |
| Legacy file detected | filename has `legacy_`, `old_`, `deprecated_`, `backup_` | Active disgust | disgusted |
| Auth/security file | filename has `auth`, `login`, `token`, `secret`, `jwt`, `oauth` | Serious focus mode | focused → happy on exit 0 |
| File > 500 lines | line count > 500 | Overwhelmed concern | judgy |
| TODO count > 10 | grep count in changed files | Dog makes a note | disgusted |
| ESLint: clean | eslint exit 0 | Clean/happy | happy |
| ESLint: errors | eslint exit 1 | Judgy | judgy |
| TypeScript errors | tsc exit 1 | Confused | alarmed |
| `node_modules` deleted | `rm -rf node_modules` pattern | Dog refuses to look | disgusted |
| Version bump in package.json | `"version"` field changed | Release incoming excitement | excited |

#### 2.5 Time-Based Events

| Event | Detection | Dog reaction | Mood |
|---|---|---|---|
| Late night (10pm–2am) | system time | Concerned, gentle nudge | sleepy |
| Deep night (2am–5am) | system time | Intervention. Enough. | alarmed |
| Early morning (before 7am) | system time | Surprised you're up | excited |
| Long session > 3 hours | session duration | Walk time | sleepy |
| Long session > 5 hours | session duration | Genuine concern | sad |
| Monday morning | weekday + hour < 12 | Motivational | happy |
| Friday deploy detected | day = Friday + deploy command | Special warning sequence | alarmed |
| Weekend session | Saturday/Sunday | Dog in casual mode | happy |

#### 2.6 Session & Streak Events

| Event | Detection | Dog reaction | Mood |
|---|---|---|---|
| First session of day | `last_seen` date != today | Morning greeting | happy |
| Return after > 24 hours | `last_seen` gap > 24h | Dog missed you | sad → happy |
| Return after > 7 days | `last_seen` gap > 7 days | Dog forgot who you are (funny) | alarmed |
| Return after > 30 days | `last_seen` gap > 30 days | Dog went through stages of grief | sad |
| Error then immediate fix | error exit followed by clean exit same file | Relief + pride | excited |
| Same error 3x | same exit code, same file, 3 times | Dog can't watch | alarmed |
| 10+ files changed in one commit | diff stat > 10 files | Big commit energy | excited |

#### 2.7 Milestone Events

| Milestone | Trigger | Reaction |
|---|---|---|
| Birthday | `born_at` date matches today | Full chaos, unhinged quip, special animation |
| Monthly anniversary | Month-day of `born_at` matches today | Reflective quip, mini celebration |
| 7-day streak | `streak` hits 7 | Impressed (Shiba reluctantly) |
| 30-day streak | `streak` hits 30 | Bigger celebration |
| 100-day streak | `streak` hits 100 | Legendary. All personas go off-script. |
| Session #10 | `session_count` = 10 | "we're getting somewhere" |
| Session #50 | `session_count` = 50 | Meaningful milestone quip |
| Session #100 | `session_count` = 100 | Major celebration |
| Session #500 | `session_count` = 500 | Dog is basically your coworker now |
| Token 1M | `token_count` >= 1,000,000 | "we've talked a lot" |
| Token 5M | `token_count` >= 5,000,000 | "i know all your secrets" |
| Token 10M | `token_count` >= 10,000,000 | Dog transcends |

---

### Feature 3 — Pet Care Commands

Commands mutate dog state and produce an in-character response. All commands are non-blocking and complete in < 1 second unless noted.

#### Core care commands

| Command | Stats effect | In-character behavior |
|---|---|---|
| `goodboy feed` | hunger += 30 (max 100) | Dog does happy spin, eats enthusiastically |
| `goodboy bath` | hygiene += 40 (max 100) | Dog is reluctant but cleaner |
| `goodboy brew` | energy += 20 | Coffee solidarity, dog stares until you share |
| `goodboy nap` | energy += 50 | Dog actually sleeps for 3 seconds, snore animation |
| `goodboy walk` | energy += 30, starts 5-min timer | Dog physically drags you away, timer shown |
| `goodboy treat` | hunger += 15, mood → excited briefly | Extra treat, used sparingly |

#### Status & inspection commands

| Command | What it shows |
|---|---|
| `goodboy status` | Full stat bars (hunger, hygiene, energy), current mood, streak, session count, dog age, last milestone |
| `goodboy mood` | Current mood, what's causing it, what would fix it |
| `goodboy age` | Dog's exact age (born_at to today), life stats: total sessions, total tokens, total errors witnessed |
| `goodboy history` | Last 10 notable events the dog reacted to (stored in `~/.goodboy-log`) |
| `goodboy diary` | Current session's reaction log — every event and quip from this session |
| `goodboy level` | Dog's "experience level" based on sessions + token count, with a fun title |

**`goodboy level` titles** (examples):

| Level | Sessions + tokens | Title |
|---|---|---|
| 1 | 0–10 sessions | Fresh Pup |
| 2 | 11–25 sessions | Eager Learner |
| 3 | 26–50 sessions | Junior Developer Dog |
| 4 | 51–100 sessions | Mid-level Mutt |
| 5 | 100–250 sessions | Senior Dev Dog |
| 6 | 250–500 sessions | Staff Engineer Dog |
| 7 | 500–1000 sessions | Principal Pupper |
| 8 | 1000+ sessions | Distinguished Fellow (Dog) |

#### Fun commands

| Command | What happens |
|---|---|
| `goodboy trick` | Dog performs a random trick — persona-specific animation with ASCII art |
| `goodboy speak` | Dog drops a random piece of wisdom, unprompted |
| `goodboy rollover` | Dog rolls over. Does nothing useful. Perfect. |
| `goodboy fetch` | Git fetch joke — dog "fetches" and reports what came back |
| `goodboy bark <message>` | Dog barks your message as a desktop notification (macOS/Linux notify) |
| `goodboy beg` | Dog begs you to write tests, do a code review, or take a break — randomly picks one |

#### Configuration commands

| Command | What it does |
|---|---|
| `goodboy switch` | Change persona — dog acts betrayed for 3 seconds |
| `goodboy guard on/off` | Enable/disable the deploy gate globally |
| `goodboy ignore <signal>` | Suppress a specific signal reaction permanently (stored in config) |
| `goodboy sniff` | Runs configured linting + type checking command, dog narrates results |
| `goodboy vet` | Full codebase health check: test coverage, lint errors, TODO count, large files, missing tests |

#### Report commands

| Command | What it produces |
|---|---|
| `goodboy report` | Weekly summary: sessions, errors, deploys, streak, biggest wins |
| `goodboy report --month` | Monthly view |

---

### Feature 4 — Sit. Stay. Deploy Gate

The deploy gate is goodboy's most utilitarian feature. It is a pre-deploy checklist that runs before any deploy action. It can be triggered manually (`goodboy sit`) or automatically when Claude Code detects a deploy command.

**Configuration** (`.goodboy.config.json` in project root, optional):

```json
{
  "deploy_triggers": ["npm run deploy", "vercel --prod", "fly deploy", "git push heroku"],
  "checks": [
    {
      "name": "tests passing",
      "command": "npm test",
      "required": true
    },
    {
      "name": "no console.log in src",
      "command": "grep -r 'console.log' src/ --include='*.ts'",
      "expect_exit": 1,
      "required": false
    },
    {
      "name": "not deploying from main directly",
      "command": "[ \"$(git branch --show-current)\" != \"main\" ]",
      "required": true
    },
    {
      "name": "no unresolved TODOs in changed files",
      "command": "git diff --name-only HEAD | xargs grep -l 'TODO\\|FIXME'",
      "expect_exit": 1,
      "required": false
    },
    {
      "name": "build passing",
      "command": "npm run build",
      "required": true
    }
  ]
}
```

**Flow:**

```
$ goodboy sit

  [Shiba — judgy sprite]

  "sit."

  running checks...

  ✓  tests passing          (2.3s)
  ✓  build passing          (8.1s)
  ✓  not on main
  ✗  console.log found in src/api.ts
  ✗  2 unresolved TODOs in changed files

  "...stay."

  2 non-required checks failed.
  deploy anyway? [y/N]: _
```

On `N`: exits 1, dog returns to normal state.
On `y`: dog reluctantly allows it, logs override in `~/.goodboy-log`.

On full pass:

```
  [Shiba — excited sprite]
  "...deploy, boy."
```

**Friday deploy special case:**

If day is Friday and all checks pass:

```
  [All personas available — shows current dog]
  "it's friday. are you sure? are you *sure*?"

  all checks passing. friday override confirmed? [y/N]: _
```

---

### Feature 5 — Persistent State & Dog Health

All state lives in `~/.goodboy` as a single JSON file. Written atomically (temp file + rename) to prevent corruption.

#### Full state schema

```json
{
  "version": 1,
  "persona": "shiba",
  "name": null,
  "hunger": 80,
  "hygiene": 60,
  "energy": 90,
  "streak": 14,
  "streak_last_date": "2026-05-03",
  "born_at": "2026-05-03T00:00:00Z",
  "last_seen": "2026-05-03T10:00:00Z",
  "terminal_protocol": "kitty",
  "token_count": 1240000,
  "session_count": 89,
  "error_count_lifetime": 412,
  "deploy_count": 23,
  "milestones_seen": ["streak_7", "session_50", "token_1m"],
  "ignored_signals": [],
  "guard_enabled": true,
  "user_timezone": "Asia/Kolkata"
}
```

#### Stat decay rules

Applied on every `PostSessionStart` based on hours elapsed since `last_seen`:

| Stat | Decay rate | Floor |
|---|---|---|
| `hunger` | -2 per hour | 0 |
| `energy` | -1 per 2 hours idle | 0 |
| `hygiene` | Time-independent; decays on bad events | 0 |

`hygiene` event decrements:
- `rm -rf` detected: -15
- Error streak 3+: -5
- Bad commit message: -3
- `console.log` found: -2
- `legacy_` file: -5

`hygiene` can only be restored by `goodboy bath`.

#### What happens when stats hit 0

- `hunger == 0`: Dog is visibly starving. Sad sprite. Every session starts with a guilt-inducing quip until fed.
- `hygiene == 0`: Dog is filthy. Disgusted at itself. Judgy sprite. Refuses to celebrate anything until bathed.
- `energy == 0`: Dog is exhausted. Sleepy sprite. All quips are half-hearted. Refuses to do tricks.

#### Neglect handling

| Gap since `last_seen` | What happens |
|---|---|
| 24–48 hours | Dog missed you. Mildly dramatic. |
| 48–72 hours | Dog is hungry and sad. Stats decayed noticeably. |
| 7 days | Dog forgot who you are. Special re-introduction flow. |
| 30+ days | Dog thought you were gone. Has opinions about that. |

---

### Feature 6 — Terminal Rendering System

goodboy supports three rendering tiers to work beautifully across all terminal environments.

#### Tier 1 — Pixel art (rich terminals)

Supported via Kitty graphics protocol and iTerm2 inline images. No external libraries — raw escape sequences only.

| Terminal | Protocol | Detection |
|---|---|---|
| Kitty | Kitty graphics protocol | `$TERM == xterm-kitty` |
| WezTerm | Kitty graphics protocol | `$TERM_PROGRAM == WezTerm` |
| Warp | Kitty graphics protocol | `$TERM_PROGRAM == WarpTerminal` |
| iTerm2 | iTerm2 inline images | `$TERM_PROGRAM == iTerm.app` |
| Ghostty | Kitty graphics protocol | `$TERM == xterm-ghostty` |

Sprites: 64×64px PNG files bundled with the package. 8 moods × 6 personas = 48 sprites total.

**Kitty protocol implementation:**

```
ESC _G a=T,f=100,q=2,c=8,r=4;<base64_png_data> ESC \
```

**iTerm2 protocol implementation:**

```
ESC ] 1337;File=inline=1;size=<bytes>;width=64px;height=64px:<base64_png_data> BEL
```

Protocol detected once on first run, cached in `~/.goodboy` as `terminal_protocol`. Can be overridden via `GOODBOY_PROTOCOL` environment variable.

#### Tier 2 — Rich ASCII art (color terminals without image support)

When pixel art is not supported but the terminal supports ANSI color codes (virtually all modern terminals), goodboy renders per-mood ASCII art colored with chalk.

Each persona has per-mood ASCII art variants (4–6 lines tall, ~20 chars wide):

**Example — Shiba moods in ASCII:**

```
happy:          proud:          alarmed:        sad:
  / \             / \              / \             / \
 (^ω^)           (ᵔᴥᵔ)ʻ          (°o°)!          (╥_╥)
 /|\_           /|\_             /|\_            /|\_
                ⭐                !!

sleepy:         judgy:          excited:        disgusted:
  / \             / \              / \ /\           / \
 (-.-) zzz       ( ._.)           (^▽^)♪          (>_<)
 /|\_           /|\_             /|\_            /|\_
```

ASCII art is colored using the persona's accent color (chalk). The surrounding output (quips, stat bars) uses the same accent color.

**`goodboy status` in rich ASCII mode:**

```
  [Shiba ASCII - proud]          SHIBA
  / \                            ━━━━━━━━━━━━━━━━━━━
 (ᵔᴥᵔ)ʻ                         Hunger   ████████░░  80%
 /|\_                            Hygiene  █████░░░░░  55%
 ⭐                              Energy   █████████░  90%

                                 Streak: 14 days 🔥
                                 Sessions: 89
                                 Age: 12 days, 4 hours
                                 Mood: proud
```

#### Tier 3 — Minimal Unicode fallback

For terminals with no color support (CI environments, SSH without forwarding, basic shells):

```
[shiba: proud] "it worked. don't ask me why. it just did."
```

Single line. Persona name + mood in brackets. Quip follows.

#### Protocol override

```bash
export GOODBOY_PROTOCOL=ascii   # force ASCII art mode
export GOODBOY_PROTOCOL=unicode # force minimal mode
export GOODBOY_PROTOCOL=kitty   # force Kitty
export GOODBOY_PROTOCOL=iterm2  # force iTerm2
export GOODBOY_PROTOCOL=off     # disable all visual output (quips still show)
```

---

### Feature 7 — Quip System

goodboy ships with 960 handwritten quip strings (8 signals × 10 quips × ... wait — 12 signals × 10 quips × 6 personas = 720 quips in v1, expandable by community).

#### Signal buckets (12 per persona)

| Signal | Triggered by |
|---|---|
| `clean_exit` | Command exits with code 0 |
| `test_pass` | Test suite passes completely |
| `rm_rf_detected` | `rm -rf` appears in command |
| `legacy_file` | `legacy_`, `old_`, `deprecated_`, `backup_` in filename |
| `todo_found` | TODO/FIXME found in changed files |
| `late_night` | Session after 10pm or before 5am |
| `error_streak_3` | 3+ consecutive non-zero exit codes |
| `deploy_done` | Deploy command completes successfully |
| `new_file` | New file created |
| `long_session` | Session running > 3 hours |
| `css_file` | CSS, SCSS, or styling file being edited |
| `auth_file` | auth, login, token, secret, jwt, oauth in filename |

#### Quip selection algorithm

```typescript
function pickQuip(persona: Persona, signal: Signal, recentQuips: string[]): string {
  const pool = persona.quips.signals[signal]
  // avoid repeating recent quips in same session
  const available = pool.filter(q => !recentQuips.slice(-5).includes(q))
  const source = available.length > 0 ? available : pool
  return source[Math.floor(Math.random() * source.length)]
}
```

#### Milestone quips

Milestone quips are stored separately per persona in `quips/[name].milestones.json` — one quip per milestone key. These are the most important quips to get right as they're seen infrequently and must land.

```json
{
  "birthday": "...",
  "monthly_anniversary": "...",
  "streak_7": "...",
  "streak_30": "...",
  "streak_100": "...",
  "session_100": "...",
  "session_500": "...",
  "token_1m": "...",
  "neglected_7d": "...",
  "neglected_30d": "...",
  "friday_deploy": "...",
  "git_push_force": "...",
  "sudo_detected": "..."
}
```

---

### Feature 8 — Session Lifecycle Hooks

Three hook points only. This is intentional — fewer appearances = more impact per appearance.

#### PostSessionStart

1. Read `~/.goodboy`, apply stat decay since `last_seen`
2. Update `last_seen`, increment `session_count`, update streak
3. Check milestones in priority order (birthday first, then anniversary, then streak)
4. If terminal_protocol not cached: detect and cache
5. Derive current mood
6. Select signal: check time of day, neglect gap, then mood-based greeting
7. Render sprite/ASCII + quip + optional milestone celebration
8. Write updated state atomically

#### PostToolUse (filtered)

Fires after every tool call but processes only when:
- Exit code is non-zero (errors only), OR
- Command matches a known signal pattern (git push, rm -rf, test commands, etc.)

Session-scoped state (not persisted):
- `consecutive_errors: number` — reset on clean exit
- `session_signals_fired: Signal[]` — prevent same signal firing twice per session
- `files_touched: string[]` — for session end summary

At error streak 3:
1. Render alarmed sprite + `error_streak_3` quip
2. Decrement hygiene by 5
3. Log event to `~/.goodboy-log`

#### PreSessionEnd

1. Compute session summary from session-scoped state
2. Determine strongest signal from session (priority order)
3. Derive final mood
4. Render sprite + quip + one-line session summary
5. Log session to `~/.goodboy-log` (capped at 100 entries)
6. Write final state

**Session end output example:**

```
  [Debug — proud sprite]

  "session complete. 3 bugs eliminated. 47 lines written.
   1 suspicious stash. running total: impressive."

  ─────────────────────────────────────
  session: 2h 14m  |  errors: 3  |  files: 12  |  streak: 14 days
```

---

### Feature 9 — `goodboy vet` — Codebase Health Check

A full health scan narrated by the dog. Runs a series of checks and produces a report.

```
$ goodboy vet

  [Byte — focused]
  "running diagnostics."

  ✓  47 test files found
  ✓  coverage: 84%
  ⚠  eslint: 3 warnings
  ✗  12 TODO comments in src/
  ✗  2 files > 500 lines: src/api.ts, src/utils.ts
  ✗  4 console.log statements in src/

  "diagnosis: functional. not impressed, but functional."

  health score: 71/100
```

Health score formula: starts at 100, deductions per finding. Persona narrates differently based on score range.

---

### Feature 10 — `goodboy report`

Weekly/monthly session summary. Pulls from `~/.goodboy-log`.

```
$ goodboy report

  [Shiba — proud]
  "the numbers. since you asked."

  ─── week of Apr 28 – May 3 ────────────────────
  sessions:     12
  total time:   18h 32m
  errors:       47
  deploys:      3 (1 override on Friday — noted)
  streak:       14 days
  best day:     Wednesday (4 sessions, 0 friday deploys)

  milestone:    session #89 — "getting there."
  ────────────────────────────────────────────────
```

---

## V2 Features (Post-launch)

| Feature | Description |
|---|---|
| **AI quips (Haiku)** | One Haiku API call at session end. Sends metadata JSON only — no code. User brings own key. Generates one contextual quip based on session shape. |
| **Dog aging** | Sprite stages: puppy (0–30 days), adult (30–365 days), senior (365+ days). Each stage has slightly different proportions per persona. |
| **Seasonal sprites** | Halloween, holiday, and summer variants per persona. Community contributed. |
| **PR merge wag** | Optional GitHub webhook integration. Dog wags when your PR merges. |
| **Community quip packs** | Third-party quip files installable alongside built-in ones. |
| **Multi-project support** | Different persona per project directory (stored in `.goodboy.local` per project). |
| **goodboy team** | Shared dog state for pair programming sessions. |
| **Streak insurance** | Weekend mode — streak doesn't break on Saturday/Sunday if configured. |

---

## ASCII Fallback — Full Specification

goodboy must work well on basic terminals. The ASCII fallback is not an afterthought.

### Per-persona ASCII art sets

Each persona has 8 mood variants in ASCII (stored in `src/ascii/[persona].ts`). Colored with chalk using persona accent color. Designed to be recognizable at 6 lines tall × 20 chars wide.

### Example — Debug (Dachshund) all 8 moods

```
happy:        proud:        alarmed:      sad:
  __           __             __            __
=( °ᴥ°)=    =( ᴥ°)≡☆      =(°O°)=!      =( °_°)=
  ▔▔            ▔▔             ▔▔            ▔▔
                               !!

sleepy:       judgy:        excited:      disgusted:
  __            __             __            __
=(-.-) Zzz   =( -_°)=       =(^ᴥ^)=♪♪    =(>_<)=
  ▔▔            ▔▔             ▔▔            ▔▔
```

Long body hint for dachshund (=====) makes it visually distinct from other personas in ASCII mode.

### Stat bars in ASCII mode

```
Hunger   [████████░░] 80%
Hygiene  [█████░░░░░] 55%
Energy   [█████████░] 90%
```

### Quip display in ASCII mode

Quip appears in a minimal speech bubble to the right of the ASCII art:

```
  __          ┌────────────────────────────────────────┐
=( °ᴥ°)=  → │ "bug eliminated. that's 1,847. noted."  │
  ▔▔          └────────────────────────────────────────┘
```

---

## Open Source Strategy

- **MIT license** — fully open
- **Quip PRs** are the primary contribution path — no code required, enforced quality bar on voice
- **Signal bucket PRs** — community can propose new triggers (with 10 quips per persona)
- **Sprite packs** — seasonal and alternative style packs are welcomed, coordinated via issues
- **Persona voice guide** in CONTRIBUTING.md ensures quips stay on-character
- **No quip filler policy** — "good job!" type quips are rejected; every quip needs a point of view

---

## Constraints & Requirements

| Constraint | Requirement |
|---|---|
| Zero mandatory API calls | v1 works entirely offline |
| Zero telemetry | No data leaves the machine |
| Node 18+ | Required for ESM and built-in fetch |
| Cross-platform | macOS, Linux, Windows (WSL) tested |
| Package size | < 5MB total including all sprites |
| Startup time | < 200ms for any command |
| State writes | Atomic (temp file + rename) |
| No global side effects | State only in `~/.goodboy` and `~/.goodboy-log` |
