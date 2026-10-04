// Usage: node scripts/build-spy-music.cjs /private/path/to/original-mp3s
const {execFileSync}=require('child_process');
const path=require('path'),fs=require('fs'),crypto=require('crypto');
const source=process.argv[2];
if(!source)throw Error('Pass the private directory containing the two original MP3 masters.');
const target=path.resolve(__dirname,'../assets/music-spy-v2');
const filter='[0:a]loudnorm=I=-20:TP=-2:LRA=8,aresample=44100,asplit=3[body][tail][head];[body]atrim=start=1:end=59,asetpts=PTS-STARTPTS[b];[tail]atrim=start=59:end=60,asetpts=PTS-STARTPTS[t];[head]atrim=start=0:end=1,asetpts=PTS-STARTPTS[h];[t][h]acrossfade=d=1:c1=tri:c2=tri[s];[b][s]concat=n=2:v=0:a=1[out]';
const files=['01-vault-infiltration','02-midnight-pursuit'].map(name=>{
 const output=path.join(target,name+'.m4a');
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',path.join(source,name+'.mp3'),'-filter_complex',filter,'-map','[out]','-c:a','aac','-b:a','128k','-ar','44100','-movflags','+faststart',output]);
 const info=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration,size:stream=codec_name,sample_rate,channels','-of','json',output]));
 if(Math.abs(Number(info.format.duration)-59)>.05)throw Error(`Unexpected duration: ${name}`);
 return {file:path.basename(output),sha256:crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex'),...info};
});
fs.writeFileSync(path.join(target,'manifest.json'),JSON.stringify({provider:'ElevenLabs',model:'music_v1',normalization:{targetLufs:-20,targetTruePeak:-2,lra:8},seamCrossfadeSeconds:1,files},null,2)+'\n');
