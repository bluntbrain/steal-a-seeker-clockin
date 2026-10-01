"""Generate reusable defeat coin cues. Credentials never enter the repository."""
import hashlib,json,subprocess,urllib.request,urllib.error
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'assets/audio-loot-v1'
root.mkdir(parents=True,exist_ok=True)
key=next(l.split('=',1)[1].strip().strip('\"\'') for l in Path('/Users/bluntbrain/.config/elevenlabs/credentials.env').read_text().splitlines() if l.startswith('ELEVENLABS_API_KEY='))
manifest=[]
for name,variation in [('coins-a','Five bright small gold coins spill with a crisp metallic clatter.'),('coins-b','A handful of six little metal coins scatter with a slightly lower, warmer clinking rattle.')]:
    prompt=variation+' Isolated arcade pickup, 1.15s. Instant pop and coin scatter in first 0.25s. Soft suction whoosh draws coins inward, rising metallic tinks at 0.65-0.95s, one gentle final ping. Dry close sound, crisp on phone speakers. No speech, music, ambience, gunshot, casino jackpot or long reverb.'
    raw=root/(name+'-source.mp3');out=root/(name+'.wav')
    if not raw.exists():
        req=urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation',data=json.dumps(dict(text=prompt,duration_seconds=1.15,loop=False,model_id='eleven_text_to_sound_v2',prompt_influence=.8)).encode(),headers={'xi-api-key':key,'Content-Type':'application/json'})
        try:
            with urllib.request.urlopen(req,timeout=120) as response:raw.write_bytes(response.read())
        except urllib.error.HTTPError as e:
            detail=e.read().decode('utf-8','replace').replace(key,'[redacted]')
            raise SystemExit('ElevenLabs generation failed: HTTP '+str(e.code)+' '+detail[:700])
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(raw),'-af','silenceremove=start_periods=1:start_duration=0.005:start_threshold=-45dB,highpass=f=180,lowpass=f=9000,loudnorm=I=-20:TP=-4:LRA=6,afade=t=out:st=1.02:d=0.13','-t','1.15','-ar','32000','-ac','1',str(out)],check=True)
    manifest.append(dict(file=out.name,prompt=prompt,provider='ElevenLabs',model='eleven_text_to_sound_v2',duration=1.15,sha256=hashlib.sha256(out.read_bytes()).hexdigest()))
    print('Ready:',out.name,flush=True)
(root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
