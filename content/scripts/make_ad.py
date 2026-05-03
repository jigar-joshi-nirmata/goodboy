#!/usr/bin/env python3
"""
goodboy-claude — main advertisement video
24 seconds, 7 scenes. Three hero moments carry the whole thing.

Moments:
  1. "your terminal is emotionally unavailable."
  2. rm -rf panic — slow type, silence, SLAM
  3. Split-screen deploy failure — three personalities, one event
"""
from PIL import Image, ImageDraw, ImageFont, ImageChops, ImageFilter
import subprocess, os

W, H  = 1280, 720
FPS   = 30
OUT   = "/tmp/gb_ad"
MONO  = "/System/Library/Fonts/SFNSMono.ttf"
ROOT  = os.path.join(os.path.dirname(__file__), "../..")
SPR   = os.path.join(ROOT, "sprites")

BG    = (13, 13, 20)
FG    = (240, 240, 235)
MUTED = (75, 80, 105)
GREEN = (80, 250, 123)
RED   = (255, 65, 65)

COLORS = {
    "goldie": (241, 196,  15),
    "byte":   ( 52, 152, 219),
    "shiba":  (230, 126,  34),
    "pugsy":  (155,  89, 182),
    "nova":   (200, 210, 220),
    "debug":  ( 46, 204, 113),
}

os.makedirs(OUT, exist_ok=True)

# ── UTILITIES ──────────────────────────────────────────────────────────

def fnt(size):
    try: return ImageFont.truetype(MONO, size)
    except: return ImageFont.load_default()

def eo(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3

def ph(t, a, b):
    if b <= a: return 1.0
    return max(0.0, min(1.0, (t - a) / (b - a)))

def base():
    return Image.new("RGB", (W, H), BG)

def tw(draw, text, f):
    bb = draw.textbbox((0, 0), text, font=f)
    return bb[2] - bb[0]

def blend(a, b, alpha):
    a = a.convert("RGBA")
    b = b.convert("RGBA")
    r, g, bl, ch = b.split()
    ch = ch.point(lambda p: int(p * max(0.0, min(1.0, alpha))))
    b = Image.merge("RGBA", (r, g, bl, ch))
    a.paste(b, (0, 0), b)
    return a.convert("RGB")

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
    if alpha < 1.0:
        r, g, b, a = sprite.split()
        a = a.point(lambda p: int(p * alpha))
        sprite = Image.merge("RGBA", (r, g, b, a))
    x = cx - sprite.width  // 2
    y = cy - sprite.height // 2
    base_img.paste(sprite, (x, y), sprite)

def add_glow(frame, cx, cy, color, radius=200, strength=0.35):
    g = Image.new("RGB", (W, H), BG)
    gd = ImageDraw.Draw(g)
    r2, g2, b2 = color[:3]
    for rad in range(radius, 0, -6):
        v = int(255 * strength * (1 - rad / radius) ** 2)
        gd.ellipse([cx - rad, cy - rad * 3 // 4, cx + rad, cy + rad * 3 // 4],
                   fill=(min(255, r2), min(255, g2), min(255, b2)))
    g = g.filter(ImageFilter.GaussianBlur(radius // 4))
    merged = Image.blend(frame.convert("RGB"), g, 0.28)
    frame.paste(merged)

def bubble(frame, text, cx, y, color, size=26, max_w=480):
    draw = ImageDraw.Draw(frame)
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

# ── SCENE 1 — HOOK (90f / 3s) ─────────────────────────────────────────

HOOK = "your terminal is emotionally unavailable."

def scene_hook(t):
    fr = base()
    draw = ImageDraw.Draw(fr)
    f = fnt(46)
    n = int(ph(t, 0.0, 0.72) * len(HOOK))
    cursor = ("▋" if int(t * 5) % 2 == 0 else "")
    display = HOOK[:n] + (cursor if n < len(HOOK) else ("▋" if t > 0.75 and int(t*3)%2==0 else ""))
    alpha = eo(ph(t, 0.0, 0.14))
    full_w = tw(draw, HOOK, f)
    draw.text(((W - full_w) // 2, H // 2 - 28), display, font=f,
              fill=(*FG, int(255 * alpha)))
    return fr

# ── SCENE 2 — REVEAL (75f / 2.5s) ────────────────────────────────────

def scene_reveal(t):
    fr = base()
    draw = ImageDraw.Draw(fr)
    p1 = eo(ph(t, 0.0, 0.45))
    sp = load_spr("goldie", "happy", scale=6)
    if sp:
        add_glow(fr, W // 2, H // 2, COLORS["goldie"], radius=240, strength=0.28 * p1)
        cy = int(H // 2 - 10 + (1 - p1) * 55)
        paste_spr(fr, sp, W // 2, cy, p1)
    p2 = eo(ph(t, 0.40, 0.72))
    if p2 > 0.02:
        bfr = base()
        bubble(bfr, "GOOD MORNING!! let's build something amazing today!!",
               W // 2, 78, COLORS["goldie"], size=24, max_w=580)
        fr = blend(fr, bfr, p2)
    p3 = eo(ph(t, 0.65, 0.95))
    if p3 > 0.02:
        d2 = ImageDraw.Draw(fr)
        f_logo = fnt(52)
        logo = "goodboy"
        lw = tw(d2, logo, f_logo)
        d2.text(((W - lw) // 2, H - 108), logo, font=f_logo,
                fill=(*FG, int(255 * p3)))
        f_sub = fnt(20)
        sub = "a tamagotchi for your terminal"
        sw = tw(d2, sub, f_sub)
        d2.text(((W - sw) // 2, H - 52), sub, font=f_sub,
                fill=(*MUTED, int(255 * p3)))
    return fr

# ── SCENE 3 — RM-RF BANG (120f / 4s) ─────────────────────────────────
# t 0.00-0.38 : typing    (deliberate, slow)
# t 0.38-0.45 : silence   (cursor holds — comedy beat)
# t 0.45-1.00 : SLAM      (no crossfade, hard cut inside scene)

CMD = "$ rm -rf /"

def scene_rmrf(t):
    if t < 0.45:
        fr = base()
        draw = ImageDraw.Draw(fr)
        n = int(ph(t, 0.0, 0.38) * len(CMD))
        blink = (t >= 0.38) or (int(t * 7) % 2 == 0)
        display = CMD[:n] + ("▋" if blink else "")
        f = fnt(46)
        full_w = tw(draw, CMD, f)
        tx, ty = (W - full_w) // 2, H // 2 - 28
        draw.text((tx, ty), display, font=f, fill=(120, 220, 120))
        fc = fnt(20)
        draw.text((tx, ty - 44), "~  $", font=fc, fill=MUTED)
        return fr
    else:
        fr = base()
        slam_t = eo(ph(t, 0.45, 0.60))
        add_glow(fr, W // 2, H // 2, RED, radius=400, strength=0.5 * slam_t)
        if slam_t < 1.0:
            red_over = Image.new("RGB", (W, H), (70, 0, 0))
            fr = blend(fr, red_over, 0.22 * (1 - slam_t))
        sp = load_spr("goldie", "alarmed", scale=7)
        if sp:
            dog_alpha = eo(ph(t, 0.45, 0.56))
            paste_spr(fr, sp, W // 2, H // 2 + 30, dog_alpha)
        p_quip = eo(ph(t, 0.60, 0.80))
        if p_quip > 0.02:
            bfr = base()
            bubble(bfr, "WAIT WAIT WAIT THAT IS THE WHOLE FILESYSTEM!!",
                   W // 2, 60, COLORS["goldie"], size=26, max_w=640)
            fr = blend(fr, bfr, p_quip)
        return fr

# ── SCENE 4 — 2:47 AM (75f / 2.5s) ──────────────────────────────────

def scene_night(t):
    fr = Image.new("RGB", (W, H), (8, 8, 14))
    draw = ImageDraw.Draw(fr)
    p1 = eo(ph(t, 0.0, 0.38))
    draw.text((52, 42), "02:47", font=fnt(28), fill=(*MUTED, int(180 * p1)))
    sp = load_spr("pugsy", "sleepy", scale=5)
    if sp:
        cy = int(H // 2 + 10 + (1 - p1) * 35)
        add_glow(fr, W // 2, H // 2, COLORS["pugsy"], radius=150, strength=0.16 * p1)
        paste_spr(fr, sp, W // 2, cy, p1)
    p2 = eo(ph(t, 0.52, 0.82))
    if p2 > 0.02:
        bfr = Image.new("RGB", (W, H), (8, 8, 14))
        bubble(bfr, "go. sleep.", W // 2, 95, COLORS["pugsy"], size=30, max_w=280)
        fr = blend(fr, bfr, p2)
    return fr

# ── SCENE 5 — SPLIT SCREEN (150f / 5s) ───────────────────────────────

SPLIT = [
    ("goldie", "alarmed", "okay!! okay!! we can fix this!!",     COLORS["goldie"],  0.18),
    ("byte",   "judgy",   "predictable outcome.",                 COLORS["byte"],    0.38),
    ("shiba",  "judgy",   "skill issue.",                         COLORS["shiba"],   0.58),
]

def scene_split(t):
    fr = base()
    draw = ImageDraw.Draw(fr)
    HDR = 88
    PW  = W // 3

    # Header
    ph_hdr = eo(ph(t, 0.0, 0.16))
    if ph_hdr > 0.01:
        f_h = fnt(48)
        txt = "deploy failed."
        lw = tw(draw, txt, f_h)
        draw.text(((W - lw) // 2, 18), txt, font=f_h, fill=(*RED, int(255 * ph_hdr)))

    for i, (persona, mood, quip, color, start) in enumerate(SPLIT):
        pa = eo(ph(t, start, start + 0.22))
        if pa < 0.02: continue
        cx = i * PW + PW // 2
        slide = int((1 - pa) * 80)

        # Subtle panel tint
        r2, g2, b2 = color[:3]
        tint = Image.new("RGBA", (PW - 4, H - HDR - 8), (r2 // 9, g2 // 9, b2 // 9, int(220 * pa)))
        fr.paste(tint.convert("RGB"), (i * PW + 2, HDR), tint)

        # Panel divider
        if i > 0:
            d = ImageDraw.Draw(fr)
            d.line([(i * PW, HDR), (i * PW, H)], fill=(*color[:3], int(55 * pa)), width=1)

        # Dog
        sp = load_spr(persona, mood, scale=4)
        if sp:
            dog_cy = HDR + (H - HDR) // 2 - 20 + slide
            paste_spr(fr, sp, cx, dog_cy, pa)

        # Name label
        d2 = ImageDraw.Draw(fr)
        f_nm = fnt(21)
        nw2 = tw(d2, persona, f_nm)
        d2.text((cx - nw2 // 2, H - 148 + slide), persona, font=f_nm,
                fill=(*color[:3], int(200 * pa)))

        # Quip
        p_q = eo(ph(t, start + 0.16, start + 0.40))
        if p_q > 0.02:
            qfr = base()
            bubble(qfr, quip, cx, H - 120, color, size=22, max_w=350)
            fr = blend(fr, qfr, p_q)

    # Tagline
    p_tag = eo(ph(t, 0.84, 1.0))
    if p_tag > 0.02:
        d3 = ImageDraw.Draw(fr)
        f_t = fnt(19)
        tag = "same event. different dog. pick one."
        lw = tw(d3, tag, f_t)
        d3.text(((W - lw) // 2, H - 20), tag, font=f_t,
                fill=(*MUTED, int(210 * p_tag)))

    return fr

# ── SCENE 6 — PICK YOUR DOG (75f / 2.5s) ─────────────────────────────

def scene_personas(t):
    img = Image.open(os.path.join(SPR, "pick-companion.png")).convert("RGB")
    iw, ih = img.size
    scale = max(W / iw, H / ih)
    nw, nh = int(iw * scale), int(ih * scale)
    img = img.resize((nw, nh), Image.LANCZOS)
    img = img.crop(((nw - W) // 2, (nh - H) // 2, (nw - W) // 2 + W, (nh - H) // 2 + H))
    dark = Image.new("RGBA", (W, H), (0, 0, 0, 100))
    out = img.convert("RGBA")
    out.paste(dark, (0, 0), dark)
    fr = blend(base(), out.convert("RGB"), eo(ph(t, 0.0, 0.40)))
    p2 = eo(ph(t, 0.44, 0.76))
    if p2 > 0.02:
        d = ImageDraw.Draw(fr)
        f = fnt(36)
        txt = "6 personalities. pick your poison."
        lw = tw(d, txt, f)
        d.rectangle([(W//2 - lw//2 - 22, H - 78), (W//2 + lw//2 + 22, H - 28)],
                    fill=(0, 0, 0, int(160 * p2)))
        d.text(((W - lw) // 2, H - 70), txt, font=f, fill=(*FG, int(255 * p2)))
    return fr

# ── SCENE 7 — CTA (120f / 4s) ────────────────────────────────────────

CTA = [
    ("emotional middleware for developers.", 38, MUTED,  0.05, False),
    ("npm install -g @terminaldogs/goodboy-claude", 30, GREEN, 0.28, True),
    ("pick your dog. ship code together.",   24, FG,    0.54, False),
]
PERSONAS_ORD = ["goldie", "byte", "shiba", "pugsy", "nova", "debug"]

def scene_cta(t):
    fr = base()
    draw = ImageDraw.Draw(fr)
    ys = [H // 2 - 138, H // 2 - 60, H // 2 - 4]
    for (line, size, color, start, typewrite), y in zip(CTA, ys):
        p = eo(ph(t, start, start + 0.26))
        if p < 0.01: continue
        f = fnt(size)
        full_w = tw(draw, line, f)
        if typewrite:
            n = int(p * len(line))
            draw.text(((W - full_w) // 2, y), line[:n], font=f, fill=color)
            if int(t * 8) % 2 == 0 and n < len(line):
                off = tw(draw, line[:n], f)
                draw.text(((W - full_w) // 2 + off, y), "▋", font=f,
                          fill=(*GREEN, 200))
        else:
            draw.text(((W - full_w) // 2, y), line, font=f,
                      fill=(*color, int(255 * p)))

    p_dogs = eo(ph(t, 0.48, 0.84))
    if p_dogs > 0.02:
        slot = W // len(PERSONAS_ORD)
        for i, persona in enumerate(PERSONAS_ORD):
            sp = load_spr(persona, "happy", scale=3)
            if not sp: continue
            cx = i * slot + slot // 2
            cy = H - sp.height // 2 - 46
            paste_spr(fr, sp, cx, cy, p_dogs)
            d = ImageDraw.Draw(fr)
            f_n = fnt(14)
            nw2 = tw(d, persona, f_n)
            d.text((cx - nw2 // 2, H - 32), persona, font=f_n,
                   fill=(*COLORS[persona], int(190 * p_dogs)))

    p_line = eo(ph(t, 0.0, 0.38))
    d2 = ImageDraw.Draw(fr)
    ll = int(W * 0.72 * p_line)
    d2.line([(W // 2 - ll // 2, H - 7), (W // 2 + ll // 2, H - 7)],
            fill=(70, 70, 110), width=2)
    return fr

# ── TIMELINE ──────────────────────────────────────────────────────────

SCENES = [
    (scene_hook,     90,  True),
    (scene_reveal,   75,  True),
    (scene_rmrf,     120, False),   # slam cut — no crossfade
    (scene_night,    75,  True),
    (scene_split,    150, True),
    (scene_personas, 75,  True),
    (scene_cta,      120, True),
]
XFADE = 12

def build():
    frames = []
    prev_last = None
    for fn, n, xfade in SCENES:
        sc = [fn(i / max(n - 1, 1)) for i in range(n)]
        if prev_last is not None and xfade:
            for j in range(XFADE):
                alpha = j / XFADE
                idx = len(frames) - (XFADE - j)
                if 0 <= idx < len(frames):
                    frames[idx] = blend(prev_last, sc[0], alpha)
        frames.extend(sc)
        prev_last = sc[-1]
    return frames

# ── RENDER ────────────────────────────────────────────────────────────

print("Building frames...")
all_frames = build()
total = len(all_frames)
print(f"Rendering {total} frames @ {FPS}fps ({total/FPS:.1f}s)...")

for i, fr in enumerate(all_frames):
    fr.save(os.path.join(OUT, f"{i:05d}.png"))
    if i % 60 == 0:
        print(f"  {i*100//total}%", end="\r", flush=True)

OUT_MP4 = os.path.join(ROOT, "demo-ad.mp4")
OUT_GIF = os.path.join(ROOT, "demo-ad.gif")

print("\nEncoding mp4...")
subprocess.run([
    "ffmpeg", "-y", "-framerate", str(FPS), "-i", f"{OUT}/%05d.png",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "slow",
    OUT_MP4
], check=True, capture_output=True)

print("Generating GIF...")
subprocess.run([
    "ffmpeg", "-y", "-i", OUT_MP4,
    "-vf", ("fps=24,scale=960:-1:flags=lanczos,"
            "split[s0][s1];[s0]palettegen=max_colors=192[p];[s1][p]paletteuse=dither=bayer"),
    "-loop", "0", OUT_GIF
], check=True, capture_output=True)

print(f"demo-ad.mp4  {os.path.getsize(OUT_MP4)//1024}KB")
print(f"demo-ad.gif  {os.path.getsize(OUT_GIF)//1024}KB")
print("Done.")
