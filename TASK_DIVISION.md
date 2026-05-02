# Task Division — Claude, Jigar, ChatGPT

Who does what and in what order.

---

## Phase 1 — Foundation (Claude does this now)

| Task | Owner | Status |
|---|---|---|
| PRD.md | Claude | ✓ Done |
| TECHNICAL_DESIGN.md | Claude | ✓ Done |
| CONTRIBUTING.md | Claude | ✓ Done |
| README.md | Claude | ✓ Done |
| chatgpt-help.md | Claude | ✓ Done |
| TASK_DIVISION.md | Claude | ✓ Done |
| Git init + push to remote | Jigar | → Next |

---

## Phase 2 — Asset generation (Jigar + ChatGPT)

Jigar runs prompts from `chatgpt-help.md` in order and collects outputs.

| Task | Owner | Deliverable |
|---|---|---|
| Task 1: Mood sprites × 6 | Jigar → ChatGPT | 6 sprite sheet images |
| Task 2: quips.json × 6 | Jigar → ChatGPT | 6 JSON files |
| Task 3: README hero banner | Jigar → ChatGPT | `hero.png` |
| Task 4: First-run mockup | Jigar → ChatGPT | `first-run-mockup.png` |
| Task 5: Deploy gate mockup | Jigar → ChatGPT | `deploy-gate-mockup.png` |

After collecting: drop everything into the Claude Code session. Claude will review quips for voice quality, slice sprites if needed, and place all files in the right locations.

---

## Phase 3 — Implementation (Claude)

Once Phase 2 assets are in hand, Claude implements in this order:

| Task | Depends on |
|---|---|
| package.json + tsconfig.json | Nothing |
| `src/state.ts` — state read/write/decay | Nothing |
| `src/renderer.ts` — terminal detection + image output | Sprites from Phase 2 |
| `src/quips.ts` — signal detection + quip selection | quips.json from Phase 2 |
| `src/personas/index.ts` — persona registry | Sprites + quips |
| `src/hooks/session-start.ts` | State, renderer, quips |
| `src/hooks/tool-use.ts` | State, quips |
| `src/hooks/session-end.ts` | State, renderer, quips |
| `src/commands/` — all 8 commands | State, renderer |
| `src/milestones.ts` — birthday/streak/token | State |
| `src/index.ts` — MCP server wiring | Everything above |
| Deploy gate (`goodboy sit`) | State, renderer, quips |
| First-run flow (`goodboy init`) | Everything |

---

## Phase 4 — Polish + launch (all three)

| Task | Owner |
|---|---|
| Review quip voice quality | Jigar + Claude |
| Test on Warp, iTerm2, terminal (unicode fallback) | Jigar |
| Update README with real screenshots | Jigar (screenshots) + Claude (markdown) |
| npm publish as `goodboy` | Jigar |
| GitHub repo topics, description, social preview | Jigar |
| First tweet / launch post | Jigar |
| Watch for first quip PRs | Jigar + Claude |

---

## Right now — what Jigar needs to do

1. Initialize the git repo and push to `git@github.com:jigar-joshi-nirmata/goodboy.git`
2. Open `chatgpt-help.md` and start with **Task 1** (Goldie mood sprites first)
3. Paste ChatGPT outputs back into this Claude Code session

That's it. Claude handles everything else from there.
