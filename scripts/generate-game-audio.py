"""Original SFX. Reads shared credentials privately; never persists credentials."""
from pathlib import Path
import json, urllib.request, os
root=Path(__file__).resolve().parents[1]
key=next(line.split('=',1)[1].strip().strip('\"').strip("'") for line in Path(os.environ.get('ELEVENLABS_CREDENTIALS_FILE','/Users/bluntbrain/.config/elevenlabs/credentials.env')).read_text().splitlines() if line.startswith('ELEVENLABS_API_KEY='))
cues=[('decoy',1.2,False,'A tiny metal sci-fi decoy puck lands with a soft clink then emits three playful electronic chirps. Isolated game sound, immediate attack, dry mix, no speech or music.'),('caught',1.4,False,'Friendly stealth game failure: short robot scanner zap followed by a comical low descending synth bloop. Not frightening. Isolated effect, immediate attack, no speech.'),('switch',0.6,False,'Single satisfying chunky mechanical relay switch clack with a tiny electrical spark. Isolated close-up game sound, dry, immediate attack, no ambience.'),('spot',0.7,False,'Short urgent robot detection double beep, distinct pitched electronic warning, immediate attack, soft not harsh, no speech or music.'),('extract',2.0,False,'Successful tiny sci-fi heist: mechanical docking click then a bright warm ascending three-note electronic reward chime with a short shimmering tail. Immediate attack, no voice.'),('purchase',1.1,False,'A satisfying futuristic equipment unlock: soft magnetic latch click, warm two-note electronic confirmation, tiny glass shimmer, dry game UI sound, immediate attack, no voice.'),('stealth-loop',12,True,'Seamless quiet stealth game background loop. Warm analog synth pulse, muted clockwork ticks, gentle sub bass and spacious ventilation hum. Playful suspense, sparse rhythmic texture, no melody or voices, no big impacts, constant volume.')]
for name,duration,loop,prompt in cues:
    out=root/'assets/audio'/f'{name}.mp3'
    if out.exists(): continue
    request=urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation',data=json.dumps(dict(text=prompt,duration_seconds=duration,loop=loop,model_id='eleven_text_to_sound_v2',prompt_influence=.5)).encode(),headers={'xi-api-key':key,'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(request,timeout=100) as response:
            data=response.read()
        out.write_bytes(data)
        print(name,len(data),flush=True)
    except Exception as error:
        print(name,type(error).__name__,getattr(error,'code',None),flush=True)
        if hasattr(error,'read'):
            info=json.loads(error.read()); detail=info.get('detail',{}); print(detail.get('status','') if isinstance(detail,dict) else 'request rejected',flush=True)
        raise SystemExit(1)
(root/'assets/audio/manifest.json').write_text(json.dumps([dict(name=n,duration=d,loop=l,prompt=p,provider='ElevenLabs',model='eleven_text_to_sound_v2') for n,d,l,p in cues],indent=2))
