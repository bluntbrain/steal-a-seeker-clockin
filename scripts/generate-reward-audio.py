"""Original in-game achievement cues. Secrets stay in the shared private config."""
import hashlib,json,subprocess,urllib.request,urllib.error
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'assets/audio-rewards'
key=next(l.split('=',1)[1].strip().strip('\"\'') for l in Path('/Users/bluntbrain/.config/elevenlabs/credentials.env').read_text().splitlines() if l.startswith('ELEVENLABS_API_KEY='))
cues=[('coin-collect',1.5,'Original mobile game reward collection sound. A short soft airy swoosh lifts a handful of small metal coins, then a tight ascending cascade of clean coin clinks drops into a pouch, ending in a warm delicate confirmation ping. Immediate start, coins arriving mainly in the second half, dry close sound, playful but restrained, no voice, no music, no heavy bass, no casino sounds. Exactly one brief collection action.')]
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
