import math

GOLD_L = "#fde047"  # light
GOLD_M = "#fbbf24"
GOLD_D = "#f59e0b"  # deep
NAVY_T = "#0e1733"
NAVY_M = "#0a1124"
NAVY_B = "#06080f"

def sun(cx, cy, R, ray_inner, ray_outer, ray_w, ncrays=12, glow=False, glow_r=0):
    parts = []
    if glow:
        parts.append(
            f'<circle cx="{cx}" cy="{cy}" r="{glow_r}" fill="url(#glow)"/>'
        )
    # rays
    rays = []
    for k in range(ncrays):
        a = math.radians(-90 + k * (360 / ncrays))
        x1 = cx + ray_inner * math.cos(a); y1 = cy + ray_inner * math.sin(a)
        x2 = cx + ray_outer * math.cos(a); y2 = cy + ray_outer * math.sin(a)
        rays.append(
            f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
            f'stroke="url(#ray)" stroke-width="{ray_w}" stroke-linecap="round"/>'
        )
    parts.append('<g>' + ''.join(rays) + '</g>')
    # disc
    parts.append(f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="url(#disc)"/>')
    # subtle inner highlight
    parts.append(
        f'<circle cx="{cx - R*0.22:.1f}" cy="{cy - R*0.22:.1f}" r="{R*0.5:.1f}" fill="url(#hi)"/>'
    )
    return ''.join(parts)

DEFS = f'''
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{NAVY_T}"/>
      <stop offset="0.55" stop-color="{NAVY_M}"/>
      <stop offset="1" stop-color="{NAVY_B}"/>
    </linearGradient>
    <radialGradient id="disc" cx="0.42" cy="0.38" r="0.72">
      <stop offset="0" stop-color="#fffbe8"/>
      <stop offset="0.35" stop-color="{GOLD_L}"/>
      <stop offset="0.72" stop-color="{GOLD_M}"/>
      <stop offset="1" stop-color="{GOLD_D}"/>
    </radialGradient>
    <linearGradient id="ray" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{GOLD_L}"/>
      <stop offset="1" stop-color="{GOLD_D}"/>
    </linearGradient>
    <radialGradient id="hi" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="{GOLD_M}" stop-opacity="0.45"/>
      <stop offset="0.6" stop-color="{GOLD_D}" stop-opacity="0.12"/>
      <stop offset="1" stop-color="{GOLD_D}" stop-opacity="0"/>
    </radialGradient>
  </defs>
'''

def write(path, w, h, body):
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
           f'viewBox="0 0 {w} {h}">{DEFS}{body}</svg>')
    open(path, 'w').write(svg)

# ---- Render every asset (SVG -> PNG via rsvg-convert) ----
# Run from the repo root:  python3 scripts/icon/generate-icons.py
import os, subprocess, tempfile

ASSETS = "assets"

# (name, svg-builder, width, height)
TARGETS = [
    # Full app icon (1024) — navy gradient bg + glowing sun
    ("icon.png", 1024, 1024,
     f'<rect width="1024" height="1024" fill="url(#bg)"/>'
     + sun(512, 512, 196, 250, 340, 34, glow=True, glow_r=470)),
    # Adaptive foreground (1024, transparent) — emblem within the safe zone
    ("adaptive-icon.png", 1024, 1024,
     sun(512, 512, 150, 196, 262, 27, glow=False)),
    # Splash (1284x2778) — navy bg + centered sun
    ("splash.png", 1284, 2778,
     f'<rect width="1284" height="2778" fill="url(#bg)"/>'
     + sun(642, 1389, 150, 196, 270, 26, glow=True, glow_r=420)),
    # Favicon (48) — rounded navy tile + sun
    ("favicon.png", 48, 48,
     f'<rect width="1024" height="1024" rx="180" fill="url(#bg)"/>'
     + sun(512, 512, 220, 290, 400, 40, glow=True, glow_r=470)),
]

with tempfile.TemporaryDirectory() as tmp:
    for name, w, h, body in TARGETS:
        # SVG canvas is 1024-based for square assets, native size for splash.
        cw = 1284 if name == "splash.png" else 1024
        ch = 2778 if name == "splash.png" else 1024
        svg_path = os.path.join(tmp, name.replace(".png", ".svg"))
        write(svg_path, cw, ch, body)
        out = os.path.join(ASSETS, name)
        subprocess.run(
            ["rsvg-convert", "-w", str(w), "-h", str(h), svg_path, "-o", out],
            check=True,
        )
        print(f"wrote {out} ({w}x{h})")

print("Done. Icons regenerated in assets/.")
