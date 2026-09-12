"""Deterministic original game sound design; no external samples or credentials."""
from pathlib import Path
import math,random,struct,wave,json
root=Path(__file__).resolve().parents[1]/'assets/audio';root.mkdir(exist_ok=True)
sr=22050;rng=random.Random(27)
def tone(t,f,attack=.006,release=.15):
    if t<0:return 0
    return (1-math.exp(-t/attack))*math.exp(-t/release)*(math.sin(2*math.pi*f*t)+.15*math.sin(4*math.pi*f*t))
def save(name,duration,fn):
    data=[fn(i/sr) for i in range(round(sr*duration))]
    peak=max(.001,max(abs(v) for v in data));gain=.65/max(1,peak)
    data=[max(-1,min(1,v*gain))*min(1,(len(data)-i)/220) for i,v in enumerate(data)]
    with wave.open(str(root/(name+'.wav')),'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes(b''.join(struct.pack('<h',round(v*32767)) for v in data))
    print(name,duration)
save('decoy',1.1,lambda t:.6*tone(t,220,release=.04)+sum(.5*tone(t-d,1100+k*180,release=.065) for k,d in enumerate([.16,.34,.52])))
save('caught',1.2,lambda t:.6*math.sin(2*math.pi*(320*t-100*t*t))*math.exp(-t*4)+.2*tone(t,70,release=.4))
save('spot',.6,lambda t:.6*tone(t,920,release=.08)+.6*tone(t-.16,1220,release=.08))
save('switch',.45,lambda t:.7*(rng.random()*2-1)*math.exp(-t*65)+.4*tone(t,170,release=.08)+.3*tone(t-.08,660,release=.06))
save('extract',1.8,lambda t:sum(.4*tone(t-k*.13,f,release=.38) for k,f in enumerate([523.25,659.25,783.99,1046.5])))
save('purchase',1.0,lambda t:.4*tone(t,392,release=.2)+.45*tone(t-.13,587.33,release=.3)+.18*tone(t-.21,1174.66,release=.22))
# Frequencies are integer periods over the 12s loop; periodic envelopes wrap.
save('stealth-loop',12,lambda t:.13*math.sin(2*math.pi*55*t)+.09*math.sin(2*math.pi*110*t)*(0.5+0.5*math.cos(2*math.pi*t/6))+.10*tone(t%.5,220,release=.055)+.035*tone(t%.25,880,release=.025))
(root/'manifest.json').write_text(json.dumps({'provider':'local deterministic synthesis','sampleRate':sr,'channels':1,'source':'scripts/synthesize-game-audio.py','notes':'Original oscillator and seeded-noise effects. No copyrighted samples. ElevenLabs generation unavailable: payment_issue and supplied alternate key invalid.'},indent=2))
