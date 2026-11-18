#!/usr/bin/env python3
"""Generate legacy and adaptive Android launcher icons from soft-stack-icon.png."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "soft-stack-icon.png"
RES = ROOT / "android/app/src/main/res"

# Android launcher bitmap sizes in px at mdpi-equivalent density buckets.
LEGACY = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

# Adaptive foregrounds use the 108dp adaptive-icon canvas and keep the full
# square artwork inside the safe zone so it remains visible under OEM masks.
ADAPTIVE = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}


def square_icon(image: Image.Image, size: int) -> Image.Image:
    return image.convert("RGBA").resize((size, size), Image.Resampling.LANCZOS)


def adaptive_foreground(image: Image.Image, size: int) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    artwork_size = round(size * 0.74)
    artwork = square_icon(image, artwork_size)
    offset = (size - artwork_size) // 2
    canvas.alpha_composite(artwork, (offset, offset))
    return canvas


def main() -> None:
    if not SOURCE.is_file():
        raise SystemExit(f"Missing icon source: {SOURCE}")
    image = Image.open(SOURCE)
    if image.width != image.height:
        raise SystemExit("Icon source must be square")

    for folder, size in LEGACY.items():
        target = RES / folder
        target.mkdir(parents=True, exist_ok=True)
        icon = square_icon(image, size)
        for name in ("ic_launcher.png", "ic_launcher_round.png"):
            icon.save(target / name, format="PNG", optimize=True)

    for folder, size in ADAPTIVE.items():
        target = RES / folder
        target.mkdir(parents=True, exist_ok=True)
        adaptive_foreground(image, size).save(
            target / "ic_launcher_foreground.png", format="PNG", optimize=True
        )


if __name__ == "__main__":
    main()
