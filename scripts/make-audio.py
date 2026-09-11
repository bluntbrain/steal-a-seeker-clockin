"""Original synthesized UI cues; no sampled or third-party audio."""
from pathlib import Path
import math,random,struct,wave
root=Path(__file__).resolve().parents[1]/'assets';sr=22050
for name,duration,notes in [('pickup',.28,[660,880]),('success',.72,[523.25,659.25,783.99,1046.5]),('dash',.17,[])]:
 random.seed(7);samples=[]
 for i in range(int(sr*duration)):
  t=i/sr
  if notes:
   segment=duration/len(notes);j=min(len(notes)-1,int(t/segment));local=t-j*segment;env=min(1,local/.008)*math.exp(-local*22);value=(math.sin(2*math.pi*notes[j]*local)+.2*math.sin(2*math.pi*notes[j]*2*local))*env*.17
  else:value=(random.random()*2-1)*math.sin(math.pi*t/duration)*.07+math.sin(2*math.pi*(180*t+500*t*t))*.04*(1-t/duration)
  samples.append(struct.pack('<h',int(max(-1,min(1,value))*32767)))
 with wave.open(str(root/(name+'.wav')),'wb')as out:out.setparams((1,2,sr,len(samples),'NONE','not compressed'));out.writeframes(b''.join(samples))
