"""Export the generated 4x4 Bittie pose atlas as a two-second transparent loop.

Requires Pillow. Run from any directory: python tools/build-bittie-dance.py
The source artwork is art/bittie-dance-v1-atlas.webp; no generation/API call is made.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
atlas = Image.open(ROOT / 'art/bittie-dance-v1-atlas.webp').convert('RGBA')
# Quantize imperceptible alpha noise for a smaller download, keeping soft edge alpha.
atlas.putalpha(atlas.getchannel('A').point(lambda a: 0 if a <= 8 else 255 if a >= 247 else a))
frames = []
for index in range(16):
    col, row = index % 4, index // 4
    box = tuple(round(v) for v in (col * atlas.width / 4, row * atlas.height / 4,
                                  (col + 1) * atlas.width / 4, (row + 1) * atlas.height / 4))
    frames.append(atlas.crop(box).resize((320, 320), Image.Resampling.LANCZOS))
frames[0].save(ROOT / 'art/bittie-dance-v1.webp', save_all=True, append_images=frames[1:],
               duration=125, loop=0, quality=80, method=4, minimize_size=True)
