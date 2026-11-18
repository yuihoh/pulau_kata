"""
Mascot PNGs (assets-src/mascot/*.png, white background) -> small transparent WebPs for the app
(apps/web/src/assets/mascot/<pose>.webp).

The white background is removed with a flood fill from the picture's border, so white areas
INSIDE the outline (the hornbill's belly, tail and eyes) stay white. White gaps enclosed by
the outline (between a raised wing and the head) are listed per pose as "clear" points in
mascot-prompts.json and are filled from there too. The result is trimmed to the
character, padded a little and scaled to 320 px on its longest side.

Needs Python 3 + Pillow (`py -m pip install pillow`). Run from the repo root:
    py -I scripts/mascot-to-webp.py
Task 9 (optimise-images) may replace this with a Node script.
"""

import json
from collections import deque
from pathlib import Path

from PIL import Image

SRC = Path("assets-src/mascot")
OUT = Path("apps/web/src/assets/mascot")
SIZE = 320
TOLERANCE = 28  # how far from pure white still counts as background (0-255 per channel)


def is_bg(px: tuple[int, int, int, int]) -> bool:
    r, g, b, _ = px
    return r >= 255 - TOLERANCE and g >= 255 - TOLERANCE and b >= 255 - TOLERANCE


def remove_background(img: Image.Image, seeds: list[list[int]]) -> Image.Image:
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()
    seen = bytearray(w * h)
    queue: deque[tuple[int, int]] = deque()
    for x in range(w):
        queue.extend([(x, 0), (x, h - 1)])
    for y in range(h):
        queue.extend([(0, y), (w - 1, y)])
    # Enclosed gaps named in mascot-prompts.json ("clear"): white pockets the border fill cannot reach.
    queue.extend((x, y) for x, y in seeds)
    while queue:
        x, y = queue.popleft()
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        if not is_bg(px[x, y]):
            continue
        px[x, y] = (255, 255, 255, 0)
        if x > 0:
            queue.append((x - 1, y))
        if x < w - 1:
            queue.append((x + 1, y))
        if y > 0:
            queue.append((x, y - 1))
        if y < h - 1:
            queue.append((x, y + 1))
    return img


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    spec = json.loads((SRC / "mascot-prompts.json").read_text(encoding="utf-8"))
    clear = {p["id"]: p.get("clear", []) for p in spec["poses"]}
    for src in sorted(SRC.glob("*.png")):
        seeds = clear.get(src.stem, [])
        img = remove_background(Image.open(src), seeds)
        # Self-check (the web tests cannot decode images): every named gap is now transparent,
        # and most of the bird is still opaque (eyes, belly and tail were not eaten).
        for x, y in seeds:
            assert img.getpixel((x, y))[3] == 0, f"{src.stem}: gap at {x},{y} still opaque"
        alpha = img.getchannel("A")
        total = img.width * img.height
        opaque = (total - alpha.histogram()[0]) / total
        assert opaque > 0.3, f"{src.stem}: only {opaque:.0%} opaque, the fill leaked into the bird"
        box = img.getbbox()
        if box:
            img = img.crop(box)
        pad = round(max(img.size) * 0.04)
        canvas = Image.new("RGBA", (img.width + 2 * pad, img.height + 2 * pad), (0, 0, 0, 0))
        canvas.paste(img, (pad, pad))
        canvas.thumbnail((SIZE, SIZE), Image.LANCZOS)
        dest = OUT / f"{src.stem}.webp"
        canvas.save(dest, "WEBP", quality=85, method=6)
        print(f"{dest}  {canvas.size[0]}x{canvas.size[1]}  {dest.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
