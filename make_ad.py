#!/usr/bin/env python3
"""
goodboy-claude advertisement video.
Uses real pixel-art dog sprites from sprites/{persona}/{mood}.jpg
Sequence: hero banner → pack intro → 3 persona reactions → deploy gate → outro
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import subprocess, os, math

W, H   = 1280, 720
FPS    = 30
OUT    = "/tmp/goodboy_ad_frames"
MONO   = "/System/Library/Fonts/SFNSMono.ttf"

BG     = (14, 14, 20)
DIM    = (38, 40, 54)
FG     = (240, 240, 235)
MUTED  = (90, 95, 120)
GREEN  = (80, 250, 123)
RED    = (255, 85,  85)

PERSONA_COLORS = {
    "goldie": (241, 196,  15),
    "byte":   ( 52, 152, 219),
    "shiba":  (230, 126,  34),
    "pugsy":  (155,  89, 182),
    "nova":   (200, 210, 220),
    "debug":  ( 46, 204, 113),
}

REACTIONS = [
    {
        "persona": "goldie",
        "event":   "rm -rf / detected",
        "mood":    "alarmed",
        "quip":    "WAIT WAIT WAIT that's the whole filesystem!!",
        "badge_color": RED,
    },
    {
        "persona": "shiba",
        "event":   "deployed to production",
        "mood":    "excited",
        "quip":    "shipped. you're welcome.",
        "badge_color": GREEN,
    },
    {
        "persona": "byte",
        "event":   "3 errors in a row",
        "mood":    "judgy",
        "quip":    "error rate: 100%. intervention recommended.",
        "badge_color": RED,
    },
]

os.makedirs(OUT, exist_ok=True)

def fnt(size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(MONO, size)
    except:
        return ImageFont.load_default()

def ease_out(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3

def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t

def blend(base: Image.Image, over: Image.Image, alpha: float) -> Image.Image:
    base = base.convert("RGBA")
    over = over.convert("RGBA")
    r, g, b, a = over.split()
    a = a.point(lambda p: int(p * alpha))
    over = Image.merge("RGBA", (r, g, b, a))
    base.paste(over, (0, 0), over)
    return base.convert("RGB")

def fit(img: Image.Image, tw: int, th: int) -> Image.Image:
    iw, ih = img.size
    scale  = max(tw / iw, th / ih)
    nw, nh = int(iw * scale), int(ih * scale)
    img    = img.resize((nw, nh), Image.LANCZOS)
    x, y   = (nw - tw) // 2, (nh - th) // 2
    return img.crop((x, y, x + tw, y + th))

def dark(img: Image.Image, strength: float = 0.45) -> Image.Image:
    overlay = Image.new("RGBA", img.size, (0, 0, 0, int(255 * strength)))
    out = img.convert("RGBA")
    out.paste(overlay, mask=overlay)
    return out.convert("RGB")

def base() -> Image.Image:
    return Image.new("RGB", (W, H), BG)

def load_sprite(persona: str, mood: str, scale: int = 4) -> Image.Image | None:
    for ext in ("jpg", "png"):
        p = f"sprites/{persona}/{mood}.{ext}"
        if os.path.exists(p):
            img = Image.open(p).convert("RGBA")
            w, h = img.size
            return img.resize((w * scale, h * scale), Image.NEAREST)
    return None

def load_hero(persona: str) -> Image.Image | None:
    p = f"sprites/{persona}/hero.png"
    if os.path.exists(p):
        return Image.open(p).convert("RGBA")
    return None

def text_center(draw: ImageDraw.ImageDraw, text: str, y: int, size: int,
                color: tuple, img_w: int = W) -> None:
    f = fnt(size)
    bbox = draw.textbbox((0, 0), text, font=f)
    x = (img_w - (bbox[2] - bbox[0])) // 2
    draw.text((x, y), text, font=f, fill=color)

def draw_badge(draw: ImageDraw.ImageDraw, text: str, cx: int, y: int,
               color: tuple, size: int = 20) -> None:
    f = fnt(size)
    bbox = draw.textbbox((0, 0), text, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    px, py = 20, 10
    bw, bh = tw + px * 2, th + py * 2
    bx = cx - bw // 2
    draw.rounded_rectangle([bx, y, bx + bw, y + bh], radius=8,
                           fill=(*color[:3], 30), outline=color, width=2)
    draw.text((bx + px, y + py), text, font=f, fill=color)

def draw_quip_box(draw: ImageDraw.ImageDraw, text: str, cx: int, y: int,
                  color: tuple, max_w: int = 740) -> int:
    f = fnt(24)
    words = text.split()
    lines, cur = [], ""
    for w in words:
        test = (cur + " " + w).strip()
        bbox = draw.textbbox((0, 0), test, font=f)
        if bbox[2] - bbox[0] > max_w - 60:
            if cur:
                lines.append(cur)
            cur = w
        else:
            cur = test
    if cur:
        lines.append(cur)
    lh     = 36
    bh     = len(lines) * lh + 44
    bw     = max_w
    bx     = cx - bw // 2
    draw.rounded_rectangle([bx, y, bx + bw, y + bh], radius=14,
                           fill=DIM, outline=color, width=2)
    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=f)
        lw = bbox[2] - bbox[0]
        draw.text((cx - lw // 2, y + 22 + i * lh), line, font=f, fill=FG)
    return bh

# ── SLIDE BUILDERS ────────────────────────────────────────────────────

def slide_image(path: str, alpha: float = 1.0, darkness: float = 0.0) -> Image.Image:
    img = Image.open(path).convert("RGB")
    img = fit(img, W, H)
    if darkness > 0:
        img = dark(img, darkness)
    fr  = base()
    return blend(fr, img, alpha)

def slide_reaction(persona: str, event: str, mood: str, quip: str,
                   badge_color: tuple, t: float) -> Image.Image:
    color = PERSONA_COLORS[persona]
    fr    = base()

    # Subtle radial glow behind dog
    glow = Image.new("RGB", (W, H), BG)
    gd   = ImageDraw.Draw(glow)
    for r in range(260, 0, -10):
        alpha_v = int(18 * (1 - r / 260))
        gd.ellipse([(W // 2 - r, 240 - r // 2), (W // 2 + r, 240 + r + r // 2)],
                   fill=(*color[:3],))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=40))
    fr = blend(fr, glow, 0.35)

    draw = ImageDraw.Draw(fr)

    # Phase 1 (0→0.33): persona name fades in from top
    p1 = ease_out(t * 3)
    name_y = int(30 + (1 - p1) * -30)
    f_name = fnt(68)
    bbox = draw.textbbox((0, 0), persona.upper(), font=f_name)
    nw = bbox[2] - bbox[0]
    draw.text(((W - nw) // 2, name_y), persona.upper(),
              font=f_name, fill=(*color, int(255 * p1)))

    # Hero portrait (fades in with phase 1)
    hero = load_hero(persona)
    if hero and p1 > 0.05:
        hw = int(min(hero.size[0], 520))
        hh = int(hero.size[1] * hw / hero.size[0])
        hero_r = hero.resize((hw, hh), Image.LANCZOS)
        hx = W // 2 - hw // 2
        hy = 118
        r_, g_, b_, a_ = hero_r.split()
        a_ = a_.point(lambda p: min(p, int(255 * p1)))
        hero_r = Image.merge("RGBA", (r_, g_, b_, a_))
        fr.paste(hero_r, (hx, hy), hero_r)

    # Phase 2 (0.3→0.6): event badge slides in from right
    p2 = ease_out(max(0.0, (t - 0.3) / 0.3))
    if p2 > 0.02:
        badge_x = int(W // 2 + (1 - p2) * 400)
        draw2 = ImageDraw.Draw(fr)
        draw_badge(draw2, f"⚡  {event}", badge_x, 390, badge_color, 22)

    # Phase 3 (0.5→0.75): mood sprite pops in (replaces hero area slightly)
    p3 = ease_out(max(0.0, (t - 0.5) / 0.25))
    if p3 > 0.05:
        sprite = load_sprite(persona, mood, scale=5)
        if sprite:
            sw, sh = sprite.size
            sx = W // 2 - sw // 2
            sy = 420 - sh // 2
            r_, g_, b_, a_ = sprite.split()
            a_ = a_.point(lambda p: min(p, int(255 * p3)))
            sprite = Image.merge("RGBA", (r_, g_, b_, a_))
            fr.paste(sprite, (sx, sy), sprite)

    # Phase 4 (0.7→1.0): quip box appears
    p4 = ease_out(max(0.0, (t - 0.7) / 0.3))
    if p4 > 0.05:
        qfr = base()
        qd  = ImageDraw.Draw(qfr)
        draw_quip_box(qd, f'"{quip}"', W // 2, 530, color)
        fr = blend(fr, qfr, p4)

    # Bottom accent bar
    draw3 = ImageDraw.Draw(fr)
    bar_w = int(W * p1)
    draw3.line([(W // 2 - bar_w // 2, H - 6),
                (W // 2 + bar_w // 2, H - 6)], fill=color, width=5)

    return fr

def slide_outro(t: float) -> Image.Image:
    fr   = base()
    draw = ImageDraw.Draw(fr)

    p1 = ease_out(min(t * 2, 1.0))

    # Title
    text_center(draw, "goodboy-claude", 160, 58, (*FG, int(255 * p1)))
    text_center(draw, "a tamagotchi for your terminal", 236, 24, (*MUTED, int(255 * p1)))

    # Install command box
    p2 = ease_out(max(0.0, (t - 0.3) / 0.4))
    if p2 > 0.02:
        cmd = "npm install -g @terminaldogs/goodboy-claude"
        f   = fnt(28)
        bbox = draw.textbbox((0, 0), cmd, font=f)
        cw  = bbox[2] - bbox[0]
        pad = 28
        bx  = W // 2 - cw // 2 - pad
        by  = 300
        draw.rounded_rectangle([bx, by, bx + cw + pad * 2, by + 58],
                               radius=12, fill=DIM)
        draw.text((W // 2 - cw // 2, by + 14), cmd,
                  font=f, fill=(*GREEN, int(255 * p2)))

    # Links
    p3 = ease_out(max(0.0, (t - 0.6) / 0.3))
    if p3 > 0.02:
        text_center(draw, "npmjs.com/package/@terminaldogs/goodboy-claude", 390, 18,
                    (*MUTED, int(200 * p3)))

    # 6-dog sprite lineup at bottom
    p4 = ease_out(max(0.0, (t - 0.45) / 0.4))
    PERSONAS = ["goldie", "byte", "shiba", "pugsy", "nova", "debug"]
    slot = W // len(PERSONAS)
    for i, persona in enumerate(PERSONAS):
        sp = load_sprite(persona, "happy", scale=3)
        if sp and p4 > 0.02:
            sw, sh = sp.size
            sx = i * slot + slot // 2 - sw // 2
            sy = H - sh - 55
            r_, g_, b_, a_ = sp.split()
            a_ = a_.point(lambda px: min(px, int(255 * p4)))
            sp = Image.merge("RGBA", (r_, g_, b_, a_))
            fr.paste(sp, (sx, sy), sp)
            # Name label
            c = PERSONA_COLORS[persona]
            fn = fnt(16)
            bbox = draw.textbbox((0, 0), persona, font=fn)
            lw = bbox[2] - bbox[0]
            draw.text((i * slot + slot // 2 - lw // 2, H - 34),
                      persona, font=fn, fill=(*c, int(200 * p4)))

    return fr

# ── TIMELINE ──────────────────────────────────────────────────────────

def crossfade(a: Image.Image, b_fn, frames: int = 18):
    for i in range(frames):
        t = i / frames
        b = b_fn(0.001)
        yield blend(a, b, t)

def timeline():
    frames: list[Image.Image] = []

    def emit(img: Image.Image):
        frames.append(img)

    # 1. Hero banner (0-2.5s = 75f)
    banner_frames = []
    for i in range(75):
        alpha = ease_out(min(i / 20, 1.0))
        f = slide_image("sprites/hero-banner.png", alpha=alpha, darkness=0.12)
        banner_frames.append(f)
        emit(f)

    # 2. Crossfade → pick-companion (15f), hold 2.5s (75f)
    companion = fit(Image.open("sprites/pick-companion.png").convert("RGB"), W, H)
    for f in crossfade(banner_frames[-1], lambda _: companion):
        emit(f)
    for _ in range(75):
        emit(companion)

    # 3-5. Reaction cards (each: 15f crossfade + 90f hold)
    prev = companion
    for rx in REACTIONS:
        first = slide_reaction(t=0.001, **rx)
        for f in crossfade(prev, lambda _, r=rx: slide_reaction(t=0.001, **r)):
            emit(f)
        rx_frames = []
        for i in range(90):
            t = min(i / 55, 1.0)
            f = slide_reaction(t=t, **rx)
            rx_frames.append(f)
            emit(f)
        prev = rx_frames[-1]

    # 6. Deploy gate (15f crossfade, 2.5s hold)
    gate = fit(Image.open("sprites/deploy-gate.png").convert("RGB"), W, H)
    for f in crossfade(prev, lambda _: gate):
        emit(f)
    for _ in range(75):
        emit(gate)

    # 7. Outro (15f crossfade, 3s)
    outro0 = slide_outro(0.001)
    for f in crossfade(gate, lambda _: slide_outro(0.001)):
        emit(f)
    for i in range(90):
        t = i / 60
        emit(slide_outro(min(t, 1.0)))

    return frames

# ── RENDER ────────────────────────────────────────────────────────────
print("Building timeline...")
all_frames = timeline()
total = len(all_frames)
print(f"Rendering {total} frames at {FPS}fps ({total/FPS:.1f}s)...")

for i, frame in enumerate(all_frames):
    frame.save(os.path.join(OUT, f"{i:05d}.png"))
    if i % 30 == 0:
        print(f"  {i}/{total}", end="\r", flush=True)

print(f"\nEncoding mp4...")
subprocess.run([
    "ffmpeg", "-y", "-framerate", str(FPS),
    "-i", f"{OUT}/%05d.png",
    "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-crf", "18", "-preset", "slow",
    "demo-ad.mp4"
], check=True, capture_output=True)

print("Generating GIF...")
subprocess.run([
    "ffmpeg", "-y", "-i", "demo-ad.mp4",
    "-vf", "fps=20,scale=960:-1:flags=lanczos,split[s0][s1];"
           "[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer",
    "-loop", "0", "demo-ad.gif"
], check=True, capture_output=True)

mp4_kb = os.path.getsize("demo-ad.mp4") // 1024
gif_kb = os.path.getsize("demo-ad.gif") // 1024
print(f"demo-ad.mp4  {mp4_kb}KB\ndemo-ad.gif  {gif_kb}KB\nDone.")
