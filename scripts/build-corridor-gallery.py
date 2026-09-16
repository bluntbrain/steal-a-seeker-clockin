from pathlib import Path
import json,html
r=Path(__file__).resolve().parents[1]
levels=json.loads((r/'verification/corridors/levels.json').read_text())
metrics=json.loads((r/'verification/corridors/geometry.json').read_text())
notes=['A framed route for the guided first heist.','Two crossings and a protected entry pocket.','Offset cargo aisles break long sight lines.','A winding return through loading lanes.','Three rooftop lanes joined by short bridges.','Circle the machinery around the Heavy.','Two routes around the split spine.','Two phone bays. One health pool.','Reach the switch to open the sealed vault.','Two loops lead to a timed exit.','Three corners break the approach into stages.','Flank the Warden through the side openings.']
def diagram(l):
 d=(l['number']-1)//4;top=['#344149','#789498','#35465C'][d];floor=['#263938','#344E64','#69776E'][d]
 v=[f'<rect width="12" height="20" fill="{floor}"/>']
 for b in l['blockers']:
  x,y,w,h=b['x'],b['y'],b['w'],b['h'];color='#51645F' if b['kind']=='crate' else top
  v.append(f'<rect x="{x+.06}" y="{y+.1}" width="{w}" height="{h}" rx=".1" fill="#263A3450"/><rect x="{x}" y="{y}" width="{w}" height="{h}" rx=".08" fill="{color}" stroke="#355446" stroke-width=".06"/>')
 e=l['exit'];v.append(f'<rect x="{e["x"]}" y="{e["y"]}" width="{e["w"]}" height="{e["h"]}" rx=".1" fill="#306D50"/>')
 for g in l['patrols']:
  p=g['route'][0]
  if 'reserveAfter' not in g:v.append(f'<circle cx="{p["x"]}" cy="{p["y"]}" r=".25" fill="#203840" stroke="#E6EBDF" stroke-width=".09"/>')
 for p in l.get('targets',[l['phone']]):v.append(f'<rect x="{p["x"]-.17}" y="{p["y"]-.3}" width=".34" height=".6" rx=".05" fill="#111D1B" stroke="#E4FFEF" stroke-width=".07"/>')
 for sw in l.get('switches',[]):v.append(f'<circle cx="{sw["x"]}" cy="{sw["y"]}" r=".28" fill="#EAAC3D"/>')
 for g in l.get('gates',[]):
  b=g['box'];v.append(f'<rect x="{b["x"]}" y="{b["y"]}" width="{b["w"]}" height="{b["h"]}" fill="#BFAA58"/>')
 p=l['spawn'];v.append(f'<circle cx="{p["x"]}" cy="{p["y"]}" r=".3" fill="#F8FAED" stroke="#416554" stroke-width=".08"/>')
 return '<svg viewBox="0 0 12 20" aria-label="Collision layout diagram">'+''.join(v)+'</svg>'
cards=[]
for i,l in enumerate(levels):
 url='/?build=corridors&testMission='+l['mission'];n=sum('reserveAfter' not in g for g in l['patrols']);cards.append(f'<article><a class="map" href="{url}">{diagram(l)}</a><div class="body"><small>{i+1:02d} / {metrics[i]["blockedPercent"]}% solid cover</small><h2>{html.escape(l["title"])}</h2><p>{notes[i]}</p><a class="button" href="{url}">Play mission {i+1} →</a></div></article>')
out=r/'design/visual-v2/combat/corridors';out.mkdir(parents=True,exist_ok=True)
page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Steal a Seeker · Corridor maps</title><style>*{box-sizing:border-box}body{margin:0;background:#0c1110;color:#e8f4ed;font:16px/1.5 system-ui}main{max-width:1120px;margin:auto;padding:36px 20px}header{max-width:750px;margin-bottom:32px}h1{font-size:clamp(32px,6vw,62px);line-height:1.05;margin:16px 0;letter-spacing:-2px}h2{font-size:21px;margin:7px 0}p{color:#b1c5b8}a{color:#bfecd4}.eyebrow,small{color:#9dc1ac;font-size:12px;letter-spacing:1px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}article{border:1px solid #334b40;border-radius:16px;overflow:hidden;background:#152019}.map{display:block;padding:10px;background:#26392d}svg{display:block;width:100%;height:300px}.body{padding:16px}.body p{font-size:14px;min-height:62px}.button{display:block;padding:10px;border-radius:9px;background:#cae9d7;color:#1b3e2b;text-align:center;text-decoration:none;font-weight:750;font-size:14px}.note{border-left:3px solid #bbce95;padding-left:14px}footer{margin-top:30px;color:#8ba998;font-size:13px}@media(max-width:900px){.grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:650px){.grid{grid-template-columns:repeat(2,1fr)}svg{height:250px}}@media(max-width:380px){.grid{grid-template-columns:1fr}}</style><main><header><span class="eyebrow">STEAL A SEEKER / PLAYABLE CORRIDOR MAPS</span><h1>Walls that change the route.</h1><p>More walls and tighter passages, with the existing game colors and materials. Twelve different routes through Warehouse, Rooftops and Powerworks.</p><p class="note">These are layout diagrams. Open a mission to see the finished game art. Test links run locally, without payments or ranked attempts.</p><a href="/?build=corridors">Open the normal game →</a></header><div class="grid">'''+''.join(cards)+'''</div><footer>Reference: your supplied Hunter Assassin screenshot and <a href="https://www.youtube.com/watch?v=raDBMEIr6Uo">gameplay video</a>. Authored collision layouts using the existing game art. Current weekly competition keeps its frozen maps.</footer></main></html>'''
(out/'index.html').write_text(page);print('Built twelve-map playtest gallery')
