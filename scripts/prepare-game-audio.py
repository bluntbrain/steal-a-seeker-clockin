from pathlib import Path
import subprocess,json,re
root=Path(__file__).resolve().parents[1]/'assets/audio'
manifest=json.loads((root/'manifest.json').read_text())
for cue in manifest:
    source=root/(cue['name']+'.mp3');out=root/(cue['name']+'.wav')
    info=subprocess.run(['ffmpeg','-hide_banner','-i',str(source),'-af','volumedetect','-f','null','-'],capture_output=True,text=True,check=True)
    peak=float(re.search(r'max_volume: ([-0-9.]+) dB',info.stderr)[1]);gain=-6-peak
    filters=f'highpass=f=45,volume={gain}dB'
    if not cue['loop']:filters+=f",afade=t=out:st={max(.1,cue['duration']-.045)}:d=0.045"
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(source),'-af',filters,'-t',str(cue['duration']),'-ar','22050','-ac','1','-c:a','pcm_s16le',str(out)],check=True)
    cue['runtimeFile']=out.name;cue['gainDb']=round(gain,3);cue['sampleRate']=22050;cue['channels']=1
    print(cue['name'],out.stat().st_size)
(root/'manifest.json').write_text(json.dumps(manifest,indent=2))
