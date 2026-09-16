from pathlib import Path
import json,html,shutil,wave,math,array
root=Path(__file__).resolve().parents[1]
out=root/'design/visual-v2/combat/playtest';out.mkdir(parents=True,exist_ok=True)
levels=json.loads((root/'verification/difficulty/levels.json').read_text())
results={r['id']:r for r in json.loads((root/'verification/difficulty/level-audit.json').read_text())}
lessons=['Learn movement, aiming and escape.','Go around the long elbow. Ambush a guard from behind.','Clear one firing lane before crossing the middle.','An S-shaped return route fills with reinforcements.','Three roof lanes. Guards can intercept the middle bridge.','Circle the machinery. Do not trade hits with the Heavy.','Choose either side; both have a different patrol rhythm.','Two phones. Keep enough health for the second trip.','Reach the switch, open the vault, then retrace your route.','A three-second extraction window makes timing matter.','Three staggered barriers and nine possible enemies.','Choose a flank around the Warden; the return path is guarded.']
def svg(l):
 shapes=['<rect width="12" height="20" fill="'+l['floorColor']+'"/>']
 for x in range(13):shapes.append(f'<path d="M{x} 0V20" stroke="#9cb5b018" stroke-width=".025"/>')
 for y in range(21):shapes.append(f'<path d="M0 {y}H12" stroke="#9cb5b018" stroke-width=".025"/>')
 for b in l['blockers']:shapes.append(f'<rect x="{b["x"]}" y="{b["y"]}" width="{b["w"]}" height="{b["h"]}" rx=".08" fill="#152329" stroke="#698281" stroke-width=".06"/>')
 for g in l['patrols']:
  route=g['route'];pts=' '.join(f'{p["x"]},{p["y"]}' for p in route);p=route[0]
  color='#fbab70' if 'reserveAfter' in g else '#f0786c'
  shapes.append(f'<polyline points="{pts}" fill="none" stroke="{color}" stroke-width=".08" stroke-dasharray=".18 .15"/><circle cx="{p["x"]}" cy="{p["y"]}" r=".26" fill="{color}"/>')
 for p in l.get('targets',[l['phone']]):shapes.append(f'<rect x="{p["x"]-.22}" y="{p["y"]-.38}" width=".44" height=".76" rx=".09" fill="#d5fff0" stroke="#79f7c2" stroke-width=".1"/>')
 e=l['exit'];shapes.append(f'<rect x="{e["x"]}" y="{e["y"]}" width="{e["w"]}" height="{e["h"]}" rx=".1" fill="#84eec780"/>')
 p=l['spawn'];shapes.append(f'<circle cx="{p["x"]}" cy="{p["y"]}" r=".3" fill="#f5f8ef"/>')
 for p in l.get('switches',[]):shapes.append(f'<circle cx="{p["x"]}" cy="{p["y"]}" r=".3" fill="#ffdf89"/>')
 return '<svg viewBox="0 0 12 20" aria-label="Mission layout">'+''.join(shapes)+'</svg>'
cards=[]
for i,l in enumerate(levels):
 r=results[l['mission']]
 cards.append(f'<article><a class="map" href="/?build=tactical-v3&testMission={l["mission"]}">{svg(l)}</a><div class="body"><small>{i+1:02d} / {r["guards"]} guards + {r["reserves"]} reserves</small><h2>{html.escape(l["title"])}</h2><p>{lessons[i]}</p><a class="button" href="/?build=tactical-v3&testMission={l["mission"]}">Test mission {i+1} →</a></div></article>')
audio=[];audit=[]
(out/'audio').mkdir(exist_ok=True)
for cue in json.loads((root/'assets/audio-combat-v3/manifest.json').read_text()):
 src=root/'assets/audio-combat-v3'/cue['file'];shutil.copy2(src,out/'audio'/cue['file'])
 with wave.open(str(src)) as f:
  data=array.array('h');data.frombytes(f.readframes(f.getnframes()));duration=len(data)/f.getframerate();peak=max(abs(x) for x in data)/32768;rms=math.sqrt(sum((x/32768)**2 for x in data)/len(data))
 if not(.45<duration<5) or peak>.502 or rms<.0001:raise SystemExit('Invalid cue '+cue['name'])
 audit.append({'file':cue['file'],'seconds':round(duration,3),'peakDb':round(20*math.log10(peak),2),'rmsDb':round(20*math.log10(rms),2)})
 audio.append(f'<div class="sound"><strong>{cue["name"].replace("-"," ").title()}</strong><small>{cue["duration"]}s · original ElevenLabs effect</small><button class="sound-play" data-sound="audio/{cue["file"]}" aria-label="Play {cue["name"]}">Play sound</button><a class="download" href="audio/{cue["file"]}" download>Download WAV</a></div>')
(root/'verification/difficulty/audio.json').write_text(json.dumps(audit,indent=2)+'\n')
page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Steal a Seeker · Combat playtest</title><style>*{box-sizing:border-box}body{margin:0;background:#0c1012;color:#e7f3ed;font:16px/1.5 system-ui}main{max-width:1180px;margin:auto;padding:40px 22px}header{max-width:770px;padding:20px 0 30px}h1{font-size:clamp(36px,6vw,64px);line-height:1.04;letter-spacing:-2px;margin:16px 0}h2{font-size:21px;margin:8px 0}p{color:#b3c5c4}a{color:#bbecda}small{display:block;color:#a3c5bd;font-size:12px}.tag{font-size:12px;letter-spacing:2px;color:#9bf1cb}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}article,.sound{border:1px solid #314442;border-radius:16px;overflow:hidden;background:#142021}.map{display:block;background:#17252b;padding:12px}svg{width:100%;height:280px}.body{padding:16px}.body p{font-size:14px;min-height:65px}.button{display:block;background:#ceeae1;color:#143332;padding:11px;text-align:center;border-radius:9px;text-decoration:none;font-size:14px;font-weight:700}.sounds{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.sound{padding:16px}.sound-play{display:block;width:100%;border:0;border-radius:8px;background:#ceeae1;color:#143332;margin:12px 0 8px;padding:10px;font:600 14px system-ui;cursor:pointer}.download{font-size:12px}section{margin:48px 0}li{margin:8px 0;color:#b3c5c4}.note{border-left:3px solid #edbd78;padding:12px 18px;background:#1e241f}footer{color:#8aaba2;font-size:13px}@media(max-width:900px){.grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:650px){.grid,.sounds{grid-template-columns:repeat(2,1fr)}svg{height:240px}.body{padding:12px}.body p{min-height:85px}}@media(max-width:380px){.grid,.sounds{grid-template-columns:1fr}}</style><main><header><span class="tag">STEAL A SEEKER / COMBAT V3</span><h1>Test the twelve heists.</h1><p>Tap the floor to move. Tap a guard to shoot. Break the red aim line with cover. Take the phone, then escape the pursuit.</p><p class="note">Local browser tests only. No wallet payment or ranked attempt. These map previews are diagrams; each button opens the actual game.</p><a href="/?build=tactical-v3">Open the normal game →</a></header><div class="grid">'''+''.join(cards)+'''</div><section><h2>What changed</h2><ul><li>Faster movement: 4.1 tiles/s, or 3.15 carrying the phone.</li><li>Alarm pursuit: guards move at 2× patrol speed, increasing to 2.35×. They receive spaced location reports and still route around cover.</li><li>Surviving guards return fire when hit. A clean shot from behind does double damage before the alarm.</li><li>Longer patrols, overlapping firing lanes, and marked reinforcements. No surprise spawning on the courier.</li><li>The training mission keeps its slower teaching pace. Outfits do not change combat strength.</li></ul></section><section><h2>Compare the sound effects</h2><p>12 original cues. Short attacks, two weapon variations, distinct armor-hit and player-damage sounds. The in-game mix plays warnings above the quiet alarm bed.</p><div class="sounds">'''+''.join(audio)+'''</div></section><section><h2>Reference and limits</h2><p><a href="https://www.youtube.com/watch?v=raDBMEIr6Uo">Hunter Assassin gameplay reference</a>: sampled visuals show compact corridors, sight cones, quick close-range attacks and brief result screens. Our dart shooting, phone theft and extraction remain different mechanics. The soundtrack could not be reliably auditioned through the available tools; these sounds are not claimed to match it.</p><p>Automated dodging/route-selection tests can finish every room. Blind rushing fails in most later rooms. Neither result proves human difficulty or fun. Try missions 2, 4, 8 and 12 and note whether each death is understandable.</p></section><footer>16 September 2026 · Original game layouts and sound assets · Mainnet pricing unchanged</footer></main><script>
let context,active,activeButton,epoch=0;
function stop(){epoch++;if(active){try{active.stop()}catch{}active=null}if(activeButton){activeButton.textContent='Play sound';activeButton=null}}
for(const button of document.querySelectorAll('[data-sound]'))button.addEventListener('click',async()=>{
 const same=activeButton===button;stop();if(same)return;const generation=epoch;
 activeButton=button;button.textContent='Loading…';
 try{context??=new AudioContext();await context.resume();const response=await fetch(button.dataset.sound);if(!response.ok)throw Error('Missing sound');
 const buffer=await context.decodeAudioData(await response.arrayBuffer());if(generation!==epoch)return;
 const source=context.createBufferSource();source.buffer=buffer;source.connect(context.destination);active=source;button.textContent='Stop';
 source.onended=()=>{if(active===source){active=null;activeButton=null;button.textContent='Play sound'}};source.start();
 }catch{if(generation===epoch){activeButton=null;button.textContent='Use Download WAV'}}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});window.addEventListener('pagehide',stop);
</script></html>'''
(out/'index.html').write_text(page)
print('Built combat playtest gallery and validated',len(audit),'audio cues')
