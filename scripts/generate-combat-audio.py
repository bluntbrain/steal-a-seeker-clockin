"""Original, short game cues. Only reads the canonical private ElevenLabs key."""
from pathlib import Path
import json, urllib.request, urllib.error, subprocess, re, hashlib, array, wave, math, sys
ROOT=Path(__file__).resolve().parents[1]/'assets/audio-combat-v3'
ROOT.mkdir(exist_ok=True)
CUES=[
 ('shot-a',.55,'One compact suppressed sci-fi dart pistol shot. Dry punchy pop, tiny metal action click, very short airy tail. Immediate attack. Isolated mono game sound, no speech, no music.'),
 ('shot-b',.55,'One alternate compact suppressed dart pistol shot, a firm woody mechanical pop with a short spring click. Immediate attack, dry and tight, no echo, no music, no speech.'),
 ('enemy-a',.65,'One hostile robot carbine shot. Sharp crunchy metallic crack, compact low punch and short casing tick. Single shot, immediate attack, no music, no ambience, no voice.'),
 ('enemy-b',.65,'One heavy robot shotgun blast, stylized arcade mechanical thump and brittle metal snap, short clean tail. Single shot, immediate attack, dry, no speech or music.'),
 ('hit',.5,'One small bullet hit on hollow robot armor, crisp metallic clink with a tight crunchy impact. Immediate dry transient, no music, no voice, no background.'),
 ('damage',.65,'A short player damage impact, soft low body thud and sharp electronic shield crack, urgent but not harsh. Single immediate hit. No voice, no music, no long ringing.'),
 ('knockout',.9,'A small security robot powers down after an impact: short clanking collapse, quick descending electric chirp. Satisfying compact arcade defeat sound, no voice, no music, no explosion.'),
 ('aim',.55,'One brief two-note hostile targeting warning: muted electronic tick followed by a higher focused ping. Clear on phone speakers, concise and urgent, no harsh siren, no voice, no music.'),
 ('pickup',1.2,'A valuable futuristic phone is snatched from a magnetic security pedestal: crisp latch release, bright glassy reward ping, followed by a short low security activation pulse. No speech, no music.'),
 ('escape',1.8,'A successful arcade heist escape: mechanical exit latch swoosh then three warm ascending electronic reward notes. Short and satisfying, no voice, no drums, no background music.'),
 ('caught',1.2,'Arcade heist failed: brief low impact and two descending muted digital notes, restrained and quick so the player wants to retry. No voice, no music, no long cinematic boom.'),
 ('alarm',4,'Seamless loop of a restrained industrial security alarm, two soft low-mid electronic pulses followed by breathing space. Urgent stealth game atmosphere, clearly rhythmic, no loud wailing, no voices, no music.')]
key=None
for line in Path('/Users/bluntbrain/.config/elevenlabs/credentials.env').read_text().splitlines():
 if line.startswith('ELEVENLABS_API_KEY='):key=line.split('=',1)[1].strip().strip('"').strip("'")
if not key:raise SystemExit('Canonical ElevenLabs key missing')
manifest=[]
for name,duration,prompt in CUES:
 raw=ROOT/(name+'.mp3'); out=ROOT/(name+'.wav')
 if not raw.exists():
  req=urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation',data=json.dumps(dict(text=prompt,duration_seconds=max(2,duration),loop=name=='alarm',model_id='eleven_text_to_sound_v2',prompt_influence=.65)).encode(),headers={'xi-api-key':key,'Content-Type':'application/json'})
  try:
   with urllib.request.urlopen(req,timeout=100) as response:raw.write_bytes(response.read())
  except urllib.error.HTTPError as error:raise SystemExit(f'ElevenLabs HTTP {error.code}; stopped without logging credentials')
  print('Generated',name,flush=True)
 decoded=subprocess.run(['ffmpeg','-v','error','-i',str(raw),'-af','highpass=f=90,lowpass=f=10000','-ar','32000','-ac','1','-f','f32le','-'],capture_output=True,check=True).stdout
 samples=array.array('f');samples.frombytes(decoded)
 if sys.byteorder!='little':samples.byteswap()
 peak=max(abs(v) for v in samples)
 if peak<1e-7:raise SystemExit('Generated cue is silent: '+name)
 onset=0 if name=='alarm' else max(0,next(i for i,v in enumerate(samples) if abs(v)>peak*.035)-160)
 count=round(duration*32000);selected=list(samples[onset:onset+count]);selected+=[0.]*(count-len(selected))
 for i in range(min(160,count)):selected[i]*=i/160
 for i in range(min(640,count)):selected[-i-1]*=i/640
 selected_peak=max(abs(v) for v in selected)
 gain=10**(-6/20)/selected_peak
 pcm=array.array('h',(round(v*gain*32767) for v in selected))
 if sys.byteorder!='little':pcm.byteswap()
 with wave.open(str(out),'wb') as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(32000);f.writeframes(pcm.tobytes())
 manifest.append(dict(name=name,prompt=prompt,provider='ElevenLabs',model='eleven_text_to_sound_v2',duration=duration,onsetSeconds=round(onset/32000,4),peakDb=-6,loop=name=='alarm',file=out.name,sha256=hashlib.sha256(out.read_bytes()).hexdigest()))
 (ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Finished',len(manifest),'original cues',flush=True)
