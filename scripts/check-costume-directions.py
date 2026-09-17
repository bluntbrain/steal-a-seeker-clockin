"""Check the mint visor's side in the fixed 256x384 courier atlas cells.

This is deliberately specific to our six approved sheets. It checks pixels,
not frame names, so a generated right pose that actually faces left is rejected.
Requires Pillow, as does the asset preparation pipeline.
"""
from pathlib import Path
from PIL import Image


def check_directions(atlas, name):
    if atlas.size != (1024, 768):
        raise ValueError(f'{name}: unexpected atlas size {atlas.size}')
    results = []
    for frame in (1, 3, 5, 7):
        x, y = frame % 4 * 256, frame // 4 * 384
        head = atlas.crop((x, y, x + 256, y + 190)).convert('RGBA')
        xs = []
        for yy in range(head.height):
            for xx in range(head.width):
                r, g, b, alpha = head.getpixel((xx, yy))
                if alpha > 220 and g > r * 1.15 and g > b * 1.03 and g > 90 and b > r * 1.04:
                    xs.append(xx)
        if len(xs) < 100:
            raise ValueError(f'{name} frame {frame}: cannot reliably locate visor; inspect art')
        center = sum(xs) / len(xs)
        expected = 'left' if frame in (1, 5) else 'right'
        if (expected == 'left' and center >= 128) or (expected == 'right' and center <= 128):
            raise ValueError(f'{name} frame {frame}: visor faces the wrong way for {expected} (x={center:.1f})')
        results.append({'frame': frame, 'direction': expected, 'visorX': round(center, 1)})
    return results


if __name__ == '__main__':
    import json
    root = Path(__file__).resolve().parents[1] / 'assets/costumes-v4'
    results = {}
    for file in sorted(root.glob('*-atlas.png')):
        atlas = Image.open(file).convert('RGBA')
        results[file.stem] = check_directions(atlas, file.stem)
        # Negative control: detect this exact bug if any correct right frame is flipped.
        broken = atlas.copy()
        cell = atlas.crop((768, 0, 1024, 384)).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        broken.paste(cell, (768, 0))
        try:
            check_directions(broken, file.stem)
        except ValueError:
            pass
        else:
            raise AssertionError(f'{file.stem}: failed to detect deliberately reversed right frame')
    if len(results) != 6:
        raise AssertionError('Expected all six courier atlases')
    print(json.dumps(results, indent=2))
