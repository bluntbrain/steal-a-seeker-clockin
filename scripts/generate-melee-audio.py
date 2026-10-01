"""Small deterministic synthesized knife cues; no network/credentials."""
import math,random,struct,wave
from pathlib import Path
out=Path(__file__).resolve().parent.parent/'assets/audio-melee-v1';out.mkdir(parents=True,exist_ok=True)
rate=24000
for k,duration in [('swing',.18),('swing-b',.16),('impact',.12),('clang',.32)]:
 rng=random.Random(k);last=0;samples=[]
 for i in range(int(rate*duration)):
  t=i/rate;u=t/duration;n=rng.uniform(-1,1);high=n-last;last=n
  if k.startswith('swing'): v=high*.32*math.sin(math.pi*u)**1.7+math.sin(2*math.pi*(800*t-1700*t*t))*.08*math.sin(math.pi*u)
  elif k=='impact':v=(n*.32+math.sin(2*math.pi*155*t)*.5)*math.exp(-t*42)*min(1,t*1600)
  else:v=sum(math.sin(2*math.pi*f*t)*a for f,a in [(1220,.24),(1947,.18),(3160,.1)])*math.exp(-t*13)*min(1,t*1200)
  samples.append(struct.pack('<h',int(max(-.9,min(.9,v))*32767)))
 with wave.open(str(out/(k+'.wav')),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(b''.join(samples))
