# Contributing to goodboy

Thank you. Seriously. goodboy is open source because the community will make it weirder, funnier, and better than any one person could alone — especially the quips.

---

## The easiest PR you'll ever open

**Add quips.**

Each persona has a `quips/[name].json` file with 120 quips across 12 signal buckets. If you can write a funny one-liner in Shiba's voice, open a PR. No code required. No setup required. Just edit a JSON file.

### How to write a good quip

**Stay in character.** Each dog has a distinct voice. Before writing, read 10 existing quips for that persona to calibrate.

| Persona | Voice to match |
|---|---|
| **Goldie** | Warm, excitable, uses exclamation marks, celebrates everything |
| **Byte** | Precise, slightly smug, data-driven, occasionally condescending |
| **Shiba** | Dry wit, backhanded compliments, speaks rarely but lands hard |
| **Pugsy** | Minimal words, unbothered, somehow always right |
| **Nova** | Loud, fast, obsessed with performance, everything is a sprint |
| **Debug** | Technical, keeps count, never forgets, dry humor |

**Example — the same signal, six voices:**

Signal: `rm_rf_detected`

```
Goldie:  "oh no!! it's okay!! we can rebuild!! probably!!"
Byte:    "entropy increased. irreversible. noted."
Shiba:   "bold. chaotic. historically terrible decision."
Pugsy:   "again."
Nova:    "FULL SEND. NO SURVIVORS. INCREDIBLE."
Debug:   "deletion event logged. that's 7 this month."
```

**Quip rules:**
- Max 80 characters (it's a terminal line)
- No profanity — keep it broadly accessible
- No repeated phrasing within the same bucket
- Reference developer situations, not generic dog behavior

### Signal buckets

| Signal | Triggered when |
|---|---|
| `clean_exit` | Command exits with code 0 |
| `test_pass` | Test suite passes |
| `rm_rf_detected` | `rm -rf` appears in a command |
| `legacy_file` | Filename contains `legacy_`, `old_`, `deprecated_` |
| `todo_found` | File contains TODO comments |
| `late_night` | Session after 10pm or before 4am |
| `error_streak_3` | 3+ consecutive errors in a session |
| `deploy_done` | Deploy command completes successfully |
| `new_file` | A new file is created |
| `long_session` | Session running over 3 hours |
| `css_file` | CSS or SCSS file being edited |
| `auth_file` | Filename contains `auth`, `login`, `token`, `secret` |

---

## Code contributions

### Setup

```bash
git clone https://github.com/jigar-joshi-nirmata/goodboy
cd goodboy
npm install
npm run dev
```

`npm run dev` runs the MCP server in watch mode with ts-node.

### Project structure

See [TECHNICAL_DESIGN.md](TECHNICAL_DESIGN.md) for full architecture. Key folders:

- `quips/` — one JSON per persona, no code required to contribute here
- `src/commands/` — each CLI command is its own file
- `src/hooks/` — session lifecycle handlers (start, tool-use, end)
- `sprites/` — PNG files, 64×64px, one per persona per mood

### Adding a new CLI command

1. Create `src/commands/yourcommand.ts`
2. Export a handler function that takes state and returns updated state + output string
3. Register it in `src/index.ts` as an MCP tool
4. Update the README command table
5. If it mutates a stat, reflect it in `goodboy status` output

### Adding a new signal bucket

1. Add the signal key to `Signal` type in `src/personas/types.ts`
2. Add detection logic in `src/quips.ts` `detectSignal()`
3. Add 10 quips per persona in each `quips/[name].json`
4. Document it in the signal table in CONTRIBUTING.md

### Tests

```bash
npm test
```

Tests cover: state read/write, stat decay, mood derivation, signal detection, quip selection, milestone logic. Terminal rendering is tested with protocol mock.

---

## Sprite contributions

We use **64×64px pixel art PNG sprites** on a dark background (#0d1117).

Each persona needs exactly 6 mood sprites: `happy`, `proud`, `alarmed`, `sad`, `sleepy`, `judgy`.

If you want to contribute:
- **Seasonal variants** (Halloween, holiday, etc.) — open an issue first to coordinate, we'll create a `sprites/[persona]/seasonal/` folder
- **Alternative style packs** — same moods, different art style — open an issue, we're open to it
- **New personas** — big addition, open a discussion first

Sprites should be visually consistent with the existing set. If you're working from scratch, see the character reference sheets in `assets/references/`.

---

## Pull request process

1. Fork the repo
2. Create a branch: `git checkout -b quips/shiba-auth-file` or `feat/new-command`
3. Make your change
4. Run `npm test`
5. Open a PR with a clear title and description
6. For quip PRs — paste 3–5 of your best quips in the PR description so reviewers can evaluate voice without reading the full file

---

## What makes a quip PR get merged fast

- Voice is unmistakably on-character
- At least 5 of the 10 quips make the reviewer actually laugh
- No filler ("good job!", "you did it!") — every quip should have a point of view

---

## Issues

- **Bug?** Open an issue with: OS, terminal type, Node version, what you ran, what happened
- **Feature idea?** Open a discussion first — goodboy should stay small and focused
- **New signal bucket idea?** These are great — open an issue with example scenarios

---

## Code of conduct

Be kind. goodboy is a fun project. Keep it that way.
