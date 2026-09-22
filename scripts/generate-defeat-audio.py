"""Original short robot defeat cues. Reads credentials privately outside this repo."""
import hashlib,json,subprocess,urllib.request,urllib.error
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'assets/audio-defeats';root.mkdir(exist_ok=True)
key=next(l.split('=',1)[1].strip().strip('\"\'') for l in Path('/Users/bluntbrain/.config/elevenlabs/credentials.env').read_text().splitlines() if l.startswith('ELEVENLABS_API_KEY='))
cues=[('guard-a','A tight punchy metal snap, followed immediately by a small toy security robot tipping over with two dry metal clacks and a tiny pleasant ascending electronic pip.'),('guard-b','A crisp compressed armor crack, followed by a small security robot collapsing with a quick rattle and a short bright electronic chirp. Different from a gunshot.'),('heavy','A punchy low metallic armor crunch, then a heavy compact robot body landing with one satisfying thud and a very short metal rattle.'),('drone','A tiny security drone gets disabled: immediate sharp electric zap, a fast descending motor chirp, two bright sparks and one dry pop.')]
manifest=[]
for name,description in cues:
 raw=root/(name+'-source.mp3');out=root/(name+'.wav')
 prompt='One isolated arcade game defeat sound, less than one second, instant attack. '+description+' Playful and satisfying, dry close recording, clean transient, no speech, no screams, no music, no reverb, no long tail, no background ambience. All action completes within 0.7 seconds.'
 if not raw.exists():
  req=urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation',data=json.dumps(dict(text=prompt,duration_seconds=1,loop=False,model_id='eleven_text_to_sound_v2',prompt_influence=.7)).encode(),headers={'xi-api-key':key,'Content-Type':'application/json'})
  try:
   with urllib.request.urlopen(req,timeout=120) as response:raw.write_bytes(response.read())
  except urllib.error.HTTPError as e:raise SystemExit('Sound generation failed: HTTP '+str(e.code))
 subprocess.run(['ffmpeg','-y','-v','error','-i',str(raw),'-af','silenceremove=start_periods=1:start_duration=0.005:start_threshold=-42dB,loudnorm=I=-18:TP=-3:LRA=6,afade=t=out:st=0.62:d=0.16','-t','0.78','-ar','32000','-ac','1',str(out)],check=True)
 manifest.append(dict(file=out.name,prompt=prompt,provider='ElevenLabs',model='eleven_text_to_sound_v2',sha256=hashlib.sha256(out.read_bytes()).hexdigest()))
 print('Ready:',out.name,flush=True)
(root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
