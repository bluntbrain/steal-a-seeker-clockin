"""Original in-game achievement cues. Secrets stay in the shared private config."""
import hashlib,json,subprocess,urllib.request,urllib.error
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'assets/audio-milestones'
key=next(l.split('=',1)[1].strip().strip('\"\'') for l in Path('/Users/bluntbrain/.config/elevenlabs/credentials.env').read_text().splitlines() if l.startswith('ELEVENLABS_API_KEY='))
cues=[('campaign-complete',4.0,'Original premium stealth game campaign completion sound, four seconds. Immediate satisfying soft impact and mechanical vault unlock, bright rising three-note bell arpeggio resolving into a warm triumphant synth chord, delicate sparkling confetti ticks and a smooth short tail. Celebratory and earned, clean mobile speaker sound, no voices, no speech, no siren, no harsh bass, no clipping.'),('next-phone',1.2,'Short clean game objective discovery chime, two warm ascending glass notes and a tiny digital shimmer. One second, immediate start, gentle but clearly audible over game ambience. A new golden objective has appeared. No voice, no speech, no music bed, no alarm.')]
manifest=[]
for name,duration,prompt in cues:
    raw=root/(name+'-source.mp3');out=root/(name+'.wav')
    if not raw.exists():
        req=urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation',data=json.dumps(dict(text=prompt,duration_seconds=duration,loop=False,model_id='eleven_text_to_sound_v2',prompt_influence=.65)).encode(),headers={'xi-api-key':key,'Content-Type':'application/json'})
        try:
            with urllib.request.urlopen(req,timeout=120) as response: raw.write_bytes(response.read())
        except urllib.error.HTTPError as e: raise SystemExit('ElevenLabs request failed with HTTP '+str(e.code))
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(raw),'-af','loudnorm=I=-19:TP=-3:LRA=7,afade=t=out:st='+str(duration-.2)+':d=0.2','-t',str(duration),'-ar','32000','-ac','1',str(out)],check=True)
    manifest.append(dict(file=out.name,prompt=prompt,provider='ElevenLabs',model='eleven_text_to_sound_v2',duration=duration,sha256=hashlib.sha256(out.read_bytes()).hexdigest()))
    print('Ready:',out.name,flush=True)
(root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
