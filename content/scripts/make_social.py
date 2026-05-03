#!/usr/bin/env python3
"""
goodboy-claude — marketing static assets + panic loop GIF

Outputs (all in content/marketing/):
  panic-loop.gif        4s rm-rf moment loop
  social-card.png       1200x630 — GitHub/Twitter OG
  ph-thumb.png          240x240  — Product Hunt icon
  ph-gallery-1.png      1270x760 — split-screen personality card
  ph-gallery-2.png      1270x760 — deploy gate feature card
  ph-gallery-3.png      1270x760 — session summary + AI quips card
"""
from PIL import Image, ImageDraw, ImageFont, ImageChops, ImageFilter
import subprocess, os, math

ROOT    = os.path.join(os.path.dirname(__file__), "../..")
SPR     = os.path.join(ROOT, "sprites")
OUT_DIR = os.path.join(ROOT, "content", "marketing")
TMP     = "/tmp/gb_panic"

MONO  = "/System/Library/Fonts/SFNSMono.ttf"
BG    = (13, 13, 20)
FG    = (240, 240, 235)
MUTED = (75, 80, 105)
GREEN = (80, 250, 123)
RED   = (255, 65, 65)
DIM   = (28, 30, 42)

COLORS = {
    "goldie": (241, 196,  15),
    "byte":   ( 52, 152, 219),
    "shiba":  (230, 126,  34),
    "pugsy":  (155,  89, 182),
    "nova":   (200, 210, 220),
    "debug":  ( 46, 204, 113),
}
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(TMP, exist_ok=True)

def fnt(size):
    try: return ImageFont.truetype(MONO, size)
    except: return ImageFont.load_default()

def eo(t): return 1 - (1 - max(0.0, min(1.0, t))) ** 3
def ph(t, a, b): return max(0.0, min(1.0, (t - a) / max(b - a, 0.001)))
def tw(draw, text, f):
    bb = draw.textbbox((0, 0), text, font=f)
    return bb[2] - bb[0]

def blank(w, h, color=BG): return Image.new("RGB", (w, h), color)

def load_spr(persona, mood, scale=5):
    for ext in ("jpg", "png"):
        p = os.path.join(SPR, persona, f"{mood}.{ext}")
        if os.path.exists(p):
            img = Image.open(p).convert("RGBA")
            nw, nh = img.size[0] * scale, img.size[1] * scale
            img = img.resize((nw, nh), Image.NEAREST)
            r, g, b, a = img.split()
            mx = ImageChops.lighter(ImageChops.lighter(r, g), b)
            mask = mx.point(lambda p: 255 if p > 40 else 0)
            img.putalpha(mask)
            return img
    return None

def paste_spr(base_img, sprite, cx, cy, alpha=1.0):
    if not sprite: return
    if alpha < 1.0:
        r, g, b, a = sprite.split()
        a = a.point(lambda p: int(p * alpha))
        sprite = Image.merge("RGBA", (r, g, b, a))
    x, y = cx - sprite.width // 2, cy - sprite.height // 2
    base_img.paste(sprite, (x, y), sprite)

def add_glow(frame, cx, cy, color, radius=200, strength=0.35):
    g = blank(frame.width, frame.height)
    gd = ImageDraw.Draw(g)
    r2, g2, b2 = color[:3]
    for rad in range(radius, 0, -8):
        gd.ellipse([cx - rad, cy - rad * 3 // 4, cx + rad, cy + rad * 3 // 4],
                   fill=(r2, g2, b2))
    g = g.filter(ImageFilter.GaussianBlur(radius // 4))
    merged = Image.blend(frame.convert("RGB"), g, 0.28)
    frame.paste(merged)

def bubble(draw, text, cx, y, color, size=26, max_w=480):
    f = fnt(size)
    words = text.split()
    lines, cur = [], ""
    for word in words:
        test = (cur + " " + word).strip()
        if tw(draw, test, f) > max_w - 36:
            if cur: lines.append(cur)
            cur = word
        else: cur = test
    if cur: lines.append(cur)
    lh = size + 10
    bw = max(tw(draw, l, f) for l in lines) + 36
    bh = len(lines) * lh + 24
    bx = cx - bw // 2
    r2, g2, b2 = color[:3]
    draw.rounded_rectangle([bx, y, bx + bw, y + bh], radius=10,
                            fill=(r2, g2, b2, 18), outline=(r2, g2, b2, 200), width=2)
    for i, line in enumerate(lines):
        lw2 = tw(draw, line, f)
        draw.text((cx - lw2 // 2, y + 12 + i * lh), line, font=f, fill=FG)
    return y + bh

# ═══════════════════════════════════════════════════════════════════════
# 1. PANIC LOOP GIF — rm-rf moment, 4s loop
# ═══════════════════════════════════════════════════════════════════════

print("Rendering panic loop...")
W, H = 960, 540
FPS  = 24
NFRAMES = FPS * 4
CMD = "$ rm -rf /"

for i in range(NFRAMES):
    t = i / (NFRAMES - 1)
    fr = blank(W, H)
    draw = ImageDraw.Draw(fr)

    if t < 0.45:
        # Typing phase
        n = int(ph(t, 0.0, 0.38) * len(CMD))
        blink = (t >= 0.38) or (int(t * 7) % 2 == 0)
        display = CMD[:n] + ("▋" if blink else "")
        f = fnt(42)
        full_w = tw(draw, CMD, f)
        tx, ty = (W - full_w) // 2, H // 2 - 26
        draw.text((tx, ty), display, font=f, fill=(120, 220, 120))
        draw.text((tx, ty - 40), "~  $", font=fnt(18), fill=MUTED)
    else:
        # SLAM
        slam_t = eo(ph(t, 0.45, 0.62))
        add_glow(fr, W // 2, H // 2, RED, radius=300, strength=0.55 * slam_t)
        if slam_t < 1.0:
            red_over = blank(W, H, (65, 0, 0))
            base2 = fr.convert("RGBA")
            ov = red_over.convert("RGBA")
            r2, g2, b2, a2 = ov.split()
            a2 = a2.point(lambda p: int(p * 0.22 * (1 - slam_t)))
            ov = Image.merge("RGBA", (r2, g2, b2, a2))
            base2.paste(ov, (0, 0), ov)
            fr = base2.convert("RGB")
        sp = load_spr("goldie", "alarmed", scale=5)
        if sp:
            da = eo(ph(t, 0.45, 0.57))
            paste_spr(fr, sp, W // 2, H // 2 + 20, da)
        p_q = eo(ph(t, 0.60, 0.80))
        if p_q > 0.02:
            d = ImageDraw.Draw(fr)
            f = fnt(22)
            txt = "WAIT WAIT WAIT THAT IS THE WHOLE FILESYSTEM!!"
            lw2 = tw(d, txt, f)
            r2, g2, b2 = COLORS["goldie"]
            d.rounded_rectangle([(W//2 - lw2//2 - 18, 44),
                                  (W//2 + lw2//2 + 18, 88)],
                                 radius=8, fill=(r2, g2, b2, 18),
                                 outline=(r2, g2, b2, 200), width=2)
            d.text(((W - lw2) // 2, 52), txt, font=f, fill=FG)

    fr.save(os.path.join(TMP, f"{i:05d}.png"))

panic_gif = os.path.join(OUT_DIR, "panic-loop.gif")
subprocess.run([
    "ffmpeg", "-y", "-framerate", str(FPS), "-i", f"{TMP}/%05d.png",
    "-vf", ("fps=20,scale=960:-1:flags=lanczos,"
            "split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse"),
    "-loop", "0", panic_gif
], check=True, capture_output=True)
print(f"  panic-loop.gif  {os.path.getsize(panic_gif)//1024}KB")

# ═══════════════════════════════════════════════════════════════════════
# 2. SOCIAL CARD — 1200x630
# ═══════════════════════════════════════════════════════════════════════

print("Rendering social card...")
W, H = 1200, 630
fr = blank(W, H)
draw = ImageDraw.Draw(fr)

# Subtle dot grid bg
for gy in range(0, H, 28):
    for gx in range(0, W, 28):
        draw.ellipse([gx, gy, gx + 2, gy + 2], fill=(28, 30, 44))

# Left side: headline
f_big = fnt(52)
lines = ["your terminal is", "emotionally", "unavailable."]
y_start = 140
for i, line in enumerate(lines):
    col = FG if i < 2 else COLORS["goldie"]
    draw.text((72, y_start + i * 68), line, font=f_big, fill=col)

# Sub tagline
draw.text((72, y_start + 3 * 68 + 18), "goodboy-claude", font=fnt(28),
          fill=MUTED)
draw.text((72, y_start + 3 * 68 + 58), "emotional middleware for developers", font=fnt(22),
          fill=MUTED)

# npm install line
npm_txt = "npm install -g @terminaldogs/goodboy-claude"
f_npm = fnt(22)
npm_w = tw(draw, npm_txt, f_npm)
npm_x, npm_y = 72, H - 90
draw.rounded_rectangle([npm_x - 12, npm_y - 8, npm_x + npm_w + 12, npm_y + 36],
                        radius=8, fill=DIM)
draw.text((npm_x, npm_y), npm_txt, font=f_npm, fill=GREEN)

# Right side: 6 dogs in 2x3 grid
PERSONAS = [("goldie","happy"), ("byte","happy"), ("shiba","happy"),
            ("pugsy","happy"), ("nova","happy"), ("debug","happy")]
GCols, GRows = 3, 2
cell_w, cell_h = 200, 220
gx0 = W - GCols * cell_w - 40
gy0 = 40
for idx, (persona, mood) in enumerate(PERSONAS):
    col_i = idx % GCols
    row_i = idx // GCols
    cx = gx0 + col_i * cell_w + cell_w // 2
    cy = gy0 + row_i * cell_h + cell_h // 2 - 20
    sp = load_spr(persona, mood, scale=4)
    if sp:
        paste_spr(fr, sp, cx, cy)
    color = COLORS[persona]
    f_nm = fnt(17)
    nw2 = tw(draw, persona, f_nm)
    draw.text((cx - nw2 // 2, cy + 65), persona, font=f_nm, fill=color)

# Accent bar at top
draw.rectangle([(0, 0), (W, 5)], fill=COLORS["goldie"])

path = os.path.join(OUT_DIR, "social-card.png")
fr.save(path)
print(f"  social-card.png  {os.path.getsize(path)//1024}KB")

# ═══════════════════════════════════════════════════════════════════════
# 3. PRODUCT HUNT THUMBNAIL — 240x240
# ═══════════════════════════════════════════════════════════════════════

print("Rendering PH thumbnail...")
W, H = 240, 240
fr = blank(W, H, (16, 16, 24))
draw = ImageDraw.Draw(fr)

# Background glow
add_glow(fr, W // 2, H // 2, COLORS["goldie"], radius=100, strength=0.4)

# Goldie happy centered
sp = load_spr("goldie", "happy", scale=3)
if sp:
    paste_spr(fr, sp, W // 2, H // 2 - 12)

# "gb" text bottom
draw.text((W // 2 - 14, H - 36), "gb", font=fnt(18), fill=MUTED)

path = os.path.join(OUT_DIR, "ph-thumb.png")
fr.save(path)
print(f"  ph-thumb.png     {os.path.getsize(path)//1024}KB")

# ═══════════════════════════════════════════════════════════════════════
# 4. PH GALLERY 1 — split-screen personalities (1270x760)
# ═══════════════════════════════════════════════════════════════════════

print("Rendering PH gallery 1 (split screen)...")
W, H = 1270, 760
fr = blank(W, H)
draw = ImageDraw.Draw(fr)

SPLIT_STATIC = [
    ("goldie", "alarmed", "okay!! okay!!\nwe can fix this!!", COLORS["goldie"]),
    ("byte",   "judgy",   "predictable\noutcome.",             COLORS["byte"]),
    ("shiba",  "judgy",   "skill issue.",                      COLORS["shiba"]),
]

# Header
HDR_H = 100
f_hdr = fnt(52)
txt = "deploy failed."
lw = tw(draw, txt, f_hdr)
draw.text(((W - lw) // 2, 24), txt, font=f_hdr, fill=RED)

PW = W // 3
for i, (persona, mood, quip, color) in enumerate(SPLIT_STATIC):
    cx = i * PW + PW // 2
    r2, g2, b2 = color[:3]

    # Panel bg
    tint = Image.new("RGBA", (PW - 4, H - HDR_H), (r2 // 9, g2 // 9, b2 // 9, 220))
    fr.paste(tint.convert("RGB"), (i * PW + 2, HDR_H), tint)

    if i > 0:
        draw.line([(i * PW, HDR_H), (i * PW, H)], fill=(*color[:3], 60), width=1)

    sp = load_spr(persona, mood, scale=5)
    if sp:
        paste_spr(fr, sp, cx, HDR_H + (H - HDR_H) // 2 - 30)

    d2 = ImageDraw.Draw(fr)
    f_nm = fnt(24)
    nw2 = tw(d2, persona, f_nm)
    d2.text((cx - nw2 // 2, H - 160), persona, font=f_nm, fill=color)

    # Quip lines
    f_q = fnt(26)
    for j, line in enumerate(quip.split("\n")):
        lw2 = tw(d2, line, f_q)
        d2.text((cx - lw2 // 2, H - 120 + j * 36), line, font=f_q, fill=FG)

# Bottom tagline
d3 = ImageDraw.Draw(fr)
f_t = fnt(22)
tag = "same event. different dog. pick one."
lw = tw(d3, tag, f_t)
d3.text(((W - lw) // 2, H - 28), tag, font=f_t, fill=MUTED)

path = os.path.join(OUT_DIR, "ph-gallery-1.png")
fr.save(path)
print(f"  ph-gallery-1.png  {os.path.getsize(path)//1024}KB")

# ═══════════════════════════════════════════════════════════════════════
# 5. PH GALLERY 2 — deploy gate (1270x760)
# ═══════════════════════════════════════════════════════════════════════

print("Rendering PH gallery 2 (deploy gate)...")
W, H = 1270, 760
gate_src = os.path.join(SPR, "deploy-gate.png")
img = Image.open(gate_src).convert("RGB")
iw, ih = img.size
scale = max(W / iw, H / ih)
nw, nh = int(iw * scale), int(ih * scale)
img = img.resize((nw, nh), Image.LANCZOS)
img = img.crop(((nw - W) // 2, (nh - H) // 2, (nw - W) // 2 + W, (nh - H) // 2 + H))
img.save(os.path.join(OUT_DIR, "ph-gallery-2.png"))
print(f"  ph-gallery-2.png  {os.path.getsize(os.path.join(OUT_DIR,'ph-gallery-2.png'))//1024}KB")

# ═══════════════════════════════════════════════════════════════════════
# 6. PH GALLERY 3 — session summary + AI quips (1270x760)
# ═══════════════════════════════════════════════════════════════════════

print("Rendering PH gallery 3 (session summary)...")
W, H = 1270, 760
fr = blank(W, H)
draw = ImageDraw.Draw(fr)

# Left: Nova proud + quip
sp = load_spr("nova", "proud", scale=5)
if sp:
    add_glow(fr, W // 4, H // 2, COLORS["nova"], radius=200, strength=0.25)
    paste_spr(fr, sp, W // 4, H // 2 - 20)

bubble(draw, "47 MINUTES. 3 ERRORS. STILL YOUR BEST SESSION THIS WEEK.",
       W // 4, 80, COLORS["nova"], size=22, max_w=500)

# Right: session summary card
CX = W * 3 // 4
CY = H // 2
card_w, card_h = 480, 340
cx0 = CX - card_w // 2
cy0 = CY - card_h // 2

draw.rounded_rectangle([cx0, cy0, cx0 + card_w, cy0 + card_h],
                        radius=14, fill=DIM, outline=(60, 62, 82), width=1)

# Header
draw.text((cx0 + 24, cy0 + 22), "session summary", font=fnt(22), fill=MUTED)

STATS = [
    ("duration",     "47m"),
    ("errors",       "3"),
    ("files touched","12"),
    ("streak",       "7 days"),
]
f_lbl = fnt(20)
f_val = fnt(28)
for i, (lbl, val) in enumerate(STATS):
    row_y = cy0 + 66 + i * 54
    draw.text((cx0 + 24, row_y), lbl, font=f_lbl, fill=MUTED)
    lw2 = tw(draw, val, f_val)
    draw.text((cx0 + card_w - 24 - lw2, row_y - 3), val, font=f_val,
              fill=COLORS["nova"])
    if i < len(STATS) - 1:
        draw.line([(cx0 + 16, row_y + 44), (cx0 + card_w - 16, row_y + 44)],
                  fill=(45, 48, 64), width=1)

# AI badge
bx, by = cx0 + 24, cy0 + card_h - 52
ai_txt = "✦ ai quip via claude haiku — ~$0.00005/session"
draw.text((bx, by), ai_txt, font=fnt(17), fill=MUTED)

# Caption
f_cap = fnt(26)
cap = "ai-generated quips at session end. opt-in. one env var."
cw = tw(draw, cap, f_cap)
draw.text(((W - cw) // 2, H - 48), cap, font=f_cap, fill=MUTED)

path = os.path.join(OUT_DIR, "ph-gallery-3.png")
fr.save(path)
print(f"  ph-gallery-3.png  {os.path.getsize(path)//1024}KB")

print("\nAll marketing assets done.")
print(f"Output: {OUT_DIR}")
