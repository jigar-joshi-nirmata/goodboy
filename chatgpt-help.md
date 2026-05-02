# ChatGPT Help — Asset Generation Guide

This document contains exact prompts for ChatGPT (GPT-4o with image generation). Run each task in order and paste outputs back. Each task specifies exactly what to hand back.

---

## TASK 1 — Mood sprite sheets (run 6 times, once per dog)

We have the 6 base character designs. Now we need 6 mood variants for each dog. Run this prompt **once per persona**, replacing the bracketed values.

**Prompt template:**

```
I have a pixel art dog character called [NAME] — [DESCRIPTION]. 

Generate a sprite sheet showing 6 mood variants of this exact character. Requirements:
- Same base character: same breed, same colors, same accessories
- 64×64px pixel art per sprite, dark background (#0d1117)
- Arranged in a 2×4 grid (2 columns, 4 rows)
- Label underneath each sprite in small pixel-style text

The 8 moods (in order, left to right, top to bottom — arrange as 2 columns × 4 rows):
1. happy — tail up, bright eyes, slight open-mouth smile, relaxed posture
2. proud — chest out, sitting tall, eyes half-closed smugly, optional sparkle
3. alarmed — eyes wide open, ears fully raised, body rigid, red ! indicator
4. sad — ears drooping, eyes downcast, slightly slumped, lower energy
5. sleepy — eyes half-closed, head tilted, ZZZ floating nearby, lying or slumped
6. judgy — eyes narrowed, head slightly turned, unimpressed side-eye, dismissive posture
7. excited — full zoomies energy, both front paws raised or mid-jump, huge eyes, sparkles, pure joy
8. disgusted — nose wrinkled, body recoiling slightly, strong side-eye, looking away from something awful

IMPORTANT: excited must look clearly different from happy — more energetic, more expressive, body in motion not sitting still.
IMPORTANT: disgusted must look clearly different from judgy — active revulsion not passive disapproval.

Keep the pixel art style consistent with a clean, modern indie game aesthetic. Dark background throughout.
```

**Run for each persona:**

| # | NAME | DESCRIPTION |
|---|---|---|
| 1 | Goldie | Golden Retriever with a red bandana, warm golden fur, friendly open-mouth smile, energetic posture |
| 2 | Byte | Border Collie with a blue collar and silver tag, black and white coat, alert intelligent expression |
| 3 | Shiba | Shiba Inu with a green bandana, orange and white fur, independent slightly aloof expression |
| 4 | Pugsy | Pug with a purple collar and gold tag, fawn coat, lazy heavy-lidded expression, stocky body |
| 5 | Nova | Siberian Husky with a blue collar, grey and white coat, blue eyes, excited open-mouth expression |
| 6 | Debug | Dachshund with a gold collar, brown and black coat, long body, serious determined expression |

**What to give back:** 6 images. One image per dog showing the 6-mood grid.

---

## TASK 2 — quips.json files (run 6 times, once per persona)

**Prompt template:**

```
Write a quips.json file for a terminal dog companion.

Dog name: [NAME]
Personality: [PERSONALITY]
Tone guide: [TONE]

The JSON must follow this exact schema — 12 signal keys, exactly 10 quips each (120 total):

{
  "signals": {
    "clean_exit": [],
    "test_pass": [],
    "rm_rf_detected": [],
    "legacy_file": [],
    "todo_found": [],
    "late_night": [],
    "error_streak_3": [],
    "deploy_done": [],
    "new_file": [],
    "long_session": [],
    "css_file": [],
    "auth_file": []
  }
}

Rules:
- Max 80 characters per quip string
- Every quip must be unmistakably in this dog's voice
- No repeated phrasing within the same bucket
- No profanity
- Quips reference developer/coding situations — not generic dog behavior
- Do not explain the JSON or add comments — output raw valid JSON only
```

**Run for each persona:**

| # | NAME | PERSONALITY | TONE |
|---|---|---|---|
| 1 | Goldie | Enthusiastic optimist who celebrates every win, no matter how small | Warm, excitable, uses exclamation marks liberally, genuinely happy for you even when things go wrong. Example: "you did it!! i knew you could!! good human!!" |
| 2 | Byte | Focused and clever, keeps precise track of everything | Precise, slightly smug, data-driven. Occasionally condescending but never cruel. Example: "exit code 0. as expected. moving on." |
| 3 | Shiba | Sassy and independent, roasts your code with dry wit | Minimal words, backhanded compliments, speaks rarely but lands hard. Never outright mean but definitely judging. Example: "it worked. don't ask me why. it just did." |
| 4 | Pugsy | Lazy genius who ships when you least expect it | Fewest possible words, unbothered by everything, surprisingly wise. Example: "shipped. going back to sleep." |
| 5 | Nova | Energetic overachiever obsessed with clean, fast code | Loud, enthusiastic, everything is a sprint, loves metrics and speed. Example: "TESTS PASSED. SPEED: MAXIMUM. LET'S GO." |
| 6 | Debug | Relentless bug hunter who tracks everything by number | Technical, keeps a running count of everything, dry humor, never forgets. Example: "bug eliminated. running total: 1,847. you're welcome." |

**What to give back:** 6 JSON files named `goldie.json`, `byte.json`, `shiba.json`, `pugsy.json`, `nova.json`, `debug.json`.

---

## TASK 3 — README hero banner (run once)

**Prompt:**

```
Create a hero banner image for an open source developer tool called "goodboy".

Specifications:
- Dimensions: 1280×400px (wide banner format)
- Style: pixel art, dark background (#0d1117)
- Show all 6 dog characters in a row, evenly spaced, each in their happy pose:
  Goldie (golden retriever, red bandana)
  Byte (border collie, blue collar)
  Shiba (shiba inu, green bandana)
  Pugsy (pug, purple collar)
  Nova (husky, blue collar)
  Debug (dachshund, gold collar)
- Above the dogs: the text "goodboy" in a clean pixel font, white or light colored, large
- Below the dogs: subtitle "a tamagotchi for your terminal" in smaller pixel font, muted color
- Subtle terminal/code aesthetic in the background (faint grid, faint green scanline, or soft glow)
- No border, blends into dark GitHub README background

Output as a single wide PNG image.
```

**What to give back:** 1 image file named `hero.png`.

---

## TASK 4 — First-run selection screen mockup (run once)

**Prompt:**

```
Design a terminal UI mockup for a first-run dog selection screen for a developer tool.

Requirements:
- Looks like real terminal output — dark background (#1e1e1e), monospace font
- Title at top: "pick your companion." in dim white
- 2×3 grid layout showing all 6 pixel art dogs
- Under each dog: name in a distinct accent color, one-line personality description in dim text
  - Goldie (yellow): "enthusiastic optimist. celebrates everything."
  - Byte (blue): "focused and clever. keeps you on track."
  - Shiba (orange): "sassy and independent. roasts your code."
  - Pugsy (purple): "lazy genius. ships when you least expect it."
  - Nova (cyan): "energetic overachiever. loves fast code."
  - Debug (green): "sniffing out bugs. keeping score."
- At the bottom: a terminal prompt line "→ enter dog name: _" with blinking cursor feel
- Clean layout, generous spacing, feels like a polished CLI tool

Output as a single image, approximately 900×600px.
```

**What to give back:** 1 image file named `first-run-mockup.png`.

---

## TASK 5 — Sit. Stay. Deploy gate mockup (run once)

**Prompt:**

```
Design a terminal UI mockup for a pre-deploy checklist from a developer tool called "goodboy".

Requirements:
- Dark terminal background (#1e1e1e)
- Show Shiba (Shiba Inu pixel art, orange/white, green bandana) on the left side
- Terminal output on the right showing:

  [Shiba pixel art]  "sit."

    ✓  tests passing
    ✓  no console.log left behind
    ✓  branch is not 'main'
    ✗  3 unresolved TODOs in changed files

  "...stay."

  checks failed. deploy anyway? [y/N] _

- Green checkmarks for passing, red ✗ for failing
- The dog's speech appears as a dimly boxed quip next to the sprite
- Monospace font throughout, clean terminal aesthetic
- Width: approximately 800×400px

Output as a single image.
```

**What to give back:** 1 image file named `deploy-gate-mockup.png`.

---

## Summary — what to collect and where to put it

| Asset | File name | Location in repo |
|---|---|---|
| Goldie mood sprites | `goldie-moods.png` | Reference only → slice into `sprites/goldie/` |
| Byte mood sprites | `byte-moods.png` | Reference only → slice into `sprites/byte/` |
| Shiba mood sprites | `shiba-moods.png` | Reference only → slice into `sprites/shiba/` |
| Pugsy mood sprites | `pugsy-moods.png` | Reference only → slice into `sprites/pugsy/` |
| Nova mood sprites | `nova-moods.png` | Reference only → slice into `sprites/nova/` |
| Debug mood sprites | `debug-moods.png` | Reference only → slice into `sprites/debug/` |
| goldie.json quips | `goldie.json` | `quips/goldie.json` |
| byte.json quips | `byte.json` | `quips/byte.json` |
| shiba.json quips | `shiba.json` | `quips/shiba.json` |
| pugsy.json quips | `pugsy.json` | `quips/pugsy.json` |
| nova.json quips | `nova.json` | `quips/nova.json` |
| debug.json quips | `debug.json` | `quips/debug.json` |
| README hero | `hero.png` | `assets/hero.png` |
| First-run mockup | `first-run-mockup.png` | `assets/first-run-mockup.png` |
| Deploy gate mockup | `deploy-gate-mockup.png` | `assets/deploy-gate-mockup.png` |

---

## Notes for slicing sprites

The mood sprite sheets (Task 1) will come back as a single image with 8 sprites in a 2×4 grid. Each individual sprite needs to be cropped to 64×64px and saved separately. Names must match exactly:

```
sprites/[persona]/happy.png
sprites/[persona]/proud.png
sprites/[persona]/alarmed.png
sprites/[persona]/sad.png
sprites/[persona]/sleepy.png
sprites/[persona]/judgy.png
sprites/[persona]/excited.png
sprites/[persona]/disgusted.png
```

If you need help slicing, drop the sheet images into the Claude Code session and ask me to slice them.
