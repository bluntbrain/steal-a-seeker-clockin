"""Generate original instrumental level music; never stores the private API key."""
from pathlib import Path
import json, urllib.request, urllib.error, subprocess, hashlib, concurrent.futures, sys
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'assets/music-v1'
DEST.mkdir(exist_ok=True)
THEMES=[
 ('first-pickup','First Pickup',104,'A curious stealth opening: muted plucked strings, warm soft synth bass, dry woodblock pulse and a restrained rising minor-key figure. Light tension and a feeling of being clever, not horror.'),
 ('blind-corner','Blind Corner',110,'Cautious spy suspense: pizzicato cello, ticking rim percussion, two alternating low synth pulses, brief brushed cymbal swells. Pauses in the arrangement make corners feel dangerous.'),
 ('crossfire','Crossfire',116,'A nimble action thriller: syncopated low strings, compact electronic drums, short brass accents and a moving bass ostinato. Energetic tactical tension, not a wall of sound.'),
 ('loading-lockdown','Loading Lockdown',112,'Industrial night heist: muted metallic percussion, dark analog bass, bowed low strings, distant filtered brass. A pulsing warehouse engine and a clock running out.'),
 ('skybridge','Skybridge',118,'A rooftop chase at night: airy arpeggiated synths, a taut cello pulse, crisp restrained breakbeat percussion and a spacious low bass. High altitude suspense, agile rather than heavy.'),
 ('heavy-watch','Heavy Watch',108,'An armored sentry thriller: weighty low brass stabs, deliberate tom rhythm, tense tremolo strings, a dark pulsing synthesizer. Controlled menace and determination, no jump scares.'),
 ('split-route','Split Route',122,'A clever escape chase: interlocking mallet and synth rhythms, short staccato strings, light snare syncopation and a propulsive bass line. One repeating motif answers another.'),
 ('twin-relay','Twin Relay',120,'A two-stage rooftop heist: paired synth pulses, alternating pizzicato and bowed cello phrases, tight toms and restrained cymbals. The motif builds then returns to its starting tension.'),
 ('dark-circuit','Dark Circuit',106,'A power station infiltration: deep analog sequencer, distant metallic ticks, tense sustained viola, soft sub pulse. Electric unease with a clear steady groove and plenty of room for game sounds.'),
 ('vault-window','Vault Window',124,'A timed vault escape: clocklike high woodblock, low string ostinato, understated hybrid percussion, short rising brass figures. Urgency builds around a repeating countdown motif.'),
 ('security-grid','Security Grid',126,'A precise high-security thriller: interwoven arpeggios, clipped string runs, driving low toms and a tense minor bass pattern. Tight controlled energy, with distinct small rests.'),
 ('last-seeker','Last Seeker',128,'The final heist: a memorable original minor-key cello motif, restrained heroic low brass, layered pulsing synth and compact cinematic drums. A determined epic thriller climax, still suitable beneath gameplay.')]
base=('Compose an ORIGINAL instrumental background cue for a small top-down stealth action mobile game. '
      'No references to existing songs or artists. No vocals, speech, sound effects, gunshots, alarms or footsteps. '
      'Maintain a consistent groove for a seamless repeating gameplay loop. Begin in the groove immediately, '
      'no long intro, no final crash or fade to silence. Keep the last phrase harmonically compatible with the first. '
      'Leave the midrange open for footsteps, shots and targeting sounds. Moderate dynamics, dry close percussion, '
      'cinematic suspense without overwhelming orchestral loudness. ')
key=next((l.split('=',1)[1].strip().strip('"\'') for l in Path('/Users/bluntbrain/.config/elevenlabs/credentials.env').read_text().splitlines() if l.startswith('ELEVENLABS_API_KEY=')),None)
if not key: raise SystemExit('Shared ElevenLabs credential missing')
def build(item):
 i,(slug,title,bpm,theme)=item;name=f'{i:02d}-{slug}';raw=DEST/(name+'.mp3');out=DEST/(name+'.m4a');receipt=DEST/(name+'.json');prompt=base+f'Tempo about {bpm} BPM. '+theme
 metadata=dict(level=i,title=title,name=name,bpmDirection=bpm,prompt=prompt,provider='ElevenLabs',model='music_v1',requestedSeconds=40)
 if not raw.exists():
  request=urllib.request.Request('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128',data=json.dumps(dict(prompt=prompt,music_length_ms=40000,model_id='music_v1',force_instrumental=True,store_for_inpainting=False)).encode(),headers={'xi-api-key':key,'Content-Type':'application/json'})
  try:
   with urllib.request.urlopen(request,timeout=240) as r:
    raw.write_bytes(r.read());metadata['songId']=r.headers.get('song-id');metadata['requestId']=r.headers.get('request-id')
  except urllib.error.HTTPError as e:
   detail=json.loads(e.read()).get('detail',{})
   raise RuntimeError(f'Music generation {name}: HTTP {e.code}; {str(detail)[:350]}') from None
  receipt.write_text(json.dumps(metadata,indent=2)+'\n')
  print('Generated '+name,flush=True)
 else:
  metadata=json.loads(receipt.read_text()) if receipt.exists() else metadata
 # Form a circular 1s equal-power crossfade: middle, then tail blended into head.
 # The final sample leads into the original second second, with no silence padding.
 if not out.exists():
  subprocess.run(['ffmpeg','-v','error','-y','-i',str(raw),'-filter_complex',
   '[0:a]atrim=0:40,asetpts=PTS-STARTPTS,highpass=f=45,lowpass=f=11000,asplit=3[m][t][h];'
   '[m]atrim=1:39,asetpts=PTS-STARTPTS[mid];[t]atrim=39:40,asetpts=PTS-STARTPTS[tail];'
   '[h]atrim=0:1,asetpts=PTS-STARTPTS[head];[tail][head]acrossfade=d=1:c1=qsin:c2=qsin[seam];'
   '[mid][seam]concat=n=2:v=0:a=1,loudnorm=I=-21:TP=-3:LRA=6[out]',
   '-map','[out]','-ar','44100','-ac','2','-c:a','aac','-b:a','160k','-movflags','+faststart',str(out)],check=True)
 metadata.update(file=out.name,seconds=39,sha256=hashlib.sha256(out.read_bytes()).hexdigest(),bytes=out.stat().st_size,rawSha256=hashlib.sha256(raw.read_bytes()).hexdigest(),mix='-21 LUFS target, -3 dBTP ceiling; circular one-second equal-power crossfade')
 receipt.write_text(json.dumps(metadata,indent=2)+'\n')
 print('Ready '+name,flush=True)
 return metadata
items=list(enumerate(THEMES,1))
if '--one' in sys.argv:items=items[:1]
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:tracks=list(pool.map(build,items))
(DEST/'manifest.json').write_text(json.dumps(tracks,indent=2)+'\n')
print('Music ready:',len(tracks),flush=True)
