#!/usr/bin/env python3
"""
goodboy-claude advertisement video generator
Creates a polished, advertisement-style video showing each persona reacting to events.
"""
from PIL import Image, ImageDraw, ImageFont
import subprocess, os, math, shutil

# ─── CONFIG ─────────────────────────────────────────────────────────
W, H = 1280, 720
FPS = 30
OUT_DIR = "/tmp/goodboy_frames"
MONO_FONT = "/System/Library/Fonts/SFNSMono.ttf"
BODY_FONT = "/System/Library/Fonts/SFNSMono.ttf"

# Dracula palette
BG      = (40,  42,  54)   # #282a36
SURFACE = (68,  71,  90)   # #44475a
FG      = (248, 248, 242)  # #f8f8f2
COMMENT = (98,  114, 164)  # #6272a4
CYAN    = (139, 233, 253)  # #8be9fd
GREEN   = (80,  250, 123)  # #50fa7b
ORANGE  = (255, 184, 108)  # #ffb86c
PINK    = (255, 121, 198)  # #ff79c6
PURPLE  = (189, 147, 249)  # #bd93f9
RED     = (255, 85,  85)   # #ff5555
YELLOW  = (241, 250, 140)  # #f1fa8c

PERSONAS = [
    {
        "id": "goldie",
        "name": "GOLDIE",
        "breed": "Golden Retriever",
        "color": (255, 215, 0),
        "accent": (255, 165, 0),
        "mood": "alarmed",
        "art": [
            "  /^\\ !",
            " (°O°)!!",
            "  )🎀(",
            " /|  |\\",
        ],
        "event": "rm -rf detected",
        "quip": "OH NO!! OH NO OH NO!! please tell me\nyou meant to do that!!",
        "tagline": "enthusiastic optimist"
    },
    {
        "id": "shiba",
        "name": "SHIBA",
        "breed": "Shiba Inu",
        "color": (255, 140, 0),
        "accent": (255, 100, 0),
        "mood": "judgy",
        "art": [
            " _/ᴥ\\_",
            " ( ._.) ",
            "  )🎍(",
            "  |  |",
        ],
        "event": "git push --force",
        "quip": "force push. brave. foolish.\nsame thing.",
        "tagline": "sassy and independent"
    },
    {
        "id": "byte",
        "name": "BYTE",
        "breed": "Border Collie",
        "color": (74, 158, 255),
        "accent": (100, 180, 255),
        "mood": "excited",
        "art": [
            "  /◉\\ ★",
            " (^ᴥ^)♪",
            "  )📟(",
            " _|  |_",
        ],
        "event": "all tests passing",
        "quip": "test suite: 100% passing.\nperformance: optimal. shipping.",
        "tagline": "focused and analytical"
    },
    {
        "id": "nova",
        "name": "NOVA",
        "breed": "Siberian Husky",
        "color": (0, 212, 255),
        "accent": (100, 230, 255),
        "mood": "excited",
        "art": [
            "  /Δ\\ /",
            " (^ᴥ^)!!",
            "  )❄(",
            "_/|  |\\_",
        ],
        "event": "deploy complete",
        "quip": "DEPLOY DONE. PRODUCTION: LIVE.\nTHAT IS HOW WE DO IT.",
        "tagline": "maximum energy, always"
    },
]

# ─── HELPERS ────────────────────────────────────────────────────────
def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

def easeInOut(t):
    return t * t * (3 - 2 * t)

def lerp(a, b, t):
    return int(a + (b - a) * t)

def lerp_color(c1, c2, t):
    return tuple(lerp(a, b, t) for a, b in zip(c1, c2))

def alpha_composite(img, overlay_color, alpha):
    """Simple alpha blend"""
    r,g,b = overlay_color
    arr = img.copy()
    w, h = arr.size
    for px in range(w):
        for py in range(h):
            or_, og, ob, oa = arr.getpixel((px, py))
            nr = int(or_ * (1 - alpha) + r * alpha)
            ng = int(og * (1 - alpha) + g * alpha)
            nb = int(ob * (1 - alpha) + b * alpha)
            arr.putpixel((px, py), (nr, ng, nb, oa))
    return arr

def draw_rounded_rect(draw, xy, radius, fill, outline=None, outline_width=2):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle([x1, y1, x2, y2], radius=radius, fill=fill,
                           outline=outline, width=outline_width)

def draw_text_shadow(draw, pos, text, font_obj, fill, shadow_color=(0,0,0), offset=2):
    draw.text((pos[0]+offset, pos[1]+offset), text, font=font_obj, fill=shadow_color)
    draw.text(pos, text, font=font_obj, fill=fill)

def text_width(draw, text, font_obj):
    bbox = draw.textbbox((0,0), text, font=font_obj)
    return bbox[2] - bbox[0]

def text_height(draw, text, font_obj):
    bbox = draw.textbbox((0,0), text, font=font_obj)
    return bbox[3] - bbox[1]

# ─── FRAME RENDERERS ────────────────────────────────────────────────
def make_base_frame():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    # Subtle gradient bars at top/bottom
    for y in range(80):
        alpha = (80-y)/80 * 0.15
        c = lerp_color(SURFACE, BG, 1-alpha)
        draw.line([(0,y),(W,y)], fill=c)
    for y in range(H-80, H):
        alpha = (y-(H-80))/80 * 0.15
        c = lerp_color(SURFACE, BG, 1-alpha)
        draw.line([(0,y),(W,y)], fill=c)
    return img, draw

def draw_grid(draw):
    """Subtle dot grid background"""
    for x in range(0, W, 40):
        for y in range(0, H, 40):
            draw.ellipse([x-1, y-1, x+1, y+1], fill=(60, 62, 76))

def draw_logo(draw, alpha=1.0):
    f_large = font(BODY_FONT, 22)
    f_small = font(BODY_FONT, 13)
    color = tuple(int(c * alpha) for c in CYAN)
    draw.text((40, 32), "goodboy-claude", font=f_large, fill=color)
    subdued = tuple(int(c * alpha) for c in COMMENT)
    draw.text((40, 58), "npm install -g goodboy-claude", font=f_small, fill=subdued)

def persona_card_frame(persona, t, phase):
    """
    t: 0.0 → 1.0 within this card's total duration
    phase: 'enter' | 'hold' | 'exit'
    """
    img, draw = make_base_frame()
    draw_grid(draw)

    color = persona["color"]
    accent = persona["accent"]

    # ── slide/fade in ──
    if phase == "enter":
        slide = easeInOut(t)
        card_alpha = t
    elif phase == "exit":
        slide = 1.0
        card_alpha = 1.0 - t
    else:
        slide = 1.0
        card_alpha = 1.0

    card_x_offset = int((1.0 - slide) * 80)

    # ── Left panel: persona identity ──
    panel_x = 60 + card_x_offset
    panel_y = 120
    panel_w = 460
    panel_h = 460

    # Glow effect behind card
    for glow in range(20, 0, -1):
        ga = 0.015 * (21 - glow) * card_alpha
        gc = tuple(int(c * ga) for c in color)
        draw.rounded_rectangle(
            [panel_x - glow, panel_y - glow,
             panel_x + panel_w + glow, panel_y + panel_h + glow],
            radius=24 + glow, fill=gc
        )

    draw_rounded_rect(draw,
        [panel_x, panel_y, panel_x + panel_w, panel_y + panel_h],
        radius=20,
        fill=SURFACE,
        outline=color, outline_width=2
    )

    f_name = font(MONO_FONT, 52)
    f_breed = font(MONO_FONT, 16)
    f_ascii = font(MONO_FONT, 28)
    f_tag = font(MONO_FONT, 14)

    # Name
    name_color = tuple(int(c * card_alpha) for c in color)
    draw.text((panel_x + 30, panel_y + 30), persona["name"],
              font=f_name, fill=name_color)

    # Breed tag
    breed_color = tuple(int(c * card_alpha) for c in COMMENT)
    draw.text((panel_x + 34, panel_y + 94), persona["breed"],
              font=f_breed, fill=breed_color)

    # Separator line
    sep_color = tuple(int(c * card_alpha) for c in color)
    draw.line([(panel_x + 30, panel_y + 120),
               (panel_x + panel_w - 30, panel_y + 120)],
              fill=sep_color, width=1)

    # ASCII art — large and colored
    art_y = panel_y + 145
    for line in persona["art"]:
        art_color = tuple(int(c * card_alpha) for c in accent)
        draw_text_shadow(draw, (panel_x + 40, art_y), line, f_ascii, art_color)
        art_y += 54

    # Tagline
    tag_color = tuple(int(c * card_alpha) for c in COMMENT)
    draw.text((panel_x + 34, panel_y + panel_h - 50),
              f"— {persona['tagline']}", font=f_tag, fill=tag_color)

    # ── Right panel: event + quip ──
    rp_x = panel_x + panel_w + 50
    rp_y = 120
    rp_w = W - rp_x - 60
    rp_h = panel_h

    draw_rounded_rect(draw,
        [rp_x, rp_y, rp_x + rp_w, rp_y + rp_h],
        radius=20,
        fill=(50, 52, 64),
        outline=SURFACE, outline_width=1
    )

    f_event_label = font(MONO_FONT, 12)
    f_event = font(MONO_FONT, 18)
    f_quip = font(MONO_FONT, 22)

    # Event badge
    badge_alpha = card_alpha
    badge_bg = tuple(int(c * 0.3 * badge_alpha) for c in color)
    badge_color = tuple(int(c * badge_alpha) for c in color)

    draw.text((rp_x + 30, rp_y + 30),
              "event detected:", font=f_event_label,
              fill=tuple(int(c * badge_alpha) for c in COMMENT))
    draw.text((rp_x + 30, rp_y + 50),
              persona["event"], font=f_event, fill=badge_color)

    # Quip box
    qbox_y = rp_y + 130
    qbox_h = 180
    draw_rounded_rect(draw,
        [rp_x + 20, qbox_y, rp_x + rp_w - 20, qbox_y + qbox_h],
        radius=12,
        fill=BG,
        outline=tuple(int(c * card_alpha) for c in SURFACE), outline_width=1
    )

    # Opening quote
    f_quote_mark = font(MONO_FONT, 48)
    q_color = tuple(int(c * 0.3 * card_alpha) for c in color)
    draw.text((rp_x + 32, qbox_y + 5), "“", font=f_quote_mark, fill=q_color)

    # Quip text
    quip_lines = persona["quip"].split("\n")
    q_y = qbox_y + 55
    for qline in quip_lines:
        q_text_color = tuple(int(c * card_alpha) for c in FG)
        draw.text((rp_x + 40, q_y), qline, font=f_quip, fill=q_text_color)
        q_y += 35

    # Mood indicator
    mood_y = rp_y + rp_h - 70
    mood_colors = {
        "alarmed": RED, "judgy": ORANGE,
        "excited": GREEN, "happy": CYAN,
        "sad": PURPLE, "sleepy": COMMENT,
        "proud": YELLOW, "disgusted": PINK
    }
    mood_c = mood_colors.get(persona["mood"], CYAN)
    m_color = tuple(int(c * card_alpha) for c in mood_c)
    draw.ellipse([rp_x + 30, mood_y + 8, rp_x + 46, mood_y + 24], fill=m_color)
    f_mood = font(MONO_FONT, 15)
    draw.text((rp_x + 54, mood_y + 5), f"mood: {persona['mood']}",
              font=f_mood, fill=m_color)

    # Logo always visible
    draw_logo(draw, alpha=card_alpha * 0.9 + 0.1)

    # Frame number dot at bottom center
    dot_color = tuple(int(c * card_alpha) for c in color)
    idx = PERSONAS.index(persona)
    total = len(PERSONAS)
    dot_spacing = 24
    start_x = W // 2 - (total * dot_spacing) // 2
    for i in range(total):
        cx = start_x + i * dot_spacing + 12
        cy = H - 36
        if i == idx:
            draw.ellipse([cx-7, cy-7, cx+7, cy+7], fill=dot_color)
        else:
            draw.ellipse([cx-4, cy-4, cx+4, cy+4],
                         fill=tuple(int(c * 0.3) for c in COMMENT))

    return img

def title_frame(t, phase):
    img, draw = make_base_frame()
    draw_grid(draw)

    if phase == "enter":
        alpha = easeInOut(t)
    elif phase == "exit":
        alpha = 1.0 - easeInOut(t)
    else:
        alpha = 1.0

    f_headline = font(MONO_FONT, 68)
    f_sub = font(MONO_FONT, 24)
    f_small = font(MONO_FONT, 16)

    # Animated color cycle through persona colors
    colors = [p["color"] for p in PERSONAS]
    ci = int(t * len(colors)) % len(colors)
    tc = lerp_color(colors[ci], colors[(ci+1) % len(colors)], (t * len(colors)) % 1.0)
    headline_color = tuple(int(c * alpha) for c in tc)
    fg_color = tuple(int(c * alpha) for c in FG)
    comment_color = tuple(int(c * alpha) for c in COMMENT)

    # Main headline
    headline = "your terminal"
    headline2 = "has been lonely."
    tw1 = text_width(draw, headline, f_headline)
    tw2 = text_width(draw, headline2, f_headline)
    draw_text_shadow(draw, (W//2 - tw1//2, H//2 - 130), headline, f_headline,
                     fg_color, shadow_color=(20,20,30), offset=3)
    draw_text_shadow(draw, (W//2 - tw2//2, H//2 - 40), headline2, f_headline,
                     headline_color, shadow_color=(20,20,30), offset=3)

    # Subtitle
    sub = "introducing goodboy-claude"
    tw_sub = text_width(draw, sub, f_sub)
    draw.text((W//2 - tw_sub//2, H//2 + 70), sub, font=f_sub,
              fill=tuple(int(c * alpha) for c in CYAN))

    # Tag
    tag = "a Tamagotchi for your terminal  ·  6 personas  ·  720 handwritten quips"
    tw_tag = text_width(draw, tag, f_small)
    draw.text((W//2 - tw_tag//2, H//2 + 115), tag, font=f_small, fill=comment_color)

    draw_logo(draw, alpha=alpha)
    return img

def outro_frame(t, phase):
    img, draw = make_base_frame()
    draw_grid(draw)

    if phase == "enter":
        alpha = easeInOut(t)
    elif phase == "exit":
        alpha = 1.0 - easeInOut(t)
    else:
        alpha = 1.0

    f_cmd = font(MONO_FONT, 36)
    f_sub = font(MONO_FONT, 18)
    f_small = font(MONO_FONT, 14)

    # Install command box
    box_w, box_h = 680, 90
    box_x, box_y = W//2 - box_w//2, H//2 - box_h//2 - 40

    box_color = tuple(int(c * alpha) for c in SURFACE)
    border_color = tuple(int(c * alpha) for c in GREEN)
    draw_rounded_rect(draw, [box_x, box_y, box_x+box_w, box_y+box_h],
                      radius=16, fill=box_color, outline=border_color, outline_width=2)

    cmd = "npm install -g goodboy-claude"
    tw = text_width(draw, cmd, f_cmd)
    cmd_color = tuple(int(c * alpha) for c in GREEN)
    draw_text_shadow(draw, (W//2 - tw//2, box_y + 22), cmd, f_cmd, cmd_color,
                     shadow_color=(0,0,0), offset=2)

    sub = "then: goodboy init"
    tw_sub = text_width(draw, sub, f_sub)
    sub_color = tuple(int(c * alpha) for c in CYAN)
    draw.text((W//2 - tw_sub//2, box_y + box_h + 20), sub, font=f_sub, fill=sub_color)

    # Links
    links = [
        "github.com/jigar-joshi-nirmata/goodboy",
        "npmjs.com/package/goodboy-claude",
    ]
    link_y = H - 100
    for link in links:
        tw = text_width(draw, link, f_small)
        link_color = tuple(int(c * alpha) for c in COMMENT)
        draw.text((W//2 - tw//2, link_y), link, font=f_small, fill=link_color)
        link_y += 24

    draw_logo(draw, alpha=alpha)
    return img

# ─── SCENE SCHEDULE ─────────────────────────────────────────────────
def frames_for_scene(scene_type, data, enter_f, hold_f, exit_f):
    frames = []
    for i in range(enter_f):
        t = i / max(enter_f - 1, 1)
        if scene_type == "title":
            frames.append(title_frame(t, "enter"))
        elif scene_type == "persona":
            frames.append(persona_card_frame(data, t, "enter"))
        elif scene_type == "outro":
            frames.append(outro_frame(t, "enter"))
    for i in range(hold_f):
        t = i / max(hold_f - 1, 1)
        if scene_type == "title":
            frames.append(title_frame(t, "hold"))
        elif scene_type == "persona":
            frames.append(persona_card_frame(data, t, "hold"))
        elif scene_type == "outro":
            frames.append(outro_frame(t, "hold"))
    for i in range(exit_f):
        t = i / max(exit_f - 1, 1)
        if scene_type == "title":
            frames.append(title_frame(t, "exit"))
        elif scene_type == "persona":
            frames.append(persona_card_frame(data, t, "exit"))
        elif scene_type == "outro":
            frames.append(outro_frame(t, "exit"))
    return frames

# ─── MAIN ───────────────────────────────────────────────────────────
def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    all_frames = []

    # Title: 1s enter, 2.5s hold, 0.5s exit
    all_frames += frames_for_scene("title", None,
        enter_f=int(FPS*0.8), hold_f=int(FPS*2.2), exit_f=int(FPS*0.5))

    # Each persona: 0.4s enter, 2.5s hold, 0.4s exit
    for persona in PERSONAS:
        all_frames += frames_for_scene("persona", persona,
            enter_f=int(FPS*0.4), hold_f=int(FPS*2.4), exit_f=int(FPS*0.4))

    # Outro: 0.8s enter, 3s hold, 0s exit
    all_frames += frames_for_scene("outro", None,
        enter_f=int(FPS*0.8), hold_f=int(FPS*3.0), exit_f=0)

    print(f"Rendering {len(all_frames)} frames at {FPS}fps ({len(all_frames)/FPS:.1f}s)...")

    for i, frame in enumerate(all_frames):
        path = f"{OUT_DIR}/frame_{i:05d}.png"
        frame.save(path)
        if i % 30 == 0:
            print(f"  {i}/{len(all_frames)} frames", end="\r")

    print(f"\nCombining into video...")
    # MP4
    subprocess.run([
        "ffmpeg", "-y",
        "-framerate", str(FPS),
        "-i", f"{OUT_DIR}/frame_%05d.png",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "18",
        "-preset", "slow",
        "demo-ad.mp4"
    ], check=True, capture_output=True)

    # GIF (optimized)
    subprocess.run([
        "ffmpeg", "-y",
        "-i", "demo-ad.mp4",
        "-vf", f"fps={FPS},scale={W}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer",
        "demo-ad.gif"
    ], check=True, capture_output=True)

    size_mp4 = os.path.getsize("demo-ad.mp4") / 1024
    size_gif = os.path.getsize("demo-ad.gif") / 1024
    print(f"demo-ad.mp4  {size_mp4:.0f}KB")
    print(f"demo-ad.gif  {size_gif:.0f}KB")
    shutil.rmtree(OUT_DIR)
    print("Done.")

if __name__ == "__main__":
    main()
