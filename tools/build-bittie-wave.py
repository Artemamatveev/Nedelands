"""Build Bittie's startup wave from the picture the launch image shows.

python tools/build-bittie-wave.py
The raised arm of art/bittie-loading-v1.webp (also the native launch image) turns around its shoulder, so the first
frame is exactly that picture and Bittie is already waving: no arm coming up from below, no new pose. The arm is drawn
behind the body, with a copy of its own wool pushed under the body to keep the shoulder closed while it turns.
"""
import base64
from math import asin, pi, sin
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
photo = base64.b64encode((ROOT / 'art/bittie-loading-v1.webp').read_bytes()).decode('ascii')

SHOULDER = (74, 226)
MIDDLE, SWING = -12, 15  # degrees: from 27 outwards to 3 towards the body, clear of the edge and the face
PERIOD = .72
SAMPLES = 60
# Starts at 0 degrees, already moving outwards.
start = pi - asin(-MIDDLE / SWING)
angles = [MIDDLE + SWING * sin(start + 2 * pi * i / SAMPLES) for i in range(SAMPLES + 1)]
angles[0] = angles[-1] = 0
values = ';'.join(f'{a:.2f} {SHOULDER[0]} {SHOULDER[1]}' for a in angles)

ARM = '0 120 74 120 82 150 80.5 160 80.5 170 78.5 178 75.5 185 71 192 72.5 200 74.5 207 79 214 78 228 76 236 73 239 60 240 0 240'
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<title>Bittie waving</title>
<desc>Bittie's raised paw waves hello from the first frame.</desc>
<defs>
<image id="photo" width="512" height="512" href="data:image/webp;base64,{photo}"/>
<clipPath id="arm"><polygon points="{ARM}"/></clipPath>
<clipPath id="wool"><polygon points="50 205 76 208 79 214 77 232 60 232 50 222"/></clipPath>
<clipPath id="body"><path clip-rule="evenodd" d="M0 0H512V512H0Z M{ARM}Z"/></clipPath>
</defs>
<g>
<animateTransform attributeName="transform" type="rotate" dur="{PERIOD}s" repeatCount="indefinite" calcMode="linear" values="{values}"/>
<g transform="translate(9 9)"><use href="#photo" clip-path="url(#wool)"/></g>
<use href="#photo" clip-path="url(#arm)"/>
</g>
<use href="#photo" clip-path="url(#body)"/>
</svg>
'''
(ROOT / 'art/bittie-wave-v2.svg').write_text(svg)
