"""Generate original firing cues; credentials stay outside the repository."""
import array
import hashlib
import json
import math
from pathlib import Path
import subprocess
import sys
import urllib.error
import urllib.request
import wave

ROOT = Path(__file__).resolve().parents[1] / 'assets/audio-shots-v5'
ROOT.mkdir(exist_ok=True)
key = next(line.split('=', 1)[1].strip().strip('"\'') for line in
           Path('/Users/bluntbrain/.config/elevenlabs/credentials.env').read_text().splitlines()
           if line.startswith('ELEVENLABS_API_KEY='))
manifest = []
for name, detail in [
    ('shot-a', 'A real unsuppressed 9mm pistol firing a single round. Explosive sharp crack, weighty low-mid punch, subtle mechanical slide action.'),
    ('shot-b', 'A second take of a real unsuppressed 9mm pistol firing one round. Clean punchy ballistic crack, body and tiny slide clack.'),
    ('enemy-a', 'A real compact carbine firing one round. Hard percussive rifle crack with a solid chesty thump and brief natural room reflection.'),
    ('enemy-b', 'A real heavy rifle firing exactly one round. Deep powerful gunpowder bang under a sharp high-frequency crack; brief mechanical bolt sound.'),
]:
    prompt = ('Professional firearm sound for an action game. ' + detail +
              ' Close microphone, immediate explosive attack, short natural decay. Exactly one shot.'
              ' No burst, silencer, laser, electronic tone, ricochet, shell bounce, music, voices or ambience.')
    if len(prompt) > 450:
        raise SystemExit('Prompt exceeds the provider limit')
    raw = ROOT / (name + '-source.mp3')
    out = ROOT / (name + '.wav')
    if not raw.exists():
        request = urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation',
            data=json.dumps(dict(text=prompt, duration_seconds=1.2, loop=False,
                                 model_id='eleven_text_to_sound_v2', prompt_influence=.8)).encode(),
            headers={'xi-api-key': key, 'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                raw.write_bytes(response.read())
        except urllib.error.HTTPError as error:
            detail = error.read().decode('utf-8', errors='replace').replace(key, '[REDACTED]')[:700]
            raise SystemExit(f'Sound generation failed: HTTP {error.code}: {detail}')
    decoded = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(raw), '-af',
        'highpass=f=55,lowpass=f=14000', '-ar', '44100', '-ac', '1', '-f', 'f32le', '-'],
        capture_output=True, check=True).stdout
    samples = array.array('f')
    samples.frombytes(decoded)
    if sys.byteorder != 'little':
        samples.byteswap()
    peak = max(abs(v) for v in samples)
    if peak < 1e-6:
        raise SystemExit('Silent generated sound: ' + name)
    # Preserve the attack with 1 ms of pre-roll and only a 0.25 ms fade-in.
    onset = max(0, next(i for i, v in enumerate(samples) if abs(v) > peak * .025) - 44)
    count = 18522  # 420 ms: retain the report body and a short room tail.
    selected = list(samples[onset:onset + count])
    selected += [0.] * (count - len(selected))
    for i in range(11):
        selected[i] *= i / 11
    for i in range(2646):
        selected[-i - 1] *= i / 2646
    gain = 10 ** (-4 / 20) / max(abs(v) for v in selected)
    pcm = array.array('h', (round(v * gain * 32767) for v in selected))
    rms = math.sqrt(sum((v / 32768) ** 2 for v in pcm) / len(pcm))
    if sys.byteorder != 'little':
        pcm.byteswap()
    with wave.open(str(out), 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(44100)
        wav.writeframes(pcm.tobytes())
    manifest.append(dict(file=out.name, prompt=prompt, provider='ElevenLabs',
        model='eleven_text_to_sound_v2', durationSeconds=.42, sourceOnsetSeconds=onset / 44100,
        peakDbFS=-4, rmsDbFS=round(20 * math.log10(rms), 2),
        sha256=hashlib.sha256(out.read_bytes()).hexdigest()))
    print('Ready:', out.name, flush=True)
(ROOT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
