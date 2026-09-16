"""Remove only connected dark backdrop and unused margins from existing dioramas."""
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter
import json
root=Path(__file__).resolve().parents[1]
out=root/'assets/district-map'
out.mkdir(exist_ok=True)
metadata={}
for name in ('warehouse','rooftops','powerworks'):
    source=root/f'assets/world-v3/district-{name}.png'
    image=Image.open(source).convert('RGB')
    r,g,b=image.split()
    brightness=ImageChops.lighter(ImageChops.lighter(r,g),b)
    mask=brightness.point(lambda value:255 if value>26 else 0)
    for corner in ((0,0),(image.width-1,0),(0,image.height-1),(image.width-1,image.height-1)):
        ImageDraw.floodfill(mask,corner,128,thresh=0)
    alpha=mask.point(lambda value:0 if value==128 else 255)
    box=alpha.getbbox()
    box=(max(0,box[0]-12),max(0,box[1]-12),min(image.width,box[2]+12),min(image.height,box[3]+12))
    image.putalpha(alpha.filter(ImageFilter.GaussianBlur(.45)))
    image=image.crop(box)
    image.thumbnail((1200,1200),Image.Resampling.LANCZOS)
    image.save(out/f'{name}.png',optimize=True)
    metadata[name]={'source':str(source.relative_to(root)),'crop':box,'width':image.width,'height':image.height}
(out/'frames.json').write_text(json.dumps(metadata,indent=2)+'\n')
(out/'README.md').write_text('# District map artwork\n\nDerived from the existing GPT-generated `assets/world-v3/district-*.png` scenes. No new generation and no source overwrites. `scripts/prepare-district-map.py` removes the connected near-black outer backdrop, keeps dark interior details, and trims unused margins with padding. Each scene is uniformly scaled and fully contained by the UI; buildings are never stretched or cropped by the layout.\n\nThe numbered missions, route lines, completion stars and locks are real UI, not baked into these images. Source crops and final dimensions are in `frames.json`.\n')
print(json.dumps(metadata))
