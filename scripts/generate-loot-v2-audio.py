"""Generate the scatter, magnet and collection cues used by useLootAudio."""
import hashlib,json,subprocess,urllib.request,urllib.error
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'assets/audio-loot-v2'
key=next(l.split('=',1)[1].strip().strip('\"\'') for l in (Path.home()/'.config/elevenlabs/credentials.env').read_text().splitlines() if l.startswith('ELEVENLABS_API_KEY='))
cues=[('scatter',.32,'A small handful of gold coins bursts outward with an immediate bright metallic tik-clatter, three tiny impacts, all at the very beginning. Dry close arcade collectible sound, tactile and crisp on phone speakers, no long tail.'),('magnet',.38,'One very short soft air zip that accelerates and rises gently in pitch, like small coins being magnetically pulled through the air. Instant onset, smooth velvet swish ending in a tight stop. Light and satisfying, not loud or dramatic.'),('absorb',.18,'One single tiny gold coin collected: an immediate crisp rounded metallic plink with a warm little bright sparkle tail. Clean arcade reward sound, short and tactile. Not a melody, not a casino jackpot, no deep impact.')]
manifest=[]
for name,duration,description in cues:
 prompt=description+' Isolated sound effect. No voice, music, ambience, distortion, reverb, gunshot or explosion.'
 source=root/(name+'-source.mp3');out=root/(name+'.wav')
 if not source.exists():
  req=urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation',data=json.dumps(dict(text=prompt,duration_seconds=.6,loop=False,model_id='eleven_text_to_sound_v2',prompt_influence=.8)).encode(),headers={'xi-api-key':key,'Content-Type':'application/json'})
  try:
   with urllib.request.urlopen(req,timeout=120) as response:source.write_bytes(response.read())
  except urllib.error.HTTPError as e:raise SystemExit('ElevenLabs HTTP '+str(e.code)+' '+e.read().decode(errors='replace').replace(key,'[redacted]')[:400])
 subprocess.run(['ffmpeg','-y','-v','error','-i',str(source),'-af',f'silenceremove=start_periods=1:start_duration=0.003:start_threshold=-48dB,highpass=f=160,lowpass=f=8500,loudnorm=I=-21:TP=-5:LRA=5,afade=t=out:st={duration-.055}:d=0.055','-t',str(duration),'-ar','32000','-ac','1',str(out)],check=True)
 manifest.append(dict(file=out.name,prompt=prompt,provider='ElevenLabs',model='eleven_text_to_sound_v2',duration=duration,sha256=hashlib.sha256(out.read_bytes()).hexdigest()))
 print('Ready:',out.name,flush=True)
(root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
