"""Build Bittie's smooth, self-contained SVG dance from the existing photo atlas.

Requires Pillow: python tools/build-bittie-dance.py
The original torso and paws are clipped in SVG, then moved along eased paths.
No frame blending, new artwork, JavaScript or external SVG resources are used.
"""
import base64
from io import BytesIO
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
atlas = Image.open(ROOT / 'art/bittie-dance-v1-atlas.webp').convert('RGBA')
atlas.putalpha(atlas.getchannel('A').point(lambda a: 0 if a <= 8 else 255 if a >= 247 else a))


def photo(index):
    col, row = index % 4, index // 4
    box = tuple(round(v) for v in (col * atlas.width / 4, row * atlas.height / 4,
                                  (col + 1) * atlas.width / 4, (row + 1) * atlas.height / 4))
    buffer = BytesIO()
    frame = atlas.crop(box).resize((320, 320), Image.Resampling.LANCZOS)
    frame.quantize(colors=256, method=Image.Quantize.FASTOCTREE).save(
        buffer, format='PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode('ascii')


# Time, body lift/tilt, left/right palm centers, left/right foot centers.
# The clap lands before the existing two-second minimum splash finishes.
# Identical first/last positions and zero endpoint velocities close the loop.
POSES = [
    (0,     0,  0,  40, 194, 287, 194, 110, 280, 209, 280),
    (.14,  -3, -1,  48, 177, 278, 202, 102, 269, 209, 281),
    (.28,  -3,  1,  43, 200, 280, 177, 111, 281, 219, 269),
    (.43,  -1,  0, 123, 210, 202, 210, 110, 280, 209, 280),
    (.50,  -2,  0, 145, 207, 181, 207, 110, 280, 209, 280),
    (.54,  -2,  0, 145, 207, 181, 207, 110, 280, 209, 280),
    (.62,  -1,  0, 120, 210, 207, 210, 110, 280, 209, 280),
    (.77,  -8,  0,  53, 166, 273, 166, 104, 277, 215, 277),
    (.90,   1,  0,  43, 195, 284, 195, 110, 281, 209, 281),
    (1,     0,  0,  40, 194, 287, 194, 110, 280, 209, 280),
]
TIMES = ';'.join(str(p[0]) for p in POSES)
EASING = ';'.join(['.42 0 .32 1'] * (len(POSES) - 1))


def moving(kind, values, content):
    return (f'<g transform="{kind}({values[0]})">'
            f'<animateTransform attributeName="transform" type="{kind}" dur="3.2s" '
            f'repeatCount="indefinite" calcMode="spline" keyTimes="{TIMES}" '
            f'keySplines="{EASING}" values="{";".join(map(str, values))}"/>'
            f'{content}</g>')


def hand(side, offset, shoulder):
    # A textured forearm connects each original paw to its shoulder during the clap.
    # Animate endpoints with the same spline as the paw: no rotating/length-changing
    # arm can separate from its paw or spin through 360 degrees at an angle wrap.
    paths = [f'M{shoulder[0]} {shoulder[1]} '
             f'Q{(shoulder[0] + p[offset]) / 2} {(shoulder[1] + p[offset + 1]) / 2 + 10} '
             f'{p[offset]} {p[offset + 1]}' for p in POSES]
    arm = (f'<path d="{paths[0]}" fill="none" stroke="url(#fur)" '
           f'stroke-width="16" stroke-linecap="round">'
           f'<animate attributeName="d" dur="3.2s" repeatCount="indefinite" '
           f'calcMode="spline" keyTimes="{TIMES}" keySplines="{EASING}" '
           f'values="{";".join(paths)}"/></path>')
    palm = moving('translate', [f'{p[offset]} {p[offset + 1]}' for p in POSES],
                  f'<use href="#palm-{side}"/>')
    return arm + palm


feet = ''
for i, offset in enumerate((7, 9)):
    angles = [(-16 if p[0] == .14 else 0) if i == 0 else (16 if p[0] == .28 else 0)
              for p in POSES]
    feet += moving('translate', [f'{p[offset]} {p[offset + 1]}' for p in POSES],
                   moving('rotate', angles, f'<use href="#foot-{i}"/>'))

body = (feet + '<use href="#torso-photo" clip-path="url(#torso)"/>'
        + hand('left', 3, (78, 200)) + hand('right', 5, (247, 200)))
dance = moving('translate', [f'0 {p[1]}' for p in POSES],
               moving('rotate', [f'{p[2]} 160 240' for p in POSES], body))

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
<title>Bittie dancing</title>
<desc>Two gentle steps, a clap and a small hop, with smoothly eased limbs.</desc>
<defs>
<image id="photo" width="320" height="320" href="{photo(1)}"/>
<image id="torso-photo" width="320" height="320" href="{photo(0)}"/>
<pattern id="fur" width="12" height="12" patternUnits="userSpaceOnUse"><use href="#photo" transform="translate(-280 -187)"/></pattern>
<clipPath id="torso"><path d="M160 22 C104 20 67 63 54 117 C48 143 50 165 54 184 C58 204 69 224 77 242 C93 269 126 274 157 274 C176 276 190 273 198 270 L199 282 L240 282 L242 248 C246 230 249 216 260 202 C278 194 284 179 285 168 C289 122 263 60 224 37 C204 24 181 21 160 22Z"/></clipPath>
<clipPath id="left-cut"><ellipse cx="34" cy="193" rx="23" ry="20"/></clipPath>
<clipPath id="right-cut"><ellipse cx="287" cy="192" rx="22" ry="20"/></clipPath>
<clipPath id="foot0-cut"><ellipse cx="111" cy="280" rx="23" ry="17"/></clipPath>
<clipPath id="foot1-cut"><ellipse cx="211" cy="280" rx="22" ry="17"/></clipPath>
<g id="palm-left"><use href="#photo" clip-path="url(#left-cut)" transform="translate(-34 -193)"/></g>
<g id="palm-right"><use href="#photo" clip-path="url(#right-cut)" transform="translate(-287 -192)"/></g>
<g id="foot-0"><use href="#photo" clip-path="url(#foot0-cut)" transform="translate(-111 -280)"/></g>
<g id="foot-1"><use href="#photo" clip-path="url(#foot1-cut)" transform="translate(-211 -280)"/></g>
</defs>
{dance}
</svg>
'''
(ROOT / 'art/bittie-dance-v2.svg').write_text(svg)
