"""
Home-screen art (assets-src/home/*.png on a white background) -> small transparent WebPs
(the "out" path of each item in assets-src/home/home-prompts.json): the wooden sign, the
numbered-stone marker and one icon per unit.

The white background is removed with a flood fill from the picture's border, so white areas
INSIDE the outline stay white. The result is trimmed, padded a little and scaled to "width".

Needs Python 3 + Pillow. Run from the repo root:
    py -I scripts/home-art-to-webp.py [prompts.json]   (default: assets-src/home/home-prompts.json;
                                                       the Sampan art uses assets-src/sampan/sampan-prompts.json)
Task 9 (optimise-images) may replace this with a Node script.
"""

import json
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw

TOLERANCE = 28  # how far from pure white still counts as background (0-255 per channel)


def is_bg(px: tuple[int, int, int, int]) -> bool:
    r, g, b, _ = px
    return r >= 255 - TOLERANCE and g >= 255 - TOLERANCE and b >= 255 - TOLERANCE


def remove_background(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()
    seen = bytearray(w * h)
    queue: deque[tuple[int, int]] = deque()
    for x in range(w):
        queue.extend([(x, 0), (x, h - 1)])
    for y in range(h):
        queue.extend([(0, y), (w - 1, y)])
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


def check_transparent(img: Image.Image, name: str) -> None:
    """Raise if the background was not really removed (or the whole picture was).

    Run on the TRIMMED picture, before any padding: a fully opaque square would otherwise look
    ~90 % opaque once transparent padding is added around it.
    """
    total = img.width * img.height
    opaque = (total - img.getchannel("A").histogram()[0]) / total
    assert 0.25 < opaque < 0.98, f"{name}: {opaque:.0%} opaque, background removal failed"


def self_test() -> None:
    """py -I scripts/home-art-to-webp.py --self-test"""
    solid = Image.new("RGBA", (100, 100), (200, 100, 20, 255))  # nothing was removed
    try:
        check_transparent(solid, "solid")
    except AssertionError:
        pass
    else:
        raise SystemExit("self-test failed: an opaque square passed the check")
    # A round object on white: the corners go transparent, so it passes.
    disc = Image.new("RGB", (100, 100), (255, 255, 255))
    ImageDraw.Draw(disc).ellipse((10, 10, 90, 90), fill=(200, 100, 20))
    cleaned = remove_background(disc)
    box = cleaned.getbbox()
    assert box is not None and box[0] >= 9, box
    check_transparent(cleaned.crop(box), "disc")
    print("self-test ok")


def main(prompts: str = "assets-src/home/home-prompts.json") -> None:
    spec = json.loads(Path(prompts).read_text(encoding="utf-8"))
    for item in spec["items"]:
        src, out = Path(item["file"]), Path(item["out"])
        if not src.exists():
            print(f"missing {src}")
            continue
        img = remove_background(Image.open(src))
        box = img.getbbox()
        if box:
            img = img.crop(box)
        check_transparent(img, item["id"])  # before padding
        pad = round(max(img.size) * 0.03)
        canvas = Image.new("RGBA", (img.width + 2 * pad, img.height + 2 * pad), (0, 0, 0, 0))
        canvas.paste(img, (pad, pad))
        width = item["width"]
        if canvas.width > width:
            canvas = canvas.resize((width, round(canvas.height * width / canvas.width)), Image.LANCZOS)
        out.parent.mkdir(parents=True, exist_ok=True)
        canvas.save(out, "WEBP", quality=85, method=6)
        print(f"{out}  {canvas.width}x{canvas.height}  {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    import sys

    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if "--self-test" in sys.argv:
        self_test()
    else:
        main(*args)
