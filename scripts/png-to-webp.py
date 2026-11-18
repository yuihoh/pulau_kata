"""
Converts the Home-map backgrounds listed in assets-src/maps/map-prompts.json ("file" PNG ->
"out" WebP), scaled to 768 px wide. Opaque pictures, so no background removal.

Needs Python 3 + Pillow. Run from the repo root:
    py -I scripts/png-to-webp.py
Task 9 (optimise-images) may replace this with a Node script.
"""

import json
from pathlib import Path

from PIL import Image

WIDTH = 768


def main() -> None:
    spec = json.loads(Path("assets-src/maps/map-prompts.json").read_text(encoding="utf-8"))
    for entry in spec["maps"]:
        src, out = Path(entry["file"]), Path(entry["out"])
        if not src.exists():
            print(f"missing {src}")
            continue
        img = Image.open(src).convert("RGB")
        if img.width > WIDTH:
            img = img.resize((WIDTH, round(img.height * WIDTH / img.width)), Image.LANCZOS)
        out.parent.mkdir(parents=True, exist_ok=True)
        img.save(out, "WEBP", quality=72, method=6)
        print(f"{out}  {img.width}x{img.height}  {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
