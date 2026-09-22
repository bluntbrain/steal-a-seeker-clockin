"""Original short ascending combo cue. No network calls or external recordings."""
import hashlib
import json
import math
from pathlib import Path
import struct
import wave

root = Path(__file__).resolve().parents[1] / 'assets/audio-combos'
root.mkdir(exist_ok=True)
sr = 32000
samples = []
for i in range(int(sr * .38)):
    t, value = i / sr, 0
    for at, frequency in [(0, 880), (.075, 1108.73), (.15, 1318.51)]:
        u = t - at
        if 0 <= u < .22:
            envelope = min(1, u / .002) * math.exp(-u * 22) * min(1, (.22 - u) / .025)
            value += envelope * (math.sin(2 * math.pi * frequency * u) + .2 * math.sin(2 * math.pi * frequency * 2 * u))
    samples.append(value)
peak = max(map(abs, samples))
pcm = b''.join(struct.pack('<h', round(v / peak * 16383)) for v in samples)
path = root / 'clean-chain.wav'
with wave.open(str(path), 'wb') as wav:
    wav.setnchannels(1)
    wav.setsampwidth(2)
    wav.setframerate(sr)
    wav.writeframes(pcm)
(root / 'manifest.json').write_text(json.dumps(dict(file=path.name,
    source='Original procedural ascending three-tone cue', sampleRate=sr, duration=.38,
    peakDbFS=-6, notesHz=[880, 1108.73, 1318.51],
    sha256=hashlib.sha256(path.read_bytes()).hexdigest()), indent=2) + '\n')
