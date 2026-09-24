from PIL import Image
from pathlib import Path
import json,base64,hashlib,argparse,math
root=Path(__file__).resolve().parents[1]/'assets/solana-skins'
parser=argparse.ArgumentParser(description='Pack generated alpha sheets without regenerating artwork.')
parser.add_argument('--only',nargs='+',help='Pack only these character stems; preserve all other atlases.')
args=parser.parse_args()
manifest=json.loads((root/'packing.json').read_text()) if args.only else {}
paths=sorted((root/'source').glob('*.png'))
if args.only:
 missing=set(args.only)-{p.stem for p in paths}
 if missing:raise ValueError(f'Missing source sheets: {sorted(missing)}')
 paths=[p for p in paths if p.stem in args.only]
for path in paths:
 im=Image.open(path).convert('RGBA')
 if im.getchannel('A').getextrema()[0]!=0:raise ValueError(f'{path.name}: source must have real transparent alpha')
 m=im.getchannel('A').resize((362,272));sx=im.width/362;sy=im.height/272;pix=m.load();seen=set();comps=[]
 for y in range(272):
  for x in range(362):
   if (x,y) in seen or pix[x,y]<128:continue
   q=[(x,y)];seen.add((x,y));xmin=xmax=x;ymin=ymax=y;n=0
   while q:
    a,b=q.pop();n+=1;xmin=min(xmin,a);xmax=max(xmax,a);ymin=min(ymin,b);ymax=max(ymax,b)
    for c,d in ((a-1,b),(a+1,b),(a,b-1),(a,b+1)):
     if 0<=c<362 and 0<=d<272 and (c,d) not in seen and pix[c,d]>=128:seen.add((c,d));q.append((c,d))
   if n>200:comps.append((n,(max(0,math.floor(xmin*sx)-4),max(0,math.floor(ymin*sy)-4),min(im.width,math.ceil((xmax+1)*sx)+4),min(im.height,math.ceil((ymax+1)*sy)+4))))
 if len(comps)!=8:raise ValueError(f'{path.name}: expected eight separate poses, found {len(comps)}')
 boxes=[c[1] for c in sorted(comps,reverse=True)[:8]]
 boxes=sorted(sorted(boxes,key=lambda b:b[1])[:4],key=lambda b:b[0])+sorted(sorted(boxes,key=lambda b:b[1])[4:],key=lambda b:b[0])
 atlas=Image.new('RGBA',(1024,768));frames=[]
 for i,box in enumerate(boxes):
  cell=im.crop(box);scale=min(228/cell.width,348/cell.height);cell=cell.resize((round(cell.width*scale),round(cell.height*scale)),Image.Resampling.LANCZOS)
  x=(i%4)*256+(256-cell.width)//2;y=(i//4)*384+376-cell.height
  atlas.alpha_composite(cell,(x,y));frames.append(box)
 atlas.save(root/f'{path.stem}-atlas.png',optimize=True)
 atlas.crop((0,0,256,384)).save(root/f'{path.stem}.png',optimize=True)
 manifest[path.stem]={'source':f'source/{path.name}','sourceBounds':frames,'atlas':[1024,768],'cell':[256,384],'order':['front','left','back','right','front-walk','left-walk','back-walk','right-walk']}
(root/'packing.json').write_text(json.dumps(manifest,indent=2)+'\n')
names=list(manifest)
contact=Image.new('RGB',(256*len(names),384),'#14201f')
for i,name in enumerate(names):
 p=root/f'{name}-atlas.png'
 im=Image.open(p).crop((0,0,256,384));contact.paste(im,(i*256,0),im)
contact.save(root/'portraits-preview.jpg',quality=90)

portraits={f'solana-{n}':'data:image/png;base64,'+base64.b64encode((root/f'{n}.png').read_bytes()).decode() for n in names}
(root/'portraits.embedded.json').write_text(json.dumps(portraits,separators=(',',':'))+'\n')
entries=[{'name':f'solana-{n}','file':f'{n}-atlas.png','frames':8,'sha256':hashlib.sha256((root/f'{n}-atlas.png').read_bytes()).hexdigest()} for n in names]
(root/'manifest.json').write_text(json.dumps(entries,indent=2)+'\n')
