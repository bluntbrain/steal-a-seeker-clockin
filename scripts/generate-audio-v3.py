"""Generate original gameplay effects; credentials stay outside the project."""
from pathlib import Path
import json,urllib.request,urllib.error,subprocess,re
root=Path(__file__).resolve().parents[1]/'assets/audio-v3'
cues=json.loads((root/'manifest.json').read_text())
files=[Path('/Users/bluntbrain/.config/elevenlabs/credentials.env'),Path('/Users/bluntbrain/.config/elevenlabs/seeker-game.env')]
keys=[]
for path in files:
 if path.exists():
  for line in path.read_text().splitlines():
   if line.startswith('ELEVENLABS_API_KEY='):
    value=line.split('=',1)[1].strip().strip('"').strip("'")
    if value not in keys:keys.append(value)
if not keys:raise SystemExit('Missing local ElevenLabs credentials')
for cue in cues:
 out=root/(cue['name']+'.mp3')
 if not out.exists():
  for index,key in enumerate(keys):
   request=urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation',data=json.dumps(dict(text=cue['prompt'],duration_seconds=cue['duration'],loop=cue['loop'],model_id='eleven_text_to_sound_v2',prompt_influence=.65)).encode(),headers={'xi-api-key':key,'Content-Type':'application/json'})
   try:
    with urllib.request.urlopen(request,timeout=120) as response:data=response.read()
    out.write_bytes(data);print('Generated',cue['name'],len(data),flush=True);break
   except urllib.error.HTTPError as error:
    print('Provider HTTP',error.code,'for',cue['name'],flush=True)
    if error.code not in (401,402,403) or index==len(keys)-1:raise SystemExit('Generation stopped; no credential contents logged')
  else:raise SystemExit('Generation failed')
 info=subprocess.run(['ffmpeg','-hide_banner','-i',str(out),'-af','volumedetect','-f','null','-'],capture_output=True,text=True,check=True)
 peak=float(re.search(r'max_volume: ([-0-9.]+) dB',info.stderr)[1]);gain=-6-peak
 filters=f'highpass=f=65,lowpass=f=12000,volume={gain}dB'
 if not cue['loop']:filters+=f",afade=t=out:st={cue['duration']-.06}:d=0.06"
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(out),'-af',filters,'-t',str(cue['duration']),'-ar','44100','-ac','1','-c:a','pcm_s16le',str(root/(cue['name']+'.wav'))],check=True)
 cue.update(provider='ElevenLabs',model='eleven_text_to_sound_v2',runtimeFile=cue['name']+'.wav',gainDb=round(gain,3),sampleRate=44100,channels=1)
 (root/'manifest.json').write_text(json.dumps(cues,indent=2)+'\n')
