#!/usr/bin/env python3
"""
goodboy — launch trailer
1920x1080 · 30fps · 27s · 10 scenes

Audio note: synthetic SFX baked in.
Add a synthwave/chiptune music bed in post (ffmpeg -i trailer.mp4 -i music.mp3 ...).
"""
from PIL import Image, ImageDraw, ImageFont, ImageChops, ImageFilter
import subprocess, os, random, math, struct, wave as wavemod

ROOT   = os.path.join(os.path.dirname(__file__), "../..")
SPR    = os.path.join(ROOT, "sprites")
FONTS  = os.path.join(ROOT, "content")
OUT    = "/tmp/gb_trailer"
TMP    = "/tmp/gb_audio"

W, H   = 1920, 1080
FPS    = 30
CHROME = 42   # terminal title bar height

os.makedirs(OUT, exist_ok=True)
os.makedirs(TMP, exist_ok=True)
random.seed(42)

# ── FONTS ──────────────────────────────────────────────────────────────
JB_REG  = os.path.join(FONTS, "JetBrainsMono-Regular.ttf")
JB_BOLD = os.path.join(FONTS, "JetBrainsMono-Bold.ttf")
JB_XB   = os.path.join(FONTS, "JetBrainsMono-ExtraBold.ttf")

_font_cache = {}
def fnt(size, weight="regular"):
    key = (size, weight)
    if key not in _font_cache:
        path = JB_XB if weight == "xbold" else (JB_BOLD if weight == "bold" else JB_REG)
        try:
            _font_cache[key] = ImageFont.truetype(path, size)
        except:
            _font_cache[key] = ImageFont.load_default()
    return _font_cache[key]

# ── PALETTE ───────────────────────────────────────────────────────────
BG      = (13,  13,  23)
TERM    = (22,  22,  30)
CHROME_BG = (30, 31, 40)
MUTED   = (139, 148, 158)
FG      = (230, 237, 243)
GREEN   = (63,  185,  80)
RED     = (248,  81,  73)
YELLOW  = (210, 153,  34)
BLUE    = (88,  166, 255)

COLORS  = {
    "goldie": (241, 196,  15),
    "byte":   ( 88, 166, 255),
    "shiba":  (230, 126,  34),
    "pugsy":  (170, 100, 220),
    "nova":   (180, 200, 230),
    "debug":  ( 63, 185,  80),
}

# ── CORE UTILS ────────────────────────────────────────────────────────
def eo(t): return 1-(1-max(0.,min(1.,t)))**3
def ei(t): return max(0.,min(1.,t))**3
def ph(t,a,b): return max(0.,min(1.,(t-a)/max(b-a,1e-6)))
def lerp(a,b,t): return a+(b-a)*max(0.,min(1.,t))

def base(color=BG):
    return Image.new("RGB", (W, H), color)

def tw(draw, text, f):
    bb = draw.textbbox((0,0), text, font=f)
    return bb[2]-bb[0]

def th(draw, text, f):
    bb = draw.textbbox((0,0), text, font=f)
    return bb[3]-bb[1]

def blend(a, b, alpha):
    a,b = a.convert("RGBA"), b.convert("RGBA")
    r,g,bl,ch = b.split()
    ch = ch.point(lambda p: int(p*max(0.,min(1.,alpha))))
    b = Image.merge("RGBA",(r,g,bl,ch))
    a.paste(b,(0,0),b)
    return a.convert("RGB")

# ── SPRITE LOADER ─────────────────────────────────────────────────────
_spr_cache = {}
def load_spr(persona, mood, scale):
    key = (persona, mood, scale)
    if key not in _spr_cache:
        for ext in ("jpg","png"):
            p = os.path.join(SPR, persona, f"{mood}.{ext}")
            if os.path.exists(p):
                img = Image.open(p).convert("RGBA")
                nw,nh = img.size[0]*scale, img.size[1]*scale
                img = img.resize((nw,nh), Image.NEAREST)
                r,g,b,a = img.split()
                mx = ImageChops.lighter(ImageChops.lighter(r,g),b)
                mask = mx.point(lambda p: 255 if p>38 else 0)
                img.putalpha(mask)
                _spr_cache[key] = img
                break
        else:
            _spr_cache[key] = None
    return _spr_cache[key]

def paste_spr(base_img, sprite, cx, cy, alpha=1., bob_y=0):
    if not sprite: return
    sp = sprite
    if alpha < 1.:
        r,g,b,a = sp.split()
        a = a.point(lambda p: int(p*alpha))
        sp = Image.merge("RGBA",(r,g,b,a))
    x = cx - sp.width//2
    y = cy - sp.height//2 + bob_y
    base_img.paste(sp, (x,y), sp)

def bob(t, amp=4, freq=1.8):
    return int(amp * math.sin(t * freq * 2 * math.pi))

# ── VISUAL FX ─────────────────────────────────────────────────────────
_scanline = None
def get_scanline():
    global _scanline
    if _scanline is None:
        sl = Image.new("RGBA", (W, H), (0,0,0,0))
        sd = ImageDraw.Draw(sl)
        for y in range(0, H, 3):
            sd.line([(0,y),(W,y)], fill=(0,0,0,28))
        _scanline = sl
    return _scanline

def apply_crt(frame):
    out = frame.convert("RGBA")
    out.paste(get_scanline(), (0,0), get_scanline())
    return out.convert("RGB")

def apply_vignette(frame, strength=0.45):
    vig = Image.new("RGBA", (W, H), (0,0,0,0))
    vd  = ImageDraw.Draw(vig)
    steps = 80
    for i in range(steps, 0, -1):
        r = int(min(W, H) * i / steps * 0.72)
        a = int(255 * strength * (1 - i/steps)**1.8)
        rx, ry = W//2 - r, H//2 - r*H//W
        vd.ellipse([rx,ry, W-rx, H-ry], fill=(0,0,0,a))
    out = frame.convert("RGBA")
    out.paste(vig, (0,0), vig)
    return out.convert("RGB")

_noise_frames = {}
def apply_noise(frame, frame_idx, amount=6):
    if frame_idx not in _noise_frames:
        nx = Image.new("RGBA",(W,H),(0,0,0,0))
        nd = ImageDraw.Draw(nx)
        for _ in range(int(W*H*0.0006)):
            x,y = random.randint(0,W-1), random.randint(0,H-1)
            v = random.randint(180,255)
            a = random.randint(8,20)
            nd.point([(x,y)], fill=(v,v,v,a))
        _noise_frames[frame_idx % 8] = nx
    n = _noise_frames[frame_idx % 8]
    out = frame.convert("RGBA")
    out.paste(n,(0,0),n)
    return out.convert("RGB")

def apply_shake(frame, magnitude):
    if magnitude == 0: return frame
    dx = random.randint(-magnitude, magnitude)
    dy = random.randint(-magnitude, magnitude)
    out = base()
    out.paste(frame, (dx, dy))
    return out

def add_glow(frame, cx, cy, color, radius=240, strength=0.32):
    g = Image.new("RGB",(W,H),BG)
    gd = ImageDraw.Draw(g)
    r2,g2,b2 = color[:3]
    for rad in range(radius,0,-10):
        fact = (1-rad/radius)**2.2
        gd.ellipse([cx-rad, cy-int(rad*0.68), cx+rad, cy+int(rad*0.68)],
                   fill=(int(r2*fact), int(g2*fact), int(b2*fact)))
    g = g.filter(ImageFilter.GaussianBlur(radius//3))
    out = Image.blend(frame.convert("RGB"), g, strength)
    frame.paste(out)

# ── TERMINAL CHROME ───────────────────────────────────────────────────
def draw_chrome(frame, title="goodboy — zsh"):
    d = ImageDraw.Draw(frame)
    # Title bar
    d.rectangle([(0,0),(W,CHROME)], fill=CHROME_BG)
    d.line([(0,CHROME),(W,CHROME)], fill=(40,42,54), width=1)
    # Traffic lights
    for i,(col) in enumerate([(255,95,87),(255,189,68),(39,201,63)]):
        cx = 20 + i*22
        d.ellipse([cx-6,CHROME//2-6,cx+6,CHROME//2+6], fill=col)
    # Title text
    f = fnt(14)
    lw = tw(d, title, f)
    d.text(((W-lw)//2, (CHROME-th(d,title,f))//2), title, font=f, fill=MUTED)

# ── SPEECH BUBBLE ─────────────────────────────────────────────────────
def bubble(draw, text, cx, y, color, size=28, max_w=560):
    f = fnt(size)
    words = text.split()
    lines, cur = [], ""
    for word in words:
        test = (cur+" "+word).strip()
        if tw(draw,test,f) > max_w-44:
            if cur: lines.append(cur)
            cur = word
        else: cur = test
    if cur: lines.append(cur)
    lh = size+12
    bw = max(tw(draw,l,f) for l in lines)+44
    bh = len(lines)*lh+28
    bx = cx-bw//2
    r2,g2,b2 = color[:3]
    draw.rounded_rectangle([bx,y,bx+bw,y+bh], radius=12,
                            fill=(r2,g2,b2,18), outline=(r2,g2,b2,210), width=2)
    for i,line in enumerate(lines):
        lw2 = tw(draw,line,f)
        draw.text((cx-lw2//2, y+14+i*lh), line, font=f, fill=FG)
    return y+bh

def term_text(draw, lines, x, y, size=30, line_gap=8):
    """Render terminal-style text block with syntax coloring."""
    f = fnt(size)
    lh = size+line_gap
    for i, line in enumerate(lines):
        col = FG
        if line.startswith("$"): col = (120,220,120)
        elif line.startswith("Error") or "failed" in line.lower() or line.startswith("✗"): col = RED
        elif line.startswith("✓") or "success" in line.lower(): col = GREEN
        elif line.startswith("#") or line.startswith(">"): col = MUTED
        draw.text((x, y+i*lh), line, font=f, fill=col)

def post(frame, frame_idx, shake=0):
    """Apply CRT, noise, vignette, optional shake."""
    if shake: frame = apply_shake(frame, shake)
    frame = apply_crt(frame)
    frame = apply_noise(frame, frame_idx)
    frame = apply_vignette(frame, 0.38)
    return frame

# ═══════════════════════════════════════════════════════════════════════
# SCENES
# ═══════════════════════════════════════════════════════════════════════

# ── SCENE 1 — COLD OPEN (60f / 2s) ───────────────────────────────────
TEXT1 = "your terminal is emotionally unavailable."

def scene_cold_open(t, fidx):
    fr = base()
    draw = ImageDraw.Draw(fr)
    draw_chrome(fr, "zsh — goodboy")
    # Subtle ambient glow center
    cx,cy = W//2, H//2+60
    add_glow(fr, cx, cy, (30,30,80), radius=300, strength=0.06)
    # Typewriter
    n = int(ph(t,0.0,0.68)*len(TEXT1))
    blink_on = int(t*FPS) % (FPS//2) < FPS//4
    cursor = "▋" if (n < len(TEXT1) or blink_on) else ""
    display = TEXT1[:n]+cursor
    f = fnt(46,"regular")
    lw = tw(draw, TEXT1, f)
    draw.text(((W-lw)//2, H//2-22), display, font=f, fill=(*FG,int(255*eo(ph(t,0.,0.12)))))
    return post(fr, fidx)

# ── SCENE 2 — GOLDIE INTRO (75f / 2.5s) ──────────────────────────────
def scene_goldie(t, fidx):
    fr = base()
    draw = ImageDraw.Draw(fr)
    draw_chrome(fr)
    p1 = eo(ph(t,0.,0.45))
    add_glow(fr, W//2, H//2+60, COLORS["goldie"], radius=280, strength=0.28*p1)
    # Dog slides in from right
    sp = load_spr("goldie","happy",7)
    if sp:
        slide_x = int(lerp(W+sp.width//2, W//2, p1))
        b = bob(t,4,1.8)
        paste_spr(fr, sp, slide_x, H//2+80, p1, b)
    # Bubble
    p2 = eo(ph(t,0.42,0.75))
    if p2>0.02:
        bfr = base()
        bd = ImageDraw.Draw(bfr)
        bubble(bd,"GOOD MORNING!! ready to build something amazing!!",
               W//2, CHROME+28, COLORS["goldie"], size=30, max_w=720)
        fr = blend(fr, bfr, p2)
    # Logo
    p3 = eo(ph(t,0.68,0.96))
    if p3>0.02:
        d2 = ImageDraw.Draw(fr)
        f_logo = fnt(58,"bold")
        logo = "goodboy"
        lw = tw(d2,logo,f_logo)
        d2.text(((W-lw)//2, H-112), logo, font=f_logo, fill=(*FG,int(255*p3)))
        f_sub = fnt(22)
        sub = "a tamagotchi for your terminal"
        sw = tw(d2,sub,f_sub)
        d2.text(((W-sw)//2, H-50), sub, font=f_sub, fill=(*MUTED,int(255*p3)))
        # Sparkles around logo
        for i in range(6):
            angle = i*60+t*120
            sx = W//2 + int(220*math.cos(math.radians(angle)))
            sy = H-80 + int(30*math.sin(math.radians(angle)))
            spark_alpha = int(200*p3*abs(math.sin(t*3+i)))
            sz = 3
            d2.ellipse([sx-sz,sy-sz,sx+sz,sy+sz], fill=(*COLORS["goldie"],spark_alpha))
    return post(fr, fidx)

# ── SCENE 3 — RM-RF SLAM (105f / 3.5s) ────────────────────────────────
# 0.00-0.36: slow typing   (108f)
# 0.36-0.44: silence pause (24f)
# 0.44-1.00: SLAM          (168f)
CMD3 = "$ rm -rf /"

def scene_rmrf(t, fidx):
    # Shake magnitude ramps up at slam
    shake = 0
    if t > 0.44:
        shake_t = ph(t,0.44,0.60)
        shake = int(lerp(0,9, eo(shake_t)) if shake_t<0.5 else lerp(9,0,(shake_t-0.5)*2))

    fr = base()
    draw = ImageDraw.Draw(fr)
    draw_chrome(fr, "bash — dangerous territory")

    if t < 0.44:
        # Terminal history (dim, above cmd)
        history = [
            "# deploying to prod",
            "$ git push origin main",
            "Everything up-to-date",
            "$ cd /",
        ]
        hf = fnt(24)
        for i,line in enumerate(history):
            col = MUTED if not line.startswith("$") else (100,200,100)
            draw.text((W//2-220, CHROME+60+i*34), line, font=hf, fill=col)

        n = int(ph(t,0.,0.36)*len(CMD3))
        blink = (t>=0.36) or (int(t*FPS)%(FPS//3)<FPS//6)
        display = CMD3[:n]+("▋" if blink else "")
        f = fnt(56,"bold")
        full_w = tw(draw, CMD3, f)
        tx = (W-full_w)//2
        ty = H//2-28

        # Highlight box on the dangerous path
        if n >= len(CMD3)-1:
            rw = tw(draw, "/", fnt(56,"bold"))
            rx = tx + tw(draw, CMD3[:-1], fnt(56,"bold"))
            draw.rectangle([rx-4, ty-4, rx+rw+4, ty+58], fill=(*RED, 40))

        draw.text((tx,ty), display, font=f, fill=(120,230,120))

    else:
        # SLAM
        slam_t = ph(t,0.44,0.62)
        add_glow(fr, W//2, H//2, RED, radius=480, strength=0.55*eo(slam_t))
        # Red tint flash at cut point
        if slam_t < 0.25:
            flash = Image.new("RGB",(W,H),(90,0,0))
            fr = blend(fr, flash, 0.4*(1-slam_t/0.25))
        # Goldie alarmed — massive
        sp = load_spr("goldie","alarmed",8)
        if sp:
            da = eo(ph(t,0.44,0.54))
            b = bob(t,3,3)*int(t>0.7)
            paste_spr(fr, sp, W//2, H//2+60, da, b)
        # Quip
        p_q = eo(ph(t,0.60,0.82))
        if p_q>0.02:
            bfr = base()
            bd = ImageDraw.Draw(bfr)
            bubble(bd,"WAIT WAIT WAIT THAT IS THE WHOLE FILESYSTEM!!",
                   W//2, CHROME+24, COLORS["goldie"], size=32, max_w=880)
            fr = blend(fr, bfr, p_q)

        # Screen distortion lines (UI flicker at slam)
        if shake>0:
            fd = ImageDraw.Draw(fr)
            for _ in range(3):
                ly = random.randint(CHROME, H)
                fd.line([(0,ly),(W,ly)], fill=(*RED, random.randint(40,120)), width=1)

    return post(fr, fidx, shake)

# ── SCENE 4 — BYTE ERROR STREAK (75f / 2.5s) ─────────────────────────
ERRORS = [
    "Error: Cannot read properties of undefined (reading 'map')",
    "Error: Module not found: Cannot resolve './api/client'",
    "Error: Expected 2 arguments, but got 3.  ts(2554)",
]

def scene_byte(t, fidx):
    fr = base()
    draw = ImageDraw.Draw(fr)
    draw_chrome(fr, "bash — 3 errors")

    p1 = eo(ph(t,0.,0.42))

    # Error log panel (left 55%)
    PANEL_W = int(W*0.55)
    pd = ImageDraw.Draw(fr)
    pd.rectangle([(0,CHROME),(PANEL_W,H)], fill=(18,12,12))
    pd.line([(PANEL_W,CHROME),(PANEL_W,H)], fill=(50,30,30), width=1)

    # Errors stack in one by one
    ef = fnt(24)
    for i,err in enumerate(ERRORS):
        err_p = eo(ph(t, i*0.18, i*0.18+0.22))
        if err_p<0.02: continue
        ey = CHROME+60+i*90
        # Red indicator
        draw.rectangle([(16,ey-2),(20,ey+32)], fill=(*RED,int(220*err_p)))
        draw.text((30,ey), err, font=ef, fill=(*RED,int(255*err_p)))
        # Stack trace (dim)
        tf = fnt(20)
        draw.text((30,ey+36), f"  at Object.<anonymous> (src/index.ts:{140+i*12}:{8})",
                  font=tf, fill=(*MUTED,int(180*err_p)))

    # Error count badge
    p_badge = eo(ph(t,0.32,0.58))
    if p_badge>0.02:
        bf = fnt(18)
        badge = "● 3 errors"
        bw = tw(draw,badge,bf)
        draw.rounded_rectangle([PANEL_W-bw-28, CHROME+10, PANEL_W-4, CHROME+36],
                                radius=4, fill=(90,20,20))
        draw.text((PANEL_W-bw-14, CHROME+12), badge, font=bf, fill=RED)

    # Byte on right side
    sp = load_spr("byte","judgy",6)
    if sp:
        add_glow(fr, W*3//4, H//2+40, COLORS["byte"], radius=200, strength=0.2*p1)
        b = bob(t,3,1.6)
        paste_spr(fr, sp, W*3//4, H//2+60, p1, b)

    p2 = eo(ph(t,0.48,0.80))
    if p2>0.02:
        bfr = base()
        bd = ImageDraw.Draw(bfr)
        bubble(bd,"error streak detected. this is not going well.",
               W*3//4, CHROME+28, COLORS["byte"], size=26, max_w=560)
        fr = blend(fr, bfr, p2)

    return post(fr, fidx)

# ── SCENE 5 — PUGSY 2:47 AM (60f / 2s) ───────────────────────────────
def scene_pugsy(t, fidx):
    fr = Image.new("RGB",(W,H),(8,8,14))
    draw = ImageDraw.Draw(fr)
    draw_chrome(fr, "zsh — 02:47")

    p1 = eo(ph(t,0.,0.4))

    # Clock — dim, top-right
    f_clock = fnt(28)
    draw.text((W-160, CHROME+16), "02:47", font=f_clock, fill=(*MUTED,int(140*p1)))

    # Very dim terminal history suggests a long session
    hf = fnt(20)
    dim_lines = [
        "$ pytest tests/ --coverage",
        "...................................................",
        "58 passed in 241.3s",
        "$ git add -A && git commit -m 'fix: finally'",
        "$ npm run build",
    ]
    for i,line in enumerate(dim_lines):
        alpha = int(50*p1*(1-i*0.1))
        draw.text((60, CHROME+50+i*32), line, font=hf, fill=(*MUTED,alpha))

    # Pugsy — slow bob, sleepy
    sp = load_spr("pugsy","sleepy",6)
    if sp:
        add_glow(fr, W//2, H//2+40, COLORS["pugsy"], radius=160, strength=0.15*p1)
        slow_b = int(3*math.sin(t*0.8*2*math.pi))
        paste_spr(fr, sp, W//2, H//2+60, p1, slow_b)

    p2 = eo(ph(t,0.50,0.82))
    if p2>0.02:
        bfr = Image.new("RGB",(W,H),(8,8,14))
        bd = ImageDraw.Draw(bfr)
        bubble(bd, "go. sleep.", W//2, CHROME+28, COLORS["pugsy"], size=34, max_w=320)
        fr = blend(fr, bfr, p2)

    return post(fr, fidx)

# ── SCENE 6 — SHIBA DEPLOY (75f / 2.5s) ──────────────────────────────
DEPLOY_LINES = [
    "$ fly deploy",
    "> authenticating...",
    "> building image...",
    "> pushing to registry...",
    "> scaling machines...",
    "✓  deployed in 12s  →  https://myapp.fly.dev",
]

def scene_shiba(t, fidx):
    fr = base()
    draw = ImageDraw.Draw(fr)
    draw_chrome(fr, "bash — fly deploy")
    p1 = eo(ph(t,0.,0.42))

    # Deploy log panel (left 50%)
    PANEL_W = int(W*0.52)
    pd = ImageDraw.Draw(fr)
    pd.rectangle([(0,CHROME),(PANEL_W,H)], fill=TERM)
    pd.line([(PANEL_W,CHROME),(PANEL_W,H)], fill=(35,50,35), width=1)

    # Lines appear with progress bar feel
    lf = fnt(26)
    for i,line in enumerate(DEPLOY_LINES):
        line_p = eo(ph(t, i*0.1, i*0.1+0.18))
        if line_p<0.02: continue
        col = GREEN if line.startswith("✓") else (MUTED if line.startswith(">") else (120,230,120))
        draw.text((28, CHROME+48+i*54), line, font=lf, fill=(*col,int(255*line_p)))
        # Progress dots for in-flight lines
        if line.startswith(">") and line_p>0.5:
            dots = "." * (int(t*FPS*2)%4)
            dot_x = 28+tw(draw,line,lf)+8
            draw.text((dot_x, CHROME+48+i*54), dots, font=lf, fill=(*MUTED,int(200*line_p)))

    # Green success glow on completion
    if eo(ph(t,0.55,0.75))>0.1:
        add_glow(fr, PANEL_W+int((W-PANEL_W)*0.5), H//2+40, GREEN,
                 radius=200, strength=0.18*eo(ph(t,0.55,0.75)))

    # Shiba
    sp = load_spr("shiba","excited",6)
    if sp:
        b = bob(t,4,2.2)
        paste_spr(fr, sp, PANEL_W+int((W-PANEL_W)*0.5), H//2+60, p1, b)

    p2 = eo(ph(t,0.50,0.82))
    if p2>0.02:
        bfr = base()
        bd = ImageDraw.Draw(bfr)
        bubble(bd, "shipped. you're welcome.",
               PANEL_W+int((W-PANEL_W)*0.5), CHROME+28,
               COLORS["shiba"], size=28, max_w=520)
        fr = blend(fr, bfr, p2)

    return post(fr, fidx)

# ── SCENE 7 — SPLIT SCREEN (120f / 4s) ───────────────────────────────
SPLIT = [
    ("goldie","alarmed","okay!! okay!!\nwe can fix this!!",  COLORS["goldie"], 0.16),
    ("byte",  "judgy",  "predictable\noutcome.",              COLORS["byte"],   0.36),
    ("shiba", "judgy",  "skill issue.",                       COLORS["shiba"],  0.56),
]
PW7 = W//3

def scene_split(t, fidx):
    fr = base()
    draw = ImageDraw.Draw(fr)
    HDR = CHROME+80

    # Title bar (not terminal chrome here — scene has its own header)
    draw_chrome(fr)

    # "DEPLOY FAILED." header slams in
    ph_hdr = eo(ph(t,0.,0.14))
    if ph_hdr>0.01:
        f_hdr = fnt(64,"xbold")
        txt = "DEPLOY FAILED."
        lw = tw(draw,txt,f_hdr)
        # Slight shake on the header text
        sx = (W-lw)//2 + (random.randint(-2,2) if ph_hdr<0.3 else 0)
        draw.text((sx, CHROME+12), txt, font=f_hdr, fill=(*RED,int(255*ph_hdr)))
        draw.line([(0,HDR-4),(W,HDR-4)], fill=(*RED,int(80*ph_hdr)), width=2)

    for i,(persona,mood,quip,color,start) in enumerate(SPLIT):
        pa = eo(ph(t,start,start+0.24))
        if pa<0.02: continue
        cx = i*PW7+PW7//2

        # Panel slide from top
        slide = int((1-pa)*90)
        r2,g2,b2 = color[:3]

        # Panel bg (very subtle color tint)
        tint = Image.new("RGBA",(PW7-3,H-HDR),(r2//10,g2//10,b2//10,int(240*pa)))
        fr.paste(tint.convert("RGB"),(i*PW7+1,HDR),tint)

        # Separator
        if i>0:
            d2 = ImageDraw.Draw(fr)
            d2.line([(i*PW7,HDR),(i*PW7,H)], fill=(*color[:3],int(50*pa)), width=1)

        # Dog
        sp = load_spr(persona,mood,5)
        if sp:
            b = bob(t,4,2+i*0.3)
            dog_cy = HDR+(H-HDR)//2-20+slide
            add_glow(fr, cx, dog_cy, color, radius=160, strength=0.22*pa)
            paste_spr(fr, sp, cx, dog_cy, pa, b)

        # Persona name tab
        d3 = ImageDraw.Draw(fr)
        f_nm = fnt(24,"bold")
        nw2 = tw(d3,persona,f_nm)
        tab_y = H-170+slide
        d3.rounded_rectangle([cx-nw2//2-12,tab_y-4,cx+nw2//2+12,tab_y+30],
                             radius=4, fill=(*color[:3],int(180*pa)))
        d3.text((cx-nw2//2,tab_y), persona, font=f_nm,
                fill=(*BG,int(240*pa)))

        # Quip — each line
        p_q = eo(ph(t,start+0.18,start+0.42))
        if p_q>0.02:
            f_q = fnt(26)
            qlines = quip.split("\n")
            total_h = len(qlines)*(26+12)
            qy = H-120+slide
            for j,qline in enumerate(qlines):
                qlw = tw(d3,qline,f_q)
                d3.text((cx-qlw//2, qy+j*38), qline, font=f_q,
                        fill=(*FG,int(255*p_q)))

    # Bottom tagline
    p_tag = eo(ph(t,0.86,1.0))
    if p_tag>0.02:
        d4 = ImageDraw.Draw(fr)
        f_t = fnt(22)
        tag = "same event. different dog. pick one."
        lw = tw(d4,tag,f_t)
        d4.text(((W-lw)//2, H-22), tag, font=f_t, fill=(*MUTED,int(210*p_tag)))

    return post(fr, fidx)

# ── SCENE 8 — DEPLOY GATE (75f / 2.5s) ───────────────────────────────
def scene_gate(t, fidx):
    img = Image.open(os.path.join(SPR,"deploy-gate.png")).convert("RGB")
    iw,ih = img.size
    scale = max(W/iw, H/ih)
    nw,nh = int(iw*scale), int(ih*scale)
    img = img.resize((nw,nh),Image.LANCZOS)
    img = img.crop(((nw-W)//2,(nh-H)//2,(nw-W)//2+W,(nh-H)//2+H))
    dark = Image.new("RGBA",(W,H),(0,0,0,40))
    out = img.convert("RGBA")
    out.paste(dark,(0,0),dark)
    fr = blend(base(), out.convert("RGB"), eo(ph(t,0.,0.38)))
    return post(fr, fidx)

# ── SCENE 9 — PERSONA GRID (75f / 2.5s) ──────────────────────────────
def scene_grid(t, fidx):
    img = Image.open(os.path.join(SPR,"pick-companion.png")).convert("RGB")
    iw,ih = img.size
    scale = max(W/iw, H/ih)
    nw,nh = int(iw*scale), int(ih*scale)
    img = img.resize((nw,nh),Image.LANCZOS)
    img = img.crop(((nw-W)//2,(nh-H)//2,(nw-W)//2+W,(nh-H)//2+H))
    dark = Image.new("RGBA",(W,H),(0,0,0,80))
    out = img.convert("RGBA")
    out.paste(dark,(0,0),dark)
    fr = blend(base(), out.convert("RGB"), eo(ph(t,0.,0.40)))
    p2 = eo(ph(t,0.44,0.78))
    if p2>0.02:
        d = ImageDraw.Draw(fr)
        f = fnt(40,"bold")
        txt = "6 personalities. pick your poison."
        lw = tw(d,txt,f)
        d.rectangle([(W//2-lw//2-24,H-84),(W//2+lw//2+24,H-26)],fill=(0,0,0,int(170*p2)))
        d.text(((W-lw)//2, H-76), txt, font=f, fill=(*FG,int(255*p2)))
    return post(fr, fidx)

# ── SCENE 10 — CTA (90f / 3s) ────────────────────────────────────────
CTA_INSTALL = "npm install -g @terminaldogs/goodboy-claude"
PERSONAS_ORD = ["goldie","byte","shiba","pugsy","nova","debug"]

def scene_cta(t, fidx):
    # Hero banner as bg (desaturated)
    img = Image.open(os.path.join(SPR,"hero-banner.png")).convert("RGB")
    iw,ih = img.size
    scale = max(W/iw, H/ih)
    nw,nh = int(iw*scale), int(ih*scale)
    img = img.resize((nw,nh),Image.LANCZOS)
    img = img.crop(((nw-W)//2,(nh-H)//2,(nw-W)//2+W,(nh-H)//2+H))
    # Darken significantly
    dark = Image.new("RGBA",(W,H),(0,0,0,160))
    out = img.convert("RGBA")
    out.paste(dark,(0,0),dark)
    fr = blend(base(), out.convert("RGB"), eo(ph(t,0.,0.45)))
    draw = ImageDraw.Draw(fr)

    # Tagline
    p1 = eo(ph(t,0.08,0.34))
    if p1>0.01:
        f = fnt(42,"bold")
        txt = "emotional middleware for developers."
        lw = tw(draw,txt,f)
        draw.text(((W-lw)//2, H//2-140), txt, font=f, fill=(*MUTED,int(255*p1)))

    # npm install — typewriter
    p2 = eo(ph(t,0.28,0.62))
    if p2>0.01:
        f_cmd = fnt(36,"bold")
        n = int(p2*len(CTA_INSTALL))
        full_w = tw(draw, CTA_INSTALL, f_cmd)
        displayed = CTA_INSTALL[:n]
        blink = int(t*FPS)%(FPS//3)<FPS//6
        cursor = "▋" if blink and n<len(CTA_INSTALL) else ""
        draw.rounded_rectangle(
            [(W//2-full_w//2-28,H//2-62),(W//2+full_w//2+28,H//2-4)],
            radius=10, fill=(20,22,30,int(220*p2)), outline=(50,54,70,int(200*p2)), width=1
        )
        draw.text(((W-full_w)//2, H//2-52), displayed+cursor, font=f_cmd, fill=(*GREEN,255))

    # Tagline 2
    p3 = eo(ph(t,0.55,0.82))
    if p3>0.01:
        f2 = fnt(36,"bold")
        txt2 = "pick your dog. ship code together."
        lw2 = tw(draw,txt2,f2)
        draw.text(((W-lw2)//2, H//2+4), txt2, font=f2, fill=(*FG,int(255*p3)))

    # 6-dog strip along bottom
    p4 = eo(ph(t,0.44,0.80))
    if p4>0.02:
        slot = W//6
        for i,persona in enumerate(PERSONAS_ORD):
            sp = load_spr(persona,"happy",4)
            if not sp: continue
            cx = i*slot+slot//2
            cy = H-sp.height//2-44
            b2 = bob(t,4,1.5+i*0.2)
            paste_spr(fr, sp, cx, cy, p4, b2)
            d2 = ImageDraw.Draw(fr)
            fn = fnt(16)
            nw2 = tw(d2,persona,fn)
            d2.text((cx-nw2//2,H-32), persona, font=fn,
                    fill=(*COLORS[persona],int(200*p4)))

    # Bottom accent line
    p5 = eo(ph(t,0.,0.45))
    ll = int(W*0.80*p5)
    draw.line([(W//2-ll//2,H-8),(W//2+ll//2,H-8)], fill=(60,64,90), width=2)

    return post(fr, fidx)

# ═══════════════════════════════════════════════════════════════════════
# AUDIO GENERATION
# ═══════════════════════════════════════════════════════════════════════

def make_audio():
    RATE = 44100
    DUR  = 27.5
    total = int(DUR * RATE)
    audio = [0.0] * total

    def add(data, t_sec):
        s = int(t_sec * RATE)
        for i,v in enumerate(data):
            idx = s+i
            if 0<=idx<total:
                audio[idx] = max(-1.,min(1.,audio[idx]+v))

    def sine_wave(freq, dur, amp=0.3, attack=0.01, release=0.08):
        n = int(dur*RATE)
        out = []
        for i in range(n):
            t2 = i/RATE
            env = 1.0
            if t2<attack: env=t2/attack
            elif t2>dur-release: env=(dur-t2)/release
            out.append(amp*env*math.sin(2*math.pi*freq*t2))
        return out

    def click(amp=0.35):
        n = int(0.025*RATE)
        return [amp*math.exp(-i/RATE*80)*random.uniform(-1,1) for i in range(n)]

    def bass_hit(freq=52, dur=0.55, amp=0.85):
        n = int(dur*RATE)
        out = []
        for i in range(n):
            t2 = i/RATE
            env = math.exp(-t2*7)
            out.append(amp*env*(math.sin(2*math.pi*freq*t2)+0.4*math.sin(2*math.pi*freq*2*t2)))
        return out

    def blip(freq=880, dur=0.06, amp=0.2):
        n = int(dur*RATE)
        return [amp*math.exp(-i/RATE*30)*math.sin(2*math.pi*freq*i/RATE) for i in range(n)]

    def success_chime(base_freq=523):
        out = []
        for i,mult in enumerate([1,1.26,1.5,2.0]):
            seg = sine_wave(base_freq*mult, 0.3, 0.22, 0.01, 0.12)
            for j,v in enumerate(seg):
                idx = int(i*0.08*RATE)+j
                if idx<len(out): out[idx]+=v
                else: out.extend([0.]*(idx-len(out)+1)); out[idx]=v
        return out

    # Ambient hum throughout (very quiet)
    for i in range(total):
        audio[i] += 0.008*math.sin(2*math.pi*60*i/RATE)

    # Scene 1: nothing (near silence)
    # Scene 2: keyboard clicks for Goldie's energy (2.0-2.3s)
    for k in range(4):
        add(click(0.22), 2.0+k*0.08)

    # Scene 3: rm-rf typing (4.5-4.8s)
    cmd_chars = len(CMD3)
    for k in range(cmd_chars):
        add(click(0.30), 4.5+k*(0.3/cmd_chars))
    # Silence 4.8-5.1s (intentional gap)
    # BASS HIT at 5.1s
    add(bass_hit(52, 0.55, 0.88), 5.1)
    # Alarm blips
    for k in range(3):
        add(blip(880+k*110, 0.08, 0.18), 5.2+k*0.1)

    # Scene 4: error beeps 8.0-8.6s
    for k in range(3):
        add(blip(440+k*80, 0.1, 0.25), 8.0+k*0.18)

    # Scene 5: near silence (Pugsy)

    # Scene 6: deploy success chime at 14.5s
    add(success_chime(523), 14.5)

    # Scene 7: quick personality blips as panels appear
    for k,(_, _, _, _, start) in enumerate(SPLIT):
        t_abs = 15.0+start*4.0  # scene 7 starts at t=15
        add(blip(600+k*160, 0.07, 0.22), t_abs)

    # Scene 10: warm resolve chord at 24.5s
    for freq in [261, 329, 392, 523]:
        add(sine_wave(freq, 2.5, 0.12, 0.05, 0.8), 24.5)

    # Normalize
    peak = max(abs(v) for v in audio) or 1.0
    audio = [v/peak*0.82 for v in audio]

    wav_path = os.path.join(TMP, "sfx.wav")
    with wavemod.open(wav_path,"w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(RATE)
        for v in audio:
            wf.writeframes(struct.pack('<h', int(v*32767)))
    return wav_path

# ═══════════════════════════════════════════════════════════════════════
# TIMELINE
# ═══════════════════════════════════════════════════════════════════════

TIMELINE = [
    # (fn, frames, crossfade_in)
    (scene_cold_open, 60,  True),
    (scene_goldie,    75,  True),
    (scene_rmrf,      105, False),  # slam cut — hard
    (scene_byte,      75,  True),
    (scene_pugsy,     60,  True),
    (scene_shiba,     75,  True),
    (scene_split,     120, True),
    (scene_gate,      75,  True),
    (scene_grid,      75,  True),
    (scene_cta,       90,  True),
]
XFADE = 15

def build():
    all_frames = []
    prev_last  = None
    fidx       = 0

    for fn, n, xfade in TIMELINE:
        sc = []
        for i in range(n):
            t = i/max(n-1,1)
            sc.append((fidx, fn(t, fidx)))
            fidx += 1

        if prev_last is not None and xfade:
            first_frame = sc[0][1]
            for j in range(min(XFADE, len(sc))):
                alpha = j/XFADE
                fi, _ = sc[j]
                sc[j] = (fi, blend(prev_last, first_frame, alpha))

        all_frames.extend(sc)
        prev_last = sc[-1][1]

    return all_frames

# ═══════════════════════════════════════════════════════════════════════
# RENDER
# ═══════════════════════════════════════════════════════════════════════

print("Generating audio...")
audio_path = make_audio()
print(f"  SFX: {audio_path}")

print("Building frames...")
frames = build()
total  = len(frames)
print(f"Rendering {total} frames @ {FPS}fps ({total/FPS:.1f}s)...")

for i,(fidx,fr) in enumerate(frames):
    fr.save(os.path.join(OUT, f"{i:05d}.png"))
    if i%90==0:
        print(f"  {i*100//total}%", end="\r", flush=True)

OUT_MP4 = os.path.join(ROOT, "trailer.mp4")
OUT_SOC = os.path.join(ROOT, "content/marketing/trailer-social.mp4")
OUT_GIF = os.path.join(ROOT, "content/marketing/trailer.gif")

print("\nEncoding trailer.mp4 (with audio)...")
subprocess.run([
    "ffmpeg","-y",
    "-framerate", str(FPS), "-i", f"{OUT}/%05d.png",
    "-i", audio_path,
    "-c:v","libx264","-pix_fmt","yuv420p",
    "-c:a","aac","-b:a","128k",
    "-shortest",
    "-crf","15","-preset","slow",
    OUT_MP4
], check=True, capture_output=True)

print("Encoding social version (960-wide)...")
subprocess.run([
    "ffmpeg","-y","-i", OUT_MP4,
    "-vf","scale=1280:-2",
    "-c:v","libx264","-pix_fmt","yuv420p","-crf","18",
    "-c:a","copy",
    OUT_SOC
], check=True, capture_output=True)

print("Generating trailer GIF (no audio)...")
subprocess.run([
    "ffmpeg","-y","-i", OUT_MP4,
    "-vf","fps=20,scale=960:-1:flags=lanczos,split[s0][s1];"
           "[s0]palettegen=max_colors=200[p];[s1][p]paletteuse=dither=bayer",
    "-loop","0", OUT_GIF
], check=True, capture_output=True)

# Panic loop clip (scene 3 = frames 135-240 approx)
print("Cutting panic loop clip...")
subprocess.run([
    "ffmpeg","-y","-i", OUT_MP4,
    "-ss","4.2","-t","4.0",
    "-vf","scale=960:-2",
    "-c:v","libx264","-pix_fmt","yuv420p","-crf","16",
    "-c:a","copy",
    os.path.join(ROOT,"content/marketing/panic-clip.mp4")
], check=True, capture_output=True)

# Pugsy clip (scene 5)
subprocess.run([
    "ffmpeg","-y","-i", OUT_MP4,
    "-ss","10.4","-t","2.2",
    "-vf","scale=960:-2",
    "-c:v","libx264","-pix_fmt","yuv420p","-crf","16",
    "-c:a","copy",
    os.path.join(ROOT,"content/marketing/pugsy-clip.mp4")
], check=True, capture_output=True)

# Split screen clip (scene 7)
subprocess.run([
    "ffmpeg","-y","-i", OUT_MP4,
    "-ss","15.0","-t","4.2",
    "-vf","scale=960:-2",
    "-c:v","libx264","-pix_fmt","yuv420p","-crf","16",
    "-c:a","copy",
    os.path.join(ROOT,"content/marketing/split-clip.mp4")
], check=True, capture_output=True)

for path in [OUT_MP4, OUT_SOC, OUT_GIF,
             ROOT+"/content/marketing/panic-clip.mp4",
             ROOT+"/content/marketing/pugsy-clip.mp4",
             ROOT+"/content/marketing/split-clip.mp4"]:
    if os.path.exists(path):
        print(f"  {os.path.basename(path):30s}  {os.path.getsize(path)//1024}KB")

print("\nDone. Add music in post:")
print('  ffmpeg -i trailer.mp4 -i music.mp3 -filter_complex "[1]volume=0.4[m];[0:a][m]amerge" -ac 2 trailer-final.mp4')
