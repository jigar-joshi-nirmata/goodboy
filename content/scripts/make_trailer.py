#!/usr/bin/env python3
"""
goodboy launch trailer — slow, clean, cinematic
1920x1080 @ 30fps, ~54s
One thing at a time. Let it breathe.
"""
import os, math, wave, struct, random, tempfile, subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageChops

ROOT = Path(__file__).parent.parent.parent
SPR  = ROOT / "sprites"
CONT = ROOT / "content"
OUT  = ROOT / "trailer.mp4"

W, H   = 1920, 1080
FPS    = 30
CHROME = 42

BG     = (13,  13,  23)
GREEN  = (63, 185,  80)
RED    = (248,  81,  73)
YELLOW = (210, 153,  34)
MUTED  = (95, 105, 118)
WHITE  = (208, 213, 222)
DIM    = (55,  60,  75)

PCOLORS = {
    "goldie": (210, 153,  34),
    "byte":   (88,  166, 255),
    "shiba":  (255, 120,  50),
    "pugsy":  (160, 120,  80),
    "nova":   (140, 120, 255),
    "debug":  (100, 220, 100),
}

JB    = str(CONT / "JetBrainsMono-Regular.ttf")
JB_B  = str(CONT / "JetBrainsMono-Bold.ttf")
JB_XB = str(CONT / "JetBrainsMono-ExtraBold.ttf")

def fnt(path, size):
    try: return ImageFont.truetype(path, size)
    except: return ImageFont.load_default()

F_TITLE = fnt(JB_XB, 54)
F_BODY  = fnt(JB,    28)
F_MONO  = fnt(JB,    23)
F_CMD   = fnt(JB,    26)
F_WAIT  = fnt(JB_XB, 30)
F_QUIP  = fnt(JB,    21)
F_SMALL = fnt(JB,    17)
F_TAB   = fnt(JB,    15)
F_CLOCK = fnt(JB,    34)

# ── sprite cache ──────────────────────────────────────────────────────────────
_cache = {}

def load_spr(persona, mood, target_h):
    k = (persona, mood, target_h)
    if k in _cache: return _cache[k]
    p = SPR / persona / f"{mood}.jpg"
    if not p.exists(): p = SPR / persona / "happy.jpg"
    if not p.exists(): _cache[k] = None; return None
    img = Image.open(p).convert("RGBA")
    r, g, b, _ = img.split()
    mx = ImageChops.lighter(r, ImageChops.lighter(g, b))
    img.putalpha(mx.point(lambda x: 255 if x >= 38 else 0))
    scale = target_h / img.height
    img = img.resize((int(img.width * scale), target_h), Image.NEAREST)
    _cache[k] = img
    return img

def paste_spr(img, sp, cx, cy, alpha=1.0):
    if sp is None: return
    if alpha < 1.0:
        sp = sp.copy()
        sp.putalpha(sp.split()[3].point(lambda x: int(x * alpha)))
    x0 = max(0, cx - sp.width  // 2)
    y0 = max(0, cy - sp.height // 2)
    img.paste(sp, (x0, y0), sp)

# ── drawing helpers ───────────────────────────────────────────────────────────
def base_frame():
    return Image.new("RGB", (W, H), BG)

def to_black(img, alpha):
    if alpha <= 0: return img
    if alpha >= 1: return Image.new("RGB", (W, H), BG)
    return Image.blend(img, Image.new("RGB", (W, H), BG), alpha)

def vignette(img, strength=0.30):
    v = Image.new("L", (W, H), 255)
    d = ImageDraw.Draw(v)
    for i in range(75):
        val = int(255 * (1 - strength * (i / 75) ** 2))
        d.ellipse([i * 3, i, W - i * 3, H - i], fill=val)
    return Image.composite(Image.new("RGB", (W, H), BG), img, ImageChops.invert(v))

def draw_terminal(img, x, y, w, h, title=""):
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([x, y, x+w, y+h], radius=8,
                         fill=(20, 20, 32), outline=(36, 36, 50), width=1)
    d.rounded_rectangle([x, y, x+w, y+CHROME], radius=8, fill=(27, 27, 41))
    d.rectangle([x, y+CHROME//2, x+w, y+CHROME], fill=(27, 27, 41))
    for i, c in enumerate([(248,81,73),(210,153,34),(63,185,80)]):
        cx, cy = x + 16 + i * 20, y + CHROME // 2
        d.ellipse([cx-5, cy-5, cx+5, cy+5], fill=c)
    if title:
        d.text((x + w//2, y + CHROME//2), title,
               fill=(65, 70, 90), font=F_SMALL, anchor="mm")

def ease_smooth(t):    return t * t * (3 - 2 * t)
def ease_out(t):       return 1 - (1 - t) ** 2
def ease_out_cubic(t): return 1 - (1 - t) ** 3
def clamp01(x):        return max(0.0, min(1.0, x))

def tween(t, start, end):
    return clamp01((t - start) / max(0.0001, end - start))

def typewriter(draw, text, font, color, cx, cy, progress, centered=True):
    """Draw `progress` fraction of text. Returns cursor x position."""
    n     = int(len(text) * clamp01(progress))
    shown = text[:n]
    if centered:
        full_w = draw.textlength(text, font=font)
        tx = cx - int(full_w // 2)
    else:
        tx = cx
    draw.text((tx, cy), shown, fill=color, font=font, anchor="lm")
    return tx + draw.textlength(shown, font=font)

# ── scenes ────────────────────────────────────────────────────────────────────

def scene_cold_open(t):
    """
    'your terminal is emotionally unavailable.'
    Types out, holds.
    """
    img = base_frame()
    d   = ImageDraw.Draw(img)

    text = "your terminal is emotionally unavailable."
    prog = ease_out(tween(t, 0.0, 0.62))
    cur_x = typewriter(d, text, F_TITLE, WHITE, W//2, H//2, prog, centered=True)

    if prog < 1.0 or t < 0.72:
        if int(t * FPS) % 38 < 19:
            d.rectangle([int(cur_x) + 3, H//2 - 29, int(cur_x) + 7, H//2 + 29], fill=WHITE)

    return img


def scene_goldie_hello(t):
    """
    Terminal shows goodboy init. Goldie slides in from the right.
    """
    img = base_frame()
    d   = ImageDraw.Draw(img)

    TW, TH = 820, 375
    TX, TY = 100, (H - TH) // 2
    draw_terminal(img, TX, TY, TW, TH, "  ~/project")
    d = ImageDraw.Draw(img)

    CMD  = "$ goodboy init goldie"
    OUTS = [
        ("  ✦ goodboy — developer companion", GREEN),
        ("", None),
        ("  ✓ claude hooks: installed", GREEN),
        ("  ✓ persona: goldie",         GREEN),
        ("  ✓ state: ~/.goodboy",       GREEN),
    ]
    LX, LY, LS = TX + 22, TY + CHROME + 20, 27

    cmd_p = ease_out(tween(t, 0.0, 0.30))
    n = int(len(CMD) * cmd_p)
    d.text((LX, LY), CMD[:n], fill=WHITE, font=F_CMD)
    if cmd_p < 1.0:
        cur_x = LX + int(d.textlength(CMD[:n], font=F_CMD))
        d.rectangle([cur_x+2, LY-2, cur_x+5, LY+22], fill=WHITE)

    if t > 0.32:
        out_p = tween(t, 0.32, 0.62)
        n_ln  = int(len(OUTS) * clamp01(out_p / 0.85))
        for i, (ln, col) in enumerate(OUTS[:n_ln]):
            d.text((LX, LY + LS * (i + 2)), ln, fill=col or MUTED, font=F_MONO)

    sp = load_spr("goldie", "excited", 375)
    if sp and t > 0.38:
        slide   = ease_out_cubic(tween(t, 0.38, 0.68))
        sp_cx   = W - 275
        sp_cx_a = int(slide * sp_cx + (1 - slide) * (W + 80))
        paste_spr(img, sp, sp_cx_a, H//2, clamp01(slide * 1.8))

    if t > 0.72:
        q_p  = ease_out(tween(t, 0.72, 0.92))
        quip = "i am ready!! let's write so much code!!"
        n    = int(len(quip) * q_p)
        d    = ImageDraw.Draw(img)
        d.text((W - 490, H//2 + 240), quip[:n], fill=YELLOW, font=F_MONO)

    return img


def scene_rmrf(t):
    """
    '$ rm -rf /'  ...1.5s of silence...  GOLDIE SLAMS IN ALARMED.
    Comedy timing matters.
    """
    img = base_frame()
    d   = ImageDraw.Draw(img)

    TW, TH = 740, 155
    TX, TY = 130, H//2 - 132
    draw_terminal(img, TX, TY, TW, TH, "  ~/project")
    d = ImageDraw.Draw(img)

    CMD    = "$ rm -rf /"
    LX, LY = TX + 22, TY + CHROME + 26

    cmd_p = ease_out(tween(t, 0.0, 0.28))
    n     = int(len(CMD) * cmd_p)
    d.text((LX, LY), CMD[:n], fill=WHITE, font=F_CMD)
    cur_x = LX + int(d.textlength(CMD[:n], font=F_CMD))

    # Silence — cursor blinks, nothing else happens
    if cmd_p >= 1.0:
        if int(t * FPS) % 22 < 11:
            d.rectangle([cur_x+2, LY-3, cur_x+5, LY+23], fill=WHITE)

    # SLAM at 50%
    if t > 0.50:
        slam = ease_out_cubic(tween(t, 0.50, 0.70))

        target_h = int(280 + slam * 160)
        sp = load_spr("goldie", "alarmed", target_h)
        if sp:
            sp_cx  = W - 335
            sp_cy  = int((1 - slam) * (H + 100) + slam * (H//2 + 55))
            shake  = int(7 * (1 - slam) * math.sin(t * 115)) if slam < 0.75 else 0
            paste_spr(img, sp, sp_cx + shake, sp_cy, clamp01(slam * 2.0))

        glow = clamp01((slam - 0.25) / 0.75)
        if glow > 0:
            red_l = Image.new("RGB", (W, H), (70, 0, 0))
            img   = Image.blend(img, red_l, glow * 0.09)
            d     = ImageDraw.Draw(img)

        if t > 0.68:
            wait_p = ease_out(tween(t, 0.68, 0.86))
            quip   = "WAIT WAIT WAIT WAIT WAIT."
            n      = int(len(quip) * wait_p)
            d.text((W - 510, H//2 + 300), quip[:n], fill=RED, font=F_WAIT)

    return img


def scene_pugsy_night(t):
    """
    02:47. Pugsy fades in quietly. 'go. sleep.'
    Dead quiet. Near-black.
    """
    img = Image.new("RGB", (W, H), (7, 7, 13))
    d   = ImageDraw.Draw(img)

    clock_a = int(60 * ease_out(tween(t, 0.0, 0.20)))
    d.text((W//2, H//2 - 208), "02:47",
           fill=(clock_a//4, clock_a//5, clock_a//3), font=F_CLOCK, anchor="mm")

    if t > 0.15:
        fade_p = ease_out(tween(t, 0.15, 0.50))
        sp = load_spr("pugsy", "sleepy", 330)
        if sp:
            paste_spr(img, sp, W//2, H//2 + 10, fade_p)

    if t > 0.55:
        q_p = ease_out(tween(t, 0.55, 0.80))
        col = tuple(int(c * q_p) for c in (98, 78, 128))
        d   = ImageDraw.Draw(img)
        d.text((W//2, H//2 + 245), "go. sleep.", fill=col, font=F_BODY, anchor="mm")

    return img


def scene_split(t):
    """
    DEPLOY FAILED.
    Three dogs. Three reactions. Same event.
    This is the KEY scene — give it room.
    """
    img = base_frame()
    d   = ImageDraw.Draw(img)

    if t > 0.04:
        h_p = ease_out_cubic(tween(t, 0.04, 0.18))
        col = tuple(int(c * h_p) for c in RED)
        d.text((W//2, 104), "DEPLOY FAILED.", fill=col, font=F_TITLE, anchor="mm")

    PANELS = [
        ("goldie", "alarmed", "okay!! okay!!\nwe can fix this!!", PCOLORS["goldie"], 0.22),
        ("byte",   "judgy",   "predictable\noutcome.",            PCOLORS["byte"],   0.42),
        ("shiba",  "judgy",   "skill issue.",                     PCOLORS["shiba"],  0.62),
    ]

    PW = W // 3
    PY = 170
    PH = H - PY - 88

    for i, (persona, mood, quip, col, trigger) in enumerate(PANELS):
        panel_t = ease_out(tween(t, trigger, trigger + 0.22))
        if panel_t <= 0: continue

        px = i * PW

        panel_bg = Image.new("RGB", (PW, PH), tuple(int(c * 0.07) for c in col))
        crop     = img.crop((px, PY, px+PW, PY+PH))
        img.paste(Image.blend(crop, panel_bg, panel_t * 0.88), (px, PY))
        d = ImageDraw.Draw(img)

        if i > 0:
            d.line([(px, PY), (px, PY+PH)], fill=(32, 32, 48), width=1)

        tw = 96
        tx1, ty1 = px + PW//2 - tw//2, PY + 10
        tx2, ty2 = px + PW//2 + tw//2, PY + 34
        d.rounded_rectangle([tx1, ty1, tx2, ty2], radius=4,
                             fill=tuple(int(c * 0.14) for c in col),
                             outline=col, width=1)
        d.text((px + PW//2, PY + 22), persona,
               fill=tuple(int(c * panel_t) for c in col), font=F_TAB, anchor="mm")

        bob_y = int(4 * math.sin(t * 28 * math.pi + i * 2.1))
        sp    = load_spr(persona, mood, 265)
        if sp:
            paste_spr(img, sp, px + PW//2, PY + 258 + bob_y, panel_t)

        if panel_t > 0.52:
            q_a  = ease_out(tween(panel_t, 0.52, 1.0))
            qcol = tuple(int(c * q_a) for c in col)
            for li, ql in enumerate(quip.split("\n")):
                d.text((px + PW//2, PY + 396 + li * 27), ql,
                       fill=qcol, font=F_QUIP, anchor="mm")

    if t > 0.84:
        tg_p = ease_out(tween(t, 0.84, 0.97))
        tg   = "same event. different dog."
        n    = int(len(tg) * tg_p)
        d.text((W//2, H - 46), tg[:n], fill=MUTED, font=F_MONO, anchor="mm")

    return img


def scene_cta(t):
    """
    'emotional middleware for developers.'
    npm install. Six dogs bob.
    """
    img = base_frame()
    d   = ImageDraw.Draw(img)

    if t > 0.05:
        h_p = ease_out(tween(t, 0.05, 0.33))
        hdr = "emotional middleware for developers."
        n   = int(len(hdr) * h_p)
        d.text((W//2, 198), hdr[:n], fill=WHITE, font=F_BODY, anchor="mm")

    if t > 0.30:
        c1_p = ease_out(tween(t, 0.30, 0.57))
        cmd1 = "$ npm install -g @terminaldogs/goodboy-claude"
        n    = int(len(cmd1) * c1_p)
        d.text((W//2, H//2 - 26), cmd1[:n], fill=GREEN, font=F_MONO, anchor="mm")

    if t > 0.60:
        c2_p = ease_out(tween(t, 0.60, 0.77))
        cmd2 = "$ goodboy init"
        n    = int(len(cmd2) * c2_p)
        d.text((W//2, H//2 + 14), cmd2[:n], fill=MUTED, font=F_MONO, anchor="mm")

    if t > 0.44:
        strip_t  = tween(t, 0.44, 0.82)
        personas = ["goldie", "byte", "shiba", "pugsy", "nova", "debug"]
        sprs     = [load_spr(p, "happy", 190) for p in personas]
        total_w  = sum(s.width + 14 for s in sprs if s)
        sx       = (W - total_w) // 2
        strip_y  = H - 190 - 52

        for i, (persona, sp) in enumerate(zip(personas, sprs)):
            if sp:
                seg_p = ease_out(tween(strip_t, i * 0.10, i * 0.10 + 0.22))
                bob_y = int(6 * math.sin(t * 22 * math.pi + i * 1.1))
                paste_spr(img, sp, sx + sp.width//2, strip_y + bob_y, seg_p)
                sx += sp.width + 14

    return img


# ── audio ─────────────────────────────────────────────────────────────────────
def make_audio(total_frames, tmpdir):
    SR   = 44100
    secs = total_frames / FPS
    n    = int(SR * secs)
    buf  = [0.0] * n

    def add(samples, t0):
        i0 = int(t0 * SR)
        for i, s in enumerate(samples):
            idx = i0 + i
            if 0 <= idx < n:
                buf[idx] = max(-1.0, min(1.0, buf[idx] + s))

    def sine(freq, amp, dur):
        return [amp * math.sin(2 * math.pi * freq * i / SR)
                for i in range(int(dur * SR))]

    def click(count=500, amp=0.22):
        return [amp * (random.random() * 2 - 1) * math.exp(-i / 65)
                for i in range(count)]

    add(sine(60, 0.010, secs), 0)

    # Scene-boundary keyboard clicks (approx scene start times in seconds)
    for sc_t in [7.0, 16.5, 26.5, 34.0, 47.5]:
        for j in range(2):
            add(click(), sc_t + j * 0.07 + random.uniform(0, 0.025))

    # rm-rf bass slam (scene 3 starts ~16.5s, slam at 50% of 9.5s = 4.75s → ~21.25s)
    bass     = sine(52, 0.82, 0.65)
    bass_env = [s * math.exp(-3.8 * i / len(bass)) for i, s in enumerate(bass)]
    add(bass_env, 21.2)
    add(click(1000, 0.42), 21.2)

    # CTA chime (scene 6 starts ~47.5s, npm install at 0.30 → 2.55s in → ~50s)
    for freq, delay in [(523, 0), (659, 0.13), (784, 0.26), (1047, 0.40)]:
        ch     = sine(freq, 0.26, 0.45)
        ch_env = [s * math.exp(-5 * i / len(ch)) for i, s in enumerate(ch)]
        add(ch_env, 50.5 + delay)

    wav = os.path.join(tmpdir, "sfx.wav")
    with wave.open(wav, "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(struct.pack(f"<{n}h", *[int(s * 32767) for s in buf]))
    return wav


# ── render ────────────────────────────────────────────────────────────────────
SCENES = [
    (scene_cold_open,    210),   #  7.0s
    (scene_goldie_hello, 285),   #  9.5s
    (scene_rmrf,         285),   #  9.5s
    (scene_pugsy_night,  210),   #  7.0s
    (scene_split,        405),   # 13.5s
    (scene_cta,          255),   #  8.5s
]
FADE_F = 28


def main():
    tmpdir     = tempfile.mkdtemp(prefix="gb_")
    frames_dir = os.path.join(tmpdir, "frames")
    os.makedirs(frames_dir)

    total = sum(f for _, f in SCENES)
    print(f"Rendering {total} frames @ {FPS}fps ({total/FPS:.1f}s)...")
    print("Generating audio...")
    wav = make_audio(total, tmpdir)
    print(f"  SFX: {wav}")
    print("Building frames...")

    idx = 0
    def save(img):
        nonlocal idx
        img.save(os.path.join(frames_dir, f"f{idx:06d}.png"))
        idx += 1

    for si, (fn, nf) in enumerate(SCENES):
        for fi in range(nf):
            t   = fi / (nf - 1) if nf > 1 else 0.0
            img = fn(t)
            img = vignette(img)

            if fi < FADE_F:
                img = to_black(img, ease_smooth(1.0 - fi / FADE_F))
            if fi >= nf - FADE_F:
                img = to_black(img, ease_smooth((fi - (nf - FADE_F)) / FADE_F))

            save(img)
        print(f"  {si+1}/{len(SCENES)}  {fn.__name__}  ({nf}f)", flush=True)

    def ff(*args):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error"] + list(args), check=True)

    print("Encoding trailer.mp4 (with audio)...")
    ff("-framerate", str(FPS),
       "-i", os.path.join(frames_dir, "f%06d.png"),
       "-i", wav,
       "-c:v", "libx264", "-preset", "slow", "-crf", "17",
       "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k",
       str(OUT))

    soc = str(CONT / "marketing" / "trailer-social.mp4")
    print("Encoding social cut (1280w)...")
    ff("-i", str(OUT), "-vf", "scale=1280:-2",
       "-c:v", "libx264", "-preset", "slow", "-crf", "19",
       "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", soc)

    gif = str(CONT / "marketing" / "trailer.gif")
    print("Generating GIF (15fps, 960w)...")
    ff("-i", str(OUT),
       "-vf", "fps=15,scale=960:-2:flags=lanczos,"
              "split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
       gif)

    # Scene 3 starts at (210+285)/30=16.5s, Scene 4 at (210+285+285)/30=26.0s
    # Scene 5 at (210+285+285+210)/30=33.0s
    clips = [
        ("panic-clip.mp4", "16.5", "9.5"),
        ("pugsy-clip.mp4", "26.0", "7.0"),
        ("split-clip.mp4", "33.0", "13.5"),
    ]
    for name, start, dur in clips:
        ff("-ss", start, "-t", dur, "-i", str(OUT),
           "-c:v", "libx264", "-preset", "fast", "-crf", "22",
           "-pix_fmt", "yuv420p",
           str(CONT / "marketing" / name))

    print()
    for p in [OUT, Path(soc), Path(gif)] + [CONT/"marketing"/n for n, _, _ in clips]:
        if p.exists():
            print(f"  {p.name:<40} {p.stat().st_size // 1024}KB")

    print()
    print("Add music in post:")
    print("  ffmpeg -i trailer.mp4 -i music.mp3 -filter_complex "
          '"[1]volume=0.4[m];[0:a][m]amerge" -ac 2 trailer-final.mp4')


if __name__ == "__main__":
    main()
