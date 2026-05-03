#!/usr/bin/env python3
"""Slice sprite sheet + extract hero dogs from pick-companion image."""
from PIL import Image
import os

OUT = "sprites"

# ─── SPRITE SHEET (6 personas × 8 moods, 1536×1024) ─────────────────
# Layout: 3 columns × 2 rows of panels, each panel 512×512
# Within each panel: header ~92px, then 4 rows of 2 sprites
# Row starts measured from pixel scan: 92, 204, 308, 412
PERSONAS  = ["goldie", "byte", "shiba", "pugsy", "nova", "debug"]
MOODS     = ["happy", "proud", "alarmed", "sad", "sleepy", "judgy", "excited", "disgusted"]
PANEL_W   = 512
PANEL_H   = 512
SHEET_COLS = 3
ROW_STARTS = [92, 204, 308, 412]   # y-offsets within panel where each sprite row begins
ROW_H     = 100                     # take 100px per row (sprite + some label)
SPRITE_H  = 82                      # trim to 82px removing label text at bottom
CELL_W    = 242                     # (512 - 2×14) / 2 — keep full width
PAD_X     = 14

sheet = Image.open("sprites/sprite-sheet.png")

for pi, persona in enumerate(PERSONAS):
    panel_row = pi // SHEET_COLS
    panel_col = pi % SHEET_COLS
    px = panel_col * PANEL_W
    py = panel_row * PANEL_H

    out_dir = os.path.join(OUT, persona)
    os.makedirs(out_dir, exist_ok=True)

    mood_idx = 0
    for ri, row_y in enumerate(ROW_STARTS):
        for ci in range(2):  # 2 columns per row
            mood = MOODS[mood_idx]
            x = px + PAD_X + ci * CELL_W
            y = py + row_y
            # Extract sprite cell, trim label from bottom
            cell = sheet.crop((x, y, x + CELL_W, y + SPRITE_H))
            cell.save(os.path.join(out_dir, f"{mood}.png"))
            mood_idx += 1

    print(f"  {persona}: 8 sprites ({CELL_W}×{SPRITE_H}px)")

# ─── HERO DOGS from pick-companion (1536×1024) ────────────────────────
# 3 columns × 2 rows, dog image centered in upper portion of each cell
# Canvas: 1536×1024. Header "pick your companion." ~90px top.
# Then 2 rows of dog cards, each ~467px tall.
# Dog appears centered, roughly top 65% of card = image area.
companion = Image.open("sprites/pick-companion.png")
COMP_W, COMP_H = companion.size
COMP_HEADER = 90
card_w = COMP_W // 3          # 512
card_h = (COMP_H - COMP_HEADER) // 2  # 467

for pi, persona in enumerate(PERSONAS):
    row = pi // 3
    col = pi % 3
    cx = col * card_w
    cy = COMP_HEADER + row * card_h
    # Take the top 60% of the card (the dog image portion, before the text labels)
    dog_h = int(card_h * 0.58)
    dog = companion.crop((cx, cy, cx + card_w, cy + dog_h))
    out_path = os.path.join(OUT, persona, "hero.png")
    dog.save(out_path)

print(f"\n  hero portraits: {card_w}×{int(card_h*0.58)}px from pick-companion")
print(f"\nDone. sprites/<persona>/hero.png + 8 mood sprites each.")
