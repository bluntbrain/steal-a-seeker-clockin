"""Remove generation matte, normalize sprite baselines, and derive shared portraits."""
from pathlib import Path
import base64, hashlib, json
import numpy as np
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'output/imagegen/costumes-v4'
DEST=ROOT/'assets/costumes-v4'
NAMES=['default','frost-runner','night-courier','circuit-scout','archive-keeper','ghost-signal']
DEST.mkdir(exist_ok=True)
manifest=[]; embedded={}
for name in NAMES:
    file=SOURCE/(name+'-sheet.png')
    if not file.exists():
        print('Waiting for',name); continue
    im=Image.open(file).convert('RGBA')
    rgb=np.array(im).astype(float)
    strength=np.clip((np.minimum(rgb[:,:,0],rgb[:,:,2])-rgb[:,:,1]-75)/80,0,1)
    strength*=np.clip((np.minimum(rgb[:,:,0],rgb[:,:,2])-140)/40,0,1)
    # Remove dark magenta fringe as well, while preserving the blue-violet Ghost charm.
    minimum=np.minimum(rgb[:,:,0],rgb[:,:,2])
    matte=(minimum-rgb[:,:,1]>16)&(minimum>rgb[:,:,1]*1.65+8)&(np.abs(rgb[:,:,0]-rgb[:,:,2])<minimum*.25+12)
    strength=np.where(matte,1,strength)
    rgb[:,:,3]*=1-strength
    edge=(strength>0)&(strength<1)
    for channel in [0,2]: rgb[:,:,channel]=np.where(edge,np.minimum(rgb[:,:,channel],rgb[:,:,1]+35),rgb[:,:,channel])
    im=Image.fromarray(rgb.clip(0,255).astype('uint8'))
    cells=[]; w,h=im.size
    for i in range(8):
        cell=im.crop((i%4*w//4,i//4*h//2,(i%4+1)*w//4,(i//4+1)*h//2))
        bounds=cell.getchannel('A').point(lambda x:255 if x>35 else 0).getbbox()
        if not bounds: raise SystemExit(f'Empty {name} frame {i}')
        if bounds[0]<3 or bounds[1]<3 or bounds[2]>cell.width-3 or bounds[3]>cell.height-3:
            raise SystemExit(f'Clipped source {name} frame {i}: {bounds}')
        cells.append(cell.crop(bounds))
    scale=min(230/max(c.width for c in cells),354/max(c.height for c in cells))
    atlas=Image.new('RGBA',(1024,768))
    for i,cell in enumerate(cells):
        sprite=cell.resize((round(cell.width*scale),round(cell.height*scale)),Image.Resampling.LANCZOS)
        atlas.alpha_composite(sprite,(i%4*256+(256-sprite.width)//2,i//4*384+375-sprite.height))
    atlas.save(DEST/(name+'-atlas.png'),optimize=True)
    front=cells[0]; scale=min(460/front.width,708/front.height)
    front=front.resize((round(front.width*scale),round(front.height*scale)),Image.Resampling.LANCZOS)
    portrait=Image.new('RGBA',(512,768));portrait.alpha_composite(front,((512-front.width)//2,750-front.height))
    portrait.save(DEST/(name+'.png'),optimize=True)
    portrait.resize((256,384),Image.Resampling.LANCZOS).save(DEST/(name+'.webp'),quality=90)
    embedded[name]='data:image/webp;base64,'+base64.b64encode((DEST/(name+'.webp')).read_bytes()).decode()
    manifest.append(dict(name=name,model='gpt-image-2',source=str(file.relative_to(ROOT)),
        reference=str((SOURCE/(name+'-reference.png')).relative_to(ROOT)),prompt=str((SOURCE/(name+'.prompt.txt')).relative_to(ROOT)),
        atlas=name+'-atlas.png',portrait=name+'.png',frames=8,frameWidth=256,frameHeight=384,
        sha256=hashlib.sha256((DEST/(name+'-atlas.png')).read_bytes()).hexdigest()))
    print('Prepared',name)
if len(manifest)!=6: raise SystemExit('All six generations are required')
(DEST/'portraits.embedded.json').write_text(json.dumps(embedded,separators=(',',':'))+'\n')
(DEST/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(DEST/'frames.json').write_text(json.dumps([dict(x=i%4*256,y=i//4*384,width=256,height=384) for i in range(8)],indent=2)+'\n')
contact=Image.new('RGB',(1056,1080),'#0C1012');d=ImageDraw.Draw(contact)
for i,name in enumerate(NAMES):
    p=Image.open(DEST/(name+'.png'));p.thumbnail((320,460))
    x=i%3*352+(352-p.width)//2;y=i//3*540+15
    contact.paste(p,(x,y),p)
    d.text((i%3*352+24,i//3*540+490),name.replace('-',' ').upper(),fill='#CFE6E4',font_size=21)
contact.save(DEST/'all-costumes.jpg',quality=92)
