"""Pack rendered frames into bounded 3072x1920 native-safe WebP atlases."""
from pathlib import Path
from PIL import Image, ImageDraw
import json,struct
ROOT=Path(__file__).resolve().parents[1]
source=Path('/tmp/seeker-model-renders')
names=['frost','graphite','tide','static','mist','orbit','pearl','circuit','relic','flux','archive','ghost']
contact=Image.new('RGB',(4*256,3*352),'#101A21');draw=ImageDraw.Draw(contact)
report=[]
for i,name in enumerate(names):
 atlas=Image.new('RGB',(3072,1920),'#101A21')
 for f in range(18):
  image=Image.open(source/name/f'{f:02}.png').convert('RGBA');assert image.size==(512,640)
  atlas.paste(image,((f%6)*512,(f//6)*640),image)
 output=ROOT/'assets/phone-turntables'/f'{name}.webp';atlas.save(output,quality=94,method=6)
 back=Image.open(source/name/'08.png').convert('RGBA');back.thumbnail((256,320));contact.paste(back,((i%4)*256,(i//4)*352),back);draw.text(((i%4)*256+16,(i//4)*352+326),name,fill='#CFE6E4')
 glb=(ROOT/'assets/phone-models'/f'{name}.glb').read_bytes();size=struct.unpack_from('<I',glb,12)[0];model=json.loads(glb[20:20+size]);nodes={n.get('name','') for n in model['nodes']}
 assert {'Seeker display','Main camera optical glass','Secondary camera optical glass','Lower sensor optical glass','Seed Vault security panel','Solana rear logo'}<=nodes
 assert model.get('images'),'Missing embedded display texture'
 report.append({'edition':name,'frames':18,'frameSize':[512,640],'atlasSize':atlas.size,'bytes':output.stat().st_size,'glbBytes':len(glb),'nodes':len(nodes)})
out=ROOT/'verification/seeker-hardware';out.mkdir(parents=True,exist_ok=True)
contact.save(out/'all-backs.jpg',quality=94);(out/'assets.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'editions':len(report),'views':216,'atlasBytes':sum(r['bytes'] for r in report)}))
